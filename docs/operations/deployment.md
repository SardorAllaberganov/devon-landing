# Deployment Runbook

> **Audience:** the customer's DevOps / system engineer. This is **internal operations documentation** — unlike the README, landing page, and product spec (which deliberately carry no stack details), the operations runbook is the one place engineering specifics belong.
>
> **Source of truth for the stack:** the technical project document [`docs/Plyma 19.03.2026.docx`](../Plyma%2019.03.2026.docx) §4.1 (Laravel Stack). **Source of truth for the canonical ops facts** (backup cadence, uptime, performance targets): [`docs/product-specification.md`](../product-specification.md) §11 and §14. If anything here conflicts with those, **the source docs win** — fix the source first, then update this file.

Devon is **fully on-premise**. Nothing in this runbook should introduce a dependency on an external cloud service — that is a hard product constraint, not a preference. See [`product-specification.md`](../product-specification.md) §9.8 (Data sovereignty).

---

## 1. Architecture at a glance

Devon is a **Laravel 11 monolith** (PHP 8.3, Blade + Livewire 3 + Alpine.js) deployed as a set of Docker containers behind Nginx. There is no separate frontend service — UI and server logic ship together.

```
                         ┌─────────────────────────────────────────────┐
                         │              On-premise host(s)              │
   HTTPS (TLS 1.3)       │                                              │
  user ───────────────►  │  ┌────────┐    ┌──────────────────────────┐ │
                         │  │ nginx  │──► │  php-fpm  (Laravel app)   │ │
                         │  │ (TLS,  │    │  Blade + Livewire 3       │ │
                         │  │ revpx) │    └──────────────────────────┘ │
                         │  └────────┘             │                    │
                         │       │                 ▼                    │
                         │       │     ┌───────────────┬──────────────┐ │
                         │       │     │ postgresql 16 │   redis       │ │
                         │       │     │ (primary DB)  │ (session/     │ │
                         │       │     └───────────────┤  cache/queue) │ │
                         │       │                     └──────────────┘ │
                         │       │     ┌───────────────┐ ┌────────────┐ │
                         │       └───► │ minio (S3, ┄┄) │ │ meilisearch│ │
                         │             │ document files │ │ (search)   │ │
                         │             └───────────────┘ └────────────┘ │
                         │  ┌──────────────┐ ┌──────────┐ ┌───────────┐ │
                         │  │ queue worker │ │ scheduler│ │ websockets│ │
                         │  │ (Horizon)    │ │ (cron)   │ │ (laravel- │ │
                         │  │              │ │          │ │  echo)    │ │
                         │  └──────────────┘ └──────────┘ └───────────┘ │
                         │             │                                │
                         │             ▼                                │
                         │        ┌──────────┐  (internal SMTP only)    │
                         │        │ postfix  │ ───► org mail server      │
                         │        └──────────┘                          │
                         └─────────────────────────────────────────────┘
```

### Container inventory

| Service | Image / base | Role | Persists data? |
|---|---|---|---|
| `nginx` | nginx (stable) | TLS termination, reverse proxy, static assets | No |
| `app` (php-fpm) | php:8.3-fpm + Laravel | Web requests (Blade/Livewire), Artisan | No (code is immutable; state is in DB/MinIO) |
| `postgres` | postgres:16 | Primary database (all records, audit log) | **Yes** — `pgdata` volume |
| `redis` | redis (stable) | Sessions, cache, queue backend | Ephemeral (rebuildable) |
| `minio` | minio (on-prem, S3-compatible) | Document files, signed PDFs, scans | **Yes** — `minio-data` volume |
| `meilisearch` | getmeili/meilisearch | Full-text search index | Rebuildable from DB |
| `horizon` (queue worker) | same as `app` | Async jobs: email, notifications, PDF generation | No |
| `scheduler` | same as `app` | Cron: nightly archive, backup, notification cleanup | No |
| `websockets` | same as `app` (laravel-websockets) | Real-time in-app notifications (Laravel Echo) | No |
| `postfix` | postfix / Sendmail | Internal SMTP relay to the org mail server | No |

> **Search fallback:** if the customer's IT prefers not to run Meilisearch, Devon can fall back to PostgreSQL full-text search (TLH §4.1). In that case the `meilisearch` container is omitted and `SCOUT_DRIVER=database`.

---

## 2. Host prerequisites

### 2.1 Hardware (baseline — 500+ concurrent users, per [`product-specification.md`](../product-specification.md) §14.1)

| Resource | Minimum (pilot, ≤100 users) | Recommended (500+ users) |
|---|---|---|
| CPU | 4 vCPU | 8+ vCPU |
| RAM | 8 GB | 16–32 GB |
| Disk (system + DB) | 100 GB SSD | 250 GB+ SSD |
| Disk (MinIO document store) | 200 GB | 1 TB+ (grows with archive) |
| Disk (backup target) | separate volume / NAS | separate volume, ≥ 2× document store |

> The backup target **must be a separate volume or device** from the primary data volumes — a single failed disk should never take both the live data and its backups. It must still be **on the customer's infrastructure** (data sovereignty).

### 2.2 Software

- A 64-bit Linux host (Ubuntu Server 22.04 LTS or RHEL 9 are the validated baselines).
- **Docker Engine** 24+ and **Docker Compose v2**.
- A valid **TLS certificate** for the chosen internal hostname (e.g. `devon.<org>.local`). For a fully internal deployment this is typically issued by the organization's own CA — consistent with the local-PKI model Devon already uses for ERI.
- NTP configured (signature timestamps and the audit trail depend on accurate host time).
- Firewall (ufw / firewalld) — see §6.

---

## 3. Environment configuration

All secrets live in `.env` on the host. **`.env` is never committed to git, never logged, and never copied off the host.** This includes the three crypto secrets below, which are the most sensitive material in the deployment after the PKI keys.

### 3.1 Critical environment keys

| Key | Purpose | Notes |
|---|---|---|
| `APP_KEY` | Laravel application key (drives `Crypt` / AES-256 field encryption) | Generated once with `php artisan key:generate`. **Losing it makes every encrypted field unrecoverable.** Back it up with the same care as the backup key. |
| `APP_ENV` | `production` | Never `local`/`debug` in prod (Telescope + verbose errors must be off). |
| `APP_DEBUG` | `false` | Must be `false` in production (avoids stack-trace disclosure). |
| `DB_*` | PostgreSQL connection | Strong password; DB not exposed outside the Docker network. |
| `REDIS_PASSWORD` | Redis auth | Required even on the internal network. |
| `MINIO_*` / `AWS_*` | MinIO access + secret keys, bucket, endpoint | S3-compatible config; endpoint is the internal MinIO service. |
| `MEILISEARCH_KEY` | Meilisearch master/API key | Omit if using the PG-FTS fallback. |
| `MAIL_*` | Internal SMTP (Postfix/Sendmail) | Points at the org mail relay — never an external mail SaaS. |
| `BACKUP_ENCRYPTION_KEY` | Encrypts nightly backup bundles | See [`backup.md`](./backup.md). Store **off the production host** in the org secret vault. |
| `BROADCAST_DRIVER` | `pusher` (pointed at self-hosted laravel-websockets) | Self-hosted only — no external Pusher. |

### 3.2 Secret handling rules

- Generate each secret with a CSPRNG; never reuse across environments (staging ≠ production).
- Store the canonical copies in the organization's secret vault, not only on the host.
- `APP_KEY` and `BACKUP_ENCRYPTION_KEY` are **disaster-recovery-critical**: if you lose them you cannot decrypt either live encrypted fields or backups. Treat them like the PKI root material.
- Rotate `DB`/`REDIS`/`MINIO` credentials on the org's standard cadence; coordinate with a maintenance window (requires a worker restart).

---

## 4. First-time install

> Run as the deployment user with Docker permissions. Replace `<…>` placeholders. Commands assume the repository root contains `docker-compose.yml` and a production `.env`.

1. **Clone the release** at the tagged version into the deploy directory.
   ```
   git clone --branch <release-tag> <internal-git-url> /opt/devon && cd /opt/devon
   ```
2. **Create `.env`** from `.env.example`, fill every key in §3.1, then generate the app key:
   ```
   cp .env.example .env
   # edit .env — DB, Redis, MinIO, Meilisearch, Mail, backup key
   docker compose run --rm app php artisan key:generate
   ```
3. **Build and start infrastructure first** (DB, Redis, MinIO, Meilisearch), then the app:
   ```
   docker compose up -d postgres redis minio meilisearch
   docker compose up -d app nginx
   ```
4. **Run migrations** and seed the baseline roles/permissions (Super Admin, Department Head, Employee):
   ```
   docker compose exec app php artisan migrate --force
   docker compose exec app php artisan db:seed --class=RolesAndPermissionsSeeder --force
   ```
5. **Create the document storage buckets** in MinIO (e.g. `devon-documents`, `devon-archive`) and confirm the `app` service can read/write them (`php artisan storage:link` for any local public disk).
6. **Build the search index** (skip if using PG-FTS):
   ```
   docker compose exec app php artisan scout:import "App\Models\Document"
   ```
7. **Start the workers, scheduler, and websockets:**
   ```
   docker compose up -d horizon scheduler websockets postfix
   ```
8. **Register the scheduler cron.** The `scheduler` container runs `php artisan schedule:work` (or a host crontab entry calling `schedule:run` every minute). Confirm `php artisan schedule:list` shows the **nightly archive** and **nightly backup** jobs (see [`backup.md`](./backup.md)).
9. **Create the first Super Admin** (interactive Artisan command, or seeded with a forced password change on first login).
10. **Run the post-deploy smoke checks** in §7.

---

## 5. Release / upgrade procedure

Devon is a monolith, so an upgrade is: new image → migrate → cache → restart workers. Aim for a short maintenance window; Livewire's stateful components mean you should not hot-swap the app mid-session for major releases.

1. **Announce** the window and put up the maintenance page:
   ```
   docker compose exec app php artisan down --render="errors::503" --retry=60
   ```
2. **Take a pre-upgrade backup** (manual on-demand run — see [`backup.md`](./backup.md) §6). Never upgrade without a fresh, verified backup.
3. **Fetch the new release** and rebuild images:
   ```
   git fetch --tags && git checkout <new-release-tag>
   docker compose build app
   ```
4. **Run migrations** (`--force` for non-interactive prod):
   ```
   docker compose up -d postgres redis minio meilisearch
   docker compose run --rm app php artisan migrate --force
   ```
5. **Rebuild caches** and restart the app + workers:
   ```
   docker compose up -d app nginx websockets
   docker compose exec app php artisan config:cache route:cache view:cache event:cache
   docker compose exec app php artisan horizon:terminate   # Horizon restarts with new code
   docker compose up -d horizon scheduler
   ```
6. **Bring the app back up:**
   ```
   docker compose exec app php artisan up
   ```
7. **Smoke-test** (§7), confirm Horizon shows workers processing, confirm the scheduler list is intact.

### 5.1 Rollback

1. `php artisan down`.
2. Check out the previous release tag and rebuild.
3. **Migrations:** prefer a forward fix. Only run `migrate:rollback` if the new migration is reversible **and** no production data has been written under the new schema. If in doubt, restore from the pre-upgrade backup per [`recovery.md`](./recovery.md) rather than rolling a migration back over live data.
4. Restart workers (`horizon:terminate`), `php artisan up`, smoke-test.

> **Never** roll a schema migration back over data that the new version already wrote — that risks orphaning or corrupting the **append-only audit log** and signed-document records. When unsure, recover from backup.

---

## 6. Network & hardening

- **Expose only `443`** (and optionally `80` → 301 redirect to HTTPS) to users. Everything else — Postgres, Redis, MinIO, Meilisearch, websockets internal port — stays on the Docker internal network, **never** published to the host's public interface.
- **TLS 1.3** enforced at Nginx; disable TLS < 1.2. (Product spec §9.5 / TLH §4.2.)
- **Security headers** at Nginx / Laravel middleware: HSTS, `Content-Security-Policy` (XSS defense pairs with Blade auto-escaping), `X-Frame-Options`, `X-Content-Type-Options`.
- **Firewall:** default-deny inbound; allow 443 from the user network and SSH from the admin network only.
- **No outbound internet requirement.** Devon must run with no egress to the public internet. If the host has internet access, that is the org's choice — Devon does not need it (no telemetry, no SaaS, error reporting points at the customer's own Sentry/Grafana per TLH §4.1).

### 6.1 Security posture verification (run after every deploy)

- [ ] `APP_DEBUG=false`, `APP_ENV=production`, Telescope disabled in prod.
- [ ] Only 443/80 reachable from outside the host; data services not published.
- [ ] TLS 1.3 negotiated; HSTS present.
- [ ] CSRF protection active on forms (Laravel default) and CSP header present.
- [ ] At-rest encryption confirmed: sensitive fields use `Crypt` (AES-256); MinIO server-side encryption on the document buckets.
- [ ] Audit log writes succeed and are **append-only** (no UPDATE/DELETE grants on the audit table to the app role).
- [ ] Signed-document protection in force — a signed document cannot be deleted or silently modified by any role (product spec §9.4).

---

## 7. Post-deploy smoke checks

Map these to the product's non-functional targets ([`product-specification.md`](../product-specification.md) §14.1) so a deploy that regresses performance is caught immediately.

| Check | Pass criterion |
|---|---|
| Login → home dashboard | Renders < 2 s (P95) on office hardware |
| Create a document from a template | Saves; appears in the registry |
| Run an approval step → next participant notified | Notification fires < 5 s (P95), in-app + email |
| Sign a test document (ERI) | `phpseclib` signature recorded; signature history shows it; document becomes delete-protected |
| Document search | First page < 3 s (P95) |
| Upload a 10 MB file | Available for review < 10 s (P95) |
| Real-time bell | Websocket connects; a new notification appears without refresh |
| Queue health | Horizon dashboard shows workers green, no failed jobs piling up |
| Scheduler | `schedule:list` shows nightly archive + nightly backup jobs |

---

## 8. Health checks & monitoring

- **App liveness:** an HTTP health endpoint behind Nginx (e.g. `/up`, Laravel 11 default) — Nginx and any external monitor poll it.
- **Queue:** Laravel Horizon dashboard (`/horizon`, admin-only) — watch throughput, wait time, failed jobs.
- **Metrics & logs:** Grafana + Loki (TLH §4.1, DevOps role) aggregate container logs and host metrics; **Sentry** (self-hosted) for application exceptions. All monitoring stays on customer infrastructure.
- **Backup freshness alert:** alert if no successful backup has completed in the last 26 hours — see [`backup.md`](./backup.md) §7.
- **Disk:** alert at 80% on the DB volume, the MinIO volume, and the backup volume. A full disk is the most common avoidable SEV (see [`oncall.md`](./oncall.md)).
- **TLS expiry:** alert ≥ 30 days before the certificate expires.

---

## 9. Cross-references

- Backup procedure & schedule → [`backup.md`](./backup.md)
- Restore & disaster recovery → [`recovery.md`](./recovery.md)
- Incident response & on-call → [`oncall.md`](./oncall.md)
- Canonical product facts (uptime, NFR, backup policy) → [`product-specification.md`](../product-specification.md) §11, §14
- Stack source of truth → [`docs/Plyma 19.03.2026.docx`](../Plyma%2019.03.2026.docx) §4.1
