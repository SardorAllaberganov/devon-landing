# Devon — Functional Use Cases

> **Document type:** Functional use cases — what users do with Devon, expressed as testable scenarios.
> **Audience:** QA, BA, product, customer-implementation teams.
>
> Each use case names the actor, the preconditions, the main flow, the alternate / exceptional flows, the postconditions, and acceptance criteria. They are written so they can be executed manually (UAT) or codified into automated tests.

---

## Index

| ID | Title | Primary actor | Module |
|---|---|---|---|
| [UC-01](#uc-01-user-authentication) | User authentication | Any user | Users & Auth |
| [UC-02](#uc-02-employee-profile-self-management) | Employee profile self-management | Employee | Users & Auth |
| [UC-03](#uc-03-create-document-from-template) | Create document from template | Employee | Document Management |
| [UC-04](#uc-04-route-document-for-approval) | Route document for approval | Employee | Approval Workflow |
| [UC-05](#uc-05-sign-document-with-eri) | Sign document with ERI | Authorized signer | Electronic Signature |
| [UC-06](#uc-06-participate-in-an-approval-chain) | Participate in an approval chain | Approver | Approval Workflow |
| [UC-07](#uc-07-assign-a-task) | Assign a task | Department Head | Task Delegation |
| [UC-08](#uc-08-submit-task-deliverable) | Submit task deliverable | Employee | Task Delegation |
| [UC-09](#uc-09-review-task-deliverable) | Review task deliverable | Department Head | Task Delegation |
| [UC-10](#uc-10-monitor-department-dashboard) | Monitor department dashboard | Department Head | Reporting |
| [UC-11](#uc-11-export-document-to-pdf-or-word) | Export document to PDF or Word | Any authorized viewer | Integration & Export |
| [UC-12](#uc-12-email-a-document) | Email a document externally | Any authorized sender | Integration & Export |
| [UC-13](#uc-13-register-an-inbound-letter) | Register an inbound letter | Devonxona / Registry | Inbound/Outbound Letters |
| [UC-14](#uc-14-respond-to-an-inbound-letter) | Respond to an inbound letter | Assigned executor | Inbound/Outbound Letters |
| [UC-15](#uc-15-dispatch-an-outbound-letter) | Dispatch an outbound letter | Devonxona / Registry | Inbound/Outbound Letters |
| [UC-16](#uc-16-manage-organizational-structure) | Manage organizational structure | Super Admin | Org Structure |
| [UC-17](#uc-17-create-and-onboard-employee) | Create and onboard employee | HR + Admin | Users & Auth |
| [UC-18](#uc-18-nightly-archival-of-finalized-documents) | Nightly archival of finalized documents | System | Document Management |
| [UC-19](#uc-19-nightly-system-backup) | Nightly system backup | System | Operations |
| [UC-20](#uc-20-read-audit-log-for-a-document) | Read audit log for a document | Authorized viewer | Audit |

---

## UC-01: User authentication

**Actor:** Any user with credentials.

**Goal:** Authenticate to Devon and reach their personalized home dashboard.

**Preconditions:**
- The user has an active account.
- The user has a valid password.

**Main flow:**
1. User navigates to the Devon login page.
2. User enters email and password.
3. User submits the form.
4. Devon validates credentials and creates a session.
5. Devon redirects to the home dashboard appropriate to the user's role.

**Alternate flows:**
- **A1:** Wrong password — Devon shows a generic "invalid credentials" message (does not distinguish "wrong password" from "no such user"). Failed-attempt counter increments. After N failed attempts (configurable), the account is locked for M minutes; the user is shown a "contact admin" message.
- **A2:** Account is locked — Devon shows the lockout message without checking the password.
- **A3:** Account is on first login — after successful credential check, Devon forces a password change before proceeding.
- **A4:** Password expired (if policy requires periodic change) — same as A3.

**Postconditions:**
- Audit log records the login event (or the failed attempt) with timestamp, IP, user-agent.
- Session is active until logout or timeout.

**Acceptance criteria:**
- [ ] Valid credentials → user reaches their dashboard.
- [ ] Invalid credentials → generic error message; failed-attempt counter increments.
- [ ] N failed attempts → account locks for M minutes; further attempts during lockout show the lockout message immediately.
- [ ] Successful login records an audit-log entry.
- [ ] First-login forces password change before any other action.

---

## UC-02: Employee profile self-management

**Actor:** Employee.

**Goal:** View and edit own profile data within the bounds of self-editable fields.

**Preconditions:**
- User is authenticated.

**Main flow:**
1. User opens own profile page.
2. User sees their full profile: name, position, department, contact details, attached position instructions ("lavozim yo'riqnomasi"), recent activity.
3. User edits self-editable fields (phone, email, photograph, language preference, notification preferences).
4. User saves changes.

**Alternate flows:**
- **A1:** User attempts to change a field that is not self-editable (position, department, role) — the field is read-only in the UI; if a script attempts to submit it, the server rejects the change.
- **A2:** User wants to change a non-editable field — the UI offers a "Request change from HR" action that creates a profile-change request for HR review.

**Postconditions:**
- Self-editable fields are updated.
- Audit log records the field-level diff and the actor.
- Real-time push notifies any session the user has open elsewhere.

**Acceptance criteria:**
- [ ] User can edit phone, email, photograph, language preference, notification preferences.
- [ ] User cannot edit position, department, role directly.
- [ ] "Request change" path produces an HR-visible request.
- [ ] All edits produce audit-log entries with the diff.

---

## UC-03: Create document from template

**Actor:** Employee (any role with create permission).

**Goal:** Produce a new internal document by filling a template's placeholders.

**Preconditions:**
- User is authenticated.
- The user's role permits document creation.
- At least one template is available to the user.

**Main flow:**
1. User chooses "Create document".
2. User selects "From template".
3. User picks a template from the available library (filtered by user's role and department).
4. Devon displays the template form with placeholder fields.
5. User fills in required fields and optional fields.
6. User sets the document's confidentiality classification.
7. User saves as draft (state = `draft`).
8. Devon assigns the document its auto-generated reference number.
9. Document appears in the user's drafts list.

**Alternate flows:**
- **A1:** Required field missing on save — Devon highlights the missing fields and blocks save.
- **A2:** User cancels before saving — no document is created; no audit entry.
- **A3:** User wants to discard a saved draft — Devon prompts for confirmation; on confirm, document moves to `discarded` state (preserved for audit; not visible in normal lists).
- **A4:** Template is no longer available (admin removed it) — Devon either prevents new use or marks the draft as "template-deprecated"; the draft is still editable but with a warning banner.

**Postconditions:**
- A new document exists in `draft` state.
- The document is in the author's drafts.
- Audit log records the creation event.

**Acceptance criteria:**
- [ ] Templates list is filtered by the user's role and department.
- [ ] Required fields block save when empty.
- [ ] Saved draft has a unique reference number conforming to the template's numbering scheme.
- [ ] Document confidentiality classification is set at creation.
- [ ] Audit log records: actor, template, timestamp, initial field values.

---

## UC-04: Route document for approval

**Actor:** Document author (the employee who created the document, or a coordinator designated by the author).

**Goal:** Send the document onto an approval chain so chain participants can review.

**Preconditions:**
- Document exists in `draft` state.
- The author has the right to initiate a chain on this document.

**Main flow:**
1. Author opens the draft document.
2. Author chooses "Send for approval".
3. Author composes the chain: adds participants in order, marks parallel groups where applicable.
4. Author optionally adds a cover note explaining context or urgency.
5. Author optionally sets a deadline for the chain.
6. Author submits.
7. Devon validates the chain (every participant is a real, active employee; no circular routing; signing participant has signing authority).
8. Document moves to `in-review`.
9. The first node's participants are notified.

**Alternate flows:**
- **A1:** Author selects a saved chain template (organization-defined per document type) — chain is pre-filled; author can adjust before submitting.
- **A2:** A participant is inactive (on leave with no substitute, or archived) — Devon refuses submission; surfaces the offending participant; author must fix.
- **A3:** Author submits without any participants — Devon refuses; chain must have at least one node.
- **A4:** Author wants to recall after submission — see UC-04a below.

### UC-04a: Recall document from chain

1. Author opens the in-review document.
2. Author chooses "Recall".
3. Devon prompts for confirmation and an optional reason.
4. On confirm, document returns to `draft`; chain participants are notified that the chain was recalled; audit log records the recall.

**Postconditions:**
- Document is in `in-review` state with a defined chain.
- First-node participants have notifications.
- Audit log records the routing event with the full chain composition.

**Acceptance criteria:**
- [ ] Chain validation catches inactive participants, missing signing authority, and empty chains.
- [ ] Notifications fire to the correct first-node participants within 5 seconds of submission.
- [ ] Audit log preserves the chain as it was at routing time (substitutions are logged separately).
- [ ] Recall returns the document to draft cleanly; subsequent re-routing creates a fresh chain (or resets the existing one — author's choice).

---

## UC-05: Sign document with ERI

**Actor:** Authorized signer (typically a Department Head or executive).

**Goal:** Apply a legally valid e-imzo (ERI) signature to a document.

**Preconditions:**
- Document is in `approved` state.
- User has signing authority for this document type.
- User has a valid ERI certificate.

**Main flow:**
1. Signer opens the approved document.
2. Signer chooses "Sign with ERI".
3. Devon displays the signing dialog with: document title, content preview, signer's certificate identity, who has already signed (if multi-sig chain).
4. Signer enters their PIN or presents their token.
5. Devon coordinates with the local PKI to apply the signature.
6. Devon attaches the signature to the document.
7. Document state transitions: if this is the last required signature, `approved` → `signed`. If more signatures are required, document remains `approved` with the new signature visible.
8. Audit log records the signature event with certificate fingerprint, document content hash, timestamp.
9. Notifications fire to the author and any subsequent signers.

**Alternate flows:**
- **A1:** Wrong PIN — signing fails with a clear message; no signature is applied; audit log records the failed attempt.
- **A2:** Certificate expired or revoked — signing fails; signer is shown the certificate's status; admin is informed.
- **A3:** Document content changed since approval — signing is blocked. Devon requires re-approval before signing.
- **A4:** PKI service unreachable — signing fails with a transient error; signer can retry; if persistent, admin is paged.

**Postconditions:**
- The document carries an authentic ERI signature visible to all viewers.
- The signature can be verified by any viewer.
- Audit log records the signing event.

**Acceptance criteria:**
- [ ] Signature application is atomic: either the signature is recorded and the document state advances, or nothing changes.
- [ ] Wrong PIN does not partially write any state.
- [ ] Audit log records: signer identity, certificate, content hash at signing time, timestamp.
- [ ] Once a document is `signed`, no role can delete it or modify its content (verified by attempting both as Super Admin — both must fail).
- [ ] Verification UI shows: signature valid / invalid, signed when, by whom, with which certificate.

---

## UC-06: Participate in an approval chain

**Actor:** Chain participant (any employee added to a chain as approver).

**Goal:** Review the document and record an explicit decision.

**Preconditions:**
- Document is in `in-review` state.
- User is at the current active node of the chain.

**Main flow:**
1. User receives notification that their action is required.
2. User opens the document from the notification or from their approvals queue.
3. User reads the document, the chain history (who has acted, what they said), and the author's cover note.
4. User chooses one action: **Approve**, **Approve with comment**, **Reject**.
5. If approving with comment or rejecting, user enters the comment / reason (required for Reject).
6. User submits.
7. Devon records the action.
8. If the user's action completes the current node, chain advances:
   - **All node participants Approved** → next node's participants are notified.
   - **Any node participant Rejected** → chain halts; document returns to author as `rejected`.
9. If the user's action does not complete the current node (parallel node, other participants still pending), chain waits.

**Alternate flows:**
- **A1:** User wants more information before deciding — they post a comment as a question (no decision yet); the author or a prior participant can respond in the comment thread.
- **A2:** User is on the chain but should not be (was added by mistake) — they can request removal; author must explicitly remove and re-route (logged).
- **A3:** User is on the chain but is on leave — substitute is auto-routed (per DP-1 in business-processes.md).
- **A4:** User submits Reject without a reason — UI requires the reason; submission is blocked until provided.

**Postconditions:**
- The user's action is permanently part of the document's chain history.
- The chain state advances or halts per the action.
- Notifications fire to relevant parties.

**Acceptance criteria:**
- [ ] Approve / Approve-with-comment / Reject all produce distinct, audited records.
- [ ] Reject without a reason is blocked at the UI and the API.
- [ ] Parallel nodes correctly require all participants' approval before advancing.
- [ ] A participant who is removed mid-chain (by author edit) sees the document disappear from their queue with a clear notification.

---

## UC-07: Assign a task

**Actor:** Department Head (or any user with task-assignment permission in scope).

**Goal:** Create a task and assign it to a subordinate with clear scope.

**Preconditions:**
- Assigner has the right to assign within their scope.
- Assignee is an active employee within the assigner's subtree.

**Main flow:**
1. Assigner opens the task module.
2. Assigner chooses "New task".
3. Assigner fills in: title, description, priority (High / Medium / Standard), deadline, assignee.
4. Assigner optionally attaches a document.
5. Assigner submits.
6. Devon creates the task in state `New`.
7. Assignee is notified (in-app + email + push if online).
8. Task appears on assignee's dashboard.

**Alternate flows:**
- **A1:** Assigner tries to assign to someone outside their subtree — Devon blocks unless an explicit cross-department assignment permission is in effect.
- **A2:** Deadline is in the past — Devon prompts to confirm or correct.
- **A3:** Assignee is on leave — task is created but a warning is shown ("Assignee is on leave until X"); assigner can proceed (the task waits) or pick someone else.

**Postconditions:**
- Task exists in `New` state.
- Audit log records the creation event with assignee, deadline, priority.

**Acceptance criteria:**
- [ ] Required fields (title, assignee, deadline) block submission when empty.
- [ ] Assigner cannot assign outside their authorized scope.
- [ ] Past-deadline confirmation prompt fires.
- [ ] Assignee receives notification within 5 seconds.

---

## UC-08: Submit task deliverable

**Actor:** Task assignee (employee).

**Goal:** Submit the result of an assigned task for review.

**Preconditions:**
- Task is in `New` or `In Progress` state and assigned to the user.

**Main flow:**
1. Assignee opens the task.
2. Assignee attaches the deliverable (file or document reference).
3. Assignee adds a written summary or note (optional but recommended for High-priority tasks).
4. Assignee submits.
5. Task state transitions to `Under Review`.
6. Assigner is notified.

**Alternate flows:**
- **A1:** Assignee submits without a deliverable — UI prompts for confirmation ("Submit without attachment?"); on confirm, allowed (some tasks are completed without an artifact).
- **A2:** Assignee replaces the deliverable before the manager reviews — Devon allows the replacement, logged in task history.

**Postconditions:**
- Task is in `Under Review`.
- Assigner has the deliverable in their review queue.
- Task history records the submission.

**Acceptance criteria:**
- [ ] Submission moves the task to Under Review.
- [ ] Replacement of deliverable before manager review is allowed and logged.
- [ ] No-attachment submission is allowed with explicit confirmation.

---

## UC-09: Review task deliverable

**Actor:** Task assigner (Department Head).

**Goal:** Decide whether the deliverable is acceptable and close the task or return it.

**Preconditions:**
- Task is in `Under Review` and was assigned by the user.

**Main flow:**
1. Assigner opens the task from their review queue.
2. Assigner reads the deliverable and any notes.
3. Assigner chooses one of: **Accept** / **Return for revision** / **Reject**.
4. If returning or rejecting, assigner enters the reason (required).
5. Assigner submits.
6. Devon records the action and transitions the task state.
7. Assignee is notified.

**Alternate flows:**
- **A1:** Assigner wants more time to review — they can leave the task in Under Review (no automatic timeout); their review queue surfaces tasks that have been pending too long.
- **A2:** Assigner accepts a deliverable that was submitted late — the late status remains on the task history for reporting purposes.

**Postconditions:**
- Task is in `Done` (accepted), `In Progress` (returned), or `Closed-rejected`.
- Audit log records the review action and reason.

**Acceptance criteria:**
- [ ] Accept moves task to Done; reject closes it; return moves it back to In Progress.
- [ ] Return and Reject both require a reason; UI and API enforce this.
- [ ] Late acceptance preserves the late record in task history.

---

## UC-10: Monitor department dashboard

**Actor:** Department Head.

**Goal:** Get a real-time view of the subtree's task and approval health.

**Preconditions:**
- User is authenticated and holds the Department Head role on at least one node.

**Main flow:**
1. User opens their dashboard.
2. User sees: task health (count by status, overdue count), approval pipeline (documents awaiting their action, documents they routed that are pending), employee load distribution, recent activity, inbound letters assigned to their subtree, overdue letters.
3. User can drill down on any card.

**Alternate flows:**
- **A1:** User holds Department Head on multiple nodes — dashboard shows a node-selector; metrics roll up appropriately.

**Postconditions:**
- View only; no state changes.

**Acceptance criteria:**
- [ ] All metrics update in real-time (within 30s of underlying state change).
- [ ] Drill-down from each card leads to the canonical filtered list.
- [ ] Sensitive details (e.g., confidential documents in subtree) are role-respecting.

---

## UC-11: Export document to PDF or Word

**Actor:** Any user with read permission on the document.

**Goal:** Generate a portable PDF or Word file of the document.

**Preconditions:**
- User can read the document.

**Main flow:**
1. User opens the document.
2. User chooses "Export" → PDF or Word.
3. Devon generates the export including: document content, current metadata, signature certificates (if signed), approval sheet (if applicable).
4. Devon delivers the file to the user.
5. Audit log records the export event.

**Alternate flows:**
- **A1:** Document is in `draft` — export marks the PDF clearly as "DRAFT" (watermark) to prevent confusion.
- **A2:** Document is confidential and user is not the author — export is allowed only if the user is on the chain or explicitly shared; the export is logged with that justification.

**Postconditions:**
- Audit log records: exporter, document, format, timestamp.

**Acceptance criteria:**
- [ ] Exported PDF for a signed document is byte-stable: re-exporting produces the same output for the same content (so signature verification continues to work against exports).
- [ ] Draft exports are watermarked.
- [ ] Confidentiality-respecting: a user who cannot read the document cannot export it.

---

## UC-12: Email a document

**Actor:** Any user with read permission on the document and email permission.

**Goal:** Send the document to one or more recipients via the organization's email gateway.

**Preconditions:**
- User has read access to the document.
- The organization's email gateway is configured and reachable.

**Main flow:**
1. User opens the document.
2. User chooses "Email".
3. User composes: recipients (internal autocompleted; external typed), subject (default = document title), body.
4. User selects attachment format (PDF default; Word optional).
5. User sends.
6. Devon enqueues the email; the email is sent through the gateway.
7. Audit log records the send event with recipients, format, timestamp.

**Alternate flows:**
- **A1:** Email gateway unreachable — send is queued; user is informed; retried on a schedule; if persistent, user receives a failure notification.
- **A2:** Recipient address invalid (bounced) — bounce is recorded; user is informed.

**Postconditions:**
- Document audit log records the send action.

**Acceptance criteria:**
- [ ] All recipients are logged.
- [ ] Bounces are recorded and surfaced to the sender.
- [ ] Sending a confidential document externally requires an explicit confirmation prompt.

---

## UC-13: Register an inbound letter

**Actor:** Devonxona / Registry employee.

**Goal:** Capture an inbound letter into Devon with full metadata so it can be tracked to closure.

**Preconditions:**
- User has registry role.

**Main flow:**
1. Registry employee scans / receives the letter.
2. Opens the inbound-letter registration form.
3. Fills: sender (name + address + organization if applicable), subject, date received, channel (postal / email / courier), attachments, language.
4. Optionally pre-classifies the letter (citizen petition / inter-agency / commercial / other) to drive routing.
5. Saves.
6. Devon assigns the inbound registration number per the configured scheme.
7. Letter is routed (per routing rules or manually) to the responsible Department Head.

**Alternate flows:**
- **A1:** Sender is anonymous (unsigned letter) — flagged for special handling; some categories of anonymous letters are rejected by policy.
- **A2:** Letter is in a language the org doesn't typically handle — flagged for translation.

**Postconditions:**
- Inbound letter exists in `registered` state.
- Responsible head has the letter in their queue.

**Acceptance criteria:**
- [ ] Registration number is unique and follows the configured scheme.
- [ ] All required fields are captured.
- [ ] The deadline (per letter category) is automatically computed and visible.

---

## UC-14: Respond to an inbound letter

**Actor:** Assigned executor.

**Goal:** Prepare and route a response to an inbound letter.

**Preconditions:**
- Inbound letter is assigned to the user as executor.
- Letter status is `assigned` or `in-progress`.

**Main flow:**
1. Executor reads the inbound letter.
2. Executor creates a response document (using a template appropriate to the letter category).
3. Devon links the response to the inbound letter automatically.
4. Executor drafts the response.
5. Executor routes the response through the appropriate approval chain (typically: executor → sub-unit head → department head → signer).
6. Once approved and signed, the response moves to outbound dispatch (UC-15).

**Alternate flows:**
- **A1:** No response required (letter is informational or routed in error) — executor records the resolution and routes back to the sub-unit head, who marks the inbound letter `closed-without-response` with the reason.
- **A2:** Letter requires research that won't complete by the deadline — executor requests a deadline extension; this requires Department Head approval; the requesting itself is logged.

**Postconditions:**
- Either a response is in the dispatch pipeline, OR the letter is closed without response with documented reason.
- All actions are logged.

**Acceptance criteria:**
- [ ] Response document is permanently linked to the inbound letter.
- [ ] Deadline extension requires approval; the extension is logged.
- [ ] Closed-without-response state requires a reason.

---

## UC-15: Dispatch an outbound letter

**Actor:** Devonxona / Registry employee.

**Goal:** Finalize the outbound number, prepare the dispatch package, and send the response through the appropriate channel.

**Preconditions:**
- A signed response is linked to an inbound letter, OR a standalone outbound letter is ready for dispatch.
- The outbound letter has not yet been dispatched.

**Main flow:**
1. Registry opens the outbound letter.
2. Confirms the recipient details and selects the dispatch channel (email / postal / courier).
3. Reviews the dispatch package: signed PDF + signature certificate + cover information.
4. Confirms dispatch.
5. Devon assigns the outbound registration number.
6. Devon executes the dispatch (email is sent through the gateway; postal/courier generates a print package and a chain-of-custody entry).
7. Devon updates the inbound letter (if applicable) to `responded`; the response status moves to `dispatched`; the inbound letter moves to `closed` once the outbound is dispatched.

**Alternate flows:**
- **A1:** Email bounce — registry is notified; alternative channel is attempted.
- **A2:** Postal failure (returned mail) — recorded; alternative channel attempted.

**Postconditions:**
- Outbound letter has a registration number and is in `dispatched` state.
- The linked inbound letter is closed.
- Audit log records the dispatch.

**Acceptance criteria:**
- [ ] Outbound number is unique and follows the scheme.
- [ ] Dispatch package contains the signed PDF, the signature certificate, and any required cover.
- [ ] Channel-specific dispatch (email send / print package / courier handoff) succeeds or fails verifiably.

---

## UC-16: Manage organizational structure

**Actor:** Super Admin.

**Goal:** Create, edit, merge, split, or dissolve nodes in the org tree.

**Preconditions:**
- User is Super Admin.

**Main flow:**
1. Super Admin opens the org tree view.
2. Chooses an operation: create node / edit node / move node / merge / split / dissolve.
3. Provides the operation's parameters (e.g., for a merge: source node, target node, what happens to employees).
4. Reviews the operation's impact preview (how many employees affected, which heads, which open documents/tasks/letters).
5. Confirms.
6. Devon applies the operation.
7. Audit log records the operation with full before/after snapshot.

**Alternate flows:**
- **A1:** Operation would leave employees orphaned (no department) — Devon blocks; admin must specify where they go.
- **A2:** Operation would leave a node without a head — Devon allows it but flags it; the node cannot have new documents routed to it as a node until a head is assigned.

**Postconditions:**
- Org tree reflects the operation.
- Historical documents/tasks retain their original org attribution; future actions route through the new structure.

**Acceptance criteria:**
- [ ] Impact preview is accurate.
- [ ] Audit log captures the full before/after snapshot.
- [ ] Operations are atomic: either the whole operation succeeds, or none of it applies.

---

## UC-17: Create and onboard employee

**Actor:** HR + Admin.

**Goal:** Get a new hire from "first day" to "productive in Devon" within one business day.

**Preconditions:**
- The hire's employment paperwork is complete in the organization's HR system.

**Main flow:**
1. HR opens the employee-creation form.
2. Fills in: name, position, department (drill-down through the four-level org tree), email, phone, internal extension.
3. Attaches the position instructions ("lavozim yo'riqnomasi").
4. Saves.
5. Devon creates the profile in `pending-first-login` state.
6. Devon issues a one-time password.
7. HR communicates the credentials to the new hire (via the organization's standard onboarding channel).
8. New hire logs in (UC-01 A3 forces password change).
9. New hire reviews their profile (UC-02).
10. New hire confirms profile or requests corrections.
11. Profile transitions to `active`.

**Alternate flows:**
- **A1:** The new hire is rejoining (was archived previously) — Devon flags the name match; admin reviews; a new profile is created (no record reuse); audit log links the records.

**Postconditions:**
- Employee profile is active.
- Employee can be assigned tasks, added to chains, signed in as.

**Acceptance criteria:**
- [ ] From HR submit to employee active: ≤ 1 business day median.
- [ ] One-time password is single-use and expires after a configurable window.
- [ ] Position instructions are attached and retrievable.

---

## UC-18: Nightly archival of finalized documents

**Actor:** System (Devon's scheduler).

**Goal:** Move documents in terminal states out of the active working set into the archive.

**Preconditions:**
- The scheduler is running.
- It is the configured archival time (default 02:00 local).

**Main flow:**
1. Scheduler enumerates all documents that entered `signed` or `closed` state in the prior 24h.
2. For each, generate the final PDF (content + signatures + approval sheet + audit summary).
3. Move the document's state to `archived`.
4. Add the document and its archive PDF to the archive store.
5. Index it for search (still findable).
6. Notify the IT admin channel with the summary (count archived, total size).

**Alternate flows:**
- **A1:** Archival fails for a specific document (storage error, signature verification fails) — that document is left in its prior state; the failure is logged loudly; admin must investigate. Other documents are not blocked.
- **A2:** Scheduler is down at the configured time — on next run, archival catches up.

**Postconditions:**
- All eligible documents are in the archive.
- Audit log records each archival event.

**Acceptance criteria:**
- [ ] Archival is idempotent (running twice produces the same result).
- [ ] Archived documents remain searchable and viewable.
- [ ] Failures don't cascade.

---

## UC-19: Nightly system backup

**Actor:** System.

**Goal:** Produce an encrypted off-system backup of the full state.

**Preconditions:**
- It is the configured backup time.
- Backup storage is reachable.

**Main flow:**
1. Scheduler initiates database snapshot.
2. Scheduler initiates file-storage snapshot.
3. Scheduler initiates audit-log snapshot.
4. All three are encrypted with the organization's backup key.
5. The encrypted bundle is written to backup storage.
6. Rotation: delete backups older than 30 daily / 12 weekly / 24 monthly.
7. Admin notification: success or failure.

**Alternate flows:**
- **A1:** Backup storage full — backup fails; admin is paged immediately (this is critical).
- **A2:** Encryption key missing or unreadable — same: critical failure, admin paged.
- **A3:** Database is mid-write during snapshot — Devon uses consistent-snapshot mechanisms so this is not a corruption risk; if the snapshot would fail consistency, it retries.

**Postconditions:**
- A new backup exists.
- Rotation is enforced.
- Notification was sent.

**Acceptance criteria:**
- [ ] Backup is restorable end-to-end (verified monthly per `docs/operations/recovery.md`).
- [ ] Critical failures page the admin within 5 minutes.
- [ ] Rotation is enforced.

---

## UC-20: Read audit log for a document

**Actor:** Authorized viewer (the author, a chain participant, the Department Head with subtree access, Super Admin, or an external auditor with the audit-read role).

**Goal:** Reconstruct the complete history of actions on a document.

**Preconditions:**
- User can read the document.
- User's role permits audit-log read for this scope.

**Main flow:**
1. User opens the document.
2. User chooses "History" or "Audit log".
3. Devon displays the chronological list of all events on the document: creation, edits, sharings, approval actions, comments, signatures, exports, dispatches, archival.
4. Each event shows actor, action, timestamp, before/after where applicable, comment if any.
5. User can filter (by actor, action class, time range) and export the filtered list as CSV or PDF.

**Alternate flows:**
- **A1:** User attempts to read audit for a document they cannot read — denied; the denial itself is logged.

**Postconditions:**
- View only; no changes.
- The audit-read event is itself logged (audit reads on confidential documents are themselves audited).

**Acceptance criteria:**
- [ ] Every state-changing action on the document appears.
- [ ] No event is missing actor, action, or timestamp.
- [ ] Filtering and export work; exported list matches what's displayed.
- [ ] Audit reads on confidential documents are themselves logged.

---

## Cross-references

- The business processes that invoke these use cases: [business-processes.md](./business-processes.md)
- The modules and capabilities each use case depends on: [product-specification.md](./product-specification.md)
- Uzbek terminology used throughout: [glossary.md](./glossary.md)
