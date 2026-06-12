# CLAUDE.md — Workflow Orchestration (Devon)

> Source-of-truth facts live in [`README.md`](./README.md) and `docs/`. If a rule here conflicts with those, **the source docs win** — fix the doc first, then update this file.

## Project Context

**Devon** — on-premise corporate platform for digitizing internal document workflows in Uzbek organizations (codename "PLYMA" in earlier specs).

- **Purpose:** Replace paper-based "soglasovaniya" with a fully digital, auditable document management + approval system.
- **Deployment model:** Fully on-premise (data sovereignty is a hard requirement).
- **Audience:** Government bodies, state-owned enterprises, banks, holding companies, ministries — orgs with 50+ employees and hierarchical structures.
- **Languages:** Uzbek-first UI (primary). Russian and English are secondary/planned.
- **Roles:** Super Admin, Department Head, Employee.
- **Org hierarchy:** Departament → Boshqarma → Bo'lim → Sho'ba.

## Core Modules (8)

1. **User & Authentication** — login, role-based access, employee profiles
2. **Document Management** — templates, upload, audit trail, archival
3. **Electronic Digital Signature (ERI)** — local PKI integration, multi-signature chains
4. **Approval Workflow** ("List soglasovaniya") — ordered multi-step approval chains
5. **Task Delegation** — Kanban with priorities, deadlines, deliverable review
6. **Organizational Structure** — four-level hierarchy
7. **Integration & Export** — email, archive, scheduled backups
8. **Incoming/Outgoing Letters** — official correspondence with auto-numbering

## Sources of Truth

| Topic | Where |
|---|---|
| Product overview, modules, roles, roadmap | [`README.md`](./README.md) |
| User manual (Uzbek) | `docs/user-manual-uz.md` |
| Operations runbook (deploy, backup, recovery, oncall) | `docs/operations/` |
| Technical project document (TLH, current — Laravel stack + BPMN, legacy "PLYMA" name) | `docs/Plyma 19.03.2026.docx` |
| Technical specification (legacy, superseded by the 19.03.2026 TLH) | `docs/Plyma_Technical_Spec_v1.0.docx` |
| BPMN business process diagrams | `docs/bpmn/` |
| Dashboard demo build plan (M1 steps 01–15 · M2 steps 16–22) | `docs/dashboard-prompts/` |
| Architecture decision records | `docs/adr/` |

If a doc is wrong, **fix the doc first**, then build against the corrected truth.

## Plan Mode Default

Enter plan mode for any non-trivial task: new module, new approval/signature flow, schema change, ERI workflow change, or any modification affecting multiple modules. Re-plan immediately if requirements shift mid-session.

## Task Management

1. **Plan first** — outline the change in dependency order before producing artifacts.
2. **Verify with user** before generating code.
3. **Track progress** — TodoWrite for multi-step tasks; mark items complete as you go.
4. **Trigger Doc Cascade** after major changes.

## Doc Cascade

After any change that affects user-visible behavior or business rules:

1. Update [`README.md`](./README.md) if modules, roles, capabilities, or roadmap changed.
2. Update Uzbek user-facing strings first (primary language). Never ship with `[NEEDS_TRANSLATION]` placeholders. Russian and English translations follow.
3. Update the operations runbook in `docs/operations/` if deployment, backup, or recovery procedures changed.
4. Add an ADR in `docs/adr/` for architectural decisions.
5. If a role, status, or workflow step changed, list every module touched and review.

Code, translations, and docs **must not drift**.

## Verification Before Done

Never mark a feature complete without:

- Full test suite passes (unit, feature, E2E where UI changed).
- Audit log records the change correctly: who / what / when / from-where. Audit entries must remain append-only.
- Role/policy enforcement verified: a user outside the relevant department cannot view or edit unless explicitly shared.
- For document state changes, confirm signed documents remain protected from deletion and silent modification.
- For approval-chain changes, confirm notifications fire on every state transition.
- For new user-facing strings, confirm Uzbek copy is reviewed (Russian/English may follow per roadmap).

## Security & Compliance Discipline

Devon handles legally-sensitive corporate documents. Every change must respect:

- **Per-document and per-task authorization** must be enforced at the policy layer — never rely on UI hiding alone.
- **Audit trail completeness** — every meaningful state change is recorded; audit entries are append-only.
- **Signed-document protection** — once signed, a document cannot be deleted or silently modified, regardless of role.
- **Secrets handling** — PKI material, signing PINs, and integration credentials are never displayed in plaintext where not strictly required, and never logged.
- **Data sovereignty** — no feature may introduce a dependency on external cloud services without explicit approval; on-premise is a hard constraint.
- **Privacy** — sensitive identifiers (e.g., account numbers, internal IDs) are masked in UI surfaces where not strictly required.

## Branch Strategy

```
main                    Production-ready; protected
develop                 Integration branch for next release
feature/<short-name>    New features; from develop
fix/<short-name>        Bug fixes; from develop
hotfix/<short-name>     Emergency prod fixes; from main
```

MRs into `develop` require 2 approvers + green CI.

## Footer

- All authoritative product facts live in [`README.md`](./README.md) and [`docs/`](./docs/).
- This file is **orchestration only** — it tells Claude *how* to work on Devon, not *what* Devon is.
- If a rule here conflicts with the source docs, **the source wins** — fix the source, then update this file.

---

**Devon** — *Rivolanish intizom bilan!*
