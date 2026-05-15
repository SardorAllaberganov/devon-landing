# Devon — Product Specification

> **Document type:** Product specification (canonical, supersedes the legacy "PLYMA Technical Spec v1.0" with the tech-stack content removed).
> **Audience:** Product, design, business analysis, sales, executive stakeholders.
> **Status:** v1.0 — describes the v1.0 product (8 core modules) as it ships.
>
> For implementation and architectural detail, see the code, `docs/adr/`, and the operations runbook in `docs/operations/`. This document deliberately stays at the product layer.

---

## Table of contents

- [1. Vision and problem statement](#1-vision-and-problem-statement)
- [2. Target audience and use environments](#2-target-audience-and-use-environments)
- [3. Business outcomes](#3-business-outcomes)
- [4. The eight modules](#4-the-eight-modules)
  - [4.1 Users & Authentication](#41-users--authentication)
  - [4.2 Document Management](#42-document-management)
  - [4.3 Electronic Digital Signature (ERI)](#43-electronic-digital-signature-eri)
  - [4.4 Approval Workflow ("List soglasovaniya")](#44-approval-workflow-list-soglasovaniya)
  - [4.5 Task Delegation (Kanban)](#45-task-delegation-kanban)
  - [4.6 Organizational Structure](#46-organizational-structure)
  - [4.7 Integration & Export](#47-integration--export)
  - [4.8 Incoming/Outgoing Letters](#48-incomingoutgoing-letters)
- [5. Roles and permissions](#5-roles-and-permissions)
- [6. Document lifecycle](#6-document-lifecycle)
- [7. Approval-chain mechanics](#7-approval-chain-mechanics)
- [8. Notifications and real-time updates](#8-notifications-and-real-time-updates)
- [9. Security and compliance — product-level guarantees](#9-security-and-compliance--product-level-guarantees)
- [10. Audit and traceability](#10-audit-and-traceability)
- [11. Backup, archival, and data sovereignty](#11-backup-archival-and-data-sovereignty)
- [12. Localization](#12-localization)
- [13. Reporting and dashboards](#13-reporting-and-dashboards)
- [14. Non-functional expectations](#14-non-functional-expectations)
- [15. What Devon is not](#15-what-devon-is-not)

---

## 1. Vision and problem statement

Devon (codename **PLYMA** in earlier specs — from Greek *plimo*, "flow") is an on-premise corporate platform that digitizes the internal document lifecycle of Uzbek organizations end-to-end: creation, collaborative review, multi-step approval, electronic signature, official correspondence, archival, and the task delegation that flows around all of it.

Mid-to-large Uzbek organizations today operate on a hybrid workflow that is mostly digital in document **content** but stubbornly paper-based in document **process**. The five operational pains Devon addresses:

| # | Pain | Operational consequence |
|---|---|---|
| 1 | Documents live as paper or scattered files | Loss risk, painful archival, physical storage cost, no search |
| 2 | Task assignment lives in chat, email, or verbal hallway delegation | Tasks slip, no accountability trail, deadline blindness |
| 3 | No integrated electronic signature | Approvers must physically meet documents; signing waits become the workflow bottleneck |
| 4 | Employee directories and contact info are fragmented | No fast way to locate the right approver or share a document |
| 5 | "Soglasovaniya" (collaborative approval) stays paper-bound | Slow, error-prone, single point of failure when a chain link is unavailable |

Devon's response is a single platform where all five fail-modes resolve together. Documents are digital from inception; approvals are routed and tracked; signatures happen in the platform; tasks are visible on a Kanban board; the org chart is the source of truth for routing; and everything is auditable.

### Why a unified platform (and not five separate tools)

The five pains above are not five problems — they are facets of one problem (paper-process inertia). Solving them with five separate products produces a worse outcome than solving them once together:

- **Document context is preserved across the workflow.** When a task is "review the draft contract," the task carries the document; when the approval routes, it carries the signature history; when the signature lands, it carries the audit trail. No copy-paste between systems.
- **One audit log.** Compliance officers do not have to reconcile audit trails across four products.
- **One identity model.** The same employee profile drives task assignment, approval routing, document permissions, and signature authority.
- **One on-premise footprint.** A regulated buyer (ministry, state-owned bank) approves one deployment, not five.

This unification is Devon's primary differentiator — see [competitive-analysis.md](./competitive-analysis.md) for how this plays out against EDoc, Bitrix24, and the international tier.

---

## 2. Target audience and use environments

### Primary buyers

| Segment | Why Devon fits |
|---|---|
| **Government bodies & ministries** | Data sovereignty is a hard constraint; on-premise deployment, audit completeness, and ERI integration are non-negotiable |
| **State-owned enterprises** | Same compliance profile as ministries plus internal task-delegation needs |
| **Commercial banks** | Strong audit requirements; signed correspondence; multi-level approval for credit, compliance, and HR documents |
| **Holding companies** | Multiple sub-entities with shared executive review; needs the four-level hierarchy natively |
| **Large enterprises (50+ staff)** | Crossing the threshold where paper workflow becomes a measurable operational tax |

### Buyer profile checklist

A prospect is a strong fit if **all** of the following are true:

- 50+ employees with a hierarchical reporting structure
- Existing paper or hybrid approval workflow ("soglasovaniya")
- Hard requirement (legal, political, or strategic) that data stays on-premise and in-country
- Uses or plans to use e-imzo (national ERI)
- Has an IT function capable of running on-prem infrastructure

A prospect is a **mis-fit** (and we should say so) if:
- They want a SaaS workflow tool (Devon's on-prem isn't optional)
- Their primary need is sales-team CRM with documents as a side feature (use Bitrix24)
- They need a configurable BPM engine for arbitrary processes (use ELMA365 or Directum RX)
- They have fewer than ~20 employees (overhead doesn't pay back)

### Use environments

Devon is designed for the office knowledge-worker, not field operations. v1.0 ships desktop-first with a responsive layout that works on tablets. Native mobile apps are explicitly post-v1.2.

---

## 3. Business outcomes

The four outcomes Devon commits to. All four are measured against the customer's baseline at deployment.

### 3.1 70% reduction in approval cycle time

**Baseline:** time from "document created" to "all approvals collected and signatures applied" before Devon.

**Driver:** routing happens at network speed instead of physically carrying documents between offices; parallel approval where the chain allows; real-time notification on every step; mobile-responsive review surface means approvers can act between meetings.

**Measurement:** Devon records the timestamp of every state transition; the customer's BA compares pre/post averages over a 90-day window after go-live.

### 3.2 100% paperless internal document flow

**Baseline:** percentage of internal documents originating, circulating, or archived as paper.

**Driver:** every internal document is born digital in Devon; the only paper artifacts that should remain are documents that legally must be paper (and even those are scanned into the audit log).

**Measurement:** procurement records for paper, toner, and physical storage; sample audit of recent approval cycles.

### 3.3 Clear accountability for every task

**Baseline:** percentage of internal tasks with a named owner, deadline, and visible status.

**Driver:** Kanban-style task module makes the answer to "who is doing this and when is it due?" the default state, not the exception. Manager dashboards surface overdue work before it becomes a crisis.

**Measurement:** Devon's task module's own metrics — count of tasks in each status, overdue rate, average time-in-status.

### 3.4 Data sovereignty

**Baseline:** the customer's contractual exposure to foreign cloud providers for sensitive documents.

**Driver:** Devon is fully on-premise. No document, no employee record, no audit entry leaves the customer's infrastructure.

**Measurement:** binary — either the deployment is fully internal (✓) or it isn't (✗).

---

## 4. The eight modules

The product is organized into eight modules. They share one data model, one audit log, one notification surface, and one identity system — the module boundaries exist for product clarity, not architectural separation.

### 4.1 Users & Authentication

**Purpose:** establish who is logging in, what role they hold, and which department they belong to. The identity foundation that every other module depends on.

**Capabilities:**

- **Login** — email + password authentication. Session lifetime configurable by the customer's security policy.
- **Three primary roles** — Super Admin, Department Head (boshliq), Employee (xodim). The role determines coarse permissions; the org-hierarchy assignment determines scope.
- **Employee profile** — full name, department assignment, position title, internal phone extension, external phone, email, photograph.
- **Position instructions ("lavozim yo'riqnomasi")** — every employee has the document defining their job duties attached to their profile. Both the document author (typically HR) and the employee can reference it. When the position is updated, the version history is preserved.
- **Employee directory** — searchable by name, department, or position. Returns profile + current task load summary + current responsibilities in approval chains.
- **First-login flow** — when HR creates a new employee, Devon issues a one-time password; on first login the employee is required to set their own password and verify profile data.

**State transitions:** an employee record is `active`, `on-leave` (preserves profile but suspends task assignment and approval routing), or `archived` (preserves history; cannot be re-activated — terminations create a new record on rehire).

**Why this matters at the product layer:** the org chart is the routing logic for everything else. A clean, current employee directory is the precondition for approval chains, task delegation, and signature authority to work without exception-handling.

---

### 4.2 Document Management

**Purpose:** be the system of record for every internal document during its active life, then archive it.

**Capabilities:**

- **Template-based creation** — the organization defines templates (order, memo, contract draft, internal directive, etc.) with placeholder fields. Employees pick a template, fill the fields, and Devon produces the document.
- **External upload** — Word and PDF files can be uploaded as documents, for cases where the source already exists (drafted offline, received as attachment).
- **Versioning** — every save creates a new version; prior versions are read-only and preserved.
- **Confidentiality levels** — each document carries a confidentiality classification (open / internal / restricted / confidential). The classification gates who can see the document in search, who can be added to approval chains, and what notifications include the document title vs. only a reference number.
- **Audit trail** — for every document: who created it, who viewed it (and when), who modified it (with field-level diff), who shared it, who approved or rejected it, who signed it. Append-only.
- **Export** — any document can be exported as PDF or Word at any state.
- **Search** — full-text search across document content + metadata. Filterable by template type, author, department, status, date range, confidentiality.
- **Protection rules** — once a document reaches `signed` state, it cannot be deleted or silently modified by anyone, including Super Admin. Edits after signing produce a new version annotated as "post-signature amendment" and require their own approval cycle.
- **Auto-archival** — documents that reach `signed` or `closed` state are PDF-archived nightly and moved out of the active working set (still searchable, still recoverable).

**Document numbering:** internally-generated documents receive an auto-assigned number on first save (configurable format per template, typically `{template-code}-{year}-{sequence}`). Numbers are unique and cannot be re-used.

**Why this matters at the product layer:** document management is the spine. Everything else — signatures, approvals, tasks, letters — references documents. A document that is hard to find, hard to share, or unprotected after signing breaks the trust the product builds.

---

### 4.3 Electronic Digital Signature (ERI)

**Purpose:** apply legally-recognized electronic signatures (e-imzo / ERI) to documents inside the platform.

**Capabilities:**

- **In-platform signing** — the user signs without leaving Devon; a signing dialog requests their PIN/token credential and the signature lands on the document.
- **Local PKI integration** — Devon connects to the organization's existing Certificate Authority. No third-party signing service intermediates the signing material.
- **Signature visibility** — every applied signature is visible on the document and in the document's history: who signed, when, with which certificate, against which document version.
- **Signature verification** — any viewer can verify the signature's validity (certificate not expired or revoked, signed content not modified since signing).
- **Multi-signature chains** — a document can require multiple signatures in a defined order (sequential) or in parallel. Mixed sequential/parallel patterns are supported (e.g., legal + finance sign in parallel, then CEO signs).
- **Signing authority** — only employees with the `can-sign` capability on a given document type can apply a signature. Authority is granted per role, per template type, and per department.
- **Signature failure handling** — if the certificate is expired, revoked, or the PIN is incorrect, the signing attempt fails with a clear message; no partial state is left on the document.

**Locked state after signing:** once any signature is applied, the document's content is locked. The signature history is itself part of the document's audit log.

**Why this matters at the product layer:** ERI is the difference between "we digitized our paper" and "we digitized our approvals." A document with an authentic, verifiable e-imzo signature has the same legal force as a wet-ink signed paper.

---

### 4.4 Approval Workflow ("List soglasovaniya")

**Purpose:** route a document through an ordered list of reviewers, each of whom must approve, reject, or approve-with-comment before the chain advances.

**Capabilities:**

- **Chain composition** — the document's author or a delegated coordinator defines the list of approvers in order. Each participant is identified by employee (not just role), so substitutions are explicit.
- **Approval actions** — each participant chooses one of three actions:
  - **Approve** — chain advances to the next participant.
  - **Reject** — chain halts; the document returns to the author with the rejection reason. Re-submission requires either re-routing or starting a new chain.
  - **Approve with comment** — chain advances but a comment is attached, visible to all subsequent participants and the author.
- **Parallel and sequential nodes** — a chain can have parallel "branches" (e.g., legal and finance both review independently, both must approve before the next step). Each branch carries its own state.
- **Approval sheet ("kelishuv varaqasi")** — when the chain completes, Devon auto-generates the approval sheet: a one-page document listing every participant, their action, timestamp, and any comment. The sheet is attached as a permanent record.
- **Notifications** — every state transition fires notifications:
  - To the next-in-line participant when their turn begins
  - To the author at every step
  - To previous participants when the chain advances or is interrupted
  - To the entire chain when the document is signed or rejected
- **Reminders** — if a participant has not acted within a configurable deadline, automated reminders fire (initially gentle, escalating to the author and the participant's manager).
- **Substitute approvers** — when a participant is on leave (per their profile state), the chain routes to their designated substitute. If no substitute is configured, the chain halts and the author is notified.
- **Concurrent chains on one document** — supported but rare; typically used when a document needs both internal approval and a separate compliance review.

**Why this matters at the product layer:** this is the core process Devon replaces. Every other module exists to feed or to record what happens here.

---

### 4.5 Task Delegation (Kanban)

**Purpose:** assign work, set deadlines, track progress, and review deliverables — outside of (but adjacent to) the document approval flow.

**Capabilities:**

- **Task creation** — managers create tasks with title, description, attached documents (optional), deadline, priority (High / Medium / Standard), and assignee.
- **Kanban board** — four canonical columns: **New** → **In Progress** → **Under Review** → **Done**. Drag-and-drop moves a task between columns; the move is recorded in the task's history.
- **Deliverable upload** — when the employee marks a task as ready for review, they attach the deliverable (a file, a document reference, or a written summary).
- **Review actions** — the manager reviews the deliverable and selects:
  - **Accept** — task moves to Done.
  - **Return for revision** — task moves back to In Progress with a comment.
  - **Reject** — task is closed without acceptance; manager and employee both see the rejection reason in the task history.
- **Priority indicators** — High-priority tasks are visually prominent; the manager dashboard surfaces overdue High-priority tasks first.
- **Manager dashboard** — across all reports: count by status, count overdue, average time-to-completion, current load per employee. Surfaces overload (a manager assigning more than an employee can finish on time).
- **Employee dashboard** — own tasks grouped by status, deadline-sorted; overdue items are top of the list with visual emphasis.
- **Task notifications** — assignment, status change, comment, deadline approaching, deadline missed, deliverable submitted, deliverable accepted/rejected.

**Distinction from approval chains:** a task is "do this work and report back." An approval-chain step is "review and decide on this document." They share the notification system but are not the same flow. A task can have a document, but a document is not a task.

**Why this matters at the product layer:** approval chains digitize the paperwork; task delegation digitizes the operational work that surrounds the paperwork. Together they cover the full operational surface of an internal department.

---

### 4.6 Organizational Structure

**Purpose:** model the four-level Uzbek corporate hierarchy and make it the source of truth for routing, permissions, and reporting.

**Hierarchy:**

```
Departament
└── Boshqarma
    └── Bo'lim
        └── Sho'ba
```

**Capabilities:**

- **Tree-view administration** — Super Admin builds and edits the org tree visually. Each node has a name, a designated head, and a roster of assigned employees.
- **Head assignment** — every node from Boshqarma down has exactly one designated head; the Departament can have one or more heads (vice-directors). Heads inherit the **Department Head** role's permissions within their subtree.
- **Employee assignment** — every employee is assigned to exactly one Sho'ba (the leaf level). Their position in the hierarchy is implicit: an employee in Sho'ba X belongs to its parent Bo'lim, Boshqarma, and Departament.
- **Re-org tooling** — when departments merge, split, or transfer, Devon preserves history (a document approved in the old Boshqarma keeps that attribution in its audit log) while routing future actions through the new structure.
- **Visibility** — every employee can see the full org tree; sensitive details (full contact info, exact employee count of small units for HR-confidentiality reasons) are role-gated.

**Routing implications:**

- Approval chains default to routing within or up the hierarchy.
- A document's default confidentiality scope is its originating department's subtree.
- Task delegation defaults to within-Sho'ba but can cross departments when explicitly authorized.

**Why this matters at the product layer:** Uzbek corporate hierarchies are not flat. A Departament can contain 5+ Boshqarmas, each with multiple Bo'lims; the lines of authority and the routing logic of approvals follow these lines. A generic "departments list" cannot model this — Devon's four-level hierarchy is a first-class concept.

---

### 4.7 Integration & Export

**Purpose:** connect Devon to the email infrastructure the organization already operates, and to the backup/archival systems IT operates.

**Capabilities:**

- **Email send** — any document can be emailed to one or more recipients, internal or external. The email body is composable; the document is attached (PDF, by default). The send action is logged in the document's audit trail.
- **Internal document sharing** — share a document with one or more colleagues without leaving Devon. The shared-with party receives a notification and the document appears in their inbox surface. Sharing respects confidentiality classification.
- **Scheduled email digests** — managers can opt in to a daily or weekly email summarizing their team's task and approval activity.
- **PDF archival** — every night, all documents that reached a terminal state (signed, closed, archived) in the prior 24 hours are PDF-rendered with full metadata and moved into the archive.
- **System backup** — every night the full document database, file archive, and audit log are snapshotted and encrypted. Backups rotate (30 daily, 12 weekly, 24 monthly). The IT admin channel is notified on success or failure.
- **Restore** — the operations runbook (`docs/operations/recovery.md`) covers the full restore procedure; the customer's IT performs and tests it monthly.

**Out of scope for v1.0:**
- Inbound email parsing (sending email back into Devon as a new document).
- Two-way calendar sync.
- Integration with external EDM systems (interoperability with other organizations' EDM is post-v1.2).

**Why this matters at the product layer:** Devon does not replace the organization's email server; it interoperates with it. The clean separation keeps Devon focused on its core (internal workflow) while leaving general-purpose email to email systems.

---

### 4.8 Incoming/Outgoing Letters

**Purpose:** track official correspondence between the organization and external parties (citizens, other ministries, partner companies).

**Capabilities:**

- **Inbound registration** — when a letter arrives (paper, scanned to PDF; email; courier), the registry office (Davonxona) registers it: assigns the inbound registration number, captures sender, subject, date received, attachments, and routes it to the responsible head for executor assignment.
- **Executor assignment** — the receiving head reviews the letter and assigns an executor (employee or sub-department head) with a deadline.
- **Response preparation** — the executor drafts the response as a regular document in Devon; the draft is linked to the inbound letter so the full thread is one record.
- **Approval and signature** — the response goes through the standard approval chain and is signed with ERI before dispatch.
- **Outbound registration** — when the response is approved and signed, Devon assigns the outbound registration number and prepares the dispatch package (PDF + signature certificate) for whichever channel sends the response (email, postal, courier).
- **Auto-numbering** — both inbound and outbound numbers follow the organization's numbering scheme (configurable, typically `{prefix}/{year}/{sequence}`).
- **Status tracking** — open / in-progress / awaiting signature / completed / closed without response. Overdue inbound letters are surfaced on the responsible head's dashboard.
- **Reporting** — count by status, average response time, longest-pending, breakdowns by responsible department.

**Why this matters at the product layer:** for government bodies and SOEs, inbound/outbound correspondence is a legal obligation with strict deadlines (citizen petitions, inter-agency requests). Missing a deadline has real consequences. Devon makes the deadline visible and the responsibility chain explicit.

---

## 5. Roles and permissions

Devon ships with three primary roles. The role defines what the user can do; the org-hierarchy position defines what scope they can do it within.

### 5.1 Role definitions

| Role | Coarse capability |
|---|---|
| **Super Admin** | Full system access: user/role administration, org structure, system configuration, template management, audit-log read |
| **Department Head** (any node's head) | Within their subtree: create documents, assign tasks, participate in or initiate approval chains, sign documents (with ERI), review subordinates' work, see all department activity |
| **Employee** | Own tasks and own documents: create documents, participate in assigned approval chains, sign documents (where authorized), upload deliverables, share documents within authorized scope |

### 5.2 Capability matrix (representative)

| Action | Employee | Dept. Head | Super Admin |
|---|:---:|:---:|:---:|
| View own profile | ✓ | ✓ | ✓ |
| Edit own profile (non-org fields) | ✓ | ✓ | ✓ |
| View colleague's profile | ✓ (within dept) | ✓ (within subtree) | ✓ |
| Create document from template | ✓ | ✓ | ✓ |
| Upload existing document | ✓ | ✓ | ✓ |
| Initiate approval chain | ✓ (own docs) | ✓ | ✓ |
| Participate as approver | ✓ (when added) | ✓ (when added) | ✓ (when added) |
| Sign with ERI | ✓ (where authorized) | ✓ (where authorized) | ✓ |
| Assign task | ✗ | ✓ (within subtree) | ✓ |
| Receive/execute task | ✓ | ✓ | ✓ |
| Manage org tree | ✗ | ✗ | ✓ |
| Manage users and roles | ✗ | ✗ | ✓ |
| Manage templates | ✗ | ✗ | ✓ |
| Read audit log | ✓ (own actions only) | ✓ (subtree) | ✓ |
| Configure system | ✗ | ✗ | ✓ |

### 5.3 Scope rules

- **An employee cannot see a document outside their department unless explicitly shared with them, or they are on its approval chain.**
- **A Department Head can see all activity within their subtree** — every document, every task, every approval state, every audit entry. They cannot see siblings' or parents' subtrees.
- **Super Admin can see everything but cannot edit documents** — they administer the system; they do not act on its content. (They can read audit logs, manage users, configure the system, but cannot approve, sign, or modify a document's content. This separation is enforced even when Super Admin holds a Department Head role on a node — the capabilities don't compose into "can rewrite history.")

### 5.4 Permissions extensions (post-v1.0)

- Fine-grained per-template permissions (e.g., only HR can use the termination-letter template).
- Time-bound delegation ("act as my approver while I'm on leave Apr 10–20").
- Read-only auditor role (for external compliance reviews).

These are roadmap items, not v1.0.

---

## 6. Document lifecycle

A document moves through these states. State transitions are explicit, recorded, and (after `signed`) heavily constrained.

```
draft → in-review → approved → signed → closed → archived
   ↘     ↓ ↘
    rejected  recalled
```

| State | Meaning | Who can do what |
|---|---|---|
| `draft` | Author is composing; not yet sent for review | Author edits freely; others cannot see unless shared |
| `in-review` | On an approval chain; not all participants have acted | Approvers act; author can recall; cannot be deleted |
| `rejected` | At least one approver rejected; chain halted | Returns to draft for revision OR is closed without recovery |
| `approved` | All chain participants approved; awaiting signature | Author or designated signer initiates signing |
| `signed` | One or more ERI signatures applied | **Content locked.** Cannot be deleted by anyone. Amendments create new versions with their own approval cycle |
| `recalled` | Author withdrew the document during review | Returns to draft; chain is annotated, not erased |
| `closed` | Terminal state for documents that completed their lifecycle without needing signature (e.g., internal memos) | Read-only; archival-eligible |
| `archived` | Moved to long-term storage; not in active working set | Read-only; recoverable but no longer in default search |

**Transitions are recorded with:** actor, timestamp, prior state, new state, optional comment, IP/device of action.

**The `signed` boundary is the strongest constraint in the product** — see §9.4 for protection mechanics.

---

## 7. Approval-chain mechanics

### 7.1 Chain composition

A chain is an ordered list of nodes. Each node is either:
- A **single participant** — one named employee; their decision advances or halts that node.
- A **parallel group** — multiple participants who must all decide independently before the node completes.

A chain might look like:

```
Node 1: [Author's manager]
Node 2: [Legal review] || [Finance review]   ← parallel; both required
Node 3: [Department head]
Node 4: [Director]                            ← signer
```

### 7.2 Participant actions

At each node, every participant chooses exactly one of:

| Action | Effect |
|---|---|
| **Approve** | Their portion of the node is satisfied |
| **Approve with comment** | Same as Approve; comment is attached and visible to subsequent participants and author |
| **Reject** | Chain halts; document returns to `rejected` state; author is notified with reason |

Only Reject halts the chain. Approve-with-comment is not a soft reject — it advances normally. If a reviewer has concerns serious enough to halt, they must Reject and state the reason; the comment field is for non-blocking notes.

### 7.3 Chain visibility

- Every participant sees the full chain composition, who has acted, what they said, who is currently pending.
- The author sees the same.
- Other employees see nothing unless explicitly shared or it lands in their inbox via the document's confidentiality scope.

### 7.4 Chain interruption

If a participant cannot act (on leave, terminated, no longer holds the relevant role):

- If their profile has a designated substitute, the chain routes to the substitute automatically. The audit log records the substitution.
- If no substitute is configured, the chain halts; the author is notified and must edit the chain (replace the participant) to resume.

### 7.5 Approval sheet

When the chain completes (last node satisfied), Devon generates the **approval sheet (kelishuv varaqasi)** — a one-page PDF that lists:

- Document title and reference number
- Every participant in chain order
- Each participant's action, timestamp, and any comment
- Final state and timestamp

The sheet is attached to the document permanently and is included in any external dispatch of the document.

### 7.6 Re-approval after rejection

A rejected document, after the author revises it, requires a new chain (or a re-issued original chain with reset state). Prior rejection records are preserved — the audit log shows both the rejection and the re-approval cycle.

---

## 8. Notifications and real-time updates

### 8.1 Channels

Devon delivers notifications through three channels:

| Channel | When |
|---|---|
| **In-app** (the bell icon in the navbar) | Every notification — always |
| **Email** | Configurable per-user; default-on for "action required" and "chain completed" events |
| **Real-time push** (the in-app banner that appears without a refresh) | Time-sensitive events: a task assigned to me, an approval awaiting my action, my document was just signed |

### 8.2 Triggers

The product fires notifications on:

- **Tasks** — assigned, status changed, deadline approaching, overdue, deliverable submitted, deliverable accepted/rejected, comment added.
- **Approvals** — chain reached my node, chain advanced, chain rejected, chain completed, comment added at any node I'm on, my document was approved/rejected by the chain.
- **Documents** — shared with me, my document was viewed (for confidential documents), signature applied to my document.
- **Letters** — letter assigned to me as executor, response due soon, response overdue.
- **System** — password reset, role change, profile updated by admin.

### 8.3 Quiet hours and digest mode

Per-user preferences:
- **Quiet hours** — no push notifications during configured hours; in-app and email still queue.
- **Digest mode** — instead of individual emails, the user receives a daily or weekly summary.

### 8.4 Notification audit

Every notification sent is logged — what was sent, to whom, via which channel, whether delivered. This is part of the audit trail (a missed approval cannot be blamed on "I never got the notification" without a verifiable answer).

---

## 9. Security and compliance — product-level guarantees

### 9.1 Authentication

- Email + password with configurable complexity policy.
- Configurable session lifetime and idle timeout.
- Account lockout after configurable failed-attempt threshold.
- Password reset via verified email or admin override (admin override is logged).
- Two-factor authentication is on the roadmap (v1.2).

### 9.2 Authorization

- Every action is checked against the user's role and scope.
- Per-document permissions are enforced server-side. The UI hides actions a user cannot perform, but the security boundary is the server.
- "Sharing" a document is an explicit, auditable action. There is no implicit access.

### 9.3 Confidentiality classifications

Documents carry one of four classifications:

| Level | Who can see |
|---|---|
| **Open** | Any authenticated user in the organization |
| **Internal** | Authenticated users in the same Departament |
| **Restricted** | Author, explicitly-shared parties, approval chain participants, the originating department's head subtree |
| **Confidential** | Author, explicitly-shared parties only. Even Department Heads do not see by default — must be explicitly shared |

Classifications can be raised (more restrictive) but not lowered without Super Admin action and a recorded reason.

### 9.4 Signed-document protection

This is the strongest constraint in the product. Once a document is in `signed` state:

1. **It cannot be deleted** by any role, including Super Admin.
2. **Its content cannot be modified.** An amendment is a new version with its own approval cycle, linked to the signed version.
3. **Its signature record cannot be edited.** Who signed, when, with which certificate — immutable.
4. **Its audit log cannot be edited.** Append-only, always.

These four guarantees are layered: the application enforces them; the data model prevents the underlying operation; the audit log would record any attempt. The combination is intended to satisfy the regulatory expectation that "once signed, the document is final."

### 9.5 Encryption

- All traffic between users and Devon is encrypted in transit.
- Sensitive fields in the database are encrypted at rest.
- Document files in storage are encrypted at rest.
- Backup snapshots are encrypted with the organization's backup key before being written.

### 9.6 Audit completeness

Every meaningful action is recorded. The full coverage is in §10.

### 9.7 Privacy

- Internal identifiers (employee ID, PINFL/INN) are displayed only where strictly required.
- Phone numbers and email addresses are visible within the org; external contact details (citizen petitioners on inbound letters) are visible only to the executor and their supervisor.
- The audit log itself is access-controlled: an employee sees their own activity; a Department Head sees their subtree's activity; Super Admin sees all.

### 9.8 Data sovereignty

- No document, no employee record, no audit entry, no notification content leaves the customer's on-premise infrastructure.
- Devon ships with no SaaS dependencies. Telemetry, error reporting, and analytics are either disabled or directed at the customer's own infrastructure.

---

## 10. Audit and traceability

### 10.1 What is recorded

Every meaningful state change. Specifically:

| Event class | Recorded fields |
|---|---|
| Authentication | User, action (login / logout / failed attempt / password change / lockout), timestamp, IP, user-agent |
| Profile change | User, fields changed (before/after), timestamp, actor (self or admin) |
| Document action | User, document, action (create / view / edit / share / move-state / sign / export / archive), timestamp, before/after where applicable |
| Approval chain | User, document, chain node, action (advance / reject / comment / substitute), timestamp |
| Task action | User, task, action (create / assign / status-change / comment / deliverable-submit / accept / reject), timestamp |
| Letter action | User, letter, action (register / assign / respond / dispatch / close), timestamp |
| Notification | Recipient, channel, content reference, delivery status, timestamp |
| Org change | Admin, node, action (create / rename / move / merge / split / dissolve), timestamp |
| Permission change | Admin, user, role/scope change (before/after), timestamp |
| System | Admin, configuration change (before/after), timestamp |

### 10.2 Properties of the audit log

- **Append-only.** Entries cannot be edited or deleted, even by Super Admin.
- **Complete.** Every action that touches a document, task, letter, or user is logged.
- **Queryable.** Filterable by user, document, time range, action class.
- **Exportable.** A subset can be exported as CSV or PDF for external compliance review.
- **Time-synchronized.** All timestamps come from a single trusted source so cross-event ordering is unambiguous.

### 10.3 Audit log retention

- Active retention: indefinite during the document's active life.
- After archival: 7 years minimum (configurable per organizational policy).
- Audit log itself is included in nightly backups.

### 10.4 What audit answers

The audit log is designed to answer, definitively, questions like:

- "Who saw this document and when?"
- "Why was this approval chain interrupted?"
- "Was this notification actually delivered?"
- "Who changed this employee's role last March?"
- "Has this document been modified since it was signed?" (Answer: it cannot have been; if there is any record of an attempt, that's a critical incident.)

---

## 11. Backup, archival, and data sovereignty

### 11.1 Nightly backup

Every night at the customer's configured time (default 02:00 local):

1. Database snapshot is taken.
2. Document file storage is snapshotted.
3. Audit log is snapshotted.
4. All three are encrypted with the organization's backup key.
5. The encrypted bundle is written to backup storage.
6. Backup rotation: keep 30 daily, 12 weekly, 24 monthly.
7. The IT admin notification channel is informed on success or failure.

### 11.2 Archival vs. backup

- **Archival** is product-level: documents that reached terminal state are moved out of the active working set but remain searchable.
- **Backup** is infrastructure-level: full system snapshot for disaster recovery.

A document can be archived and live in 30 nightly backups; restoring a single archived document does not require restoring the whole system.

### 11.3 Recovery testing

The operations runbook (`docs/operations/recovery.md`) requires monthly restore drills against a staging environment. The drill confirms backups are intact and the team's restore muscle memory is current.

### 11.4 On-premise scope

Everything stays on the customer's infrastructure:

- Application servers
- Database
- File storage
- Search index
- Audit log
- Backups
- Email gateway (Devon uses the customer's SMTP)
- PKI integration (Devon uses the customer's CA)

There is no cloud component. There is no telemetry leaving the perimeter. There is no SaaS dashboard. Updates are delivered as packages the customer installs; the customer chooses when.

---

## 12. Localization

### 12.1 Languages

| Locale | Status in v1.0 | Notes |
|---|---|---|
| `uz` (Uzbek, Latin script) | ✅ Primary | All UI, all user-facing strings, all email templates |
| `ru` (Russian) | 🛣️ v1.1 | Planned next release |
| `en` (English) | 🛣️ v1.2 | Planned for international/expat-staffed customers |

### 12.2 Translation discipline

- Uzbek is authored first; nothing ships with `[NEEDS_TRANSLATION]` in `uz`.
- Russian and English follow Uzbek as a translation pass, not as an authoring pass.
- Plural forms are handled per locale (Russian has more plural categories than English; Uzbek is mostly count-agnostic).
- Number, date, and currency formatting follow the user's preferred locale, not the device locale.

### 12.3 Right-to-left

Not required. Uzbek (Latin) and Russian are left-to-right; right-to-left is not in scope.

### 12.4 Per-user preference

Each employee selects their preferred locale in their profile. Notifications, dashboards, and document templates all honor the preference. The document content itself is whatever the author wrote it in (Devon does not auto-translate document content).

---

## 13. Reporting and dashboards

### 13.1 Dashboards by audience

| Audience | Default dashboard surface |
|---|---|
| **Employee** | Today's tasks, awaiting-my-action approvals, recent documents, recent notifications |
| **Department Head** | Subtree task health (count by status, overdue), subtree approval pipeline, overdue letters, recent activity, employee load distribution |
| **Super Admin** | System-wide health (active users, documents created today, approval throughput, error rate), pending administrative actions, audit highlights (unusual activity flagged for review) |

### 13.2 Reports

Standard reports v1.0 ships with:

- **Approval cycle time** — average time from document creation to signed/closed, sliced by template type and department.
- **Task completion rate** — completed on time vs. overdue vs. returned for revision, by employee and department.
- **Letter response time** — average response time on inbound letters, by department and letter category.
- **Document volume** — count of documents created, by template, by department, by month.
- **User activity** — login frequency, average daily actions, dormant accounts (for security review).

All reports are exportable as PDF or CSV.

### 13.3 Custom reports

v1.0 does not include a custom report builder. The roadmap (v1.2+) includes a "saved query" mechanism that lets power users compose their own dashboards from the standard metrics.

---

## 14. Non-functional expectations

### 14.1 Performance targets

| Metric | Target |
|---|---|
| Login → home dashboard rendered | < 2 seconds (P95) on standard office hardware |
| Document search returns first page | < 3 seconds (P95) |
| Approval action submitted → next participant notified | < 5 seconds (P95) |
| Document upload (10 MB) → available for review | < 10 seconds (P95) |
| Concurrent active users supported on baseline hardware | 500+ |

### 14.2 Availability

- Target uptime: 99.5% during business hours (the customer defines business hours per deployment).
- Scheduled maintenance windows: defined per customer; Devon supports rolling restarts so most updates do not require downtime.

### 14.3 Capacity

- Default deployment sizing supports up to ~5,000 employees and ~500,000 documents per year.
- Larger deployments require capacity planning with the customer's IT; the architecture is horizontally scalable.

### 14.4 Browser support

- Latest two stable versions of Chrome, Firefox, Edge, and Safari.
- Internet Explorer is not supported.
- Mobile browsers (iOS Safari, Android Chrome) supported for read-and-respond use cases; v1.0 is not optimized for full document authoring on mobile.

### 14.5 Accessibility

- Target: WCAG 2.1 AA across the application.
- Specifics:
  - Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and non-text UI.
  - All actions reachable via keyboard.
  - Screen-reader labels on all interactive elements.
  - Respects OS settings for reduced motion and dynamic text size.

---

## 15. What Devon is not

Devon is positioned as a focused product. The following are deliberately out of scope, even though competitors offer them:

| Not Devon | Why |
|---|---|
| **CRM / sales pipeline** | Different audience, different data model; use a CRM (Bitrix24, Salesforce) alongside Devon if needed |
| **Intranet portal / chat / video conferencing** | Different category; Devon interoperates with whatever the org already uses |
| **General-purpose BPM canvas / low-code designer** | Devon is opinionated about its workflows; if you need to model arbitrary processes, use ELMA365 or Directum |
| **Public-facing document portal** | Devon is internal; citizen-facing services belong on a separate public surface |
| **Accounting / ERP** | 1C and dedicated accounting platforms own this space; Devon integrates via export, not replacement |
| **Project management with Gantt / dependencies** | Task module is Kanban-only; complex project planning belongs in a project management tool |
| **Native mobile apps** | Post-v1.2; v1.0 ships responsive web |
| **AI-assisted document classification** | On the roadmap (future considerations); v1.0 ships without it |

Saying no to these is a positioning choice, not a capability gap. Each "not" sharpens what Devon *is*: a purpose-built, on-premise, Uzbek-first document workflow and approval platform for organizations whose paper bottleneck is the actual problem.

---

## Appendix A — Module-to-business-process mapping

| Business process | Primary modules |
|---|---|
| New employee onboarding | Users & Authentication, Organizational Structure |
| Internal document drafting and approval | Document Management, Approval Workflow, Electronic Signature |
| Manager assigns work to subordinate | Task Delegation, Users & Authentication |
| Citizen petition handling | Incoming/Outgoing Letters, Document Management, Approval, Signature |
| Inter-agency correspondence | Incoming/Outgoing Letters, Approval, Signature |
| Quarterly archival | Document Management, Integration & Export |
| Compliance audit (external) | Document Management, Audit log, Reports |

For end-to-end flows see [business-processes.md](./business-processes.md). For functional use cases see [use-cases.md](./use-cases.md). For Uzbek terminology see [glossary.md](./glossary.md).
