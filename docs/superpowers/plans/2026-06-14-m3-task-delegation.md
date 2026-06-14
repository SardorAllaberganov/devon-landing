# Milestone 3 — Task Delegation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Module 5 — Task Delegation (BPMN 3.2 / BP-2) as a complete, demonstrable Kanban flow in the Devon dashboard demo, at full parity with Milestones 1 & 2.

**Architecture:** A new `tasks` domain in the localStorage-backed mock backend (typed entities, policy-gated mutations against the acting persona, audit + notification wiring), surfaced as a `@dnd-kit` Kanban board at `/tasks` + a lifecycle detail page at `/tasks/:uuid`. Single assignee per task; four canonical columns (New → In Progress → Under Review → Done) plus a terminal Rejected state; drag is the affordance but every move is policy-validated and input-bearing moves open a dialog.

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 + Tailwind v4 + shadcn/ui + react-router-dom v6 + Zustand + react-hook-form + zod + react-i18next + date-fns + lucide-react + @dnd-kit (all already installed).

**Spec:** [`docs/superpowers/specs/2026-06-14-m3-task-delegation-design.md`](../specs/2026-06-14-m3-task-delegation-design.md).

---

## How this project verifies (read before starting)

Devon's dashboard demo has **no unit-test runner** (deliberately out of scope per master §17). The TDD "write failing test → implement → pass" loop is satisfied by the project's established substitute, used through all of M1/M2:

- **Backend logic** (types, policy, mutations, reads, seed) → a **rolldown-bundled node harness** with a `localStorage` shim that imports the *real* backend and asserts behavior. This is the "test" — write the assertions first (they fail because the function doesn't exist), then implement until the harness is green. Built in **Task 6** and re-run after every later backend change.
- **Everything** → `npm run build` (runs `tsc -b` then `vite build`), `npm run lint` (ESLint), a scripted **i18n audit** (every referenced key resolves; no Cyrillic / hardcoded-toast / `PLYMA` leaks), and a **route sweep** (all routes 200).
- **UI** → build + lint + route sweep + the observational sweep handed to the human operator (`QA_NOTES.md`).

Each backend task therefore ends with `npx tsc --noEmit` (fast type check); behavioral verification is the harness in Task 6. Each UI task ends with `npm run build` + `npm run lint`.

## Commit policy (project rule — overrides "frequent commits")

**Do NOT run `git commit`.** The standing project rule is: never git-commit in the Devon repo until the user runs `/commit`; leave changes in the working tree. Every task below ends with a **Checkpoint** step (run verification, leave changes staged-or-unstaged in the tree) instead of a commit. The user commits the whole milestone (or logical chunks) via `/commit` when ready.

## File map

**Backend (mock-backend appends follow the documents/letters precedent — all in `index.ts`):**
- Modify `dashboard/src/types/domain.ts` — Task types + `AuditAction`/`AuditResourceType`/`NotificationType`/`AppNotification.resourceType` extensions.
- Modify `dashboard/src/lib/mock-backend/schemas.ts` — zod mirrors.
- Modify `dashboard/src/lib/mock-backend/errors.ts` — `TaskValidationError` + `TaskValidationCode`.
- Modify `dashboard/src/lib/mock-backend/storage.ts` — `Tables.tasks`.
- Modify `dashboard/src/lib/mock-backend/index.ts` — reads, mutations, `isTaskOverdue`.
- Modify `dashboard/src/lib/mock-backend/seed.ts` — task fixtures, `buildTaskAudit`, seeded notifications, `SEED_VERSION`.

**UI (`dashboard/src/features/tasks/`):**
- `TasksPage.tsx` · `TasksKanban.tsx` · `TasksTabsMobile.tsx` · `TaskCard.tsx` · `TaskFilters.tsx` · `TaskStatsBand.tsx` · `CreateTaskDialog.tsx` · `task.schema.ts` · `taskErrors.ts`
- `detail/TaskDetailPage.tsx` · `detail/TaskActions.tsx` · `detail/TaskCommentThread.tsx` · `detail/SubmitDeliverableDialog.tsx` · `detail/ReviewDialog.tsx` · `detail/ClarificationDialog.tsx` · `detail/EditTaskDialog.tsx` · `detail/ExtendDeadlineDialog.tsx`

**Shared / cross-cutting:**
- Modify `dashboard/src/components/common/StatusBadge.tsx` — `NEW`/`UNDER_REVIEW`/`DONE` kinds.
- Modify `dashboard/src/lib/audit-icons.ts` — 9 task actions.
- Modify `dashboard/src/components/layout/Sidebar.tsx` — `Topshiriqlar` nav item.
- Modify `dashboard/src/router.tsx` — `/tasks` + `/tasks/:uuid`.
- Modify `dashboard/src/features/dashboard-home/{QuickActions,DashboardHome}.tsx` + new `PendingTasksAlert.tsx`.
- Modify `dashboard/src/i18n/locales/uz.json` — all keys (UZ only; RU/EN fall back).

**Docs (Task 17):** `README.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `docs/bpmn/README.md`, `ai_context/{AI_CONTEXT,HISTORY,LESSONS}.md`.

---

## Task 1: Domain types + enum extensions

**Files:**
- Modify: `dashboard/src/types/domain.ts` (append a Task section near the end; extend the existing `AuditAction`, `AuditResourceType`, `NotificationType` unions and `AppNotification.resourceType`)

- [ ] **Step 1: Extend the audit/notification unions**

In `domain.ts`, add to the `AuditAction` union (after `'LETTER_CLOSED'`):

```ts
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STARTED'
  | 'TASK_CLARIFICATION_REQUESTED'
  | 'TASK_CLARIFICATION_ANSWERED'
  | 'TASK_SUBMITTED'
  | 'TASK_ACCEPTED'
  | 'TASK_RETURNED'
  | 'TASK_REJECTED';
```

Add `'task'` to `AuditResourceType` (after `'letter'`).

Add to `NotificationType` (after `'LETTER_DISPATCHED'`):

```ts
  | 'TASK_ASSIGNED'
  | 'TASK_CLARIFICATION_REQUESTED'
  | 'TASK_CLARIFICATION_ANSWERED'
  | 'TASK_SUBMITTED'
  | 'TASK_ACCEPTED'
  | 'TASK_RETURNED'
  | 'TASK_REJECTED';
```

Change `AppNotification.resourceType` from `'document' | 'letter'` to `'document' | 'letter' | 'task'`.

- [ ] **Step 2: Add the Task domain section**

Append at the end of `domain.ts`:

```ts
// === Task delegation (milestone 3, BPMN 3.2 / BP-2) ===

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'STANDARD';

// BP-2 canon: new → in-progress → under-review → done.
// REJECTED ("Closed-rejected", UC-09) is terminal; renders inside the Done
// column with a destructive badge. Clarification (BP-2 6.1/7) does NOT change
// status. `round` increments on each return → resubmit cycle.
export type TaskStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'DONE'
  | 'REJECTED';

export type TaskCommentKind =
  | 'CLARIFICATION_REQUEST'
  | 'CLARIFICATION_REPLY'
  | 'RETURN_FEEDBACK'
  | 'REJECT_REASON'
  | 'NOTE';

export interface TaskComment {
  uuid: string;
  authorUuid: string;
  kind: TaskCommentKind;
  body: string;
  createdAt: string;
}

export interface TaskDeliverable {
  summary: string;
  /** Metadata-only attachment (reuses the M2 FileMeta — no bytes stored). */
  file?: FileMeta;
  /** OR a reference to an existing DocumentEntity. */
  documentUuid?: string;
  submittedAt: string;
}

export interface TaskEntity {
  uuid: string;
  /** Auto-numbered 'TOP-2026/0001' (topshiriq; year hardcoded per master §17). */
  number: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Manager (Rahbar / Bo'lim boshlig'i) — employee uuid. */
  assignerUuid: string;
  /** Single subordinate — employee uuid; must be in the assigner's subtree. */
  assigneeUuid: string;
  deadline: string;
  /** Optional related document attached at creation. */
  attachedDocumentUuid?: string;
  /** OR a metadata-only file attached at creation. */
  attachedFile?: FileMeta;
  /** Set on first submit; replaceable while UNDER_REVIEW. */
  deliverable?: TaskDeliverable;
  /** Accept-with-note text (return/reject reasons live in `comments`). */
  reviewNote?: string;
  /** Embedded chronological clarification + feedback thread. */
  comments: TaskComment[];
  round: number;
  /** True if the deliverable was submitted after the deadline (UC-09 A2). */
  lateSubmission?: boolean;
  startedAt?: string;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Type-check**

Run: `cd dashboard && npx tsc --noEmit`
Expected: PASS (no new errors). The new `AuditAction` members will surface as missing keys once `audit-icons.ts` is touched in Task 7 — that file uses a `Record<AuditAction, …>`, so until Task 7 it may error. If it errors *here* only on `audit-icons.ts` exhaustiveness, that is expected and resolved in Task 7; all other files must be clean.

- [ ] **Step 4: Checkpoint**

Leave changes in the working tree (no commit). Confirm `npx tsc --noEmit` shows no errors outside the anticipated `audit-icons.ts` exhaustiveness gap.

---

## Task 2: Zod schemas + TaskValidationError + tasks table

**Files:**
- Modify: `dashboard/src/lib/mock-backend/schemas.ts`
- Modify: `dashboard/src/lib/mock-backend/errors.ts`
- Modify: `dashboard/src/lib/mock-backend/storage.ts`

- [ ] **Step 1: Register the tasks table**

In `storage.ts`, add to the `Tables` object (after `letters: 'letters',`):

```ts
  tasks: 'tasks',
```

- [ ] **Step 2: Add TaskValidationError**

In `errors.ts`, mirror the `LetterValidationError` pattern. Add:

```ts
export type TaskValidationCode =
  | 'not-assigner'
  | 'not-assignee'
  | 'out-of-scope'
  | 'wrong-status'
  | 'reason-required'
  | 'self-assign';

export class TaskValidationError extends Error {
  readonly code: TaskValidationCode;
  constructor(code: TaskValidationCode) {
    super(`Task validation failed: ${code}`);
    this.name = 'TaskValidationError';
    this.code = code;
  }
}
```

- [ ] **Step 3: Add zod mirrors**

In `schemas.ts`, follow the existing pattern (locate `letterSchema` for reference). Add zod schemas for the new types. Use `z.enum` for the unions and extend the existing `auditActionSchema`, `auditResourceTypeSchema`, `notificationTypeSchema`, and the notification `resourceType` enum to include the new members:

```ts
export const taskPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'STANDARD']);

export const taskStatusSchema = z.enum([
  'NEW', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE', 'REJECTED',
]);

export const taskCommentKindSchema = z.enum([
  'CLARIFICATION_REQUEST', 'CLARIFICATION_REPLY',
  'RETURN_FEEDBACK', 'REJECT_REASON', 'NOTE',
]);

export const taskCommentSchema = z.object({
  uuid: z.string(),
  authorUuid: z.string(),
  kind: taskCommentKindSchema,
  body: z.string(),
  createdAt: z.string(),
});

export const taskDeliverableSchema = z.object({
  summary: z.string(),
  file: fileMetaSchema.optional(),       // reuse the existing fileMetaSchema
  documentUuid: z.string().optional(),
  submittedAt: z.string(),
});

export const taskSchema = z.object({
  uuid: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  assignerUuid: z.string(),
  assigneeUuid: z.string(),
  deadline: z.string(),
  attachedDocumentUuid: z.string().optional(),
  attachedFile: fileMetaSchema.optional(),
  deliverable: taskDeliverableSchema.optional(),
  reviewNote: z.string().optional(),
  comments: z.array(taskCommentSchema),
  round: z.number(),
  lateSubmission: z.boolean().optional(),
  startedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  acceptedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

Then add the 9 `TASK_*` audit actions to `auditActionSchema`, `'task'` to `auditResourceTypeSchema`, the 7 `TASK_*` notification types to `notificationTypeSchema`, and `'task'` to the notification `resourceType` enum. (Search for where `letterSchema` and `appNotificationSchema` are defined and match the exact existing structure — some are `z.enum([...])`, confirm the actual names in the file.)

- [ ] **Step 4: Type-check**

Run: `cd dashboard && npx tsc --noEmit`
Expected: PASS outside the anticipated `audit-icons.ts` exhaustiveness gap.

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 3: Backend reads + scope helper + isTaskOverdue

**Files:**
- Modify: `dashboard/src/lib/mock-backend/index.ts` (append a Task section; import the new types + `TaskValidationError`)

- [ ] **Step 1: Add the table reader + scope helper + overdue helper**

Near the other `readX()` helpers in `index.ts`, add:

```ts
function readTasks(): TaskEntity[] {
  return readTable<TaskEntity>(Tables.tasks, []);
}
```

Add an exported overdue helper (mirrors `isLetterOverdue`):

```ts
const TODAY_ISO = () => new Date().toISOString().slice(0, 10);

/** Overdue = deadline strictly before today AND status not terminal. */
export function isTaskOverdue(task: TaskEntity): boolean {
  if (task.status === 'DONE' || task.status === 'REJECTED') return false;
  return task.deadline.slice(0, 10) < TODAY_ISO();
}
```

Add a subtree-membership helper (mirrors the letter-executor `path.startsWith` rule). The assignee is in scope when their **primary assignment's unit** sits under one of the assigner's headed units:

```ts
/**
 * True when `assigneeUuid`'s primary unit is within a subtree headed by
 * `assignerUuid`. Uses Unit.path (materialized ancestor path) — an assignee
 * unit is in scope if its path starts with a headed unit's path.
 */
function assigneeInAssignerScope(assignerUuid: string, assigneeUuid: string): boolean {
  const units = readUnits();
  const assignments = readAssignments();
  const headedUnits = units.filter((u) => u.headEmployeeUuid === assignerUuid);
  if (headedUnits.length === 0) return false;
  const primary = assignments.find(
    (a) => a.employeeUuid === assigneeUuid && a.isPrimary && !a.closedAt,
  );
  if (!primary) return false;
  const assigneeUnit = units.find((u) => u.uuid === primary.unitUuid);
  if (!assigneeUnit) return false;
  return headedUnits.some(
    (h) => assigneeUnit.path === h.path || assigneeUnit.path.startsWith(h.path + '/'),
  );
}
```

> **Verify against the codebase:** confirm `Unit.path` is a `/`-joined uuid path and `Assignment` has `isPrimary` + `closedAt` (or the equivalent open-assignment marker). Adjust the open-assignment predicate to match the real `Assignment` shape (check `domain.ts` and how `transferEmployee` closes assignments). The harness in Task 6 asserts the scope guard, so a wrong predicate fails there.

- [ ] **Step 2: Add the reads**

Append:

```ts
export interface TaskFilters {
  box: 'assigned-by-me' | 'assigned-to-me';
  status?: TaskStatus;
  priority?: TaskPriority;
  overdueOnly?: boolean;
  search?: string;
}

export async function listTasks(
  filters: TaskFilters,
  actingUuid: string,
): Promise<TaskEntity[]> {
  await simulatedDelay();
  let rows = readTasks();
  rows =
    filters.box === 'assigned-by-me'
      ? rows.filter((t) => t.assignerUuid === actingUuid)
      : rows.filter((t) => t.assigneeUuid === actingUuid);
  if (filters.status) rows = rows.filter((t) => t.status === filters.status);
  if (filters.priority) rows = rows.filter((t) => t.priority === filters.priority);
  if (filters.overdueOnly) rows = rows.filter((t) => isTaskOverdue(t));
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (t) =>
        t.number.toLowerCase().includes(q) || t.title.toLowerCase().includes(q),
    );
  }
  // Newest-first by creation.
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface TaskDetail extends TaskEntity {
  assignerName: string;
  assigneeName: string;
  assigneePositionUz?: string;
  assigneeUnitNameUz?: string;
  attachedDocumentNumber?: string;
  attachedDocumentTitle?: string;
  deliverableDocumentNumber?: string;
  commentAuthors: Record<string, string>; // authorUuid → FIO
}

export async function getTask(uuid: string): Promise<TaskDetail | null> {
  await simulatedDelay();
  const task = readTasks().find((t) => t.uuid === uuid);
  if (!task) return null;
  const assignerName = employeeNameFor(task.assignerUuid);
  const assigneeName = employeeNameFor(task.assigneeUuid);
  const documents = readDocuments();
  const attached = task.attachedDocumentUuid
    ? documents.find((d) => d.uuid === task.attachedDocumentUuid)
    : undefined;
  const deliverableDoc = task.deliverable?.documentUuid
    ? documents.find((d) => d.uuid === task.deliverable!.documentUuid)
    : undefined;
  const commentAuthors: Record<string, string> = {};
  for (const c of task.comments) {
    if (!commentAuthors[c.authorUuid]) {
      commentAuthors[c.authorUuid] = employeeNameFor(c.authorUuid);
    }
  }
  // Resolve assignee position/unit from the primary assignment.
  const primary = readAssignments().find(
    (a) => a.employeeUuid === task.assigneeUuid && a.isPrimary && !a.closedAt,
  );
  const unit = primary ? readUnits().find((u) => u.uuid === primary.unitUuid) : undefined;
  const position = primary ? readPositions().find((p) => p.id === primary.positionId) : undefined;
  return {
    ...task,
    assignerName,
    assigneeName,
    assigneePositionUz: position?.nameUz,
    assigneeUnitNameUz: unit?.nameUz,
    attachedDocumentNumber: attached?.number,
    attachedDocumentTitle: attached?.title,
    deliverableDocumentNumber: deliverableDoc?.number,
    commentAuthors,
  };
}

export interface TaskStats {
  byStatus: Record<TaskStatus, number>;
  overdueCount: number;
  loadPerAssignee: { assigneeUuid: string; assigneeName: string; openCount: number }[];
}

export async function getTaskStats(actingUuid: string): Promise<TaskStats> {
  await simulatedDelay();
  const mine = readTasks().filter((t) => t.assignerUuid === actingUuid);
  const byStatus: Record<TaskStatus, number> = {
    NEW: 0, IN_PROGRESS: 0, UNDER_REVIEW: 0, DONE: 0, REJECTED: 0,
  };
  let overdueCount = 0;
  const load: Record<string, number> = {};
  for (const t of mine) {
    byStatus[t.status] += 1;
    if (isTaskOverdue(t)) overdueCount += 1;
    if (t.status !== 'DONE' && t.status !== 'REJECTED') {
      load[t.assigneeUuid] = (load[t.assigneeUuid] ?? 0) + 1;
    }
  }
  const loadPerAssignee = Object.entries(load)
    .map(([assigneeUuid, openCount]) => ({
      assigneeUuid,
      assigneeName: employeeNameFor(assigneeUuid),
      openCount,
    }))
    .sort((a, b) => b.openCount - a.openCount);
  return { byStatus, overdueCount, loadPerAssignee };
}
```

> **Verify helper names:** `employeeNameFor`, `readDocuments`, `readPositions`, `readAssignments`, `readUnits` — confirm these exact internal readers/helpers exist in `index.ts` (the M2 doc/letter code uses `employeeNameFor`). If a reader is named differently (e.g. `readDocs`), use the actual name.

- [ ] **Step 3: Type-check**

Run: `cd dashboard && npx tsc --noEmit`
Expected: PASS outside the `audit-icons.ts` gap.

- [ ] **Step 4: Checkpoint** — leave changes in the tree.

---

## Task 4: Backend mutations

**Files:**
- Modify: `dashboard/src/lib/mock-backend/index.ts` (append; import `TaskValidationError`)

Each mutation: `simulatedDelay()` → policy check → `maybeFail()` → read-modify-write → `appendAudit()` → `appendNotification()` (notifications never gated by `maybeFail`). Helpers: `uid()`, `NOW()`.

- [ ] **Step 1: createTask**

```ts
export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeUuid: string;
  deadline: string;
  attachedDocumentUuid?: string;
  attachedFile?: FileMeta;
}

function nextTaskNumber(): string {
  const n = readTasks().length + 1;
  return `TOP-2026/${String(n).padStart(4, '0')}`;
}

export async function createTask(
  input: CreateTaskInput,
  actorUuid: string,
): Promise<TaskEntity> {
  await simulatedDelay();
  if (input.assigneeUuid === actorUuid) throw new TaskValidationError('self-assign');
  if (!assigneeInAssignerScope(actorUuid, input.assigneeUuid)) {
    throw new TaskValidationError('out-of-scope');
  }
  maybeFail();
  const tasks = readTasks();
  const now = NOW();
  const task: TaskEntity = {
    uuid: uid(),
    number: nextTaskNumber(),
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: 'NEW',
    assignerUuid: actorUuid,
    assigneeUuid: input.assigneeUuid,
    deadline: input.deadline,
    attachedDocumentUuid: input.attachedDocumentUuid,
    attachedFile: input.attachedFile,
    comments: [],
    round: 1,
    createdAt: now,
    updatedAt: now,
  };
  tasks.unshift(task);
  writeTable(Tables.tasks, tasks);
  await appendAudit({
    actorUuid,
    action: 'TASK_CREATED',
    resourceType: 'task',
    resourceUuid: task.uuid,
    resourceLabel: task.number,
    context: { title: task.title, priority: task.priority, deadline: task.deadline, assigneeUuid: task.assigneeUuid },
  });
  await appendNotification({
    recipientEmployeeUuid: task.assigneeUuid,
    type: 'TASK_ASSIGNED',
    titleKey: 'dashboard:notifications.title.TASK_ASSIGNED',
    params: { taskNumber: task.number, actorName: employeeNameFor(actorUuid) },
    resourceType: 'task',
    resourceUuid: task.uuid,
  });
  return task;
}
```

- [ ] **Step 2: A shared mutate-by-uuid helper + updateTask**

```ts
function findTaskOrThrow(uuid: string): { tasks: TaskEntity[]; task: TaskEntity; idx: number } {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.uuid === uuid);
  if (idx < 0) throw new TaskValidationError('wrong-status'); // not found ≈ unactionable
  return { tasks, task: tasks[idx], idx };
}

function isTerminal(t: TaskEntity): boolean {
  return t.status === 'DONE' || t.status === 'REJECTED';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
}

export async function updateTask(
  uuid: string,
  input: UpdateTaskInput,
  actorUuid: string,
): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assignerUuid !== actorUuid) throw new TaskValidationError('not-assigner');
  if (isTerminal(task)) throw new TaskValidationError('wrong-status');
  maybeFail();
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const deadlineChanged = input.deadline !== undefined && input.deadline !== task.deadline;
  if (input.title !== undefined && input.title !== task.title) changes.title = { from: task.title, to: input.title };
  if (input.description !== undefined && input.description !== task.description) changes.description = { from: task.description, to: input.description };
  if (input.priority !== undefined && input.priority !== task.priority) changes.priority = { from: task.priority, to: input.priority };
  if (deadlineChanged) changes.deadline = { from: task.deadline, to: input.deadline };
  const updated: TaskEntity = {
    ...task,
    title: input.title ?? task.title,
    description: input.description ?? task.description,
    priority: input.priority ?? task.priority,
    deadline: input.deadline ?? task.deadline,
    updatedAt: NOW(),
  };
  tasks[idx] = updated;
  writeTable(Tables.tasks, tasks);
  await appendAudit({
    actorUuid,
    action: 'TASK_UPDATED',
    resourceType: 'task',
    resourceUuid: uuid,
    resourceLabel: task.number,
    changes,
    context: deadlineChanged ? { kind: 'deadline' } : { kind: 'scope' },
  });
  return updated;
}
```

- [ ] **Step 3: startTask**

```ts
export async function startTask(uuid: string, actorUuid: string): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assigneeUuid !== actorUuid) throw new TaskValidationError('not-assignee');
  if (task.status !== 'NEW') throw new TaskValidationError('wrong-status');
  maybeFail();
  const now = NOW();
  tasks[idx] = { ...task, status: 'IN_PROGRESS', startedAt: now, updatedAt: now };
  writeTable(Tables.tasks, tasks);
  await appendAudit({
    actorUuid, action: 'TASK_STARTED', resourceType: 'task',
    resourceUuid: uuid, resourceLabel: task.number,
  });
  return tasks[idx];
}
```

- [ ] **Step 4: requestClarification + answerClarification**

```ts
export async function requestClarification(uuid: string, body: string, actorUuid: string): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assigneeUuid !== actorUuid) throw new TaskValidationError('not-assignee');
  if (isTerminal(task)) throw new TaskValidationError('wrong-status');
  if (!body.trim()) throw new TaskValidationError('reason-required');
  maybeFail();
  const now = NOW();
  const comment: TaskComment = { uuid: uid(), authorUuid: actorUuid, kind: 'CLARIFICATION_REQUEST', body: body.trim(), createdAt: now };
  tasks[idx] = { ...task, comments: [...task.comments, comment], updatedAt: now };
  writeTable(Tables.tasks, tasks);
  await appendAudit({ actorUuid, action: 'TASK_CLARIFICATION_REQUESTED', resourceType: 'task', resourceUuid: uuid, resourceLabel: task.number });
  await appendNotification({
    recipientEmployeeUuid: task.assignerUuid,
    type: 'TASK_CLARIFICATION_REQUESTED',
    titleKey: 'dashboard:notifications.title.TASK_CLARIFICATION_REQUESTED',
    params: { taskNumber: task.number, actorName: employeeNameFor(actorUuid) },
    resourceType: 'task', resourceUuid: uuid,
  });
  return tasks[idx];
}

export async function answerClarification(uuid: string, body: string, actorUuid: string): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assignerUuid !== actorUuid) throw new TaskValidationError('not-assigner');
  if (isTerminal(task)) throw new TaskValidationError('wrong-status');
  if (!body.trim()) throw new TaskValidationError('reason-required');
  maybeFail();
  const now = NOW();
  const comment: TaskComment = { uuid: uid(), authorUuid: actorUuid, kind: 'CLARIFICATION_REPLY', body: body.trim(), createdAt: now };
  tasks[idx] = { ...task, comments: [...task.comments, comment], updatedAt: now };
  writeTable(Tables.tasks, tasks);
  await appendAudit({ actorUuid, action: 'TASK_CLARIFICATION_ANSWERED', resourceType: 'task', resourceUuid: uuid, resourceLabel: task.number });
  await appendNotification({
    recipientEmployeeUuid: task.assigneeUuid,
    type: 'TASK_CLARIFICATION_ANSWERED',
    titleKey: 'dashboard:notifications.title.TASK_CLARIFICATION_ANSWERED',
    params: { taskNumber: task.number, actorName: employeeNameFor(actorUuid) },
    resourceType: 'task', resourceUuid: uuid,
  });
  return tasks[idx];
}
```

- [ ] **Step 5: submitDeliverable**

```ts
export interface SubmitDeliverableInput {
  summary: string;
  file?: FileMeta;
  documentUuid?: string;
}

export async function submitDeliverable(uuid: string, input: SubmitDeliverableInput, actorUuid: string): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assigneeUuid !== actorUuid) throw new TaskValidationError('not-assignee');
  // Submit from IN_PROGRESS, or replace while UNDER_REVIEW (UC-08 A2).
  if (task.status !== 'IN_PROGRESS' && task.status !== 'UNDER_REVIEW') {
    throw new TaskValidationError('wrong-status');
  }
  maybeFail();
  const now = NOW();
  const late = now.slice(0, 10) > task.deadline.slice(0, 10);
  tasks[idx] = {
    ...task,
    status: 'UNDER_REVIEW',
    deliverable: { summary: input.summary, file: input.file, documentUuid: input.documentUuid, submittedAt: now },
    submittedAt: now,
    lateSubmission: late || task.lateSubmission,
    updatedAt: now,
  };
  writeTable(Tables.tasks, tasks);
  await appendAudit({
    actorUuid, action: 'TASK_SUBMITTED', resourceType: 'task',
    resourceUuid: uuid, resourceLabel: task.number,
    context: { late, replaced: task.status === 'UNDER_REVIEW' },
  });
  await appendNotification({
    recipientEmployeeUuid: task.assignerUuid,
    type: 'TASK_SUBMITTED',
    titleKey: 'dashboard:notifications.title.TASK_SUBMITTED',
    params: { taskNumber: task.number, actorName: employeeNameFor(actorUuid) },
    resourceType: 'task', resourceUuid: uuid,
  });
  return tasks[idx];
}
```

- [ ] **Step 6: reviewTask (4-variant)**

```ts
export type TaskReviewDecision = 'ACCEPT' | 'ACCEPT_WITH_NOTE' | 'RETURN' | 'REJECT';

export interface ReviewTaskInput {
  decision: TaskReviewDecision;
  /** Required for RETURN + REJECT (the reason); the note text for ACCEPT_WITH_NOTE. */
  text?: string;
}

export async function reviewTask(uuid: string, input: ReviewTaskInput, actorUuid: string): Promise<TaskEntity> {
  await simulatedDelay();
  const { tasks, task, idx } = findTaskOrThrow(uuid);
  if (task.assignerUuid !== actorUuid) throw new TaskValidationError('not-assigner');
  if (task.status !== 'UNDER_REVIEW') throw new TaskValidationError('wrong-status');
  if ((input.decision === 'RETURN' || input.decision === 'REJECT') && !input.text?.trim()) {
    throw new TaskValidationError('reason-required');
  }
  maybeFail();
  const now = NOW();
  let updated: TaskEntity;
  let action: AuditAction;
  let notifyType: NotificationType;
  const text = input.text?.trim();
  if (input.decision === 'ACCEPT' || input.decision === 'ACCEPT_WITH_NOTE') {
    const comments = input.decision === 'ACCEPT_WITH_NOTE' && text
      ? [...task.comments, { uuid: uid(), authorUuid: actorUuid, kind: 'NOTE' as const, body: text, createdAt: now }]
      : task.comments;
    updated = { ...task, status: 'DONE', acceptedAt: now, reviewNote: input.decision === 'ACCEPT_WITH_NOTE' ? text : undefined, comments, updatedAt: now };
    action = 'TASK_ACCEPTED';
    notifyType = 'TASK_ACCEPTED';
  } else if (input.decision === 'RETURN') {
    updated = {
      ...task, status: 'IN_PROGRESS', round: task.round + 1,
      comments: [...task.comments, { uuid: uid(), authorUuid: actorUuid, kind: 'RETURN_FEEDBACK' as const, body: text!, createdAt: now }],
      updatedAt: now,
    };
    action = 'TASK_RETURNED';
    notifyType = 'TASK_RETURNED';
  } else {
    updated = {
      ...task, status: 'REJECTED', rejectedAt: now,
      comments: [...task.comments, { uuid: uid(), authorUuid: actorUuid, kind: 'REJECT_REASON' as const, body: text!, createdAt: now }],
      updatedAt: now,
    };
    action = 'TASK_REJECTED';
    notifyType = 'TASK_REJECTED';
  }
  tasks[idx] = updated;
  writeTable(Tables.tasks, tasks);
  await appendAudit({
    actorUuid, action, resourceType: 'task', resourceUuid: uuid, resourceLabel: task.number,
    context: { decision: input.decision, round: updated.round },
  });
  await appendNotification({
    recipientEmployeeUuid: task.assigneeUuid,
    type: notifyType,
    titleKey: `dashboard:notifications.title.${notifyType}`,
    params: { taskNumber: task.number, actorName: employeeNameFor(actorUuid) },
    resourceType: 'task', resourceUuid: uuid,
  });
  return updated;
}
```

> Confirm `AuditAction` and `NotificationType` are imported in `index.ts` (they are used as local types above). Add to the existing type-import block if missing.

- [ ] **Step 7: Type-check**

Run: `cd dashboard && npx tsc --noEmit`
Expected: PASS outside the `audit-icons.ts` gap.

- [ ] **Step 8: Checkpoint** — leave changes in the tree.

---

## Task 5: Seed fixtures + buildTaskAudit + SEED_VERSION

**Files:**
- Modify: `dashboard/src/lib/mock-backend/seed.ts`

- [ ] **Step 1: Bump SEED_VERSION**

Find `SEED_VERSION` (currently `'10'`) and change to `'11'`.

- [ ] **Step 2: Build the task fixtures**

Locate the seed assembly (where `buildLetters` / `buildAudit` are called and tables written). Add a `buildTasks(employees, units, documents)` function that returns ~12 `TaskEntity` rows, **all within the IT Departament subtree** so the personas own every action. Use the exported `PERSONAS` map (`PERSONAS.RAHBAR` = Karimov, `PERSONAS.BOLIM_BOSHLIGI` = Akhmedov, `PERSONAS.XODIM` = Sobirova). Use fixed literal uuids (`…t001`–`…t012` style, matching the doc/letter fixed-uuid convention) so notifications can reference them.

Required coverage (the harness in Task 6 asserts this shape):

| # | assigner → assignee | status | notes |
|---|---|---|---|
| t001 | Akhmedov → Sobirova | `NEW` | HIGH priority |
| t002 | Akhmedov → Sobirova | `NEW` | with an open clarification thread (a `CLARIFICATION_REQUEST` comment, no reply yet) |
| t003 | Akhmedov → Sobirova | `IN_PROGRESS` | `startedAt` set |
| t004 | Akhmedov → Sobirova | `IN_PROGRESS` | round 2 — returned once (a `RETURN_FEEDBACK` comment) |
| t005 | Akhmedov → Sobirova | `UNDER_REVIEW` | has a `deliverable`; manager review queue non-empty |
| t006 | Akhmedov → Sobirova | `UNDER_REVIEW` | HIGH + **overdue** (deadline in the past) |
| t007 | Akhmedov → Sobirova | `DONE` | accepted on time |
| t008 | Akhmedov → Sobirova | `DONE` | `lateSubmission: true`, `reviewNote` set (accept-with-note) |
| t009 | Akhmedov → Sobirova | `REJECTED` | `REJECT_REASON` comment |
| t010 | Akhmedov → Sobirova | `IN_PROGRESS` | `attachedDocumentUuid` → a seeded `DocumentEntity` (use a fixed doc uuid `…d00x`) |
| t011 | Karimov → Akhmedov | `NEW` | RAHBAR's board non-empty |
| t012 | Karimov → Akhmedov | `UNDER_REVIEW` | RAHBAR's review queue non-empty; deliverable has a `documentUuid` reference |

Each row: `comments: []` unless noted; `round: 1` unless noted; `createdAt`/`updatedAt`/`deadline` as ISO strings spread across a believable window (use offsets from a fixed base date string — **do not call `Date.now()`/`new Date()` without args** in seed if it would break determinism; the existing seed uses a relative-day helper — reuse it). Deliverable `submittedAt` for UNDER_REVIEW/DONE rows; `acceptedAt`/`rejectedAt` for terminal rows.

- [ ] **Step 3: buildTaskAudit**

Mirror `buildLetterAudit`. Add `buildTaskAudit(tasks, employees, units)` that, for each seeded task, emits the BP-2 audit trail consistent with the task's current state (e.g. a DONE task emits TASK_CREATED → TASK_STARTED → TASK_SUBMITTED → TASK_ACCEPTED; a round-2 IN_PROGRESS emits CREATED → STARTED → SUBMITTED → RETURNED → STARTED). Reproduce the exact `action` + `context` shapes the mutations write. Timestamps linearly spaced across each task's `createdAt → updatedAt`. Merge into the audit table and re-sort newest-first (same merge the letter audit uses).

- [ ] **Step 4: Seed task notifications**

Add ~12 task notifications across personas (mix read/unread), each referencing a real seeded task uuid + the correct `titleKey`/`params`. Follow how letter/document notifications are seeded (the existing seed builds a notifications array; append task ones).

- [ ] **Step 5: Wire it in**

In the seed assembly: build documents/units/employees first (they already exist), then `const tasks = buildTasks(...)`, `writeTable(Tables.tasks, tasks)`, fold `buildTaskAudit(...)` into the audit merge, and append the task notifications to the notifications write. Confirm the order: tasks must be built after documents so `attachedDocumentUuid` resolves.

- [ ] **Step 6: Type-check + reseed**

Run: `cd dashboard && npx tsc --noEmit` — Expected: PASS outside the `audit-icons.ts` gap.
The `SEED_VERSION` bump means any running browser reseeds on next load.

- [ ] **Step 7: Checkpoint** — leave changes in the tree.

---

## Task 6: Node verification harness — full BP-2 walk + guards

This is the project's substitute for unit tests (the M1/M2 pattern). It bundles the real backend with a `localStorage` shim and asserts behavior. **Write the assertions, run, watch them fail where logic is wrong, fix the backend, re-run until green.**

**Files:**
- Create: `/tmp/devon-m3-harness/harness.mjs` (ephemeral — not committed)

- [ ] **Step 1: Scaffold the harness**

Reuse the M2 harness recipe (rolldown/esbuild bundle + localStorage shim + `@/` alias + flake-retry wrapper). Minimal shape:

```js
// harness.mjs — run after bundling the backend entry that re-exports mock-backend + seed.
import assert from 'node:assert';
// localStorage shim
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
};
globalThis.crypto ??= (await import('node:crypto')).webcrypto;

const be = await import('./bundled-backend.mjs'); // resolveAndSeed + all mock-backend exports
let pass = 0; const fail = [];
const check = (name, cond) => { if (cond) pass++; else fail.push(name); };
// retry helper for the 3% maybeFail flake
const tryHard = async (fn) => { for (let i=0;i<8;i++){ try { return await fn(); } catch(e){ if (e?.name==='MockNetworkError') continue; throw e; } } throw new Error('too many flakes'); };

be.resetAndSeed();
const { PERSONAS } = be;
// ... assertions below ...
console.log(`PASS ${pass} / FAIL ${fail.length}`, fail);
assert.equal(fail.length, 0);
```

- [ ] **Step 2: Write the assertions (the "failing test")**

Cover, at minimum:

```js
// --- Seed shape ---
const all = await be.listTasks({ box: 'assigned-by-me' }, PERSONAS.BOLIM_BOSHLIGI);
check('seed: Akhmedov has ≥10 assigned', all.length >= 10);
check('seed: one UNDER_REVIEW for review queue', all.some(t => t.status === 'UNDER_REVIEW'));
check('seed: one overdue', all.some(t => be.isTaskOverdue(t)));
check('seed: one terminal-late', all.some(t => t.status === 'DONE' && t.lateSubmission));
const rahbarBoard = await be.listTasks({ box: 'assigned-by-me' }, PERSONAS.RAHBAR);
check('seed: Rahbar board non-empty', rahbarBoard.length >= 2);
const xodimInbox = await be.listTasks({ box: 'assigned-to-me' }, PERSONAS.XODIM);
check('seed: Sobirova inbox non-empty', xodimInbox.length >= 10);

// --- Scope guard ---
let threw = null;
try { await be.createTask({ title:'x', description:'y', priority:'STANDARD', assigneeUuid: PERSONAS.HR_ADMIN, deadline:'2026-12-31' }, PERSONAS.BOLIM_BOSHLIGI); }
catch(e){ threw = e; }
check('scope: out-of-scope assignee rejected', threw?.code === 'out-of-scope');

// self-assign
threw = null;
try { await be.createTask({ title:'x', description:'y', priority:'STANDARD', assigneeUuid: PERSONAS.BOLIM_BOSHLIGI, deadline:'2026-12-31' }, PERSONAS.BOLIM_BOSHLIGI); }
catch(e){ threw = e; }
check('scope: self-assign rejected', threw?.code === 'self-assign');

// --- Full BP-2 walk ---
const t = await tryHard(() => be.createTask({ title:'Walk', description:'d', priority:'HIGH', assigneeUuid: PERSONAS.XODIM, deadline:'2026-12-31' }, PERSONAS.BOLIM_BOSHLIGI));
check('create → NEW + TOP- number', t.status === 'NEW' && /^TOP-2026\/\d{4}$/.test(t.number));

// wrong-persona start
threw = null; try { await be.startTask(t.uuid, PERSONAS.RAHBAR); } catch(e){ threw=e; }
check('start by non-assignee rejected', threw?.code === 'not-assignee');

let cur = await tryHard(() => be.startTask(t.uuid, PERSONAS.XODIM));
check('start → IN_PROGRESS', cur.status === 'IN_PROGRESS');

await tryHard(() => be.requestClarification(t.uuid, 'need detail', PERSONAS.XODIM));
await tryHard(() => be.answerClarification(t.uuid, 'here it is', PERSONAS.BOLIM_BOSHLIGI));
cur = await be.getTask(t.uuid);
check('clarification round-trip recorded', cur.comments.filter(c=>c.kind.startsWith('CLARIFICATION')).length === 2);
check('clarification does not change status', cur.status === 'IN_PROGRESS');

cur = await tryHard(() => be.submitDeliverable(t.uuid, { summary:'done v1' }, PERSONAS.XODIM));
check('submit → UNDER_REVIEW', cur.status === 'UNDER_REVIEW');

// reason required on return
threw = null; try { await be.reviewTask(t.uuid, { decision:'RETURN' }, PERSONAS.BOLIM_BOSHLIGI); } catch(e){ threw=e; }
check('return without reason rejected', threw?.code === 'reason-required');

cur = await tryHard(() => be.reviewTask(t.uuid, { decision:'RETURN', text:'fix X' }, PERSONAS.BOLIM_BOSHLIGI));
check('return → IN_PROGRESS round 2', cur.status === 'IN_PROGRESS' && cur.round === 2);

await tryHard(() => be.submitDeliverable(t.uuid, { summary:'done v2' }, PERSONAS.XODIM));
cur = await tryHard(() => be.reviewTask(t.uuid, { decision:'ACCEPT_WITH_NOTE', text:'good' }, PERSONAS.BOLIM_BOSHLIGI));
check('accept → DONE + note', cur.status === 'DONE' && cur.reviewNote === 'good');

// terminal immutability
threw = null; try { await be.startTask(t.uuid, PERSONAS.XODIM); } catch(e){ threw=e; }
check('terminal task immutable', threw?.code === 'wrong-status');

// reject path (fresh task)
const t2 = await tryHard(() => be.createTask({ title:'R', description:'d', priority:'STANDARD', assigneeUuid: PERSONAS.XODIM, deadline:'2026-12-31' }, PERSONAS.BOLIM_BOSHLIGI));
await tryHard(() => be.startTask(t2.uuid, PERSONAS.XODIM));
await tryHard(() => be.submitDeliverable(t2.uuid, { summary:'x' }, PERSONAS.XODIM));
const rej = await tryHard(() => be.reviewTask(t2.uuid, { decision:'REJECT', text:'wrong' }, PERSONAS.BOLIM_BOSHLIGI));
check('reject → REJECTED', rej.status === 'REJECTED');

// --- Audit: one entry per transition + append-only ---
const audit = await be.listAudit({ resourceUuid: t.uuid });
check('audit has create+start+clar×2+submit+return+submit+accept', audit.filter(a=>a.action.startsWith('TASK_')).length >= 8);

// --- Notifications routed to the right persona ---
const xodimNotifs = await be.listNotifications(PERSONAS.XODIM);
check('assignee got TASK_ASSIGNED', xodimNotifs.some(n => n.type === 'TASK_ASSIGNED' && n.resourceType === 'task'));
const mgrNotifs = await be.listNotifications(PERSONAS.BOLIM_BOSHLIGI);
check('manager got TASK_SUBMITTED', mgrNotifs.some(n => n.type === 'TASK_SUBMITTED'));
```

- [ ] **Step 3: Run it (expect failures first, then green)**

Bundle + run (the M2 recipe — adapt the entry path):

```bash
cd /tmp/devon-m3-harness
npx esbuild /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard/src/lib/mock-backend/index.ts \
  --bundle --format=esm --platform=node \
  --alias:@=/Users/sardorallaberganov/Desktop/Projects/Devon/dashboard/src \
  --outfile=bundled-backend.mjs
node harness.mjs
```

Expected first run: assertions fail where backend logic is wrong. Fix `index.ts`/`seed.ts`, re-bundle, re-run.
Expected final: `PASS N / FAIL 0`.

> If `listAudit({ resourceUuid })` or `listNotifications(recipient)` signatures differ, adjust the calls to match the real exports (verified in Task 3 / existing code).

- [ ] **Step 4: Checkpoint** — backend behavior verified. Leave source changes in the tree; the harness stays in `/tmp` (not committed).

---

## Task 7: StatusBadge kinds + audit-icons + i18n keys

**Files:**
- Modify: `dashboard/src/components/common/StatusBadge.tsx`
- Modify: `dashboard/src/lib/audit-icons.ts`
- Modify: `dashboard/src/i18n/locales/uz.json`

- [ ] **Step 1: StatusBadge — add NEW / UNDER_REVIEW / DONE**

In the `StatusKind` union add `'NEW' | 'UNDER_REVIEW' | 'DONE'` (`IN_PROGRESS` + `REJECTED` already exist — reuse them). In the config record add (match the existing entry shape `{ cls, icon, key }`):

```ts
  NEW: { cls: 'bg-cream-warm text-cinnamon', icon: Sparkles, key: 'common:status.new' },
  UNDER_REVIEW: { cls: 'bg-cream-warm text-cinnamon', icon: Eye, key: 'common:status.under-review' },
  DONE: { cls: 'bg-emerald-soft text-emerald-deep', icon: CheckCheck, key: 'common:status.done' },
```

Import any missing icons (`Sparkles`, `Eye`, `CheckCheck`) from `lucide-react` (check which are already imported). Pick tones consistent with the existing palette: NEW = neutral/new (cream-warm/cinnamon), UNDER_REVIEW = active (cream-warm), DONE = success (emerald-soft). Adjust to whatever the file's existing convention uses for "in progress" vs "complete."

- [ ] **Step 2: audit-icons.ts — add the 9 task actions**

`audit-icons.ts` is a `Record<AuditAction, LucideIcon>` (compile-time exhaustive — this is the file flagged in earlier tasks). Add distinct lucide glyphs:

```ts
  TASK_CREATED: ListPlus,
  TASK_UPDATED: PencilLine,
  TASK_STARTED: PlayCircle,
  TASK_CLARIFICATION_REQUESTED: HelpCircle,
  TASK_CLARIFICATION_ANSWERED: MessageCircleReply,
  TASK_SUBMITTED: Send,
  TASK_ACCEPTED: CircleCheckBig,
  TASK_RETURNED: Undo2,
  TASK_REJECTED: CircleX,
```

Import the glyphs from `lucide-react`. Pick any that exist in the installed lucide version if a name is missing (verify each resolves — the build catches typos).

- [ ] **Step 3: i18n keys — common:status + audit verbs + notification titles**

In `uz.json`, under `common.status` add: `"new": "Yangi"`, `"under-review": "Ko'rib chiqilmoqda"`, `"done": "Bajarildi"` (`in-progress`, `rejected` already exist).

Under the audit-verb map (find where existing actions like `LETTER_DISPATCHED` get a verb — likely `dashboard.audit.actions.*`), add Uzbek verbs for the 9 `TASK_*` actions, e.g. `TASK_CREATED`: "topshiriq yaratdi", `TASK_STARTED`: "topshiriqni boshladi", `TASK_SUBMITTED`: "topshiriqni topshirdi", `TASK_ACCEPTED`: "topshiriqni qabul qildi", `TASK_RETURNED`: "topshiriqni qaytardi", `TASK_REJECTED`: "topshiriqni rad etdi", `TASK_CLARIFICATION_REQUESTED`: "izoh so'radi", `TASK_CLARIFICATION_ANSWERED`: "izohga javob berdi", `TASK_UPDATED`: "topshiriqni tahrirladi".

Under `dashboard.notifications.title` add the 7 `TASK_*` keys with `{{taskNumber}}` / `{{actorName}}` placeholders, e.g. `TASK_ASSIGNED`: "Sizga yangi topshiriq: {{taskNumber}}", `TASK_SUBMITTED`: "{{actorName}} topshiriqni topshirdi: {{taskNumber}}", etc. (one per notification type).

- [ ] **Step 4: Type-check + build**

Run: `cd dashboard && npx tsc --noEmit` — Expected: PASS (the `audit-icons.ts` exhaustiveness gap from Tasks 1–6 now closes).
Run: `cd dashboard && npm run build` — Expected: build succeeds.

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 8: Routes + sidebar nav + detail placeholder

**Files:**
- Modify: `dashboard/src/router.tsx`
- Modify: `dashboard/src/components/layout/Sidebar.tsx`
- Create: `dashboard/src/features/tasks/TasksPage.tsx` (temporary stub)
- Create: `dashboard/src/features/tasks/detail/TaskDetailPage.tsx` (temporary stub)

- [ ] **Step 1: Temporary page stubs**

Create minimal stubs so routes resolve (replaced in Tasks 9–13):

```tsx
// TasksPage.tsx
import { PageHeader } from '@/components/layout/PageHeader'; // confirm the real import
export default function TasksPage() {
  return <div className="p-4"><h1>Topshiriqlar</h1></div>;
}
```

```tsx
// detail/TaskDetailPage.tsx
export default function TaskDetailPage() {
  return <div className="p-4"><h1>Topshiriq</h1></div>;
}
```

(Use whatever default-vs-named export convention the existing pages use — check `CertificatesPage.tsx`.)

- [ ] **Step 2: Register routes**

In `router.tsx`, add inside the `Protected`/AppShell-wrapped routes (mirror how `/documents` + `/documents/:uuid` are registered):

```tsx
<Route path="/tasks" element={<Protected><TasksPage /></Protected>} />
<Route path="/tasks/:uuid" element={<Protected><TaskDetailPage /></Protected>} />
```

(Match the exact wrapper components used by the existing routes — `Protected` and the shell wrapper. Import the new pages.)

- [ ] **Step 3: Sidebar nav item**

In `Sidebar.tsx`, add to the management nav array (after `/certificates` or wherever fits the grouping):

```ts
{ to: '/tasks', labelKey: 'dashboard:sidebar.nav-tasks', icon: ListTodo },
```

Import `ListTodo` from `lucide-react`. Add `"nav-tasks": "Topshiriqlar"` under `dashboard.sidebar` in `uz.json`.

- [ ] **Step 4: Verify routes resolve**

Run: `cd dashboard && npm run build` — Expected: succeeds.
Run dev server, confirm `/tasks` and `/tasks/:uuid` render the stubs (no fall-through to home). Confirm a notification bell deep-link with `resourceType: 'task'` now lands on `/tasks/:uuid` (test by clicking a seeded task notification).

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 9: TaskCard + Kanban board (render only) + mobile tabs

**Files:**
- Create: `dashboard/src/features/tasks/TaskCard.tsx`
- Create: `dashboard/src/features/tasks/TasksKanban.tsx`
- Create: `dashboard/src/features/tasks/TasksTabsMobile.tsx`

**Reference pattern:** read `dashboard/src/features/certificates/CertificatesKanban.tsx`, `CertificateCard.tsx`, and `CertificatesTabsMobile.tsx` — clone their structure (column header bands + count badges, `@dnd-kit` `DndContext`/`useDroppable`/`useDraggable` setup, the mobile underline-tabs pattern). This task renders + drag-reorders only; **transition wiring is Task 14.**

- [ ] **Step 1: TaskCard**

Render: number + title (clamp 2 lines) + priority chip (HIGH visually prominent — e.g. cinnamon/destructive tint; MEDIUM neutral; STANDARD muted) + deadline with overdue treatment (`isTaskOverdue` → destructive text + `AlertTriangle` + `sr-only` "muddati o'tgan", **never color alone**) + counterpart avatar (assignee on the assigner's board, assigner on the assignee's board) + `StatusBadge`. Rejected cards (in the Done column) show the REJECTED badge. Click → `navigate('/tasks/' + task.uuid)`. Use the `formatRelative`/date helpers the cert/letter cards use for the deadline.

- [ ] **Step 2: TasksKanban (desktop ≥lg)**

Four columns NEW → IN_PROGRESS → UNDER_REVIEW → DONE. The DONE column also renders REJECTED tasks (filter: `status === 'DONE' || status === 'REJECTED'`). Tinted header bands + count badge per column (clone `CertificatesKanban`). Wrap in `DndContext`; each column is a droppable; each card is draggable. For now `onDragEnd` is a no-op that just resets (no mutation) — Task 14 fills it. Props: `tasks: TaskEntity[]`, `box: 'assigned-by-me' | 'assigned-to-me'`, `actingUuid`, `onChanged: () => void`.

- [ ] **Step 3: TasksTabsMobile (<lg)**

Underline tabs (one column at a time) using `TabLabel` with count pills — clone `CertificatesTabsMobile`. No DnD on mobile (touch DnD is fragile; documented limitation). Cards still navigate to detail.

- [ ] **Step 4: Build + lint**

Run: `cd dashboard && npm run build && npm run lint` — Expected: build succeeds; lint clean except the tolerated `set-state-in-effect` clones (if any introduced, they must match the documented idiom).

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 10: TaskFilters + box toggle + stats band + TasksPage assembly

**Files:**
- Create: `dashboard/src/features/tasks/TaskFilters.tsx`
- Create: `dashboard/src/features/tasks/TaskStatsBand.tsx`
- Rewrite: `dashboard/src/features/tasks/TasksPage.tsx` (replace the Task 8 stub)

**Reference pattern:** `LetterFilters.tsx` (inline `SearchInput` + `Select` + toggle chip on `md+`; bottom-sheet draft-Apply-Reset below) and `LettersPage.tsx` (box-tab + URL-param handling + acting-persona resolution).

- [ ] **Step 1: TaskFilters**

Priority `Select` (All / HIGH / MEDIUM / STANDARD) + overdue toggle chip (`aria-pressed`) + `SearchInput` (number + title). Inline row on `md+`; bottom-`Sheet` draft state with Apply/Reset below `md` (the step-09 pattern). Props mirror `LetterFilters`.

- [ ] **Step 2: TaskStatsBand**

Collapsible band, rendered only when `box === 'assigned-by-me'` and the acting persona has ≥1 assigned task. Shows `getTaskStats(actingUuid)`: status counts (small chips New/In-Progress/Under-Review/Done/Rejected) + overdue count (destructive when > 0) + load-per-employee chips (`{FIO}: N`). No charting library. Re-fetches on POV switch + `onChanged`.

- [ ] **Step 3: TasksPage assembly**

- Resolve `useActingEmployee()`; null → `LoadingState`.
- **Box toggle** (`TabLabel` underline or segmented): "Men bergan" (assigned-by-me) ⇄ "Menga biriktirilgan" (assigned-to-me). Default to assigned-by-me when the persona heads any unit (`headedUnitUuids.length > 0`) else assigned-to-me; hide the toggle for non-managers who have never assigned (check both feeds non-empty to decide whether to show). 
- `PageHeader` with a "Yangi topshiriq" CTA (opens `CreateTaskDialog`, Task 11) — visible only when `headedUnitUuids.length > 0` (assigner personas). Honor `?create=1` (open the dialog once acting resolves, then strip the param) — mirror `LettersPage`'s `?register=1` effect.
- Fetch `listTasks({ box, ...filters }, acting.employee.uuid)`; re-fetch on POV switch, box change, filter change, and `onChanged`.
- Render `TaskStatsBand` (assigner + assigned-by-me only) → `TasksKanban` on `lg+` / `TasksTabsMobile` below. Full loading/empty/error states (`EmptyState` "Topshiriqlar yo'q").

- [ ] **Step 4: Build + lint + route sweep**

Run: `cd dashboard && npm run build && npm run lint`. Dev-server: `/tasks` shows the seeded board for each persona (switch POV: Akhmedov sees his assigned board + stats band; Sobirova sees her inbox, no stats band). Expected: clean.

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 11: CreateTaskDialog + task.schema.ts + taskErrors.ts

**Files:**
- Create: `dashboard/src/features/tasks/task.schema.ts`
- Create: `dashboard/src/features/tasks/taskErrors.ts`
- Create: `dashboard/src/features/tasks/CreateTaskDialog.tsx`

**Reference pattern:** `RegisterLetterDialog.tsx` (`ResponsiveDialog` + RHF + zod, fresh defaults per open, success toast) and `letterErrors.ts`.

- [ ] **Step 1: task.schema.ts**

```ts
import { z } from 'zod';

export const createTaskFormSchema = z.object({
  title: z.string().min(3, 'tasks.errors.title-required'),
  description: z.string().min(1, 'tasks.errors.description-required'),
  priority: z.enum(['HIGH', 'MEDIUM', 'STANDARD']),
  assigneeUuid: z.string().min(1, 'tasks.errors.assignee-required'),
  deadline: z.string().min(1, 'tasks.errors.deadline-required'),
  // attachment handled outside RHF as metadata (MetaFileField) or a doc Combobox
});
export type CreateTaskForm = z.infer<typeof createTaskFormSchema>;
```

(Past-deadline is a confirm prompt in the dialog, not a schema error — UC-07 A2.)

- [ ] **Step 2: taskErrors.ts**

Map `TaskValidationError.code` → localized toast keys (mirror `letterErrors.ts`):

```ts
import { toast } from 'sonner';
import i18n from '@/i18n'; // confirm the real i18n import used by letterErrors
import { TaskValidationError, MockNetworkError } from '@/lib/mock-backend/errors'; // confirm path

export function handleTaskError(e: unknown): void {
  if (e instanceof TaskValidationError) {
    toast.error(i18n.t(`dashboard:tasks.errors.${e.code}`));
  } else if (e instanceof MockNetworkError) {
    toast.error(i18n.t('common:errors.network'));
  } else {
    toast.error(i18n.t('common:errors.unknown'));
  }
}
```

(Match how `letterErrors.ts` actually surfaces toasts — reuse its exact import + helper shape.)

- [ ] **Step 3: CreateTaskDialog**

`ResponsiveDialog`. Fields: title `Input`, description `Textarea`, priority `Select`, deadline native date input (min = today; if a past date is chosen, a confirm step before submit per UC-07 A2 — though min should prevent it, keep the confirm for safety), assignee `Combobox` **client-side filtered to the acting persona's subtree** (compute the in-scope employee list: employees whose primary unit path is under one of `headedUnitUuids`; show an inline "{FIO} ta'tilda" warning if the chosen assignee's status is `ON_LEAVE`, UC-07 A3), optional attachment (`MetaFileField` for a file OR a document `Combobox` over the persona's documents — pick one; keep simple: a `MetaFileField` + an optional "Hujjat biriktirish" document Combobox). On submit: `createTask(input, acting.employee.uuid)` → success toast with the assigned number → close + `onChanged()`. Errors via `handleTaskError`. Wire to the TasksPage CTA + `?create=1`.

- [ ] **Step 4: Build + lint + manual**

Run: `cd dashboard && npm run build && npm run lint`. Dev: as Akhmedov, create a task for Sobirova → appears in NEW; the assignee Combobox excludes out-of-subtree employees; HR_ADMIN (no headed unit) doesn't see the CTA. Expected: clean.

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 12: TaskDetailPage (full) + TaskCommentThread

**Files:**
- Rewrite: `dashboard/src/features/tasks/detail/TaskDetailPage.tsx` (replace the Task 8 stub)
- Create: `dashboard/src/features/tasks/detail/TaskCommentThread.tsx`

**Reference pattern:** `LetterDetailPage.tsx` / `documents/detail/DocumentDetailPage.tsx` (hero band + `lg:grid-cols-3` + re-resolve on POV switch) and `ApprovalSheetCard.tsx` (rail vocabulary for the thread).

- [ ] **Step 1: TaskCommentThread**

Chronological list of `TaskComment`s. Each row: author FIO (from `TaskDetail.commentAuthors`) + a kind badge (Izoh so'rovi / Javob / Qaytarish izohi / Rad etish sababi / Eslatma) + body + `formatRelative` timestamp. Use the `AssignmentTimeline` rail vocabulary (border-l rail, dots). Empty → muted "Hozircha izohlar yo'q".

- [ ] **Step 2: TaskDetailPage**

- Fetch `getTask(uuid)`; re-resolve on POV switch (`acting.employee.uuid` in deps); loading/error/not-found states.
- **Hero:** number + title + `StatusBadge` + priority badge + overdue treatment (AlertTriangle + sr-only when `isTaskOverdue`).
- **`TaskActions`** bar (Task 13) below the hero.
- **`lg:grid-cols-3`:** left (2/3) = description card + deliverable card (summary + file chip / linked document link to `/documents/:uuid` + submittedAt + late badge) + `TaskCommentThread`; right (1/3) = metadata card (assigner / assignee + position/unit / deadline / priority / round / late flag / created) + attached-document card (links `/documents/:uuid` when `attachedDocumentUuid`) + review-outcome card (reviewNote when DONE-with-note; reject reason surfaced from the thread when REJECTED).
- Pass an `onChanged` that re-fetches + bumps any home/queue counters.

- [ ] **Step 3: Build + lint + manual**

Run: `cd dashboard && npm run build && npm run lint`. Dev: open a seeded UNDER_REVIEW task — deliverable + thread + metadata all render; open the round-2 task — the RETURN_FEEDBACK comment shows. Expected: clean.

- [ ] **Step 4: Checkpoint** — leave changes in the tree.

---

## Task 13: TaskActions + the 5 dialogs

**Files:**
- Create: `dashboard/src/features/tasks/detail/TaskActions.tsx`
- Create: `dashboard/src/features/tasks/detail/SubmitDeliverableDialog.tsx`
- Create: `dashboard/src/features/tasks/detail/ReviewDialog.tsx`
- Create: `dashboard/src/features/tasks/detail/ClarificationDialog.tsx`
- Create: `dashboard/src/features/tasks/detail/EditTaskDialog.tsx`
- Create: `dashboard/src/features/tasks/detail/ExtendDeadlineDialog.tsx`

**Reference pattern:** `documents/detail/DocumentActions.tsx` (persona-aware action bar — the policy layer re-validates) + the document `DecideDialog`/`SignDialog` for the dialog shapes.

- [ ] **Step 1: TaskActions (persona-aware bar)**

Compute role flags from `TaskDetail` + acting persona:
- `isAssignee = acting.uuid === task.assigneeUuid`; `isAssigner = acting.uuid === task.assignerUuid`.
- `hasOpenClarification` = the last `CLARIFICATION_REQUEST` has no following `CLARIFICATION_REPLY`.

Render:
- assignee · `NEW` → **Boshlash** (`startTask`); `IN_PROGRESS` → **Topshirish** (opens `SubmitDeliverableDialog`) + **Izoh so'rash** (opens `ClarificationDialog` in request mode);
- assigner · `UNDER_REVIEW` → **Qabul qilish / Izoh bilan qabul / Qaytarish / Rad etish** (open `ReviewDialog` with the variant preselected); non-terminal → **Tahrirlash** (`EditTaskDialog`) + **Muddatni uzaytirish** (`ExtendDeadlineDialog`); `hasOpenClarification` → **Javob berish** (`ClarificationDialog` in reply mode);
- non-actor → muted "Hozir {FIO} navbati"; terminal → muted closing line ("Topshiriq yakunlandi" / "Rad etilgan").

Each action calls its mutation with `acting.employee.uuid`, then `onChanged()`; errors via `handleTaskError`.

- [ ] **Step 2: SubmitDeliverableDialog**

`ResponsiveDialog` + RHF. Fields: summary `Textarea` + optional `MetaFileField` OR a document `Combobox` (the assignee's own SIGNED/CLOSED documents, like the letter ExecuteDialog response path). No-attachment submit allowed with an explicit confirm (UC-08 A1: "Ilovasiz topshirilsinmi?"). Submit → `submitDeliverable(uuid, input, acting.uuid)`.

- [ ] **Step 3: ReviewDialog (4-variant)**

`ResponsiveDialog` + RHF. A `RadioGroup` over Accept / Accept-with-note / Return / Reject. Conditional field: note `Textarea` (optional) for Accept-with-note; reason `Textarea` (required, min 5 chars) for Return + Reject — show a consequence banner for Return ("Topshiriq qayta ishlashga qaytariladi") and Reject ("Topshiriq rad etiladi"). Submit → `reviewTask(uuid, { decision, text }, acting.uuid)`. Opened from drag-to-DONE (accept preselected) / drag-to-IN_PROGRESS (return preselected) / the action buttons.

- [ ] **Step 4: ClarificationDialog (request + reply)**

`ResponsiveDialog` + RHF. One `Textarea` (required). `mode: 'request' | 'reply'` prop → calls `requestClarification` or `answerClarification`. Title/CTA copy switches by mode.

- [ ] **Step 5: EditTaskDialog + ExtendDeadlineDialog**

`EditTaskDialog`: `ResponsiveDialog` over title/description/priority/deadline (prefilled), → `updateTask`. Significant edits show a confirm. `ExtendDeadlineDialog`: a focused date input (min = today) → `updateTask({ deadline })`; both record audit (the backend already differentiates `context.kind`).

- [ ] **Step 6: Build + lint + manual walk**

Run: `cd dashboard && npm run build && npm run lint`. Dev: walk a task end-to-end via POV switching — Akhmedov creates → Sobirova starts → requests clarification → Akhmedov answers → Sobirova submits → Akhmedov returns → Sobirova resubmits → Akhmedov accepts-with-note. Confirm each action button appears only for the right persona/state and the thread + status update correctly. Expected: clean.

- [ ] **Step 7: Checkpoint** — leave changes in the tree.

---

## Task 14: Wire drag-opens-dialog on the board

**Files:**
- Modify: `dashboard/src/features/tasks/TasksKanban.tsx`
- Modify: `dashboard/src/features/tasks/TasksPage.tsx` (pass dialog-open callbacks / host the dialogs)

**Reference:** `CertificatesKanban.tsx` `onDragEnd` (optimistic move + mutation + rollback on failure).

- [ ] **Step 1: Implement onDragEnd with policy-aware routing**

On drop, compute `from = task.status`, `to = targetColumn`. Map per the spec:

```ts
// NEW → IN_PROGRESS : assignee only → startTask directly (optimistic, rollback on error)
// IN_PROGRESS → UNDER_REVIEW : open SubmitDeliverableDialog (no optimistic move; commit on dialog success)
// UNDER_REVIEW → DONE : open ReviewDialog (accept preselected)
// UNDER_REVIEW → IN_PROGRESS : open ReviewDialog (return preselected)
// anything else : snap back + toast (dashboard:tasks.errors.invalid-move)
```

For the direct move (`startTask`): optimistically update local state, call the mutation, on error roll back + `handleTaskError`. For dialog moves: do **not** move the card; open the dialog seeded with the task; on dialog success the parent `onChanged()` re-fetch reflects the new column; on cancel nothing changes (card never visually moved). Disallowed moves: toast + no state change.

Gate by acting persona: if `box === 'assigned-to-me'` only assignee moves are possible; if `assigned-by-me` only assigner moves. The backend re-validates regardless (defense in depth — never rely on the board gating alone).

- [ ] **Step 2: Host the dialogs**

Lift `SubmitDeliverableDialog` / `ReviewDialog` open-state to `TasksPage` (or a small board controller) so a drag can open them with the target task. Reuse the exact dialog components from Task 13.

- [ ] **Step 3: Build + lint + manual drag test**

Run: `cd dashboard && npm run build && npm run lint`. Dev (desktop): as Sobirova drag a NEW card → IN_PROGRESS (commits); drag IN_PROGRESS → UNDER_REVIEW (opens submit dialog; cancel → card stays; confirm → moves). As Akhmedov drag UNDER_REVIEW → DONE (review dialog, accept) and → IN_PROGRESS (return dialog). Drag a disallowed move → snaps back + toast. Expected: clean; invalid drags never mutate.

- [ ] **Step 4: Checkpoint** — leave changes in the tree.

---

## Task 15: Home integration

**Files:**
- Create: `dashboard/src/features/dashboard-home/PendingTasksAlert.tsx`
- Modify: `dashboard/src/features/dashboard-home/QuickActions.tsx`
- Modify: `dashboard/src/features/dashboard-home/DashboardHome.tsx`

**Reference:** `PendingApprovalsAlert.tsx` (null-able persona-aware alert) + the step-22 `QuickActions` persona gating.

- [ ] **Step 1: PendingTasksAlert**

Persona-aware, beside `ExpiringCertsAlert` + `PendingApprovalsAlert`. Compute from the acting persona:
- if assigner (heads a unit): count `UNDER_REVIEW` tasks where `assignerUuid === acting.uuid` → "Sizda {N} ta topshiriq ko'rib chiqishni kutmoqda" → `/tasks`.
- else (assignee): count open tasks (`NEW`/`IN_PROGRESS`) where `assigneeUuid === acting.uuid` → "Sizda {N} ta faol topshiriq" → `/tasks`.
- Null when zero. Re-resolve on POV switch (`acting.employee.uuid` dep) + `onChanged`/queue bump. Use `listTasks` with the appropriate box + client-side status filter.

- [ ] **Step 2: QuickActions tile**

Add a **"Topshiriq berish"** tile → `/tasks?create=1`, visible only when `headedUnitUuids.length > 0` (assigner personas) — the "don't render controls irrelevant to the role" pattern. Adjust the grid column count if needed (it widened to `lg:grid-cols-6` in step 22 — confirm and keep balanced).

- [ ] **Step 3: Wire the alert into DashboardHome**

Render `<PendingTasksAlert />` after `<PendingApprovalsAlert />`. Keep `StatsRow` at its current 6 cards (do **not** add a 7th — the task surfacing is the quick action + this alert).

- [ ] **Step 4: Build + lint + manual**

Run: `cd dashboard && npm run build && npm run lint`. Dev: as Akhmedov, home shows "ko'rib chiqishni kutmoqda" alert (he has a seeded UNDER_REVIEW) + the Topshiriq berish quick action; as Sobirova, home shows "faol topshiriq" alert, no quick action; switch POV and confirm the alert re-resolves. Expected: clean.

- [ ] **Step 5: Checkpoint** — leave changes in the tree.

---

## Task 16: Full verification battery + adversarial review

**Files:** none new — verification + inline fixes.

- [ ] **Step 1: Build + types + lint**

Run: `cd dashboard && npm run build` — Expected: clean; note module count + gzip (should stay well under the 500 KB gzip target; M2 ended ~314 KB).
Run: `cd dashboard && npm run lint` — Expected: only the tolerated `set-state-in-effect` clones (URL→state sync, dialog-draft-reset, list-reset-before-fetch). Any new lint error outside that idiom must be fixed.

- [ ] **Step 2: i18n audit**

Run the project's i18n grep audit (the M2 pattern — confirm every `t('…')` / `titleKey` / `labelKey` referenced in the new `features/tasks/**` resolves in `uz.json`; no Cyrillic literals; no `toast.<level>("literal")`; no raw JSX text; no `PLYMA`/`PLYMO`; no tech-stack leak). Fix any missing keys.

```bash
cd dashboard
# every dashboard:tasks.* / common:status.* / notifications.title.TASK_* key referenced must exist in uz.json
grep -rEo "(dashboard|common):[a-zA-Z0-9_.-]+" src/features/tasks src/features/dashboard-home | sort -u
# cross-check each against uz.json (script or manual)
grep -rnP '[\x{0400}-\x{04FF}]' src/features/tasks || echo "no Cyrillic"
```

- [ ] **Step 3: Route sweep**

Dev server: confirm all routes 200 incl. `/tasks` + `/tasks/:uuid`; cold-boot console error-free.

- [ ] **Step 4: Re-run the node harness (Task 6)**

Re-bundle + run the harness against the final backend. Expected: `PASS N / FAIL 0`. Add any assertions that the implementation revealed as worth locking (e.g. stats correctness, `attachedDocumentUuid` resolution in `getTask`).

- [ ] **Step 5: Adversarial multi-dimension diff review**

Dispatch parallel review agents over the diff (the M2 close-out ritual), one per dimension: (1) correctness/policy — does every mutation enforce its guard against the acting persona, is the audit one-entry-per-transition + append-only, is terminal immutability airtight; (2) status-machine — does every UI status match `TaskStatus`, no invented states, drag map correct; (3) a11y/i18n — overdue never color-alone, tap targets, focus, all keys resolve UZ; (4) reuse/react — shared primitives reused (no forked Kanban), effects follow the tolerated idioms. Each finding gets per-finding skeptic verification; fix confirmed findings inline.

- [ ] **Step 6: CLAUDE.md "Verification Before Done" checklist**

Explicitly confirm: audit records who/what/when/from-where + append-only; role/scope enforced at the policy layer (a user outside the subtree cannot assign — verified in the harness, not just UI-hidden); notifications fire on every state transition (harness); Uzbek copy reviewed, no `[NEEDS_TRANSLATION]`.

- [ ] **Step 7: QA_NOTES.md**

Add a "Milestone 3 QA" section to `dashboard/QA_NOTES.md` with the automated results + the observational sweep handed to the operator (six viewports 360/390/768/1024/1280/1920, touch-drag caveat on the mobile board, keyboard-only task walk, reduced-motion, focus/contrast, the drag-opens-dialog rollback on cancel).

- [ ] **Step 8: Checkpoint** — leave changes in the tree.

---

## Task 17: Doc cascade

**Files:**
- Modify: `README.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `docs/bpmn/README.md`
- Modify: `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`, `ai_context/LESSONS.md`

- [ ] **Step 1: README.md**

Module 5 (Task Delegation) → reflect it's now demo-complete in the dashboard; update the roadmap/milestone line (M1 + M2 + M3 demo-complete).

- [ ] **Step 2: business-processes.md BP-2 — Demo line + assignee reconciliation**

Add a **Demo** line under BP-2 (like BP-3/BP-4 got in step 22): the `/tasks` board + `/tasks/:uuid` walk via the POV switcher (Akhmedov → Sobirova; Karimov → Akhmedov), auto-numbered `TOP-2026/NNNN`. **Reconcile the single-assignee decision:** in the BP-2 step table, the "Assign to an employee" step is already singular — confirm it, and add a one-line note that the BPMN diagram's "Xodim yoki xodimlarga" wording is superseded by the canonical single-assignee model (per CLAUDE.md "fix the doc first"; the PNG itself isn't re-rendered, the text is authoritative).

- [ ] **Step 3: use-cases.md — demo coverage**

In the Demo-coverage table, flip UC-07 / UC-08 / UC-09 from ⬜ Milestone 3 → ✅ Full with the `/tasks` + `/tasks/:uuid` routes.

- [ ] **Step 4: glossary.md**

Add **Topshiriq** (task) — the BP-2 unit of delegated work; assigner (Rahbar/Bo'lim boshlig'i) → assignee (Xodim); Kanban: Yangi → Jarayonda → Ko'rib chiqilmoqda → Bajarildi.

- [ ] **Step 5: bpmn/README.md**

BP-2 row: milestone column `M3 — planned` → `M3 — shipped`.

- [ ] **Step 6: ai_context updates**

- `AI_CONTEXT.md`: Module 5 status; add an M3 paragraph (mirroring the M2 step paragraphs) describing the tasks domain, board, detail, dialogs, home integration, seed (`SEED_VERSION '11'`, ~12 tasks), and verification; update the build-state line (module count + gzip from Task 16); update the "Next" section (M3 done; remaining = observational QA, user manual, ru.json, operations runbook, code-splitting).
- `HISTORY.md`: a new reverse-chronological M3 work entry (date 2026-06-14+, summary, files touched, verification results).
- `LESSONS.md`: any new trap surfaced during build (e.g. the drag-opens-dialog rollback pattern, the subtree-scope predicate, or a `@dnd-kit` gotcha).

- [ ] **Step 7: Final checkpoint**

Run: `cd dashboard && npm run build && npm run lint` one last time — clean. Leave the **entire** working tree uncommitted for the user's `/commit`. Summarize what landed + the verification evidence; do **not** run `git commit`.

---

## Plan self-review notes

- **Spec coverage:** §2 model → Task 1; §3 backend (policy/reads/mutations/drag) → Tasks 2–4 + 14; §4 UI (board/detail/dialogs/home) → Tasks 8–15; §5 cross-cutting → Tasks 1,2,7; §6 seed → Task 5; §7 verification → Tasks 6,16; §8 doc cascade → Task 17. All sections mapped.
- **Type consistency:** `TaskEntity`/`TaskComment`/`TaskDeliverable`/`TaskStatus`/`TaskPriority`/`TaskReviewDecision` and the mutation signatures (`createTask`, `updateTask`, `startTask`, `requestClarification`, `answerClarification`, `submitDeliverable`, `reviewTask`) + reads (`listTasks`, `getTask`/`TaskDetail`, `getTaskStats`/`TaskStats`, `isTaskOverdue`) are used consistently across tasks. `TaskValidationCode` codes match the spec's policy table.
- **Known verify-against-codebase points flagged inline** (helper names like `employeeNameFor`/`readDocuments`/`readPositions`, the `Unit.path`/`Assignment` open-marker shape, the i18n import in `letterErrors.ts`, `PageHeader`/`Protected` exact imports) — these are the only places the engineer must confirm a real name; everything else is complete code.
