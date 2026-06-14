# On-Call Runbook

> **Audience:** the customer's on-call engineer (DevOps / system engineer) and their escalation chain.
>
> This is the file the README "Support" section points to for operations incidents. It governs **how** incidents are detected, triaged, responded to, and escalated. The first-response playbooks here hand off to [`recovery.md`](./recovery.md) for anything involving data loss.

Devon runs **on-premise** and holds legally-sensitive documents and a legally-significant audit trail. The prime directives during any incident:

1. **Never** modify or delete the **audit log** — it is append-only by law and by design, and it is your primary forensic record.
2. **Never** delete or silently modify a **signed document** — protected for every role, including admins.
3. **Never** move data, logs, or backups **off the customer's infrastructure** — data sovereignty is a hard constraint, even mid-incident (no pasting documents/logs into external tools).
4. Stabilize first, root-cause second, postmortem always.

---

## 1. Rotation & contacts

> Fill these in per deployment. Keep a copy outside Devon (the app may be the thing that's down).

| Tier | Role | Who | Reach |
|---|---|---|---|
| **Primary on-call** | DevOps / system engineer | `<name>` | `<phone / pager>` |
| **Secondary** | Tech Lead | `<name>` | `<phone>` |
| **Escalation** | IT Manager / CTO | `<name>` | `<phone>` |
| **Security** | Security officer | `<name>` | `security@<org>` |
| **Business owner** | Product / department sponsor | `<name>` | `<phone>` (for SEV1 comms) |

- **Rotation model:** weekly primary + secondary; handover per §8 checklist.
- **Where alerts land:** the IT admin channel (in-app/email via the internal SMTP relay) and the monitoring stack (Grafana/Sentry). No external paging SaaS unless it is self-hosted (sovereignty).

---

## 2. Severity levels

| Sev | Definition | Devon examples | Ack | Target resolution |
|:---:|---|---|:---:|---|
| **SEV1** | Platform down or data integrity at risk | Whole app unreachable; DB down/corrupt; **audit-log writes failing**; signed-document protection bypassed; suspected data loss or breach | **15 min** | ASAP, all-hands |
| **SEV2** | Major function broken; no data loss | ERI signing failing; approvals can't advance; **a backup failed**; queue fully stuck (no notifications/PDFs); MinIO read errors | **30 min** | same business day |
| **SEV3** | Degraded / partial | Search down (PG-FTS fallback works); slow responses breaching NFR P95; one notification channel down; disk > 80% | **2 h (business hrs)** | next business day |
| **SEV4** | Minor / cosmetic | Single user's session issue; non-blocking UI defect; noisy non-actionable alert | next business day | backlog |

> Anything touching the **audit log, signed documents, encryption, or data leaving on-prem** is **SEV1 by default** until proven otherwise — these are the product's compliance guarantees.

### Response SLA grounding

Devon targets **99.5% uptime during business hours** ([`product-specification.md`](../product-specification.md) §14.2). 99.5% over an 8h×22day month ≈ **~53 min** of allowable downtime — SEV1/SEV2 ack and resolution targets are sized to protect that budget.

---

## 3. Alert sources

| Source | Watches | Where |
|---|---|---|
| **App health** `/up` | App liveness | Nginx + external monitor |
| **Laravel Horizon** | Queue throughput, wait time, failed jobs | `/horizon` (admin) |
| **Grafana + Loki** | Host metrics, container logs, disk | self-hosted ([`deployment.md`](./deployment.md) §8) |
| **Sentry** (self-hosted) | Application exceptions | dashboard |
| **Backup freshness** | No success in > 26 h | [`backup.md`](./backup.md) §8 |
| **TLS expiry** | Cert < 30 days | monitor |
| **Disk** | DB / MinIO / backup volume > 80% | monitor |

---

## 4. First-response playbooks

> For every incident: **acknowledge → assess severity → stabilize → log actions → escalate if needed → postmortem.** Record every action with a timestamp; that log becomes the postmortem and may matter for compliance.

### 4.1 App unreachable (SEV1)
1. Hit `/up` and the host. Is it the app, Nginx, or the host/network?
2. `docker compose ps` — which containers are down? `docker compose logs --tail=200 app nginx`.
3. If `app`/`nginx` crashed: `docker compose up -d app nginx`; confirm `/up` green.
4. If the **host** is down → this is a disaster-rebuild path → [`recovery.md`](./recovery.md) §3.3.
5. If TLS expired (browser cert error, not a 5xx): renew/replace the cert, reload Nginx.
6. Verify with deploy smoke checks ([`deployment.md`](./deployment.md) §7).

### 4.2 Database down or corrupt (SEV1)
1. `docker compose logs --tail=200 postgres`. Out of disk? Crash loop? Corruption?
2. **Disk full** → §4.7. Free space, restart Postgres, verify.
3. **Corruption / won't start** → put app in maintenance (`php artisan down`), **stop workers**, and go to **full DB restore** [`recovery.md`](./recovery.md) §3.2. Preserve the corrupt DB first.
4. After restore, run the §4 verification in [`recovery.md`](./recovery.md) before reopening.

### 4.3 ERI / signing failing (SEV2)
1. Symptom: users can't sign; `phpseclib` errors in the app log.
2. Check the **local PKI CA** reachability and the signing certificate's validity (expired cert is the common cause).
3. Confirm host **NTP/time** is correct — signature timestamps depend on it.
4. **Do not** work around it by disabling signed-document protection or editing signature records. If signing is broken, approvals that need a signature simply wait — that is correct behavior, not something to bypass.
5. Escalate to the PKI owner if the CA is the problem.

### 4.4 Queue stuck — notifications/PDFs not flowing (SEV2)
1. Open Horizon (`/horizon`): are workers up? Is the failed-jobs list growing? Is wait time climbing?
2. `docker compose logs --tail=200 horizon`. Redis reachable?
3. Restart workers: `php artisan horizon:terminate` (supervisor/compose restarts them with current code).
4. Retry failed jobs once the root cause is fixed: `php artisan horizon:clear` / re-dispatch as appropriate.
5. **Side effect to check:** a stalled queue means **approval-transition notifications may not have fired** (CLAUDE.md requires they fire on every transition). After recovery, spot-check recent transitions and re-notify if needed.

### 4.5 Real-time notifications (websockets) down (SEV3)
1. In-app bell not updating live, but email notifications still arrive → it's the websockets layer, not the queue.
2. `docker compose logs --tail=100 websockets`; restart the `websockets` container.
3. Confirm `BROADCAST_DRIVER` still points at the **self-hosted** laravel-websockets (never an external Pusher).
4. Users get notifications on next page load regardless — this is degraded, not down.

### 4.6 MinIO / document store errors (SEV2)
1. Documents won't open / upload fails → `docker compose logs --tail=200 minio`.
2. Disk full on the MinIO volume → §4.7.
3. Specific object missing/corrupt, DB fine → object restore [`recovery.md`](./recovery.md) §3.4.
4. MinIO volume lost → disaster path [`recovery.md`](./recovery.md) §3.3.

### 4.7 Disk full (SEV2→SEV1 if it stops writes)
1. `df -h` — which volume? DB, MinIO, or backup?
2. Free safe space: rotate/ship old container logs, prune dangling Docker images (`docker image prune` — **never** prune volumes), clear app cache.
3. **Never** delete document files, DB data, or backup bundles to free space. Add capacity instead.
4. If the **backup volume** is full, backups are failing → also a [`backup.md`](./backup.md) §8 issue.
5. Root-cause the growth (uploads? logs? un-rotated backups?) and add monitoring at 80%.

### 4.8 Backup failed (SEV2)
1. Read the failure notification ([`backup.md`](./backup.md) §5) and the job log.
2. Common causes: disk full (§4.7), MinIO unreachable, `pg_dump` error, key/permission issue.
3. Fix the cause, then **run a manual backup** ([`backup.md`](./backup.md) §6) — do not wait for the next nightly; the RPO gap is open until a backup succeeds.
4. Verify the manual bundle (integrity check) before closing.

### 4.9 Suspected breach / tampering (SEV1 — engage security)
1. **Do not restore over the live host** and **do not alter the audit log.** Preserve everything.
2. Isolate the host from the network if active compromise is suspected.
3. Engage `security@<org>` and the escalation chain immediately.
4. The append-only audit log is primary evidence — protect it; rebuild clean per [`recovery.md`](./recovery.md) §3.3 / §7 only when security clears it.

---

## 5. The "do not" list (compliance guardrails)

| Never | Why |
|---|---|
| Edit, truncate, or delete the **audit log** | Append-only by law and design; primary forensic evidence. |
| Delete or silently modify a **signed document** | Protected for all roles (product spec §9.4). A delete attempt is a signal, not a task. |
| Disable encryption (`APP_DEBUG=true`, drop TLS, plaintext backups) to "make it work" | Breaks the on-prem confidentiality guarantee. |
| Copy documents, logs, DB dumps, or backups to an **external** tool/cloud | Data sovereignty — even for debugging. Use the self-hosted tools. |
| `migrate:fresh`, `db:wipe`, or re-seed on **production** | Destroys data. Recovery is restore-from-backup, not reset. |
| Prune Docker **volumes** to free disk | Volumes hold the DB and document store. |
| Roll a migration back over data the new version already wrote | Can corrupt audit/signature records — recover from backup instead. |

---

## 6. Incident logging & postmortem

- Open an incident record at acknowledgment: timestamp, severity, symptom, who's responding.
- Log every action with a timestamp (commands run, containers restarted, restores performed).
- For **SEV1/SEV2**, write a postmortem within 48 h: timeline, root cause, data impact (was the RPO window exceeded? any data lost?), and prevention actions.
- Feed prevention actions back into the runbook — a recurring incident means a runbook gap. Append cross-step lessons to [`ai_context/LESSONS.md`](../../ai_context/LESSONS.md).

---

## 7. Routine on-call health checks (start of shift)

- [ ] `/up` green; all containers `Up` (`docker compose ps`).
- [ ] Horizon healthy; no growing failed-jobs list.
- [ ] **Last nightly backup succeeded** within 26 h ([`backup.md`](./backup.md) §8).
- [ ] Disk < 80% on DB, MinIO, and backup volumes.
- [ ] TLS cert > 30 days to expiry.
- [ ] No unacknowledged SEV alerts from the previous shift.
- [ ] Monthly restore drill is on track ([`recovery.md`](./recovery.md) §6).

---

## 8. Handover checklist (end of shift / rotation)

- [ ] Open incidents handed over with current state and next steps.
- [ ] Any maintenance windows or deploys in flight noted.
- [ ] Outstanding alerts triaged or explicitly passed on.
- [ ] Anything degraded-but-stable (e.g. running on a fallback) flagged.
- [ ] Contacts in §1 still current.

---

## 9. Cross-references

- Restore procedures every data-loss playbook hands off to → [`recovery.md`](./recovery.md)
- Backup health & failure handling → [`backup.md`](./backup.md)
- Topology, health endpoints, monitoring → [`deployment.md`](./deployment.md)
- Uptime / NFR targets these SLAs protect → [`product-specification.md`](../product-specification.md) §14
- Security disclosures → `security@<org>` (README "Support")
