# Backup Runbook

> **Audience:** the customer's DevOps / system engineer.
>
> **Canonical policy lives in** [`docs/product-specification.md`](../product-specification.md) §11 (Backup, archival, and data sovereignty) and the README "Backup and recovery" section. This file is the **operational how-to** behind that policy. If the cadence, rotation, or encryption rule here ever disagrees with the product spec, **the product spec wins** — fix it there first, then update this file.

Devon handles legally-sensitive corporate documents and a legally-significant **append-only audit log**. A backup is not optional infrastructure hygiene — it is part of the product's compliance promise. Everything below stays on the **customer's own infrastructure**: no document, no record, no backup leaves the on-premise environment ([`product-specification.md`](../product-specification.md) §9.8).

---

## 1. What gets backed up

A complete Devon backup is **three components captured as one consistent bundle**:

| # | Component | Source | Why it's in the bundle |
|---|---|---|---|
| 1 | **Database** | PostgreSQL 16 | All records: users, org structure, documents metadata, approval chains, letters, tasks, signatures, **and the audit log**. |
| 2 | **Document file store** | MinIO (S3-compatible) | The actual document files, signed PDFs, uploaded scans, and the daily PDF archive. The DB only holds references; the bytes live here. |
| 3 | **Audit log** | (part of the PostgreSQL dump) | Called out explicitly because it is legally significant and **append-only** — it must be recoverable exactly, never reconstructed. |

> **Not backed up (intentionally):** Redis (sessions/cache/queue are rebuildable) and the Meilisearch index (rebuilt from the DB with `scout:import`). Losing them costs a re-warm, not data. See [`recovery.md`](./recovery.md) §5.

### 1.1 Backup vs. archival — do not confuse them

Per [`product-specification.md`](../product-specification.md) §11.2:

- **Archival** is a *product* feature: at the end of each day the scheduler moves finalized/signed documents into the archive store and stamps them. Users still see archived documents through the app. This is about the document lifecycle.
- **Backup** is *infrastructure*: a full encrypted system snapshot for disaster recovery, operated by IT.

A document can be archived **and** present in 30 nightly backups at the same time. Restoring one archived document does **not** require a full system restore — see [`recovery.md`](./recovery.md) §3.1.

---

## 2. Schedule

- **Nightly, 02:00 local time** — the canonical window (README + product spec §11.1). The customer defines "local time" per deployment.
- Driven by the **Laravel Scheduler** (`scheduler` container) invoking a backup command that wraps `pg_dump` + a MinIO snapshot (TLH 8-BLOK: *"Backup tizimi: pg_dump + MinIO snapshot — Laravel Scheduler + shell"*).
- Confirm it is registered: `docker compose exec app php artisan schedule:list` must show the nightly backup job alongside the nightly archive job.

---

## 3. What the nightly job does

The nightly job performs these steps in order (per [`product-specification.md`](../product-specification.md) §11.1, steps 1–6):

1. **Quiesce-consistent DB dump.** `pg_dump` (custom/compressed format) of the full Devon database, including the audit log table.
2. **Snapshot the document file store.** Mirror the MinIO document + archive buckets to the snapshot staging area (e.g. `mc mirror`), capturing all document bytes.
3. **Include the audit log** — already inside the DB dump; verified present before the bundle is sealed.
4. **Encrypt** all components with the organization's **`BACKUP_ENCRYPTION_KEY`** (see [`deployment.md`](./deployment.md) §3). Backups are never written in plaintext.
5. **Write the encrypted bundle** to the backup storage volume (a separate device from the live data — see [`deployment.md`](./deployment.md) §2.1).
6. **Rotate** older bundles per §4 and **notify the IT admin channel** on success or failure (§5).

### 3.1 Naming & layout (recommended convention)

The TLH does not fix the on-disk layout; this convention keeps rotation and recovery scriptable:

```
/backup/devon/
  daily/    devon-YYYYMMDD-0200.tar.enc      (keep 30)
  weekly/   devon-YYYYWww.tar.enc            (keep 12, taken Sunday)
  monthly/  devon-YYYYMM.tar.enc             (keep 24, taken on the 1st)
  latest -> daily/devon-<most-recent>.tar.enc
```

Each bundle contains the encrypted `pg_dump`, the MinIO snapshot, and a small `manifest.json` (component checksums + Devon release version + timestamp) used by the integrity check in §7 and by recovery.

---

## 4. Rotation & retention

The canonical rotation ([`product-specification.md`](../product-specification.md) §11.1 step 6 / README):

| Tier | Keep | Taken |
|---|---|---|
| **Daily** | last **30** | every night at 02:00 |
| **Weekly** | last **12** | one nightly run per week is promoted (e.g. Sunday) |
| **Monthly** | last **24** | the 1st-of-month nightly run is promoted |

This yields ~2 years of monthly granularity, ~3 months of weekly, and a full month of daily points. The Audit-log retention requirement ([`product-specification.md`](../product-specification.md) §10.3) — *audit log is included in nightly backups* — is satisfied because component 1/3 always carries it.

> **Sizing:** the backup volume must hold all retained tiers simultaneously, with headroom for the document store's growth. Plan for ≥ 2× the live document-store size (see [`deployment.md`](./deployment.md) §2.1).

---

## 5. Success / failure notification

- On **success**, the job posts to the **IT admin channel** with the bundle name, size, component checksums, and duration.
- On **failure**, it raises an alert that pages on-call ([`oncall.md`](./oncall.md)) — a missed or failed backup is treated as **SEV2** until the next successful run, because it widens the recovery-point gap.
- Notifications route through Devon's existing notification channels (in-app/email via the internal SMTP relay) — **no external webhook to a SaaS** (data sovereignty).

---

## 6. Manual / on-demand backup

Always take a manual backup **before any upgrade, migration, or risky maintenance** ([`deployment.md`](./deployment.md) §5).

```
# Trigger the same job the scheduler runs, on demand:
docker compose exec app php artisan devon:backup --now --tag=pre-upgrade-<release>

# Or, the raw components if Artisan is unavailable (app container down):
docker compose exec postgres pg_dump -Fc -U <db_user> <db_name> > /backup/devon/manual/db-<ts>.dump
docker compose exec minio mc mirror local/devon-documents /backup/devon/manual/minio-<ts>/
# then encrypt both with BACKUP_ENCRYPTION_KEY before leaving them at rest
```

> A manual bundle is tagged and stored under `manual/` so rotation does not prune it. Encrypt manual dumps too — a plaintext `pg_dump` of corporate documents on disk defeats the entire on-prem confidentiality model.

---

## 7. Verification — a backup you can't restore is not a backup

Backups must be **verified**, not just produced. Two layers:

### 7.1 Automated integrity check (every run)

After writing the bundle, the job:
- Recomputes each component's checksum and compares against `manifest.json`.
- Confirms the encrypted bundle decrypts with `BACKUP_ENCRYPTION_KEY` (a header/probe decrypt, not a full extract).
- Confirms the DB dump is structurally valid (`pg_restore --list` succeeds).
- Confirms the audit-log table is present and non-empty in the dump.

A failure here flips the run to "failure" (§5) even if the files were written.

### 7.2 Monthly restore drill (mandatory)

Per [`product-specification.md`](../product-specification.md) §11.3, a **restore drill runs monthly against the staging environment**. This is owned by DevOps (TLH §V: *"Kunlik backup avtomatizatsiyasi va restore testi"*). The full drill procedure lives in [`recovery.md`](./recovery.md) §6 and confirms both that the bundle is intact **and** that the team's restore muscle memory is current. A backup tier that has never been test-restored is not trusted.

---

## 8. Monitoring backup health

- **Freshness alert:** page if no successful nightly backup has completed in **> 26 hours** (gives the 02:00 run a margin without masking a real miss). Wire this into Grafana/Sentry per [`deployment.md`](./deployment.md) §8.
- **Capacity alert:** backup volume ≥ 80% full.
- **Drill tracking:** record each monthly drill's date and result in the operations log; a missed drill is itself an action item for on-call.

---

## 9. The non-negotiables

| Rule | Why |
|---|---|
| Backups are **always encrypted** with the org backup key | On-prem confidentiality; a stolen disk must yield nothing. |
| Backup target is a **separate device** from live data | One disk failure must not destroy data *and* its backups. |
| Backups **stay on customer infrastructure** | Data sovereignty is a hard product constraint. |
| The **audit log** must be in every bundle and restorable exactly | It is append-only and legally significant. |
| `BACKUP_ENCRYPTION_KEY` and `APP_KEY` are stored **off the production host** | Lose them and the backups are undecryptable / encrypted fields unrecoverable. |
| **Never upgrade without a fresh, verified backup** | Migrations can be one-way; the backup is the rollback. |

---

## 10. Cross-references

- Restore & disaster recovery (uses these bundles) → [`recovery.md`](./recovery.md)
- Deployment, secrets, scheduler setup → [`deployment.md`](./deployment.md)
- Backup-failure incident handling → [`oncall.md`](./oncall.md)
- Canonical backup policy → [`product-specification.md`](../product-specification.md) §11
