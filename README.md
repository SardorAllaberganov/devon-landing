# Devon

> **Rivolanish intizom bilan!**
> *Development through discipline.*

**Devon** is an on-premise corporate platform for digitizing internal document workflows in Uzbek organizations. It combines document management, task delegation, electronic signature (ERI), multi-step approval chains, and organizational hierarchy into a single auditable system — designed to replace paper-based "soglasovaniya" processes with a fully digital workflow.

The platform is built specifically for the Uzbek market: Uzbek-first UI, integration with local PKI/ERI, full on-premise deployment, and compliance with local audit requirements.

---

## Table of contents

- [About Devon](#about-devon)
- [Features](#features)
- [Modules](#modules)
- [Roles and permissions](#roles-and-permissions)
- [Organizational structure](#organizational-structure)
- [Security and compliance](#security-and-compliance)
- [Backup and recovery](#backup-and-recovery)
- [Documentation](#documentation)
- [Team and roles](#team-and-roles)
- [Roadmap](#roadmap)
- [Support](#support)
- [License](#license)

---

## About Devon

Devon (project codename: "PLYMA" in earlier specs) was built to solve five specific operational problems in mid-to-large Uzbek organizations:

| # | Problem | Devon's answer |
|---|---|---|
| 1 | Paper-based document workflow | Digital templates, audit trail, archive |
| 2 | Slow, manual approval ("soglasovaniya") | Multi-step electronic approval chains with notifications |
| 3 | Tasks getting lost across departments | Kanban-style task board with priority and deadline tracking |
| 4 | No integrated electronic signature | Local PKI/ERI integration with multi-signature chains |
| 5 | Data sovereignty concerns with foreign cloud platforms | Fully on-premise deployment |

**Target users:** government bodies, state-owned enterprises, banks, holding companies, ministries — any organization with 50+ employees, a hierarchical org structure, and an existing paper workflow.

**Stated business outcomes:**
- 70% reduction in document approval time
- 100% paperless document flow
- Clear responsibility chain for every task
- Data sovereignty (on-premise, in-country)

---

## Features

Devon ships with 8 core modules:

1. **User & Authentication** — Login, role-based access, employee profiles
2. **Document Management** — Templates, file upload, audit trail, archival
3. **Electronic Digital Signature (ERI)** — Local PKI integration, multi-signature chains
4. **Approval Workflow** — "List soglasovaniya" — multi-step collaborative approval
5. **Task Delegation** — Kanban board with priorities, deadlines, result review
6. **Organizational Structure** — Departament / Boshqarma / Bo'lim / Sho'ba hierarchy
7. **Integration & Export** — Email, archival, automatic backup
8. **Incoming/Outgoing Letters** — Official correspondence registration and tracking

---

## Modules

### 1. User and authentication

- Login via email + password
- Three primary roles: Super Admin, Department Head, Employee
- Employee profile: full name, department, position, phone, internal extension
- Position instructions ("lavozim yo'riqnomasi") attached as documents
- Search employees by name or department

### 2. Document management

- Dynamic document templates
- Upload existing Word/PDF documents
- Full audit trail: who created, who viewed, when
- Signed documents are protected from deletion
- Daily automated archival of finalized documents

### 3. Electronic Digital Signature (ERI)

- Integrates with the organization's local PKI Certificate Authority
- Signature history stored in the audit log
- Supports sequential and parallel multi-signature chains
- PIN/token confirmation flow on signing

### 4. Approval workflow ("List soglasovaniya")

- Approval chains with an ordered participant list
- Each participant: approve / reject / approve-with-comment
- Auto-generated approval sheet on completion
- Notifications (in-app + email) on every state change

### 5. Task delegation (Kanban)

- Department heads assign tasks with deadlines and priorities (High / Medium / Standard)
- Employees upload deliverables; manager reviews → accept / reject / return
- Drag-and-drop Kanban UI
- Manager dashboard: task status across all reports, overdue alerts

### 6. Organizational structure

- Four-level hierarchy: Departament → Boshqarma → Bo'lim → Sho'ba
- Each department has one designated head
- Tree-view UI for browsing the org

### 7. Integration and export

- Email documents to internal and external recipients
- Internal document sharing between employees
- Daily automated archive of finalized documents
- Scheduled system backups

### 8. Incoming/Outgoing letters

- Official correspondence registration with auto-numbering
- Executor assignment and tracking
- Status reports (open, in-progress, completed)

---

## Roles and permissions

| Role | Capabilities |
|---|---|
| **Super Admin** | Full system access, org structure management, user/role administration, system configuration |
| **Department Head** | Manage own department, assign tasks, initiate and participate in approval chains, sign documents |
| **Employee** | View assigned documents and tasks, upload deliverables, participate in approval chains, sign documents (where authorized) |

Access control is enforced per-document and per-task: an employee cannot view documents outside their department unless explicitly shared.

---

## Organizational structure

Devon models the typical four-level Uzbek corporate hierarchy:

```
Departament
└── Boshqarma
    └── Bo'lim
        └── Sho'ba
```

Each level has a designated head responsible for approvals, task assignment, and reporting upward.

---

## Security and compliance

### Confidentiality

- All traffic between users and Devon is encrypted in transit
- Sensitive fields are encrypted at rest
- Document files are stored with server-side encryption

### Authentication and authorization

- Per-role access control (Super Admin, Department Head, Employee)
- Per-document and per-task policies enforce that users only see what they are authorized to see
- Bank account numbers, PINs, and signing material are never displayed in plaintext where they are not strictly required

### Audit log

Every meaningful change is recorded:
- **Who** performed the action
- **What** changed (field-level diff where applicable)
- **When** it happened
- **From where** (IP address, device)

Audit log entries are append-only — they cannot be modified or deleted, even by Super Admin.

### Signed-document protection

Once a document is signed:
- It cannot be deleted by any role
- It cannot be silently modified
- Any further state change is recorded in the audit log

---

## Backup and recovery

### Daily automated backups

A scheduled job runs nightly at 02:00 local time and:

1. Snapshots the full document database
2. Snapshots the document file archive
3. Encrypts both with the organization's backup key
4. Rotates backups: last 30 daily, 12 weekly, 24 monthly
5. Notifies the IT admin channel on completion or failure

### Recovery procedure

The full recovery runbook lives in `docs/operations/recovery.md`. At a high level: restore the most recent database snapshot, restore the document archive, then re-issue session caches.

### Recovery testing

Backup restoration is tested monthly against a staging environment as part of the operational checklist.

---

## Documentation

| Document | Audience | Location |
|---|---|---|
| README (this file) | All stakeholders | `README.md` |
| **Product specification (canonical)** | Product, BA, Eng, QA, Sales | [`docs/product-specification.md`](./docs/product-specification.md) |
| Business processes (swim-lane flows) | BA, QA, customer-implementation | [`docs/business-processes.md`](./docs/business-processes.md) |
| Functional use cases | QA, BA, product | [`docs/use-cases.md`](./docs/use-cases.md) |
| Glossary (Uzbek/Russian terms) | All non-Uzbek-speaking team members | [`docs/glossary.md`](./docs/glossary.md) |
| Competitive analysis & positioning | Sales, Product, BA | [`docs/competitive-analysis.md`](./docs/competitive-analysis.md) |
| **HR & ERI module — focused TZ (Uzbek)** | Product, BA, Eng, QA — canonical spec for the dashboard's first milestone | [`docs/Plyma TZ xodim kiritish.docx`](./docs/Plyma%20TZ%20xodim%20kiritish.docx) |
| **Dashboard build prompt set** (master + 15 step prompts) | AI assistants and contributors building the SPA | [`docs/dashboard-prompts/`](./docs/dashboard-prompts/) |
| User manual (Uzbek) | End users, admins | `docs/user-manual-uz.md` |
| Operations runbook | Sysadmins | `docs/operations/` |
| BPMN business process diagrams | Business analysts | `docs/bpmn/` |
| Architecture decision records | Architects | `docs/adr/` |
| Technical specification (legacy) | Reference only | `docs/Plyma_Technical_Spec_v1.0.docx` |
| Marketing landing page (Uzbek) | Marketing, sales, web | [`landing/index.html`](./landing/index.html) |
| Project state snapshot (current status, gaps, brand voice) | All contributors | [`ai_context/AI_CONTEXT.md`](./ai_context/AI_CONTEXT.md) |
| Session history (AI-assisted work log) | Internal, contributors | [`ai_context/HISTORY.md`](./ai_context/HISTORY.md) |

---

## Team and roles

| Role | Responsibilities |
|---|---|
| **Project Manager** | Sprint planning, stakeholder communication, risk management |
| **Tech Lead** | Architecture decisions, code review, technical roadmap |
| **Full-stack Developers (×2 senior + ×1 mid)** | All feature development |
| **DevOps Engineer** | Infrastructure, CI/CD, monitoring, backup automation |
| **QA Engineer** | Test planning, manual + automated testing, UAT coordination |
| **Business Analyst** | Requirements gathering, BPMN, use case documentation |

---

## Roadmap

### v1.0 (current)
All 8 core modules listed above.

### v1.1 (planned)
- Russian-language interface
- Mobile-responsive refinement
- Throttling and rate limiting for external integrations

### v1.2 (planned)
- Two-factor authentication
- Advanced reporting dashboard
- Single sign-on for enterprise customers

### Future considerations
- Native mobile apps (iOS/Android)
- AI-assisted document classification and routing
- Integration with national e-government services (where APIs exist)

---

## Support

For internal teams:

- **Bug reports and feature requests** → internal issue tracker
- **Operations incidents** → on-call rotation, see `docs/operations/oncall.md`
- **Security disclosures** → `security@yourorg.uz`
- **General questions** → `#devon-dev` internal Slack channel

For end users:

- **In-app help** via the `?` icon in the navbar
- **User manual** in Uzbek: `docs/user-manual-uz.md`
- **Support helpdesk** → `support@yourorg.uz`

---

## License

**Proprietary.** Devon is internal software developed for and owned by the organization. Source code, documentation, and binaries may not be distributed, sublicensed, or used outside the organization without written permission.

See `LICENSE.txt` for the full terms.

---

**Devon** — *Rivolanish intizom bilan!*

© 2026 Devon. All rights reserved.
