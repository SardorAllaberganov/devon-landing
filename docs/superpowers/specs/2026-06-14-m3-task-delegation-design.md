# Milestone 3 — Task Delegation (BPMN 3.2 / BP-2) — Design Spec

> **Status:** design approved 2026-06-14, pending implementation plan.
> **Source of truth:** BPMN 3.2 [`docs/bpmn/bp2-vazifa-taqsimoti.png`](../../bpmn/bp2-vazifa-taqsimoti.png) · [`docs/business-processes.md`](../../business-processes.md) §BP-2 · [`docs/product-specification.md`](../../product-specification.md) §4.5 · [`docs/use-cases.md`](../../use-cases.md) UC-07/08/09.
> If this spec conflicts with a `docs/` source, the doc wins — fix the doc first (per CLAUDE.md).

## 1. Goal & scope

Build **Module 5 — Task Delegation** as a complete, demonstrable BP-2 flow in the dashboard demo, at full parity with how Milestones 1 and 2 shipped. A manager (Rahbar / Bo'lim boshlig'i) assigns work to a subordinate with clear scope + deadline; the assignee executes and submits a deliverable; the manager reviews and closes the task with an explicit outcome. The full clarification round-trip, deliverable review (Accept / Accept-with-note / Return / Reject), notifications, audit trail, and lightweight manager/employee dashboards are all in scope.

**Decisions locked during brainstorming (2026-06-14):**

| Decision | Choice |
|---|---|
| Depth | **Full BP-2**, parity with M2 (domain + policy + Kanban + detail/lifecycle + dashboards + notifications + audit). |
| Build artifact | **Spec + implementation plan only** — no new `docs/dashboard-prompts/` step files. Doc cascade on completion. |
| Assignee cardinality | **Single assignee.** Reconcile the BPMN "Xodim yoki **xodimlarga**" (multiple) wording to singular in `business-processes.md`; UC-07/08/09 + product-spec §4.5 (already singular) win. |
| Task surface | **Approach A — Kanban-centric + detail drawer.** `/tasks` is the drag-and-drop board (policy-gated moves); `/tasks/:uuid` detail for actions needing input; manager analytics as a collapsible band, not a charting subsystem. |
| Git | **No commit until the user runs `/commit`** (standing project rule). |

**Out of scope** (deferred / consistent with M2): real backend, real file storage, automated test suite (verification is the scripted node harness + adversarial review, as in M2), background scheduler — so live "deadline approaching / deadline missed" notifications do **not** fire (overdue is a computed UI indicator instead). Multi-assignee tasks are a post-v1 enhancement.

## 2. Domain model (`dashboard/src/types/domain.ts` + zod mirrors in `mock-backend/schemas.ts`)

### 2.1 Status machine

```
NEW ──start──▶ IN_PROGRESS ──submit──▶ UNDER_REVIEW ──accept──▶ DONE
                    ▲                         │
                    └──────return─────────────┤
                                              └──reject──▶ REJECTED (terminal)
```

- `NEW · IN_PROGRESS · UNDER_REVIEW · DONE` map 1:1 to product-spec §4.5's four canonical Kanban columns.
- `REJECTED` = UC-09's "Closed-rejected" terminal state. It renders **inside the Done column** with a destructive "Rad etilgan" badge + icon (board stays 4 columns; never color-alone per accessibility).
- The clarification round-trip (BP-2 steps 5–7) does **not** change status — it is a comment exchange while the task sits in `NEW`/`IN_PROGRESS`.
- `round` increments on each return-for-revision → resubmit cycle (mirrors `DocumentEntity.round`).
- `DONE` and `REJECTED` are terminal: no mutation (including new comments) is permitted on a terminal task.

### 2.2 Types

```ts
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'STANDARD';

export type TaskStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'DONE'
  | 'REJECTED';

export type TaskCommentKind =
  | 'CLARIFICATION_REQUEST'   // assignee → manager (BP-2 6.1)
  | 'CLARIFICATION_REPLY'     // manager → assignee (BP-2 7)
  | 'RETURN_FEEDBACK'         // manager, return-for-revision reason (BP-2 10.2)
  | 'REJECT_REASON'           // manager, reject reason (§4.5)
  | 'NOTE';                   // accept-with-note free text

export interface TaskComment {
  uuid: string;
  authorUuid: string;         // employee uuid
  kind: TaskCommentKind;
  body: string;
  createdAt: string;
}

export interface TaskDeliverable {
  summary: string;            // written summary (optional content; see UC-08 A1)
  file?: FileMeta;            // metadata-only attachment (reuses the M2 FileMeta)
  documentUuid?: string;      // OR a reference to an existing DocumentEntity
  submittedAt: string;
}

export interface TaskEntity {
  uuid: string;
  number: string;             // auto-numbered 'TOP-2026/NNNN' (topshiriq; year hardcoded per master §17)
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignerUuid: string;       // manager (Rahbar / Bo'lim boshlig'i) — employee uuid
  assigneeUuid: string;       // single subordinate — must be in the assigner's subtree
  deadline: string;           // ISO date
  attachedDocumentUuid?: string;  // optional related document (spec: "attach related documents")
  attachedFile?: FileMeta;        // OR a metadata-only file at creation
  deliverable?: TaskDeliverable;  // set on first submit; replaceable while UNDER_REVIEW
  reviewNote?: string;            // accept-with-note text (return/reject reasons live in comments)
  comments: TaskComment[];        // embedded chronological clarification + feedback thread
  round: number;                  // increments on return → resubmit
  lateSubmission?: boolean;       // true if submitted after deadline (UC-09 A2 — kept in history)
  startedAt?: string;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Model decisions

- **Single assignee** — `assigneeUuid` scalar.
- **Embedded comment thread** — `comments: TaskComment[]` on the task (like `viewedBy`/`emailedTo` on `DocumentEntity`); no separate table. Carries the clarification loop + return/reject reasons as typed entries. Return/reject reasons are stored as `RETURN_FEEDBACK` / `REJECT_REASON` comments (so the thread is the single chronological record); `reviewNote` holds only accept-with-note text.
- **Deliverable** reuses `FileMeta` (metadata-only, no bytes) **plus** an optional `documentUuid` reference to a real seeded `DocumentEntity`, honoring §4.5's "file, a document reference, or a written summary."
- **Overdue is computed, not stored** — `isTaskOverdue(task)` exported (`deadline < today AND status ∉ {DONE, REJECTED}`), mirroring `isLetterOverdue`.

## 3. Mock-backend (`dashboard/src/lib/mock-backend/`)

Follows the M2 pattern exactly: a typed validation error enforced against the **acting employee uuid** inside every mutation; audit + notification wiring per transition; `maybeFail()` on mutations only (never on reads or `appendNotification`). New `tasks` localStorage table under the `devon.dashboard.*` namespace.

### 3.1 Policy — `TaskValidationError` (`mock-backend/errors.ts`)

| code | guard |
|---|---|
| `not-assigner` | only the task's `assignerUuid` may edit / review / answer-clarification / extend-deadline |
| `not-assignee` | only the task's `assigneeUuid` may start / submit / request-clarification |
| `out-of-scope` | at creation, the assignee's unit `path` must start with one of the assigner's `headedUnitUuids` (subtree membership; UC-07 A1). Mirrors the letter-executor subtree rule. |
| `wrong-status` | the requested transition is invalid from the task's current status |
| `reason-required` | return & reject require a non-empty reason; clarification request/reply require a non-empty body |
| `self-assign` | a manager may not assign a task to themselves (keeps the two-actor loop honest) |

Localized toasts at `dashboard:tasks.errors.*`. Terminal-task immutability is enforced in the policy layer, not the UI.

### 3.2 Reads (`mock-backend/index.ts`)

- `listTasks({ box, status?, priority?, overdueOnly?, search? }, actingUuid)` — `box: 'assigned-by-me' | 'assigned-to-me'`; search over `number` + `title`.
- `getTask(uuid)` → composed `TaskDetail` (resolved assigner/assignee FIO + position, attached-document summary, comments with author names, deliverable).
- `getTaskStats(actingUuid)` → `{ byStatus, overdueCount, loadPerAssignee }` for the manager band (load = open-task count per assignee within the subtree).
- `isTaskOverdue(task)` exported (shared by board, cards, stats, harness).

### 3.3 Mutations

Each: policy-check → `maybeFail()` → mutate + `updatedAt` → audit → notify.

| mutation | actor | transition | notifies | audit action |
|---|---|---|---|---|
| `createTask` | assigner | → `NEW` (auto-number `TOP-2026/NNNN`) | assignee | `TASK_CREATED` |
| `updateTask` | assigner | scope / priority / deadline edit while non-terminal; deadline change recorded in `context` | assignee | `TASK_UPDATED` |
| `startTask` | assignee | `NEW → IN_PROGRESS` | — | `TASK_STARTED` |
| `requestClarification` | assignee | + `CLARIFICATION_REQUEST` comment (non-terminal) | assigner | `TASK_CLARIFICATION_REQUESTED` |
| `answerClarification` | assigner | + `CLARIFICATION_REPLY` comment | assignee | `TASK_CLARIFICATION_ANSWERED` |
| `submitDeliverable` | assignee | `IN_PROGRESS → UNDER_REVIEW` (sets `deliverable`, `lateSubmission` if past deadline); re-callable while `UNDER_REVIEW` to replace (UC-08 A2, logged) | assigner | `TASK_SUBMITTED` |
| `reviewTask` | assigner | `UNDER_REVIEW →` `DONE` \| `IN_PROGRESS`(round++) \| `REJECTED` | assignee | `TASK_ACCEPTED` / `TASK_RETURNED` / `TASK_REJECTED` |

`reviewTask(uuid, { decision, note?/reason? }, actingUuid)` with `decision: 'ACCEPT' | 'ACCEPT_WITH_NOTE' | 'RETURN' | 'REJECT'` (the four §4.5 acceptance variants). `ACCEPT`/`ACCEPT_WITH_NOTE` → `DONE` (note → `reviewNote` + a `NOTE` comment); `RETURN` → `IN_PROGRESS`, `round++`, required reason → `RETURN_FEEDBACK` comment; `REJECT` → `REJECTED`, required reason → `REJECT_REASON` comment. Deadline extension folds into `updateTask` (`context.kind = 'deadline'`).

### 3.4 Drag-and-drop semantics (board)

Drag is the affordance; every move is re-validated by the policy layer. Invalid drag → snap back + localized toast (the `CertificatesKanban` pattern).

| drag | behavior |
|---|---|
| `NEW → IN_PROGRESS` | assignee only → `startTask` directly |
| `IN_PROGRESS → UNDER_REVIEW` | needs a deliverable → drag **opens `SubmitDeliverableDialog`**; cancel snaps back |
| `UNDER_REVIEW → DONE` | assigner only → drag **opens `ReviewDialog`** (accept path preselected) |
| `UNDER_REVIEW → IN_PROGRESS` | assigner only → drag **opens `ReviewDialog`** (return path, reason required) |
| any disallowed move | snap back + localized toast |

Reject (terminal) is not a drag target — it is a `ReviewDialog` option reached via the detail action bar / card menu.

## 4. UI surfaces (`dashboard/src/features/tasks/`)

### 4.1 Routing & navigation

- Sidebar: add **Topshiriqlar** (`/tasks`, `ListTodo` lucide icon) to the management nav group.
- Routes (`router.tsx`): `/tasks` (board) + `/tasks/:uuid` (detail), both under `Protected`. These resolve the `resourceType: 'task'` bell deep-links that otherwise fall through the `*` catch-all to home.

### 4.2 `/tasks` — Kanban board

Persona-scoped via `useActingEmployee()`.

- **Box toggle** — "Menga biriktirilgan" (assigned-to-me) ⇄ "Men bergan" (assigned-by-me). Managers default to *assigned-by-me*; plain employees see only *assigned-to-me* (toggle hidden). HR_ADMIN is not a line manager in the seed — defaults to assigned-to-me with the toggle available if they have assigned anything.
- **Manager stats band** (collapsible; rendered only when the acting persona is an assigner with ≥1 assigned task): counts by status · overdue count · load-per-employee chips. No charting library (YAGNI for a demo).
- **Board** (`TasksKanban`, desktop ≥lg) — 4 columns with `@dnd-kit` (already installed, step 12), tinted header bands + count badges, same skeleton as `CertificatesKanban`. `TaskCard` = number + title + priority chip (High visually prominent) + deadline (overdue → destructive text + `AlertTriangle` + sr-only label) + counterpart avatar + status. Rejected tasks render in Done with a "Rad etilgan" badge.
- **Mobile** (`TasksTabsMobile`, <lg) — underline tabs, one column at a time (certs-Kanban mobile pattern; touch DnD is fragile — documented limitation).
- **Filters** — priority `Select` + overdue toggle chip + `SearchInput` (inline on `md+`; bottom-sheet draft-Apply-Reset below).
- **`CreateTaskDialog`** (`ResponsiveDialog`, single form — not a wizard): title · description · priority · deadline (past-deadline confirm, UC-07 A2) · assignee `Combobox` **client-side filtered to the assigner's subtree** (mirrors backend scope; on-leave assignee shows an inline warning per UC-07 A3) · optional attached document/file (`MetaFileField` or a document `Combobox`). CTA + dialog visible only to assigner personas; opened directly or via `/tasks?create=1`.

### 4.3 `/tasks/:uuid` — detail page

Re-resolves on POV switch (`actingUuid` in fetch deps), mirroring document/letter detail.

- **Hero**: number + title + `StatusBadge` + priority badge + overdue treatment.
- **`TaskActions`** (persona-aware; the policy layer re-validates):
  - assignee · `NEW` → **Boshlash** (start); `IN_PROGRESS` → **Topshirish** (submit) + **Izoh so'rash** (clarify);
  - assigner · `UNDER_REVIEW` → **Qabul qilish / Izoh bilan qabul / Qaytarish / Rad etish**; non-terminal → **Tahrirlash** + **Muddatni uzaytirish**; open clarification → **Javob berish**;
  - non-actor → "Hozir {FIO} navbati" hint; terminal → muted closing line.
- **Layout** `lg:grid-cols-3`: left = description + deliverable card + **`TaskCommentThread`** (chronological, kind-badged, AssignmentTimeline rail vocabulary); right = metadata (assigner / assignee / deadline / priority / round / late flag) + attached-document card (links `/documents/:uuid`) + review-outcome card.
- **Dialogs**: `SubmitDeliverableDialog` (summary + file-or-document-ref; no-attachment submit allowed with explicit confirm, UC-08 A1), `ReviewDialog` (4-variant radio, conditional required reason for return/reject), `ClarificationDialog` (request + reply share it), `EditTaskDialog`, `ExtendDeadlineDialog`.

### 4.4 Home integration (`features/dashboard-home/`)

- `StatsRow` stays at its current 6 cards (already full per step 22 — do not expand further).
- `QuickActions` → add **"Topshiriq berish"** tile (`/tasks?create=1`), visible to assigner personas (the "don't render controls irrelevant to the role" admin pattern).
- New persona-aware home alert (`PendingTasksAlert`, beside `ExpiringCertsAlert` + `PendingApprovalsAlert`): **"Sizda N ta topshiriq ko'rib chiqishni kutmoqda"** (manager has Under-Review tasks) / **"Sizga N ta faol topshiriq"** (assignee's open tasks) → `/tasks`. Null when zero; re-resolves on POV switch (+ a `useQueueStore`-style bump if a task store is added, otherwise a refetch on focus/POV change).

### 4.5 Shared primitives reused

`StatusBadge` (+ `NEW`/`UNDER_REVIEW`/`DONE` kinds; `IN_PROGRESS` + `REJECTED` already exist, shared with letters/documents), `ResponsiveDialog`, `Combobox`, `MetaFileField`, `SearchInput`, `Pagination`, `AssignmentTimeline` rail, `@dnd-kit`.

## 5. Cross-cutting extensions

- **`AuditAction`** += `TASK_CREATED · TASK_UPDATED · TASK_STARTED · TASK_CLARIFICATION_REQUESTED · TASK_CLARIFICATION_ANSWERED · TASK_SUBMITTED · TASK_ACCEPTED · TASK_RETURNED · TASK_REJECTED` (9). Deadline-extend reuses `TASK_UPDATED` (`context.kind='deadline'`). Uz verbs added.
- **`AuditResourceType`** += `'task'`; the `/audit` resourceType filter gains it.
- **`NotificationType`** += `TASK_ASSIGNED · TASK_CLARIFICATION_REQUESTED · TASK_CLARIFICATION_ANSWERED · TASK_SUBMITTED · TASK_ACCEPTED · TASK_RETURNED · TASK_REJECTED` (7). `AppNotification.resourceType` += `'task'`; bell deep-links `/tasks/:uuid`. Title keys at `dashboard:notifications.title.TASK_*`.
- **`lib/audit-icons.ts`** (`Record<AuditAction, LucideIcon>`, compile-time exhaustive) gains all 9 task actions with distinct lucide glyphs.
- **`StatusBadge`** gains `NEW` / `UNDER_REVIEW` / `DONE` task kinds (tone + icon); `IN_PROGRESS` + `REJECTED` already exist (shared with letters/documents) and are reused. `common:status.*` gains `new` / `under-review` / `done` (the `in-progress` + `rejected` keys already exist).
- **i18n** — `dashboard:tasks.*` (board, columns, card, detail, actions, dialogs, errors), `common:status.*` task kinds, `dashboard:notifications.title.TASK_*` (7), audit verbs (9), home keys. **UZ only** (RU/EN fall back per the v1.1 roadmap). No `[NEEDS_TRANSLATION]` placeholders.
- Zod mirrors for every new type/enum in `mock-backend/schemas.ts`.

## 6. Seed (`mock-backend/seed.ts`)

- `SEED_VERSION '10' → '11'` (identity-changing — new table + rows).
- New `tasks` table; **~12 tasks, all within the IT Departament subtree** so the POV personas own every action:
  - **Akhmedov (BOLIM_BOSHLIGI) → Sobirova (XODIM)** — the main chain: at least one task in each of NEW / IN_PROGRESS / UNDER_REVIEW / DONE, plus one **overdue High-priority**, one with an **open clarification thread**, one **returned (round 2)**, one **rejected**, one **accepted-late** (preserves the late record).
  - **Karimov (RAHBAR) → Akhmedov (BOLIM_BOSHLIGI)** — a couple, so RAHBAR's board + review queue are non-empty.
  - One task carries an `attachedDocumentUuid` → a seeded `DocumentEntity`; one task's deliverable is a `documentUuid` reference.
  - At least one `UNDER_REVIEW` task so the manager review queue (and the home `PendingTasksAlert`) is non-empty for the manager personas, and at least one open task assigned to XODIM so the assignee alert is non-empty.
- **`buildTaskAudit(tasks, employees, units)`** emits the BP-2 audit trail per seeded task (mirrors `buildLetterAudit`): reproduces each mutation's action + `context` shape, timestamps linearly spaced across `createdAt → updatedAt`, merged into the audit table + re-sorted newest-first.
- ~12 seeded task notifications spread across personas (mix read/unread), each resolving to a real seeded task.

## 7. Verification (per CLAUDE.md "Verification Before Done" — the M2 standard)

- `npm run build` clean; `tsc --noEmit` clean; ESLint clean except the tolerated `set-state-in-effect` idiom clones (dialog-draft-reset, list-reset-before-fetch).
- Scripted i18n audit: every referenced key resolves; no Cyrillic / hardcoded-toast / `PLYMA`/`PLYMO` / tech-stack leaks.
- Route sweep: all routes 200, incl. `/tasks` + `/tasks/:uuid`; dev cold-boot console error-free.
- **Node harness over the real backend** (rolldown-bundled, localStorage shim, `@/` alias, flake-retry — the M2 harness pattern): seed shape + anchors; scope guard (`out-of-scope`); full BP-2 walk (create → start → request-clarification → answer → submit → return-round-2 → resubmit → accept; reject path; accept-with-note path); wrong-persona **and** wrong-status guards per hop; overdue computation; late-submission flag; **exactly one audit entry per transition**; **append-only audit**; notifications to the correct persona at each hop; `TOP-` counter continues past the seed.
- **Adversarial multi-dimension diff review** with per-finding skeptic verification (correctness/policy · status-machine · a11y/i18n · reuse/react) — the M2 close-out ritual; fix confirmed findings.
- CLAUDE.md security discipline re-checked: audit completeness (who/what/when/from-where), policy enforcement at the layer (not UI-hiding alone), terminal-task immutability, role/scope visibility.
- Observational sweep (six viewports 360/390/768/1024/1280/1920, touch-drag caveat, keyboard, reduced-motion, focus/contrast) handed to the human operator in `dashboard/QA_NOTES.md` "Milestone 3 QA".

## 8. Doc cascade (on completion, same change-set)

- `README.md` — Module 5 marked shipped; roadmap reflects M3 complete.
- `docs/business-processes.md` — BP-2 gains a **Demo** line (routes + persona walk); **reconcile the BPMN "Xodim yoki xodimlarga" wording to single assignee** in the text (note the PNG's literal wording is superseded by the canonical text per CLAUDE.md "fix the doc first").
- `docs/use-cases.md` — UC-07 / UC-08 / UC-09 demo-coverage table flips ⬜ → ✅ with the `/tasks` routes.
- `docs/product-specification.md` §4.5 — confirm aligned (already single-assignee; no edit expected).
- `docs/glossary.md` — add **Topshiriq** (task) term.
- `docs/bpmn/README.md` — BP-2 milestone column → shipped.
- `ai_context/AI_CONTEXT.md` — module status (Module 5 shipped), seed contents, build state, M3 paragraph, `SEED_VERSION` `'11'`.
- `ai_context/HISTORY.md` — M3 work entry (date, summary, files).
- `ai_context/LESSONS.md` — any new trap surfaced during build.
- **No git commit** until the user runs `/commit`.

## 9. Risks / watch-items

- **Drag + policy + dialog interplay** — dragging to a column that opens a dialog (submit / review) must snap the card back if the dialog is cancelled, and only commit the move on dialog success. The certs Kanban opens a confirmation but its moves are single-call; tasks add a form in between. Implement the optimistic move + rollback-on-cancel carefully; cover it in the harness where possible (the mutation layer) and the observational sweep (the drag itself).
- **Box-toggle scoping correctness** — assigned-by-me vs assigned-to-me must be derived from the acting persona, not the session user, so POV switches re-scope the board.
- **Terminal immutability** — ensure no comment/edit path mutates a `DONE`/`REJECTED` task (policy-layer guard + harness assertion).
- **Home crowding** — `StatsRow` is full at 6; the task surfacing is a quick-action + a null-able alert, not a 7th card.
