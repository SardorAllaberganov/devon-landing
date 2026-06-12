# STEP 22 — M2 wrap-up: home integration, doc cascade, QA sweep

## Prerequisite

Steps 16–21 complete: both M2 flows fully walkable via POV switching; all six new routes live.

## Goal

Integrate milestone 2 into the dashboard home, run the milestone QA sweep (the step-15 playbook scoped to the new surfaces), and complete the doc cascade so code, docs and prompts don't drift.

## Deliverables

- `src/features/dashboard-home/` — M2 stat cards, quick actions, alert
- QA fixes from the sweep (inline, like step 15)
- `dashboard/QA_NOTES.md` — M2 section (automated results + observational checklist for the human operator)
- Doc cascade edits (see Task 4)

## Tasks

### 1. Home page integration

- `StatsRow`: extend to a responsive 2×3 / 3×2 grid. New cards (computed for the **acting persona**): **Kelishuv kutilmoqda** (my pending decisions+signatures count → links `/approvals`, cinnamon tone) · **Hujjatlar** (total non-draft documents → `/documents`) · **Muddati o'tgan xatlar** (overdue letters count → `/letters?overdue=1`, destructive tone when > 0). Keep the four M1 cards; if six feels crowded at `lg`, drop "Tasdiqlash kutilmoqda" (certs) into the same card as ERI or rotate — decide and note it.
- `QuickActions`: add **Hujjat yaratish** (step 18 tile if not already), **Xat ro'yxatga olish** (Devonxona persona only).
- New `PendingApprovalsAlert` beside `ExpiringCertsAlert`: when the acting persona's approvals queue is non-empty, a cream-warm banner "Sizni N ta hujjat kutmoqda" → `/approvals`. Null-rendered when empty (ExpiringCertsAlert convention).
- `RecentActivityCard`: extend the `ACTION_ICON` map with all M2 audit actions (documents: FilePlus/FileCheck/FileX/PenLine/FileCheck2/Mail/Eye · letters: Inbox/ArrowRightLeft/UserPlus/Send/ShieldCheck etc. — pick lucide icons consistent with the step-13 audit map and reuse THAT map — both surfaces must stay in sync; extract to a shared `audit-icons.ts` if they've diverged).
- `/audit` filter dropdown: add `document` and `letter` resource types.

### 2. i18n audit (automated)

Re-run the step-15 grep battery over the new feature folders:

- No Cyrillic literals outside locale files; no `toast.<level>("literal")`; no raw JSX text (excluding `sr-only` + brand wordmarks).
- All 13 `NotificationType` title keys exist in `uz.json` and interpolate without leftovers (`{{` absent from rendered output — spot-check via dev).
- Every `DocumentValidationCode` + `LetterValidationCode` has a `*.errors.*` key.
- No `PLYMA` / `PLYMO` strings in user-facing copy.

### 3. QA sweep (automated portion)

- `npm run build` — record module count, CSS/JS sizes, gzip; target stays **< 500 KB gzipped**. If the M2 additions push past ~350 KB gzip, log a code-splitting note in `QA_NOTES.md` (lazy-route `documents`/`letters` features are the natural seams) — do not implement splitting in this step.
- Dev-server route sweep: all 15 routes 200, zero console errors/warnings.
- Forced-failure pass: with `maybeFail` raised temporarily to 100 %, every M2 mutation surfaces a toast + recoverable state (no stuck dialogs/spinners). Restore 3 %.
- State-machine conformance: grep the UI for status strings — every literal must be a member of `DocumentStatus` / `ApprovalDecision` / `LetterStatus` (no invented states — master §15 rule).
- Update `dashboard/QA_NOTES.md`: M2 section with results + the observational checklist (six viewports, Lighthouse, real device, keyboard-only document approval, print stylesheet check) for the human operator.

### 4. Doc cascade (CLAUDE.md discipline — same PR)

- `README.md` (repo root): demo scope line gains flows 5–6; roadmap reflects M2 shipped-in-demo.
- `docs/product-specification.md`: confirm §Document Management / §ERI / §Approval Workflow / §Letters capability lists match what the demo actually shows; fix drift, don't add scope.
- `docs/business-processes.md`: BP-3/BP-4 sections get a "Demo" line linking the routes; verify the BP-3 state list still matches `LetterStatus` (it was extended in the M2 planning session — keep aligned).
- `docs/use-cases.md`: UC-03/04/05/06/09/10 get a demo-coverage note.
- `ai_context/AI_CONTEXT.md` + `ai_context/HISTORY.md`: snapshot + session entry (the established per-step rhythm).
- `docs/dashboard-prompts/README.md`: mark steps 16–22 status if the table tracks it.

### 5. Deploy

No workflow changes expected — the step-14 pipeline ships whatever `npm run build` produces. After the user pushes (they run `/commit` and push themselves — never commit for them), verify on the live URL: deep-link `/devon-landing/dashboard/documents` hard-refresh works (the 404 trick is path-agnostic), reseed banner-free boot, POV walk on a real phone.

## Acceptance checks

- [ ] Home shows persona-aware M2 stats; switching POV changes the counts; alert banner appears for a persona with pending approvals.
- [ ] Audit page filters by `document`/`letter` and renders M2 icons.
- [ ] i18n battery clean; build size recorded; route sweep zero-warning.
- [ ] Forced-failure pass: no unrecoverable UI state found (or all found ones fixed inline + listed).
- [ ] `QA_NOTES.md` M2 section complete with observational checklist handed to the operator.
- [ ] Doc cascade lands in the same change-set; cross-references resolve.

## What "done" looks like

Milestone 2 is demo-complete per the master quality bar: a stakeholder lands on home, is told what's waiting for them, walks a document through kelishuv + ERI and a letter through the Devonxona pipeline on a phone, and every doc that describes Devon agrees with what they just saw.
