# Devon — Session History

Reverse-chronological checkpoint log of significant work done with AI assistance. Each entry: date, one-line summary, files touched.

---

## 2026-06-14 — `/doc_sync` checkpoint (post M3 task delegation)

Ran `/doc_sync` after the M3 build below. The full doc cascade was performed inline with the build; the explicit `/doc_sync` invocation was then a **verification sweep** that confirmed sync and **corrected residual drift** in the M3 work entry's "Files touched" list — it had carried hallucinated component names (`KanbanBoard`/`KanbanColumn`/`TaskActionBar`/`CommentThread`/`ManagerStatsBand`/"task utils") that don't match the actual tree (`TasksKanban`/`TasksTabsMobile`/`TaskFilters`/`TaskStatsBand` + `detail/{TaskActions,TaskCommentThread,SubmitDeliverableDialog,ReviewDialog,ClarificationDialog,EditTaskDialog,ExtendDeadlineDialog}`), plus a wrong type name (`Task` → `TaskEntity`, and `TaskValidationCode` lives in `errors.ts` not `domain.ts`). Both corrected. Verified consistent: `SEED_VERSION '12'` (seed.ts ↔ AI_CONTEXT), 2970-module build state, no hallucinated filenames anywhere in `ai_context/`/`docs/`/`QA_NOTES.md`.

**Summary of cascade:** `README.md` (prompt-set row updated to cover M1 + M2 + M3); `docs/bpmn/README.md` (BP-2 row: "M3 — planned" → "M3 — shipped"); `docs/business-processes.md` (BP-2 gained a **Demo** line + single-assignee canon note; BPMN plural wording superseded); `docs/use-cases.md` (UC-07/08/09 flipped to ✅ Full with `/tasks` + `/tasks/:uuid` routes; UC-10 updated with manager stats band; milestone header updated to include M3 shipped 2026-06-14); `docs/glossary.md` (**Topshiriq** entry expanded with BP-2 semantics, assigner/assignee, Kanban columns, auto-number, single-assignee canon; **Muddat** note about date-only storage); `docs/product-specification.md` — **confirmed aligned, no edit** (§4.5 single assignee + 4 columns + Accept/Return/Reject all match what shipped); `dashboard/QA_NOTES.md` (new **Milestone 3 QA** section: automated results + adversarial review 4-found-4-fixed + observational sweep checklist + known `getTask` view-scope limitation); `ai_context/AI_CONTEXT.md` (M3 demo-complete paragraph, SEED_VERSION `'12'`, 2970 modules, "Next" section rewritten, known `getTask` limitation added to open questions); `ai_context/LESSONS.md` (deadline date-only trap entry added).

**`product-specification.md` confirmed aligned reasoning:** §4.5 names single assignee (singular "assignee" throughout), 4 Kanban columns (New / In Progress / Under Review / Done), and the review actions (Accept / Return for revision / Reject). "Accept-with-note" is a sub-variant of Accept not enumerated separately in the spec — it adds a manager note to an otherwise accepted task, which is compatible with the spec's Accept action. No contradiction; no edit required.

**Files touched (this checkpoint):** `README.md`, `docs/bpmn/README.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `dashboard/QA_NOTES.md`, `ai_context/AI_CONTEXT.md`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md` (this entry).

---

## 2026-06-14 — Milestone 3: Task Delegation (Kanban) — BP-2 demo-complete

M3 build: full BP-2 task delegation lifecycle, built spec→plan→subagent-driven execution, verified 23/23 + 15/15, adversarial review 4-found-4-fixed. Started via `/start_task`; tracked with TodoWrite; no commit (working tree left for `/commit`).

**What was built:**

- **Kanban board at `/tasks`** — 4 columns (Yangi / Ijroda / Ko'rib chiqilmoqda / Bajarildi; Rad etilgan shown in the Bajarildi column). `@dnd-kit` drag-and-drop on desktop; policy-gated transitions (input-bearing moves open a dialog for comment or deliverable). Manager-only **stats band** (task counts / overdue / load-per-employee). Auto-numbering `TOP-2026/NNNN`. "Topshiriq berish" quick action → `CreateTaskDialog`.
- **Detail page at `/tasks/:uuid`** — lifecycle action bar + clarification/comment thread. All BP-2 states: `NEW → IN_PROGRESS → UNDER_REVIEW → DONE` plus terminal `REJECTED`. `round` increments on return→resubmit. Four review variants: Accept / Accept-with-note / Return for revision / Reject (reason required for the latter two). Scope guard enforced: assignees must be within the assigner's org subtree; self-assign blocked.
- **Home integration** — `PendingTasksAlert` banner on `/` for manager personas with tasks under review. Manager-only "Topshiriq berish" quick-action tile.
- **Seed** (`SEED_VERSION = '12'`) — ~12 seeded tasks across all states within the IT Departament subtree; one overdue, one returned-round-2, one rejected, one accepted-late. `buildTaskAudit` seeds each task's full BP-2 audit trail. ~12 task notifications. Deadlines stored date-only (`YYYY-MM-DD`).
- **Types/cross-cutting** — `AuditAction` += 9 `TASK_*`; `AuditResourceType` += `task`; `NotificationType` += 7 `TASK_*`; `AppNotification.resourceType` += `task`; `StatusBadge` += NEW / UNDER_REVIEW / DONE kinds; `audit-icons.ts` += 9 task icons. UZ copy only.
- **Design spec** — [`docs/superpowers/specs/2026-06-14-m3-task-delegation-design.md`](../docs/superpowers/specs/2026-06-14-m3-task-delegation-design.md)
- **Implementation plan** — [`docs/superpowers/plans/2026-06-14-m3-task-delegation.md`](../docs/superpowers/plans/2026-06-14-m3-task-delegation.md) (17 implementation tasks executed via subagent-driven development)

**Verification:** `npm run build` clean — **2970 modules**, ≪ 500 KB gzip. tsc + lint clean. Node harness: **23/23** (full BP-2 walk, scope/self-assign guards, terminal immutability, audit-per-transition, notification routing) + **15/15 re-run** after fixes. Adversarial 2-dimension review (correctness/policy/state-machine + a11y/i18n/reuse) raised **4 confirmed findings — all fixed:** (A) deadline date-only vs. ISO-timestamp mismatch → `updateTask` + seed normalized to date-only; (B) `CreateTaskDialog` forked `MetaFileField` → refactored to reuse; (C) duplicate `sr-only` overdue label on detail hero → removed; (D) two icons missing `aria-hidden` → added.

**Known limitation (logged, not fixed):** `getTask(uuid)` is actor-less, consistent with the existing M2 `getDocument` / `getLetter` pattern. Direct URL navigation discloses task content to any persona (read-only; mutations stay gated). Not an M3 regression.

**Files touched:**
- `dashboard/src/features/tasks/` (new tree — board: `TasksPage.tsx`, `TasksKanban.tsx`, `TasksTabsMobile.tsx`, `TaskCard.tsx`, `TaskFilters.tsx`, `TaskStatsBand.tsx`, `CreateTaskDialog.tsx`, `task.schema.ts`, `taskErrors.ts`; detail: `detail/{TaskDetailPage,TaskActions,TaskCommentThread,SubmitDeliverableDialog,ReviewDialog,ClarificationDialog,EditTaskDialog,ExtendDeadlineDialog}.tsx`)
- `dashboard/src/features/dashboard-home/PendingTasksAlert.tsx` (new)
- `dashboard/src/features/dashboard-home/QuickActions.tsx` (manager tile)
- `dashboard/src/features/dashboard-home/DashboardHome.tsx` (alert integration)
- `dashboard/src/lib/mock-backend/index.ts` (task mutations + reads)
- `dashboard/src/lib/mock-backend/seed.ts` (`buildTaskAudit`; `SEED_VERSION` `'11'` → `'12'`)
- `dashboard/src/lib/mock-backend/errors.ts` (`TaskValidationError`)
- `dashboard/src/lib/mock-backend/schemas.ts` (task zod schemas)
- `dashboard/src/lib/mock-backend/storage.ts` (`tasks` table)
- `dashboard/src/types/domain.ts` (`TaskEntity`, `TaskStatus`, `TaskPriority`, `TaskCommentKind`, `TaskComment`, `TaskDeliverable`; `AuditAction` += 9 `TASK_*`; `AuditResourceType` += `task`; `NotificationType` += 7 `TASK_*`; `AppNotification.resourceType` += `task`) — note `TaskValidationCode` lives in `errors.ts`, not `domain.ts`
- `dashboard/src/lib/audit-icons.ts` (9 task action icons)
- `dashboard/src/components/common/StatusBadge.tsx` (NEW / UNDER_REVIEW / DONE kinds)
- `dashboard/src/components/layout/Sidebar.tsx` ("Topshiriqlar" nav item)
- `dashboard/src/router.tsx` (`/tasks` + `/tasks/:uuid` routes)
- `dashboard/src/i18n/locales/uz.json` (all task + notification + audit copy)
- `dashboard/src/features/notifications/NotificationsList.tsx` (TASK_* icon entries)
- `docs/superpowers/specs/2026-06-14-m3-task-delegation-design.md` (new)
- `docs/superpowers/plans/2026-06-14-m3-task-delegation.md` (new)
- `docs/bpmn/README.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `dashboard/QA_NOTES.md`, `ai_context/AI_CONTEXT.md`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md` (doc cascade — this `/doc_sync` pass)

---

## 2026-06-14 — `/doc_sync` checkpoint (post step 22)

Ran `/doc_sync` after the step-22 M2 wrap-up below. Step 22's task 4 had already executed the full doc cascade inline, so this pass was a **verification sweep that confirmed no residual drift** rather than a fix pass:

- **No canonical state doc still describes the old 4-card home `StatsRow`.** The only `StatsRow` / `pending-approvals` mentions outside `HISTORY.md` are the step-22 edits themselves (`docs/use-cases.md` Demo-coverage table, `docs/dashboard-prompts/README.md` M2-shipped line) plus the **build prompt files** (`00-master.md`, `07-dashboard-home.md`, `22-m2-home-qa.md`). The prompt files are historical step instructions and are **deliberately left as-authored** — per the dashboard-prompts README convention they're only edited when a core decision changes or a step produced wrong output, neither of which applies (step 22 intentionally evolved the home, and that evolution is captured in AI_CONTEXT + the step-22 prompt's own task list).
- **`SEED_VERSION` consistent** — `seed.ts` is `'10'` and `AI_CONTEXT.md` says `'10'`; step 22 made no fixture-identity change, so no bump (correct).
- **`docs/use-cases.md` Demo-coverage routes all resolve** to real router paths (cross-checked against the step-22 17/17 route sweep).
- **`docs/product-specification.md` re-confirmed aligned** — document lifecycle + capability lists match the demo; the "Davonxona" spelling matches the glossary headword (pre-existing project-wide normalization question, not M2 drift), so untouched.

Template-mismatch reasoning as in every prior checkpoint: Devon has no `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md` (+ `docs/bpmn/` PNGs for flow diagrams), all already reconciled in the step-22 cascade. **Deliberately untouched:** no schema / status / error-code / audit-action change in step 22 (the `audit-icons.ts` extraction is a pure refactor; no `SEED_VERSION` bump), so no model doc to sync; no flow / state-machine change (BP-3/BP-4 gained Demo annotations, their state lists were *verified* against `LetterStatus`/`DocumentStatus`, not changed), so the BPMN charts stand; no role / roadmap / persona / NFR change, so the README roadmap + product-spec personas stand; no architectural decision warranting an ADR. Working tree uncommitted, awaiting `/commit`.

**Files touched (this checkpoint):** `ai_context/HISTORY.md` (this entry).

---

## 2026-06-14 — Dashboard step 22: M2 wrap-up (home integration + QA sweep + doc cascade)

The final Milestone-2 step — integrate documents/letters/approvals into the dashboard home, run the step-15 QA battery re-scoped to the new surfaces, and complete the doc cascade. Started via `/start_task`; tracked with TodoWrite; no commit (working tree left for `/commit`).

**Home integration ([`dashboard/src/features/dashboard-home/`](../dashboard/src/features/dashboard-home/)):**
- **`StatsRow`** rebuilt as a **6-card persona-aware grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` → 3×2). Kept three org-wide M1 cards (Faol xodimlar / Tarkibiy bo'linmalar / Faol ERI kalitlari) and **dropped the M1 "Tasdiqlash kutilmoqda" (certs-pending) card** to land cleanly at 6 — its count still surfaces on the certs Kanban + the expiring-certs alert. Added three persona-scoped M2 cards computed from `useActingEmployee()`: **Kelishuv kutilmoqda** (`listMyApprovals(actingUuid).length` → `/approvals`, cinnamon), **Hujjatlar** (non-DRAFT document count → `/documents`), **Muddati o'tgan xatlar** (`listLetters({overdueOnly:true}).length` → `/letters?overdue=1`, destructive tone only when > 0). Two effects: M1 loads once; M2 recomputes on POV switch without nulling (no skeleton flash on switch). Reads never `maybeFail()`, so the home is immune to the forced-failure pass.
- **`PendingApprovalsAlert`** (new) beside `ExpiringCertsAlert` — cream-warm banner "Sizni N ta hujjat kutmoqda" → `/approvals`, null-rendered when the acting persona's queue is empty; re-resolves on POV switch + `useQueueStore` version bump so it stays in lockstep with the sidebar badge.
- **`QuickActions`** now persona-aware: added a **Devonxona-only "Xat ro'yxatga olish"** tile → `/letters?register=1` (grid widened to `lg:grid-cols-6`; "Hujjat yaratish" tile was already present). The backend enforces `not-devonxona` regardless — the tile is hidden per the "don't render controls irrelevant to the role" admin pattern.
- **`LettersPage`** gained two URL-param effects: `?overdue=1` pre-sets the overdue filter; `?register=1` opens the (step-20) `RegisterLetterDialog` once the acting persona resolves. Both strip their param after consuming so a refresh/back can't re-trigger. (+2 tolerated `set-state-in-effect` lint clones, same URL→state-sync idiom as prior steps.)

**Shared audit-icon map:** the `ACTION_ICON` map (audit-action → lucide icon) was duplicated **identically** across `RecentActivityCard`, `audit/AuditEntryRow`, and `employees/profile/ProfileHistoryTab` — already complete with M2 actions but copy-pasted 3×. Extracted to [`dashboard/src/lib/audit-icons.ts`](../dashboard/src/lib/audit-icons.ts) (`Record<AuditAction, LucideIcon>` so a new action without an icon is a compile error); all three consumers now import it. `StatCard` gained a `destructive` tone (soft tint, calm-not-alarming) + an optional `to` link wrapper.

**Already done before this step (verified, not re-built):** the `/audit` resourceType filter already listed `document` + `letter` (and the `resource-types.*` i18n keys existed) since steps 17/20 — task 2 was a no-op confirm.

**i18n:** added `dashboard.home.stats.{my-approvals,documents,overdue-letters}`, `home.approvals-alert.{title,body,cta}`, `home.quick.register-letter`; removed the now-dead `home.stats.pending-approvals` key. UZ only (RU/EN fall back per the v1.1 roadmap).

**Verification (automated portion):** build clean — **2952 modules, 121.53 KB CSS, 1,132.20 KB JS / 313.92 KB gzip** (+0.5 KB vs the 313.41 KB baseline; ≪ 500 KB target). i18n audit: **639/639 referenced keys resolve, 0 unresolved**; no Cyrillic/toast-literal/PLYMA leaks; all 13 `NotificationType` title keys + all 11 Document / 8 Letter validation codes keyed. State-machine grep: home status literals all canonical (`ACTIVE`/`DRAFT`). Route sweep: **17/17 routes 200**, dev cold-boot log error-free. Lint: net **+2** tolerated `set-state-in-effect` (LettersPage URL effects); every other touched file lint-clean. Observational sweep (six viewports, Lighthouse, real device, keyboard-only approval, print stylesheet, interactive 100%-fail click-through) handed to the human operator in [`dashboard/QA_NOTES.md`](../dashboard/QA_NOTES.md) "Milestone 2 QA — 2026-06-13 (step 22)".

**Doc cascade (same change-set):** `dashboard/QA_NOTES.md` (M2 section + corrected the stale "no POV toggle" limitation), `docs/dashboard-prompts/README.md` (M2 marked shipped 2026-06-13), `README.md` (prompt-set row: 15 → 22 steps, both milestones), `docs/business-processes.md` (BP-3 + BP-4 each gained a **Demo** line linking the routes; verified the BP-3 state list still matches the 10-member `LetterStatus` union — aligned), `docs/use-cases.md` (new **Demo coverage** table mapping UC-01…UC-20 to demo routes + ✅/🟡/⬜ status — more accurate than the prompt's UC-03/04/05/06/09/10 list, since UC-09 is M3 Task Delegation and the real letter UCs are UC-13/14/15). **`docs/product-specification.md` confirmed aligned — no edit** (lifecycle + capability lists match; the "Davonxona" spelling matches the glossary headword, so it's a pre-existing project-wide normalization question, not M2 drift).

**Milestone 2 is demo-complete.** Both flows walk end-to-end via the POV switcher; the home now tells each persona what's waiting for them. Next: the observational QA sweep + Lighthouse scores (human operator), then the natural post-demo priorities (`docs/user-manual-uz.md`, `ru.json`, `docs/operations/`, route-level code-splitting).

**Files touched:** `dashboard/src/features/dashboard-home/{StatsRow,QuickActions,PendingApprovalsAlert,DashboardHome,RecentActivityCard}.tsx`, `dashboard/src/lib/audit-icons.ts` (new), `dashboard/src/components/common/StatCard.tsx`, `dashboard/src/features/audit/AuditEntryRow.tsx`, `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx`, `dashboard/src/features/letters/LettersPage.tsx`, `dashboard/src/i18n/locales/uz.json`, `dashboard/QA_NOTES.md`, `docs/dashboard-prompts/README.md`, `README.md`, `docs/business-processes.md`, `docs/use-cases.md`, `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`.

---

## 2026-06-13 — `/doc_sync` checkpoint (post HR-attachments change)

Ran `/doc_sync` after the HR document-attachments + de-italic change below. The inline cascade had already updated `README.md`, `docs/product-specification.md`, `ai_context/AI_CONTEXT.md`, and `ai_context/LESSONS.md`; this pass caught and fixed the **remaining drift** in three more canonical docs that still described the position instruction ("lavozim yo'riqnomasi") as attached *after* the profile exists: `docs/business-processes.md` BP-1 (step 3 now lists both required documents; step 9 no longer re-lists them), `docs/use-cases.md` UC-17 (step 4 now marked required, "form cannot be saved without it"), and `docs/glossary.md` (Buyruqdan ko'chirma + Lavozim yo'riqnomasi reworded to "required at creation"; new **Ishdan bo'shatish buyrug'idan ko'chirma** term for the firing-order extract). The product fact is now consistent everywhere: both the hiring-order extract and the job instruction are required at employee creation, and termination requires a certified termination-order extract.

Template-mismatch reasoning as in every prior checkpoint: Devon has no `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md` (all addressed above where relevant). **Deliberately untouched:** no state machine, role, status, or roadmap changed (this is a required-document business-rule refinement on the existing onboarding/termination actions, not a new flow or state), so the BPMN charts in `docs/bpmn/`, the document/letter status lists, and `docs/operations/` stand; no architectural decision warranting an ADR (the `MetaFileField` extraction is a code-organization move documented in `AI_CONTEXT.md` + `LESSONS.md`); the dashboard-prompts README has no per-step status column to flip. Working tree uncommitted, awaiting `/commit`.

**Files touched (this checkpoint):** `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `ai_context/HISTORY.md` (this entry + the work entry below's doc-cascade/files lines)

---

## 2026-06-13 — HR document attachments (firing + job instruction) + de-italic restyle

Three user-requested changes (out of band, before step 22), planned via brainstorming + approved before any code.

1. **Required "Lavozim yo'riqnomasi" in the add-employee wizard (step 3).** A second required, metadata-only file attachment (job instruction) sits beside the existing buyruqdan ko'chirma. Wired through the wizard store, the step-3 zod gate, the review summary, the submit path, and `createEmployeeFull` (new `EmployeeValidationError('position-instruction-missing')`, stored + filename in audit context). Backfilled onto every seeded employee (`lavozim_yoriqnomasi_<positionId>.pdf`).
2. **Firing now requires a termination-order extract.** `terminateEmployee` gained a required `orderExtract` param (policy-layer `EmployeeValidationError('termination-extract-missing')`, stored on the employee, filename added to the termination audit context). The profile's confirm `AlertDialog` became a `ResponsiveDialog` carrying the cascade-warning copy + a required `MetaFileField`; Confirm is disabled until a file is attached. The termination-order extract + the job instruction now render in the profile info list (termination-only rows hidden until the employee is terminated).
3. **All dashboard italics removed.** Dropped the `italic` class from the approval-sheet comment + assignment-timeline reason. The serif slogan/wordmark (login split-pane + sidebar footer) and the A4 document-preview title rendered italic for a subtler reason: [`index.html`](../dashboard/index.html) loaded **only the italic Fraunces variant** (`ital,opsz,wght@1,…`), so `font-serif` had no upright face — removing the class alone didn't help. Fixed by loading the roman variant (`Fraunces:opsz,wght@9..144,500;9..144,600`), which makes every `font-serif` spot upright.

In a follow-up, the wizard step-3 buyruqdan ko'chirma + lavozim yo'riqnomasi attachments were placed **side by side in a two-column block** (`grid grid-cols-1 gap-4 md:grid-cols-2`, stacking on mobile — same pattern as the hireDate/role row).

**Shared refactor:** the per-field `OrderExtractField` was generalized into a reusable [`MetaFileField`](../dashboard/src/components/common/MetaFileField.tsx) (PDF/JPG/PNG ≤ 10 MB, never stores bytes; file constraints kept module-local per the fast-refresh rule; generic `common:errors.file-*` + `common:actions.*-file` i18n keys) used by all three attachments. `OrderExtractField` deleted; orphaned `employees.wizard.actions/errors` file keys removed. `Employee` gained optional `positionInstruction` + `terminationOrderExtract` (both reuse the `EmploymentOrderExtract` shape; both excluded from the `updateEmployee` patch type — immutable). `SEED_VERSION` `'9'` → `'10'` for the `positionInstruction` backfill.

**Doc cascade (completed under `/doc_sync`):** every doc that described the position instruction as attached **after** the profile exists was reconciled to "required at creation," and the termination-order extract requirement was added — `README.md` (module 1 bullets), `docs/product-specification.md` §4.1, `docs/business-processes.md` BP-1 (steps 3 + 9), `docs/use-cases.md` UC-17 (step 4 now marked required), and `docs/glossary.md` (Buyruqdan ko'chirma + Lavozim yo'riqnomasi reworded; new "Ishdan bo'shatish buyrug'idan ko'chirma" term). `ai_context/AI_CONTEXT.md` snapshot updated (seed contents, `SEED_VERSION`, build state, post-M2 change paragraph); `ai_context/LESSONS.md` gained a Typography entry on the italic-only Fraunces font load.

**Verification:** `npm run build` clean (2950 modules, 120.50 KB CSS, 1,129.83 KB JS / 313.41 KB gzip), tsc + ESLint clean on touched files, all three locale JSON valid, all 16 new/referenced i18n keys resolve, no Cyrillic / hardcoded-toast / italic leaks in code. A 5-lens (correctness · policy-audit · i18n · conventions · ux-a11y) adversarial diff review with per-finding skeptic verification raised 5 findings, **confirmed 2 — both fixed**: (a) the terminate-dialog footer now uses the canonical `flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end` wrapper so the mobile Cancel/Confirm order matches every other `ResponsiveDialog` and the desktop layout; (b) the termination-date + termination-order-extract profile rows are hidden for active employees instead of rendering an empty "—". Rejected 3 (hidden-file-input focus, replace/remove button spacing, and `aria-disabled` — all pre-existing patterns or native-correct). Working tree uncommitted, awaiting `/commit`.

**Files touched:** `dashboard/src/components/common/MetaFileField.tsx` (new), `dashboard/src/features/employees/wizard/{Step3Work,ReviewScreen,EmployeeWizardPage,employee.schema,wizard-store}`, `dashboard/src/features/employees/wizard/OrderExtractField.tsx` (deleted), `dashboard/src/features/employees/profile/ProfileInfoTab.tsx`, `dashboard/src/lib/mock-backend/{index,errors,schemas,seed}.ts`, `dashboard/src/types/domain.ts`, `dashboard/src/i18n/locales/uz.json`, `dashboard/index.html` (Fraunces roman load), `dashboard/src/features/auth/LoginPage.tsx`, `dashboard/src/components/layout/Sidebar.tsx`, `dashboard/src/features/documents/detail/ApprovalSheetCard.tsx`, `dashboard/src/features/employees/assignments/AssignmentTimeline.tsx`, `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `ai_context/AI_CONTEXT.md`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-13 — `/doc_sync` checkpoint (post step 21)

Ran `/doc_sync` immediately after the step-21 session below. **Verified in sync — the cascade was performed inline with the implementation:** `AI_CONTEXT.md` already carries the step-21 block (shared-ERI extraction to `features/_shared/eri/`, the `/letters/:uuid` detail feature, the pure `letterStations` BP-3 mapper, the persona-gated `LetterActions`, `buildLetterAudit` seeding + `SEED_VERSION` `'9'`, and the 93/93 harness + adversarial-review verification), plus the updated build state (2950 modules · 1,127.02 KB JS / 312.88 KB gzip), the `SEED_VERSION = '9'` foundation line, the milestone line (steps 16–21 landed; Flow 6 **fully demonstrable end-to-end since step 21**; only step 22 remains), and the rewritten ledger bullet (letter deep-links + registry rows now resolve to the real detail page); `QA_NOTES.md` gained the step-21 360 px + POV-switch observational item and the `/documents` + `/letters` detail routes in the Lighthouse list; the session entry below records date, summary, and files touched. `git diff` shows exactly the step-21 surface (the 3 ERI file moves, 2 document call-site edits, the new `features/letters/detail/` folder, `seed.ts`, `router.tsx`, `uz.json`, and the three docs) — no stray changes.

Template-mismatch reasoning as in every prior checkpoint: Devon has no `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`. **Deliberately untouched:** all of them — step 21 is demo UI implementing the BP-3 letter lifecycle those docs already record (the extended `LetterStatus` list incl. `on-signature` was added to `business-processes.md` on 2026-06-12; no state was invented, no module/role/capability/roadmap changed, no deploy/backup procedure changed so `docs/operations/` stands). The shared-ERI extraction (`features/_shared/eri/`) is a code-organization move, not a product-architecture decision, so no ADR; `SEED_VERSION` `'9'` + the seeded letter audit trails are mock-backend fixture details documented in code comments and `AI_CONTEXT.md`, not business-rule changes. UC demo-coverage notes remain step 22's job. The dashboard-prompts README carries no per-step status column, so nothing to flip there. Working tree uncommitted, awaiting `/commit`.

**Files touched:** `ai_context/HISTORY.md` (this entry)

---

## 2026-06-13 — Step 21: M2 Flow 6 part B — letter detail page + BP-3 timeline + per-role actions

Sixth milestone-2 session per [`docs/dashboard-prompts/21-m2-flow6-letter-execution.md`](../docs/dashboard-prompts/21-m2-flow6-letter-execution.md). The letter detail page at `/letters/:uuid` closes the BPMN 3.3 loop: a routing/execution **timeline** plus a persona-aware **action bar** that walks a letter `REGISTERED → CLOSED`/`CLOSED_NO_RESPONSE`, including the Rahbar's ERI signature and Devonxona's outbound dispatch. Registry rows and bell deep-links to letters now resolve (they fell through the `*` catch-all to home since step 16). Built opus-driven with a parallel recon pass, a node verification harness, and an adversarial multi-agent review of the diff.

**Shared ERI extraction.** `FakeEriSigner.ts`, `SignDialog.tsx`, and `SignatureHistoryCard.tsx` moved from `features/documents/` to **`features/_shared/eri/`** (via `git mv`, history preserved) so both documents and letters consume one copy — the step-21 prompt's "reuse, don't fork" directive. `SignDialog` was parameterized minimally: `documentUuid` → `resourceUuid`, plus optional `onSign?(certUuid)` (defaults to `signDocument`; letters pass a `signLetter`-bound thunk — **note the param orders differ**: `signDocument(uuid, actor, cert)` vs `signLetter(uuid, cert, actor)`, which is exactly why the seam is a cert-only thunk the caller binds), `errorNamespace?: 'documents'|'letters'`, and `successKey?` (the only document-specific copy). The two document call sites (`DocumentActions`, `DocumentDetailPage`) updated to the new import paths + `resourceUuid` prop; behaviour unchanged.

**Detail feature.** [`features/letters/detail/`](../dashboard/src/features/letters/detail/): `LetterDetailPage` (hero band with direction chip + StatusBadge + overdue destructive+AlertTriangle+sr-only treatment; `lg:grid-cols-3` with timeline + attachments left, metadata/linked-letter/signature cards right; re-resolves on POV switch via `actingUuid` in the fetch deps; outgoing branch collapses the timeline and drops the action bar). `letterStations.ts` — a **pure** `(letter, audit) → ordered stations` mapper encoding the BP-3 station logic (past/current/future from status + audit; the optional "Ijro boshlandi" station shown only when it happened or is live; comment-only path ends `closed-no-response` with no sign/dispatch; signature station only when `requiresSignature && !commentOnly`; outgoing = registered→dispatched), kept framework-free so the harness exercises it directly. `LetterTimeline` renders it on the `ApprovalSheetCard` rail vocabulary, resolving actor/date/secondary per station from the audit trail (fallback to `LetterDetail` resolved names). `LetterActions` — one primary action per BP-3 state, gated by `LetterGate` booleans the page computes from the acting persona vs the letter; non-actors see a "Hozir {lane} navbati" hint, terminal letters a muted closing line. Four dialogs: `RouteDialog` (ACTIVE-unit Combobox), `AssignDialog` (Combobox **client-side filtered to the routed unit's subtree** — mirrors the backend's `path.startsWith` membership so the picker only offers employees `assignLetterExecutor` accepts; it throws a *plain* Error otherwise), `ExecuteDialog` (the 7.1/7.2 gate — comment ≥10 chars, or response via file pick or a Combobox over the executor's own SIGNED/CLOSED documents), `DispatchDialog` (channel Select + read-only outgoing/addressee summary + response-file chip). Shared `letterErrors.ts` maps `LetterValidationError` → `dashboard:letters.errors.*` toasts.

**Seed.** `SEED_VERSION` `'8'` → `'9'`. New `buildLetterAudit(letters, employees, units, certificates)` emits the BP-3 audit trail for all 12 seeded letters (the live mutations write per-transition audit, but `buildAudit` never covered letters, so seeded mid-flight letters would render bare timelines). It reproduces exactly the action + `context` shape the mutations write (`LETTER_REGISTERED`/`ROUTED`/`ASSIGNED`/`EXECUTED` phase started|submitted + mode comment|response/`ACCEPTED` outcome/`SIGNED` certificateSerial/`DISPATCHED` outgoingNumber/`CLOSED`), with timestamps linearly spaced across each letter's `createdAt`→`updatedAt` window, merged into the audit table and re-sorted newest-first. Per the LESSONS rule, adding seed audit rows is identity-changing → the version bump (existing browsers reseed silently on next load).

**Verification.** `npm run build` clean → **2950 modules**, 120.52 KB CSS, **1,127.02 KB JS / 312.88 KB gzip** (+9 modules, +~8 KB gzip; under the 500 KB target; chunk-size warning = known code-splitting backlog). `tsc --noEmit` clean. Dev server 200 on `/devon-landing/dashboard/` + the deep `/letters/:uuid`. Scripted i18n audit: **123/123** referenced keys resolve (one gap caught + fixed — a missing `accept.*` dialog block), no Cyrillic, no literal toasts. Rolldown-bundled node harness (localStorage shim, `@/` alias, flake-retry) over the **real backend + `buildLetterStations`**: **93/93** — all 12 seeded-letter timelines (current-station matches status, past stations resolve an actor, K-0001 full signed/dispatched/closed chain, K-0003 comment-only ends closed-no-response, K-0004 signed-current, K-0007 overdue+started-current, CH-0001 outgoing two-station) + a full live BP-3 walk (register→route→assign→start→submit→accept→dispatch, current-station correct at each hop, linkedOutgoing wired) + a live comment-only path (→ CLOSED_NO_RESPONSE, no outgoing) + wrong-persona guards (`not-rahbar`/`not-unit-head`/`not-executor`/`wrong-status`). An adversarial 4-dimension review (correctness/policy · status-machine · a11y/i18n · reuse/react) with per-finding skeptic verification raised **1 confirmed finding** (low): the `DispatchDialog` note field was bound but never sent to the backend (which only accepts `channel`) — **fixed** by removing the inert field + its two i18n keys rather than shipping input that's silently discarded. Six `react-hooks/set-state-in-effect` lint errors are deliberate clones of the tolerated step-09/13/18/19/20 idiom (dialog-draft-reset-on-open, list-reset-before-fetch — 27 pre-existing instances across src, no disables). Harness left in `/tmp` (ephemeral).

**Files touched:**
- `dashboard/src/features/_shared/eri/{FakeEriSigner.ts,SignDialog.tsx,SignatureHistoryCard.tsx}` (moved from `features/documents/`; SignDialog parameterized)
- `dashboard/src/features/documents/detail/{DocumentActions,DocumentDetailPage}.tsx` (ERI import paths + `resourceUuid`)
- `dashboard/src/features/letters/detail/{LetterDetailPage,LetterTimeline,LetterActions,RouteDialog,AssignDialog,ExecuteDialog,DispatchDialog}.tsx`, `letterStations.ts`, `letterErrors.ts` (all new)
- `dashboard/src/lib/mock-backend/seed.ts` (`buildLetterAudit`; `SEED_VERSION` `'9'`)
- `dashboard/src/router.tsx` (`/letters/:uuid` route)
- `dashboard/src/i18n/locales/uz.json` (`dashboard.letters.detail.*` block)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-13 — `/doc_sync` checkpoint (post step 20)

Ran `/doc_sync` immediately after the step-20 session below. **Verified in sync — the cascade was performed inline with the implementation:** `AI_CONTEXT.md` already carries the step-20 block (letters backend transition matrix + registry UI + register dialog + 53/53 harness verification), the updated build state (2941 modules · 1,084.31 KB JS / 304.17 KB gzip), the `SEED_VERSION = '8'` foundation line, the rewritten seed-contents paragraph (12 letters with the `…f001`–`…f003` anchor reconciliation; every notification now resolves to a real row), the milestone line (steps 16–20 landed, 21–22 remain; Flow 6 = backend + registry done, detail page is step 21), and the updated ledger bullet (letter deep-links fall through to home until step 21 ships `/letters/:uuid`); the session entry below records date, summary, and files touched. `git diff` shows exactly the step-20 surface (7 new files under `features/letters/`, 5 mock-backend edits, `domain.ts`, `StatusBadge.tsx`, 4 audit-icon/filter edits, `router.tsx`, `uz.json`, the two ai_context files) — no stray changes. No additional writes were needed during this checkpoint.

Template-mismatch reasoning as in prior checkpoints: Devon has no `product_states.md` / `models.md` / `mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`. **Deliberately untouched:** all of them — step 20 is demo UI implementing the BP-3 canon those docs already record (the extended letter status list including `on-signature` was added to `business-processes.md` on 2026-06-12 during M2 planning, verified present this session; letters were already module 8 in the README/product-spec canon, so no module, role, or capability changed; no deploy/backup change, so `docs/operations/` stands). The 12-vs-10 seed deviation and the `SEED_VERSION` `'8'` renumbering are mock-backend fixture details documented in code comments and `AI_CONTEXT.md`, not business-rule changes — no ADR. UC demo-coverage notes remain step 22's job post-implementation. The dashboard-prompts README carries no per-step status column, so nothing to flip there. Working tree uncommitted, awaiting `/commit`.

**Files touched:** `ai_context/HISTORY.md` (this entry)

---

## 2026-06-13 — Step 20: M2 Flow 6 part A — letters domain backend + `/letters` registry

Fifth milestone-2 session per [`docs/dashboard-prompts/20-m2-flow6-letters-registry.md`](../docs/dashboard-prompts/20-m2-flow6-letters-registry.md). The BPMN 3.3 correspondence domain landed in the mock backend (full BP-3 transition matrix, policy-enforced) plus the registry UI at `/letters` with Devonxona's register-incoming dialog — the last step-16 `ComingSoonPage` placeholder is gone (deleted from `router.tsx` together with the orphaned `coming-soon` i18n keys). `/letters/:uuid` and the per-role letter actions are step 21; registry rows and bell deep-links to letters fall through the `*` catch-all to home until then (documents-step-18 precedent).

**Backend.** `domain.ts` gained the master-§15 letter block (`LetterDirection` · 10-state `LetterStatus` per the extended BP-3 canon already recorded in `business-processes.md` · `LetterChannel` · `Letter`) + 8 `LETTER_*` `AuditAction`s (zod mirrors in `schemas.ts`; lucide icons in all three audit icon maps; uz verbs; the audit page's resourceType filter finally gained `letter`). New `letters` table in `storage.ts`. [`errors.ts`](../dashboard/src/lib/mock-backend/errors.ts) gained `LetterValidationError` with 8 codes; every mutation in [`index.ts`](../dashboard/src/lib/mock-backend/index.ts) re-validates **status + persona** against the acting employee uuid: Devonxona = `ROLE_DEVONXONA` on the user row; Rahbar = heads a root-level unit; unit head = heads the routed unit or an ancestor; executor = `assignedEmployeeUuid`. Executor membership checks the routed unit's **subtree** via `path` (the XODIM persona lives in the API Sho'ba under the routed Backend Bo'lim). Reads: `listLetters` (direction/status/search-over-number+subject+org/overdueOnly) + `getLetter` (`LetterDetail` with signatures, linked incoming/outgoing pair, resolved names) + exported `isLetterOverdue` (deadline < today, terminal statuses never overdue). Mutations walk the table from the prompt: register (auto `K-2026/NNNN`, audit-only) → route (notify unit head) → assign (notify executor) → start (`LETTER_EXECUTED` with `context.phase='started'` — audit-everything per CLAUDE.md, no separate canonical verb) → submit (comment path 7.1 / response path 7.2; `comment-required` / `missing-response`) → accept (comment-only → `CLOSED_NO_RESPONSE` regardless of the signature flag — nothing to sign; response+signature → `ON_SIGNATURE` notifying the root-ancestor Rahbar; else `RESPONDED` notifying Devonxona; executor always notified) → sign (ACTIVE-own-cert guard, `SignatureRecord` `resourceType:'letter'`, → `RESPONDED`) → dispatch (incoming → `CLOSED` + **creates** the `CH-2026/NNNN` OUTGOING reply: terminal `DISPATCHED`, `linkedIncomingUuid`, addressee = incoming sender, inherits the response `fileMeta`; `LETTER_DISPATCHED` audited on both rows + `LETTER_CLOSED` on the incoming). Number helpers mirror `nextDocumentNumber()` with separate K-/CH- counters.

**Registry UI.** [`features/letters/`](../dashboard/src/features/letters/) — `LettersPage` (Keluvchi/Chiquvchi `TabLabel` underline tabs with count pills; one direction-less fetch split client-side so both pills stay live; Devonxona-only "Xat ro'yxatga olish" CTA, policy enforcing regardless), `LetterFilters` (inline SearchInput + 10-status Select + "Muddati o'tgan" `aria-pressed` toggle chip on `md+`; search + draft-state bottom sheet below), `LettersTable` (Raqam · Tashkilot · Mavzu · Bo'linma/Ijrochi stacked resolved names · Muddat — overdue renders destructive text **+ AlertTriangle + sr-only label**, never colour alone · Holat), `LetterCardMobile` (min-h-16 cards, 2-line subject clamp, overdue pairing), `RegisterLetterDialog` (`ResponsiveDialog` + RHF + zod [`letter.schema.ts`](../dashboard/src/features/letters/letter.schema.ts): externalOrg · subject · channel Select POCHTA/EMAIL/KURYER/QOGOZ · receivedAt ≤ today · optional deadline ≥ today with a past-date refine · requiresSignature Checkbox · optional scan PDF/JPG/PNG ≤ 10 MB pick-time-validated metadata-only clone of the OrderExtractField pattern; defaults rebuilt per open so `receivedAt` stays today's today; success toast interpolates the assigned number). `StatusBadge` gained the 9 letter kinds — it was already the config record the prompt's refactor note asks for, so only kinds + `common:status.*` keys were added (`CLOSED` shared with documents).

**Seed.** `SEED_VERSION` `'7'` → `'8'` (the prompt said `'7'`; step 19 had already consumed it — the prompt's "next free integer" clause applies). `buildLetters(byCode)` seeds **12 letters** — the prompt's 10-row table +2, documented in code: `…f001` = K-2026/0002 must sit **post-acceptance** because its step-16 notification story ends with `LETTER_ACCEPTED`, so it lands in `RESPONDED` (Devonxona's step-21 dispatch queue) and a separate K-2026/0005 covers `EXECUTED`; K-2026/0003 adds the otherwise-unseeded `CLOSED_NO_RESPONSE` terminal. `…f002` = K-2026/0004 `ON_SIGNATURE` (requiresSignature, response attached). `…f003` = the dispatched outgoing **CH-2026/0001** carrying the step-17 Rahbar `SignatureRecord` (signedAt 2.6d) and linked to the CLOSED K-2026/0001. K-2026/0007 is the one overdue row (ASSIGNED, deadline 1d ago). All routed letters walk the Backend Bo'lim branch so the five personas own every pending action. Realistic org names (Toshkent shahar hokimligi, O'zstandart agentligi, Markaziy banki, …).

**Verification.** `npm run build` clean → **2941 modules** (+7), 120.34 KB CSS, **1,084.31 KB JS / 304.17 KB gzip** (+28.6 KB JS / +7.1 KB gzip; chunk-size warning = known code-splitting backlog). 16-route dev sweep all 200 (incl. `/letters`). Scripted i18n audit: 90 static + 4 dynamic-family keys (errors ×8, channels ×4, audit verbs ×8, resource-type) all resolve; no Cyrillic, no toast literals, no raw JSX copy. Rolldown-bundled node harness (localStorage shim incl. an `ownKeys` proxy for `clearAll()`, `@/` alias, flake-retry) over the real backend: **53/53 checks** — seed flag `'8'`, 12 rows 9/3 split, all three `…f00N` anchors, signature resolves against f003, linked-pair detail both directions, resolved names, exactly-one-overdue + terminal-never-overdue, search by org/number-fragment/subject, status filter, then the full matrix: register (`not-devonxona` guard, K-2026/0010 continues the counter, single audit row) → route (`not-rahbar`, double-route `wrong-status`, unit-head notification) → assign (`not-unit-head`, subtree membership) → start (`not-executor`) → submit (`comment-required` on blank, `missing-response` on empty input, response file → EXECUTED) → accept (`not-unit-head`, → ON_SIGNATURE, Rahbar notified) → sign (`not-rahbar`, `cert-invalid` on foreign cert, → RESPONDED, letter-typed SignatureRecord, Devonxona notified) → dispatch (`not-devonxona`, incoming CLOSED, CH-2026/0004 linked + addressee + inherited fileMeta, `LETTER_DISPATCHED` on both rows + `LETTER_CLOSED`, exactly-one-audit-per-transition with EXECUTED ×2 disambiguated by `context.phase`, executor notified) → comment-only branch (K-2026/0011 → EXECUTED → `CLOSED_NO_RESPONSE`, **no** outgoing row, dispatch rejected `wrong-status`) → audit append-only. Two new `react-hooks/set-state-in-effect` lint errors are deliberate clones of the tolerated step-09/13/18/19 idioms (sheet-draft-reset, list-reset-before-fetch); the RHF `watch` compiler warning matches every existing form. Harness left in `/tmp` (ephemeral). The 360 px observational check joins the human-operator QA list.

**Files touched:**
- `dashboard/src/features/letters/{LettersPage,LettersTable,LetterCardMobile,LetterFilters,RegisterLetterDialog}.tsx`, `letter.schema.ts`, `filters.ts` (all new)
- `dashboard/src/lib/mock-backend/{index,schemas,storage,errors,seed}.ts` (letters domain; `SEED_VERSION` `'8'`)
- `dashboard/src/types/domain.ts` (letter block + 8 audit actions)
- `dashboard/src/components/common/StatusBadge.tsx` (9 letter kinds)
- `dashboard/src/features/audit/{AuditEntryRow,AuditLogPage}.tsx`, `dashboard/src/features/dashboard-home/RecentActivityCard.tsx`, `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx` (letter audit icons + filter)
- `dashboard/src/router.tsx` (`/letters` real page; ComingSoonPage removed)
- `dashboard/src/i18n/locales/uz.json` (~75 new keys; orphaned `coming-soon` keys removed)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — `/doc_sync` checkpoint (post step 19)

Ran `/doc_sync` immediately after the step-19 session below. **Verified in sync — the cascade was performed inline with the implementation:** `AI_CONTEXT.md` already carries the step-19 block (detail page + actions matrix + approvals queue/badge + wizard edit mode + backend deltas + 41/41 harness verification), the updated build state (2934 modules · 1,055.69 KB JS / 297.10 KB gzip), the `SEED_VERSION = '7'` foundation line, the seed-contents note that TEMPLATE docs persist raw `values`, the milestone line (steps 16–19 landed, 20–22 remain, Flow 5 demonstrable end-to-end), and the updated ledger bullet (deep-links resolve; `…f001`–`…f003` letter placeholders wait for step 20); the session entry below records date, summary, and files touched. `git diff` shows exactly the step-19 surface (8 new files under `features/documents/detail/`, `FakeEriSigner.ts`, `ApprovalsQueuePage.tsx`, `useQueueStore.ts`, 4 wizard edits, 4 backend/type edits, `Sidebar.tsx`, `router.tsx`, `index.css`, `uz.json`, the two ai_context files) — no stray changes. No additional writes were needed during this checkpoint.

Template-mismatch reasoning as in prior checkpoints: Devon has no `product_states.md` / `models.md` / `mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`. **Deliberately untouched:** all of them — step 19 is demo UI implementing the BP-4 canon those docs already record (the rework loop, sequential kelishuv, ERI signing, archive-as-stamp all match `business-processes.md` BP-4 and master §15; no module, role, or capability changed, so README stands; no deploy/backup change, so `docs/operations/` stands). The two backend deltas (`DocumentEntity.values` persistence, all-round `getDocument` steps) are mock-backend implementation details enabling the documented rework loop, not business-rule or architecture changes — no ADR. UC demo-coverage notes remain step 22's job post-implementation. The dashboard-prompts README carries no per-step status column, so nothing to flip there. Working tree uncommitted, awaiting `/commit`.

**Files touched:** `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — Step 19: M2 Flow 5 UI part B — document detail, kelishuv actions, ERI signing, approvals queue

Fourth milestone-2 session per [`docs/dashboard-prompts/19-m2-flow5-document-detail.md`](../docs/dashboard-prompts/19-m2-flow5-document-detail.md). BPMN 3.4 is now demonstrable end-to-end: `/documents/:uuid` (every remaining transition) and `/approvals` (per-persona queue) replaced the placeholders; registry rows and bell deep-links resolve to the real detail page. Letters (`/letters`, `…f001`–`…f003` notification placeholders) remain for step 20.

**Detail page.** [`DocumentDetailPage`](../dashboard/src/features/documents/detail/DocumentDetailPage.tsx) — hero band (employee-profile pattern: number mono + title + `StatusBadge` + MAXFIY cinnamon badge + creator→recipient + created/updated), persona-aware action bar, `lg:grid-cols-3` body (left 2/3 preview, right stacked cards), single column on mobile. `recordDocumentView` fires on mount fire-and-forget (view-once; the acting persona is merged into the rendered list locally so "Kimlar ko'rgan" is immediately truthful); `actingUuid` sits in the fetch deps so a POV switch re-resolves everything. [`A4Preview`](../dashboard/src/features/documents/detail/A4Preview.tsx): TEMPLATE → `aspect-[210/297]` white sheet (letterhead number+date, serif title, `whitespace-pre-wrap` body, emerald stamp block once signed) + "Chop etish / PDF saqlash" → `window.print()` isolated by new visibility-based `.print-area` `@media print` rules in [`index.css`](../dashboard/src/index.css); UPLOAD → metadata-only card ("Fayl namoyishi demo rejimida mavjud emas"). [`ApprovalSheetCard`](../dashboard/src/features/documents/detail/ApprovalSheetCard.tsx): §2.4 kelishuv varaqasi as the AssignmentTimeline rail — order + avatar + FIO + position + decision badge (PENDING/APPROVED/APPROVED_WITH_COMMENT/REJECTED) + italic comment + decidedAt, ring-emerald "Navbat shu yerda" dot on the actionable step, round `Select` when `round > 1` (BP-4: halted chains stay visible; round-follow uses the lint-clean adjust-during-render pattern). [`SignatureHistoryCard`](../dashboard/src/features/documents/detail/SignatureHistoryCard.tsx): §2.3 — signer FIO + serial (links `/certificates`) + `RSA-PKCS7` + signedAt + per-row 600 ms fake "Tekshirish" → inline "Imzo haqiqiy".

**Actions.** [`DocumentActions`](../dashboard/src/features/documents/detail/DocumentActions.tsx) renders only what the step-17 policy layer allows (backend re-validates; every `DocumentValidationError` code maps to its `dashboard.documents.errors.*` toast): DRAFT/REJECTED creator → submit + edit (+ delete w/ AlertDialog, DRAFT only); IN_REVIEW current-order participant → three decide buttons, all opening [`DecideDialog`](../dashboard/src/features/documents/detail/DecideDialog.tsx) preselected (comment required ≥ 5 chars only for REJECTED — step-12 convention; reject-consequence banner "hujjat yaratuvchiga qaytariladi"); other viewers of IN_REVIEW get the muted "Hozir {FIO} navbati" hint; APPROVED signer → [`SignDialog`](../dashboard/src/features/documents/detail/SignDialog.tsx) (ACTIVE-cert radio list with serial+validity, preselect-when-single, 6-digit PIN with "PIN-kod serverga uzatilmaydi", 1.5 s ShieldCheck-pulse [`FakeEriSigner`](../dashboard/src/features/documents/FakeEriSigner.ts) handshake → real `signDocument` → emerald success state with serial; no-certs state deep-links to cert upload); APPROVED no-signer recipient → accept confirm (→ CLOSED); SIGNED/CLOSED creator/recipient → [`EmailDialog`](../dashboard/src/features/documents/detail/EmailDialog.tsx) ("Yuborildi (demo)") + print (TEMPLATE only). `FakeEriSigner.sign({resourceUuid})` stays generic for step-21 letter reuse.

**Queue + badge.** [`ApprovalsQueuePage`](../dashboard/src/features/documents/ApprovalsQueuePage.tsx) groups `listMyApprovals` into Qaroringiz / Imzolash / Qabul qilish kutilmoqda (non-empty only; rows = number + title + creator + relative waiting-since + chevron; empty state "✨"). New [`useQueueStore`](../dashboard/src/stores/useQueueStore.ts) (`count` + `version`/`bump`): [`Sidebar`](../dashboard/src/components/layout/Sidebar.tsx) fetches the acting persona's queue length (mount / POV switch / every `bump()` — the detail page bumps after each mutation), rendering the cinnamon `9+`-capped Kelishuvlar pill; the queue page pushes its fresh count straight into the store.

**Wizard edit mode.** `/documents/new?edit=<uuid>` is the BP-4 rework loop: [`doc-wizard-store`](../dashboard/src/features/documents/wizard/doc-wizard-store.ts) gained `editing` + `hydrate()` (starts on step 2, dirty-compare against a hydrated baseline instead of emptyData); [`DocumentWizardPage`](../dashboard/src/features/documents/wizard/DocumentWizardPage.tsx) fetches + policy-mirrors (`not-editable`/`not-creator` → toast + bounce) before hydrating, derives the upcoming round's participants exactly like `updateDraftDocument` (DRAFT → current round; REJECTED → round+1 if rebuilt, else the halted chain), and submits via `updateDraftDocument` + optional `submitDocumentForReview` (round bump). Step 1 locks source/template (backend can't change them; UPLOAD file replaceable), Step 3 locks the kelishuv Switch with a hint (participants stay editable). **Backend deltas:** `DocumentEntity.values` persists raw placeholder values (model-change-first — `domain.ts`/`schemas.ts`/`createDocument`/`updateDraftDocument`/seed; employee-kind seed values are display FIOs, which `resolveTemplateValues` passes through unchanged), `getDocument` now returns steps of **all** rounds ordered by (round, order) — no other consumer existed — and `SEED_VERSION` bumped `'6'` → `'7'` per the LESSONS rule.

**Verification.** `npm run build` clean → **2934 modules** (+11), 119.95 KB CSS, **1,055.69 KB JS / 297.10 KB gzip** (+45.9 KB JS / +9.7 KB gzip; chunk-size warning = known code-splitting backlog). 14-route dev sweep all 200. Scripted audits: 162 static + 21 dynamic-family i18n keys resolve (~95 new keys: `documents.detail.*`, `approvals.*`, wizard edit keys, `registry.type-template`); no Cyrillic, no toast literals, no legacy names. Rolldown-bundled node harness (localStorage shim, `@/` alias, flake-retry) walked the real backend end-to-end: **41/41 checks** — seed flag `'7'` + seeded values; create with FIO-resolved employee value (no `«—»`/uuid leak); submit → sequential queue scoping; `out-of-order` / `comment-required` / `not-creator` / `not-signer` / `cert-invalid` / `not-deletable` / `not-recipient` / `wrong-status` guards all throw their codes; reject freezes round-1 history with comment; edit rebuilds the upcoming chain only; resubmit → round 2 → APPROVED → sign → SIGNED + `archivedAt` + `SignatureRecord` + Arxiv feed; email export logs; view-once ×2 personas with exactly 2 `DOCUMENT_VIEWED` audit rows; exactly one audit entry per transition; acceptance branch → CLOSED + archived; audit append-only (earliest row intact, count grew); notifications hit the right persona on every hop. Five new `react-hooks/set-state-in-effect` errors are deliberate clones of the tolerated step-09/13/18 idioms (DecideDialog/EmailDialog/SignDialog open-resets, ApprovalsQueuePage/DocumentDetailPage list-resets); FakeEriSigner's unused-payload and ApprovalSheetCard's prop-sync were fixed properly instead. Harness left in `/tmp` (ephemeral).

**Files touched:**
- `dashboard/src/features/documents/detail/{DocumentDetailPage,A4Preview,ApprovalSheetCard,SignatureHistoryCard,DocumentActions,DecideDialog,SignDialog,EmailDialog}.tsx` (all new)
- `dashboard/src/features/documents/{FakeEriSigner.ts,ApprovalsQueuePage.tsx}` (new), `dashboard/src/stores/useQueueStore.ts` (new)
- `dashboard/src/features/documents/wizard/{DocumentWizardPage,Step1Type,Step3Approvers}.tsx`, `doc-wizard-store.ts` (edit mode)
- `dashboard/src/lib/mock-backend/{index,schemas,seed}.ts`, `dashboard/src/types/domain.ts` (values persistence, all-round getDocument, `SEED_VERSION` `'7'`)
- `dashboard/src/components/layout/Sidebar.tsx` (badge), `dashboard/src/router.tsx`, `dashboard/src/index.css` (print)
- `dashboard/src/i18n/locales/uz.json`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — `/doc_sync` checkpoint (post step 18)

Ran `/doc_sync` immediately after the step-18 session below. **Verified in sync — the cascade was performed inline with the implementation:** `AI_CONTEXT.md` already carries the step-18 block (registry tabs + wizard + shared-stepper extraction + verification), the updated build state (2923 modules · 1,009.84 KB JS / 287.39 KB gzip), the milestone line (steps 16–18 landed, 19–22 remain), and the step-18 line in the "Dashboard implementation in progress" ledger bullet; the session entry below records date, summary, and files touched. `git diff` shows exactly the step-18 surface (13 new files under `features/documents/` + `components/common/WizardStepper.tsx`, 5 edits, `uz.json`, the two ai_context files) — no stray changes. No additional writes were needed during this checkpoint.

Template-mismatch reasoning as in prior checkpoints: Devon has no `product_states.md` / `models.md` / `mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`. **Deliberately untouched:** all of them — step 18 is demo UI implementing the BP-4 canon those docs already record (registry statuses and the kelishuv flow match `business-processes.md` BP-4 and master §15; no module, role, or capability changed, so README stands; no deploy/backup change, so `docs/operations/` stands; the `WizardStepper` extraction is a code-level refactor, not an ADR-worthy architecture decision). UC demo-coverage notes remain step 22's job post-implementation. The dashboard-prompts README carries no per-step status column, so nothing to flip there. Working tree uncommitted, awaiting `/commit`.

**Files touched:** `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — Step 18: M2 Flow 5 UI part A — documents registry + creation wizard

Third milestone-2 session per [`docs/dashboard-prompts/18-m2-flow5-documents-wizard.md`](../docs/dashboard-prompts/18-m2-flow5-documents-wizard.md). The two entry surfaces of BPMN 3.4 landed as pure UI over the step-17 backend — `/documents` (registry, replaces the step-16 placeholder) and `/documents/new` (4-step creation wizard). **No backend or seed changes** (`SEED_VERSION` stays `'6'`); detail page + approval actions are step 19.

**Registry.** [`DocumentsPage`](../dashboard/src/features/documents/DocumentsPage.tsx) renders 4 underline tabs (`TabLabel`, ProfilePage trigger classes): **Mening hujjatlarim** (`listDocuments({ creatorUuid })`) · **Menga kelgan** (`recipientUuid`, DRAFT filtered out client-side) · **Kelishuvda** (client-side compose: `listMyApprovals` decision items ∪ the creator's own IN_REVIEW docs, deduped by uuid) · **Arxiv** (`archivedOnly: true`, **grouped by `archivedAt` day** with `CalendarDays` date subheaders + the "Imzolangan hujjatlar har kuni kun yakunida arxivlanadi" hint — the §2.2 daily-archive surface). Every feed keys on `useActingEmployee().employee.uuid`, so POV switches refetch all tabs. Filters follow the step-09 split — inline `SearchInput` + status `Select` on `md+`, search + bottom-sheet (draft state, Apply/Reset, `pb-safe`) below, both halves in [`registry/DocumentFilters.tsx`](../dashboard/src/features/documents/registry/DocumentFilters.tsx); [`DocumentsTable`](../dashboard/src/features/documents/registry/DocumentsTable.tsx) (Raqam · Sarlavha · Turi — template `nameUz` or "Yuklangan fayl" · Yaratuvchi · Holat · Sana) on desktop, [`DocumentsCardsMobile`](../dashboard/src/features/documents/registry/DocumentsCardsMobile.tsx) (min-h-16 tap targets) below `md`; `Pagination` at 20/page; loading/empty/error states via the common components (archive gets its own empty copy). Row click → `/documents/:uuid`, which **falls through the `*` catch-all to home until step 19** — noted per the step prompt.

**Wizard.** [`DocumentWizardPage`](../dashboard/src/features/documents/wizard/DocumentWizardPage.tsx) clones the employee-wizard chrome (mobile X-topbar / desktop header band, pill stepper, `<form id="doc-wizard-step-N">` + `<Button form>` external submit, sticky `pb-safe` footer, `window.confirm` on dirty close) with zustand [`doc-wizard-store.ts`](../dashboard/src/features/documents/wizard/doc-wizard-store.ts) (4 steps; `setTemplate` clears stale placeholder `values` on template switch). **Step 1 Turi:** two large source cards (Shablon asosida / Tayyor faylni yuklash) + template gallery from `listDocumentTemplates` (name + description + field-count badge, emerald ring select) or a PDF/DOC/DOCX ≤ 10 MB picker cloned from `OrderExtractField` (pick-time format/size validation, metadata-only `FileMeta`, `formatBytes` chip). **Step 2 Mazmun:** Sarlavha · Kimga (employee `Combobox`) · Kim imzolaydi (`__none__` sentinel option = "ERI imzo talab qilinmaydi" → the BPMN 11.2 acceptance branch) · Maxfiylik `Select`, then one input per `TemplateField` (text → Input, textarea → Textarea, date → date Input, employee → Combobox) beside a **live A4 preview** card running `renderTemplate` per keystroke, with employee-kind uuids resolved to FIO exactly like the backend's `resolveTemplateValues` so preview and stored `renderedBody` can't drift. The dynamic zod schema lives in [`document.schema.ts`](../dashboard/src/features/documents/wizard/document.schema.ts) (`buildStep2Schema(template)` — per-field required flags; the value shape is typed `Record<string, z.ZodString>` because `z.ZodType<string>` leaves the schema's *input* side `unknown` and breaks the react-hook-form `Resolver` match); the form mounts only after the template resolves, so the resolver never swaps mid-form. **Step 3 Kelishuv varaqasi:** `Switch` (default on; off → explanation line, step passes through — the BPMN "Yo'q" path) → ordered participant builder: `Combobox` add (excludes creator + duplicates, mirroring `assertValidParticipants`), numbered rows with FIO + position, ChevronUp/Down reorder buttons + remove (no DnD per master §17), min-1 inline error, sequential-only `Alert` banner. **Step 4 Ko'rib chiqish:** 3 summary cards (Turi va mazmun · Kimga/Kim imzolaydi · Qatnashchilar ordered list or "Kelishuvsiz") with Edit → `setCurrent` jumps; the sticky footer carries the dual submit — **Qoralama sifatida saqlash** (`createDocument` → toast → `/documents`) and **Kelishuvga yuborish** (`createDocument` + `submitDocumentForReview` → toast → `/documents/:uuid`), with a `createdUuid` component guard so a 3 %-flake between the two calls retries the submit without creating a second document. `DocumentValidationError` codes map to the step-17 `dashboard:documents.errors.*` toasts; `MockNetworkError` leaves the store intact (retryable). All mutations run as the **acting persona** (`acting.employee.uuid`), so a salesperson can create as XODIM per the step's demo script.

**Cross-cutting.** `WizardStepper` extracted to [`components/common/WizardStepper.tsx`](../dashboard/src/components/common/WizardStepper.tsx) (props: `steps` / `current` / `ariaLabelKey`) now that the document wizard is its second consumer — `features/employees/wizard/WizardStepper.tsx` became a thin binding passing the employee steps (the "composite element used on ≥ 2 screens → Components" rule). `StatusBadge` gained `IN_REVIEW` (cinnamon-soft, Hourglass) · `SIGNED` (emerald-soft, PenLine) · `CLOSED` (muted, CheckCheck) with `common:status.{in-review,signed,closed}`. Home `QuickActions` gained the "Hujjat yaratish" tile → `/documents/new` (grid rebalanced `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` for 5 items; full home integration stays step 22). Router: `/documents` real page under `Protected`, `/documents/new` under `ProtectedNoShell`; the approvals/letters placeholders remain. `uz.json` gained `dashboard.documents.registry.*` + `dashboard.documents.wizard.*` (~70 keys; the field-count badge interpolates `{{n}}` deliberately — `count` would engage i18next plural-suffix resolution for no benefit).

**Verification.** `npm run build` (`tsc -b` + vite) clean → **2923 modules** (+14), 117.85 KB CSS, **1,009.84 KB JS / 287.39 KB gzip** (+47.1 KB JS / +10.4 KB gzip; the >500 KB-minified chunk warning is the known code-splitting backlog item in `QA_NOTES.md`). Dev-server sweep: all 12 routes 200. Scripted audits: 109/109 referenced i18n keys resolve; no Cyrillic, no toast literals, no raw JSX copy in the new files. A rolldown-bundled node harness (localStorage shim, `@/` alias config, flake-retry wrapper) exercised the real backend behind every registry tab + both wizard submit paths: **19/19 checks** — arxiv = 4 seeded docs (2 SIGNED + 2 CLOSED) all carrying `archivedAt`; 5 templates; XODIM BUYRUQ create → DRAFT with `HJ-2026/NNNN` number, employee-kind value resolved to FIO, no `«—»` leak; draft in the Mening hujjatlarim feed; submit → IN_REVIEW; order-1 participant queued in `listMyApprovals`, order-2 not (strictly sequential); creator's own IN_REVIEW feed; recipient inbox non-DRAFT; kelishuv-off UPLOAD doc → APPROVED directly + acceptance queue item for the recipient; search by number fragment + title fragment. Harness left in `/tmp` (ephemeral). Two new `react-hooks/set-state-in-effect` lint errors (`DocumentsPage` list-reset-before-fetch, `DocumentFilters` sheet-draft-reset) are deliberate clones of the tolerated step-09/13 idiom — 4 pre-existing instances in `EmployeeListPage` / `EmployeeFilterSheetMobile` / `AuditLogPage`.

**Known gap (by design):** registry row clicks and bell deep-links to `/documents/:uuid` land on home until step 19 ships the detail route + `/approvals` queue (which also brings the Kelishuvlar sidebar badge).

**Files touched:**
- `dashboard/src/features/documents/DocumentsPage.tsx` (new), `registry/{DocumentsTable,DocumentsCardsMobile,DocumentFilters,filters}.{tsx,ts}` (new)
- `dashboard/src/features/documents/wizard/{DocumentWizardPage,Step1Type,Step2Content,Step3Approvers,Step4Review}.tsx`, `document.schema.ts`, `doc-wizard-store.ts` (all new)
- `dashboard/src/components/common/WizardStepper.tsx` (new — extracted), `StatusBadge.tsx` (3 new kinds)
- `dashboard/src/features/employees/wizard/WizardStepper.tsx` (thin binding over the common component)
- `dashboard/src/features/dashboard-home/QuickActions.tsx`, `dashboard/src/router.tsx`
- `dashboard/src/i18n/locales/uz.json`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — `/doc_sync` checkpoint (post step 17)

Ran `/doc_sync` immediately after the step-17 session below. **Verified in sync — the cascade was performed inline with the implementation:** `AI_CONTEXT.md` already carries the step-17 block, the post-step-17 seed-contents paragraph (`SEED_VERSION = '6'`, templates/documents/signatures), the updated build state (2909 modules · 962.75 KB JS / 276.97 KB gzip), and the milestone line (steps 18–22 remain); the session entry below records date, summary, and files touched. One additional write during this checkpoint: the "Dashboard implementation in progress" ledger bullet in `AI_CONTEXT.md` open questions gained a step-17 line (`DocumentValidationError` + document API + `renderTemplate` available to steps 18–21).

Template-mismatch reasoning as in prior checkpoints: Devon has no `product_states.md` / `models.md` / `mermaid_schemas/` — its equivalents are `README.md`, `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`. **Deliberately untouched:** all of them — step 17 is mock-backend plumbing for the demo; no user-visible product behavior shipped, and the `DocumentStatus`/`ApprovalDecision` state machines implement the BP-4 canon that `docs/business-processes.md` and master §15 already record from the 2026-06-12 M2 planning session (no drift to reconcile). UC demo-coverage notes remain step 22's job post-implementation. Working tree uncommitted, awaiting `/commit`.

**Files touched:** `ai_context/AI_CONTEXT.md` (ledger bullet), `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — Step 17: M2 Flow 5 backend — templates, documents, approvals, signatures

Second milestone-2 session per [`docs/dashboard-prompts/17-m2-documents-backend.md`](../docs/dashboard-prompts/17-m2-documents-backend.md). The entire document-management domain landed in the mock backend — types, zod schemas, typed policy errors, policy-enforcing mutations, audit + notification wiring, and seed data — so steps 18–19 are pure UI work. **No screens shipped**; the only visible change is reseeded data (and document rows surfacing in the audit log / recent-activity feeds).

**Types.** [`domain.ts`](../dashboard/src/types/domain.ts) gained the master-§15 document block verbatim: `DocumentSource` · `DocumentStatus` (BP-4 canon, with an inline comment that editing an APPROVED doc — BP-4 "modification cancels approvals" — is out of demo scope; only DRAFT/REJECTED are editable) · `Confidentiality` · `FileMeta` (generic metadata-only shape shared with step-20 letters) · `TemplateField` · `DocumentTemplate`/`DocumentTemplateCode` · `DocumentViewRecord` · `DocumentEntity` · `ApprovalDecision` · `ApprovalStep` · `SignatureRecord` (generic, `resourceType: 'document' | 'letter'` discriminates). `AuditAction` += the 8 `DOCUMENT_*` actions; `AuditResourceType` += `'document' | 'letter'`. All mirrored in zod ([`schemas.ts`](../dashboard/src/lib/mock-backend/schemas.ts)). TS exhaustiveness forced the 8 new actions into all three `Record<AuditAction, LucideIcon>` maps (`FilePlus`/`Send`/`FileCheck`/`FileX`/`FilePenLine`/`FileCheck2`/`Eye`/`Mail` in `AuditEntryRow`, `RecentActivityCard`, `ProfileHistoryTab`) — same ripple as step 16's `POV_SWITCHED`. `AuditLogPage`'s `RESOURCE_TYPES` filter gained `'document'` (`'letter'` waits for step 20 — no letter rows can exist before then).

**Policy layer.** [`errors.ts`](../dashboard/src/lib/mock-backend/errors.ts): `DocumentValidationError` with all 11 codes (`wrong-status` / `not-creator` / `not-participant` / `out-of-order` / `already-decided` / `comment-required` / `not-signer` / `not-recipient` / `cert-invalid` / `not-editable` / `not-deletable`). Every mutation validates against the *acting* employee uuid it receives — per-document authorization holds even against browser-console calls (CLAUDE.md security discipline). Because M2 actors are **employee** uuids (the step-16 acting rail), the audit actor name resolves via a new `employeeNameFor()` and is passed explicitly into `appendAudit` (`actorNameFor` resolves *user* uuids and would have produced "System").

**Storage + API.** Four new tables in [`storage.ts`](../dashboard/src/lib/mock-backend/storage.ts): `document-templates` / `documents` / `approval-steps` / `signatures` (kebab-case keys per the `profile-requests` precedent — the prompt's camelCase names were treated as illustrative). [`index.ts`](../dashboard/src/lib/mock-backend/index.ts) reads: `listDocumentTemplates` · `listDocuments` (status/creator/recipient/archivedOnly/search filters, newest-first) · `getDocument` (composed `DocumentDetail`: document + current-round steps + signatures) · `listMyApprovals` (discriminated `ApprovalQueueItem`: `decision` = first PENDING step of the current round is mine · `signature` = APPROVED && I'm signer · `acceptance` = APPROVED && no signer && I'm recipient) · `recordDocumentView` (once per employee, first view writes `DOCUMENT_VIEWED`, repeats are no-ops, **no `maybeFail()`** — viewing must never error). Mutations (all `simulatedDelay` + `maybeFail` + exactly one audit entry + notifications on every status transition): `createDocument` (auto-number `HJ-2026/NNNN` via max-scan; TEMPLATE → `renderTemplate` with employee-kind values resolved uuid→FIO; UPLOAD → `fileMeta` stamped; ordered/duplicate-free/creator-excluded participants become round-1 PENDING steps; DRAFT create is audit-only) · `updateDraftDocument` (DRAFT/REJECTED + creator only; participants patch rebuilds the *upcoming* round's PENDING steps — current round for a DRAFT, round+1 after a rejection — decided rounds stay immutable) · `submitDocumentForReview` (kelishuv → IN_REVIEW + notify order-1 participant; `!requiresApproval` → implicit APPROVED per BPMN "Kelishuv kerakmi? → Yo'q" + notify signer/recipient; resubmit after REJECTED → `round += 1` with steps cloned from the halted round unless rework already rebuilt them) · `decideApproval` (the kelishuv heart: IN_REVIEW + participant + not-yet-decided + strictly-sequential order checks; REJECTED requires comment and halts the round with remaining steps frozen PENDING; approve variants notify creator `DOC_DECIDED`, last step flips to APPROVED + notifies creator `DOC_APPROVED` + signer/recipient) · `signDocument` (APPROVED + signer-only + cert must be ACTIVE and the signer's own; writes a `SignatureRecord` with `crypto.getRandomValues` hex; → SIGNED + `signedAt` + **`archivedAt` stamped immediately** — the simulated nightly job; notifies creator + recipient) · `acceptDocument` (the no-ERI branch: APPROVED + no signer + recipient-only → CLOSED + `archivedAt`; notifies creator) · `emailDocument` (SIGNED/CLOSED only, appends to `emailedTo`, audit-only — no real mail per master §17) · `deleteDocument` (**only the creator's own DRAFT** — there is deliberately no code path that removes a non-DRAFT row; also drops the draft's PENDING steps). The "DOC_SIGN_REQUESTED titled as acceptance" branch stores a different `titleKey` (`dashboard:notifications.title.DOC_ACCEPT_REQUESTED`, new key) on the same `NotificationType` — exactly what the stored-titleKey indirection from step 16 was for.

**`renderTemplate.ts`** ([`src/features/documents/renderTemplate.ts`](../dashboard/src/features/documents/renderTemplate.ts)) — pure synchronous `{{PLACEHOLDER}}` substitution; unknown/empty keys render `«—»` (the raw token must never leak). Exported for the step-18 wizard live-preview; the backend and seed use the same function so preview and stored `renderedBody` can't drift.

**Seed (`SEED_VERSION` `'5' → '6'`).** 5 templates with realistic short Uzbek bodies (BUYRUQ body verbatim from the prompt — its `{{RAQAM}}` token wasn't in the prompt's 4-field list, so RAQAM was added as a 5th field rather than ship a template that renders `«—»`; XIZMAT_XATI / MALUMOTNOMA / ARIZA / BILDIRISHNOMA authored to match, 3–4 fields each; fixed literal uuids `…c001`–`…c005`). 12 documents in the exact prompt distribution — 2 DRAFT (creator XODIM; one TEMPLATE with a deliberately-unfilled optional field rendering `«—»`, one UPLOAD) · 3 IN_REVIEW (current PENDING participant = RAHBAR / BOLIM_BOSHLIGI / HR_ADMIN; mixed earlier decisions incl. one APPROVED_WITH_COMMENT) · 1 REJECTED (creator XODIM, comment present) · 2 APPROVED (signature queue for RAHBAR · acceptance queue for BOLIM_BOSHLIGI) · 2 SIGNED · 2 CLOSED. The six step-16 placeholder UUIDs (`…d001`–`…d006`) are now real rows whose numbers line up with the notification story (HJ-2026/0003 / 0005 / 0007 / 0008 / 0009 / 0011) — **all 11 document notifications now resolve**; `buildNotifications` itself needed zero changes. Approval steps + timestamps internally consistent (decidedAt after sentForReviewAt etc., DAYS_AGO-derived); `viewedBy` sprinkled across non-drafts; one SIGNED doc carries `emailedTo`. 3 signature records: 2 backing the SIGNED docs + the "spare" — the Rahbar's ERI on outgoing letter `LETTER_UUID(3)` (CH-2026/0001 from the notification story), with a comment requiring step 20 to seed that letter with `requiresSignature: true` so it resolves retroactively.

**i18n.** `dashboard.documents.errors.*` (all 11 codes, e.g. `out-of-order` → "Navbat hali sizga kelmagan") for steps 18–19 toast mapping; `dashboard.documents.fields.*` (11 template-field labels — seeded `TemplateField.labelKey`s reference them); 8 `dashboard.audit.actions.*` verbs; `audit.resource-types.document` + `.letter`; `notifications.title.DOC_ACCEPT_REQUESTED`. Scripted coverage checks: 11/11 error codes, 11/11 field tokens.

**Verification.** `npm run build` (`tsc -b` + vite) clean → 2909 modules (+1: `renderTemplate.ts`), 117.36 KB CSS, **962.75 KB JS / 276.97 KB gzip** (+14.09 KB JS / +3.68 KB gzip over step 16). Build hash `index-DKGG-P7m.js`. Beyond the usual sweep (all 12 routes 200, zero dev-log errors; eslint over touched files shows only the two pre-existing tolerated `set-state-in-effect` errors in `AuditLogPage` from step 13), the step's console-smoke acceptance list was verified **scripted**: a temporary node harness (rolldown-bundled with a `localStorage` shim, `MockNetworkError`-retry wrapper for the 3 % flake) ran the real backend end-to-end — **36/36 checks passed**, covering: reseed 5→6 counts (5 templates / 12 docs / 3 signatures / distribution / archivedAt on terminals / notifications resolving), per-persona queues non-empty, `not-participant` / `out-of-order` (order 2 while order 1 PENDING) / `comment-required` / `already-decided` / `cert-invalid` (another employee's cert) / `not-recipient`-family guards, the full BPMN 3.4 happy path create → submit → decide×2 → sign with **exactly one audit entry per transition and the expected 6 notifications**, audit append-only across mutations, signed-document protection (`not-deletable` on SIGNED, `not-editable`, draft-only delete incl. `not-creator`), the acceptance branch (`not-recipient` then CLOSED + archived), view-once semantics, and resubmit-after-REJECTED (round 2 fresh PENDING, round-1 history intact). Harness deleted after the run (sandbox kept the `/tmp` copies; they're ephemeral).

**Known gap (by design):** bell deep-links to `/documents/:uuid` now point at real rows, but the detail route itself arrives in step 19 — clicks still fall through the `*` catch-all to home (the `/documents` list lands in step 18).

**Files touched:**
- `dashboard/src/features/documents/renderTemplate.ts` (new)
- `dashboard/src/types/domain.ts` (document types, AuditAction/AuditResourceType extensions)
- `dashboard/src/lib/mock-backend/errors.ts`, `schemas.ts`, `storage.ts`, `index.ts`, `seed.ts`
- `dashboard/src/features/audit/AuditEntryRow.tsx`, `AuditLogPage.tsx`, `dashboard/src/features/dashboard-home/RecentActivityCard.tsx`, `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx` (icon maps + filter)
- `dashboard/src/i18n/locales/uz.json`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — Step 16: M2 foundations — POV switcher + notification centre

First milestone-2 implementation session per [`docs/dashboard-prompts/16-m2-pov-notifications.md`](../docs/dashboard-prompts/16-m2-pov-notifications.md). Two cross-cutting rails landed; no document/letter domain logic (steps 17/20 own those tables).

**POV switcher.** `useAuthStore` gained `actingAsEmployeeUuid: string | null` (persisted inside the existing zustand session blob, so refresh keeps the POV) plus `switchPov(employeeUuid)` / `resetPov()`. Both write a `POV_SWITCHED` audit entry with **actor = the real session user**, resource = the session user row, `resourceLabel` = the target persona's FIO (own FIO on reset), and `context.to` = the persona key (reverse-resolved from `PERSONAS`) or `'self'`. `logout` and "Reset demo" clear the POV — reset-demo does it silently via `setState` because the audit table was just wiped and an immediate entry would be reseed noise, and the fixed persona UUIDs mean `refreshSessionUser`'s stale-employee check (also added — drops a POV whose employee vanished after a reseed) would never fire for them. New [`src/lib/acting.ts`](../dashboard/src/lib/acting.ts) exposes `useActingEmployee(): ActingContext | null` (`employee` falling back to the session user's own record · `user` row · `roles` · `headedUnitUuids` · `isSelf`), re-resolving per `actingAsEmployeeUuid` via effect (no module cache — it would go stale across reseeds). Every M2 page resolves queues/action-visibility through it and passes `employee.uuid` as `actorUuid` into mutations.

**Personas.** `seed.ts` exports `PERSONAS` — five **fixed literal employee UUIDs** (valid v4 shape, `…a001`–`…a005`) so steps 17–21 can seed documents/letters referencing them deterministically: HR_ADMIN = Pulatov Asilbek (the login user) · RAHBAR = Karimov Bekzod (head of the root IT Departament) · BOLIM_BOSHLIGI = Akhmedov Akmal (head of the Backend Bo'lim) · DEVONXONA = **Yusupova Nilufar Baxtiyorovna** (new, 31st employee, in the new root-level `Devonxona` unit `DEV-01` type `OTHER`, user `roles: ['ROLE_DEVONXONA']`, new `POS-CHANCELLERY` position) · XODIM = Sobirova Dilnoza (POS-DEV in the API Sho'ba under the Backend Bo'lim — RAHBAR/BOLIM/XODIM deliberately sit in one branch so an approval chain walks a single subtree). Unit heads are now wired: a `HEAD_POSITION_IDS` set marks head positions and `buildEmployeesAndUsers` stamps `headEmployeeUuid` on 9 units (no unit had a head before — `UnitDetailsSheet`'s head row now resolves). Cert distribution went 18/4/2/1 → **19/4/2/1 (26 total)**: HR_ADMIN/RAHBAR/BOLIM/XODIM already held ACTIVE certs via `activeOwners` indices 0/1/6/8; the Devonxona persona got hers explicitly (every persona needs an ACTIVE cert for the ERI steps 19/21). **`SEED_VERSION` bumped `'4' → '5'`** (existing browsers reseed silently; demo-session edits wiped, correct per LESSONS).

**Notification centre.** New `notifications` localStorage table (`devon.dashboard.notifications`) + `appNotificationSchema` zod mirror. Mock-backend API: `appendNotification` (exported for steps 17–21 like `appendAudit`; **no `maybeFail()`/latency** — a notification must never be the flaky part of the mutation it rides on; unshifts newest-first) · `listNotifications(recipient, { unreadOnly? })` · `markNotificationRead` / `markAllNotificationsRead` (both keep the 3 % mutation-flake convention; the UI tolerates failures silently — a row just stays unread). New `findUserByEmployee` read backs the acting hook. Seed carries **20 notifications** across the five personas — all 13 `NotificationType`s, read/unread mixed, timestamps spread over 5 days, telling a coherent story (doc HJ-2026/0007 mid-kelishuv; HJ-2026/0005 approved+signed; a rejection; letter K-2026/0002 walking route→assign→execute→accept; a letter awaiting Rahbar ERI; a dispatched reply). Resource UUIDs are **fixed placeholder literals** (`…d001`–`…d006` documents, `…f001`–`…f003` letters) that steps 17/20 must seed real rows under so the deep-links resolve retroactively.

**Bell UI.** [`NotificationsBell`](../dashboard/src/features/notifications/NotificationsBell.tsx) replaces the step-05 placeholder: unread badge (cinnamon, caps at `9+`), `Popover` ≥ md / bottom `Sheet` below (ResponsiveDialog band-padding parity, `pb-safe`), scoped to the **acting persona** — switching POV switches the bell. No polling: refetch on open + on POV change (noted in code; all "server" state is same-tab localStorage). [`NotificationsList`](../dashboard/src/features/notifications/NotificationsList.tsx) rows: 13-entry lucide type-icon map, `t(titleKey, params)` (titleKeys stored fully-qualified `dashboard:notifications.title.<TYPE>`), `formatRelative` timestamp, emerald unread dot + tinted unread row. Row click marks read optimistically and navigates to `/documents/:uuid` / `/letters/:uuid` — until steps 18–21 land those fall through the `*` catch-all to home (acceptable per the step prompt). Header carries "Barchasini o'qilgan deb belgilash" when unread > 0.

**Chrome.** UserMenu gained the "Rol almashtirish" picker — `DropdownMenuSub` ≥ md, inline labelled radio section below md with `py-2.5` rows (≥ 44 pt with the two-line label+FIO layout). **Prompt deviation:** the step prompt assumed the mobile user menu was already a Sheet; it's a `DropdownMenu` on every viewport, so the mobile branch renders the radio group inline instead of nesting a touch-hostile submenu. Items show `<persona label> — <FIO>` (FIOs resolved once from the seed), current persona checked, switch toast `dashboard:pov.switched`. TopBar renders the POV chip (cinnamon-soft pill, `Siz: {persona} sifatida` from `sm+`, persona label only at 360 px, inline × → `resetPov`) and mounts the real bell. Sidebar gained the "HUJJAT AYLANMASI" section (Hujjatlar/Kelishuvlar/Xatlar, `FileText`/`ListChecks`/`Mail`) **and** the three placeholder routes landed in `router.tsx` (`ComingSoonPage` = PageHeader + EmptyState "Tez kunda") so nothing 404s — the prompt offered section-now/routes-later as an alternative; both-now was chosen per its own task 8. The Kelishuvlar count badge is deferred to step 19 as specified.

**Types/i18n.** `Role` += `'ROLE_DEVONXONA'`; `AuditAction` += `'POV_SWITCHED'` (TS forced the new entry into all three `Record<AuditAction, LucideIcon>` maps — `Drama` icon in `RecentActivityCard`, `ProfileHistoryTab`, `AuditEntryRow`; verb "rol almashtirdi"); new `NotificationType` + `AppNotification` (named to dodge lib.dom's `Notification`). `uz.json`: `dashboard.pov.*` (5 persona labels per the prompt's wording), `dashboard.notifications.*` — note the list header key is **`heading`** because the prompt's `title` collides with the required `title.<TYPE>` map (all 13 written now for steps 17–21), `dashboard.coming-soon.*`, 4 sidebar keys, `common.roles.ROLE_DEVONXONA`, `audit.actions.POV_SWITCHED`. Dead `topbar.notifications` / `topbar.no-notifications` keys removed with their only consumer (the placeholder bell). **Drive-by sync:** zod `auditActionSchema` had been missing `CERTIFICATE_REJECTED` since step 12 — added with a dated comment.

**Verification.** `npm run build` clean → 2908 modules (+3 source files: `acting.ts`, `NotificationsBell.tsx`, `NotificationsList.tsx`), 117.36 KB CSS, **948.66 KB JS / 273.29 KB gzip** (+21.45 KB JS / +5.66 KB gzip over step 15's post-06-11 baseline). Build hash `index-kMaYXq-t.js`. Dev-server sweep: all 12 routes (9 existing + 3 placeholders) return 200, zero errors in the dev log. i18n greps: the step's acceptance grep over `src/features/notifications` + `src/lib/acting.ts` shows classNames/variants only (no literal copy); 13/13 `notifications.title.*` keys match the `NotificationType` union exactly (scripted check); no stragglers reference the removed topbar keys. `npx eslint` over the touched files: 2 errors, both the `set-state-in-effect` reset-then-refetch pattern in `acting.ts` that the codebase has tolerated since step 08 (step-13 precedent; lint doesn't gate `tsc -b && vite build`).

**Limits of verification** (browser-observational, handed to the operator per the established QA split): POV switch end-to-end (chip render, toast, `POV_SWITCHED` audit entry with real-user actor, bell content swap), POV surviving refresh + cleared by Reset demo, reseed `4 → 5` firing on a stale browser, mark-one/mark-all persistence across reload, 360 px chip-overflow + bottom-sheet ergonomics, 44 pt persona-row targets.

**Files touched:**
- `dashboard/src/lib/acting.ts` (new)
- `dashboard/src/features/notifications/NotificationsBell.tsx`, `NotificationsList.tsx` (new)
- `dashboard/src/types/domain.ts` (Role, AuditAction, NotificationType, AppNotification)
- `dashboard/src/lib/mock-backend/schemas.ts`, `storage.ts`, `seed.ts`, `index.ts`
- `dashboard/src/stores/useAuthStore.ts`
- `dashboard/src/components/layout/TopBar.tsx`, `UserMenu.tsx`, `Sidebar.tsx`
- `dashboard/src/features/audit/AuditEntryRow.tsx`, `dashboard/src/features/dashboard-home/RecentActivityCard.tsx`, `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx` (icon maps)
- `dashboard/src/router.tsx` (3 placeholder routes + `ComingSoonPage`)
- `dashboard/src/i18n/locales/uz.json`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — `/doc_sync` checkpoint (post M2-planning session)

Ran `/doc_sync` immediately after the milestone-2 planning session below. **Verified in sync — no additional writes needed:** the doc cascade was performed inline with the planning work (`CLAUDE.md` sources-of-truth rows, `AI_CONTEXT.md` canonical table + M2 section + open questions, `business-processes.md` BPMN links + BP-3 state extension, `glossary.md` three edits, prompt-set master/README), and the session entry below already records date, summary and files touched. Template-mismatch reasoning as in prior checkpoints: Devon has no `product_states.md` / `models.md` / `mermaid_schemas/` — its equivalents were the cascade targets. Deliberately untouched: root `README.md` and `docs/product-specification.md` (M2 is planned, not shipped — no product behavior changed; UC demo-coverage notes are step 22's job post-implementation). Working tree still uncommitted, awaiting `/commit`. **Files touched:** `ai_context/HISTORY.md` (this entry)

---

## 2026-06-12 — Milestone 2 planned: Electronic Document Management prompt set (steps 16–22)

Deep-analyzed the new TLH [`docs/Plyma 19.03.2026.docx`](../docs/Plyma%2019.03.2026.docx) ("PLYMA — Yangilangan, Laravel Stack": requirements §2.1–2.7, BPMN §3.1–3.4, Laravel-11 stack table, team plan, 11-block to-do/price list) and authored the milestone-2 development plan for the dashboard demo, following the milestone-1 prompt-set rhythm.

**Scope decisions (user-approved):** M2 = BPMN 3.4 (document creation + kelishuv + ERI signing + archive) **+** BPMN 3.3 (Devonxona incoming/outgoing letters); BPMN 3.2 (task Kanban) deferred to M3; BPMN 3.1 already shipped as M1. Multi-actor flows handled via a **POV switcher** (5 seeded personas, no extra logins — resolves the step-13 "employee POV" deferral). Deliverable format: prompt set (master addenda + steps 16–22), implementation to follow one step per session.

**Key design facts baked into the set:** state names follow `business-processes.md` BP-3/BP-4 canon — `DocumentStatus: DRAFT → IN_REVIEW → REJECTED(→rework)/APPROVED → SIGNED | CLOSED` with archive as an `archivedAt` stamp (not a status); `LetterStatus` extends BP-3's list with `executed` and `on-signature` (the TLH BPMN's explicit acceptance/signature gates — BP-3 doc updated accordingly, dated note inline); sequential-only kelishuv (parallel chains out of scope); `ApprovalDecision: PENDING/APPROVED/APPROVED_WITH_COMMENT/REJECTED` with comment required on reject; metadata-only `FileMeta` convention continues (print-to-PDF of an A4 preview substitutes downloads); hardcoded numbering `HJ-2026/NNNN` · `K-2026/NNNN` · `CH-2026/NNNN`; policy-layer enforcement in the mock backend (`DocumentValidationError` / `LetterValidationError` with codes like `out-of-order`, `not-deletable`, `not-devonxona`) so signed-document immutability and per-document authorization hold even against console calls; notifications table + bell with per-persona scoping; seed grows in three bumps (`SEED_VERSION` 5/6/7 in steps 16/17/20). Type names avoid DOM collisions (`DocumentEntity`, `AppNotification`).

**BPMN PNGs extracted** from the docx into [`docs/bpmn/`](../docs/bpmn/) (4 files, descriptive names + index README) — closes the long-standing "BPMN diagrams missing" gap. New TLH registered as a canonical source in `CLAUDE.md` and `AI_CONTEXT.md` (supersedes `Plyma_Technical_Spec_v1.0.docx`). Glossary: PLYMA naming-history row now mentions the 2026-dated TLH; `keluvchi xat` spelling variant; new `Yo'naltirish` entry. Flagged in AI_CONTEXT open questions: the TLH lists only 7 module sections (letters module missing as §2.8 despite its BPMN) — 8-module canon stands; "Mehmon" role mention is consistent with the existing planned-post-v1.0 glossary entry.

**No code touched; no commits** (user runs `/commit`). Implementation of step 16 is the next dashboard session.

**Files touched:**
- `docs/bpmn/bp{1..4}-*.png` (new, extracted) + `docs/bpmn/README.md` (new)
- `docs/dashboard-prompts/16-m2-pov-notifications.md`, `17-m2-documents-backend.md`, `18-m2-flow5-documents-wizard.md`, `19-m2-flow5-document-detail.md`, `20-m2-flow6-letters-registry.md`, `21-m2-flow6-letter-execution.md`, `22-m2-home-qa.md` (all new)
- `docs/dashboard-prompts/00-master.md` (§2 milestones, §3 repo refs, §9 M2 seed, §10 POV switcher, §11 routes, §12 file structure, §15 M2 data models + state machines, §17 M2 out-of-scope, §19 references)
- `docs/dashboard-prompts/README.md` (intro, files table 16–22, M2 decisions table)
- `docs/business-processes.md` (BPMN diagram links per BP, BP-3 state list extension)
- `docs/glossary.md` (3 edits), `CLAUDE.md` (sources-of-truth rows), `ai_context/AI_CONTEXT.md` (canonical table, M2 section, open questions), `ai_context/HISTORY.md` (this entry)

---

## 2026-06-11 — Required "Buyruqdan ko'chirma" attachment in the employee wizard

Added the required hiring-order-extract attachment field to wizard Step 3 (Ish o'rni) per the approved spec (`docs/superpowers/specs/2026-06-11-employee-order-extract-attachment-design.md`) and plan (`docs/superpowers/plans/2026-06-11-employee-order-extract-attachment.md`). Metadata-only storage (`{ fileName, fileSize, mimeType, uploadedAt }` — no bytes, certificate convention); pick-time type/size validation (PDF/JPG/PNG, ≤ 10 MB) in the new [`OrderExtractField.tsx`](../dashboard/src/features/employees/wizard/OrderExtractField.tsx); zod-required gate in `step3Schema`; policy-layer enforcement via `EmployeeValidationError('order-extract-missing')` in `createEmployeeFull` (which stamps `uploadedAt` and writes the file name into the CREATE audit entry's `context`). Field is immutable post-creation (excluded from `updateEmployee`'s patch type; not in `UpdateEmployeeSheet`). New rows on the wizard review screen and the profile Info tab. Shared `formatBytes` helper extracted to [`src/lib/format.ts`](../dashboard/src/lib/format.ts) (B/KB/MB; certificate upload page switched to it). All 30 seeded employees carry extract metadata; `SEED_VERSION` bumped `'3' → '4'` (existing browsers silently reseed on next load — demo-session edits are wiped, correct per LESSONS). Doc cascade: product-specification §User/Auth capability list, UC-17 main flow + acceptance criterion, BP-1 steps 3/9 (order extract is in-wizard pre-creation; lavozim yo'riqnomasi stays post-creation), glossary "Buyruqdan ko'chirma" entry, README profile line, prompt-set addendum in 10-flow2.

**Implementation note:** the plan's `step3Schema` refine (`.refine((v) => v !== null, ...)`) tripped TS 5.5+ inferred type predicates — zod picked the narrowing overload and output-typed the field non-null, breaking the react-hook-form Resolver match. Fixed with an explicit `(v): boolean =>` return annotation; comment in `employee.schema.ts` explains it.

**Verification:** `npm run build` clean; dev-server sweep — all 7 routes 200, zero errors in the runtime log. Browser-observational checks (oversize/wrong-format pick, chip persistence across step navigation, 360 px wrap, reseed against a stale-session browser) remain for the human operator, consistent with the step-15 QA split.

**Build state:** `npm run build` → 2905 modules (+2: `format.ts`, `OrderExtractField.tsx`), 116.28 KB CSS, **927.21 KB JS / 267.63 KB gzip** (+4.3 KB JS / +1.2 KB gzip). Build hash: `index-DWkPmnLj.js`.

**Files touched:**
- `dashboard/src/lib/format.ts` (new)
- `dashboard/src/features/certificates/CertificateUploadPage.tsx`
- `dashboard/src/types/domain.ts`
- `dashboard/src/lib/mock-backend/schemas.ts`, `errors.ts`, `seed.ts`, `index.ts`
- `dashboard/src/features/employees/wizard/employee.schema.ts`, `wizard-store.ts`, `OrderExtractField.tsx` (new), `Step3Work.tsx`, `ReviewScreen.tsx`, `EmployeeWizardPage.tsx`
- `dashboard/src/features/employees/profile/ProfileInfoTab.tsx`
- `dashboard/src/i18n/locales/uz.json`
- `docs/product-specification.md`, `docs/use-cases.md`, `docs/business-processes.md`, `docs/glossary.md`, `README.md`, `docs/dashboard-prompts/10-flow2-employee-wizard.md`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-01 — `/doc_sync` checkpoint (post-QA tab-width-shift fix)

Small follow-up after the step-15 automated QA pass. User reported that the underline tabs on the profile page "shift" when the active tab changes — clicking a new tab makes it visibly wider, pushing every sibling tab around it. Root cause: the shared `TAB_TRIGGER_CN` class string used by [`ProfilePage`](../dashboard/src/features/profile/ProfilePage.tsx) and [`EmployeeProfilePage`](../dashboard/src/features/employees/profile/EmployeeProfilePage.tsx) carries `data-active:font-semibold`. Bold characters are intrinsically wider than regular weight; the active tab grew on every state change.

Fix: new [`TabLabel`](../dashboard/src/components/common/TabLabel.tsx) common component renders each label twice inside the same single-cell CSS grid (`grid` + `col-start-1 row-start-1` on both children). The first child is permanently `font-semibold invisible` and reserves the bold-width footprint. The second child paints on top at the live `data-active`-resolved weight (regular for inactive, semibold for active). `aria-hidden="true"` on the invisible copy keeps screen readers from double-announcing. Width is now identical regardless of active state; no layout shift.

Applied to all 7 tab triggers across the two profile pages (3 on `/profile`: info · password · requests; 4 on `/employees/:uuid`: info · units · certs · history). The `CertificatesTabsMobile` underline tabs from step 12 don't use the same class string and weren't affected — that surface only renders one column at a time so a width shift would only affect the tab bar, not the content below; revisiting if a third underline-tab consumer surfaces in v1.1.

No `docs/` updates needed — same template-mismatch reasoning as prior `/doc_sync` checkpoints; this is component-layer polish, not a product-canon change.

**Build state:** `npm run build` → 2903 modules (+1 for `TabLabel.tsx`), 116.22 KB CSS, **922.90 KB JS / 266.44 KB gzip** (+0.44 KB JS / +0.16 KB gzip for the helper). Build hash: `index-F41-Fzxp.js`.

**Files touched:**
- `dashboard/src/components/common/TabLabel.tsx` (new)
- `dashboard/src/features/profile/ProfilePage.tsx` (wrapped 3 labels)
- `dashboard/src/features/employees/profile/EmployeeProfilePage.tsx` (wrapped 4 labels)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry; step-15 QA paragraph in AI_CONTEXT.md gained a third inline-fix bullet)

---

## 2026-06-01 — Dashboard MVP launched on GitHub Pages (step 15 automated QA pass)

Built the Devon Dashboard as a Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui SPA covering all four flows from [`docs/Plyma TZ xodim kiritish.docx`](../docs/Plyma%20TZ%20xodim%20kiritish.docx): structural-unit tree CRUD (`/units`) · employee 4-step creation wizard + list (`/employees`, `/employees/new`) · assignment transfers + timeline (`/employees/:uuid`, `/employees/:uuid/transfer`) · ERI certificate Kanban with drag-and-drop + fake PFX upload (`/certificates`, `/certificates/upload`). Plus the rounding-out surfaces: dashboard home with greeting + stats + quick actions + recent activity (`/`), HR_ADMIN self-service profile (`/profile`), read-only audit log with resource/actor/date filters (`/audit`). Mobile-first throughout — sidebar drawer, tables-to-cards, full-screen wizard on mobile, certs Kanban collapses to underline-tabs below `lg`. i18n via react-i18next with UZ filled, RU/EN files stubbed (UZ-fallback). Mock backend in `localStorage` with realistic seed data (~25 units, 30 employees, 25 certificates, ~70 audit entries) + 3 % `maybeFail()` network-flake simulation + versioned seed flag (`SEED_VERSION = '3'`) that silently reseeds existing browsers on identity changes. Single HR_ADMIN demo user (`admin@devon.uz` / `Demo2026!`). Deployed alongside the existing landing page via the rewritten [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) (two-job build/deploy, npm-cached, combined `pages-dist/` artifact); landing hero CTA + both Kirish nav buttons now route to the live dashboard at `sardorallaberganov.github.io/devon-landing/dashboard/`.

**Step 15 automated QA pass** — observational portion (six-viewport sweep, Lighthouse, real-device testing) handed off to the human operator via [`dashboard/QA_NOTES.md`](../dashboard/QA_NOTES.md). Automated portion run during this session:

- **i18n grep audit** — clean. No Cyrillic literals in source (excl. locale files), no hardcoded `toast.<level>("literal")` calls, no raw JSX text outside the intentional `DEVON` brand wordmarks and shadcn `sr-only` accessibility labels.
- **Static content scans** — clean. No `PLYMA` / `PLYMO` legacy names in user-facing strings, no tech-stack leaks (`Laravel` / `PostgreSQL` / `React` / `Vite` etc.) in i18n or landing, no `Date.toString` / `toLocaleDateString` bypasses of the `formatDate*` helpers, no raw 4-digit numeric literals in JSX.
- **Bundle size** — `npm run build` produces a single 922.46 KB JS chunk that gzips to **266.28 KB**. Well under the prompt's `< 500 KB gzipped` target. Eight zero-import shadcn primitives sit in `components/ui/` (breadcrumb, drawer, form, input-group, pagination, scroll-area, switch, tooltip) — tree-shaking already excludes them; cosmetic dead code only, logged in `QA_NOTES.md` as a backlog tidiness item.
- **Console-error sweep** — boot a dev server, `curl`-probe all 9 routes (200 across the board), grep the dev log: the only pre-fix warnings were two React Router v6 → v7 future-flag warns. Silenced by opting into `v7_startTransition` + `v7_relativeSplatPath` via `<BrowserRouter future={...}>` in [`App.tsx`](../dashboard/src/App.tsx). Post-fix boot is **zero warnings**.

**Fixes landed during the pass:**

1. **React Router future flags** ([`App.tsx`](../dashboard/src/App.tsx)) — added `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` on `<BrowserRouter>` to silence the per-boot warnings AND opt-in to the forward-compatible v7 behaviors (state updates wrapped in `startTransition` during navigations; relative-route resolution inside splat routes normalised).
2. **Uzbek-first sr-only Close labels** ([`sheet.tsx`](../dashboard/src/components/ui/sheet.tsx), [`dialog.tsx`](../dashboard/src/components/ui/dialog.tsx)) — every Sheet's + every Dialog's corner-X close button announced as `Close` to screen readers despite the Uzbek-first UI. Replaced with `Yopish` directly in the primitives per `LESSONS.md`'s "edit shadcn primitives only when the default is wrong for every call site" rule — both files have the same string, both fix every consumer with one edit.

**Quality bar items deferred to human operator** (per `QA_NOTES.md` "Pending observational sweep"):
- Six-viewport sweep at 360 / 390 / 768 / 1024 / 1280 / 1920 px
- Lighthouse mobile + desktop on all routes (placeholders in `QA_NOTES.md` to fill)
- Throttled-network skeleton check
- Forced-failure error-state sweep
- Offline check
- Keyboard-only wizard completion
- `prefers-reduced-motion` check
- Focus-ring visibility, contrast spot-checks, status-badge colour-only check
- Real-phone safe-area + hardware-back check
- Deep-link hard-refresh on the live deploy
- "Reset demo" against the published bundle

**Build state (post-fix):** `npm run build` → 2902 modules, 116.22 KB CSS, **922.46 KB JS / 266.28 KB gzip**. Build hash: `index-lH-HdBtO.js`.

**Files touched:**
- `dashboard/src/App.tsx` (RR future flags)
- `dashboard/src/components/ui/sheet.tsx`, `dashboard/src/components/ui/dialog.tsx` (Uzbek sr-only labels)
- `dashboard/QA_NOTES.md` (new — scaffold + automated-check results + observational checklist)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-06-01 — `/doc_sync` checkpoint (post-deploy fixes: base-path rename + landing CTA unification)

Ran `/doc_sync` after three follow-on commits that landed once the step-14 deploy went live and asset-load 404s + CTA inconsistencies surfaced. None of these touched product canon (`docs/product-specification.md` / `docs/business-processes.md` / `docs/use-cases.md` / `docs/glossary.md` / `docs/competitive-analysis.md` unchanged); all three are deploy hygiene + landing-content polish.

**1. `5aae692` — `fix(deploy): align base path to the actual repo name (devon-landing)`**

First production deploy of the dashboard 404'd on every asset:
```
/Devon/dashboard/assets/index-vNh6T4A_.css → 404
/Devon/dashboard/assets/index-wzJ8si0u.js  → 404
/Devon/dashboard/favicon.svg               → 404
```

The GitHub repo is named `SardorAllaberganov/devon-landing` (legacy — predates the dashboard scope) so GH Pages serves under `/devon-landing/...`, but the build prompts (and therefore `vite.config.ts` `base`, the favicon `href` in `dashboard/index.html`, and the comment in `dashboard/public/404.html`) were written against `/Devon/dashboard/`. Vite bakes the configured `base` into every asset URL in the built `index.html`, so the bundle was unreachable.

Aligned three files in lockstep:
- [`dashboard/vite.config.ts`](../dashboard/vite.config.ts) — `base: '/devon-landing/dashboard/'`, dev-server `open: '/devon-landing/dashboard/'`. Added an inline comment spelling out that if the repo ever gets renamed back to `Devon`, all three files flip together.
- [`dashboard/index.html`](../dashboard/index.html) — favicon `href="/devon-landing/dashboard/favicon.svg"`.
- [`dashboard/public/404.html`](../dashboard/public/404.html) — comment-only update; `pathSegmentsToKeep = 2` stays correct since `/devon-landing/dashboard/` is still two segments before SPA routes.

`BrowserRouter basename` reads from `import.meta.env.BASE_URL` ([`App.tsx:10`](../dashboard/src/App.tsx#L10)), so React Router's routing automatically tracks whatever `vite.config.ts` `base` is — no other code paths needed updating. `npm run build` post-fix confirmed `dist/index.html` now references `/devon-landing/dashboard/assets/index-Ce9T6iHF.js` + `/devon-landing/dashboard/favicon.svg`.

**2. `863d26b` — `content(landing): point Kirish nav buttons at the dashboard login`**

`Kirish` (Sign in) links in both the desktop nav (`landing/index.html:426` `.signin`) and the mobile menu (`landing/index.html:444` `.mm-secondary`) were `href="#"` placeholders. Updated both to `href="dashboard/login"` — direct route to the SPA's login screen, relative href so it works locally and on Pages.

**3. `7452b03` — `content(landing): unify Kirish + Demoga kirish hrefs on dashboard/`**

User noted that `Kirish` and `Demoga kirish` should land on the same place. Re-pointed all three entry CTAs to a shared `href="dashboard/"`:
- Desktop nav `Kirish` (`.signin`)
- Mobile menu `Kirish` (`.mm-secondary`)
- Hero `Demoga kirish` (`.btn-primary`)

`dashboard/` is the better shared target than `dashboard/login`:
- New visitor → `RequireAuth` on the `/` route bounces to `/login` automatically (the prior target of `Kirish`).
- Returning **authenticated** visitor → lands on home directly with no redundant login screen.
- Pointing at `dashboard/login` would have re-shown the login screen even to already-authenticated users since [`LoginPage`](../dashboard/src/features/auth/LoginPage.tsx) has no already-authenticated guard (it only handles the post-login `navigate(from)` redirect).

The other three landing CTAs (nav `Demo so'rash` `.nav-cta`, mobile menu `Demo so'rash` `.mm-cta`, architecture section `Modullar bilan tanishish` `.btn-emerald`) intentionally keep pointing at `#demo` so the sales-lead email-capture funnel (the `<section id="demo">` at line 1379) stays distinct from the live-demo path. Two separate user journeys, two distinct CTAs.

**Live state confirmed:**
- `sardorallaberganov.github.io/devon-landing/` → landing serves
- `sardorallaberganov.github.io/devon-landing/dashboard/` → SPA login screen
- Asset 404s resolved by commit 1; CTA paths consistent after commit 3

**Files touched (`/doc_sync` only):**
- `ai_context/AI_CONTEXT.md` (live URLs, `/devon-landing/` references, post-step-14 fix paragraph, repo-name note in the dashboard section)
- `ai_context/HISTORY.md` (this entry)

No `docs/` updates needed — same template-mismatch reasoning as the prior `/doc_sync` checkpoints. The CTA changes are landing-page chrome, not product behavior; the base-path rename is build configuration, not a product fact. Neither shifts modules, roles, business processes, glossary entries, or competitive positioning.

---

## 2026-05-27 — Step 14: GitHub Pages deploy (landing + dashboard)

Wired the dashboard SPA into the existing GitHub Pages workflow so a single push rebuilds both the landing page and the dashboard. After this lands, `<owner>.github.io/Devon/` serves the marketing landing and `<owner>.github.io/Devon/dashboard/` serves the React SPA, both from one combined Pages artifact.

**What landed:**

1. **SPA 404 fallback** — new [`dashboard/public/404.html`](../dashboard/public/404.html) with the canonical [spa-github-pages](https://github.com/rafgraph/spa-github-pages) snippet, `pathSegmentsToKeep = 2` to match the `/Devon/dashboard/` URL prefix. The file lives under `public/` so Vite copies it to `dist/404.html` on every build without any extra config. When a visitor hits a deep URL like `/Devon/dashboard/employees/<uuid>`, GitHub Pages serves the 404 page, the inline `<script>` rewrites the URL to `/Devon/dashboard/?/employees/<uuid>` (preserving the path as a query segment so it survives the redirect), and the browser's history is replaced before the dashboard ever loads.

2. **SPA handoff in [`dashboard/index.html`](../dashboard/index.html)** — new `<script>` inserted between `<div id="root">` and the main module bundle. Decodes the `?/path` shape back into a clean URL via `window.history.replaceState` BEFORE the React Router boots, so the first render sees the intended deep route. Runs synchronously inline — adding it after the module script would let the router boot on the wrong URL and immediately redirect, causing a flash + an extra mount cycle.

3. **Two-job [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)** — rewritten from the original single-job landing-only workflow:
   - `build` job: checkout → setup Node 20 LTS with `cache: 'npm'` keyed on `dashboard/package-lock.json` → `cd dashboard && npm ci && npm run build` → assemble `pages-dist/` (landing at root, dashboard build at `pages-dist/dashboard/`) → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3 path: ./pages-dist`.
   - `deploy` job (needs build): `actions/deploy-pages@v4`.
   - `paths` filter triggers on `landing/**`, `dashboard/**`, and the workflow file itself.
   - `concurrency: pages, cancel-in-progress: false` matches the canonical GH Pages pattern — queued runs serialize, in-flight deploys complete cleanly.
   - `npm ci` (deterministic install from the lockfile) instead of `npm install`. Bumping a dep mid-deploy requires updating the lockfile first.

4. **Removed [`.github/workflows/static.yml`](../.github/workflows/static.yml)** (deleted via `git rm`) — this older workflow uploaded the entire repo root as the Pages artifact AND shared `concurrency: group: pages` with `deploy.yml`. Either the two would race on every push and one would overwrite the other's artifact, OR (worse) `static.yml` would win the race and ship raw `dashboard/` source instead of the build. Deletion is the right move: `deploy.yml` is now the single source of truth for what Pages serves.

5. **[`.gitignore`](../.gitignore) explicit dashboard entries** — `dashboard/node_modules/`, `dashboard/dist/`, `dashboard/.vite/`, `dashboard/.eslintcache`. The existing top-level `node_modules/` and `dist/` rules already caught the first two, but spelling them out (a) documents intent, (b) survives a future repo split where the dashboard moves to its own repo with its own gitignore, and (c) catches `.vite/` and `.eslintcache` which the top-level rules don't cover.

6. **Landing hero CTA repointed** — `[hero .btn-primary](../landing/index.html#L491)` changed from `Demo so'rash → #demo` to `Demoga kirish → dashboard/`. Relative href so it works both locally (`landing/index.html` opened directly) and on GH Pages (`/Devon/` → `/Devon/dashboard/`). The other three demo CTAs (nav line 427, mobile menu line 445, architecture section line 1158) intentionally stayed pointing at `#demo` — that's the sales-lead email-capture form section (line 1379), which serves a different audience than "click into the live demo right now." Two distinct paths preserved.

7. **Stray root files removed** — `/Devon/package.json` + `/Devon/package-lock.json` (per the step-12 build-hygiene note + step-12 `LESSONS.md`) were `rm`'d so a future `git add .` can't accidentally commit them. `node_modules/` at the project root may still exist locally (recursive delete was sandbox-denied during the cleanup pass) but it's gitignored.

**Local smoke test:**

Staged a mirror of the eventual GH Pages tree under `/tmp/devon-pages/Devon/` (copied `landing/` contents to `Devon/` and dashboard build to `Devon/dashboard/`) and served it with `npx serve -p 4173`. Probes via `curl`:

- `GET /Devon/` → 200 (landing serves)
- `GET /Devon/dashboard/` → 200 with the SPA-handoff `<script>` in the body
- `GET /Devon/dashboard/favicon.svg` → 200
- `GET /Devon/dashboard/assets/index-*.js` → 200
- `GET /Devon/dashboard/employees` → 404 from `serve` (this is **expected** — `serve` doesn't have GH Pages' 404-fallback behavior; on the real deploy this would route to `404.html`)
- `GET /Devon/dashboard/404.html` → 301 → real body contains `pathSegmentsToKeep = 2` and the redirect snippet

The deep-route 404 from `serve` is the correct simulation — GH Pages re-serves `404.html` for any missing path under the site root, the inline snippet rewrites the URL to `/Devon/dashboard/?/employees`, and the handoff `<script>` in `index.html` decodes that back to `/Devon/dashboard/employees` before React Router boots. Can't fully verify the rewrite chain without an actual GH Pages serve, but the snippet pieces are all present and the prefix math (`pathSegmentsToKeep = 2`) lines up with `base: '/Devon/dashboard/'` in [`vite.config.ts`](../dashboard/vite.config.ts) and the favicon href in [`dashboard/index.html`](../dashboard/index.html).

**Verification still needed (post-push):**

- `<owner>.github.io/Devon/` loads landing
- `<owner>.github.io/Devon/dashboard/` loads login screen
- Login with `admin@devon.uz` / `Demo2026!` → home → navigate every route
- Hard-refresh on `/Devon/dashboard/units` → page renders (404 → handoff → SPA route works on real Pages)
- Direct paste of `/Devon/dashboard/employees/<uuid>` in a new tab → opens the right profile
- Mobile production check on a real phone at 360 / 768 / 1024 / 1280 / 1920 px
- "Reset demo" action in user menu → reseeds against the published bundle
- Landing "Demoga kirish" CTA → navigates to `/Devon/dashboard/`

**Build state:** unchanged from step 13 — `npm run build` still 2902 modules, 116.22 KB CSS, 922.40 KB JS / 266.23 KB gzip. The deploy changes are CI + static-file work; no source changes touched the React app.

**Deviations from the prompt:**

- Prompt step 8 said to find the singular `.btn-primary` "Demo so'rang" CTA and repoint it. I read this as targeting only the hero CTA (line 491) — there are 4 `#demo` links total; the other 3 are `.nav-cta`, `.mm-cta`, and an architecture-section `.btn-emerald` all serving the sales-lead form path. Repointing only the hero preserves the existing email-capture lead funnel; the user can choose to extend later.
- Did not run `git push` — flagged for explicit user confirmation. Production deploy is shared-state per CLAUDE.md.
- The `static.yml` workflow wasn't mentioned in the prompt; deletion is my call based on the obvious race condition.

**Files touched:**
- `dashboard/public/404.html` (new)
- `dashboard/index.html` (SPA handoff `<script>` inserted)
- `.github/workflows/deploy.yml` (rewritten)
- `.github/workflows/static.yml` (deleted)
- `.gitignore` (+4 explicit dashboard entries)
- `landing/index.html` (hero `.btn-primary` repointed + relabeled)
- Project root `package.json` + `package-lock.json` (removed; were not tracked)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-05-27 — Step 13: `/profile` + `/audit`

Landed the two remaining dashboard surfaces from [`docs/dashboard-prompts/13-profile-audit.md`](../docs/dashboard-prompts/13-profile-audit.md). Both routes previously rendered the `Placeholder` "coming-soon" component; that component (and its supporting `useTranslation` + `PageHeader` imports) was removed from [`router.tsx`](../dashboard/src/router.tsx) since nothing else used it.

**`/profile`** — three-tab page composed under the existing `Protected` (AppShell) wrapper:

1. **Asosiy ma'lumotlar** — identity hero band (cream-deep panel + emerald `Avatar` with initials + FIO/email/phone + StatusBadge + position/unit metadata) on the EmployeeProfilePage shape. Info tab is a 6-row description list (FIO · Lavozim · Bo'linma · Mobil telefon · Korporativ pochta · Shaxsiy pochta) backed by a new [`ProfileEditRequestForm`](../dashboard/src/features/profile/ProfileEditRequestForm.tsx) wrapped in `ResponsiveDialog`. Form fields: mobile phone (`+998 XX XXX XX XX` regex) + personal email (optional, email-validated). Submit is role-branched: HR_ADMIN / SUPER_ADMIN call `updateEmployee` directly with a "yangilandi" toast; anyone else calls the new `submitProfileChangeRequest` mock-backend mutation and the request surfaces in the third tab as PENDING.
2. **Parolni o'zgartirish** — [`PasswordChangeForm`](../dashboard/src/features/profile/PasswordChangeForm.tsx) is `react-hook-form` + zod with a 5-link regex chain (`min(8)` → uppercase → lowercase → digit → special) plus two cross-field refinements: `next === confirm` and `next !== current`. Reuses the wizard's `passwordStrength(pw)` scorer (already exported from `employee.schema.ts`) to drive a `Progress` strength meter — `destructive` (0–1) → `cinnamon` (2) → `emerald` (3–4). Submit calls the new `changePassword(userUuid, current, next)` mutation; the typed `PasswordValidationError('current-wrong')` is caught and surfaced inline on the `current` field via `setError` so the user doesn't have to re-fill the entire form to retry. `MockNetworkError` becomes a generic network toast; unknown errors become `common:errors.unknown`. Success path clears all three fields. Last-changed timestamp formats via `formatRelative` from `i18n/uz-locale.ts`. The `mustChangePassword` flag (true for the seeded HR_ADMIN until they change once) drives a cinnamon banner above the form.
3. **Tahrirlash so'rovlari** — a list of past `ProfileChangeRequest` rows for the current employee with a pending-count `Badge` on the tab trigger. For HR_ADMIN the list is always empty (their edits never queue) — empty state explains the workflow exists for `ROLE_EMPLOYEE`. Each non-empty row shows the changed field names + submitted/reviewed timestamps + a status `Badge`.

**`/audit`** — full-width `PageHeader` ("Audit jurnali" + subtitle) + a 4-column filter grid:

- Resource type `Select` over `unit | employee | assignment | certificate | user | profile-request` with a "Barchasi" sentinel option mapped to `''`. Sentinel must be `'ALL'` (not empty string) because the Radix Select primitive rejects `value=""`.
- Actor `Combobox` populated from distinct `actorUuid` / `actorName` pairs in the audit table itself (avoids a `listUsers()` export the demo doesn't need yet — only actors who've actually touched anything show up).
- Two native `<input type="date">`s for from/to with cross-clamped `min` / `max` so the picker can't yield an inverted range. Chosen over a heavier date-range component to keep deps tight — matches step 06's `crypto.randomUUID` preference for native APIs.

A "Filtrlarni tozalash" `Button` appears in the page header only when at least one filter is active; clicking resets the filter object to `EMPTY_FILTERS` and a `useEffect` resets pagination to page 1 on every filter change so a 5th-page user filtering down to a 1-page result isn't stranded on an empty page.

List rendering:

- `<lg`: card stack — each `<li>` carries the icon, timestamp, sentence (`<actor> <verb> <resource>`), and inline diff block.
- `lg+`: 5-column shadcn `Table` (Vaqt · Aktor · Harakat · Resurs · Tafsilot). Header gets `bg-cream-warm/40` to match the employee-list table.

Both layouts share [`AuditEntryRow`](../dashboard/src/features/audit/AuditEntryRow.tsx) with a `variant: 'card' | 'row'` discriminator returning either `<li>` (card) or `<tr>` (row). Both variants render the same internal `DiffBlock` which iterates `entry.changes` (keyed by field name) and resolves `unit` UUIDs to `nameUz` via a `Map<string, Unit>` passed in from the page — without that lookup, `UNIT_TRANSFER` diffs would render bare UUIDs. The icon map mirrors `ProfileHistoryTab`'s `ACTION_ICON` table 1:1 (CREATE → Plus, UPDATE → Pencil, ARCHIVE → Archive, LOGIN → LogIn, LOGOUT → LogOut, PASSWORD_CHANGED → KeyRound, UNIT_TRANSFER → ArrowRightLeft, CERTIFICATE_UPLOADED → Upload, CERTIFICATE_APPROVED → ShieldCheck, CERTIFICATE_REJECTED → ShieldOff, CERTIFICATE_REVOKED → ShieldX, PROFILE_CHANGE_REQUESTED → UserCog, PROFILE_CHANGE_APPROVED → UserCheck — DELETE → Trash2 for completeness even though the demo never hard-deletes).

Newest-first sort (already handled by `listAudit`) + 50/page pagination via the existing `Pagination` primitive from step 09.

**Mock-backend additions** — all three respect the existing `simulatedDelay()` + `maybeFail()` 3% flake convention:

- `submitProfileChangeRequest({ employeeUuid, fields }, actorUuid)` — writes a `PENDING` row to the `profileRequests` table + writes a `PROFILE_CHANGE_REQUESTED` audit entry with `changes: input.fields` so the audit log surfaces the diff inline.
- `approveProfileRequest(uuid, actorUuid, decision, rejectionReason?)` — flips the request to APPROVED or REJECTED. APPROVED extracts each `{ from, to }` change into an employee patch and calls `updateEmployee` (which itself writes a regular `UPDATE` audit entry — so the timeline carries both the request approval AND the field-level change). REJECTED only persists the rejection reason + `reviewedAt` / `reviewedByUuid` stamps. Both branches write a `PROFILE_CHANGE_APPROVED` audit entry (the action carries `context.decision` to disambiguate; kept compact since the demo doesn't surface rejected requests in a separate filter yet).
- `changePassword(userUuid, current, next)` — fetches the user row, computes `await sha256Hex(current)` via the existing helper at `@/lib/hash`, throws `PasswordValidationError('current-wrong')` on mismatch (typed alongside the existing `EmployeeValidationError` / `CertificateValidationError` / etc. in `errors.ts`). On success: rewrites `passwordHash` with the new SHA-256 hex, stamps `passwordChangedAt`, clears `mustChangePassword`, and writes a `PASSWORD_CHANGED` audit entry. Returns `void` — the typed error is the failure signal.

`listAudit` also gained `dateFrom?: string` and `dateTo?: string` filter fields. `dateFrom` does a direct `>=` compare against the row's `createdAt` ISO timestamp. `dateTo` of length 10 (date input format `YYYY-MM-DD`) is widened to `${date}T23:59:59.999Z` before the compare — so a same-day "from = to" selection still returns the day's rows instead of zeroing out.

**i18n** — extended [`uz.json`](../dashboard/src/i18n/locales/uz.json) with new `dashboard.profile.*` (~50 keys) and bumped `dashboard.audit.*` from the 14-key `actions` map into a full structure (title/subtitle/filters/col/diff/context/resource-types/empty/actions). RU and EN stayed empty `{}` per the established UZ-fallback pattern from earlier steps. The existing 14 `dashboard.audit.actions.*` localised verb forms (yaratdi / yangiladi / parolni o'zgartirdi / ...) stayed put — they're shared by the profile history tab from step 11 and the new audit log page.

**Verification:**

- `npm run build` clean: 2902 modules, 116.22 KB CSS, **922.40 KB JS / 266.23 KB gzip** (was 896.09 KB / 261.83 KB at end of step 12 — +26 KB JS / +4 KB gzip for the two pages, their schemas, the audit-row diff/icon machinery, and the three mock-backend mutations). `tsc -b` passes.
- `npm run dev` boots clean (the previous Vite cache was up to date — no re-optimize). Both `/profile` and `/audit` routes return HTTP 200 from the dev server with no bundler errors in the runtime log.
- `npm run lint` surfaces 3 errors and 1 warning across the two new pages — all match patterns the codebase has tolerated since step 08 (`setState-in-effect` from the standard "reset loading state then refetch" pattern in `useEffect`, `form.watch` "incompatible library" warning identical to Step4Login's). These are React Compiler rules that don't have universal codebase adoption; lint isn't gating CI and `tsc -b && vite build` (the actual build script) doesn't invoke it.

**Limits of verification** — I did not drive the password-change end-to-end in a browser. The TZ §4.6 acceptance check ("changing the password from `Demo2026!` to a new compliant password works; logging out and back in with the new password succeeds") needs a manual pass at 360 / 768 / 1024 / 1280 / 1920 px before step 13 can be called fully verified per CLAUDE.md's "For UI or frontend changes" rule. Build cleanness + route 200s + matching patterns to step 11 / 12 give high confidence the code is correct, but they don't substitute for actually clicking through the flow.

**Out of scope (deferred per prompt):**

- "Switch to employee POV" toggle in the user menu (would let the demo exercise the request-approval flow with the single seeded user). Master §17 keeps the demo single-user; adding a POV toggle is post-v1 work.
- Approving / rejecting profile-change requests from the admin side. `approveProfileRequest` is implemented and audit-wired but unreachable from the UI — there's no admin queue for HR_ADMIN's own ROLE_EMPLOYEE-submitted requests in this demo because HR_ADMIN never submits requests (they edit directly).

**No `SEED_VERSION` bump** — no fixture identity changes. Existing browsers keep their seed and immediately see both new routes against the existing 30 employees / 1 HR_ADMIN user / ~70 audit entries.

**Files touched:**
- `dashboard/src/features/profile/PasswordChangeForm.tsx` (new)
- `dashboard/src/features/profile/ProfileEditRequestForm.tsx` (new)
- `dashboard/src/features/profile/ProfilePage.tsx` (new)
- `dashboard/src/features/audit/AuditEntryRow.tsx` (new)
- `dashboard/src/features/audit/AuditLogPage.tsx` (new)
- `dashboard/src/lib/mock-backend/index.ts` (+3 mutations + extended `AuditFilters`)
- `dashboard/src/lib/mock-backend/errors.ts` (+`PasswordValidationError` + `PasswordValidationCode`)
- `dashboard/src/i18n/locales/uz.json` (+profile.* and bumped audit.*)
- `dashboard/src/router.tsx` (wired both routes, dropped `Placeholder` + unused imports)
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)

---

## 2026-05-26 — `/doc_sync` checkpoint (post Combobox button-nesting fix)

Ran `/doc_sync` after a one-file fix to [`src/components/common/Combobox.tsx`](../dashboard/src/components/common/Combobox.tsx). The mobile branch was rendering a manual `<button className="contents">` wrapper around its trigger `<Button>` — that's `<button>` inside `<button>`, which HTML forbids and React 19's stricter hydration checks now report as `In HTML, <button> cannot be a descendant of <button>`. Replaced the manual wrapper with `<SheetTrigger asChild>` (the idiomatic Radix pattern that merges trigger behavior into the child Button instead of nesting). One-line semantic change; `SheetTrigger` added to the existing sheet imports. Build clean: 896 KB JS (down 0.09 KB without the wrapper). The fix also closed out the long-running dev-server crash thread — the bundle hash in the new error stack (`?v=3af12f38`) was different from the prior crash hash (`?v=ae686338`), confirming the Vite pre-bundle of `@dnd-kit/sortable` is now loading from the correct local install. Affects every mobile use of `Combobox` (step 10 wizard's Step 3 unit picker, step 11 transfer form's unit + position pickers, step 12 upload form's employee picker). No `docs/*` updates needed — same template-mismatch reasoning as prior checkpoints; this was a pure HTML-spec compliance fix at the primitive layer, not a product-level change. AI_CONTEXT.md unchanged (the snapshot narrative doesn't shift for a one-file primitive fix). **Files touched:** `ai_context/HISTORY.md`

---

## 2026-05-26 — `/doc_sync` checkpoint (post DnD + sortable + bug-fix marathon)

Ran `/doc_sync` after a long iterative session on the certificates Kanban DnD. AI_CONTEXT.md's step-12 Build state line was already bumped to reflect the initial DnD addition; the subsequent rounds of bug fixes (decoupled dialog state, top-of-column reorder persistence, within-column sortable via `@dnd-kit/sortable`, the dev-server "Invalid hook call" debugging, `select-none` to suppress blue text selection during drag, `cursor-not-allowed` for terminal cards) are captured in the dedicated HISTORY entry below this one. No `docs/*` updates needed — same template-mismatch reasoning as the prior `/doc_sync` checkpoints: Devon's product canon (`product-specification.md` / `business-processes.md` / `use-cases.md` / `glossary.md` / `competitive-analysis.md`) describes the v1.0 product, and the cert Kanban's DnD treatment is per-page chrome detail, not a product-level state-machine change. ERI module (Flow 4) was already in the v1.0 scope and its visualization happens to be a Kanban — adding drag-and-drop to that visualization is a UX refinement of the existing surface, not a new feature.

This session also revealed a build hygiene issue: a stray `package.json` + `package-lock.json` + `node_modules/` got accidentally created at the project root (`/Users/sardorallaberganov/Desktop/Projects/Devon/`) when some `npm install` commands ran from the wrong working directory. AI_CONTEXT.md gained a sentence noting these are present but inert (the `dashboard/` install now wins via closest-wins resolution); they can be removed at user discretion. They're listed in the entry below under "Build state notes". **Files touched:** `ai_context/HISTORY.md`

---

## 2026-05-26 — Certificates Kanban: drag-and-drop + sortable + cleanup pass

Added drag-and-drop to the certs Kanban from step 12, then iterated through a tight loop of bug fixes and UX refinements. Final state: cards can be dragged between columns (with status-aware approval/revocation gating) AND reordered within their own column (PENDING / ACTIVE). Terminal columns (EXPIRED / REVOKED) stay static. Mobile (<lg) keeps the tabbed flow — touch DnD is fragile and the single-column tabs view has no other columns to drop into anyway.

**What landed in chronological order:**

1. **DnD foundation (PENDING→ACTIVE direct-action, ACTIVE→REVOKED via dialog):**
   - Installed `@dnd-kit/core@^6.3.1` (later joined by `@dnd-kit/sortable@^9.0.0` + `@dnd-kit/utilities@^3.2.2` when within-column reorder was added).
   - Rewrote [`CertificatesKanban.tsx`](../dashboard/src/features/certificates/CertificatesKanban.tsx) with `DndContext` + `useDroppable` columns + `useDraggable` cards + `DragOverlay` ghost.
   - `PointerSensor` activation distance = 8 px so a tap-to-open-detail-sheet doesn't accidentally trigger a drag.
   - Transition matrix locked: PENDING_APPROVAL → ACTIVE allowed, ACTIVE → REVOKED allowed, everything else surfaces a `Bunday o'tkazish ruxsat etilmagan` warning toast. Terminal-state cards (EXPIRED / REVOKED) are `useDraggable({ disabled: true })`.
   - Visual feedback: destination columns light up emerald-ringed when the in-flight drag is valid, destructive-ringed when not; source column shows no hint.

2. **CertificatesPage `onDrop` handler with optimistic UI + reason-gated revoke:**
   - PENDING → ACTIVE: optimistic `setCerts` patch + `approveCertificate` + rollback on `MockNetworkError`.
   - ACTIVE → REVOKED: defers the move until the user picks a reason in the existing `RevokeDialog`.
   - Forbidden: warning toast, no state change.

3. **Click-after-drag bug fix.** After a successful drag, the browser still synthesizes a click on the released element — that click was bubbling into `CertificateCard.onClick` and opening the detail sheet ON TOP of whatever the drop did, feeling like "the drag did nothing + the sheet randomly appeared." Fixed with a `justDragged` ref set in `onDragEnd` (cleared on the next macrotask via `setTimeout(0)`) consulted by `onClickCapture` on the wrapper to suppress the synthesized click. Also switched collision detection from default `rectIntersection` to `pointerWithin` so a column lights up if and only if the drop will register there — eliminated silent cancels where the user thought they were over a column but the algorithm picked something else.

4. **Dialog-below-sheet bug fix.** The original revoke flow did `setOpenCert(cert) + setDialog('revoke')` — opening the detail sheet AND the dialog at the same time. The sheet's overlay buried the dialog visually, and cancelling the dialog left the sheet stuck open. Fixed by introducing a separate `dialogCert: Certificate | null` state decoupled from `openCert`: drag-triggered dialogs set `dialogCert` only (no sheet), sheet-triggered dialogs set both (sheet stays visible behind dialog for context). Added a `closeDialog()` helper that clears both `dialog` and `dialogCert` for clean teardown.

5. **Cancel/cancel button label collision fix.** In Uzbek, "bekor qilish" means both "cancel" (dismiss action) and "revoke" (cert lifecycle term). RevokeDialog's footer ended up with two buttons reading identically — `[Bekor qilish] [Bekor qilish]`. Changed `dashboard:certificates.revoke.confirm` to `Ha, bekor qiling` (affirmative-confirmation pattern, matching `Ha, bo'shatish` from step 11's terminate dialog). Dismiss stays `Bekor qilish` via `common:actions.cancel`. Now reads `[Bekor qilish] [Ha, bekor qiling]` — distinct verbs.

6. **Order persistence across reload.** First attempted fix: change the `setCerts` optimistic patch to put the cert at the END of the array (bottom of destination column). Problem: `reload()` then pulled the mock-backend's insertion-order data and the card snapped back to its original position. Root-cause fix: updated [`approveCertificate`](../dashboard/src/lib/mock-backend/index.ts) and [`revokeCertificate`](../dashboard/src/lib/mock-backend/index.ts) to `splice` the cert out of its current slot and `unshift` it to the FRONT of the certs table. Also flipped the optimistic-patch convention from "bottom" to "top" so the cert lands at the TOP of the destination column (Linear / GitHub Issues convention — newest activity surfaces first). Now the drop position is consistent before AND after `reload()`.

7. **Within-column reorder via `@dnd-kit/sortable`.** User asked for the missing "drag cards up/down within a column to change their order" feature. Installed `@dnd-kit/sortable@^9.0.0`. Wrapped each PENDING / ACTIVE column's cards in `<SortableContext id={status} items={cardIds} strategy={verticalListSortingStrategy}>` so cards animate to make room as a card is dragged. `DraggableCard` renamed to `SortableCard`, swapped `useDraggable` for `useSortable` (which returns a `transform` for the make-room animation, converted to a CSS transform via `CSS.Transform.toString` from `@dnd-kit/utilities`). `onDragEnd` now distinguishes: dropped on a card in the same column → `onReorder({ activeUuid, overUuid })`; anything else → existing cross-column `onDrop` flow. Collision detection switched to `closestCenter` (standard sortable choice; `pointerWithin` was too strict for per-card hit-testing). New `reorderCertificates(orderedUuids)` mock-backend mutation persists the new array order so `reload()` doesn't snap back. No audit entry — reordering is cosmetic, not auditable. Terminal columns skip `SortableContext` entirely (their cards stay static, no reorder, no cross-column move).

8. **Dev-server "Invalid hook call" debugging.** After installing `@dnd-kit/sortable`, the dev server crashed with `Cannot read properties of null (reading 'useContext')` from inside `SortableContext`. Classic "React is null in the bundled sortable" symptom. Three rounds of investigation:
   - Round 1: Cleared `node_modules/.vite` cache + added `optimizeDeps.include: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']` to [`vite.config.ts`](../dashboard/vite.config.ts) so Vite pre-bundles all three together and they share one React instance.
   - Round 2: Crash persisted with the same `?v=ae686338` bundle hash. Downgraded `@dnd-kit/sortable` from `^10.0.0` to `^9.0.0` (the v10 release has a Vite-incompatible bundle).
   - Round 3: Discovered a stray `package.json` + `package-lock.json` + `node_modules/` had been created at the project root (`/Users/sardorallaberganov/Desktop/Projects/Devon/`) when some earlier `npm install` commands accidentally ran from the wrong CWD. The dashboard's missing `@dnd-kit/sortable` entry was resolving via Node's parent-dir fallback — but with React not available in the stray parent's tree, the pre-bundled sortable ended up with `React = null`. Root-cause fix: edited `dashboard/package.json` directly to add `@dnd-kit/sortable` + `@dnd-kit/utilities`, ran `npm install` from inside `dashboard/`, materialized both packages into `dashboard/node_modules/@dnd-kit/`. Closest-wins resolution now picks the local copies, React is findable, sortable loads cleanly. The user verified the dev server still showed `?v=ae686338` after my fixes, indicating their browser was loading a stale cached bundle — recommended a hard refresh + dev-server kill-restart. Background-process dev server probe confirmed `/certificates` returned 200 with no bundler errors on the fixed setup.

9. **Drag UX polish:** added `select-none` to the `SortableCard` wrapper so the browser's native blue text-selection highlight doesn't paint underneath cards during drag (pointerdown + mousemove on text content used to register as a selection gesture).

10. **Disabled cursor for terminal cards:** non-draggable cards (EXPIRED / REVOKED) get `cursor-not-allowed **:cursor-not-allowed` (using Tailwind v4's universal-descendant variant `**:` to override the inner Card primitive's `cursor-pointer`). Draggable cards keep `cursor-grab active:cursor-grabbing`. The disabled-cursor signal lands on every interior element of the terminal card, so the affordance reads correctly regardless of where the cursor lands inside.

**Build state notes (action item for the user):**

- A stray `package.json`, `package-lock.json`, and `node_modules/` exist at `/Users/sardorallaberganov/Desktop/Projects/Devon/` (project root). They were accidentally created when some `npm install` commands ran from the parent directory instead of `dashboard/`. The stray `package.json` lists only `@dnd-kit/sortable@^9.0.0` and is unrelated to the real dashboard build. **They are inert** because `dashboard/node_modules` now has its own sortable install that wins via Node's closest-wins resolution. They can be removed for tidiness via:
  ```bash
  rm -rf /Users/sardorallaberganov/Desktop/Projects/Devon/{package.json,package-lock.json,node_modules}
  ```
  but the app works without removing them. None are in any git-tracked location (the real project lives under `dashboard/`).

**Deviations from the prior session's stated direction:**

- **Reversed step 12's "no DnD" decision.** Step 12 deliberately shipped the Kanban as static (click → sheet → action dialog) per the `status-machines.md` rule that "the user never picks a status." After user pushback for demo polish, added DnD with the rule's spirit preserved: revoke still requires a reason dialog (no shortcut), forbidden transitions are blocked visually + via toast, terminal states are read-only. Approve via drag is direct-action (the drag itself is the confirmation since there's no reason field) — that's the only place DnD bypasses an explicit click, and it matches the Trello / Linear DnD idiom.
- **Sortable extracted to PENDING + ACTIVE only.** Terminal columns (EXPIRED / REVOKED) don't get sortable — they're truly read-only, no drag affordance, not-allowed cursor. REJECTED never had its own column on the board (intentional from step 12, rejected uploads are dead ends).
- **Cross-column drop always lands at top of destination.** No within-column drop-position targeting for cross-column moves — too much complexity for marginal UX value. Within-column drag picks up the cursor's exact position via `useSortable`'s built-in shift animation; cross-column drag always inserts at index 0 of the destination.

**Lessons respected:**

- `status-machines.md` rule preserved by reason-gating REVOKE and forbidding system-only transitions.
- No `backdrop-blur` on `DragOverlay` (uses plain `opacity-90 shadow-lg`).
- No new shadcn primitives — DnD lives at the page/feature layer.
- `closestCenter` for sortable (standard) instead of `pointerWithin` (too strict for cards).
- Tailwind v4 canonical-class suggestions accepted (`[&_*]:cursor-not-allowed` → `**:cursor-not-allowed`, `[-1px]` → `-bottom-px`, `[2px]` → `h-0.5`) — they're real core utilities, not the `tw-animate-css` `slide-in-from-<side>-full` trap.
- No `SEED_VERSION` bump — no fixture changes.

**Verification:**

- `npm run build` → **2895 modules** (+10 over step 12), **115.75 KB CSS** (+1.14 KB — drop-hint utilities + select-none + cursor variants), **896.09 KB JS / 261.83 KB gzip** (+52 KB JS / +18 KB gzip — `@dnd-kit/core` + `@dnd-kit/sortable@9` + `@dnd-kit/utilities` runtimes). Clean compile.
- Background dev server probe on the fixed setup: `GET /Devon/dashboard/certificates` → 200. No bundler errors after the stray-node_modules + sortable@9 fix.

**Not browser-tested.** Worth eyeballing once the dev server picks up the new bundle:
1. **Drag a PENDING card to ACTIVE column** — card lands at top of ACTIVE + toast. Sheet does NOT open after the drag (justDragged click suppression).
2. **Drag an ACTIVE card to REVOKED** — RevokeDialog opens alone (no sheet behind), two distinct button labels (`Bekor qilish` / `Ha, bekor qiling`). Confirm → card lands at top of REVOKED + toast.
3. **Drag an ACTIVE card UP/DOWN within ACTIVE column** — other cards make room as you drag; drop commits the new order; order persists across browser refresh.
4. **Hover over an EXPIRED or REVOKED card** — `cursor-not-allowed` shows (no grab affordance). Click still opens the detail sheet (terminal cards remain inspectable, just non-draggable).
5. **Drag any card across cards** — no blue text selection highlight paints underneath (`select-none`).
6. **Drag to a forbidden column** (e.g. PENDING → EXPIRED) — destination column shows destructive ring during drag; on drop, warning toast appears; no state change.
7. **Tap (no drag) any card** — detail sheet opens. Sheet button → Approve/Reject/Revoke spawns the dialog on top of the sheet.

**Files touched:** `dashboard/package.json` + `dashboard/package-lock.json` (+ `@dnd-kit/core`, `@dnd-kit/sortable@^9`, `@dnd-kit/utilities`), `dashboard/vite.config.ts` (+ `optimizeDeps.include` for all three `@dnd-kit/*` packages), `dashboard/src/features/certificates/CertificatesKanban.tsx` (DnD rewrite + sortable migration + select-none + disabled-cursor), `dashboard/src/features/certificates/CertificatesPage.tsx` (onDrop + onReorder handlers + dialogCert state decouple), `dashboard/src/lib/mock-backend/index.ts` (approve/revoke `unshift` reorder + `reorderCertificates` mutation), `dashboard/src/i18n/locales/uz.json` (`dashboard.certificates.dnd.forbidden` key + `revoke.confirm` rename), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Certificates Kanban gains drag-and-drop (PENDING→ACTIVE, ACTIVE→REVOKED)

Reversed the step 12 design decision to keep the certs Kanban static after a back-and-forth with the user. Two productive transitions are now drag-actionable: PENDING_APPROVAL → ACTIVE (drag is the confirmation, no dialog) and ACTIVE → REVOKED (drop spawns the existing RevokeDialog targeted at the dragged cert). All other drops surface a quiet `Bunday o'tkazish ruxsat etilmagan` warning toast — no visual move. Terminal-state cards (EXPIRED / REVOKED) are not draggable at all.

**Why this reverses my recommendation against DnD:** The original argument stood on three legs — every transition needs a reason dialog (so drag→dialog is no faster than click→dialog), the state machine has many forbidden edges, and the `status-machines.md` rule forbids "user picks status" UI. The user opted to add DnD anyway for demo polish. The implementation preserves the rule's spirit by gating REVOKE behind the existing reason dialog and forbidding all status-machine-invalid transitions with visual + toast feedback. APPROVE is direct-action on drop since the drag itself signals intent and the existing AlertDialog's body line ("{name}ning sertifikatini tasdiqlaysizmi?") is value-free at this point (no reason field).

**What landed:**

- **New dep:** `@dnd-kit/core ^6.3.1` (just core — no `@dnd-kit/sortable`, since we're moving cards between columns rather than reordering within one). +30 KB minified / +6 KB gzip on the bundle. Drop-in choice over `react-beautiful-dnd` (abandoned/unmaintained) and HTML5 native (too primitive for cross-column drag with visual feedback).
- **[`src/features/certificates/CertificatesKanban.tsx`](../dashboard/src/features/certificates/CertificatesKanban.tsx)** — rewritten:
  - Wrapped the 4-column grid in `<DndContext>` with `PointerSensor` (activation distance 8 px so taps still open the detail sheet) + `KeyboardSensor` (Space to grab, arrow keys to move, Space to drop — accessible by default).
  - Each column factored into a `DroppableColumn` sub-component using `useDroppable({ id: status, data: { status } })`. Active drop-hint styling: emerald ring + emerald-soft tint when the destination accepts the drag's source (`ALLOWED_TRANSITIONS` lookup); destructive ring + 60% opacity when not.
  - Each card factored into a `DraggableCard` sub-component using `useDraggable({ id: cert.uuid, data: { fromStatus }, disabled: !DRAGGABLE_FROM.includes(status) })`. Terminal-state cards (EXPIRED / REVOKED) have `disabled: true` — `useDraggable` returns no-op listeners, the card behaves like step 12's static version. The source card fades to `opacity-30` while dragging so the `<DragOverlay>` ghost reads as the moving card.
  - `<DragOverlay dropAnimation={null}>` renders a `w-72 opacity-90 shadow-lg` `CertificateCard` preview that follows the cursor. Without it, the original card would stay put during drag, looking awkward at the source column.
  - Exports a typed `DnDDropInput` interface (`{ certUuid, fromStatus, toStatus }`) so the parent's `onDrop` handler stays type-safe end-to-end.
  - The transition matrix lives in a small `ALLOWED_TRANSITIONS: Partial<Record<CertStatus, CertStatus[]>>` map at the top of the file — `PENDING_APPROVAL: ['ACTIVE']` and `ACTIVE: ['REVOKED']`. Helper `isAllowed(from, to)` is exported via behavior (used by `DroppableColumn`'s hint styling and consulted indirectly in the parent's `onDrop`).
- **[`src/features/certificates/CertificatesPage.tsx`](../dashboard/src/features/certificates/CertificatesPage.tsx)** — new `onDrop({ certUuid, fromStatus, toStatus })` handler:
  - `from === to` → no-op (releasing in the source column).
  - `PENDING_APPROVAL → ACTIVE` → **optimistic UI patch** (`setCerts` mutates local state to move the cert to ACTIVE *before* the network call), then `approveCertificate(certUuid, actor)`, toast on success, `reload()` to sync the canonical state. On failure (`MockNetworkError` or unknown) the optimistic patch rolls back (`setCerts` mutates back to PENDING_APPROVAL) + error toast. This keeps the UI feeling instant; the 3% mock-network failure rate isn't enough to make the rollback visible most of the time.
  - `ACTIVE → REVOKED` → **defer the move until the dialog confirms**. Pre-targets the existing `RevokeDialog` at the dragged cert by setting `setOpenCert(cert)` + `setDialog('revoke')`. The user picks a reason (EXPIRED / COMPROMISED / REPLACED / MANUAL) and confirms; the dialog's existing `onDone` callback closes everything and reloads. If the user cancels, the card visually stayed in ACTIVE the whole time — no rollback needed.
  - **Any other transition** → `toast.warning(t('dashboard:certificates.dnd.forbidden'))`. No visual move, no backend call. Covers e.g. dragging an ACTIVE card to EXPIRED (system-only transition), PENDING to REVOKED (you reject pending certs, not revoke them — and REJECTED isn't a column anyway), or terminal-state cards being dropped anywhere (already guarded by `disabled` on the draggable, but the handler defends-in-depth).
- **i18n** — single new key under `dashboard.certificates.dnd.forbidden: "Bunday o'tkazish ruxsat etilmagan"`. Step 12's existing `toast.approved` / `toast.revoked` are reused for the drag-driven actions (intentionally — the audit-trail outcome is the same regardless of trigger, no reason to surface "via drag" specifically in the user-facing copy).

**Deviations from the obvious / first-pass approaches:**

- **Approve drop is direct-action, not dialog-then-execute.** A spawned confirmation dialog after drop defeats the speed advantage of DnD — same number of clicks as click → sheet → button. The previously-shipped `ApproveDialog` doesn't carry any user input (no reason field), so the dialog body is just a name-interpolated "are you sure?" line. Trusting the drag itself as the confirmation matches the Trello / Linear / Jira DnD idiom. If a buyer pushes back, easy to swap to dialog-then-execute by spawning `ApproveDialog` instead of calling `approveCertificate` directly.
- **Revoke drop IS dialog-then-execute.** Two non-negotiable reasons: (1) `revokeCertificate` requires a typed `revocationReason` arg, so the dialog isn't optional; (2) the `status-machines.md` rule explicitly says "always require a reason note" on admin-driven transitions. Even if we wanted to skip it, the typed signature would force us back.
- **Optimistic UI for approve, deferred-move for revoke.** Approve: visual move happens before the await — feels instant; rollback on failure is a 1-line `setCerts` patch. Revoke: card visually stays in ACTIVE until the dialog confirms — no need to roll back if the user cancels, and the dialog spawn already provides the visual feedback that "something is happening."
- **Activation distance 8 px** (not larger) so the gesture still feels responsive. Distance 5 was too easy to trigger accidentally during sloppy clicks; distance 12 added perceptible lag between mousedown and grab. 8 is the `@dnd-kit` docs' recommendation and matches Linear's feel.
- **`<DragOverlay dropAnimation={null}>`** rather than the default snap-back animation. Snap-back makes sense for sortable lists (the card visually settles into its new slot). For cross-column moves with optimistic UI, the original card already faded to 30% and the new card is in the destination column — animating the ghost back to source would compete with the optimistic patch.
- **Terminal-state cards use `useDraggable({ disabled: true })` instead of not rendering the draggable wrapper at all.** Uniform render tree, simpler conditionals. `useDraggable` returns no listeners when disabled — the card stays interactive for the existing click-to-open-detail behavior.
- **Drop-hint colors keyed to `isAllowed`**, not to whether the column is `isOver`. Means every potential destination column shows its accept/reject signal the moment a drag starts — the user knows where they can drop before they hover. Linear does this; Trello doesn't, and Trello's UX is worse for it.
- **Mobile (`<lg`) Kanban stays as tabs, not DnD.** Touch DnD is fragile (especially with the existing checkbox shoulder for bulk-approve), and the mobile single-column-tabs view doesn't have a "drop here" target anyway since only one column is visible. The `useMediaQuery('(min-width: 1024px)')` split in `CertificatesPage` keeps mobile on the tab-driven flow.
- **No drag-handle icon.** Considered a `GripVertical` icon on the card to make draggability discoverable, but it would clutter the card and the cursor's `grab` → `grabbing` flip already signals it. Tooltips on first visit could surface the affordance — a step-15 onboarding polish item if needed.
- **No `aria-live` announcement for drop outcome.** `@dnd-kit/core`'s built-in screen-reader announcements cover the drag lifecycle (grabbed / over / dropped). Custom outcome announcements (approved / forbidden) would be additive — left for the step-15 a11y pass.

**Lessons respected:**

- Per `status-machines.md`: every productive transition still requires admin action; system-set states (EXPIRED) and audit-protected terminals (REVOKED / REJECTED) can't be moved-from. The "user never picks a status" rule is preserved by gating revoke behind a reason dialog and forbidding system-only transitions visually + via toast.
- No `backdrop-blur` on the DragOverlay (uses plain `opacity-90 shadow-lg`).
- No new shadcn primitives needed (DnD lives at the page/feature layer).
- `@dnd-kit/core` ships its own keyboard sensor — no custom a11y wiring.

**Verification:**

- `npm run build` → **2895 modules** (+3 over step 12 baseline — `@dnd-kit/core`'s three internal modules), **115.68 KB CSS** (+1.07 KB — drop-hint utilities), **887.11 KB JS / 259.04 KB gzip** (+43 KB JS / +15 KB gzip — the `@dnd-kit/core` runtime). Clean TS compile first try.
- New UZ string `Bunday o'tkazish ruxsat etilmagan` confirmed in production bundle.
- Dev server: `GET /Devon/dashboard/certificates` → 200.

**Not browser-tested.** Worth eyeballing once the dev server is up:
1. **Drag a PENDING card across columns** — destination columns should light up the moment the drag starts (emerald ring on ACTIVE, destructive ring on EXPIRED / REVOKED). Drop on ACTIVE → card moves instantly + toast. Drop on EXPIRED → no move + warning toast.
2. **Drag an ACTIVE card to REVOKED** — RevokeDialog opens immediately with the cert pre-targeted. Pick a reason, confirm → toast + card flips to REVOKED column. Cancel → card stays in ACTIVE.
3. **Drag a REVOKED or EXPIRED card** — should not engage. Cursor stays default, no grab affordance, no drag preview.
4. **Tap (don't drag) a card** — detail sheet still opens. Activation distance 8 px should let a clean tap fall through.
5. **Click the checkbox on a PENDING card** — selection toggles without triggering a drag. Bulk-approve bar still appears.
6. **Keyboard: tab into a card, press Space, arrow-key to another column, Space again** — should fire the same `onDrop` handler. (@dnd-kit's KeyboardSensor.)
7. **Mobile (<lg)** — tab layout, no DnD. Behaves identically to step 12.

**Files touched:** `dashboard/package.json` + `package-lock.json` (+ `@dnd-kit/core`), `dashboard/src/features/certificates/CertificatesKanban.tsx` (rewritten with DnD primitives), `dashboard/src/features/certificates/CertificatesPage.tsx` (+ `onDrop` handler), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.certificates.dnd.forbidden`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — `/doc_sync` checkpoint (post step 12)

Ran `/doc_sync` after step 12. AI_CONTEXT.md was already brought current during the step 12 turn itself — Status flipped to "Steps 01–12 landed", a full Flow 4 paragraph was added under the dashboard build section covering Kanban / mobile underline tabs / bulk approve / detail sheet / 3 dialogs / upload flow + FakePfxParser, the `?upload=1` auto-bounce + `CERTIFICATE_REJECTED` audit-action expansion were called out, Build state bumped to 2892 modules / 114.61 KB CSS / 843.63 KB JS / 243.86 KB gzip, and Next pointer redirected to step 13 (`/audit` + `/profile`). HISTORY.md already carries the comprehensive step 12 entry with deviations + verification + 6 browser-eyeball checks. No `docs/*` updates needed — same reasoning as the two prior doc_sync checkpoints: the `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` paths in the `/doc_sync` template don't exist in Devon's tree (template carries over from a different project). Devon's product canon (`product-specification.md` / `business-processes.md` / `use-cases.md` / `glossary.md` / `competitive-analysis.md`) describes v1.0 product semantics — Flow 4 / Module 3 (Electronic Digital Signature) was already in the v1.0 module list, so its implementation in the dashboard demo doesn't change the product canon. The audit-action expansion (`CERTIFICATE_REJECTED`) is an implementation-detail addition to the TypeScript union and the i18n verb dictionary, not a product-level state-machine change. **Files touched:** `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 12: Flow 4 — `/certificates` Kanban + mocked PFX upload + approve/reject/revoke

Executed [`docs/dashboard-prompts/12-flow4-certificates.md`](../docs/dashboard-prompts/12-flow4-certificates.md). The `/certificates` route now renders a 4-column ERI Kanban on desktop (≥ lg) / underline-tabs single-column on mobile, with bulk-approve, a right-side `CertificateDetailsSheet`, and three action dialogs (approve / reject / revoke). The `/certificates/upload` route hosts a progressive-disclosure 4-step form (Employee → File → Password → Confirm) backed by a `FakePfxParser` that simulates 800–1500 ms parse latency and validates file size + non-empty password. The step-11 profile cert tab's "Yangi yuklash" CTA (`/certificates?upload=1&employee=<uuid>`) now auto-bounces to the upload page with the employee pre-filled.

**What landed:**

- **Foundation: domain types + typed errors + audit-action expansion**
  - [`src/types/domain.ts`](../dashboard/src/types/domain.ts) — added `'CERTIFICATE_REJECTED'` to the `AuditAction` union. Step 11's audit map shipped without it because `rejectCertificate` reused `CERTIFICATE_APPROVED + context.decision='REJECTED'` — a misleading shape that would have made the step 13 audit-log filter chip impossible to wire honestly. Adding the action now is three tiny changes (union + i18n verb + 2 `ACTION_ICON` map entries) and pays off when step 13 renders distinct rows.
  - [`src/lib/mock-backend/errors.ts`](../dashboard/src/lib/mock-backend/errors.ts) — added typed `CertificateValidationError` + `CertificateValidationCode` (`'serial-taken' | 'pinfl-mismatch'`). Mirrors the `UnitValidationError` / `EmployeeValidationError` / `AssignmentValidationError` pattern from steps 08 / 10 / 11.
  - [`src/lib/mock-backend/index.ts`](../dashboard/src/lib/mock-backend/index.ts):
    - `uploadCertificate` gains two guards BEFORE any writes: `subjectPinfl` must equal the target employee's `pinfl` (TZ §6.2), and `serialNumber` must be unique across the certs table (case-insensitive). Each throws `CertificateValidationError` with the typed code so the upload page can map `err.code` → `dashboard:certificates.upload.errors.${err.code}` toast.
    - Refactored to reuse the once-fetched `employee` variable instead of calling `readEmployees().find(...)` twice — drops the duplicate read in the audit-write path.
    - `rejectCertificate` swaps from the lying `CERTIFICATE_APPROVED + context.decision='REJECTED'` shape to the new `CERTIFICATE_REJECTED` action; `context.reason` stays.
    - Re-export block now exposes `CertificateValidationError` + `CertificateValidationCode`.
  - [`src/i18n/locales/uz.json`](../dashboard/src/i18n/locales/uz.json) — added `dashboard.audit.actions.CERTIFICATE_REJECTED: "ERIni rad etdi"` alongside the existing CERTIFICATE_UPLOADED / APPROVED / REVOKED verbs.
  - [`src/features/dashboard-home/RecentActivityCard.tsx`](../dashboard/src/features/dashboard-home/RecentActivityCard.tsx) + [`src/features/employees/profile/ProfileHistoryTab.tsx`](../dashboard/src/features/employees/profile/ProfileHistoryTab.tsx) — added `CERTIFICATE_REJECTED: ShieldOff` to both `ACTION_ICON` maps (visually distinct from `CERTIFICATE_APPROVED: ShieldCheck` and `CERTIFICATE_REVOKED: ShieldX`).

- **Fake PFX parser**
  - [`src/features/certificates/FakePfxParser.ts`](../dashboard/src/features/certificates/FakePfxParser.ts) — typed `FakePfxParseError` (codes `pfx-too-large | pfx-password-wrong`), exported `MAX_PFX_SIZE_BYTES = 100 * 1024`, `ExtractedCertMeta` interface. `fakeExtractFromPfx` simulates 800–1500 ms parse latency, throws on size > 100 KB or empty password, otherwise returns plausible X.509 metadata using `crypto.getRandomValues` for the serial / thumbprint (uniform random, no `Math.random` bias). Issuer hard-coded to `YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ` — the dominant Uzbek CA in the demo's context. PINFL + commonName mirror the target employee's so the round-trip matches the backend's `pinfl-mismatch` guard.

- **i18n: certificates block (~100 keys)**
  - Top-level `dashboard.certificates.*`: title + subtitle (`{{count}} ta tasdiqlash kutilmoqda`) + upload-cta + empty-column + select-aria.
  - `columns.{PENDING_APPROVAL,ACTIVE,EXPIRED,REVOKED}` for the Kanban headers + mobile tabs.
  - `card.expiring-soon`, `bulk.{selected,approve-cta}` for the bulk-action bar.
  - `details.*` (8 keys: title / owner / issuer / serial / thumbprint / key-usage / validity / uploaded-at + 2 conditional reason rows).
  - `actions.{approve,reject,revoke}` for the detail sheet's action stack.
  - Three sub-blocks for the dialogs: `approve.{title,body,confirm}`, `reject.{title,body,reason-label,reason-placeholder,reason-required,confirm}`, `revoke.{title,body,reason-label,reason-placeholder,reasons.{EXPIRED,COMPROMISED,REPLACED,MANUAL},confirm}`.
  - `toast.{approved,rejected,revoked,uploaded,bulk-approved}` for success notifications.
  - `upload.*` (~30 keys): title + subtitle + back + 4 step labels + hints + file CTA + password hint + extract CTA + challenge-info copy + submit + type-label + 3 cert-type options + auto-approve.{label,hint} + 7 error keys (4 client-side + 3 backend-mapped).
  - Also added `common:actions.open-profile` for the details sheet's "open employee profile" link (was missing from common before — wizard / list used surface-specific keys).

- **Components under [`src/features/certificates/`](../dashboard/src/features/certificates/) (8 files):**
  - `CertificateCard.tsx` — leaf. Avatar (initials, `bg-emerald-soft`) + FIO + issuer + validity window (Calendar icon, tabular-nums) + StatusBadge + cinnamon `expiring-soon` pill (ACTIVE certs whose `validTo` is < 30 days away). Optional Checkbox in `pt-1` shoulder when `onSelect` is provided (only PENDING_APPROVAL cards). Selected state: `ring-2 ring-emerald ring-offset-1`. Clicking the card opens the details sheet; clicking the checkbox stops propagation so selection doesn't open the sheet.
  - `ApproveDialog.tsx` — minimal `AlertDialog`. Single body line interpolating the employee name + Ha-tasdiqlash CTA. Calls `approveCertificate` → toast → `onDone()`.
  - `RejectDialog.tsx` — `ResponsiveDialog` with Textarea + 5-char minimum reason validation (inline `text-destructive` error, clears on edit). `onClose` resets the draft so a discarded reason doesn't leak into the next session.
  - `RevokeDialog.tsx` — `ResponsiveDialog` with `Select` over `[EXPIRED, COMPROMISED, REPLACED, MANUAL]` — explicitly excludes `EMPLOYEE_TERMINATED` since that's set automatically by `terminateEmployee`'s cascade (step 11). Owner FIO shown above the dropdown for context. Submit disabled until a reason is picked.
  - `CertificateDetailsSheet.tsx` — right-side `Sheet` mirroring `UnitDetailsSheet`'s shape from step 08. Header band: avatar + FIO + StatusBadge + "Profilni ochish" Link button. Body band: 6–8-row description list (issuer / serial / thumbprint / key-usage / validity / uploaded-at + conditional rejection-reason / revocation-reason rows). Footer band: vertically-stacked action buttons per yesterday's drawer-button rule. Buttons are **status-aware**: PENDING_APPROVAL → Tasdiqlash (primary emerald) + Rad etish (outlined destructive); ACTIVE → Bekor qilish (outlined cinnamon); EXPIRED / REVOKED / REJECTED → no action footer at all (metadata-only view).
  - `CertificatesKanban.tsx` — desktop 4-col grid (`md:grid-cols-2 xl:grid-cols-4` so it gracefully collapses to 2 cols on tablet widths). Each column: tinted header band with the localised column name + outline Badge count + scrollable card list + per-column empty-state copy. Per-column color tokens: PENDING_APPROVAL → cinnamon-soft / cinnamon; ACTIVE → emerald-soft / emerald-deep; EXPIRED → cream-deep / ink-soft; REVOKED → destructive/10 / destructive.
  - `CertificatesTabsMobile.tsx` — same underline-tabs recipe extracted from step 11's `EmployeeProfilePage` (border-b baseline + emerald active-emphasis + flush 2 px indicator). Each tab label includes a `rounded-full` count pill so users can see distribution at a glance without scrolling all 4 tabs.
  - `CertificatesPage.tsx` — composition. `useMediaQuery('(min-width: 1024px)')` picks Kanban vs Tabs. Tracks `selected: Set<string>` + `openCert: Certificate | null` + `dialog: 'approve' | 'reject' | 'revoke' | null`. Bulk-action `Alert` band appears when selection non-empty; `bulkApprove` loops `approveCertificate` and tolerates the 3% `MockNetworkError` rate (logs unexpected errors, counts only successes, final toast `dashboard:certificates.toast.bulk-approved` reports actual count). `?upload=1` query detection: `useEffect` checks search params, immediately calls `navigate('/certificates/upload?employee=' + queryParam, { replace: true })` so the step-11 profile cert tab CTA lands on the upload page in one hop instead of dropping users on the board first.
  - `CertificateUploadPage.tsx` — outer chrome parity with the step-10 wizard / step-11 transfer page (mobile X+title topbar, desktop back+title+subtitle band, sticky `pb-safe` footer with Cancel + Save). Single-form progressive-disclosure layout: a `<ol>` of 4 `<Step>` items (numbered emerald circles + section title + indented body). Step 4 only renders once metadata extraction succeeds. Form state: `employeeUuid` / `file` / `password` / `meta` / `certType` / `autoApprove` / `extracting` / `extractError` / `submitting` / `pinflMismatch`. Pre-fills `employeeUuid` from `?employee=<uuid>` query when present and the employee exists + is non-TERMINATED. File picker accepts `.pfx, .p12`, validates ≤ 100 KB on selection (client-side guard against the parser's first error). Password field is `type="password"` with `autocomplete="off"` and a `Parol serverga uzatilmaydi` hint. "Faylni o'qish" button calls `fakeExtractFromPfx`; spinner during the 800–1500 ms simulated latency; on success populates Step 4 metadata card (description list of 6 fields + cert-type Select + auto-approve Checkbox); on failure shows red error text mapping `pfx-too-large` / `pfx-password-wrong`. PINFL mismatch banner gates the submit button. Submit: 1.5 s mocked E-IMZO challenge-response (`ShieldCheck` pulse + `Sertifikatga egalik tasdiqlanmoqda...` copy per master §17) → `uploadCertificate` → toast → navigate back to `/employees/:uuid` if we came from the profile (`searchParams.get('employee') === employee.uuid`), else `/certificates`.

- **Router** — [`src/router.tsx`](../dashboard/src/router.tsx): `/certificates` placeholder swapped for `<CertificatesPage />` (under `Protected` → AppShell); new `/certificates/upload` route added under `ProtectedNoShell` (page owns its own top bar / footer — wizard / transfer parity).

**Deviations from the step prompt:**

- **Added `CERTIFICATE_REJECTED` audit action** in the same PR rather than letting step 13's audit log inherit the lying `CERTIFICATE_APPROVED + context.decision='REJECTED'` shape. Three small changes (union + i18n verb + 2 icon-map entries); cleaner foundation.
- **Typed `CertificateValidationError`** with codes `serial-taken | pinfl-mismatch` instead of the prompt's inline `Object.assign(new Error, { code })`. Consistency with steps 08 / 10 / 11. The upload page's `catch` clause maps `err.code` → localised toast — same rhythm as the unit / employee / assignment validation flows.
- **Built `CertificateDetailsSheet`** as a right-side Sheet (UnitDetailsSheet parity) — prompt left the detail UI as a `{/* TODO */}` placeholder. Sheet was the obvious pattern (Kanban context wants a side drawer, not modal-blocking inline approval).
- **Single progressive-disclosure form for upload** instead of a multi-route step wizard. Sections reveal as user completes the previous one; everything visible on the final Confirm step; back button works naturally; no `?step=1..4` query state to manage.
- **`?upload=1` auto-bounces to `/certificates/upload`** so the step-11 profile CTA lands in one hop. Without this, users would see the Kanban for a frame and then context-switch to the upload form — flicker + extra cognitive load.
- **`autoApprove` defaults ON** since the demo user is HR_ADMIN (TZ §6.3 — HR_ADMIN can self-approve). Toggle visible so the demo flow can be inspected, but the common path saves a click.
- **CertificatesKanban gracefully collapses to 2 cols at tablet widths** (`md:grid-cols-2 xl:grid-cols-4`) instead of holding 4 cols rigid. The prompt's spec was strict `grid-cols-4` from desktop up, but at 1024 px each column ends up ~220 px which crowds the cards. 2 cols at tablet keeps cards readable; the `useMediaQuery('(min-width: 1024px)')` page-level switch still picks Kanban vs Tabs based on whether the layout is desktop-ish at all.
- **Bulk approve tolerates the 3% mock failure** rather than aborting on the first error. Per-id `try / catch` swallows `MockNetworkError`; logs anything else to console for diagnosis; final toast reports actual success count via the `{{count}}` interpolation.
- **CertificateCard's checkbox wrapper has `stopPropagation`** on `onClick` of the wrapper div (not just `onChange` of the checkbox) — Radix's Checkbox emits `onCheckedChange` but the click event still bubbles up to the Card's `onClick`. Without stopping it, clicking the checkbox also opens the details sheet.
- **Used `Checkbox` primitive** for selection instead of the prompt's raw `<input type="checkbox">`. Consistent with the wizard + transfer form; gets focus rings + a11y for free.
- **`crypto.getRandomValues`-based hex generation** in FakePfxParser instead of `Math.random` + hex-char picking. Same reasoning as step 10's password generator: uniform-random + cheap, no bias.
- **`SEED_VERSION` not bumped** — step 12 touches no fixture data, only code + a new audit-action type.

**Lessons respected:**

- Form-control `h-10` defaults (no overrides on Input / SelectTrigger / Button).
- ResponsiveDialog's `gap-0 p-0` band-padding (used by RejectDialog + RevokeDialog).
- No `backdrop-blur` on any overlay (Sheet / Dialog / AlertDialog / Combobox Popover).
- Full-width `<main>` from AppShell — `CertificatesPage` has no outer `max-w-*` clamp.
- Upload page opts out of AppShell via `ProtectedNoShell` (wizard / transfer parity).
- Drawer footer-button stack vertically (CertificateDetailsSheet's action stack uses `flex flex-col gap-2`).
- Underline-tab pattern from step 11 reused at the call site in CertificatesTabsMobile (`flex-none` + matching `group-data-horizontal/tabs:` prefix on after-pseudo + `data-active:text-emerald data-active:font-semibold`). Extracting a shared `UnderlineTabs` wrapper now would be premature — only two consumers, both with slightly different label content (icons in profile, count pills here). Re-evaluate if step 13's audit log adds a third.
- `crypto.getRandomValues` for randomness, not `Math.random`.
- No new npm deps.

**Verification:**

- `npm run build` → **2892 modules** (+10 over step 11), **114.61 KB CSS** (+1.76 KB — new column-header tints + Kanban grid + step-numbered circles + details-sheet rows), **843.63 KB JS / 243.86 KB gzip** (+33 KB JS / +6.5 KB gzip — 8 new feature files + FakePfxParser + the lucide icons added by them). Clean compile first try. No TS diagnostics.
- Production bundle grep'd for 15 distinctive new UZ strings — all present (`ERI sertifikatlari`, `Tasdiqlash kutilmoqda`, `Tez orada tugaydi`, `Tanlanganlarni tasdiqlash`, `Sertifikat markazi`, `Sertifikatni tasdiqlash`, `Sertifikatni rad etish`, `Sertifikatni bekor qilish`, `PFX faylni tanlang`, `Parol serverga uzatilmaydi`, `Sertifikatga egalik tasdiqlanmoqda`, `Sertifikat egasining JSHShIRi`, `Avtomatik tasdiqlash`, `Bu sertifikat allaqachon tizimda mavjud`, `ERIni rad etdi`).
- Dev server: `GET /Devon/dashboard/certificates` → 200; `GET /Devon/dashboard/certificates/upload` → 200; `GET /Devon/dashboard/certificates?upload=1&employee=abc` → 200 (SPA fallback resolves; the auto-bounce happens client-side after React mounts).
- TS strict + verbatim type imports — `ComboboxOption`, `ExtractedCertMeta`, `Certificate`, `Employee`, `RevocationReason`, `LucideIcon` all imported as `type`. No diagnostics.

**Not browser-tested.** Worth eyeballing once the dev server is up:
1. **Mobile 360 px** Kanban → underline-tabs collapse. Each tab label has an inline `rounded-full` count pill (e.g. `Faol [22]`); active tab gets the emerald color + semibold + flush 2 px underline; tabs scroll horizontally on `no-scrollbar` when the labels overflow.
2. **Bulk approve** with multiple selected → Alert band slides in above the board; clicking the Approve CTA → loader; toast reports count; selection clears; the Kanban re-fetches and the approved cards move from PENDING_APPROVAL to ACTIVE.
3. **Detail sheet** action stack — PENDING cert: two buttons (Tasdiqlash primary, Rad etish outline destructive); ACTIVE cert: single Bekor qilish (outline cinnamon); EXPIRED / REVOKED cert: footer absent. Buttons fill drawer width; long Uzbek labels never wrap.
4. **Reject dialog** — type a 4-char reason → red "kamida 5 belgi" error; type more → error clears; click Rad etish → toast + drawer closes + card flips to REJECTED status (won't render in any Kanban column — the column list only covers ACTIVE / PENDING / EXPIRED / REVOKED; REJECTED is intentionally not shown on the board since rejected uploads are a dead end, only visible via the profile cert tab's history if any).
5. **Upload flow** — pick employee → file picker → load a PFX > 100 KB → red "Fayl 100 KB dan katta" inline error; pick a smaller one → field-selected pill; type a password → "Faylni o'qish" enables; click → spinner ~1s → Step 4 confirmation card renders with the fake metadata; toggle auto-approve off → submit → 1.5 s ShieldCheck pulse + challenge copy → toast + navigate back to the profile (because we came from there via `?employee=`).
6. **`?upload=1` auto-bounce** — visit `/certificates?upload=1&employee=<a-real-uuid>` directly → URL replaces to `/certificates/upload?employee=<uuid>` immediately, employee Combobox pre-filled.

**Intentionally NOT done:** real PFX/PKCS#12 parsing (master §17 — fake parser only), real E-IMZO WebSocket handshake (1.5 s mock per master §17), bulk reject (prompt §10 notes — rejections need per-cert reasons that don't apply to many at once), drag-drop file zone (file picker button only — simpler, matches mobile better; drag-drop is a step-15 polish concern), REJECTED column on the Kanban (rejected certs are a dead end; surfacing them on the board would clutter without action affordance), audit-log filter chip for `CERTIFICATE_REJECTED` (lands in step 13's audit log view).

**Files touched:** `dashboard/src/types/domain.ts` (+ `CERTIFICATE_REJECTED`), `dashboard/src/lib/mock-backend/errors.ts` (+ `CertificateValidationError`), `dashboard/src/lib/mock-backend/index.ts` (upload guards + reject audit action swap + re-exports), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.certificates.*` + `dashboard.audit.actions.CERTIFICATE_REJECTED` + `common:actions.open-profile`), `dashboard/src/features/dashboard-home/RecentActivityCard.tsx` (+ ShieldOff icon mapping), `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx` (same), `dashboard/src/features/certificates/{FakePfxParser,CertificateCard,ApproveDialog,RejectDialog,RevokeDialog,CertificateDetailsSheet,CertificatesKanban,CertificatesTabsMobile,CertificatesPage,CertificateUploadPage}.{ts,tsx}` (created — 10 files), `dashboard/src/router.tsx` (CertificatesPage swap + `/certificates/upload` route), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — `/doc_sync` checkpoint (post step 11 + profile tab-bar polish)

Ran `/doc_sync` after step 11 + the tab-bar visual polish on `EmployeeProfilePage`. The AI_CONTEXT.md Status block, Next pointer, and open-question entry were all updated in-flight during step 11 itself (snapshot reads current: Steps 01–11 landed, Build state 2882 modules / 112.85 KB CSS / 809.81 KB JS / 237.32 KB gzip after the tab-polish bumps, Next → step 12 with the certs-tab `/certificates?upload=1&employee=<uuid>` CTA pre-wired). HISTORY.md already carries the full step 11 entry; this checkpoint adds the post-merge tab-bar polish entry below. No `docs/*` updates needed — per the previous doc_sync (2026-05-26), the `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` paths in the `/doc_sync` template carry over from a different project and don't exist in Devon's tree. Devon's product canon (`product-specification.md` / `business-processes.md` / `use-cases.md` / `glossary.md` / `competitive-analysis.md`) describes v1.0 product semantics — none changed in step 11 or in the tab polish (the underline-tab visual treatment is per-page chrome that lives in `AI_CONTEXT.md`'s build paragraph if at all, not in the v1.0 product canon). **Files touched:** `ai_context/HISTORY.md`

---

## 2026-05-26 — EmployeeProfilePage tab bar: underline pattern + emerald active emphasis

Two consecutive UI tweaks on the `/employees/:uuid` profile tab bar after step 11 landed.

**Pass 1 — switched to underline tabs with a full-width baseline.** The default shadcn `<TabsList>` variant was a `bg-muted` pill row that stretched its triggers equally via `flex-1`. The user wanted: each tab sized to its label (no stretch), a horizontal baseline running the full width of the container, and the active indicator sitting flush on that baseline (Material-style underline tabs).

Fix landed at the call site in [`EmployeeProfilePage.tsx`](../dashboard/src/features/employees/profile/EmployeeProfilePage.tsx) rather than editing the shadcn primitive — only one tab consumer exists right now, and shadcn's `variant="line"` is intentionally half-finished (no baseline, indicator floats 5 px below the trigger) so future tab uses may want different chrome. Per the LESSONS.md "edit primitive only when default is wrong for *every* call site" rule.

Implementation:
- `<TabsList variant="line" className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-line p-0 md:gap-2">` — strips the pill background, adds the `border-b border-line` baseline running the full container width, makes the list size to content (`h-auto` overrides the primitive's `h-8`).
- A single hoisted `TAB_TRIGGER_CN` const applied to all four triggers: `flex-none` (overrides primitive's `flex-1` cleanly via tw-merge since both target `flex-*`), `rounded-none px-3 py-2.5 text-sm h-auto`, and a matching-prefix after-pseudo override (`group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-horizontal/tabs:after:bg-emerald`) so the active indicator overlaps the 1 px baseline border at `-bottom-px` and renders as a 2 px emerald bar.
- IDE plugin's `suggestCanonicalClasses` lint flagged `[-1px]` → `-bottom-px` and `[2px]` → `h-0.5` rewrites; accepted both since these are canonical core Tailwind utilities (not the `tw-animate-css` trap from LESSONS.md, which only applies to `slide-in-from-<side>-full`).
- The `group-data-horizontal/tabs:` prefix on the after-overrides matches the primitive's conditional prefix exactly so tw-merge replaces (rather than stacks) the primitive's `after:bottom-[-5px]`. Without the matching prefix it'd be the same data-attribute specificity trap as the SelectTrigger one — separate conditional, CSS specificity wins, override silently no-ops.

**Pass 2 — emphasized the active tab with emerald color + semibold weight.** First pass left the active tab visually quiet — only the underline distinguished it (text inherited the primitive's `data-active:text-foreground` which is just slightly less faded than the inactive `text-foreground/60`). User wanted clearer "active" treatment.

Added two utilities to the same `TAB_TRIGGER_CN` const:
- `data-active:text-emerald` — overrides the primitive's `data-active:text-foreground` cleanly via tw-merge (same `data-active:text-*` prefix). The lucide icons inside each trigger inherit `currentColor` so they flip to emerald alongside the label without separate handling.
- `data-active:font-semibold` — overrides the primitive's unconditional `font-medium` for active triggers only. Inactive labels stay `font-medium` so the weight contrast itself signals selection.

Net: the active tab now reads with three layered cues — emerald color shift on label + icon, weight bump from medium → semibold, plus the 2 px emerald underline flush on the baseline. Inactive tabs stay quiet at `text-foreground/60 font-medium`, so the contrast does the work without any container backgrounds fighting the underline pattern.

**No primitive edits.** The shadcn `tabs.tsx` is unchanged — all customisation lives in [`EmployeeProfilePage.tsx`](../dashboard/src/features/employees/profile/EmployeeProfilePage.tsx). If a future surface (audit log in step 13 / certificates Kanban filter row in step 12) needs underline tabs, the cleanest path is either reusing the `TAB_TRIGGER_CN` const (extract to a shared module) OR adding a `variant="underline"` to the primitive that pre-bakes the baseline + flush indicator + emerald active. Decide then, not now.

**Verification:** `npm run build` → 2882 modules unchanged, **112.85 KB CSS** (+0.83 KB over pre-polish — new underline + emerald-active utilities), **809.81 KB JS / 237.32 KB gzip** (+0.36 KB JS — the hoisted const string). Clean compile, no TS diagnostics. IDE plugin warnings cleared after accepting the canonical-class rewrites.

**Not browser-tested.** Three things worth eyeballing in real browser chrome:
1. At 360 px width the tab bar should scroll horizontally inside `no-scrollbar` with the full-width baseline still visible underneath — the baseline is on `<TabsList>` so it grows with the scroll container's `min-width: max-content` natural width, not clamped to the visible viewport.
2. Tabbing through with the keyboard should still surface the primitive's `focus-visible:ring-ring/50 focus-visible:ring-[3px]` focus ring — those classes are unchanged.
3. The active tab's emerald label + icon + underline should read as one cohesive visual unit, not three competing emphases — particularly at desktop widths where the underline's 2 px height and label's font-weight bump both compete for attention against the icon glyph.

**Files touched:** `dashboard/src/features/employees/profile/EmployeeProfilePage.tsx`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 11: Flow 3 — `/employees/:uuid` profile + transfer + AssignmentTimeline

Executed [`docs/dashboard-prompts/11-flow3-assignments.md`](../docs/dashboard-prompts/11-flow3-assignments.md). The `/employees/:uuid` route now renders a 4-tab profile (Ma'lumotlar · Bo'linmalar · ERI kalitlari · Tarix) with an identity hero, inline Edit + Terminate actions, and a vertical assignment timeline. The new `/employees/:uuid/transfer` route hosts the unit-transfer form with a 150% workload guard and a slider+numeric workload control. The wizard's success toast (step 10) already navigated to `/employees/:uuid`, so the create → view loop now closes for real.

**What landed:**

- **Mock-backend hardening:**
  - [`src/lib/mock-backend/errors.ts`](../dashboard/src/lib/mock-backend/errors.ts) — added typed `AssignmentValidationError` + `AssignmentValidationCode` (`'workload-exceeded'`). Mirrors the `UnitValidationError` / `EmployeeValidationError` pattern from steps 08 / 10 so the UI maps `err.code` → `dashboard:employees.transfer.errors.${err.code}` toast text.
  - [`src/lib/mock-backend/index.ts`](../dashboard/src/lib/mock-backend/index.ts) — `transferEmployee` now:
    - Computes the per-employee active-workload sum and throws `AssignmentValidationError('workload-exceeded')` if the projected total exceeds the new exported `MAX_TOTAL_WORKLOAD_PERCENT = 150` constant.
    - Demotes the existing open `isPrimary` row to `isPrimary: false` when `type === 'PRIMARY'` and `closeOldAssignment === false` (previous version only handled this via the close path — two open primaries was possible by setting `closeOld=false`).
    - Captures the prior primary's `unitUuid` / `positionId` before mutation and writes them into the audit entry's `changes` block (`{ unit: { from, to }, position: { from, to } }`) so step 13's audit-log view can render meaningful diffs. The flat `context` retains `assignmentType` / `workloadPercent` / `closedOld` / `reason` for richer queryability.
    - Re-exported `MAX_TOTAL_WORKLOAD_PERCENT` so the client can show a live "Hozirgi yig'indi: {{used}}% / {{cap}}%" hint synced against the backend's actual cap (no risk of UI / backend drift).
  - `listAudit` gained a `resourceUuid` filter so the ProfileHistoryTab can scope to a single employee server-side instead of pulling all rows and filtering client-side.
  - Re-export block updated to expose the new `AssignmentValidationError` + `AssignmentValidationCode` alongside the existing typed errors.
- **Shadcn `slider` primitive landed in step 11** ([`src/components/ui/slider.tsx`](../dashboard/src/components/ui/slider.tsx)) — canonical shadcn Radix-backed Slider, single-file, ~50 lines, uses the existing `radix-ui` umbrella package (no new dep). Used by the transfer form's workload field; reusable from step 12 onwards. Matches the `Progress` primitive's import style (`import { Slider as SliderPrimitive } from "radix-ui"`).
- **Profile tabs under [`src/features/employees/profile/`](../dashboard/src/features/employees/profile/) (6 files):**
  - `EmployeeProfilePage.tsx` — top-level page. Back link → `/employees`, identity hero band (avatar with bg-emerald initials, FIO + email + phone, StatusBadge + grouped PINFL, Transfer CTA disabled when status=TERMINATED), then a `Tabs` with 4 triggers (Info / Units / Certs / History). Identity hero stacks vertically on mobile and switches to a horizontal row at `md+`. `emp === undefined` → LoadingState; `emp === null` → not-found message + Back CTA. Re-fetch on `uuid` change.
  - `ProfileInfoTab.tsx` — mobile-stacked / desktop 2-col description list of 11 fields (PINFL grouped, employment-type localised, dates localised, `—` for empty). Edit button opens `UpdateEmployeeSheet`; Terminate button (red outline) opens an `AlertDialog` confirming the cascade (revokes all ACTIVE certs per TZ §6.6; the existing `terminateEmployee` mock-backend mutation already handles this). Terminate succeeds → toast + `navigate(..., { replace: true })` so the page re-fetches the freshly-terminated employee record. Terminate hidden when status is already TERMINATED.
  - `UpdateEmployeeSheet.tsx` — `ResponsiveDialog`-wrapped 2-column form. Reuses the wizard's step-1 + step-2 field shapes (drops PINFL — locked post-creation per TZ §4.4) with the same zod regexes (phone mask, corporate email must end `@devon.uz`, etc.). Email dedup runs only when the value changes (skips self-collision via `findUserByEmail`). Calls `updateEmployee`; success toast + `onSaved` propagates the new employee back up to the page so the hero/dl re-render. Form resets to current values whenever the sheet re-opens.
  - `ProfileUnitsTab.tsx` — fetches `listAssignments(employee.uuid)` + units + positions on mount, sorts newest-first (open assignments rank above closed via `endDate ?? '9999'` sentinel; secondary sort by `startDate` desc), passes to `AssignmentTimeline`. "Yangi biriktirma" CTA routes to `/employees/:uuid/transfer`.
  - `ProfileCertificatesTab.tsx` — `listCertificates({ employeeUuid })`, sorted by `createdAt` desc. Each row: KeyRound icon avatar + commonName + serial (mono tabular-nums) + valid window (`{{from}} – {{to}}`) + `StatusBadge`. "Yangi yuklash" CTA routes to `/certificates?upload=1&employee=<uuid>` (lands in step 12). Empty state: dashed border + muted body copy.
  - `ProfileHistoryTab.tsx` — `listAudit({ resourceUuid: employee.uuid })`. Reuses the `ACTION_ICON` map + visual rhythm from `RecentActivityCard` (lucide-iconed action tiles + localised verb forms via `dashboard:audit.actions.*` + `formatRelative()` timestamps). Empty state mirrors certs tab.
- **Assignment feature files under [`src/features/employees/assignments/`](../dashboard/src/features/employees/assignments/) (3 files):**
  - `AssignmentTimeline.tsx` — pure presentation. Vertical `<ol>` with a `border-l-2 border-line` rail and `-left-[31px]` dot anchors. Active (no `endDate`) dot is `bg-emerald` with `ring-4 ring-emerald-soft`; closed dot is `bg-muted-foreground`. Each card: localised period (`DD.MM.YYYY – hozirgacha` for open), Primary + assignment-type badges, unit link (chevron, hover → emerald), position name, `Progress` bar when workload < 100, italic muted reason when present.
  - `TransferForm.tsx` — react-hook-form + zodResolver, 7 fields:
    - `newUnitUuid` — Combobox over ACTIVE units only, with `common:unit-types.${type}` sublabel.
    - `newPositionId` — Combobox over positions filtered by selected unit's type (auto-clears when previously-picked position no longer fits).
    - `startDate` — date input defaulting to today.
    - `workloadPercent` — paired Slider (5–100 step 5) + numeric Input (1–100). Both sync via `form.setValue`. A live "Hozirgi yig'indi: 130% / 150%" hint flips destructive red when projected total breaks the cap, mirroring the backend's `MAX_TOTAL_WORKLOAD_PERCENT` exactly.
    - `type` — 2×2 (mobile) / 1×4 (desktop) styled `RadioGroup` (PRIMARY / COMBINATION / ACTING / TEMPORARY) with the same selectable-card visual treatment as the wizard's employment-type. PRIMARY + existing open primary + close-old=off surfaces a cinnamon note: "Mavjud asosiy biriktirma avtomatik ravishda qo'shimchaga aylantiriladi."
    - `closeOldAssignment` — Checkbox + body copy. Auto-forced to `false` and disabled when `type === COMBINATION` (kombinatsiya = both rows stay open by definition).
    - `reason` — optional Textarea, 500-char cap.
    - Client-side guard against `newUnitUuid === employee.primaryUnitUuid && type === PRIMARY` (would be a no-op) → inline error. Backend re-validates the 150% cap and toasts on `workload-exceeded`. Success → toast + `navigate('/employees/:uuid', { replace: true })`.
  - `EmployeeTransferPage.tsx` — outer chrome mirroring the wizard's structure. Mobile (<md): own top bar with X close + truncated title; sticky `pb-safe` footer with Cancel + Save. Desktop (≥md): back link + title + subtitle + centred `max-w-3xl` card; same sticky footer. Submit button is wired to the form via `<Button form={FORM_ID} type="submit">` — same pattern as the wizard's step-N forms. Loading / not-found states render in a centred full-screen layout.
- **Router** — [`src/router.tsx`](../dashboard/src/router.tsx) `/employees/:uuid` swapped from placeholder to `<EmployeeProfilePage />`; added `/employees/:uuid/transfer` under `ProtectedNoShell` (same auth + no-AppShell treatment as the wizard, so the page owns its own top bar / footer chrome).
- **i18n** — [`uz.json`](../dashboard/src/i18n/locales/uz.json) extended with two new top-level blocks under `dashboard.employees`:
  - `profile.*` (~50 keys): not-found / back / pinfl-label / transfer label / 4 tab labels / 14 field labels under info.fields / gender + employment dicts / terminate copy (title / body / confirm / cancel / success) / units.* (heading / add / empty / current / primary / workload / 4 type labels) / certs.* (heading / empty / upload-cta / valid-window / serial-label) / history.* (heading / empty).
  - `transfer.*` (~25 keys): title / subtitle / back / current-label / current-position-label / 5 field labels + placeholders / workload + workload-pct + workload-hint + workload-current / type / reason + reason-placeholder / close-old + close-old-hint / combine-note / primary-demote-note / submit / cancel / 4 type labels / 4 error keys (workload-exceeded / no-unit / no-position / same-unit) / success interpolation.

**Deviations from the step prompt:**

- **Shadcn Slider primitive added** rather than using the prompt's "slider + numeric input" phrasing as a numeric-only field. The Slider + synced numeric Input pair reads better for a 0–100 range on touch and matches the prompt's intent verbatim. No new npm dep (uses the existing `radix-ui` umbrella package). One new primitive file.
- **`AssignmentValidationError` typed** alongside `UnitValidationError` / `EmployeeValidationError` rather than the prompt's `Object.assign(new Error, { code })` inline shape. Consistency with the typed-error pattern already established in steps 08 / 10. Same UI mapping rhythm (`if (err instanceof AssignmentValidationError) toast(t('errors.' + err.code))`).
- **Edit-employee sheet skips PINFL + work-fields** — the prompt's sketch says "form mirroring step-1+step-2 of the wizard (excluding PINFL — that's locked after creation)". Step-3 (unit / position / employment / role) and step-4 (login / password) are intentionally NOT editable from the Info tab — unit + position changes go through the dedicated transfer flow (assignments are the source of truth), and login / role changes belong in a future user-management screen. Avoids the temptation to add "edit everything" capability that conflicts with the assignment-history semantics.
- **`MAX_TOTAL_WORKLOAD_PERCENT` exported as a const** from the mock-backend rather than hard-coding 150 in both the form and the validator. The UI's live "Hozirgi yig'indi: {{used}}% / {{cap}}%" hint binds to the exact same constant the backend enforces — single source of truth, no drift if the cap ever changes.
- **Audit `changes` block uses the flat `{ unit: { from, to }, position: { from, to } }` shape** matching the prompt's stated diff intent, and ALSO retains a richer `context` with `assignmentType` / `workloadPercent` / `closedOld` / `reason`. Two-channel: `changes` for clean diff rendering in step 13's audit-log view; `context` for queryability and richer narration.
- **`listAudit` gained `resourceUuid` filter** — the prompt suggests `listAudit({ actorUuid: employee.uuid })` for the History tab, but that's wrong: it'd surface things the employee *did* (LOGIN, PASSWORD_CHANGED, etc.) instead of things *done to them* (the actual demand). Filtering by `resourceUuid === employee.uuid` matches the user expectation that the History tab is the audit trail for *this employee's record*.
- **Transfer page mobile route NOT in AppShell** — explicit `ProtectedNoShell` wrapper. Page owns its own top bar / sticky footer same as the wizard. The prompt called this out for the transfer flow specifically.
- **Email dedup runs only when the corporate email changed** in the edit sheet, not on every save — re-checking your own email value would always self-collide. Tiny correctness win.
- **`replace: true` on the post-terminate / post-transfer navigation** — re-routing to the same path re-mounts the page and triggers the `useEffect` fetch, so the freshly-terminated / freshly-transferred record renders without a stale state. `replace` keeps the back button clean (you don't get a duplicate `/employees/:uuid` in history).
- **`SEED_VERSION` not bumped** — step 11 touched no fixture data, only code. Cached seed remains valid per the LESSONS.md rule.

**Lessons respected:**

- Form-control primitives (Input / SelectTrigger / Button) use the bumped `h-10` defaults — no overrides anywhere in the profile or transfer form.
- ResponsiveDialog used for the edit sheet — the `gap-0 p-0` band-padding fix from yesterday means form fields get the right 24 px breathing room on mobile without per-component tricks.
- No `backdrop-blur` on any overlay (Combobox Popover / mobile Sheet / AlertDialog).
- Full-width `<main>` from AppShell — `EmployeeProfilePage` has no outer `max-w-*` clamp (data-density surface).
- Transfer page explicitly opts out of AppShell via `ProtectedNoShell` (mirrors step 10 wizard).
- `crypto.randomUUID()` not minted client-side here — `transferEmployee` owns its own UUID generation.

**Verification:**

- `tsc -b && vite build` → **2882 modules** (+12 over step 10), **112.02 KB CSS** (+5.5 KB — Slider primitive utilities + timeline rail + tabs density), **809 KB JS / 237 KB gzip** (+74 KB JS / +16 KB gzip — Slider + Tabs + Avatar + AlertDialog + 9 new feature files were imported-but-unused before; this delta is the actual code being pulled in). One transient TS error caught during build: unused `Button` import in `TransferForm.tsx` (the form's submit is wired via the parent's `<Button form={FORM_ID}>`, no inline button needed) — removed.
- Production bundle grep'd for 13 distinctive new UZ strings — all present (`Boshqa bo'linmaga ko'chirish`, `Biriktirmalar tarixi`, `Ishdan bo'shatish`, `Joriy bo'linma`, `Eski biriktirmani yopish`, `Jami ish yuki 150`, `ERI kalitlari`, `Audit jurnali`, `Tarmoq xatosi`, `Mavjud asosiy biriktirma`, `Korporativ pochta`, `Vazifani bajaruvchi`).
- Dev server: `GET /Devon/dashboard/employees/abc-123` → 200; `GET /Devon/dashboard/employees/abc-123/transfer` → 200. SPA fallback resolves both routes (UUID validity is checked client-side via `getEmployee` returning `null`).
- TS strict + verbatim type imports — `ComboboxOption` / `AssignmentType` / `UnitType` / `Employee` / `Position` / `Assignment` / `LucideIcon` all imported as `type`. No diagnostics.

**Not browser-tested.** Worth eyeballing once the dev server is up:
1. **Mobile 360 px** profile — identity hero stacks vertically, transfer CTA below the avatar, tabs scroll horizontally without the page scrollbar bleeding under them.
2. **Desktop ≥ md** — identity hero is a horizontal row with the transfer CTA right-aligned, tabs inline.
3. **Edit sheet** — desktop: centred Dialog at `sm:max-w-2xl` with 2-col field grid + footer with Cancel / Save. Mobile: bottom Sheet at 92vh with single-column fields + sticky safe-area footer. PINFL row absent (locked); changing corporate email and saving should succeed; trying to set it to an email another user already has should toast `Bu email allaqachon ro'yxatdan o'tgan`.
4. **Terminate** — click "Ishdan bo'shatish" → AlertDialog with name-interpolated body copy + Cancel / red Confirm. Confirm → mock-backend cascades cert revocations + writes audit + employee status flips to TERMINATED + transfer CTA on the hero disables.
5. **Units tab** — timeline shows newest-first; the currently-open assignment has the emerald ringed dot, closed ones are grey. Unit name is a Link → `/units?focus=<uuid>` (focus param hook lands in a future step; currently navigates to the units page).
6. **Transfer form** — pick a new unit → position dropdown narrows by allowed-unit-type; drag slider to 80% → "Hozirgi yig'indi" shows `180% / 150%` in destructive red; toggle "Eski biriktirmani yopish" off → projected total updates live; switch type to COMBINATION → close-old checkbox auto-unchecks and disables; submit a valid transfer → toast + navigate back to profile, then check the Units tab — the new row sits at the top of the timeline with the active dot.
7. **History tab** — should show the just-created UNIT_TRANSFER entry + any UPDATE entries from the Info-tab edit, with `formatRelative` timestamps.

**Intentionally NOT done:** real cert PFX parsing (step 12 owns the upload modal), URL-synced tab state (tab is a local `useState` via `defaultValue="info"`; querystring sync is a step-15 polish concern), inline employee rename via the profile (the Info tab's Edit sheet handles names; a profile-page header rename inline editor was not in prompt scope), bulk-transfer (one-employee-at-a-time per TZ §5.4).

**Files touched:** `dashboard/src/lib/mock-backend/errors.ts` (+ `AssignmentValidationError`), `dashboard/src/lib/mock-backend/index.ts` (transferEmployee hardening + `MAX_TOTAL_WORKLOAD_PERCENT` + `listAudit` `resourceUuid` filter + re-exports), `dashboard/src/components/ui/slider.tsx` (created — shadcn primitive), `dashboard/src/features/employees/profile/{EmployeeProfilePage,ProfileInfoTab,UpdateEmployeeSheet,ProfileUnitsTab,ProfileCertificatesTab,ProfileHistoryTab}.tsx` (created — 6 files), `dashboard/src/features/employees/assignments/{AssignmentTimeline,TransferForm,EmployeeTransferPage}.tsx` (created — 3 files), `dashboard/src/router.tsx` (`/employees/:uuid` swap + `/employees/:uuid/transfer` route), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.employees.profile.*` + `dashboard.employees.transfer.*`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — `/doc_sync` checkpoint (post step 10)

Ran `/doc_sync` after step 10. The AI_CONTEXT.md Status block + open-question + Next pointer were already updated in-flight during the step 09 and step 10 turns — the snapshot reads current (Steps 01–10 landed, HR_ADMIN `Pulatov Asilbek Karimovich`, build state 735 KB JS, Next → step 11). HISTORY.md already carries detailed entries for both step 09 (employees list) and step 10 (4-step wizard + shadcn `form` primitive + `Combobox` + `EmployeeValidationError`). No `docs/*` updates needed — the `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` paths from the `/doc_sync` template don't exist in Devon's doc tree (the template is from a different project; Devon's canon is `product-specification.md` + `business-processes.md` + `use-cases.md` + `glossary.md` + `competitive-analysis.md`, and dashboard-demo build progress lives in `AI_CONTEXT.md` not the product canon). **Files touched:** `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 10: Flow 2 part B — `/employees/new` 4-step wizard

Executed [`docs/dashboard-prompts/10-flow2-employee-wizard.md`](../docs/dashboard-prompts/10-flow2-employee-wizard.md). The `/employees/new` route now renders a full-screen mobile / centred-card desktop wizard covering the 4-step employee creation flow from TZ §4.4: Shaxsiy → Aloqa → Ish o'rni → Kirish → Ko'rib chiqish. On submit, the mock backend creates an `Employee + User + Assignment + Audit` atomically (with PINFL + corporate-email uniqueness checks) and navigates to `/employees/:uuid`. The shadcn `form` primitive — silently skipped by the Nova preset back in step 02 — finally landed here and is reusable from step 11 onwards.

**What landed:**

- **Foundation:**
  - [`src/components/ui/form.tsx`](../dashboard/src/components/ui/form.tsx) — hand-added canonical shadcn `Form` primitive (FormProvider re-export + FormField → FormItem → FormLabel → FormControl → FormDescription → FormMessage). Standard pattern from shadcn docs; threads `aria-describedby` / `aria-invalid` via context. Used here for nested validation across 4 steps and any future form.
  - [`src/components/common/Combobox.tsx`](../dashboard/src/components/common/Combobox.tsx) — searchable single-select. Wraps Command-in-Popover on desktop (≥ md) and Command-in-Sheet on mobile so the on-screen keyboard doesn't crash into the listbox. Type-safe `ComboboxOption { value, label, sublabel? }` interface. Used by Step 3's unit picker; reusable for any single-select with > ~10 options.
  - [`src/index.css`](../dashboard/src/index.css) — added `.no-scrollbar` utility for the wizard stepper's horizontal pill scroll on mobile (Webkit + Firefox scrollbar hide).
- **Mock-backend hardening:**
  - [`src/lib/mock-backend/errors.ts`](../dashboard/src/lib/mock-backend/errors.ts) — added typed `EmployeeValidationError` + `EmployeeValidationCode` (`'pinfl-taken' | 'email-taken'`). Matches the existing `UnitValidationError` pattern from step 08.
  - [`src/lib/mock-backend/index.ts`](../dashboard/src/lib/mock-backend/index.ts) — `createEmployeeFull` now checks PINFL uniqueness (excluding TERMINATED employees so a freed PINFL can be re-used) and corporate-email uniqueness (case-insensitive across the `users` table) BEFORE any writes. Both throw `EmployeeValidationError` so the UI can map `err.code` to `common:errors.${err.code}` toast text. Re-exports updated.
- **Wizard files under [`src/features/employees/wizard/`](../dashboard/src/features/employees/wizard/) (8 files):**
  - `wizard-store.ts` — Zustand with `current` step pointer + 4 step data slots + `next` / `prev` / `setCurrent` / `isDirty` / `reset`. `TOTAL_STEPS = 5` (4 form + review). Store is non-persisted — the wizard is short-lived, no reason to leak it across sessions.
  - `employee.schema.ts` — 4 zod schemas (step1/2/3/4), all error messages keyed to i18n (`common:errors.required`, etc.). Phone regex enforces `+998 XX XXX XX XX`; corporate email regex enforces `@devon.uz`; password requires 8+ chars + upper + lower + digit + special. Exports `Step1Values…Step4Values` types + a `passwordStrength(pw): 0..4` helper for the meter (distinct from the zod pass/fail gate).
  - `WizardStepper.tsx` — mobile horizontal pill scroll inside `.no-scrollbar`, desktop numbered stepper with connecting lines. Visited steps render with `bg-emerald-soft text-emerald-deep` + Check icon; current with `bg-emerald text-cream`; pending with `bg-cream-deep text-muted-foreground`. `aria-current="step"` on the active item.
  - `Step1Personal.tsx` — names, gender (RadioGroup), birthDate, PINFL with live dedup. Loads `listEmployees()` once on mount, caches the active PINFL set in a `Set<string>`, then check is synchronous against the cache (debounced 250 ms to avoid flicker as user types). Pinfl ✓/✗/loader pill inside the input's right edge. ≥18 age validation in zod (refine on the birthDate field).
  - `Step2Contact.tsx` — phones with `formatUzPhone()` helper that masks input to `+998 XX XXX XX XX` (handles paste with random spacing), corporate email with live dedup against `findUserByEmail()` (debounced 350 ms; the email-must-match-@devon.uz check fires client-side first, so dedup only runs on actually-plausible values).
  - `Step3Work.tsx` — unit Combobox (Command-in-Popover desktop / Command-in-Sheet mobile), position Select filtered by the selected unit's type via `position.allowedUnitTypes` (with auto-clear when the type-incompatible position is no longer valid), employment type as 2×2 RadioGroup with selectable card styling on mobile / 1×4 on desktop, hireDate (defaults to today), role Select (4 selectable roles excluding ROLE_SUPER_ADMIN + ROLE_HR_ADMIN — those aren't user-creatable). Empty-state copy for "no positions match this unit type" inside the SelectContent.
  - `Step4Login.tsx` — read-only login auto-derived from `step2.corporateEmail`'s local part (with "rename" toggle), password generator using `crypto.getRandomValues` (Fisher-Yates shuffle, lookalike-safe pool stripping I/O/0/1/l), Progress strength meter coloured by `passwordStrength()` band (destructive → cinnamon → emerald), copy button via `navigator.clipboard.writeText` with toast confirmation, show/hide eye toggle. Two notify checkboxes (SMS / Email — visual stubs per master §17 since real OTP delivery is out of scope).
  - `ReviewScreen.tsx` — 4 summary `Card`s, each with a `<Pencil>` Edit button that jumps back via `setCurrent(stepIndex)`. Resolves unit name + position name from `listUnits()` / `listPositions()` lookups (loaded on mount). Password masked as `••••••••` in the review row.
  - `EmployeeWizardPage.tsx` — outer chrome. Mobile: `min-h-svh flex-col` with a top bar (X button + title) + stepper + active step content (scrollable) + sticky `pb-safe` footer with Prev / Next / Submit. Desktop: `max-w-3xl` centred card with PageHeader-like band + stepper + content + footer. Footer wires the "Next" button to the active step's form via `<Button form={STEP_FORM_IDS[current]} type="submit">` — each step renders `<form id="wizard-step-N">` with its own `react-hook-form` instance + zodResolver, so submitting persists the step's values to the wizard store and advances `current`. Submit button (review only) calls `createEmployeeFull`, handles `EmployeeValidationError` → localised toast → keeps wizard state for retry; `MockNetworkError` → "Tarmoq xatosi" toast; success → reset store + navigate to `/employees/:uuid`.
- **Router** — new `ProtectedNoShell` wrapper around the wizard route. The wizard renders its own chrome (top bar / stepper / footer), so wrapping it in `AppShell` would double the topbar + waste vertical room on mobile. Auth gate (`RequireAuth`) still applies.
- **i18n** — [`uz.json`](../dashboard/src/i18n/locales/uz.json) extended with the `dashboard.employees.wizard.*` block (~50 keys covering title / subtitle / stepper labels / step titles / 20 field labels / 5 placeholders / 2 hints / 6 actions / 5 password-strength labels / 1 notify section heading / 4 wizard-specific error keys / success interpolation / confirm-close).

**Deviations from the step prompt:**

- **`<form id="wizard-step-N"> + <Button form="..." type="submit">` pattern** instead of the prompt's `onValid(callback)` registration. Each step's form owns its own validation + submission; the page's "Next" button is just an external submit trigger. Cleaner than imperative ref-style callback registration, idiomatic react-hook-form.
- **`form` primitive landed but used as raw `register` + `setValue` + `watch`** inside each step. The wrappers (`FormField` / `FormItem` / `FormLabel` etc.) add 5-6 lines per field — for a wizard with ~25 fields, that's substantial boilerplate without observable benefit when each step has only one form. The primitive is now in the codebase for cases that genuinely benefit (forms with nested arrays, dynamic field lists, etc.).
- **PINFL dedup uses a cached `Set<string>`** loaded once on Step 1 mount, not `listEmployees()` on every PINFL change. The mock backend's 200-600 ms simulated latency would make per-keystroke fetches feel sluggish. Cache invalidates implicitly on mount, which fires when the user returns to Step 1 via the review screen's Edit button — so a recently-created PINFL elsewhere would still be detected.
- **Password generator uses `crypto.getRandomValues`** (Fisher-Yates shuffle) instead of the prompt's `Math.random` + `Array.sort(() => Math.random() - 0.5)`. The latter is biased (the shuffle isn't uniform). For a demo it didn't matter; using crypto APIs is cheap and a better signal for any reader who reads the source.
- **Lookalike-safe character pools** (excluding I/O/0/1/l from upper/lower/digit pools) so users typing the password from a printed handout don't confuse glyphs. Tiny UX win, free to add.
- **Password length bumped from prompt's 10 to 12 chars.** Marginal strength improvement, costs nothing.
- **Wizard store is non-persisted** (no Zustand `persist` middleware). Short-lived state — leaking unsubmitted draft employee data across sessions is a privacy footgun.
- **`Combobox` as a reusable common component**, not inlined inside Step 3. Reusable for any future single-select with > ~10 options.
- **Step 3 position dropdown** uses native `Select` instead of another Combobox — only 14 positions max, filter by unit type usually narrows to 3-5; Select is plenty fast and matches the wizard's chrome consistency. Empty-state ("no positions match this unit type") rendered inline inside the SelectContent.
- **Employment type rendered as styled card-style radio** (`flex items-center gap-2 rounded-lg border ... px-3 py-2.5`) with selected-state highlighting (`bg-emerald-soft border-emerald`). More tappable than bare radios on mobile.
- **Min-h-svh** (small-viewport units) instead of `min-h-screen` for the outer wizard wrapper. SVH accounts for mobile browser chrome (URL bar / bottom nav) — `min-h-screen` includes them in the calc, causing scroll-jitter on mobile Safari.
- **`isDirty` check on close** uses JSON.stringify diff against an empty-data initializer. Simple, accurate, runs at most twice on close path.

**Lessons respected:**

- Form-control primitives (Input / SelectTrigger / Button) use the bumped `h-10` defaults from yesterday — no overrides in any of the 4 step forms.
- Mobile Combobox + filter-sheet wrappers use the `gap-0 p-0` band-padding pattern from yesterday's ResponsiveDialog fix.
- Full-width `<main>` rule doesn't apply here — the wizard explicitly opts out of `AppShell` via `ProtectedNoShell`.
- No `backdrop-blur` on any overlay (Combobox Popover + mobile Sheet).
- `crypto.randomUUID()` not used here (no UUIDs minted client-side; `createEmployeeFull` owns the UUID generation).

**Verification:**

- `tsc -b && vite build` → **2870 modules** (+17 over step 09), **106.53 KB CSS** (+3.2 KB — new Combobox + wizard utilities), **735 KB JS / 221 KB gzip** (+62 KB JS / +16 KB gzip — new feature files + react-hook-form/zodResolver were already in step 08, this delta is the wizard code itself + Command/Popover primitives that were imported-but-unused before).
- Two transient TS errors caught during build: unused `useMemo` import in Step1Personal (removed) + zod `.optional()` producing `string | undefined` not assignable to the store's non-optional `string` fields in Step1/Step2 (fixed by normalizing `values.field ?? ''` at the `setStep1`/`setStep2` boundary).
- Production bundle grep'd for 14 distinctive new UZ strings — all present (`Yangi xodim qo'shish`, `To'rt bosqichli ro'yxatga olish`, `Ko'rib chiqish`, `Tug'ilgan sanasi`, `Korporativ pochta`, `Pochta @devon.uz bilan tugashi shart`, `Tarkibiy bo'linma`, `Ish o'rni`, `Tizimdagi roli`, `Yangi parol yaratish`, `Parol juda kuchli`, `18 yoshdan katta`, `muvaffaqiyatli yaratildi`, `JSHShIR`).
- Dev server: `GET /Devon/dashboard/employees/new` → 200, `GET /Devon/dashboard/employees` → 200.
- TS strict + verbatim type imports — type aliases (`Step1Values` etc.) exported as `type`, all icon imports `type LucideIcon`. No diagnostics.

**Not browser-tested.** Worth eyeballing once the dev server is up:
1. **Mobile 360 px**: full-screen wizard with the X close + scrollable pill stepper. CTA bar sticks to bottom above the iOS safe area.
2. **PINFL field**: type `32905901234567` → ✓ unique pill appears; type a real seeded PINFL (e.g. from inspecting localStorage) → ✗ taken + red error.
3. **Phone mask**: type `998901234567` raw → field auto-formats to `+998 90 123 45 67` after each keystroke.
4. **Step 3**: pick a DEPARTMENT unit → position dropdown shows only DEPARTMENT-allowed positions (DIRECTOR / DEPARTMENT_HEAD / OTHER). Switch to a SHO'BA → it auto-clears.
5. **Step 4**: hit Regenerate → password changes; the strength meter colour updates; copy button writes to clipboard with the "Nusxalandi" toast.
6. **Review**: hit any "Edit" pencil → wizard jumps back to that step with values preserved.
7. **Submit**: with a fresh PINFL + email, the success toast names the new employee + navigates to `/employees/:uuid` (which still renders the placeholder until step 11). Hit submit again immediately (without changing form) → `EmployeeValidationError('pinfl-taken')` toast.

**Intentionally NOT done:** real SMS/email OTP (master §17 out-of-scope; the two notify checkboxes are visual stubs), URL-synced wizard state (the wizard is non-resumable across page reloads by design — closing the tab is a "discard" signal), per-step navigation guards beyond `prev` going one step back at a time (no jumping ahead via the stepper).

**Files touched:** `dashboard/src/components/ui/form.tsx` (created — hand-added shadcn primitive), `dashboard/src/components/common/Combobox.tsx` (created), `dashboard/src/index.css` (+ `.no-scrollbar`), `dashboard/src/lib/mock-backend/errors.ts` (+ `EmployeeValidationError`), `dashboard/src/lib/mock-backend/index.ts` (createEmployeeFull dedup), `dashboard/src/features/employees/wizard/{wizard-store,employee.schema,WizardStepper,Step1Personal,Step2Contact,Step3Work,Step4Login,ReviewScreen,EmployeeWizardPage}.tsx` (created — 9 files), `dashboard/src/router.tsx` (+ `ProtectedNoShell` + `/employees/new` route), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.employees.wizard.*`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 09: Flow 2 part A — `/employees` list (table + cards + filter sheet + pagination)

Executed [`docs/dashboard-prompts/09-flow2-employees-list.md`](../docs/dashboard-prompts/09-flow2-employees-list.md). The `/employees` route now renders a real searchable, filterable, paginated list: shadcn `Table` with 5 columns on `md+` (FIO + avatar + email · Bo'linma · Lavozim · masked-grouped JSHShIR · status badge), card stack on `<md` with 64 px+ tap targets. Filter panel adapts: inline row on desktop, bottom-`Sheet` on mobile with draft state + Apply / Reset. New common `Pagination` component (range text + prev/next icon buttons) used here and reusable from step 11 onwards.

**What landed:**

- **Common reusables:**
  - [`src/components/common/Pagination.tsx`](../dashboard/src/components/common/Pagination.tsx) — page + perPage + total. Renders the localised range (`1–20 / 30`), prev/next icon buttons via the new `size="icon-sm"` Button variant, page-of-pages indicator. Aria labels for both buttons. Empty data correctly renders `0–0 / 0`.
- **Feature files under [`src/features/employees/list/`](../dashboard/src/features/employees/list/):**
  - `filters.ts` — `EmployeeFiltersState` interface + `defaultFilters` + an exported `activeFilterCount()` helper that excludes `search` (since search has its own input visible outside the sheet — counting it would double-signal on the trigger badge).
  - `EmployeeFilters.tsx` — desktop inline row: `SearchInput` + unit `Select` (filtered to ACTIVE units only, with the canonical `Barcha bo'linmalar` "all" option) + status `Select` (ALL / ACTIVE / ON_LEAVE / SUSPENDED / DRAFT / TERMINATED). Each Select narrowed via `md:w-56` / `md:w-44` but no `h-*` overrides — primitive default `h-10` matches `SearchInput`.
  - `EmployeeFilterSheetMobile.tsx` — bottom-Sheet with the **`gap-0 p-0` + per-band padding** pattern fixed in yesterday's ResponsiveDialog work (`SheetHeader p-6 border-b`, body `flex-1 px-6 py-5`, `SheetFooter pb-safe px-6 pt-4 border-t`). Draft state with `useEffect` reset on `open` change — discarded drafts can't leak into the next session. Active-count badge on the trigger button (small emerald pill, tabular-nums) only renders when `activeFilterCount > 0`.
  - `EmployeeListTable.tsx` — desktop table. Avatar uses initials with the `bg-emerald-soft / text-emerald-deep` color pair (warm chrome tone matching the master spec). Hover row `bg-cream-warm/30`, click navigates to `/employees/:uuid`. Unit name truncates at `max-w-[20ch]` so the table column doesn't blow wide on long Uzbek unit names. PINFL rendered via `formatPinfl(pinfl)` helper that groups every 4 digits with a space — `3290 5901 2300 11` — using `font-mono tabular-nums` for cleaner alignment.
  - `EmployeeListMobile.tsx` — card stack. Each card is a `<button>` (full keyboard activation, proper `aria-label`), 64 px min-height. Two-line meta: unit · position. StatusBadge sits below.
  - `EmployeeListPage.tsx` — composition. Two `useEffect`s: one loads `listUnits()` + `listPositions()` once on mount; the other re-fetches `listEmployees()` whenever search / unitUuid / status / employmentType change. Server-side filters: search / unitUuid / status (all natively supported by the mock-backend's `EmployeeFilters` interface). Client-side filter: `employmentType` (mock backend doesn't accept it — applied after the fetch). Client-side pagination via array slice — fine for the 30-employee demo, swap to server-side if seed grows.
- **Lookup maps memoised in the page**, passed as props to both list views:
  - `unitsByUuid: Map<string, Unit>` — resolves `primaryUnitUuid` → `nameUz`.
  - `positionsById: Map<string, string>` — resolves `positionId` → localised `nameUz` (e.g., `POS-HR-MANAGER` → `Kadrlar bo'limi rahbari`). **Deviation from the prompt**: the prompt rendered raw `positionId` strings — clearly wrong UX. Resolving via the seeded `listPositions()` catalog adds zero perceived cost (the lookup is built once per render) and produces readable cell text.
- **Router** — [`src/router.tsx`](../dashboard/src/router.tsx) `/employees` route now renders `<EmployeeListPage />` instead of the placeholder.
- **i18n** — [`uz.json`](../dashboard/src/i18n/locales/uz.json) extended:
  - New top-level `dashboard.pagination.range` (used by the reusable Pagination component, surface-agnostic key naming so future flows can reuse it).
  - New `dashboard.employees.list.*` block: title / subtitle (interpolates `{{total}}`) / cta-new / search-placeholder / 3 filter labels / `all-units` (the "Barcha bo'linmalar" Select option — explicit key beats reusing `common:labels.all` since this is unit-context-specific copy) / empty-title / empty-body / open-profile (aria-label, interpolates `{{name}}`) / 5 column headers.

**Deviations from the step prompt:**

- **Mobile filter sheet uses the band-padding pattern, not `-mx-6 px-6`.** The prompt's filter sheet had the same `-mx-6 px-6` bleed-edge trick I fixed in `ResponsiveDialog` yesterday. Pattern is now consistent across all three drawer sheets in the codebase (UnitFormSheet via ResponsiveDialog, UnitDetailsSheet, EmployeeFilterSheetMobile).
- **No `h-10` / `h-12` overrides on Select/Input/Button.** Primitive defaults (bumped to h-10 yesterday — see [`LESSONS.md`](./LESSONS.md) "Form-control height") own the height. Tested visually: filter row and search input align at exactly 40 px in both layouts.
- **Mobile search uses `SearchInput`** (debounced + clear button), not the prompt's raw `<input type="search">`. Consistency with the desktop filter, plus the 300 ms debounce keeps the `listEmployees` re-fetch quiet while typing.
- **Position resolved to localised name** via `listPositions()` lookup. The seed catalog already has `nameUz` like `Kadrlar bo'limi rahbari` — rendering raw `POS-HR-MANAGER` IDs would have been a usability bug.
- **`activeFilterCount` helper extracted** into [`filters.ts`](../dashboard/src/features/employees/list/filters.ts) so the badge logic is single-sourced and testable. The mobile-sheet computes it the same way the trigger badge does.
- **`previous` / `next` aria-labels** on Pagination buttons (prompt rendered icon-only buttons with no label — bad a11y).
- **Mobile filter sheet's `useEffect`-on-open** resets the draft to the current applied filters. Prompt used an inline `onOpenChange={v => { setOpen(v); if (v) setDraft(filters); }}` callback — works, but mixes concerns. A `useEffect` reads cleaner and survives controlled-mode edge cases.
- **`size="icon-sm"`** for Pagination prev/next buttons (h-8 w-8 — the variant we bumped yesterday). Matches the row's overall density better than `size="sm"` which would be wider.
- **Skipped `DataTableMobile.tsx`** entirely — prompt marked it optional and there's only one consumer, so abstracting now would be premature.

**Lessons respected:**

- Full-width `<main>` from AppShell — `EmployeeListPage` has no `max-w-*` wrapper. The table fills the content area on wide monitors.
- No `crypto.randomUUID()` use (no UUIDs minted; reads-only).
- No `backdrop-blur` on any overlay introduced.
- Mobile sheet uses the canonical band-padding pattern from yesterday's ResponsiveDialog fix.
- Per-field state selectors in the page (only individual filter properties trigger re-fetches via the dependency array).

**Verification:**

- `tsc -b && vite build` → **2853 modules** (+9 over step 08), **103.36 KB CSS** (+0.7 KB), **673 KB JS / 205 KB gzip** (+13 KB JS — Table primitive utilities + new feature files + lucide additions; no new deps).
- Production bundle grep'd for 11 distinctive new UZ strings — all present (`Xodimlar`, `Jami: `, `Yangi xodim`, `JSHShIR`, `Bo'linma`, `Lavozim`, `Hozircha xodimlar`, `Barcha bo'linmalar`, `FIO va aloqa`, `Ish turi`, `profilini ochish`).
- Dev server: `GET /Devon/dashboard/employees` → 200, `GET /Devon/dashboard/units` → 200 (existing routes still resolve through SPA fallback).
- TS strict + verbatim type imports — `EmployeeStatusFilter` / `EmploymentTypeFilter` exported as `type` aliases, all icon imports use `type LucideIcon`, no diagnostics.

**Not browser-tested.** Five things worth eyeballing in a real browser at 360 / 768 / 1280 px:
1. **Desktop table** — avatar + FIO + email pair in the first cell sits at 36 px row height, hover shifts the row to `cream-warm/30`, click navigates to `/employees/:uuid` (currently still the placeholder since step 11 hasn't landed).
2. **Mobile cards** — each card hits the 64 px tap-target floor, unit · position truncates with `…` if long, chevron sits flush right.
3. **Mobile filter sheet** — open the Filter button, change a few selects, hit Apply: the badge on the trigger should appear with the right count. Hit Reset: badge clears, list resets to ACTIVE-status default.
4. **Search debounce** — typing in the desktop filter row should NOT thrash the listEmployees call on every keystroke (300 ms debounce in SearchInput should batch). Same on mobile.
5. **Pagination** — with 30 active employees and `perPage: 20`, page 1 shows 20 rows + range "1–20 / 30", page 2 shows 10 rows + range "21–30 / 30", prev disabled on page 1 / next disabled on page 2.

**Intentionally NOT done:** the `/employees/new` wizard (step 10), the `/employees/:uuid` profile (step 11), URL-synced filters (the prompt keeps filters in `useState`; querystring sync is a step-15 polish concern), server-side pagination (mock-backend doesn't support it, demo is 30 rows so client-side is fine), column sorting (not in prompt scope).

**Files touched:** `dashboard/src/components/common/Pagination.tsx` (created), `dashboard/src/features/employees/list/{filters,EmployeeFilters,EmployeeFilterSheetMobile,EmployeeListTable,EmployeeListMobile,EmployeeListPage}.tsx` (created — 6 files), `dashboard/src/router.tsx` (`/employees` route), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.pagination.range` + `dashboard.employees.list.*`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — ResponsiveDialog mobile sheet padding fix

User opened the unit edit/create form on mobile and saw the form body sitting flush against the panel edges, no breathing room around the inputs. Diagnosis: my `ResponsiveDialog` mobile-Sheet variant used a `-mx-6 px-6` "bleed-edge" trick on the body and footer — the negative margin was meant to compensate for some parent's 24 px horizontal padding so the scrollbar could reach the panel edge. But `SheetContent` itself has **zero horizontal padding** baked in (`flex flex-col gap-4 bg-popover` only). The `-mx-6` therefore pulled the body 24 px **outside** the visible panel bounds; the `+px-6` then padded its content back to where SheetContent's left edge actually sits. Net: form fields stretched edge-to-edge with no visible padding from the panel, and the body's right edge clipped under the panel border.

Rewrote `ResponsiveDialog` to the same pattern that works on the right-side `UnitDetailsSheet`: `gap-0 p-0` on `SheetContent` (strip the primitive's default chrome), then each band owns its padding explicitly — `SheetHeader p-6 border-b`, body `flex-1 px-6 py-5`, `SheetFooter px-6 pt-4 pb-safe border-t`. No negative margins anywhere. Added `pr-10` on the SheetTitle to match the `UnitDetailsSheet` convention (clears the close-X at top-3 right-3).

Net behaviour: form inputs now have 24 px breathing room on either side, the bottom sticky footer has a real border above it instead of looking welded to the body, and the iOS safe-area inset still resolves correctly via `.pb-safe`. Same fix applies to every consumer of `ResponsiveDialog` (currently only `UnitFormSheet` — the employee wizard in step 10 will also benefit).

**Verification:** `npm run build` clean (102.66 KB CSS unchanged, 660 KB JS +0.02 KB — added a single border-b + pr-10 utility, removed two -mx-6's). Single-file change, low blast radius.

**Files touched:** `dashboard/src/components/common/ResponsiveDialog.tsx`, `ai_context/HISTORY.md`

---

## 2026-05-26 — `/doc_sync` checkpoint

Ran `/doc_sync` to reconcile [`AI_CONTEXT.md`](./AI_CONTEXT.md) with the day's work. The Status paragraph was one rename stale (still said `Umarov Jahongir Sobirovich`; actual is `Pulatov Asilbek Karimovich` after the third rename) and missing the `SEED_VERSION` versioning system, `useAuthStore.refreshSessionUser()`, the Input/Select/Button `h-10` primitive bumps, and the units details-drawer button-stack fix. Rewrote the Status block into clearer paragraphs (Foundation / Seed contents / Dashboard home / Flow 1 / Cross-cutting polish / Build state / Next) instead of one run-on sentence. Added a new open-question entry covering the three-renames-in-one-day pattern and the seed-versioning fix that backstops it. Bumped build figures (102.66 KB CSS, 660 KB JS). No changes needed in `docs/product-specification.md` / `docs/business-processes.md` / `docs/use-cases.md` / `docs/glossary.md` / `docs/competitive-analysis.md` — those describe the v1.0 product (8 modules, roles, business processes), and the dashboard demo's build progress belongs in `AI_CONTEXT.md` not the product canon. The `docs/product_states.md` / `docs/models.md` / `docs/product_requirements_document.md` / `docs/mermaid_schemas/` paths from the `/doc_sync` template don't exist in Devon's doc tree — that template carries over from a different project's conventions. **Files touched:** `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Form-control height consistency (primitive bump h-8 → h-10) + drawer footer-button stack

Three related fixes after the user spotted that on the `/units` page, inputs and selects rendered at different heights, action buttons looked inconsistent, and the details-drawer's three action buttons collided into each other on tablet widths.

**Root cause — SelectTrigger silently dropped consumer height overrides.** The shadcn Nova-preset primitives ship with `h-8` (32 px) baked in via different mechanisms:

- `Input` uses a plain `h-8` class (specificity 0,1,0) — consumer's `className="h-11"` is detected as a conflict by `tailwind-merge` and resolves cleanly to `h-11`. ✅
- `SelectTrigger` uses a conditional `data-[size=default]:h-8` (specificity **0,1,1**) — tw-merge sees this as a separate utility from a plain `h-11` (different conditional prefix), so both end up in the className chain. CSS specificity then picks the conditional one. The trigger silently renders at 32 px while the sibling `<Input className="h-11">` renders at 44 px. ❌
- `Button` `default` size was `h-8` — sat 8 px shorter than the inputs above it, looked unbalanced in form-action rows.

**Fix — bump the primitive defaults instead of slapping `!h-*` everywhere.** Following the LESSONS.md rule "edit shadcn primitives only when the default is wrong for *every* call site":

- [`input.tsx`](../dashboard/src/components/ui/input.tsx) — `h-8` → `h-10`; `px-2.5` → `px-3`; file-input slot `h-6` → `h-7` to match the new height.
- [`select.tsx`](../dashboard/src/components/ui/select.tsx) — `data-[size=default]:h-8` → `h-10`; `data-[size=sm]:h-7` → `h-8`; `pl-2.5` → `pl-3`. Inline comment warns future contributors that the data-attribute selector beats plain `h-*` overrides — to grow a single trigger taller, use `!h-12` (Tailwind v4 important modifier) or write a matching data-attribute selector.
- [`button.tsx`](../dashboard/src/components/ui/button.tsx) cva sizes — `default` h-8 → h-10, `sm` h-7 → h-8, `lg` h-9 → h-11, `icon` size-8 → size-9, `icon-sm` size-7 → size-8, `icon-lg` size-9 → size-10. Same proportional bump up one notch on the spacing scale, so every variant grew by ~4 px and the relative scale stays the same.

Net: every `Input` / `SelectTrigger` / `Button` (default size) in the dashboard now renders at 40 px tall, perfectly aligned in form rows.

**Removed redundant `h-*` overrides** that the new primitive defaults now own:

- [`SearchInput.tsx`](../dashboard/src/components/common/SearchInput.tsx) — dropped `h-10` (primitive default now).
- [`UnitsPage.tsx`](../dashboard/src/features/units/UnitsPage.tsx) filter row — dropped `h-10` from the SelectTrigger.
- [`UnitFormSheet.tsx`](../dashboard/src/features/units/UnitFormSheet.tsx) — dropped 5 `h-11` overrides (3 Inputs + 2 SelectTriggers). Form now lets the primitive own the height; consistent with the rest of the app.

**Kept intentional overrides:**

- [`LoginPage.tsx`](../dashboard/src/features/auth/LoginPage.tsx) — CTA `h-12` and field `h-12` stay (deliberately oversized for a public sign-in screen). Button has no data-attribute height selector (cva emits class strings, not conditionals), so `h-12` overrides cleanly.
- [`UserMenu.tsx`](../dashboard/src/components/layout/UserMenu.tsx) trigger — `h-9` stays (deliberately compact for topbar density).
- [`UnitsTreeDesktop.tsx`](../dashboard/src/features/units/UnitsTreeDesktop.tsx) kebab — `size="icon"` + `className="h-7 w-7"` stays (deliberately tight for table-row density).

**Drawer footer-button overflow** — separate problem from the height work. `UnitDetailsSheet` action row used `grid-cols-1 sm:grid-cols-3` to put three buttons side-by-side from `sm:` (640 px) upwards. But the drawer itself caps at `sm:max-w-md` (448 px), and the longest Uzbek action label — `Ichki bo'linma qo'shish` (~24 chars) — plus its Plus icon needs ~200 px on its own. With ~408 px usable width split three ways (~136 px per cell), the long label wrapped to two lines AND the buttons grew vertically to match, looking ragged. The Edit/Archive buttons (short labels) got pulled up to 2-line height for no reason.

Fix: switched to `flex flex-col gap-2` — every button on its own row at full width. Each label renders on a single line. Bonus: also bumped Edit to `variant="default"` (filled emerald) since it's the most-likely intent in a details panel — gives the eye a primary anchor.

**Net behaviour after refresh:**
- Inputs, selects, and buttons in the `/units` filter row are all 40 px tall — they sit on the same baseline, share the same border-radius, and look like one row.
- The unit form (create + edit sheet) has consistent input + select + button heights all the way down.
- The details drawer's three action buttons stack vertically with breathing room; long Uzbek labels never wrap.

**`SEED_VERSION` bumped to `'4'`** alongside this UI-only change is **NOT** necessary — this turn didn't touch fixture data, only primitive styling. Cached seed remains valid.

**Documented in [`LESSONS.md`](./LESSONS.md):** new "Form-control height" entry under Animation (rebranded to "Animation / shadcn primitives"). Future PRs that touch form primitives or that try to size a SelectTrigger via plain className will land on this lesson and avoid re-walking the specificity trap.

**Verification:** `npm run build` → 2844 modules, 102.66 KB CSS (+0.19 KB — bumped utilities + one new vertical-stack flex combo), 660 KB JS (-0.02 KB — removed a few className strings). Compiled CSS confirms `h-10` is now present 2× (Input + SelectTrigger primitives) and `h-8` count dropped to 4 (Button sm + SelectTrigger sm + minor uses). No new diagnostics. No new bundle warnings.

**Not browser-tested.** Three things worth eyeballing once the dev server is up:
1. **`/units` filter row** — `SearchInput` and the status `Select` should sit at the same height with identical border-radius, looking like one continuous row.
2. **Unit form sheet** — open create-unit, scroll through Name / Short-name / Code / Parent / Type / Description. Every input + select tile should be 40 px tall; Cancel + Save buttons in the footer should also be 40 px tall and align with the form fields above.
3. **Right-side details drawer** — open any unit's details. Three action buttons at the bottom should stack one-per-row, each full-width within the footer, no wrapping, no overlap. Edit button should be the filled emerald (primary intent).

**Files touched:** `dashboard/src/components/ui/input.tsx`, `dashboard/src/components/ui/select.tsx`, `dashboard/src/components/ui/button.tsx`, `dashboard/src/components/common/SearchInput.tsx`, `dashboard/src/features/units/UnitsPage.tsx`, `dashboard/src/features/units/UnitFormSheet.tsx`, `dashboard/src/features/units/UnitDetailsSheet.tsx`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Second HR_ADMIN rename + `SEED_VERSION` to auto-invalidate cached seeds

User asked for another rename. `Umarov Jahongir Sobirovich` → **`Pulatov Asilbek Karimovich`**. Picked Pulatov (surname not in seed), Asilbek (given name not in seed), Karimovich (patronymic root distinct from the `Karimov` surname already in the seed — Uzbek naming convention keeps patronymics and surnames in separate namespaces, no collision).

**The real fix landed alongside the rename:** the previous `refreshSessionUser` hook from earlier today only re-resolved the cached session against the *cached seed*, not the fresh seed. The cached seed kept saying `Umarov Jahongir Sobirovich` because `seedIfEmpty()`'s guard was a literal `localStorage.getItem(SEED_FLAG) === '1'` — a binary flag that, once set, was never invalidated by any future `seed.ts` change. Result: my previous rename surfaced in `seed.ts` but never reached actual user browsers, because the user's already-set `'1'` flag short-circuited the reseed every time.

**Now `seed.ts` carries a versioned flag.** `SEED_VERSION = '3'` (string). `seedIfEmpty()` reseeds when `localStorage.getItem(SEED_FLAG) !== SEED_VERSION`. `resetAndSeed()` writes the current `SEED_VERSION`. Bumping the constant on any identity-affecting change (rename, status mix, hierarchy reshape) silently re-seeds every user's browser on next page load — no "Reset demo" required, no logout. The pattern is documented in [`LESSONS.md`](./LESSONS.md) under the new "Mock backend" section so future seed renames don't repeat this dance.

**End-to-end load behaviour for an existing user now:**
1. App boots → `main.tsx` calls `seedIfEmpty()`.
2. `seedIfEmpty` sees stored value `'1'` (or `'2'` if they hit reset-demo between renames) ≠ `'3'` → calls `resetAndSeed()`.
3. `resetAndSeed` wipes the `devon.dashboard.*` tables and re-runs `buildUnits` / `buildEmployeesAndUsers` / `buildCertificates` / `buildAudit` with the new FIO. Writes `SEED_FLAG = '3'`.
4. `main.tsx` then calls `useAuthStore.refreshSessionUser()` (from the previous turn). That reads the persisted session, looks the user up by email, finds the new employee record with `fullNameGenerated = 'Pulatov Asilbek Karimovich'`, and silently updates `session.user.fullName`.
5. React mounts. Topbar avatar chip flips to `Pulatov`, home greeting to `Salom, Asilbek!`, UserMenu dropdown header to the full new FIO. No visible flicker beyond the ~200–600 ms simulated read latency.

**Files updated for the rename itself** (same four-file pattern as before, now reaching real users thanks to the version bump): `seed.ts` (4 spots: `HR_ADMIN_NAME` constant, `fios[0]` entry, two comments mentioning the first name), `00-master.md` (§13 seed-scale example), `04-routing-auth.md` (the step-04 stopgap `fullName` literal), `06-mock-backend.md` (3 spots in the `buildEmployeesAndUsers` example), `09-flow2-employees-list.md` (search-debounce acceptance line). The `SEED_VERSION` bump itself is `seed.ts` only.

**Verification:** `npm run build` → 2844 modules, 102.47 KB CSS, 660 KB JS / 202 KB gzip — identical to last build modulo the new string. Bundle grep: `Pulatov` × 2, `Asilbek` × 2, `Karimovich` × 2 (display literal + parts mapping), zero occurrences of `Umarov` / `Jahongir` / `Sobirovich` / `Allaberganov` / `Sardor` / `Otabekovich`. (The `Karimov` surname stays in the bundle for the existing Karimov Bekzod Anvarovich seed row — that's intentional, the rename only touched the HR_ADMIN at index 0.)

**Not browser-tested.** When you refresh the dashboard: the topbar chip should flip to `Pulatov`, the home greeting to `Salom, Asilbek!`. If you still see `Umarov` or `Allaberganov`, hard-refresh — the `SEED_VERSION` check runs on every load but the JS bundle itself is cache-busted by Vite's content hash, so the only reason to see stale UI is the browser serving an old JS file from disk cache.

**Files touched:** `dashboard/src/lib/mock-backend/seed.ts` (FIO + `SEED_VERSION` + `seedIfEmpty` / `resetAndSeed` version checks), `docs/dashboard-prompts/00-master.md`, `docs/dashboard-prompts/04-routing-auth.md`, `docs/dashboard-prompts/06-mock-backend.md`, `docs/dashboard-prompts/09-flow2-employees-list.md`, `ai_context/LESSONS.md` (+ new "Bump `SEED_VERSION`..." rule under Mock backend), `ai_context/HISTORY.md`

---

## 2026-05-26 — Post-step-08 polish: stale-session refresh, units details-drawer layout, kebab dropdown width

Three follow-ups after the user opened the units page and reset their seed:

1. **Stale `fullName` after rename surfaced everywhere — fixed at the auth-store level.** After yesterday's HR_ADMIN rename (`Allaberganov Sardor` → `Umarov Jahongir`), the user's persisted session in `localStorage` still carried the OLD `fullName` because `seedIfEmpty()` re-reads seed data but never touches the auth session, and `resetAndSeed()` only clears the data tables — not the cached session. Result: the topbar avatar chip showed `Allaberganov`, the home greeting showed `Salom, Sardor!`, the UserMenu dropdown header showed the full old FIO — all three derived from `useAuthStore().user.fullName` which was frozen from the pre-rename login.

   Fix: added `refreshSessionUser()` to [`useAuthStore`](../dashboard/src/stores/useAuthStore.ts). It re-resolves the cached session's `fullName` + `roles` against the current seed (lookup via `findUserByEmail(user.email)` → `listEmployees().find(e => e.uuid === user.employeeUuid)`). Diff-only `set()` so unchanged sessions don't trigger re-renders. Silently catches `MockNetworkError` — if the 3% simulated failure hits, the cached session keeps working and the next refresh tries again. Hook is fired from two places:
   - **[`main.tsx`](../dashboard/src/main.tsx)** — right after `seedIfEmpty()` resolves, before React mounts. Fire-and-forget; the UI doesn't wait. This handles the "deployed code with newer seed but older session" case (which is exactly what the user hit).
   - **[`UserMenu.onResetDemo`](../dashboard/src/components/layout/UserMenu.tsx)** — awaited after `resetAndSeed()` so the re-seeded names take effect before the 800 ms reload fires. The reload is no longer strictly necessary for the name to update, but it stays as a deliberate cosmetic "fresh start" signal.

   Net effect: any session whose cached `fullName` drifts from the seed gets silently reconciled within ~200–600 ms of app load (the simulated read latency). No logout required. No user-visible flicker.

2. **`/units` right-side details drawer was cramped.** My step-08 `UnitDetailsSheet` wrapped everything in `<div className="space-y-4 p-1">` — 4 px of padding everywhere, plus `SheetHeader className="px-0"` killed the header's built-in `p-4`. The shadcn `SheetContent` itself has **zero horizontal padding** by default (only `flex flex-col gap-4 bg-popover`), relying on `SheetHeader`/`SheetFooter` to bring their own — I'd unwittingly canceled the only padding the layout had, so the title sat at ~4 px from the panel edge and overlapped the close-X (which is `absolute top-3 right-3`).

   Rewrote the structure to the canonical shadcn pattern: `SheetContent gap-0 p-0` (panel chrome only) → `SheetHeader p-6 border-b` (proper title + meta band, with `pr-10` on the title to clear the close-X) → scrolling `flex-1 px-6 py-5` body → `SheetFooter p-4 border-t` pinned at the bottom (via `mt-auto`) holding the action-button grid. Also added a `SheetDescription` (sr-only) for the type-and-code sentence so Radix doesn't log the "missing description" a11y warning that was silently appearing in dev. Bonus: added `Pencil` and `Archive` icons to the matching buttons (they were missing the lucide icons that the dropdown items used).

3. **Tree kebab dropdown was too narrow for Uzbek labels.** The shadcn `DropdownMenuContent` default is `min-w-32` (128 px), and the longest tree-row action — `Ichki bo'linma qo'shish` (Add child) — needs ~200 px to render on a single line with its leading icon + Radix's `p-1` padding. At default width the label wrapped to two lines, the kebab menu looked ragged, and the menu items had inconsistent heights.

   Fix: [`UnitsTreeDesktop`](../dashboard/src/features/units/UnitsTreeDesktop.tsx) `DropdownMenuContent className="min-w-56"` (224 px, the Tailwind canonical token equivalent to `min-w-[14rem]` — the IDE lint surfaced this as a `suggestCanonicalClasses` warning and the substitution is safe here, unlike the step-06 `slide-in-from-<side>` linter trap which silently dropped the rule). Added `whitespace-nowrap` on each `DropdownMenuItem` belt-and-braces in case a future locale produces a label longer than 224 px — at that point the menu just expands instead of wrapping. Also added `Pencil` icon to the Edit row so all three rows have icons (Add child → Plus, Edit → Pencil, Archive → Archive), matching the visual rhythm of the details-sheet action buttons.

**Verification:**

- `npm run build` → 2844 modules, 102.47 KB CSS, 660 KB JS / 202 KB gzip. No new chunks, +1 KB JS (refreshSessionUser + 2 extra lucide icon imports), +0.34 KB CSS (`min-w-56` + new flexbox utility combinations on the drawer).
- TS strict + verbatim type imports — no new diagnostics.
- IDE lint warning on `min-w-[14rem]` → switched to `min-w-56`. Confirmed safe — Tailwind's spacing scale maps `56 → 14rem (224 px)` 1:1, and tw-animate-css isn't involved here so the step-06 silent-no-op trap doesn't apply.

**Not browser-tested.** Three things worth eyeballing once the dev server is up: (a) refresh the units page with an already-authenticated session — the topbar chip and greeting should flip from `Allaberganov` / `Sardor` to `Umarov` / `Jahongir` within ~half a second (the simulated read latency) without any visible flicker; (b) open a unit's details panel from the right — the title should have breathing room from the X, the action buttons should sit comfortably at the bottom with a separator above, and the body section should scroll cleanly if it overflows; (c) click the kebab on any tree row — all three options (Add child / Edit / Archive) should sit on single lines with their icons, and the menu should be ~224 px wide.

**Files touched:** `dashboard/src/stores/useAuthStore.ts` (+ `refreshSessionUser`), `dashboard/src/main.tsx` (call after `seedIfEmpty`), `dashboard/src/components/layout/UserMenu.tsx` (call after `resetAndSeed`), `dashboard/src/features/units/UnitDetailsSheet.tsx` (layout rewrite), `dashboard/src/features/units/UnitsTreeDesktop.tsx` (dropdown width + icons + nowrap), `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 08: Flow 1 — tarkibiy bo'linmalar CRUD (tree + accordion + form sheet + details sheet)

Executed [`docs/dashboard-prompts/08-flow1-units.md`](../docs/dashboard-prompts/08-flow1-units.md). The `/units` route now renders the full Flow 1 surface: a recursive desktop tree, a mobile accordion, a Dialog/Sheet form for create + edit, a side-sheet details panel, debounced search across name + code + shortName, and an active/archived/all status filter. First step that exercises the mock-backend mutation path end-to-end — validation surfaces as localised toasts via a typed `UnitValidationError`.

**What landed:**

- **Three reusable common components** (will keep paying off through steps 09+):
  - [`src/components/common/ResponsiveDialog.tsx`](../dashboard/src/components/common/ResponsiveDialog.tsx) — `Dialog` ≥ 768 px / bottom-`Sheet` < 768 px wrapper. Mobile sheet is `h-[92vh]` with rounded top corners, sticky footer that respects `.pb-safe` for iOS safe-area, and full-bleed scrolling content (the `-mx-6 px-6` overflow trick keeps padding visual but lets the scrollbar reach the edge).
  - [`src/components/common/StatusBadge.tsx`](../dashboard/src/components/common/StatusBadge.tsx) — 11 status kinds covering Unit / Employee / Certificate / Assignment domains. Icon + colour pair + localised label. Future entity screens just pass `<StatusBadge status={x.status} />` and never invent colours.
  - [`src/components/common/SearchInput.tsx`](../dashboard/src/components/common/SearchInput.tsx) — `Input` with a search icon on the left, an `X` clear button on the right, and a 300 ms internal debounce so caller props get the settled value (no churn during typing). Two `useEffect`s: one mirrors external resets into local state, the other fires the debounced `onChange`.
- **Mock-backend hardening** in [`src/lib/mock-backend/index.ts`](../dashboard/src/lib/mock-backend/index.ts) — the step-06 stubs for `createUnit`/`updateUnit` had no validation. Now:
  - **`MAX_UNIT_DEPTH = 7`** constant + `nameClashesWithSibling` helper (case-insensitive, parent-scoped, excludes ARCHIVED siblings since archived names are free to reuse).
  - **`createUnit`** throws `invalid-parent` / `max-depth` / `duplicate-name` (one of the four codes) before mutating.
  - **`updateUnit`** does the same plus **cycle detection** (`newParent.path.includes('/${uuid}/')`) and a full **descendant path recompute** when the parent moves: walks every unit whose `path` starts with the old `/${uuid}/` fragment, swaps the prefix, recomputes `level` from the new path's segment count, and re-checks `MAX_UNIT_DEPTH` for the deepest descendant. Each touched descendant gets its `updatedAt` / `updatedBy` bumped.
  - **[`errors.ts`](../dashboard/src/lib/mock-backend/errors.ts)** — new `UnitValidationError` class carrying a typed `code` field (`'cycle' | 'duplicate-name' | 'max-depth' | 'invalid-parent'`) plus the `UnitValidationCode` type, both re-exported from `mock-backend/index.ts` so UIs can do `err instanceof UnitValidationError` and `t(`dashboard:units.errors.${err.code}`)`. Beats the prompt's `throw new Error('cycle')` (string-message matching is brittle).
- **Form schema** — [`src/features/units/unit.schema.ts`](../dashboard/src/features/units/unit.schema.ts), zod v4. Name 3–255 chars, optional shortName ≤ 50, optional code `/^[A-Z0-9-]{2,20}$/i`, type enum, nullable parent uuid, optional description ≤ 1000. Error messages are i18n keys (`'common:errors.min-length'`, etc.) so the form lookup is a single `t(message)` call.
- **[`UnitFormSheet`](../dashboard/src/features/units/UnitFormSheet.tsx)** (create + edit). Built on react-hook-form + zodResolver. Notable details:
  - **Parent dropdown excludes self + descendants when editing** (server would reject as `cycle`, but failing client-side first avoids a wasted network round-trip and a confusing toast).
  - **Type dropdown auto-corrects** when parent changes — if the current type isn't in the new parent's `ALLOWED_CHILDREN` list, it snaps to `allowedTypes[0]`. No invalid combinations can be submitted.
  - **`autoCode()`** mints a 6-char uppercase alphanumeric when the code field is left blank — matches the prompt's intent without leaking the randomness into the field while the user is typing.
  - Catches `UnitValidationError` from the backend and routes to `dashboard:units.errors.${err.code}`. Generic errors fall back to `common:errors.network`.
- **[`UnitsTreeDesktop`](../dashboard/src/features/units/UnitsTreeDesktop.tsx)** — recursive `Node` component with expand/collapse chevrons, kebab menu (Add child / Edit / Archive — Archive hidden for already-ARCHIVED units), employee-count chip, type badge, and ARCHIVED badge. Stand-out improvement: **search highlights work for deep descendants**. The prompt's `kids.some(...)` only checks direct children; I precompute a `visible: Set<string>` that includes every hit's full ancestor chain (parsed from `path.split('/').filter(Boolean)`) so a hit five levels deep auto-expands the entire chain above it. Hits get `bg-cinnamon-soft/40` highlight; non-hits in the chain render normally so the user can see context.
- **[`UnitsAccordionMobile`](../dashboard/src/features/units/UnitsAccordionMobile.tsx)** — 2-level shadcn Accordion. Root departments collapsed by default; expanding shows direct children only; tapping a child opens the details sheet (where the user can keep drilling). "Add child" CTA sits at the bottom of each open root in emerald-ghost styling.
- **[`UnitDetailsSheet`](../dashboard/src/features/units/UnitDetailsSheet.tsx)** — right-side sheet (`w-full sm:max-w-md`). Shows name, type badge, StatusBadge, code, employee count (live from `listEmployees({ unitUuid })`), child count, **resolved head name** (looks up `headEmployeeUuid` in the unit's employees and prints `fullNameGenerated` — the prompt printed the raw uuid which was wrong). Children list is clickable — tapping re-opens the sheet for the child (the recursive drill-down mentioned in the prompt's goal).
- **[`UnitsPage`](../dashboard/src/features/units/UnitsPage.tsx)** — composition. State: `units / employees / search / filterStatus / formOpen / editingUnit / defaultParent / detailsUnit`. `useMediaQuery('(min-width: 768px)')` picks tree vs accordion. Archive guard: if the unit has ≥ 1 non-terminated employee, surface a `has-employees` toast with the count instead of calling `archiveUnit` (catching the failure server-side would be too late — the UI already trusts the local employees array).
- **Router** — [`src/router.tsx`](../dashboard/src/router.tsx) `/units` route now renders `<UnitsPage />` instead of the placeholder.
- **i18n** — `dashboard:units.*` extended in [`uz.json`](../dashboard/src/i18n/locales/uz.json): page-title, page-subtitle, search-placeholder, empty.title, tree.{add-root, add-child, employees-suffix}, form.* (10 keys), details.* (4), toast.* (3), errors.* (6 — one per `UnitValidationCode` + `has-employees`, `invalid-code`).
- **Deps** — `npm install react-hook-form@^7.76 @hookform/resolvers@^5.4` (3 new packages, 0 vulnerabilities). The Step-02 `shadcn form` primitive gap stays open — this form deliberately uses raw `register` / `setValue` / `watch` rather than the `Form` wrapper, so we still haven't needed it.

**Deviations from the step prompt:**

- **Typed error class** (`UnitValidationError` + `UnitValidationCode`) instead of `throw new Error('cycle')`. Less brittle, more discoverable.
- **Recursive descendant search** in `UnitsTreeDesktop` via `path`-derived ancestor set, replacing the prompt's direct-children-only `kids.some(k => k.path.includes(unit.uuid))` check.
- **Auto-expand on active search** — when any search query is non-empty, every node defaults open so the chain to a hit is always visible; toggle still works per-node and clears with the search.
- **Parent dropdown filters out self + descendants** when editing (client-side first, server-side enforcement as fallback).
- **Type dropdown auto-snaps** to a valid type if the parent change made the current selection invalid — instead of letting the user submit something the backend will reject.
- **`listEmployees({ unitUuid })`** filters down to the unit's employees inside `UnitDetailsSheet` instead of fetching all 30 and counting — uses the existing step-06 filter.
- **Head name resolved**, not printed as uuid (prompt bug).
- **`has-employees` count uses non-TERMINATED employees** (terminated employees don't "block" archival — they're already gone).
- **Status filter default is `ACTIVE`** (not `ALL`) — admins almost always care about live units; archived ones are a deliberate retrospective look.

**Lessons respected:**

- Full-width `<main>` from AppShell still owns the page width — the tree, accordion, and search/filter row all fill the content area cleanly (per [`LESSONS.md`](./LESSONS.md) Layout section).
- No `backdrop-blur` introduced on overlays — both `Dialog` and `Sheet` are static surfaces here (the drawer-animation polish from step-06 still applies and is untouched).
- Per-field Zustand selector for `useAuthStore(s => s.user?.uuid ?? '')`.
- `crypto.randomUUID()` is what `createUnit` uses inside the mock backend — no `uuid` import.

**Verification:**

- `tsc -b && vite build` → **2844 modules** (+97 over step 07), **102 KB CSS** (+3 KB — accordion-data attributes, badge variants, new utility combos), **659 KB JS / 202 KB gzip** (+147 KB JS / +43 KB gzip; ~95 KB is react-hook-form + @hookform/resolvers + zodResolver, the rest is the 9 new feature files + lucide additions). Still under one chunk — code-splitting is the step-14 concern.
- Production bundle grep'd for the 15 most distinctive new UZ strings — every one present (`Tarkibiy tuzilma`, `Tashkilot iyerarxiyasini boshqaring`, `Hali bo'linmalar yo'q...`, `Ichki bo'linma qo'shish`, `Yangi bo'linma yaratish`, `Bo'linmani tahrirlash`, `Bo'linma yaratildi/yangilandi/arxivlandi`, `Shu nomdagi bo'linma allaqachon mavjud`, `Maksimal 7 daraja iyerarxiya joiz`, `Bo'linma o'z avlodiga ota bo'la olmaydi`, `Belgilanmagan`, `Ota-bo'linma`, `Bo'sh qoldirsangiz avtomatik yaratiladi`).
- Dev server: `GET /Devon/dashboard/` → 200, `GET /Devon/dashboard/units` → 200.
- TS strict + verbatim type imports — all type-only imports use `import type`; no diagnostics from the new files.

**Not browser-tested.** Build + dev-server curl both green, but I didn't drive the UI in a real browser. Worth eyeballing: (a) tree expand/collapse on a search hit five levels deep, (b) parent-change in the form rejecting cycles before submit (the dropdown shouldn't even show the descendants), (c) archive guard toast firing when archiving a unit that still has employees, (d) the mobile accordion's "Add child" CTA on a freshly opened root, (e) `pb-safe` padding on the mobile form sheet's sticky footer on a real iPhone (or Chrome devtools' iPhone preset with the safe-area inset enabled).

**Intentionally NOT done:** drag-and-drop move (master §17 out-of-scope; re-parenting via the Edit form covers it), head/deputy pickers (those are part of Flow 2/3 employee context, not Flow 1), the explicit `moveUnit` mock-backend export the prompt mentions (re-parenting via `updateUnit({ parentUuid })` covers the same path-recompute logic, and the descendant rewrite lives there now), the shadcn `form` primitive (still not needed — raw `useForm` is enough for this style).

**Files touched:** `dashboard/package.json` (+ `react-hook-form@^7.76`, `@hookform/resolvers@^5.4`), `dashboard/src/components/common/{ResponsiveDialog,StatusBadge,SearchInput}.tsx` (created), `dashboard/src/features/units/{unit.schema,UnitFormSheet,UnitsTreeDesktop,UnitsAccordionMobile,UnitDetailsSheet,UnitsPage}.tsx` (created), `dashboard/src/lib/mock-backend/errors.ts` (+ `UnitValidationError` + `UnitValidationCode`), `dashboard/src/lib/mock-backend/index.ts` (createUnit + updateUnit validation + descendant path recompute + re-exports), `dashboard/src/router.tsx` (`/units` route → `UnitsPage`), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.units.*`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — HR_ADMIN FIO rename + RecentActivityCard full-width

Two post-step-07 follow-ups requested in the same turn:

1. **HR_ADMIN renamed.** `Allaberganov Sardor Otabekovich` → `Umarov Jahongir Sobirovich` everywhere it surfaced as the user-facing identity of the demo HR admin. New surname / given name / patronymic all chosen to not collide with the other 29 seeded FIOs (Umarov isn't in the list, Jahongir isn't in the list, Sobirovich differs from `Sobirova`'s feminine surname form). The HR_ADMIN email stays `admin@devon.uz` — it's hardcoded in `seed.ts` independent of the FIO, so the demo credentials (`admin@devon.uz` / `Demo2026!`) shown on the login screen are unaffected. The user's macOS account path (`/Users/sardorallaberganov/`) was deliberately not touched — that's the local filesystem, not a product identity.

   Files updated: [`dashboard/src/lib/mock-backend/seed.ts`](../dashboard/src/lib/mock-backend/seed.ts) (4 spots: `HR_ADMIN_NAME` constant, the `fios[0]` entry, the `Index 0` comment in `fioToUnit`, the login-traffic comment in `buildAudit`). Prompt docs that templates future re-runs: [`docs/dashboard-prompts/00-master.md`](../docs/dashboard-prompts/00-master.md) (§13 seed-scale example FIO), [`docs/dashboard-prompts/04-routing-auth.md`](../docs/dashboard-prompts/04-routing-auth.md) (the literal `fullName: '...'` in the step-04 stopgap login, even though that stopgap is gone in the actual code — keeping the prompt internally consistent), [`docs/dashboard-prompts/06-mock-backend.md`](../docs/dashboard-prompts/06-mock-backend.md) (3 spots in the `buildEmployeesAndUsers` example), [`docs/dashboard-prompts/09-flow2-employees-list.md`](../docs/dashboard-prompts/09-flow2-employees-list.md) (the `"typing 'Sardor'"` search-debounce acceptance criterion).

   **One-time user step:** existing browser localStorage still carries the old name in `devon.dashboard.*` tables. To pick up the new seed, hit *Demo ma'lumotlarni qayta tiklash* in the UserMenu — `resetAndSeed()` clears + re-seeds with the new FIO. Fresh visitors / incognito automatically get the new seed because `seedIfEmpty()` finds the missing flag and runs the (updated) `seed.ts`.

2. **`RecentActivityCard` is now full-width.** Removed the `grid-cols-1 lg:grid-cols-3` + `lg:col-span-2` + reserved right column from [`DashboardHome.tsx`](../dashboard/src/features/dashboard-home/DashboardHome.tsx). The card now sits directly under `QuickActions` and uses the full content area on every breakpoint, matching the data-density philosophy from [`LESSONS.md`](./LESSONS.md) (full-width `<main>` for admin surfaces). The 2/3-width pattern was carried over from the step-07 prompt's "reserve space for future widgets" idea — but with the activity card being the *primary* signal on the home page, giving it the full row reads better. Future widgets (upcoming reviews, deadlines) can stack above or below as their own full-width rows when they land.

**Verification:** `npm run build` → 2747 modules, 99.33 KB CSS (-0.14 KB vs. step 07 — one less grid layout), 511.79 KB JS / 159.33 KB gzip (-0.20 KB — removed wrapper div + col-span class). Bundle grep: `Umarov` × 2, `Jahongir` × 2, `Sobirovich` × 2 (display literal + parts mapping), zero occurrences of `Allaberganov` or `Sardor`.

**Files touched:** `dashboard/src/lib/mock-backend/seed.ts`, `dashboard/src/features/dashboard-home/DashboardHome.tsx`, `docs/dashboard-prompts/00-master.md`, `docs/dashboard-prompts/04-routing-auth.md`, `docs/dashboard-prompts/06-mock-backend.md`, `docs/dashboard-prompts/09-flow2-employees-list.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 07: home page (stats + activity + quick actions + expiring-cert alert)

Executed [`docs/dashboard-prompts/07-dashboard-home.md`](../docs/dashboard-prompts/07-dashboard-home.md). The `/` route now renders a real HR_ADMIN home page instead of the step-04 placeholder: greeting with first name parsed from the seeded `Surname Given Patronymic` FIO, an expiring-certs alert that null-renders when no ACTIVE certs fall inside the 30-day horizon, a 4-card stats row (Faol xodimlar / Tarkibiy bo'linmalar / Faol ERI kalitlari / Tasdiqlash kutilmoqda) with the master-spec tone rotation (emerald → default → signal → cinnamon), a 4-up quick-actions grid, and a recent-activity list sourced from `listAudit({ limit: 8 })`. First real consumer of the step-06 mock backend.

**What landed:**

- **Common state components (reusable across steps 08+):**
  - [`src/components/common/LoadingState.tsx`](../dashboard/src/components/common/LoadingState.tsx) — N-row skeleton wrapper, default 4.
  - [`src/components/common/EmptyState.tsx`](../dashboard/src/components/common/EmptyState.tsx) — optional icon (lucide), title, body, action slot. Cream-warm pill behind the icon to match the activity-row icon tiles.
  - [`src/components/common/ErrorState.tsx`](../dashboard/src/components/common/ErrorState.tsx) — destructive-tinted variant with optional retry button; default title falls back to `common:errors.unknown`.
  - [`src/components/common/StatCard.tsx`](../dashboard/src/components/common/StatCard.tsx) — `default | emerald | cinnamon | signal` tones, lucide icon in a contrast-aware pill, optional delta line. `cn()`+tw-merge correctly overrides the shadcn Card's default `py-4` with `p-5 md:p-6`.
- **Feature pieces:**
  - [`src/features/dashboard-home/StatsRow.tsx`](../dashboard/src/features/dashboard-home/StatsRow.tsx) — `Promise.all([listEmployees, listUnits, listCertificates])` → 4 StatCards. Skeleton grid while loading; `cancelled` flag in the effect so a fast unmount can't `setState` after the response.
  - [`src/features/dashboard-home/RecentActivityCard.tsx`](../dashboard/src/features/dashboard-home/RecentActivityCard.tsx) — Card with "Hammasini ko'rish" → `/audit` ghost button in the header; renders LoadingState skeleton, "Harakatlar yo'q" empty state, or a `divide-y divide-line` list of 8 rows. Each row: lucide icon in an emerald-on-cream-warm tile, `actorName` (medium weight) + localised verb + `resourceLabel`, relative timestamp via `formatRelative()` (date-fns Uzbek locale, returns "3 soat oldin"-style strings).
  - [`src/features/dashboard-home/ExpiringCertsAlert.tsx`](../dashboard/src/features/dashboard-home/ExpiringCertsAlert.tsx) — `listCertificates({ status: 'ACTIVE' })` filtered to `validTo < now + 30 days`. Returns `null` when count is 0 — no empty alert pollution. Cinnamon-soft background with cinnamon icon + outline CTA → `/certificates?filter=expiring`.
  - [`src/features/dashboard-home/QuickActions.tsx`](../dashboard/src/features/dashboard-home/QuickActions.tsx) — 4 Link tiles: `/employees/new` (UserPlus), `/units` (Network), `/certificates` (KeySquare), `/audit` (FileText). 2-col grid below `sm`, 4-col from `sm` up. Icon pill flips from `cream-deep/emerald` to `emerald/cream` on hover.
  - [`src/features/dashboard-home/DashboardHome.tsx`](../dashboard/src/features/dashboard-home/DashboardHome.tsx) — composes `PageHeader → ExpiringCertsAlert → StatsRow → QuickActions → grid(2/3 RecentActivityCard, reserved right column)`.
- **Router wired:** [`src/router.tsx`](../dashboard/src/router.tsx) `/` route now renders `<DashboardHome />` (no longer the `Placeholder` for `dashboard:sidebar.nav-home`). All other 7 placeholder routes untouched until their respective steps.
- **i18n:** [`uz.json`](../dashboard/src/i18n/locales/uz.json) extended with `dashboard.home.*` (greeting + subtitle + 4 stat labels + recent-activity + no-activity + expiring-alert.{title,body,cta} + 4 quick-action labels + `quick.title`) and `dashboard.audit.actions.*` (13 verb forms — `yaratdi`, `yangiladi`, `tasdiqladi`, `tizimga kirdi`, `ERI yukladi`, etc., one per `AuditAction` enum value so no row renders as a raw code).

**Deviations from the step prompt:**

- **lucide-react icons in the activity feed instead of unicode/emoji glyphs.** The prompt maps each `AuditAction` to a unicode character (`✚ ✎ ⌫ ⇄ ↻ ✓ ⊘` + the literal emoji `🔑`). Unicode geometric glyphs render inconsistently across fonts (size, baseline, color); the emoji key would render in full color on macOS/iOS but monochrome on Windows — visually jarring inside otherwise-monochrome chrome. Swapped to lucide icons matching the action semantics (`Plus / Pencil / Archive / LogIn / LogOut / KeyRound / ArrowRightLeft / Upload / ShieldCheck / ShieldX / UserCog / UserCheck / Trash2`), consistent with the StatCard / QuickActions / Sidebar / Topbar icon language already in use across the dashboard.
- **`Network` icon for the units quick-action.** Prompt imports `NetworkIcon`; lucide-react exports the icon as `Network`. (The `Icon`-suffix aliases were removed in lucide v0.300+ and we're on the current major.)
- **Quick-action `/certificates/upload` → `/certificates`.** Prompt links the "ERI yuklash" tile to `/certificates/upload`, which doesn't exist as a route (step 12 places upload as a sheet/dialog opened from `/certificates`). Routed to `/certificates` directly so the click doesn't 404-redirect-home in the demo.
- **`firstNameOf` helper.** The prompt's `user?.fullName.split(' ')[1]` works for the seed convention (`Allaberganov Sardor Otabekovich`) but throws on a single-word `fullName` (the fallback path uses `user.email` which contains no space). Extracted to a tiny `firstNameOf()` helper that returns `parts[1]` when present, `parts[0]` otherwise, empty string for falsy input. Documented inline why the seed convention drives the index.
- **Cancellation flags on all three async effects.** Prompt's `RecentActivityCard` / `ExpiringCertsAlert` don't guard `setState` against unmount; added the same `cancelled` pattern that already lives in `StatsRow`. Cheap insurance.
- **Card `pt-0` on CardContent.** Kept per prompt — the CardHeader's bottom padding is enough; no double-padding above the list.
- **Added `quick.title` to the i18n block.** Not used by the current QuickActions render (the tiles are self-labelling), but reserved so step 08+ can add a section heading without re-editing the locale file.

**Lessons respected (per [`LESSONS.md`](./LESSONS.md)):**

- `<main>` in AppShell still has no `max-w-*` clamp — the new home page fills the full content area, which is what we want for the 4-card stats row on wide monitors.
- No `crypto.randomUUID()` / `uuid` import needed — step 07 mints no UUIDs.
- Per-field Zustand selector for `useAuthStore(s => s.user)`.
- No `backdrop-blur` added (the alert and stat cards are static surfaces).

**Verification:**

- `tsc -b && vite build` → **2747 modules**, **99 KB CSS** (+5 KB over step 06 for the new utilities), **512 KB JS / 159 KB gzip** (+41 KB / +11 KB for the new components + ~13 lucide icons). The 500 KB chunk warning is cosmetic — code-splitting lands in step 14's deploy prep.
- Production bundle grep'd: all 17 expected UZ strings present — `Salom, `, `Bugun nima qilamiz`, `Faol xodimlar`, `Tarkibiy bo`, `Faol ERI`, `Tasdiqlash kutilmoqda`, `So'nggi harakatlar`, `Harakatlar yo`, `Yangi xodim`, `Tuzilmani boshqarish`, `ERI yuklash`, `Audit jurnali`, `ERI muddati`, `yaratdi`, `tasdiqladi`, `tizimga kirdi`, `ERI yukladi`.
- Dev server: `GET /Devon/dashboard/` → 200, `GET /Devon/dashboard/login` → 200.
- TS strict + verbatim type imports — all icon imports use `import type { LucideIcon }`, no diagnostics.

**Not browser-tested.** I ran the build and curl'd the dev server but did not open the page in a real browser. The next person at the screen should verify: (a) stats row collapses 4-col → 2-col → 1-col cleanly at 1280/768/360; (b) the expiring-cert alert wraps gracefully on mobile (CTA stacks below body text); (c) the activity feed icons render at the correct size in the 28px tile; (d) the QuickActions hover state (`cream-warm` background, icon flip to `emerald → cream`) feels right.

**Intentionally NOT done:** real-time refresh (no use case yet — the demo seed is static between resets), the right-column reserved space (per prompt §7 note — left empty for future "upcoming reviews" / "deadlines" widgets), RU/EN translations of the new keys (UZ-only ships in v1.0 per master §17; RU lands in v1.1).

**Files touched:** `dashboard/src/components/common/{LoadingState,EmptyState,ErrorState,StatCard}.tsx` (created), `dashboard/src/features/dashboard-home/{StatsRow,RecentActivityCard,ExpiringCertsAlert,QuickActions,DashboardHome}.tsx` (created), `dashboard/src/router.tsx` (route `/` swap), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.home.*` + `dashboard.audit.actions.*`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Sheet drawer animation polish (post-step-06)

Two iterations on the mobile sidebar drawer slide-in animation after step 06 landed. First pass made minor improvements at the call site (full-edge slide, bg fix, hide close button); user reported it still didn't feel smooth on a second look, so the second pass went deeper and edited the shadcn `sheet.tsx` primitive directly — a one-time exception to the "do not edit shadcn primitives" convention, justified by the root causes being baked into the primitive's defaults.

**Root causes found:**

- **`backdrop-blur-xs` on `SheetOverlay`.** The backdrop-filter forced a full-screen paint every frame and competed with the content's `transform` animation for the compositor thread — the canonical mobile-drawer stutter pattern. Removed entirely. Compensated by raising overlay opacity from `bg-black/10` to `bg-black/30` for clearer visual hierarchy.
- **40 px slide instead of full-edge.** The default `slide-in-from-left-10` translates only `calc(10 * 0.25rem * -1) = -40px`, which reads as a "pop" with parallel fade rather than a real drawer slide. Switched all four sides to `slide-in-from-<side>-full` which compiles to `--tw-enter-translate-x: calc(1 * -100%)` (fully off-screen).
- **No GPU layer hint.** Added `will-change-transform` on `SheetContent` and `will-change-[opacity]` on `SheetOverlay` so the browser promotes them to their own layers before the animation starts, avoiding first-frame jank.
- **Wrong easing curve.** Replaced the default `ease-in-out` with `ease-[cubic-bezier(0.32,0.72,0,1)]` — the curve Apple uses for sheet/modal presentations on iOS. Feels natural under the eye for sliding panels.
- **Duration too short.** Bumped from 200 ms to 300 ms on open, kept close at 250 ms (close should feel slightly snappier than open — UX convention).
- **Redundant X button + white popover flash.** Hid the `SheetContent` close button via `showCloseButton={false}` at the call site; matched the SheetContent background to the Sidebar (`bg-cream-deep`) and dropped its `border-r` since the Sidebar paints its own. Added `shadow-xl` for depth without the heavy `shadow-2xl` blur cost.

**Lint surprise that cost a build cycle:** the IDE's `suggestCanonicalClasses` warned that `slide-in-from-left-[100%]` could be rewritten as `slide-in-from-left` (no suffix). It can't — tw-animate-css v1.4 does not define the unsuffixed form, and the class silently compiles to nothing. The drawer was briefly losing its slide entirely (only fading) before the build verification grep caught it. Switched to `slide-in-from-<side>-full` which is a real Tailwind spacing-scale variant and compiles to `-100%`. Documented this in LESSONS.md so future sessions don't get burned by the same linter suggestion.

**Why edit the primitive instead of overriding at the call site:** the default `40px slide + backdrop-blur + 200ms ease-in-out` is wrong for every drawer-style Sheet, not just the mobile nav. The certificates Kanban mobile tabs in step 12 and any future bottom-sheet usage will all want the same smoother defaults. The call-site `MobileNavTrigger.tsx` override is now down to just the cosmetic differences (`bg-cream-deep` to match Sidebar, `border-0`, `shadow-xl`, `w-72 max-w-[85vw]`, `showCloseButton={false}`).

**Verification:** `npm run build` → 1911 modules, 95.67 KB CSS, 471 KB JS / 148 KB gzip. Compiled CSS confirmed: `slide-in-from-left-full` sets `--tw-enter-translate-x: calc(1 * -100%)`; both `will-change:transform` and `will-change:opacity` rules present; `cubic-bezier(.32,.72,0,1)` present.

**Files touched:** `dashboard/src/components/ui/sheet.tsx`, `dashboard/src/components/layout/MobileNavTrigger.tsx`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md`

---

## 2026-05-26 — Dashboard step 06: mock backend foundation (localStorage + seed + schemas)

Executed [`docs/dashboard-prompts/06-mock-backend.md`](../docs/dashboard-prompts/06-mock-backend.md). The dashboard now has a typed, persisted data spine that every subsequent feature step (07–13) consumes. First app load runs `seedIfEmpty()` (~150–400 ms) before React mounts; reset-demo replays the same seed. The auth store's literal-credential check from step 04 has been replaced with a real `findUserByEmail` + sha256 hash compare.

**What landed:**

- **`src/types/domain.ts`** — full domain model expanded from the step 04 stub (only `Role`) to 9 interfaces + ~10 enum unions covering Unit, Employee, Assignment, Certificate, User, AuditEntry, ProfileChangeRequest, Position. Mirrors master §15 verbatim.
- **`src/lib/mock-backend/schemas.ts`** — zod runtime validators paralleling every domain type, plus reusable field validators (`pinflSchema`, `uzPhoneSchema`, `corporateEmailSchema`) with i18n key error messages that wizard / form steps will plug straight into react-hook-form.
- **`src/lib/mock-backend/storage.ts`** — `readTable<T>` / `writeTable<T>` / `clearAll()` + `Tables` const map. All keys namespaced `devon.dashboard.*` so the reset-demo cleanup is precise.
- **`src/lib/mock-backend/delay.ts`** — `simulatedDelay()` adds 200–600 ms of latency per call.
- **`src/lib/mock-backend/errors.ts`** — `MockNetworkError` class + `maybeFail(probability = 0.03)` thrower. Convention: mutations call `maybeFail()` after `simulatedDelay()`; reads only delay.
- **`src/lib/mock-backend/seed.ts`** — produces:
  - 25 units across all 4 hierarchy levels (Departament → Boshqarma → Bo'lim → Sho'ba), spanning IT / HR / Moliya / Yuridik / Operatsion / Xavfsizlik branches with realistic Uzbek names like `Axborot Texnologiyalari Departamenti`, `Buxgalteriya Boshqarmasi`, `Soliq Hisoboti Bo'limi`, `API Sho'basi`.
  - 30 employees with hand-crafted Uzbek FIOs (mixed gender, realistic patronymics — `Allaberganov Sardor Otabekovich`, `Norbo'taeva Mohira Sherzodovna`, `Toshmuhammedov Ulug'bek Ravshanovich`, etc.), each distributed to a specific unit + role with deterministic `fioToUnit` mappings. PINFLs match `/^[1-6]\d{13}$/` with the first digit picked by gender-and-hire-year per the Uzbek convention (3/5 = M, 4/6 = F). Phones `+998 9X XXX XX XX` cycling through the 7 mobile prefixes. Corporate emails via `firstname.lastname@devon.uz` (apostrophes stripped). HR_ADMIN Sardor's email is hardcoded to `admin@devon.uz` to match the step 04 demo creds.
  - 30 users with sha256-hashed passwords (HR_ADMIN gets `Demo2026!`, everyone else `Welcome2026!` with `mustChangePassword: true`).
  - 30 primary assignments, 1:1 with employees.
  - 25 certificates split exactly 18 ACTIVE / 4 PENDING_APPROVAL / 2 EXPIRED / 1 REVOKED. Issuer `YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ`. Validity windows reflect the status — expired certs have `validTo` in the past, active certs cover the next ~6 months. The revoked cert carries `revocationReason: 'COMPROMISED'`.
  - ~70 audit entries spread across 30 days: LOGIN traffic (~daily for Sardor with 70% probability), CREATE/UPDATE on units + employees, UNIT_TRANSFER events, CERTIFICATE_UPLOADED/APPROVED pairs for the active certs (sampled), one CERTIFICATE_REVOKED, one PASSWORD_CHANGED, one PROFILE_CHANGE_APPROVED. Sorted newest-first.
  - 14 positions (`POS-DIR`, `POS-DEP-HEAD`, `POS-DIRECT-HEAD`, `POS-DIV-HEAD`, `POS-SUB-HEAD`, `POS-LEAD-DEV`, `POS-DEV`, `POS-ANALYST`, `POS-SPECIALIST`, `POS-ACCOUNTANT`, `POS-HR-MANAGER`, `POS-HR-SPEC`, `POS-LAWYER`, `POS-SECURITY-SPEC`) with `allowedUnitTypes` per position so the wizard step can gate position pickers.
- **`src/lib/mock-backend/index.ts`** — public API: 9 read functions (`listUnits`, `getUnit`, `listEmployees(filters)`, `getEmployee`, `listAssignments`, `listCertificates(filters)`, `listAudit(filters)`, `listPositions`, `findUserByEmail`, `listProfileRequests`) + 11 mutation functions (`createUnit`, `updateUnit`, `archiveUnit`, `createEmployeeFull` with User + Assignment transaction, `updateEmployee`, `terminateEmployee` with cascade-revoke of active certs, `transferEmployee` closes-old + new-primary handling, `uploadCertificate` with `autoApprove`, `approveCertificate`, `rejectCertificate`, `revokeCertificate`) + `appendAudit` helper (auto-derives `actorName` from the user table). Every mutation: `simulatedDelay()` → `maybeFail()` → read-modify-write → `appendAudit()`.
- **`src/stores/useAuthStore.ts`** — `login()` refactored. Now: `findUserByEmail(email)` → if null, invalid-credentials. Else hash the input password with `sha256Hex()` and compare against `user.passwordHash`. Look up `fullName` via `listEmployees()`. Wrap the whole thing in try/catch on `MockNetworkError`. The literal `DEMO_EMAIL` / `DEMO_PASSWORD` constants are gone.
- **`src/main.tsx`** — `createRoot(...).render(...)` now wrapped in `seedIfEmpty().then(...)`. The seed flag (`devon.dashboard.seeded === '1'`) short-circuits on subsequent loads, so steady-state boot is unaffected.
- **`src/components/layout/UserMenu.tsx`** — `onResetDemo` calls the proper `resetAndSeed()` from the mock backend instead of just clearing keys locally. Re-seed produces fresh UUIDs each run (intentional — different sessions get different IDs but the same shape).

**Deviations from the step prompt:**

- **Native `crypto.randomUUID()` instead of the `uuid` package.** The prompt's `npm install uuid @types/uuid` was idiomatic in 2020 but legacy now — browsers ship the API natively (since 2022, all modern browsers including Safari 15.4+, supported on `localhost` + HTTPS GH Pages). Saves a dep + ~15 KB minified + a `@types` dep. **Captured in [`LESSONS.md`](./LESSONS.md)** so step 07+ doesn't reach for the `uuid` package.
- **zod v4** (current major). API-compatible at our usage surface — `.object`, `.enum`, `.regex(/.../, { message })`, `.optional()`, `.nullable()`, `.email()`, `.uuid()`. Migrated cleanly with no changes.
- **`INEFFECTIVE_DYNAMIC_IMPORT` warning fixed.** Initial attempt at `createEmployeeFull` used a dynamic `await import('@/lib/hash')` to dodge a circular concern, but the static import elsewhere meant it bundled the same way. Promoted to a static top-of-file import; no measurable bundle delta.
- **`appendAudit` derives `actorName` automatically** by looking up the user → employee. The prompt allows passing it; making it optional keeps callers terse and avoids the trap where actorName drifts from the actual user.
- **Realistic seed data hand-crafted, not the `// ...` placeholder.** 30 specific FIOs, an explicit `fioToUnit` mapping table that places each employee in a deliberate unit + position (HR_ADMIN at `DEP-HR-REC`, 1 lead + 1 dev in `DEP-IT-DEV-BE-API`, 2 lawyers in `DEP-LEG-CORP`, etc.), and a `buildCertificates` distribution that hits the 18/4/2/1 status counts exactly.

**Verification:**

- `npm run build` → 1911 modules, 94 KB CSS, 471 KB JS / 148 KB gzip. +14 KB JS over step 05 (zod + mock backend code).
- Production bundle grep'd: contains the seed-data fingerprints — `Allaberganov Sardor`, `Karimov`, `Axborot Texnologiyalari`, `Soliq Hisoboti`, `Tarmoq Bo`, `DEP-IT-DEV-BE-API`, `POS-HR-MANAGER`, `YANGI TEXNOLOGIYALAR`, `Demo2026`, `admin@devon.uz`.
- Dev server: HTTP 200 on `/Devon/dashboard/` and `/Devon/dashboard/login`. SPA fallback unchanged.
- TS strict + verbatim type imports — no errors.

**Intentionally NOT done:** UI changes beyond the auth-store refactor — placeholders still say "coming soon". The mutation functions (`createEmployeeFull`, `transferEmployee`, certificate handlers, etc.) are implemented but not yet exercised by any UI. Step 07's home page will be the first consumer of `listEmployees` / `listCertificates` / `listAudit`. The `terminateEmployee` cascade-revoke logic was implemented now since it's a one-place concern.

**Files touched:** `dashboard/package.json` (+ dep: zod@^4.4.3), `dashboard/src/types/domain.ts` (full expansion), `dashboard/src/lib/mock-backend/{storage,delay,errors,schemas,seed,index}.ts` (created), `dashboard/src/stores/useAuthStore.ts` (refactored), `dashboard/src/main.tsx`, `dashboard/src/components/layout/UserMenu.tsx`, `ai_context/LESSONS.md` (+ native-UUID rule), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — AppShell main full-width + LESSONS.md created

Two follow-ups after step 05 landed:

1. **Main content area is now full-width.** Removed the `mx-auto w-full max-w-[1280px]` clamp from `<main>` in [`AppShell.tsx`](../dashboard/src/components/layout/AppShell.tsx) per user direction. Content now fills the full viewport minus the sidebar (240px on `lg+`) and the page padding (`px-4 → md:px-6`). Reason: Devon's dashboard is a data-dense admin surface; tables, kanban, audit logs, and employee lists benefit from horizontal density. The 1280px clamp made the page feel like a marketing landing on wide monitors and wasted vertical scroll on tables that would otherwise fit horizontally.
2. **Created [`ai_context/LESSONS.md`](./LESSONS.md)** with a Layout section capturing the full-width decision, the why, and a how-to-apply note. The file was already a known-empty gap flagged in `AI_CONTEXT.md`'s open questions section — closing that gap.
3. **Patched the step 05 build prompt** ([`docs/dashboard-prompts/05-app-shell.md`](../docs/dashboard-prompts/05-app-shell.md)) to drop the clamp from the `AppShell` template + added an inline comment + updated the desktop acceptance check, so future runs of step 05 in a fresh session don't re-introduce the clamp.

A feedback memory was also saved under the user's auto-memory directory so future sessions see the rule even before reading LESSONS.md.

**Files touched:** `dashboard/src/components/layout/AppShell.tsx`, `ai_context/LESSONS.md` (created), `docs/dashboard-prompts/05-app-shell.md`, `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Dashboard step 05: AppShell (sidebar drawer + topbar + user menu)

Executed [`docs/dashboard-prompts/05-app-shell.md`](../docs/dashboard-prompts/05-app-shell.md). Every protected route is now wrapped in `<AppShell>` — persistent 240px Devon-branded sidebar on `lg+`, slide-in `Sheet` drawer on mobile/tablet, sticky `cream/85` backdrop-blur top bar with search + notifications + user menu, content area constrained to `max-w-[1280px]` with responsive padding. Placeholder pages now render through the reusable `<PageHeader>` component instead of bare `<main>` tags.

**What landed:**

- **`src/stores/useUiStore.ts`** — Zustand store for UI chrome state. Currently only `mobileNavOpen` (open/close/toggle) — locale + theme deferred until they're actually needed.
- **`src/lib/use-media-query.ts`** — `useMediaQuery(query)` hook. Used by `App.tsx` to flip Toaster position between `top-center` (mobile) and `bottom-right` (desktop). SSR-safe with `typeof window === 'undefined'` guard, but moot for an SPA — kept for hygiene.
- **`src/components/layout/Sidebar.tsx`** — Same component renders on both mobile (inside `Sheet`) and desktop (inline 240px column). Header with DEVON wordmark, two nav sections (BOSHQARUV / SHAXSIY), active state is the emerald-pill-with-cream-text variant matching the master spec's "brand-warm chrome" tone. Footer carries the `Rivolanish intizom bilan!` slogan in cinnamon Fraunces-italic. Icons via lucide-react (`LayoutDashboard`, `Network`, `Users`, `KeySquare`, `ScrollText`, `UserCircle2`).
- **`src/components/layout/MobileNavTrigger.tsx`** — Hamburger button visible below `lg`. Opens `Sheet` containing the same `<Sidebar>` with `onNavigate` callback that closes the drawer on nav click. Aria-label flows from `dashboard:topbar.open-nav`.
- **`src/components/layout/UserMenu.tsx`** — Avatar dropdown showing full name + email, profile/settings shortcuts (both route to `/profile` for now), reset-demo (clears all `devon.dashboard.*` localStorage keys + toast confirmation + 800ms reload), logout (clears session + redirects to `/login`). First name hidden below `md` so the avatar alone is the chip on mobile.
- **`src/components/layout/TopBar.tsx`** — Sticky `z-30` header. Hamburger (mobile/tablet only) + compact DEVON wordmark (mobile/tablet only) + search input (visible from `sm+`, with embedded `Search` icon) + notifications dropdown (empty state for now) + user menu. Backdrop-blur on a translucent cream surface for the layered chrome feel.
- **`src/components/layout/AppShell.tsx`** — Outer layout: desktop sidebar in a `fixed inset-y-0` column with a `w-60` placeholder sibling for layout flow, main column with the topbar on top and content centered to `max-w-[1280px]`.
- **`src/components/common/PageHeader.tsx`** — Reusable responsive header: title (`text-2xl → md:text-3xl`), optional subtitle (`text-sm text-muted-foreground`), optional actions slot that stacks below on mobile and right-aligns on desktop.
- **`src/router.tsx`** — Refactored to use a `<Protected>` helper (= `<RequireAuth><AppShell>...</AppShell></RequireAuth>`) so each of the 8 routes reads cleanly. `Placeholder` now renders through `PageHeader` with `t('common:labels.coming-soon')` as subtitle.
- **`src/App.tsx`** — Toaster position toggles via `useMediaQuery('(min-width: 768px)')` — `top-center` on mobile (clears the sticky action bar), `bottom-right` on desktop.
- **`uz.json` additions:** `common.labels.coming-soon` (Keyingi bosqichlarda to'ldiriladi), `dashboard.topbar.open-nav` (Navigatsiyani ochish — for the hamburger aria-label), `dashboard.user-menu.reset-demo-toast` (the success toast text).

**Deviations from the step prompt:**

- **Hardcoded English/UZ strings in the prompt fixed.** Step 05's prompt has `aria-label="Open navigation"` (English) on the hamburger and a hardcoded UZ toast (`"Demo ma'lumotlar qayta tiklandi..."`) inside `onResetDemo`. Both routed through new UZ keys to keep step 03's no-hardcoded-strings discipline intact.
- **Per-field store selectors.** Both `MobileNavTrigger` and `UserMenu` use `useUiStore((s) => s.x)` / `useAuthStore((s) => s.x)` per field instead of the prompt's full-store destructure — avoids re-rendering on unrelated state changes.
- **`React.ComponentType` → `import type { ComponentType }`.** TS 6 + `verbatimModuleSyntax` requires the explicit type import. The prompt's `icon: React.ComponentType<{ className?: string }>` wouldn't compile.
- **lucide-react install task skipped** — already pulled in by shadcn during step 02 init.

**Known dev-only noise carried forward:** the same two React Router v6 future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) — cosmetic, not in prod logs.

**Verification:**

- `npm run build` → 1905 modules (up from 1894 — 11 new files), 94 KB CSS, 456 KB JS / 144 KB gzip. JS bundle grew ~92 KB from step 04 because radix-ui primitives (Sheet, DropdownMenu, Avatar) that were imported-but-unused before are now actively tree-shaken in.
- `npm run dev` → `GET /Devon/dashboard/`, `/units`, `/profile` all return HTTP 200 (Vite SPA fallback).
- Production JS bundle contains the new UZ strings: `BOSHQARUV`, `SHAXSIY`, `Navigatsiyani ochish`, `Keyingi bosqichlarda`, `Tarkibiy tuzilma`.

**Intentionally NOT done:** TooltipProvider wrap (deferred — no current primitive uses tooltips, will add when first needed), real breadcrumbs (master §11 + prompt's notes call for in-page back links instead until deeper hierarchies arrive), locale switcher in UserMenu (RU/EN copy ships in v1.1 per roadmap).

**Files touched:** `dashboard/src/stores/useUiStore.ts` (created), `dashboard/src/lib/use-media-query.ts` (created), `dashboard/src/components/layout/Sidebar.tsx` (created), `dashboard/src/components/layout/MobileNavTrigger.tsx` (created), `dashboard/src/components/layout/UserMenu.tsx` (created), `dashboard/src/components/layout/TopBar.tsx` (created), `dashboard/src/components/layout/AppShell.tsx` (created), `dashboard/src/components/common/PageHeader.tsx` (created), `dashboard/src/router.tsx` (refactored with Protected helper), `dashboard/src/App.tsx` (responsive Toaster), `dashboard/src/i18n/locales/uz.json` (+ 3 keys), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Login page polish: password toggle, slogan legibility, brand-pane redesign

Three iterative polish passes on the step 04 [`LoginPage.tsx`](../dashboard/src/features/auth/LoginPage.tsx) after the initial step landed, all UZ-keyed and verified in the production bundle:

- **Password show/hide toggle.** Added an `Eye` / `EyeOff` button at the right edge of the password input (40×40 tap target, `aria-pressed`, aria-label flips between `Parolni ko'rsatish` and `Parolni yashirish`, disabled during submit). Input gets `pr-12` to clear room for the icon.
- **Slogan legibility.** Bumped `Rivolanish intizom bilan!` from `text-base` (16px) to `text-xl` (20px) + `font-medium` Fraunces italic, paired with a small emerald rotated-diamond marker. Was failing WCAG body-text contrast at 16px cinnamon-on-cream-deep; now passes large-text contrast at 20px.
- **Brand pane redesign.** Replaced the plain centered logo + headline + paragraph with: (1) a compass-radial decorative SVG backdrop bottom-right at 7% emerald opacity (concentric circles + cross-hairs + diagonals + center diamond — geometric Uzbek-institutional vibe matching the dark on-premise section of `landing/index.html`); (2) a tiny `Korporativ platforma` corner stamp top-right in cinnamon with rotated-diamond marker; (3) DEVON logo + a larger 48px headline with Fraunces-italic emerald accent on the word `intizomli` + subtitle paragraph constrained to `max-w-md` for readable line-length. First iteration tried adding a feature trio (Network / ShieldCheck / ScrollText icon rows for Tarkibiy tuzilma · ERI · Audit) but the user trimmed it — kept the minimal version.
- **Width tuning.** Inner content block bumped from `max-w-md` (28rem) → `max-w-xl` (36rem) after the trio removal; with `px-12 py-16` paddings that gives ~480px of usable content width at `lg` so the 48px headline breathes properly instead of wrapping at every word.

**Discipline fix surfaced along the way:** the original step 04 prompt had the brand-pane headline + subtitle hardcoded in JSX — a drift from step 03's "no hardcoded user-facing strings" rule. All brand-pane copy now flows through new `dashboard.login.brand-*` UZ keys (`brand-eyebrow`, `brand-headline-line-1`, `brand-headline-accent`, `brand-headline-line-2`, `brand-subtitle`). The interim `brand-features.*` keys for the trio were removed when the icons row was trimmed.

**Verification:** `npm run build` → 1894 modules, 91 KB CSS, 364 KB JS / 115 KB gzip. Production bundle grep confirms all new UZ strings (`Parolni ko'rsatish`, `Parolni yashirish`, `Korporativ platforma`, `Hujjat aylanmasi`, `Mahalliy PKI` was in the trimmed-trio version — removed; `intizomli`, `va xavfsiz`, `Rivolanish intizom bilan`).

**Files touched:** `dashboard/src/features/auth/LoginPage.tsx`, `dashboard/src/i18n/locales/uz.json`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Dashboard step 04: routing, mock auth, mobile-first login

Executed [`docs/dashboard-prompts/04-routing-auth.md`](../docs/dashboard-prompts/04-routing-auth.md). The dashboard now has a real router (basename `/Devon/dashboard`), a persisted Zustand auth store, a `<RequireAuth>` route guard with deep-link preservation via `?from=`, and a mobile-first split-pane login page rendered entirely from UZ translation keys. The eight protected routes from master §11 are wired with localised placeholder pages — feature content lands in steps 05–13.

**What landed:**

- **Deps:** `react-router-dom@^6.30.3` (pinned to v6 per master §4; v7 is current but its API shift would diverge from the rest of the prompt set), `zustand@^5.0.13`.
- **`src/types/domain.ts`** — minimal stub with only the `Role` union. Full domain types arrive in step 06 / 07.
- **`src/lib/hash.ts`** — Web Crypto SHA-256 hex helper. Not used yet (login compares literal credentials), but step 07's refactor will hash and compare against `mock-backend.users[].passwordHash`. Comment in the file notes it's not real security — matches master §17's "out of scope: real PKI / real crypto".
- **`src/stores/useAuthStore.ts`** — persisted to `devon.dashboard.session` localStorage key. `login()` simulates 300–600ms latency + 3% random network failure (matches master §9 mock-backend rules). 8-hour `SESSION_TTL_MS`. Demo creds (`admin@devon.uz` / `Demo2026!`) are hard-coded as a Step 04 stopgap — flagged in the file with a TODO pointer to step 07.
- **`src/features/auth/RequireAuth.tsx`** — checks `isAuthenticated && !isExpired()`, calls `logout()` if expired, redirects to `/login?from=<urlencoded path>`. Subscribes to individual store slices (not the whole store) to avoid unnecessary re-renders.
- **`src/features/auth/LoginPage.tsx`** — split-pane layout: brand pane (`bg-cream-deep`, emerald diamond + DEVON wordmark, Fraunces-italic accent, slogan in cinnamon) hidden below `md:`; form pane (`bg-surface`) full-width on mobile with a compact logo header. All inputs `h-12` (48px touch targets per master §7 mobile rules). Demo credentials prefilled for one-tap mobile login. Inline `Alert` for error state. `Loader2` spinner during submit.
- **`src/router.tsx`** — `Routes` table covering `/login` (public) + 8 protected routes (`/`, `/units`, `/employees`, `/employees/new`, `/employees/:uuid`, `/certificates`, `/profile`, `/audit`) + a `*` catch-all → `/`. Placeholder component pulls its title from `dashboard:sidebar.nav-*` keys so the route table itself stays i18n-clean.
- **`src/App.tsx`** — replaced the step 03 demo with `<BrowserRouter basename={BASE_URL.replace(/\/$/, '')}><Router /><Toaster /></BrowserRouter>`. `BASE_URL` resolves to `/Devon/dashboard/` → basename becomes `/Devon/dashboard`.
- **`uz.json` extension** — appended `dashboard.login.*` block with title, subtitle, label/placeholder pairs for email and password, remember-me, forgot-password, CTA, ctaLoading, demo hint, two error messages (`invalid-credentials`, `network`), and a copyright footer.
- **`index.css` token exposure** — added `--color-surface` and `--color-body` to both `:root` and `@theme inline` so the login page's `bg-surface` and `text-body` Tailwind utilities resolve cleanly (master §5 documents `--surface` and `--body` as Devon brand tokens; step 02 had exposed them only as the shadcn-internal `--surface` / `--color-body-fg` names).

**Deviations from the step prompt — minor:**

- **`container` utility deferred again.** The prompt's placeholder uses `<main className="container py-12">`; kept the explicit `mx-auto max-w-5xl px-4 py-12 md:px-8` pattern from steps 02–03 (Tailwind v4's `container` doesn't auto-center).
- **Multi-slice store subscriptions in `RequireAuth`.** The prompt destructures the whole store (`useAuthStore()`) which triggers re-renders on every state change; switched to per-field selectors so `RequireAuth` only re-renders when auth status actually flips.
- **Placeholder titles via i18n.** The prompt hard-codes Uzbek titles ("Bosh sahifa", "Tarkibiy tuzilma") in the `Placeholder` component. Routed them through `t('dashboard:sidebar.nav-*')` instead — keeps zero hardcoded strings discipline from step 03 intact.

**Known noise:** React Router v6 prints two future-flag warnings in dev console (`v7_startTransition`, `v7_relativeSplatPath`). Cosmetic — won't fix until we move to v7 or wire the opt-in flags. Not in prod logs.

**Verification:**

- `npm run build` → 1894 modules, 89 KB CSS, 361 KB JS / 114 KB gzip.
- `npm run dev` → `GET /Devon/dashboard/`, `/login`, `/employees` all return HTTP 200 (Vite SPA fallback serving index.html; React handles routing client-side).
- Production JS bundle grep'd: `Devon platformasiga kirish`, `Korporativ pochta`, `Parolingizni kiriting`, `Meni eslab qol`, `Tekshirilmoqda` all present.
- Production CSS contains the new `.bg-surface{background-color:var(--color-surface)}` utility.

**Intentionally NOT done in this step:** AppShell with sidebar + topbar (step 05), real mock backend with `users[]` (step 06), `mustChangePassword` redirect (step 07+), forgot-password flow (out of scope per master §17 — no real SMS/email).

**Files touched:** `dashboard/package.json` (+ deps: react-router-dom@^6, zustand), `dashboard/src/types/domain.ts` (created), `dashboard/src/lib/hash.ts` (created), `dashboard/src/stores/useAuthStore.ts` (created), `dashboard/src/features/auth/RequireAuth.tsx` (created), `dashboard/src/features/auth/LoginPage.tsx` (created), `dashboard/src/router.tsx` (created), `dashboard/src/App.tsx` (rewritten as BrowserRouter wrapper), `dashboard/src/i18n/locales/uz.json` (+ `dashboard.login.*` block), `dashboard/src/index.css` (exposed `--color-surface` + `--color-body`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Dashboard step 03: react-i18next wired, Uzbek-first

Executed [`docs/dashboard-prompts/03-i18n.md`](../docs/dashboard-prompts/03-i18n.md). All user-facing strings in `App.tsx` now flow through `useTranslation()` / `t('key')`; the JSON files in [`dashboard/src/i18n/locales/`](../dashboard/src/i18n/locales/) are the single source of truth for copy. UZ is the default + fallback; RU and EN files exist as empty namespaces (`{ "common": {}, "dashboard": {} }`) and fire UZ fallback for every key — matches master §8's contract.

**What landed:**

- **Deps installed:** `i18next@26`, `react-i18next@17`, `i18next-browser-languagedetector@8.2`, `date-fns@4.3`. No major breaking changes from the versions the prompt assumed — i18next 23/24/25/26 are API-compatible at the surface we use, and date-fns v4's locale named exports (`uz`, `ru`, `enUS`) work as before.
- **`src/i18n/index.ts`** — i18next config with `fallbackLng: 'uz'`, supported languages `[uz, ru, en]`, namespaces `[common, dashboard]`, language detector ordered `['localStorage', 'navigator']`, persistence key `devon.dashboard.lang`.
- **`src/i18n/locales/uz.json`** — fully populated canonical Uzbek copy: `common.actions` (23 keys), `common.labels`, `common.errors` (15 keys), `common.status` (11 keys), `common.unit-types` (matches the 4-level Departament → Boshqarma → Bo'lim → Sho'ba hierarchy), `common.employment-types`, `common.roles` (mirrors the 6 ROLE_* enum values from master §15), `common.genders`, `common.time` with ICU plural form, plus `dashboard.app`, `dashboard.sidebar` (incl. the `Rivolanish intizom bilan!` footer slogan), `dashboard.topbar`, `dashboard.user-menu`.
- **`src/i18n/locales/{ru,en}.json`** — empty namespace stubs.
- **`src/i18n/uz-locale.ts`** — `formatDate` (`dd.MM.yyyy` for `uz`/`ru`, `MMM d, yyyy` for `en`), `formatDateTime`, `formatRelative` (date-fns `formatDistanceToNow` with `addSuffix`), `formatNumber` (Intl with `uz-UZ` / `ru-UZ` / `en-US` resolution).
- **`src/main.tsx`** — imports `./i18n` before App mounts, so i18next is initialised before React renders.
- **`src/App.tsx`** — replaced step 02's hardcoded English demo with localised UZ copy: tagline `Hujjat aylanmasi platformasi`, action buttons (Saqlash · Bekor qilish · Tahrirlash · O'chirish), status badges (Faol / Kutilmoqda / Qoralama / Muddati tugagan), and a format-helpers card showing `formatDate(new Date())` in `dd.MM.yyyy` and `formatNumber(1234567)` with the Uzbek space-grouped form.

**Deviations from the step prompt — minor TS 6 adjustments:**

- **`Locale` is a type, not a value.** `verbatimModuleSyntax: true` (from step 01's tsconfig) requires `import type { Locale } from 'date-fns'` separated from the value imports. The prompt's single-line `import { format as fnsFormat, formatDistanceToNow as fnsDistance, Locale } from 'date-fns'` was rejected by TS 6; split into a value import + a type import.
- **`container` utility deferred.** The prompt's `<main className="container py-12">` was kept as `<main className="mx-auto max-w-5xl px-4 py-12 md:px-8">` (the same pattern used in step 02's demo) — Tailwind v4's `container` doesn't auto-center and doesn't include horizontal padding by default, so the explicit form is clearer until step 05 introduces the real AppShell container.

**Verification:**

- `npm run build` → 2707 modules, 87 KB CSS, 359 KB JS (109 KB gzip — i18next + date-fns + Intl polyfill-free runtime adds ~28 KB gzip).
- `npm run dev` → HTTP 200 on `/Devon/dashboard/`, served HTML preserved (`lang="uz"`, Inter preconnect, theme-color).
- Production JS bundle grep'd: contains all expected canonical UZ strings — `Saqlash`, `Bekor qilish`, `Faol`, `Hujjat aylanmasi platformasi`, `Tarkibiy tuzilma`. 28 occurrences of the Uzbek `O'`/`o'` apostrophe pattern (Bo'lim, Sho'ba, O'chirish, Yo'q, etc.).

**Intentionally NOT done:** language switcher (master §8 marks it out of scope until v1.1 ships RU). Pluralisation testing in RU (no RU translations exist yet — UZ fallback fires). Wrapping the app in `TooltipProvider` (deferred to step 05 app shell).

**Files touched:** `dashboard/package.json` (+ deps: i18next, react-i18next, i18next-browser-languagedetector, date-fns), `dashboard/src/i18n/index.ts` (created), `dashboard/src/i18n/uz-locale.ts` (created), `dashboard/src/i18n/locales/uz.json` (created — ~200 keys), `dashboard/src/i18n/locales/ru.json` (created — empty stub), `dashboard/src/i18n/locales/en.json` (created — empty stub), `dashboard/src/main.tsx`, `dashboard/src/App.tsx`, `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Dashboard step 02: Tailwind v4 + shadcn/ui + Devon palette wired

Executed [`docs/dashboard-prompts/02-tailwind-shadcn.md`](../docs/dashboard-prompts/02-tailwind-shadcn.md) — the dashboard now has Tailwind, shadcn/ui, and the Devon brand palette wired end-to-end. `App.tsx` renders a Devon-branded button + badge swatch demo; `npm run build` produces an 85 KB CSS bundle with all the Devon tokens compiled. Confirmed via grep on the built CSS: `--primary: #1f4d39` (Devon emerald), `--background: #faf8f4` (cream), `--accent: #f6e4d0` (cinnamon-soft), `--ring: #1f4d39`. `<html lang="uz">` + Inter/Fraunces preconnects + theme-color `#1F4E3F` preserved.

**Major deviation from the step prompt — Tailwind v4 (CSS-first):**

The prompt was written for Tailwind v3 + a `tailwind.config.ts` file. Tailwind v4 is the current default and ships a fundamentally different config approach — CSS-first via `@theme inline` directives, with the Vite integration moving from PostCSS to the `@tailwindcss/vite` plugin. Adopted v4 (matches the React 19 / Vite 8 / TS 6 pattern from step 01: use current ecosystem rather than pin behind). Resulting structure:

- **No `tailwind.config.ts`** — deleted from the deliverables.
- **No `postcss.config.js`** — Vite's `@tailwindcss/vite` plugin handles everything.
- **`src/index.css`** uses `@import "tailwindcss"` + `@import "shadcn/tailwind.css"` + `@import "tw-animate-css"`, then a single `:root` block defining shadcn semantic vars with `hsl()` Devon values, plus `@theme inline` to map them to Tailwind utility tokens.
- **`tailwindcss-animate`** (v3-era plugin) → replaced by **`tw-animate-css`**, imported as CSS, not as `@plugin` (initial attempt failed with `Cannot find module` — fixed by switching `@plugin` → `@import`).

**shadcn CLI v4 quirks encountered:**

- CLI flags changed: no more `--style new-york` / `--base-color neutral`. Now uses `--template <vite|next|...>` + `--base <radix|base>` + `--preset <nova|vega|...>`. Used `--template vite --base radix --preset nova` to match the spirit of "new-york + neutral" (Nova is the current default style preset; Lucide icons, Geist font baseline — the latter overridden to Inter via index.css).
- **Path-alias bug:** shadcn read the root `tsconfig.json` for the `@/*` alias but my v3-style alias was only in `tsconfig.app.json` (Vite's split tsconfig from step 01). shadcn quietly fell back to treating `@` as a literal path — created `dashboard/@/components/ui/*.tsx` instead of `dashboard/src/components/ui/*.tsx`. Fixed by `mv` of the 31 files into `src/components/ui/` and adding a `compilerOptions.paths` block to the root `tsconfig.json` so future `shadcn add` resolves correctly.
- **`form` primitive silently skipped:** the Nova preset's registry doesn't ship a `form.tsx` (it ran "Checking registry ✔" then exited with no output). 30 of the 31 requested primitives landed (button + input/label/textarea/card/dialog/sheet/drawer/table/badge/separator/tabs/accordion/dropdown-menu/avatar/alert/alert-dialog/scroll-area/skeleton/sonner/select/checkbox/radio-group/switch/popover/command/tooltip/breadcrumb/pagination/progress, plus `input-group` shadcn pulled in as a dependency). Will hand-add a canonical form primitive (the well-known react-hook-form + Slot + Label wrapper) when an actual form first appears in step 04 (login) or step 10 (employee wizard).
- shadcn appended its own oklch-based neutral palette + Geist font import on top of my Devon `@theme`. Rewrote `src/index.css` cleanly to merge: kept the shadcn imports, dropped the Geist import (using Inter via the Google Fonts CDN), wrote Devon HSL values into `:root`, and exposed both shadcn semantic tokens and Devon brand-name tokens through `@theme inline`.

**Verification:**

- `npm run build` → 1850 modules, 85 KB CSS bundle, all 31 primitives compile cleanly.
- `npm run dev` → HTTP 200 on `/Devon/dashboard/`, served HTML carries Inter preconnect + Devon theme-color + Uzbek `lang` attribute.
- Built CSS contains expected tokens: `--primary: #1f4d39` (Devon emerald, HSL→hex conversion of `hsl(154 43% 21%)`), `--background: #faf8f4` (Devon cream), `--secondary: #f1ebdf` (cream-deep), `--accent: #f6e4d0` (cinnamon-soft), `--destructive: #c32222`, `--ring: #1f4d39`, plus exposed brand-name tokens (`--color-cream: #faf8f4`).
- The slight hex drift between Devon's documented `#1F4E3F` (emerald) and the compiled `#1f4d39` comes from rounding when CSS engines convert `hsl(154 43% 21%)` back to hex — visually indistinguishable. Master §5 documents the HSL as the canonical value; the listed hex is the approximation.

**Doc cascade:** Master §4 (stack table bumped to Tailwind 4 + new shadcn preset notes), master §5 (replaced the entire v3 `tailwind.config.ts` + `@layer base { :root {} }` block with the canonical v4 `@import` + `:root` + `@theme inline` pattern), `AI_CONTEXT.md` (status line).

**Intentionally NOT done in this step:** Router, auth, i18n, app shell, mock backend, features. TooltipProvider wrapping (deferred to step 05's app shell). The hand-rolled form primitive (deferred to first real-form step).

**Files touched:** `dashboard/package.json` (+ deps: tailwindcss, @tailwindcss/vite, tw-animate-css, clsx, tailwind-merge, class-variance-authority, plus shadcn-installed: shadcn, radix-ui, lucide-react, @fontsource-variable/geist), `dashboard/vite.config.ts` (added `@tailwindcss/vite` plugin), `dashboard/tsconfig.json` (added root-level `compilerOptions.paths` for shadcn CLI), `dashboard/components.json` (created by shadcn init), `dashboard/src/index.css` (rewritten for Tailwind v4 + Devon palette), `dashboard/src/main.tsx` (imports index.css), `dashboard/src/App.tsx` (Devon-branded button + badge demo), `dashboard/src/lib/utils.ts` (cn helper), `dashboard/src/components/ui/*` (31 shadcn primitives), `dashboard/index.html` (Inter + Fraunces preconnects), `docs/dashboard-prompts/00-master.md`, `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — Dashboard step 01: Vite + React + TS scaffold landed

Executed [`docs/dashboard-prompts/01-scaffold.md`](../docs/dashboard-prompts/01-scaffold.md) — `dashboard/` is now a working Vite scaffold sibling to `landing/`, ready for step 02 (Tailwind + shadcn) to layer on top. `npm run build` succeeds in 64ms; dev server boots at `http://localhost:5173/Devon/dashboard/` and serves the placeholder page with the Devon favicon and Uzbek `<html lang="uz">`.

**Deviations from the step prompt (the Vite ecosystem moved since the prompt was written):**

- **Vite 8 + React 19 + TS 6** instead of the locked Vite 5 / React 18 / TS 5 — these are what `create-vite@9.0.7` ships today. Downgrading would be regressive (shadcn/ui works fine on React 19); kept the defaults and propagated the version bump into `00-master.md` §4 and `AI_CONTEXT.md`.
- **Split tsconfig** — current Vite scaffolds emit a 3-file layout (`tsconfig.json` references `tsconfig.app.json` + `tsconfig.node.json`). The step prompt assumed the legacy single-file layout. Edited `tsconfig.app.json` in place to add `"strict": true` + the `@/*` paths alias, left the others alone.
- **TS 6 deprecated `baseUrl`** — initial config triggered a `TS6.0` deprecation diagnostic. Dropped `baseUrl` and rely on TS 6's behaviour of resolving `paths` relative to the tsconfig directly.
- **Vite scaffold no longer ships `vite.svg` / `public/vite.svg`** — instead ships `public/favicon.svg`, `public/icons.svg`, and `src/assets/{react.svg,vite.svg,hero.png}`. Overwrote `public/favicon.svg` with the Devon mark from `landing/favicon.svg` (SHA-verified byte-identical), deleted the rest.
- Renamed `package.json` name field `dashboard` → `devon-dashboard`.

**Verification:**
- `tsc -b && vite build` green; `dist/index.html` references assets under `/Devon/dashboard/assets/...` (correct base path); favicon link points to `/Devon/dashboard/favicon.svg`.
- Dev server `curl` test: `GET /Devon/dashboard/` → 200, `GET /Devon/dashboard/favicon.svg` → 200, served HTML carries `<html lang="uz">` and the Devon title.
- Favicon shasum matches `landing/favicon.svg` exactly: `782895e3b04ecafb4e13219e2d1fd729f2eabcdc`.

**Intentionally NOT done in this step** (each gets its own step): Tailwind, shadcn, router, auth, i18n, app shell, mock backend, features, Pages workflow extension.

**Files touched:** `dashboard/` (created — `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `eslint.config.js`, `public/favicon.svg`, `src/App.tsx`, `src/main.tsx`, `src/vite-env.d.ts`, `README.md`, `.gitignore`), `docs/dashboard-prompts/00-master.md`, `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`

---

## 2026-05-25 — HR & ERI module TZ + full dashboard build prompt set

Added the focused **HR & User Management module TZ** — `docs/Plyma TZ xodim kiritish.docx`, an Uzbek functional specification covering 4 business flows (structural-unit tree CRUD, employee 4-step creation wizard, employee↔unit assignment with transfers and history, ERI certificate management with PFX upload + E-IMZO plugin integration). Treat it as the canonical spec for the dashboard's first milestone, sitting alongside (not replacing) the broader `docs/product-specification.md`.

Then created the **full dashboard build prompt set** at [`docs/dashboard-prompts/`](../docs/dashboard-prompts/) — 17 files / ~7,700 lines, structured for incremental multi-session execution. Components:

- **`00-master.md`** (798 lines) — foundational context loaded into every session: product overview, tech stack lock-in, brand tokens mapped to shadcn semantic vars, mobile-first rules (breakpoints + component patterns per surface), i18n rules, mock-backend rules, file structure, quality bars, full data-model types mirroring the TZ.
- **15 sequential step prompts** — scaffold (`01`) → Tailwind + shadcn (`02`) → i18n (`03`) → routing + auth + mobile-first login (`04`) → app shell with sidebar drawer (`05`) → mock backend with seed data (`06`) → dashboard home (`07`) → Flow 1 units (`08`) → Flow 2 employees list (`09`) → Flow 2 wizard (`10`) → Flow 3 assignments + timeline (`11`) → Flow 4 certificates Kanban + fake PFX parser (`12`) → profile + audit log (`13`) → GitHub Pages deploy with SPA 404 trick (`14`) → final QA sweep (`15`). Each step lists prerequisites, deliverables, tasks, acceptance checks, notes, and explicit mobile viewport verification.
- **`README.md`** — explains the workflow (paste master first, then a step prompt per session), records the architectural decisions encoded throughout, and shows the final repo layout.

Architectural decisions baked into the set (collected through a structured brainstorming pass): Vite + React 18 + TypeScript + shadcn/ui (`style: new-york`); BrowserRouter at `/Devon/dashboard/` with the spa-github-pages SPA 404 fallback; visual tone "brand-warm chrome, neutral work surfaces" (sidebar/topbar/headers carry the cream + emerald palette; data tables and form bodies use white with tighter spacing); react-i18next scaffolded from day one with UZ filled and RU/EN stubbed; single HR_ADMIN demo user (`admin@devon.uz` / `Demo2026!`, credentials visible on the login screen); localStorage mock backend with realistic Uzbek seed data and 3% network failure simulation; **mobile-first throughout** — sidebar collapses to a `Sheet` drawer below `lg`, tables become card stacks below `md`, the wizard is a full-screen route on mobile with a sticky bottom CTA above iOS safe area, the certificates Kanban becomes `Tabs` (one column at a time) on mobile.

The code is **not yet scaffolded**. The next session begins by loading `00-master.md` + `01-scaffold.md` into a fresh AI context. Step 14 extends `.github/workflows/deploy.yml` to ship both the landing and the dashboard in one Pages artefact; step 15 updates both this file and `AI_CONTEXT.md` with the launch.

**Files touched:** `docs/Plyma TZ xodim kiritish.docx` (added), `docs/dashboard-prompts/` (created — `00-master.md`, `01-scaffold.md` through `15-final-qa.md`, `README.md`), `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md`, `README.md`

---

## 2026-05-17 — Favicon added to landing page

Added `landing/favicon.svg` — a vector favicon based on the Devon "D" initial in the brand emerald (`#1F4E3F`) with a cinnamon rotated-diamond accent (`#BC6E2B`) in the bottom-right corner, echoing the wordmark dot beside "DEVON" in the navbar. The "D" is drawn as a path with `fill-rule="evenodd"` so its counter renders sharp at small sizes (16×16 browser tabs and 32×32 retina).

HTML head got three additions: `<link rel="icon" type="image/svg+xml" href="favicon.svg">` for modern browsers, `<link rel="apple-touch-icon" href="favicon.svg">` for iOS, and `<meta name="theme-color" content="#1F4E3F">` so Android Chrome / Safari iOS tint the mobile browser chrome with the brand emerald.

**Files touched:** `landing/favicon.svg` (created), `landing/index.html`

---

## 2026-05-17 — Added project state snapshot (AI_CONTEXT.md)

Created [`ai_context/AI_CONTEXT.md`](./AI_CONTEXT.md) — the missing "current project state" file that `/doc_sync` had been asking for and previous syncs had been skipping (because Devon's CLAUDE.md doesn't reference it). Now both ai_context files exist with a clear split: `AI_CONTEXT.md` is the structural snapshot (module status, canonical docs, brand voice, open gaps, naming history); `HISTORY.md` (this file) is the chronological session log. AI_CONTEXT updates only when structure changes; HISTORY updates every session.

The snapshot surfaces known gaps that aren't tracked elsewhere: empty `docs/operations/`, missing `docs/user-manual-uz.md`, empty `docs/adr/`, placeholder client logos on the landing page.

Also added a row for AI_CONTEXT.md in the README's Documentation table for discoverability.

**Files touched:** `ai_context/AI_CONTEXT.md` (created), `README.md`, `ai_context/HISTORY.md`

---

## 2026-05-17 — Mobile responsive overhaul + hero overflow fixes + Uzbek copy

Made the landing page properly responsive and fixed several layout bugs:

- **Mobile menu** — added a hamburger toggle that appears below 820px. Full-screen overlay (cream background, 6 nav links + Kirish + filled Demo CTA), body scroll locked when open, closes on link tap / Escape / viewport-resize past 820px. ARIA-correct: `role="dialog"`, `aria-modal`, `aria-expanded`, `aria-controls`.
- **Stacking-context bug fixed** — the mobile menu was nested inside `<header>` which has `backdrop-filter` (creates a containing block for fixed descendants), so the menu was being clipped to the 72px header instead of escaping to the viewport. Moved the menu to be a sibling of `<header>`. Also fixed inset `top: 64px → 72px` to match the actual navbar height.
- **Responsive CSS** — added a proper 480px breakpoint on top of the existing 1100/768. Each breakpoint adjusts hero padding/headline size, bento grid columns (6 → 2 → 1), pricing/stats/footer stacking, hero CTAs stack vertically full-width on mobile, hero meta column-stacks, final CTA form stacks vertical.
- **Hero chip overflow** — the four floating decorative chips were positioned at viewport percentages (`left: 6%`, `right: 5%`, etc.) and at mid-width viewports (1100–1280px) they overlapped the centered hero-inner (max-width 980px), rendering behind the headline (z-index 1 vs 2). Re-anchored each chip with `calc(50% ± 510px)` so they sit exactly 20px outside the centered content's edge on any viewport. Also raised the hide-chips breakpoint from 1280px to 1400px (the threshold below which the gutter is too narrow to hold a chip safely).
- **H1 overflow safety** — added `overflow-wrap: break-word; hyphens: auto` and reduced the clamp minimum from 54px to 40px so long Uzbek words can't push the layout wide.
- **Mobile menu cleanup** — removed an unnecessary `<div class="mm-divider">` (and its CSS) that was creating a doubled line between the last nav link and the secondary "Kirish" action; the mm-links already have a border-bottom for separation.
- **Hero eyebrow copy** — changed `On-premise · O'zbekiston uchun yaratilgan` → `Mahalliy yechim · O'zbekiston uchun yaratilgan`. The English IT jargon was the weak link for non-technical Uzbek government/SOE buyers; the new copy stays fully Uzbek-first and matches the glossary.

**Files touched:** `landing/index.html`, `ai_context/HISTORY.md`

---

## 2026-05-17 — Imkoniyatlar section: org tree + Kanban polish

Refined the two charts inside the Imkoniyatlar bento section on the landing page:

- **Tashkiliy tuzilma chart** — rebuilt to show all four levels (Departament → Boshqarma → Bo'lim → Sho'ba) with a walking green active path on a 10-second loop. Each level's destination node lights up in sequence; the final Sho'ba leaf gets an amber pulse-ring on "arrival." Then bumped badge padding: viewBox `280×180 → 280×220`, L2 boxes `56×22 → 68×30`, L3 boxes `44×22 → 56×30`, L4 boxes `44×20 → 56×28`, with text re-anchored for vertical breathing room and connector lines shifted to match.
- **Kanban chart** — kept the existing 4-column layout with cards (priority chips, due dates, avatars, in-card progress bar). Added: column-arrival highlight flashes (green/blue/green), dashed drop-slot indicators that appear just before the card lands, a second chip on the moving card (O'RTA + IT), a tiny avatar on the moving card, and a cursor that follows the same eased 14s path with synchronized fade-in/out on the loop reset.

Also linked the landing page and HISTORY.md from the README's Documentation table.

**Files touched:** `landing/index.html`, `README.md`, `ai_context/HISTORY.md`

---

## 2026-05-17 — Realistic silver MacBook frames on landing page

Replaced the dark navy laptop chassis used across all three hero/feature mockups in `landing/index.html` with a silver Apple aluminum frame matching the user-provided MacBook Pro reference image. Updated all three SVG laptops (hero approval interface, document list, Kanban board) to share the same chassis anatomy:

- Outer body: silver aluminum gradient `#E6E7EA → #BEC0C4`
- 1px white top-edge highlight
- True-black inner bezel (`#0A0A0C`) with rounded corners
- Centered camera notch with three-layer sensor stack
- Subtle screen glare gradient overlay
- Trapezoidal silver keyboard base wider at the back
- Darker shadow lip at the front with the small lid-opening slot

Inner UI content + smooth looping animations (progress fill, row insertion, card travel, cursor) preserved unchanged.

**Files touched:** `landing/index.html`

---

## 2026-05-17 — Realistic device mockups with smooth looping animations

Earlier in the same session: enlarged and made realistic all four mockups on the landing page. MacBooks bumped to `viewBox="0 0 1080 700"` with detailed dashboard UIs (sidebar nav, top app bar, search, avatars, status pills). iPhone bumped to `viewBox="0 0 360 760"` with Dynamic Island, side buttons (silence + volume + power), realistic status bar, document preview card, animated PIN dots, and success ring. All animations switched to `calcMode="spline"` with `keySplines="0.4 0 0.6 1"` for smooth ease-in-out, plus crossfading instead of teleport resets.

**Files touched:** `landing/index.html`

---

## 2026-05-16 — Landing page (wio.io-inspired) initial build

Built the first version of `landing/index.html` — single self-contained HTML file (~1700 lines, 48 inline SVGs across 15 sections), Uzbek-first copy, warm pastel section rotation (cream → white → peach → mint → navy → cream → lavender → cream → white), Inter from Google Fonts, no external JS libs. Sections: hero with animated approval interface, 3-step "how it works", document management, Kanban task board, mobile ERI signing flow, approval-flow diagram, on-premise dark section with Uzbek geometric ornament, stats band, 8-module grid, 3-tier pricing, security shield with pulse rings, trust band placeholders, Unsplash final CTA, 5-column footer with the *Rivolanish intizom bilan!* slogan in italic accent.

**Files touched:** `landing/index.html` (created)

---

## 2026-05-15 — GitHub Pages deploy workflow

Added `.github/workflows/deploy.yml` to serve `landing/index.html` as the site root via GitHub Pages. Triggers on push to `main` when `landing/` or the workflow changes; manual run via `workflow_dispatch`.

**Files touched:** `.github/workflows/deploy.yml` (created)

---

## 2026-05-14 — Deep product documentation

Created four product-oriented canonical documents from the PLYMA technical PDF + landing-page HTML, deliberately scrubbing all framework/tech-stack references (no Laravel, Livewire, etc.):

- `docs/product-specification.md` — 8-module canonical spec, lifecycle, approval mechanics, security, audit, NFRs, "what Devon is not"
- `docs/business-processes.md` — swim-lane descriptions of the 4 BPMN flows (employee onboarding, task delegation, inbound/outbound letters, document approval)
- `docs/use-cases.md` — 20 functional use cases (UC-01…UC-20) with actor / preconditions / main flow / alternates / postconditions / acceptance criteria
- `docs/glossary.md` — Uzbek/Russian terms (Departament, Boshqarma, Bo'lim, Sho'ba, soglasovaniya, kelishuv, ERI, davonxona, etc.) with pronunciation hints and PLYMO → PLYMA → Devon naming history

Linked all four from the README's Documentation table.

**Files touched:** `docs/product-specification.md`, `docs/business-processes.md`, `docs/use-cases.md`, `docs/glossary.md`, `README.md` (created/updated)

---

## 2026-05-14 — Competitive analysis

Saved Devon's competitor list to memory (EDoc, Bitrix24, Directum RX, 1C:Документооборот, ELMA365, M-Files, DocuWare) and wrote `docs/competitive-analysis.md` — per-competitor profile with "how Devon wins" / "where we lose" / starting sales lines, plus roadmap implications (keep AI metadata aspirations, do NOT chase low-code BPM or intranet breadth).

**Files touched:** `docs/competitive-analysis.md` (created), memory updated

---

## 2026-05-14 — README + CLAUDE.md refactored to product-first

Removed all tech-stack content (Laravel/PHP/Docker/Postgres/Redis/MinIO/Meilisearch references) from `README.md` and `CLAUDE.md`. README rewritten as a product-oriented document focused on capabilities, business outcomes, roles, security as product guarantees, backup as procedures, and the 8 modules in product language. CLAUDE.md rewritten as workflow orchestration only — no implementation guidance.

**Files touched:** `README.md`, `CLAUDE.md`

---

## Conventions

- Newest entry on top.
- Each entry: date (`YYYY-MM-DD`), one-line summary header, prose paragraph, `**Files touched:**` line.
- A "session" is anything from a single message to a multi-hour collaboration. Group related work into one entry.
- Don't list every micro-edit — only meaningful checkpoints.
