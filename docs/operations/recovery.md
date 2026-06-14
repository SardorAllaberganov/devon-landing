# Recovery Runbook

> **Audience:** the customer's DevOps / system engineer, executing under pressure. Keep this file printable and current — during a real incident the app (and this repo's web view) may be down.
>
> This is the file the README and [`product-specification.md`](../product-specification.md) §11.3 point to for "the full restore procedure." It consumes the bundles produced by [`backup.md`](./backup.md) and restores onto the topology in [`deployment.md`](./deployment.md).

**Before you touch anything:** identify the scenario (§2), confirm you have a verified backup bundle and the two crypto secrets (`BACKUP_ENCRYPTION_KEY`, `APP_KEY`), and **declare the incident** ([`oncall.md`](./oncall.md)) so the work is tracked. Recovery actions are high-stakes — they overwrite live state.

---

## 1. Recovery objectives

| Objective | Target | Source |
|---|---|---|
| **RPO** (max acceptable data loss) | **≤ 24 hours** — bounded by the nightly 02:00 backup cadence | [`backup.md`](./backup.md) §2 |
| **RTO** (single-document/file restore) | **< 1 hour** | §3.1 |
| **RTO** (full DB restore, existing host) | **< 4 hours** | §3.2 |
| **RTO** (full disaster rebuild, new hardware) | **< 1 business day** | §3.3 |
| **Uptime target the recovery protects** | 99.5% during business hours | [`product-specification.md`](../product-specification.md) §14.2 |

> RPO is 24h because backups are nightly. If the customer needs a tighter RPO, that is a policy change to [`product-specification.md`](../product-specification.md) §11 (e.g. add PITR via PostgreSQL WAL archiving) — **fix the spec first**, then update [`backup.md`](./backup.md) and this file.

---

## 2. Pick the scenario

| Symptom | Scenario | Go to |
|---|---|---|
| One document/file deleted or corrupted; system otherwise healthy | Single-item restore | §3.1 |
| Database corrupted / lost; host and MinIO intact | Full DB restore | §3.2 |
| Host lost (disk failure, hardware death, ransomware) | Full disaster rebuild | §3.3 |
| A MinIO object is missing/corrupt; DB fine | Object restore | §3.4 |
| Redis lost (sessions dropped, queue empty) | Cache/queue rebuild | §5 |
| Search returns nothing / stale | Reindex (not a data loss) | §5 |

---

## 3. Restore procedures

> Common preamble — **decrypt the bundle** with the org backup key into a scratch area on the target host:
> ```
> # bundle layout & manifest: see backup.md §3.1
> openssl enc -d -aes-256-... -in /backup/devon/latest -out /restore/devon-bundle.tar -k "$BACKUP_ENCRYPTION_KEY"
> tar -xf /restore/devon-bundle.tar -C /restore/   # → db.dump, minio/, manifest.json
> # verify component checksums against manifest.json before proceeding
> ```

### 3.1 Single document / file restore (RTO < 1 h)

Restoring one item should **not** require a full system restore (product spec §11.2).

1. Identify the document UUID / object key from the user report or audit log.
2. **File missing only (DB row intact):** pull just that object from the snapshot in the decrypted bundle and put it back into MinIO:
   ```
   mc cp /restore/minio/devon-documents/<object-key> local/devon-documents/<object-key>
   ```
3. **DB row missing too:** restore only the affected table rows from `db.dump` into a temporary schema, then re-insert the specific rows (do **not** restore the whole DB for one document):
   ```
   pg_restore -t documents -t signatures --data-only --schema=restore_tmp ... /restore/db.dump
   # copy the specific rows from restore_tmp into the live schema inside a transaction
   ```
4. **Verify** the document opens, its signature history is intact, and — if it was signed — it is still delete-protected. Confirm an audit entry exists for the restore action (who/what/when).

> If the "missing" document was a **signed** document that someone tried to delete, that is not a routine restore — it is a **policy-violation signal**. Signed documents cannot be deleted by design (product spec §9.4). Escalate to security per [`oncall.md`](./oncall.md) and preserve the audit trail.

### 3.2 Full database restore (existing host, RTO < 4 h)

1. `php artisan down` (maintenance mode) and **stop the workers** so nothing writes mid-restore:
   ```
   docker compose stop horizon scheduler websockets app
   ```
2. **Preserve the current (corrupt) DB** before overwriting — rename the database or snapshot the volume, so you can forensic-compare later. Never discard the failed state until recovery is confirmed.
3. **Restore the dump** into a clean database:
   ```
   docker compose up -d postgres
   docker compose exec postgres dropdb -U <user> <db> && docker compose exec postgres createdb -U <user> <db>
   docker compose exec -T postgres pg_restore -U <user> -d <db> --no-owner < /restore/db.dump
   ```
4. **Reconcile the file store.** If MinIO is intact and newer than the DB, the DB now references files that exist — good. If the DB references files that are missing (rare), restore those objects from the bundle (§3.4).
5. **Bring the app back, rebuild ephemeral state** (Redis cache, search index — see §5), restart workers, `php artisan up`.
6. **Run the post-recovery verification** in §4. Do not declare the incident resolved until §4 passes.

### 3.3 Full disaster rebuild (new hardware, RTO < 1 business day)

The host is gone. You are rebuilding from the deployment runbook + the backup bundle.

1. **Provision a clean host** meeting [`deployment.md`](./deployment.md) §2 (Docker, TLS cert, NTP, firewall, separate backup volume mounted read-only).
2. **Restore the secrets first.** Retrieve `APP_KEY` and `BACKUP_ENCRYPTION_KEY` from the org secret vault (they are stored off-host per [`deployment.md`](./deployment.md) §3.2). **Without `APP_KEY` the encrypted DB fields are unrecoverable; without the backup key the bundle won't decrypt.** If either is truly lost, recovery of encrypted data is impossible — this is why §3.2 of deployment treats them as DR-critical.
3. **Stand up infrastructure** containers (Postgres, Redis, MinIO, Meilisearch) per [`deployment.md`](./deployment.md) §4 steps 1–3, using the **same** `.env` crypto secrets as the lost host.
4. **Restore the DB** (§3.2 steps 3) and **restore the full MinIO document store** from the bundle:
   ```
   mc mirror /restore/minio/devon-documents local/devon-documents
   mc mirror /restore/minio/devon-archive   local/devon-archive
   ```
5. **Do NOT run `migrate:fresh` or re-seed.** The restored dump already carries the schema and data. Only run `migrate --force` if the restored backup is from an **older** release than the image you're deploying (forward-migrate the restored data); never seed roles over restored data (that would duplicate).
6. **Rebuild ephemeral state** (§5): warm cache, `scout:import` the search index.
7. Start `app`, `nginx`, `horizon`, `scheduler`, `websockets`, `postfix`. `php artisan up`.
8. **Run §4 verification**, then run the deploy smoke checks ([`deployment.md`](./deployment.md) §7) since this is effectively a fresh deploy.

### 3.4 MinIO object restore (DB fine)

1. Identify the missing/corrupt object key (app error log or a 404 on a document).
2. Restore just that object (or prefix) from the decrypted snapshot:
   ```
   mc cp /restore/minio/devon-documents/<key> local/devon-documents/<key>
   ```
3. Verify the referencing document opens and its checksum matches the manifest.

---

## 4. Post-recovery verification (mandatory before "resolved")

A restore is not complete until **all** of these pass. These guard the product's core legal guarantees.

- [ ] **App health** — `/up` green; login → home renders (< 2 s P95, [`product-specification.md`](../product-specification.md) §14.1).
- [ ] **Audit log integrity** — the audit log is present, complete to the recovery point, and **still append-only** (the app DB role has no UPDATE/DELETE on the audit table). A restore must never silently rewrite history.
- [ ] **Signed-document protection** — open a known signed document: signature history intact, signature verifies (`phpseclib`), document is delete-protected. Signed documents must survive recovery byte-for-byte (product spec §9.4).
- [ ] **Referential integrity** — no documents reference missing MinIO objects; spot-check a sample across departments.
- [ ] **Approval chains** — an in-flight approval still shows the correct current participant and history.
- [ ] **Search** — reindexed; a known query returns results (< 3 s P95).
- [ ] **Notifications** — real-time bell connects; a test notification delivers in-app + email.
- [ ] **Queue** — Horizon healthy; no stuck/failed jobs from the restore.
- [ ] **Data-loss accounting** — compare the recovery point to the incident time; document exactly what (if anything) was lost in the RPO window and notify affected owners.

Record the result in the incident log; attach the verification checklist to the postmortem.

---

## 5. Rebuilding ephemeral state (not data loss)

These are **not** restored from backup — they are rebuilt, because losing them costs nothing permanent.

| Component | Symptom of loss | Rebuild |
|---|---|---|
| **Redis** (sessions) | Users logged out | None needed — users simply log in again. |
| **Redis** (cache) | Slower first requests | `php artisan cache:clear` then warm: `config:cache route:cache view:cache`. |
| **Redis** (queue) | In-flight async jobs lost (some emails/notifications/PDFs may need re-trigger) | Restart Horizon; re-run any idempotent scheduled jobs. Note: a lost queue can mean a notification didn't fire — spot-check recent approval transitions. |
| **Meilisearch** | Search empty/stale | `php artisan scout:import "App\Models\Document"` (and other indexed models). |

> A lost queue is the one ephemeral loss with a user-visible footnote: per CLAUDE.md, **notifications must fire on every approval state transition**. After a queue loss, verify recent transitions actually notified; re-dispatch if not.

---

## 6. Monthly restore drill (required)

[`product-specification.md`](../product-specification.md) §11.3 mandates a **monthly restore drill against staging**. This proves the backups are intact and keeps the team's restore reflexes sharp.

1. On the **staging** host (never production), take the latest production bundle (read-only copy).
2. Execute the **full DB restore** (§3.2) and a **sample MinIO restore** (§3.4) on staging.
3. Run the **§4 verification** on staging.
4. Time it — confirm it lands within the §1 RTO targets; if not, raise a remediation item.
5. **Record** the drill date, bundle tested, restore time, and pass/fail in the operations log. A month without a recorded drill is itself an on-call action item ([`backup.md`](./backup.md) §8).

> The drill is also the only safe place to discover a problem like a missing `APP_KEY` copy or a silently failing MinIO snapshot — find it in the drill, not in the disaster.

---

## 7. When recovery is impossible or partial

- **Missing crypto keys** (`APP_KEY` / `BACKUP_ENCRYPTION_KEY`): encrypted data / the bundle cannot be decrypted. Escalate immediately ([`oncall.md`](./oncall.md)); this is a key-management failure, not a backup failure — review §3.2 of deployment so it never recurs.
- **Partial bundle / failed checksum:** fall back to the previous tier (yesterday's daily → last weekly → last monthly). This is exactly why rotation keeps 30/12/24.
- **Suspected tampering / ransomware:** do **not** restore over the live host. Isolate it, preserve it for forensics, rebuild on clean hardware (§3.3), and engage security (`security@<org>`). The append-only audit log is primary evidence — protect it.

---

## 8. Cross-references

- Backups this consumes → [`backup.md`](./backup.md)
- Topology & secrets this restores onto → [`deployment.md`](./deployment.md)
- Declaring/escalating the incident → [`oncall.md`](./oncall.md)
- Canonical recovery-testing policy → [`product-specification.md`](../product-specification.md) §11.3
