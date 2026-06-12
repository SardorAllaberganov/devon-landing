# STEP 18 — M2 Flow 5 UI part A: documents registry + creation wizard

## Prerequisite

Steps 16–17 complete: POV switcher + notifications live; the documents domain (templates, documents, approvals, signatures) is seeded and the typed API works from the console. `/documents` currently renders the step-16 placeholder.

## Goal

Ship the two entry surfaces of BPMN 3.4: the **documents registry** at `/documents` and the **creation wizard** at `/documents/new` (BPMN steps 3–9: choose type → fill metadata/content → optional kelishuv participants → review → create/submit). Detail page + approval actions are step 19 — a created document only needs to land in the registry with the right status here.

## Deliverables

- `src/features/documents/DocumentsPage.tsx` + `registry/DocumentsTable.tsx`, `registry/DocumentsCardsMobile.tsx`, `registry/DocumentFilters.tsx`
- `src/features/documents/wizard/` — `DocumentWizardPage.tsx`, `Step1Type.tsx`, `Step2Content.tsx`, `Step3Approvers.tsx`, `Step4Review.tsx`, `document.schema.ts`, `doc-wizard-store.ts`
- Router: `/documents` replaces the placeholder (under `Protected`); `/documents/new` under `ProtectedNoShell`
- `uz.json` — `dashboard.documents.*` (registry + wizard key groups)

## Tasks

### 1. DocumentsPage — registry with tabs

Underline tabs (use the existing `TabLabel` component — it prevents the bold-width shift):

| Tab | Feed |
|---|---|
| **Mening hujjatlarim** | `listDocuments({ creatorUuid: acting.uuid })` |
| **Menga kelgan** | `listDocuments({ recipientUuid: acting.uuid })` (non-DRAFT only) |
| **Kelishuvda** | `listDocuments({ status: 'IN_REVIEW' })` where the acting persona appears in the current round (compose client-side from `listMyApprovals` + creator's own IN_REVIEW docs) |
| **Arxiv** | `listDocuments({ archivedOnly: true })`, **grouped by `archivedAt` day** with a date subheader per group — this is the §2.2 daily-archive surface; subtitle copy explains "Imzolangan hujjatlar har kuni kun yakunida arxivlanadi" |

- All tabs re-evaluate when POV switches (subscribe to `actingAsEmployeeUuid`).
- `PageHeader` with title + primary CTA **"Hujjat yaratish"** → `/documents/new`.
- Filters row: `SearchInput` (number + title) + status `Select` (statuses from master §15 — labels via `StatusBadge`). Mobile: filters in the bottom-sheet pattern from step 09.
- Desktop `md+`: shadcn `Table` — Raqam · Sarlavha · Turi (template name or "Yuklangan fayl") · Yaratuvchi · Holat (`StatusBadge`) · Sana. Row click → `/documents/:uuid`.
- `<md`: card stack, 64 px+ tap targets, same fields condensed.
- `StatusBadge` gains the new kinds: `DRAFT` exists; add `IN_REVIEW` (cinnamon-soft), `SIGNED` (emerald-soft), `CLOSED` (muted). `APPROVED` / `REJECTED` kinds already exist.
- Empty/loading/error states via the existing common components; `Pagination` at 20/page.

### 2. Wizard chrome

`DocumentWizardPage` clones the employee-wizard shell (step 10): full-screen on mobile with sticky `pb-safe` footer, centred card on desktop, `WizardStepper`-style pill header, `<form id="doc-wizard-step-N">` + `<Button form=...>` external-submit pattern, zustand `doc-wizard-store.ts` for in-flight state, X-to-abandon with confirm dialog when dirty.

### 3. Step 1 — Turi (BPMN 4–5)

- Toggle between two sources (RadioGroup, 2 large cards): **Shablon asosida** / **Tayyor faylni yuklash**.
- TEMPLATE: template gallery — one card per seeded template (`listDocumentTemplates`), name + description + field count; selecting highlights it.
- UPLOAD: file picker, reuse the `OrderExtractField` pick-time validation pattern (PDF/DOC/DOCX, ≤ 10 MB, metadata-only `FileMeta` — no bytes); show the picked-file chip with `formatBytes` from `src/lib/format.ts`.

### 4. Step 2 — Mazmun (BPMN 6)

- Common metadata: Sarlavha (text, required) · **Kimga** (recipient — employee `Combobox`) · **Kim imzolaydi** (optional signer `Combobox` with a "ERI imzo talab qilinmaydi" empty option — drives the BPMN 11.1/11.2 branch) · Maxfiylik (`ODDIY`/`MAXFIY` Select, display-only field).
- TEMPLATE source: render one input per `TemplateField` (`text` → Input, `textarea` → Textarea, `date` → date input, `employee` → Combobox). Below the fields, a **live A4 preview** card running `renderTemplate` on every change (unfilled fields show `«—»`).
- UPLOAD source: show the file chip from step 1 + metadata fields only.
- zod schema in `document.schema.ts`: required title/recipient; per-field required flags from the template definition (build the schema dynamically from `fields`).

### 5. Step 3 — Kelishuv varaqasi (BPMN gate + step 7)

- Switch: **"Kelishuv varaqasi kerakmi?"** (defaults on). Off → step shows an explanation line and is skippable (BPMN "Yo'q" path).
- On: ordered participant list builder — employee `Combobox` to add (exclude creator + duplicates), each row shows order number, FIO, position, with **up/down reorder buttons** and remove (no DnD — master §17). Minimum 1 participant to proceed.
- Info banner: "Kelishuv ketma-ket boradi — har bir ishtirokchi o'z navbatida tasdiqlaydi" (sequential-only disclosure).

### 6. Step 4 — Ko'rib chiqish

- Summary cards (wizard-step-10 pattern, Edit → jump): Turi va mazmun · Qatnashchilar (ordered list or "Kelishuvsiz") · Kimga/Kim imzolaydi.
- Two submit actions in the sticky footer:
  - **"Qoralama sifatida saqlash"** → `createDocument` only → toast → `/documents` (Mening hujjatlarim).
  - **"Kelishuvga yuborish"** → `createDocument` + `submitDocumentForReview` → toast → `/documents/:uuid`.
- Map `DocumentValidationError` codes to `dashboard.documents.errors.*` toasts; `MockNetworkError` → existing network toast + the draft stays in the store (retryable).

### 7. Sidebar + home quick action

- The step-16 "Hujjatlar" nav item now points at the real page (remove placeholder route).
- Add a "Hujjat yaratish" tile to the home `QuickActions` grid (full home integration happens in step 22; just the tile here).

## Acceptance checks

- [ ] `npm run build` clean; `/documents` and `/documents/new` return 200 in the dev-server sweep.
- [ ] Wizard as XODIM persona: template path → live preview updates per keystroke → 2 participants → "Kelishuvga yuborish" → registry shows IN_REVIEW; switch POV to the order-1 participant → it appears in their Kelishuvda tab (and bell, via step 17's notification).
- [ ] Upload path: oversize/wrong-format file rejected at pick-time with inline error; valid file shows chip with human-readable size.
- [ ] "Qoralama" path lands in Mening hujjatlarim as DRAFT.
- [ ] Kelishuv switch off skips step 3 and submit produces APPROVED directly (no-chain BPMN path).
- [ ] Arxiv tab groups the two seeded SIGNED + two CLOSED docs by day with date subheaders.
- [ ] 360 px: wizard steps scroll, stepper pills swipe (`.no-scrollbar`), sticky CTA above safe area; registry cards ≥ 64 px tap height.
- [ ] All copy via `uz.json` keys; no literals.

## Notes

- Do not build the detail page yet — registry row clicks may 404 to the step-16 placeholder until step 19; note it in the session summary.
- The dynamic zod schema from `TemplateField[]` is the only novel pattern in this step; keep it in `document.schema.ts` with a comment, and reuse the explicit `(v): boolean =>` annotation trick from `employee.schema.ts` if a refine trips TS inference (see HISTORY 2026-06-11).

## What "done" looks like

A salesperson can: switch to Xodim POV → create a Buyruq from a template with a live preview → route it through a 2-person kelishuv → see it sitting in IN_REVIEW in the registry — all on a phone screen.
