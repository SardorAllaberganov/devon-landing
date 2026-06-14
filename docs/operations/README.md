# Devon — Operations Runbook

> **Audience:** the customer's system administrators — DevOps / system engineers and the on-call rotation who **deploy, back up, recover, and operate** an on-premise Devon installation.

This folder is the operational counterpart to Devon's product documentation. A deliberate split applies:

- The **README, landing page, and product specification** carry **no stack details** — their audience is decision-makers, and engineering specifics would only get in the way (see [`ai_context/AI_CONTEXT.md`](../../ai_context/AI_CONTEXT.md) "Brand voice").
- This **operations runbook is the one place** where the stack, container topology, commands, and infrastructure procedures belong — because sysadmins genuinely need them.

Devon is **fully on-premise**. Every procedure here keeps data, logs, and backups on the customer's own infrastructure. That is a hard product constraint, not a default — see [`product-specification.md`](../product-specification.md) §9.

---

## The four runbooks

| Runbook | Use it when | File |
|---|---|---|
| **Deployment** | Standing up Devon, upgrading a release, hardening the host | [`deployment.md`](./deployment.md) |
| **Backup** | Understanding/operating the nightly backups, taking a manual backup before maintenance | [`backup.md`](./backup.md) |
| **Recovery** | Restoring a document, a database, or rebuilding after a disaster; running the monthly drill | [`recovery.md`](./recovery.md) |
| **On-call** | An incident is happening — triage, first response, escalation | [`oncall.md`](./oncall.md) |

**Typical reading order for a new operator:** Deployment → Backup → Recovery → On-call. In an incident, start at [`oncall.md`](./oncall.md) and let it route you.

---

## System at a glance

Devon is a **Laravel 11 monolith** (PHP 8.3; Blade + Livewire 3 + Alpine.js) running as Docker containers behind Nginx, with PostgreSQL 16, Redis, MinIO (document files), Meilisearch (search), Laravel Horizon (queue), a Scheduler (cron), and self-hosted websockets for real-time notifications. ERI signing uses `phpseclib` against the organization's local PKI CA. Full topology and the container inventory are in [`deployment.md`](./deployment.md) §1.

**Stack source of truth:** [`docs/Plyma 19.03.2026.docx`](../Plyma%2019.03.2026.docx) §4.1.

---

## Canonical facts every operator must respect

These come from [`product-specification.md`](../product-specification.md) (§8, §11, §14) and the README. **If a runbook ever contradicts them, the product spec wins — fix the spec first, then the runbook.**

| Fact | Value | Where |
|---|---|---|
| Nightly backup window | **02:00 local time** | [`backup.md`](./backup.md) §2 |
| Backup rotation | **30 daily · 12 weekly · 24 monthly** | [`backup.md`](./backup.md) §4 |
| Backups encrypted with the org backup key | always | [`backup.md`](./backup.md) §9 |
| Restore drill | **monthly, against staging** | [`recovery.md`](./recovery.md) §6 |
| RPO | **≤ 24 h** (nightly cadence) | [`recovery.md`](./recovery.md) §1 |
| Uptime target | **99.5%** during business hours | [`oncall.md`](./oncall.md) §2 |
| Audit log | **append-only** — never edited or deleted | [`oncall.md`](./oncall.md) §5 |
| Signed documents | cannot be deleted or silently modified by any role | [`oncall.md`](./oncall.md) §5 |
| Data sovereignty | nothing leaves the customer's infrastructure | all four files |

---

## Conventions

- **Placeholders** are written `<like-this>` (e.g. `<org>`, `<release-tag>`, `<db_user>`). Replace them per deployment.
- Commands assume **Docker Compose v2** (`docker compose …`) from the deploy directory.
- "Local time" means the deployment's configured timezone; the customer defines it.
- Keep filled-in copies of [`oncall.md`](./oncall.md) §1 (contacts) and the two crypto secrets' vault locations **outside Devon** — during an incident the app may be the thing that's down.

---

## Maintenance of this runbook

- This runbook is **internal ops documentation**, separate from the product docs by design.
- After any incident that revealed a gap, update the relevant file and append a cross-step lesson to [`ai_context/LESSONS.md`](../../ai_context/LESSONS.md).
- When a procedure here changes a fact owned by [`product-specification.md`](../product-specification.md) (cadence, rotation, RPO, uptime), **change the spec first**, then mirror it here — per the CLAUDE.md doc-cascade rule.
