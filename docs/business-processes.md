# Devon — Business Processes

> **Document type:** End-to-end business process specifications (swim-lane descriptions).
> **Audience:** Business analysts, product designers, QA, customer-implementation teams.
>
> Each process below maps the actors (swim lanes), the steps each actor performs, the decision points, and the failure branches. These are the canonical processes Devon implements; deviations require an ADR.
>
> **Visual diagrams:** the BPMN swim-lane charts for all four processes (extracted from the TLH `Plyma 19.03.2026.docx` §III) live in [`docs/bpmn/`](./bpmn/) — see the index there. Text and diagram must agree; reconcile against the TLH if they drift.

---

## Table of contents

- [BP-1: Employee and structural-unit profile creation](#bp-1-employee-and-structural-unit-profile-creation)
- [BP-2: Task delegation and deliverable acceptance](#bp-2-task-delegation-and-deliverable-acceptance)
- [BP-3: Inbound and outbound official correspondence](#bp-3-inbound-and-outbound-official-correspondence)
- [BP-4: Internal document creation and approval](#bp-4-internal-document-creation-and-approval)
- [Common decision patterns](#common-decision-patterns)
- [Process metrics](#process-metrics)

---

## BP-1: Employee and structural-unit profile creation

**Diagram:** [`bpmn/bp1-xodim-profil-yaratish.png`](./bpmn/bp1-xodim-profil-yaratish.png)

**Trigger:** A new employee is hired, or a new department is created, or the org structure is being restructured.

**Goal:** Establish a complete, accurate employee profile assigned to the correct position in the org tree, with a one-time password issued for first login.

**Actors:**
- **Admin** (Super Admin)
- **Devon platform**
- **Employee** (the new hire)
- **HR / Personnel department** (the org function — typically operated by an HR employee with appropriate role)

### Steps (swim lanes)

| # | Actor | Step | Notes |
|---|---|---|---|
| 1 | Admin | Create the structural unit (if it doesn't already exist) | Departament / Boshqarma / Bo'lim / Sho'ba node in the org tree |
| 2 | Admin | Create sub-units within the structural unit | Same operation, one level deeper |
| 3 | HR | Enter employee data and attach the required documents | Required fields: full name, position, phone, internal extension, department assignment (dropdown), email, login, the certified extract of the hiring order ("buyruqdan ko'chirma", PDF/JPG/PNG) signed by the Director, and the position instructions ("lavozim yo'riqnomasi", PDF/JPG/PNG). The form cannot be saved without both documents |
| 4 | Platform | Create employee profile and issue a one-time password | Profile is in `pending-first-login` state |
| 5 | Employee | First login and password change | Password meets the configured complexity policy |
| 6 | Employee | Review their own profile | Reads the employee directory entry as it will appear to others |
| 7 | Decision | Does the profile need correction? | Yes → step 7.1; No → step 8 |
| 7.1 | Employee | Submit correction request to HR | Captures: which fields, what they should be |
| 7.1.1 | HR | Edit the profile per the request | Audit log records the field-level diff |
| 8 | Employee | Submit profile for confirmation | Marks the profile as ready |
| 9 | HR | Confirm the profile and attach any further supporting documents | Employment contract reference, etc. The hiring-order extract ("buyruqdan ko'chirma") and the position instructions ("lavozim yo'riqnomasi") are not attached here — both are already required at step 3, before the profile exists. |
| 10 | Employee | Begin working in Devon | Profile is `active`; appears in directory; eligible for task assignment and approval chains |

### Failure modes

| Failure | Handling |
|---|---|
| Employee never completes first login | Profile remains `pending-first-login`; HR notified after 7 days; admin can re-issue one-time password |
| Department assignment wrong | Step 7 catches this; if discovered later, HR moves the employee to the correct unit (audit log records the move) |
| Duplicate employee record | Admin detects via directory; merge tooling is post-v1.0; in v1.0, the duplicate is archived with a note |

### Process metrics

- Time from "employee created" to "employee active": target ≤ 1 business day.
- Profile correction rate: target ≤ 10% (high rates suggest the data-entry form needs improvement).

---

## BP-2: Task delegation and deliverable acceptance

**Diagram:** [`bpmn/bp2-vazifa-taqsimoti.png`](./bpmn/bp2-vazifa-taqsimoti.png)

**Trigger:** A manager (Department Head) needs to assign work to a subordinate.

**Goal:** Work is assigned with clear scope and deadline; the deliverable is reviewed; the task is closed with an explicit outcome.

**Demo:** Walkable end-to-end in the dashboard demo (Flow 7) — `/tasks` (Kanban board: Yangi / Ijroda / Ko'rib chiqilmoqda / Bajarildi; drag transitions are policy-gated; input-bearing moves open a dialog; `TOP-2026/NNNN` auto-numbering) → `/tasks/:uuid` (lifecycle action bar + clarification/comment thread). Walk it by switching personas in the user-menu POV switcher (Akhmedov → Sobirova; Karimov → Akhmedov within the IT Departament subtree). See [`../dashboard/QA_NOTES.md`](../dashboard/QA_NOTES.md).

**Single-assignee canon:** each task has exactly one assignee. The BPMN 3.2 diagram's Xodim lane caption reads "Xodim yoki xodimlarga" (employee *or employees*) — this plural wording is superseded by the single-assignee product decision documented in UC-07/08/09 and §4.5. The PNG is not re-rendered; this text is authoritative.

**Actors:**
- **Manager** (Department Head or delegated assigner)
- **Devon platform**
- **Employee** (the assignee — single per task)

### Steps (swim lanes)

| # | Actor | Step | Notes |
|---|---|---|---|
| 1 | Manager | Enter task details | Title, description, priority (High/Medium/Standard), deadline |
| 2 | Manager | Assign to an employee | Selects from team roster; can attach related documents |
| 3 | Platform | Notify the assignee | In-app + email; real-time push if the assignee is online |
| 4 | Platform | Task appears on assignee's dashboard | In the "New" Kanban column |
| 5 | Decision | Does the assignee understand the task? | Yes → step 6.2; No → step 6.1 |
| 6.1 | Employee | Leave a comment requesting clarification | Comment fires a notification back to the manager |
| 7 | Manager | Reply with additional information | Updates the task description or comments back |
| 6.2 | Employee | Execute the task | Moves task from "New" to "In Progress" |
| 8 | Employee | Attach the deliverable | File or document reference + written summary |
| 8.1 | Employee | Submit for review | Task moves from "In Progress" to "Under Review" |
| 9 | Platform | Update task status, notify manager | Manager sees the deliverable on their review queue |
| 10 | Decision (Manager) | Does the deliverable pass review? | Yes → step 10.1; No → step 10.2 |
| 10.1 | Manager | Accept | Task moves to "Done"; notification to assignee; task closes |
| 10.2 | Manager | Return with feedback or reject | Adds comment with required changes |
| 10.3 | Platform | Notify the assignee of the return | Task moves back to "In Progress"; cycle resumes at step 6.2 |
| 10.4 | Employee | Address the feedback and re-submit | Returns to step 8 |

### Acceptance variants

| Variant | When |
|---|---|
| **Accept as-is** | Deliverable meets expectations; task closes |
| **Accept with note** | Deliverable is acceptable but the manager wants a written note attached for future reference |
| **Return for revision** | Specific issues; back to In Progress |
| **Reject** | Deliverable is fundamentally wrong or the task is being canceled; task closes without acceptance |

### Failure modes

| Failure | Handling |
|---|---|
| Employee misses the deadline | Overdue indicator appears on both dashboards; auto-reminder fires; manager can extend the deadline (logged) or escalate |
| Manager doesn't review submitted work | After configurable period, reminder fires; if persistent, the manager's supervisor is informed |
| Employee uploads wrong file | Employee can replace the deliverable as long as the task is in "Under Review"; replacement is logged |
| Task scope grew mid-execution | The manager can edit the task; significant edits prompt a confirmation dialog and an explicit log entry |

### Process metrics

- Tasks completed on time: target ≥ 85%.
- Returned-for-revision rate: target ≤ 25% (higher suggests scoping problems).
- Average time-in-status per column: surfaces bottlenecks.

---

## BP-3: Inbound and outbound official correspondence

**Diagram:** [`bpmn/bp3-xatlar-boshqaruvi.png`](./bpmn/bp3-xatlar-boshqaruvi.png)

**Trigger:** A letter arrives at the organization (paper, email, courier) addressed to someone official, OR the organization is preparing to send official correspondence externally.

**Goal:** Every letter is registered, routed to a responsible executor, responded to within deadline, and dispatched (or closed) with full audit trail.

**Demo:** Walkable end-to-end in the dashboard demo (Flow 6) — `/letters` (Keluvchi / Chiquvchi registry; the Devonxona persona registers inbound letters, auto-numbered `K-2026/NNNN`) → `/letters/:uuid` (the BP-3 station timeline + the per-role action bar: route → assign → start → submit → accept → optional Rahbar ERI → dispatch, auto-numbered `CH-2026/NNNN`). Walk it by switching personas in the user-menu POV switcher. See [`../dashboard/QA_NOTES.md`](../dashboard/QA_NOTES.md).

**Actors:**
- **Devonxona / Registry office** — the team that receives and registers correspondence
- **Department Head** — the responsible head who assigns an executor
- **Sub-unit Head** — when the responsible head delegates further down
- **Employee / Executor** — the person preparing the response
- **Devon platform**

### Steps (swim lanes)

| # | Actor | Step | Notes |
|---|---|---|---|
| 1 | Devonxona | Register the inbound letter | Capture sender, subject, date received, channel, attachments; assign inbound registration number |
| 2 | Devonxona | Route to the responsible head | Based on subject classification and routing rules |
| 3 | Devonxona | The letter is now in the responsible head's queue | Visible on their dashboard with deadline |
| 4 | Department Head | Review the letter | Decide which sub-unit should handle |
| 5 | Department Head | Route to the appropriate Sub-unit Head | Optional layer; small orgs may skip and go direct to executor |
| 6 | Sub-unit Head | Review and assign to an executor | Selects the employee, sets internal deadline |
| 7 | Sub-unit Head | Executor is now responsible | Letter appears on executor's dashboard |
| 8 | Executor | Begin execution | Read the letter, gather information, draft response |
| 9 | Decision (Executor) | Does the response require a written reply document? | Yes → step 7.2; No → step 7.1 |
| 9.1 | Executor | Note the resolution and route back to Sub-unit Head | "No reply needed because..." — Sub-unit Head reviews and closes |
| 9.2 | Executor | Draft the response document | Created in Devon as a standard document; linked to the inbound letter |
| 10 | Executor | Submit response draft for approval | Routes through approval chain (see BP-4) |
| 11 | Decision | Is a head's signature required on the response? | Yes → step 9; No → step 10.1 |
| 11 (Yes) | Sub-unit Head → Department Head | Approve the draft and route up for signature | Standard approval chain |
| 12 | Department Head | Sign the response with ERI | Applies e-imzo electronic signature |
| 13 | Devonxona | Register the outbound letter | Assigns outbound registration number; prepares dispatch package (signed PDF + signature certificate) |
| 14 | Devonxona | Dispatch | Email, postal, courier — channel depends on recipient preference and regulation |
| 15 | Platform | Mark the inbound letter as closed | Letter status becomes `completed`; linked response is preserved |

### Inbound letter states

```
registered → routed → assigned → in-progress → executed → [on-signature →] responded → dispatched → closed
                                       ↓
                                   closed-without-response (rare; needs justification)
```

- `executed` — the executor has submitted their work (resolution comment or response document) and it awaits the sub-unit head's acceptance. The 19.03.2026 TLH's BPMN (step 8, "Topshiriqni qabul qilish") models this acceptance gate explicitly, so it is a first-class state. *(Added 2026-06-12.)*
- `on-signature` — acceptance is done and the response awaits the head's ERI signature; this state occurs only when a signature is required ("Rahbar imzo talab etiladimi?" = yes). *(Added 2026-06-12.)*
- `closed-without-response` — the comment-only execution path (BPMN step 7.1), accepted by the sub-unit head with justification recorded.

### Failure modes

| Failure | Handling |
|---|---|
| Inbound letter has unclear subject | Registry office flags for triage; routes to a senior reviewer for classification |
| Responsible head is unavailable | Substitute takes over (per profile config); deadline doesn't pause |
| Executor cannot complete in time | Escalation: deadline approaches → reminder to executor → reminder to Sub-unit Head → reminder to Department Head |
| Response rejected on internal review | Returns to executor with feedback (same mechanics as task return) |
| Recipient unreachable on dispatch | Devonxona tries fallback channel; if all fail, letter is marked `dispatch-failed` and surfaces on a dedicated queue |

### Compliance notes

- **Citizen petitions** carry legal deadlines (typically 15 or 30 days). Devon enforces visibility of the deadline; failing to meet it is a recorded violation.
- **Inter-agency correspondence** carries protocol deadlines; same enforcement.
- The inbound and outbound numbering schemes are typically dictated by the agency's regulations; Devon supports configurable numbering per organization.

### Process metrics

- Average response time per letter category.
- Overdue rate (letters past their internal deadline).
- Dispatch-failed rate.
- Re-opened rate (closed letters that had to be reopened due to error).

---

## BP-4: Internal document creation and approval

**Diagram:** [`bpmn/bp4-hujjat-yaratish-kelishish.png`](./bpmn/bp4-hujjat-yaratish-kelishish.png)

**Trigger:** An employee needs to formalize an internal document — order, memo, contract draft, internal directive, policy, etc.

**Goal:** Document is drafted, routed through the appropriate approval chain, signed, and archived. Every step is logged.

**Demo:** Walkable end-to-end in the dashboard demo (Flow 5) — `/documents` (registry tabs: Mening hujjatlarim / Menga kelgan / Kelishuvda / Arxiv) + `/documents/new` (template-or-upload creation wizard building the kelishuv varaqasi, auto-numbered `HJ-2026/NNNN`) → `/documents/:uuid` (A4 preview + print, the sequential approval timeline with round history, ERI signing) and `/approvals` (each persona's decision / signature / acceptance queue). Walk it by switching personas in the user-menu POV switcher. See [`../dashboard/QA_NOTES.md`](../dashboard/QA_NOTES.md).

**Actors:**
- **Employee** (the author)
- **Devon platform**
- **Approvers** (the chain participants — heads, peers, legal, finance, etc.)
- **Signer** (often the Department Head or a designated executive)

### Steps (swim lanes)

| # | Actor | Step | Notes |
|---|---|---|---|
| 1 | Employee | Log in to Devon | Standard authentication |
| 2 | Employee | Choose to create a document | Two paths: template-based (step 3) or upload-based (step 4) |
| 3 | Employee | Select a template | Picks from the organization's template library (e.g., "Internal directive", "Service contract", "Memo") |
| 4 (alt) | Employee | Upload an existing document | Word or PDF; metadata still required (title, type, confidentiality) |
| 4.1 (alt) | Platform | Auto-extract draft metadata | Where possible (filename, first-page content); always editable |
| 5 | Employee | Choose the document type | Drives which approval chain options are available |
| 6 | Employee | Fill in document content | For templates: fill placeholder fields. For uploads: review extracted content |
| 7 | Employee | Designate approvers | Add chain participants (single or parallel groups), set order |
| 7 (alt) | Employee | Use a saved chain | If the organization has predefined chains per document type, select one |
| 8 | Employee | Add explanatory note (optional) | A cover note visible to approvers explaining urgency, context |
| 9 | Decision | Should the document be sent for approval now, or saved as draft? | Send → step 10; Save → exit (draft state, returns to Step 2 later) |
| 10 | Platform | Move document to `in-review`; route to first chain node | Notifications fire |
| 11 | First approver(s) | Review and act (approve / approve-with-comment / reject) | Each action is logged |
| 12 | Decision | Was anyone in the chain a rejector? | Yes → step 10.1; No → continue chain |
| 10.1 | Platform | Halt chain; return document to author as `rejected` | Author sees rejection reason; decides to revise or close |
| 10.2 | Author | Address rejection, re-route | Either edit the same document and re-submit (with a new chain or the same one reset) or close it |
| 13 | Subsequent approvers | Review and act in order | Parallel nodes proceed independently; sequential nodes proceed in order |
| 14 | Platform | When the last node clears, document moves to `approved` | All participants notified of chain completion |
| 15 | Decision | Does the document require an ERI signature? | Yes → step 12; No → step 12.1 |
| 16 | Signer | Apply ERI signature | Standard signing flow with PIN/token |
| 16.1 (alt) | Platform | Mark the document `closed` without signature | For internal docs that don't need legal force |
| 17 | Platform | Generate the approval sheet (kelishuv varaqasi) | Attached as a permanent record |
| 18 | Platform | Generate the final PDF | Signed content + signature certificate + approval sheet |
| 19 | Platform | Notify all chain participants and the author | Final state notification |
| 20 | Platform | Eligible for nightly archival | Once in `signed` or `closed` state for 24h |

### Chain types

| Chain pattern | Example use |
|---|---|
| **Sequential single-node chain** | Memo: author → manager → director |
| **Sequential with parallel branches** | Contract: author → legal+finance (parallel) → director |
| **Multi-signer chain** | Joint directive: author → legal+finance → CEO+COO (parallel signatures) |
| **Compliance review side-chain** | High-value contract: standard chain + parallel compliance review that doesn't block but must be satisfied before signing |

### Failure modes

| Failure | Handling |
|---|---|
| Author abandons mid-chain | Document sits in `in-review` indefinitely; after configurable period, author is reminded; eventually flagged on stale-document report |
| Approver rejects without specifying why | UI requires a reason for Reject; missing reason returns the form |
| Chain reaches a participant who has left the company | Substitute mechanism (per profile config) routes around them; if no substitute, author is alerted to re-route |
| Signature attempt fails (expired cert, wrong PIN) | Clear error to signer; document stays in `approved` state; signer can retry or admin can troubleshoot |
| Document is modified after `approved` but before signing | Permitted only by the author; modification cancels approvals and requires re-routing (recorded loudly in the audit log) |
| Document is modified after `signed` | Not permitted. The only path forward is a new version that goes through its own approval cycle and is linked to the original |

### Compliance notes

- The full approval-and-signature chain produces a document with the same legal force as a wet-signed paper, per Uzbek e-imzo regulation.
- The approval sheet is itself part of the legal record; it must accompany the document in any external use.
- Pre-signing modifications must be re-approved — this is a hard constraint enforced by the product, not a workflow convention.

### Process metrics

- Time from `draft` creation to `signed` — the headline KPI for approval-cycle reduction (the 70% target).
- Rejection rate per template type — high rates suggest the template or process needs revision.
- Average dwell time per node in the chain — surfaces specific approvers who are bottlenecks.

---

## Common decision patterns

These patterns recur across all four business processes. They are described once here so individual flows can reference them.

### DP-1: Substitute approver routing

When a participant in a chain (BP-4) or a responsible head (BP-3) is unavailable:

1. Check the participant's profile for a designated substitute.
2. If present, route to the substitute; record the substitution in the audit log.
3. If absent, halt the relevant step; notify the originator (author for BP-4, registry for BP-3); they must edit the routing.

### DP-2: Deadline escalation

When a deadline approaches without action:

| Time before deadline | Action |
|---|---|
| 72 hours | Soft reminder to the responsible party |
| 24 hours | Stronger reminder + visible "due soon" indicator |
| At deadline | Overdue indicator; reminder to responsible party + their direct supervisor |
| 24h past deadline | Reminder to the supervisor's supervisor (or, for BP-3, to the head of Devonxona) |

The reminder cadence is configurable per organization.

### DP-3: Audit-everything

Every state change in every process produces an audit-log entry. The minimum recorded fields are:

| Field | Example |
|---|---|
| Actor | `employee:12345` or `system:scheduler` |
| Action | `state-change`, `approve`, `reject`, `assign`, `sign`, `dispatch`, ... |
| Subject | `document:abc-2026-0042`, `task:t-99812`, `letter:in-2026-0817` |
| Before / after | For state changes: prior state, new state |
| Comment | Free-text from the actor where applicable |
| Timestamp | Server time, time-synchronized |
| Source | IP address, user-agent, channel |

### DP-4: Confidentiality propagation

When a document is on an approval chain, every chain participant gains read access for the duration of their participation. After they have acted (or after the chain completes), their access reverts to whatever the document's confidentiality classification grants them in steady state. They cannot retain access to a Confidential document just because they once reviewed it — unless they are explicitly shared on the document.

---

## Process metrics

Devon tracks these metrics across all four business processes; they roll up to organization-level dashboards.

| Metric | BP | Target |
|---|---|---|
| Time to active employee | BP-1 | ≤ 1 business day |
| Task completion-on-time rate | BP-2 | ≥ 85% |
| Task return-for-revision rate | BP-2 | ≤ 25% |
| Inbound letter response time (average) | BP-3 | per regulation |
| Inbound letter overdue rate | BP-3 | ≤ 5% |
| Document approval-cycle time | BP-4 | 70% reduction vs. paper baseline |
| Document rejection rate | BP-4 | tracked but no target — varies by template |
| Audit completeness | All | 100% (any action with no audit entry is a bug) |

---

## Cross-references

- Functional use cases for each process step: [use-cases.md](./use-cases.md)
- Module-level capabilities each step relies on: [product-specification.md](./product-specification.md)
- Uzbek terms (Departament, Boshqarma, soglasovaniya, devonxona, etc.): [glossary.md](./glossary.md)
- Competitive positioning of these workflows: [competitive-analysis.md](./competitive-analysis.md)
