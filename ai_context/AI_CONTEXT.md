# Devon — Project State Snapshot

> **What this file is.** A single-page current-state snapshot of Devon: what it is, what's done, what's in flight, where the canonical docs live, and the cultural/language defaults future sessions should respect. Updated on every `/doc_sync`. Pair with [`HISTORY.md`](./HISTORY.md), which is the chronological log of how we got here.

---

## What Devon is

**Devon** — on-premise corporate platform for digitizing internal document workflows in Uzbek organizations. Replaces paper-based "soglasovaniya" (collaborative approval) with a fully digital, auditable system. Codename **PLYMA** in earlier specs; **PLYMO** before that. The product is the same; the name evolved.

- **Audience:** Government bodies, state-owned enterprises, banks, holding companies, ministries — 50+ employees, hierarchical structure, existing paper workflow.
- **Deployment:** Fully on-premise (data sovereignty is a hard constraint).
- **Languages:** Uzbek-first. Russian and English are secondary / planned.
- **Roles:** Super Admin · Department Head · Employee.
- **Org hierarchy (canonical, 4 levels):** Departament → Boshqarma → Bo'lim → Sho'ba.

---

## Module status (v1.0 — ships with 8 modules)

| # | Module | Status |
|---|---|:---:|
| 1 | User & Authentication | ✅ in v1.0 spec |
| 2 | Document Management | ✅ in v1.0 spec |
| 3 | Electronic Digital Signature (ERI) | ✅ in v1.0 spec |
| 4 | Approval Workflow ("List soglasovaniya") | ✅ in v1.0 spec |
| 5 | Task Delegation (Kanban) | ✅ in v1.0 spec |
| 6 | Organizational Structure | ✅ in v1.0 spec |
| 7 | Integration & Export | ✅ in v1.0 spec |
| 8 | Incoming/Outgoing Letters | ✅ in v1.0 spec |

All eight are specified in [`docs/product-specification.md`](../docs/product-specification.md). "Spec'd" ≠ "shipped" — engineering implementation is separate from this doc set.

### Roadmap

| Release | Scope |
|---|---|
| **v1.0 (current spec)** | All 8 modules above, Uzbek UI only |
| **v1.1 (planned)** | Russian-language UI, mobile-responsive refinement, throttling/rate limiting |
| **v1.2 (planned)** | 2FA, advanced reporting dashboard, SSO (enterprise) |
| **Post-v1.2** | Native mobile apps, AI-assisted document classification, e-gov integrations |

---

## Canonical documents — where each truth lives

| Topic | File | Audience |
|---|---|---|
| Product overview, modules, roles, roadmap | [`README.md`](../README.md) | All stakeholders |
| **Product specification (canonical)** | [`docs/product-specification.md`](../docs/product-specification.md) | Product, BA, Eng, QA, Sales |
| **HR & ERI module — focused TZ (Uzbek)** | [`docs/Plyma TZ xodim kiritish.docx`](../docs/Plyma%20TZ%20xodim%20kiritish.docx) | Product, BA, Eng, QA — canonical spec for the dashboard's first milestone |
| Business processes (swim-lane flows) | [`docs/business-processes.md`](../docs/business-processes.md) | BA, QA, customer implementation |
| Functional use cases (UC-01 … UC-20) | [`docs/use-cases.md`](../docs/use-cases.md) | QA, BA, Product |
| Glossary (Uzbek/Russian terms, pronunciation, naming history) | [`docs/glossary.md`](../docs/glossary.md) | Non-Uzbek-speaking team members |
| Competitive analysis & positioning | [`docs/competitive-analysis.md`](../docs/competitive-analysis.md) | Sales, Product, BA |
| Marketing landing page (Uzbek) | [`landing/index.html`](../landing/index.html) | Marketing, Sales, Web |
| **Dashboard build prompt set** | [`docs/dashboard-prompts/`](../docs/dashboard-prompts/) | AI assistants and contributors building the SPA — master prompt + 15 sequential step prompts |
| Workflow orchestration (how to work on Devon) | [`CLAUDE.md`](../CLAUDE.md) | AI assistants, contributors |
| Legacy technical spec (reference only) | `docs/Plyma_Technical_Spec_v1.0.docx` | Historical reference |
| Session work log | [`ai_context/HISTORY.md`](./HISTORY.md) | Internal, contributors |
| Build lessons (decisions future sessions must respect) | [`ai_context/LESSONS.md`](./LESSONS.md) | AI assistants, contributors |

**Source-of-truth rule:** if a `docs/` file conflicts with anything else (this file included), the doc wins — fix the doc first, then update derivative artifacts.

---

## Competitive landscape (snapshot)

Closest direct competitor: **EDoc** (`edoc.uz`) — same market, same e-imzo (ERI) requirement. Devon's differentiation against them: integrated experience (documents + signatures + approvals + tasks in one product), modern UI, audit completeness.

Broader alternative: **Bitrix24** — but only when the buyer's primary need is sales-team management with documents as a side feature. Devon is the opposite: documents-and-approval as the primary, with tasks adjacent.

International tier (M-Files, DocuWare): great products, no Uzbek presence, no e-imzo. Devon wins on local fit.

Full breakdown in [`docs/competitive-analysis.md`](../docs/competitive-analysis.md).

---

## Brand voice & language defaults

- **Uzbek-first in all customer-facing copy.** Don't ship `[NEEDS_TRANSLATION]` placeholders in Uzbek. Russian and English follow as translation passes.
- **The slogan** — *Rivolanish intizom bilan!* ("Development through discipline") — appears in the footer in italic accent colour.
- **No tech-stack mentions on the landing page or product docs.** No Laravel, Livewire, PostgreSQL, etc. The audience is decision-makers, not developers. Engineering details live in code and ADRs, not in README/landing/product-spec.
- **Use the project glossary** ([`docs/glossary.md`](../docs/glossary.md)) for terminology. Prefer `Ichki server` or `Mahalliy yechim` over `On-premise` in Uzbek copy. Prefer `Hujjat aylanmasi` over `Document flow`. Etc.

---

## Landing page — current state

`landing/index.html` is a single self-contained HTML file deployed via GitHub Pages (`.github/workflows/deploy.yml` and `static.yml`). Current state:

- **Visual style** — wio.io-inspired with warm pastel section rotation (cream → white → peach → mint → navy → cream → lavender). Inter + Fraunces from Google Fonts. No external JS libraries.
- **Brand assets** — `landing/favicon.svg` (vector "D" initial in emerald + cinnamon diamond accent, echoes the navbar wordmark). `theme-color` meta set to emerald `#1F4E3F` for mobile browser chrome tinting.
- **Device mockups** — silver MacBook Pro frames (matching the user's reference photo) used across hero, document list, and Kanban sections. Realistic iPhone 15 Pro frame for the ERI signing flow. All animations smoothly looped with `calcMode="spline"` + eased `keySplines`.
- **Imkoniyatlar (Features) bento section** — 6 bento cards. Two charts are richly animated:
  - **Tashkiliy tuzilma** — 4-level org tree (Departament → Boshqarma → Bo'lim → Sho'ba) with a walking active path that highlights each node in sequence, ending in an amber pulse-ring on the destination Sho'ba.
  - **Vazifa doskasi (Kanban)** — 4 columns, cards with priority chips/due dates/avatars, a card travels Col 1 → 4 with column-arrival flashes, dashed drop-slot, and a cursor following the path.
- **Mobile responsive** — hamburger menu below 820px (full-screen overlay outside `<header>` to avoid `backdrop-filter` stacking trap). Breakpoints at 1100/820/768/480.
- **Hero chips** — floating decorative cards anchored with `calc(50% ± 510px)` so they never overlap the centered headline; hidden below 1400px.
- **Hero copy** — eyebrow reads "Mahalliy yechim · O'zbekiston uchun yaratilgan" (was "On-premise · ..." until corrected for Uzbek-first feel).

---

## Dashboard — demo build (scaffold landed)

A customer-facing product demo, deployed alongside the landing page on GitHub Pages, is planned to ship in the same site:

- `<owner>.github.io/Devon/` → existing landing
- `<owner>.github.io/Devon/dashboard/` → React SPA covering the 4 flows from the HR & ERI TZ

**Scope** — full demo of all four flows: Tarkibiy bo'linmalar CRUD · Xodim 4-step wizard · Assignment transfers + timeline · ERI certificate management (Kanban + mocked PFX upload).

**Stack (locked)** — Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 (CSS-first config, no `tailwind.config.ts`) + shadcn/ui (v4 CLI: `--template vite --base radix --preset nova`) + react-router-dom v6 (BrowserRouter, `/dashboard/` sub-path, SPA 404 fallback) + Zustand + react-hook-form + zod + react-i18next + date-fns + lucide-react. (Originally locked to React 18 / TS 5 / Vite 5 / Tailwind 3; bumped to current ecosystem during steps 01–02.)

**Visual direction** — "brand-warm chrome, neutral work surfaces" — sidebar, top bar, page headers, hero stat cards inherit the cream + emerald palette from `landing/index.html`; data tables, form fields, wizard step content shift to white surfaces with tighter density. Devon's CSS tokens (`--cream`, `--emerald`, `--cinnamon`, `--signal`, etc.) map to shadcn's semantic vars (`--background`, `--primary`, `--accent`, …) so every primitive renders branded automatically.

**Mobile-first (non-negotiable)** — every screen tested at 360 / 390 / 768 / 1024 / 1280 / 1920px. Sidebar collapses to a `Sheet` drawer below `lg`. Data tables become card stacks below `md`. The employee creation wizard becomes a full-screen route on mobile with a sticky bottom CTA above the iOS safe area. The certificates Kanban collapses to `Tabs` (one column at a time) below `lg`.

**Auth model** — single HR_ADMIN demo user (`admin@devon.uz` / `Demo2026!`, credentials shown on the login screen). Other roles exist in the data model and seed data but aren't accessible via login in v1 of the demo.

**i18n** — react-i18next scaffolded from day one. UZ JSON populated; RU and EN files stubbed and rely on UZ fallback. v1.1 roadmap fills Russian.

**Mock backend** — there is no real server. All "API" calls hit a typed wrapper over `localStorage` with simulated 200–600ms latency and 3% random failure simulation. Seeded with ~6 root departments / 25 units / 30 employees with realistic Uzbek FIO / 25 certificates / 60+ audit entries. A "Reset demo" action in the user menu re-seeds cleanly.

**Status** — Build prompt set complete (17 files, ~7,700 lines in [`docs/dashboard-prompts/`](../docs/dashboard-prompts/)). **Steps 01–14 landed (2026-05-25 → 2026-05-27).**

**Foundation (steps 01–06):** scaffold · Tailwind v4 · shadcn/ui (31 primitives — `form` still missing from Nova preset, see open questions) · react-i18next (UZ canonical, RU/EN stubs) · react-router-dom v6 with `basename: /Devon/dashboard` · Zustand auth store · `RequireAuth` deep-link preserver via `?from=` · mobile-first split-pane login · AppShell (Sheet drawer on mobile, persistent 240 px column on `lg+`, full-width `<main>` per [`LESSONS.md`](./LESSONS.md)) · mock-backend foundation (zod schemas + namespaced `devon.dashboard.*` localStorage tables + 200–600 ms simulated latency + 3 % `maybeFail()` on mutations + a **versioned seed flag** — `SEED_VERSION = '3'`, bumped on any identity-changing seed edit so existing browsers re-seed silently on next load).

**Seed contents:** 25 units across the 4-level hierarchy · 30 employees with hand-crafted Uzbek FIOs (the HR_ADMIN is **Pulatov Asilbek Karimovich** as of the third rename today — credentials shown on the login screen stay `admin@devon.uz` / `Demo2026!`, hardcoded independent of FIO) · 30 primary assignments · 25 certificates in the 18 ACTIVE / 4 PENDING_APPROVAL / 2 EXPIRED / 1 REVOKED split · ~70 audit entries spanning 30 days · 14 positions. Auth store carries a `refreshSessionUser()` method called from [`main.tsx`](../dashboard/src/main.tsx) right after `seedIfEmpty()` — silently reconciles any persisted session's cached `fullName` against the freshly-seeded employee record so renames flow through without forcing logout.

**Dashboard home at `/` (step 07):** `PageHeader` greeting (`Salom, {firstName}!` parsed from the seeded `Surname Given Patronymic`) · null-rendered `ExpiringCertsAlert` (30-day horizon over ACTIVE certs) · 4-card `StatsRow` (Faol xodimlar · Tarkibiy bo'linmalar · Faol ERI · Tasdiqlash kutilmoqda — tone rotation emerald → default → signal → cinnamon) · 4-up `QuickActions` grid · full-width `RecentActivityCard` sourced from `listAudit({ limit: 8 })` with lucide-iconed action tiles + localised verb forms (13 audit-action translations) + `formatRelative()` timestamps. Four reusable common state components shipped alongside: `LoadingState` / `EmptyState` / `ErrorState` / `StatCard`.

**Flow 1 at `/units` (step 08):** recursive desktop tree with **deep-descendant search highlight** (precomputed ancestor set from each hit's `path`, so a match five levels down auto-expands the entire chain) · 2-level mobile accordion · create/edit form via `Dialog`-on-desktop / bottom-`Sheet`-on-mobile (`ResponsiveDialog` helper) with `react-hook-form` + `zodResolver` · right-side `UnitDetailsSheet` (head-name resolved from `headEmployeeUuid` lookup, child counts live, action buttons stacked vertically to avoid cramping inside the 448 px drawer) · debounced search by name + code + shortName · status filter (ACTIVE default / ARCHIVED / ALL) · parent dropdown client-side-excludes self + descendants · type dropdown auto-snaps when parent change makes the current selection invalid · archive guard against non-terminated employees. Backed by hardened mock-backend mutations: `createUnit` / `updateUnit` enforce `MAX_UNIT_DEPTH = 7`, name-unique-within-parent (case-insensitive), cycle prevention via `path` traversal, full descendant path + level recompute when parent moves, all surfaced via a typed `UnitValidationError` with codes `cycle | duplicate-name | max-depth | invalid-parent` that the UI maps to `dashboard:units.errors.*` toasts. Three new reusable common components shipped here: `ResponsiveDialog` (Dialog ≥md / bottom-Sheet <md, with `gap-0 p-0` on the panel + explicit `p-6` header / `px-6 py-5` body / `px-6 pt-4 pb-safe` footer bands separated by borders — same pattern as the right-side `UnitDetailsSheet`, so future form sheets like the step-10 employee wizard inherit the padding for free) · `StatusBadge` (11 status kinds: ACTIVE / ARCHIVED / DRAFT / PENDING_APPROVAL / APPROVED / REJECTED / EXPIRED / REVOKED / SUSPENDED / TERMINATED / ON_LEAVE) · `SearchInput` (300 ms debounce).

**Cross-cutting polish landed alongside step 08:** shadcn `Input` / `SelectTrigger` / `Button` primitives bumped to `h-10` default (was `h-8`) for mobile-first 40 px touch targets and to fix a CSS-specificity trap where `SelectTrigger`'s `data-[size=default]:h-8` silently beat consumer `className="h-11"` overrides — every form control across the dashboard now aligns at 40 px without consumers needing to override; see [`LESSONS.md`](./LESSONS.md) "Form-control height" for the trap and [`LESSONS.md`](./LESSONS.md) "Bump `SEED_VERSION`" for the seed-versioning rule that backstops fixture renames.

**Flow 2 part A at `/employees` (step 09):** searchable + filterable + paginated employee list. shadcn `Table` on `md+` (FIO + email + avatar · Bo'linma · Lavozim · masked-grouped JSHShIR · status badge with hover-row highlight + click-to-`/employees/:uuid`) · card stack on `<md` with 64 px+ tap targets. Filter panel adapts: inline row on desktop, bottom-`Sheet` with draft state + Apply / Reset on mobile (using the band-padding pattern from yesterday's `ResponsiveDialog` fix — no `-mx-6 px-6` bleed-edge tricks). Position IDs resolve to localised names via `listPositions()` lookup. New reusable `Pagination` component (icon-sm prev/next + range text) used here and reusable from step 11 onwards. Backed by the existing `listEmployees({ search, unitUuid, status })` filters; `employmentType` filter + page slice handled client-side (cheap for the 30-employee demo).

**Flow 2 part B at `/employees/new` (step 10):** full-screen mobile / centred-card desktop wizard covering the 4-step employee creation flow from TZ §4.4. Steps: Shaxsiy (names + gender + birthDate + PINFL with live ✓/✗ dedup) → Aloqa (phones with auto-mask + corporate email with live dedup against `findUserByEmail`) → Ish o'rni (unit Combobox + type-filtered position Select + employment-type RadioGroup + hireDate + role) → Kirish (auto-derived login + `crypto.getRandomValues`-based 12-char password generator + Fisher-Yates shuffle + strength meter + copy/show-hide + notify-SMS/email checkboxes) → Ko'rib chiqish (4 summary cards, each with Edit→`setCurrent` jump). Submit calls `createEmployeeFull` which now enforces PINFL + corporate-email uniqueness (typed `EmployeeValidationError` with codes `pinfl-taken | email-taken`) and creates `Employee + User + Assignment + Audit` atomically. Each step is a `<form id="wizard-step-N">` + `<Button form="..." type="submit">` pattern (idiomatic react-hook-form, cleaner than imperative onValid callbacks). Route uses a new `ProtectedNoShell` wrapper that skips AppShell — the wizard renders its own chrome (top bar + stepper + sticky `pb-safe` footer).

**Shadcn `form` primitive finally landed in step 10** (`src/components/ui/form.tsx`), filling the gap from step 02's Nova-preset skip. Wizard fields use raw `register`+`setValue`+`watch` for compactness; the `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` wrappers are available for forms that benefit from them (nested arrays, dynamic field lists). New common `Combobox` component (Command-in-Popover desktop / Command-in-Sheet mobile) shipped here, reusable from step 11 onwards. `.no-scrollbar` utility added to `index.css` for the wizard stepper's horizontal pill scroll on mobile.

**Flow 3 at `/employees/:uuid` + `/employees/:uuid/transfer` (step 11):** 4-tab employee profile (Ma'lumotlar · Bo'linmalar · ERI kalitlari · Tarix) with an identity hero band (avatar with bg-emerald initials · FIO + email + phone · StatusBadge + grouped PINFL · Transfer CTA disabled when TERMINATED). Info tab is a mobile-stacked / desktop 2-col description list of 11 fields backed by a `ResponsiveDialog`-wrapped `UpdateEmployeeSheet` (re-uses wizard step-1+2 fields, drops PINFL since it's locked post-creation, email dedup runs only on change) + a red-outline Terminate button that opens an `AlertDialog` confirming the cert-revocation cascade (TZ §6.6). Bo'linmalar tab is a vertical `AssignmentTimeline` (border-l-2 rail · `-left-[31px]` dot · `bg-emerald ring-4 ring-emerald-soft` for active rows / `bg-muted-foreground` for closed · Primary + assignment-type badges · unit-link chevron · Progress bar when workload < 100 · italic muted reason). ERI tab is a lightweight list of certificates with StatusBadge + valid window + serial number; Tarix tab is `listAudit({ resourceUuid })` rendered with the same `ACTION_ICON` map as `RecentActivityCard`. Transfer page lives at `/employees/:uuid/transfer` under `ProtectedNoShell` (same chrome shape as the wizard — mobile X+title topbar, desktop back-link+title+subtitle band, sticky `pb-safe` footer); form fields per TZ §5.4 (new unit Combobox · type-filtered position Combobox · startDate · paired Slider+numeric workload · 4-card RadioGroup for assignment type · auto-toggled close-old Checkbox · optional Textarea reason). Backed by hardened mock-backend `transferEmployee`: new exported `MAX_TOTAL_WORKLOAD_PERCENT = 150` cap with typed `AssignmentValidationError('workload-exceeded')` thrown when projected total breaks the cap; auto-demotion of existing open `isPrimary` row when new transfer is PRIMARY but `closeOldAssignment=false` (prevents two-open-primaries state); rich audit `changes` block (`{ unit: { from, to }, position: { from, to } }`) for step 13's audit diff view + flat `context` (`assignmentType` / `workloadPercent` / `closedOld` / `reason`). `listAudit` also gained a `resourceUuid` filter so the History tab scopes server-side instead of pulling all rows.

**Shadcn `slider` primitive landed in step 11** ([`src/components/ui/slider.tsx`](../dashboard/src/components/ui/slider.tsx)) — canonical Radix-backed Slider via the existing `radix-ui` umbrella package (no new dep). Used by the transfer workload field; reusable from step 12 onwards. The wizard's `<Button form={STEP_FORM_IDS[current]}>` external-submit pattern carries over to the transfer page (`<Button form={FORM_ID}>`).

**Flow 4 at `/certificates` + `/certificates/upload` (step 12):** 4-column ERI Kanban on desktop (≥ lg: PENDING_APPROVAL · ACTIVE · EXPIRED · REVOKED, each with a tinted header band + count Badge + scrollable card list; gracefully collapses to 2 cols at md/tablet widths) / underline-tabs single-column on mobile (same underline pattern as step 11's profile, count pills inline in each tab label). `CertificateCard` shows avatar with employee initials + issuer + validity window + StatusBadge + cinnamon `expiring-soon` pill (ACTIVE certs with < 30 days remaining); PENDING cards carry a Checkbox for bulk selection. Bulk-approve `Alert` band slides in when selection non-empty; loops `approveCertificate`, tolerates the 3% mock-network failure rate, toast reports actual success count. Card click opens a right-side `CertificateDetailsSheet` (UnitDetailsSheet parity from step 08) with metadata description-list + status-aware vertically-stacked action buttons: PENDING → Tasdiqlash + Rad etish; ACTIVE → Bekor qilish; EXPIRED / REVOKED / REJECTED → metadata-only (no footer). Three dialogs back the actions: `ApproveDialog` (AlertDialog with name-interpolated body), `RejectDialog` (ResponsiveDialog with Textarea + 5-char minimum reason validation), `RevokeDialog` (ResponsiveDialog with Select over `[EXPIRED, COMPROMISED, REPLACED, MANUAL]` — `EMPLOYEE_TERMINATED` excluded since it's set automatically by `terminateEmployee` cascade).

Upload page at `/certificates/upload` (under `ProtectedNoShell` — wizard/transfer parity) is a progressive-disclosure 4-step form (`<ol>` of numbered `<Step>` sections) backed by [`FakePfxParser.ts`](../dashboard/src/features/certificates/FakePfxParser.ts) (~50 lines, typed `FakePfxParseError`, exported `MAX_PFX_SIZE_BYTES = 100 * 1024`, 800–1500 ms simulated parse latency via `setTimeout`, `crypto.getRandomValues`-based hex for serial/thumbprint, hard-coded `YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ` issuer, returns plausible X.509 metadata with the employee's PINFL/FIO mirrored so the round-trip passes the backend's pinfl-mismatch guard). Steps: Employee Combobox (pre-filled from `?employee=<uuid>` query — set by step-11's profile cert tab) → File picker (`.pfx, .p12`, ≤ 100 KB client-side gate) → Password input (`type=password`, autocomplete=off, "Parol serverga uzatilmaydi" hint) → "Faylni o'qish" button → Confirmation card with 6-row metadata description-list + cert-type Select (SIGNING / ENCRYPTION / BOTH) + `autoApprove` Checkbox (defaults ON for HR_ADMIN). Submit: 1.5 s mocked E-IMZO challenge-response (`ShieldCheck` pulse per master §17 "fake the WebSocket with a delay") → `uploadCertificate` → toast → navigate back to `/employees/:uuid` if we came from the profile, else `/certificates`. Backend hardened: `uploadCertificate` now enforces serial uniqueness (case-insensitive) + PINFL-mismatch guard via typed `CertificateValidationError` (codes `serial-taken | pinfl-mismatch`); `rejectCertificate` swapped from the lying `CERTIFICATE_APPROVED + context.decision='REJECTED'` shape to the new dedicated `CERTIFICATE_REJECTED` audit action; `listAudit`'s `resourceUuid` filter from step 11 already supported the step 11 profile history tab and now supports the upcoming step 13 audit-log view.

**`?upload=1&employee=<uuid>` auto-bounce** — step 11's profile cert tab CTA routes to `/certificates?upload=1&employee=<uuid>`; `CertificatesPage`'s `useEffect` detects the query param on mount and immediately `navigate(/certificates/upload?employee=<uuid>, { replace: true })` so the user lands on the upload form in one hop instead of getting dropped on the board first.

**Audit-action expansion** — `AuditAction` union gained `'CERTIFICATE_REJECTED'`; `RecentActivityCard` and `ProfileHistoryTab` icon maps both gained `ShieldOff` for it (visually distinct from `ShieldCheck` for APPROVED and `ShieldX` for REVOKED). Setup pays off in step 13's audit-log view filter chips.

**Build state:** `npm run build` → 2902 modules, 116.22 KB CSS, 922.40 KB JS / 266.23 KB gzip (post step 13: +7 modules and +26 KB JS for `/profile` and `/audit` + the `changePassword` / `submitProfileChangeRequest` / `approveProfileRequest` mock-backend mutations). Earlier post-step-12 Kanban DnD work still in place: `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^9.0.0`, and `@dnd-kit/utilities@^3.2.2` (`vite.config.ts` `optimizeDeps.include` forces them to pre-bundle together so they share one React instance — without it, adding a new `@dnd-kit/*` package while the dev server is running can land it in a separate optimized bundle with a null React and crash `SortableContext`). Sortable pinned at v9 because v10 has a Vite-incompatible bundle. PENDING_APPROVAL and ACTIVE columns support both cross-column drag (approve / revoke) AND within-column reorder via `@dnd-kit/sortable`'s `verticalListSortingStrategy`; terminal columns (EXPIRED / REVOKED) stay static with `cursor-not-allowed`. The optimistic UI patch + mock-backend `approveCertificate` / `revokeCertificate` both `unshift` the moved cert to the front of the certs table so the drop position is consistent before AND after `reload()`. A new `reorderCertificates(orderedUuids)` mutation persists within-column reorders (cosmetic, no audit entry). `select-none` on the `SortableCard` wrapper suppresses the browser's native blue text-selection highlight during drag. Mobile (<lg) keeps the underline-tabs flow — touch DnD is fragile and the single-column view has no other columns to drop into anyway.

**Build hygiene note:** The stray `package.json` + `package-lock.json` at the project root (documented in the step-12 build-hygiene note from the DnD work) were removed in step 14's pre-commit cleanup. `node_modules/` at the project root may still exist locally but is gitignored (the existing top-level `node_modules/` rule catches it); it can be removed manually with `rm -rf /Users/sardorallaberganov/Desktop/Projects/Devon/node_modules` for full tidiness.

**Step 13 at `/profile` + `/audit` (2026-05-27):** HR_ADMIN self-service profile + read-only audit log surface, both landing on routes that previously rendered the `Placeholder` (now removed from `router.tsx`).

- **`/profile`** — three-tab page (Asosiy ma'lumotlar · Parolni o'zgartirish · Tahrirlash so'rovlari). Identity hero band reuses the EmployeeProfilePage shape (cream-deep panel, emerald avatar with initials, FIO + email/phone + StatusBadge + position/unit metadata). Info tab is a 6-row description list backed by a `ProfileEditRequestForm` (ResponsiveDialog wrapping a `react-hook-form` with the same phone/email validation as the wizard). The form is role-branched: HR_ADMIN edits call `updateEmployee` directly with a "yangilandi" toast; everyone else calls `submitProfileChangeRequest` and the request appears in the third tab as PENDING. Password tab is `PasswordChangeForm` — `react-hook-form` + zod with 8-char / upper / lower / digit / special regex chain + cross-field "match confirm" + cross-field "differs from current" refinements, plus the wizard's `passwordStrength` scorer driving a Progress meter (destructive → cinnamon → emerald color rotation by score). Submit calls the new `changePassword(userUuid, current, next)` mutation; wrong-current surfaces as an inline form error on the `current` field (typed `PasswordValidationError('current-wrong')`), `MockNetworkError` becomes a toast, success resets the form. "Tahrirlash so'rovlari" tab carries a pending-count `Badge` on the trigger and renders the empty state for HR_ADMIN (their edits never queue) with a one-line explanation that the workflow exists for `ROLE_EMPLOYEE`.
- **`/audit`** — full-width PageHeader + a 4-column filter grid (resourceType `Select` · actor `Combobox` derived from distinct actors in the audit table · two native `<input type="date">`s for from/to). Filter reset CTA appears in the header only when any filter is active. List is a card stack on `<lg` and a 5-column `Table` (Vaqt · Aktor · Harakat · Resurs · Tafsilot) on `lg+`. Both layouts share `AuditEntryRow` with a `variant: 'card' | 'row'` discriminator. Each row's inline `DiffBlock` renders `changes` keyed by field name (`unit` / `position`) and resolves `unit` UUIDs to `nameUz` via a `Map<string, Unit>` passed in from the page. Newest-first sort + 50/page pagination (existing `Pagination` primitive). The mock-backend `listAudit` filter shape gained `dateFrom` / `dateTo` (ISO date strings; `dateTo` is widened to end-of-day so a same-day pick still returns rows). Date inputs cross-clamp via `min` / `max` so the picker can't yield an inverted range.
- **Mock-backend additions:** `submitProfileChangeRequest({ employeeUuid, fields }, actorUuid)` (writes a `PENDING` row + `PROFILE_CHANGE_REQUESTED` audit entry), `approveProfileRequest(uuid, actorUuid, decision, rejectionReason?)` (APPROVED branch applies the patch via `updateEmployee` then writes a `PROFILE_CHANGE_APPROVED` audit entry; REJECTED only writes audit), `changePassword(userUuid, current, next)` (SHA-256 compare via existing `sha256Hex`, throws typed `PasswordValidationError('current-wrong')` on mismatch, otherwise writes new hash + stamps `passwordChangedAt` + clears `mustChangePassword` + writes a `PASSWORD_CHANGED` audit entry). All three respect the `maybeFail()` 3% network-flake convention. The `Placeholder` component and the now-unused `useTranslation` + `PageHeader` imports were stripped from `router.tsx`.
- **No `SEED_VERSION` bump** — no fixture identity changes. Existing browsers keep their seed; the new pages render against the existing 30 employees / 1 HR_ADMIN user / ~70 audit entries.

**Step 14 GitHub Pages deploy (2026-05-27):** the existing `.github/workflows/deploy.yml` (which uploaded only `./landing`) was rewritten into a two-job build/deploy workflow that runs `npm ci && npm run build` inside `./dashboard`, stages a combined `pages-dist/` (landing files at the root, dashboard build at `pages-dist/dashboard/`), and uploads via `actions/upload-pages-artifact@v3` → `actions/deploy-pages@v4`. Node 20 LTS, `cache: 'npm'` against `dashboard/package-lock.json`. SPA deep-linking handled via the canonical [spa-github-pages](https://github.com/rafgraph/spa-github-pages) snippet — [`dashboard/public/404.html`](../dashboard/public/404.html) with `pathSegmentsToKeep = 2` (matches the `/Devon/dashboard/` URL prefix) rewrites any 404 into a `?/<path>` query that the handoff `<script>` inside [`dashboard/index.html`](../dashboard/index.html) (placed before the main module bundle so the first render sees the cleaned URL) decodes back into a real path via `window.history.replaceState`. [`.gitignore`](../.gitignore) gained explicit `dashboard/{node_modules,dist,.vite,.eslintcache}/` entries — top-level `node_modules/` and `dist/` already caught these, but spelling them out makes intent obvious and survives a future repo split. The redundant `.github/workflows/static.yml` workflow (which uploaded the entire repo root as the Pages artifact) was deleted to prevent the `concurrency: pages` race that would otherwise have it overwrite the dashboard build on every push. Landing `[hero .btn-primary](../landing/index.html)` repointed from `Demo so'rash → #demo` (sales-lead email form) to `Demoga kirish → dashboard/` (relative href, works locally and on Pages). The other three demo CTAs (nav, mobile menu, architecture section) intentionally keep pointing at `#demo` so the sales-lead capture path stays distinct from the live-demo path. The stray `package.json` + `package-lock.json` at the project root (documented in the step-12 build-hygiene note and the `LESSONS.md` cleanup item) were removed; `node_modules/` at the root is gitignored so it can't accidentally land in a commit. Local smoke test via `npx serve` against a staged `/tmp/devon-pages/Devon/` tree confirmed `/Devon/`, `/Devon/dashboard/`, `/Devon/dashboard/favicon.svg`, and `/Devon/dashboard/assets/*.js` all return 200 with the right content; deep routes return 404 from `serve` as expected (GH Pages will reroute to `404.html` which carries the correct rewrite snippet).

**Next:** `15-final-qa.md` — full responsive / i18n / accessibility pass before declaring v1 of the demo done. Worth budgeting time for: browser-based sweep of every route at 360 / 768 / 1024 / 1280 / 1920 px, Lighthouse a11y audit on `/`, `/employees`, `/employees/new`, `/employees/:uuid`, `/certificates`, `/audit`, `/profile`; verification that the production deploy at `<owner>.github.io/Devon/dashboard/` actually loads end-to-end (deep-link refresh, login + password change + log out / back in cycle, mobile breakpoints on a real phone), and a final "Reset demo" pass to confirm seed re-population works against the published bundle.

---

## Open questions / known gaps

- **Dashboard implementation in progress** — steps 01–14 are done; step 15 (`15-final-qa.md`, full responsive/i18n/accessibility pass) is the last one before declaring v1 of the demo done. The shadcn `form` primitive landed in step 10 — future forms can opt into the wrapper pattern when they benefit (nested arrays, dynamic field lists). The shadcn `slider` primitive landed in step 11 — reusable for any 0–100 range field. The typed `CertificateValidationError` + `CERTIFICATE_REJECTED` audit-action expansion landed in step 12. The typed `PasswordValidationError('current-wrong')` + `submitProfileChangeRequest` / `approveProfileRequest` / `changePassword` mock-backend mutations landed in step 13, plus `listAudit` gained `dateFrom` / `dateTo` filters. Step 14 wired the two-job GitHub Pages workflow (build dashboard → assemble combined `pages-dist/` → upload → deploy) and the spa-github-pages 404 fallback so deep-link refresh + direct paste work on the static host. Out-of-scope items deliberately deferred per master §17: real backend, real PFX parsing, real E-IMZO plugin, real SMS/email OTP, automated tests. A "Switch to employee POV" toggle that would let the demo exercise the request-approval flow with a single seeded user was explicitly deferred in step 13's prompt — the request UI ships and the empty state explains it, but the path isn't reachable in the demo without a second seeded login.
- **HR_ADMIN demo identity has been renamed three times in one day** (`Allaberganov Sardor Otabekovich` → `Umarov Jahongir Sobirovich` → `Pulatov Asilbek Karimovich`). The seed-versioning fix means future renames are a one-line `SEED_VERSION` bump in [`seed.ts`](../dashboard/src/lib/mock-backend/seed.ts) + the four prompt-doc spots — both documented in [`LESSONS.md`](./LESSONS.md). The auth store's `refreshSessionUser` handles silently updating already-cached sessions so users never see stale names. Existing browsers with the old `'1'` or `'2'` flag will reseed on next load.
- **User manual (Uzbek)** — `docs/user-manual-uz.md` is referenced in the README but doesn't exist yet. Needs writing for end-user onboarding.
- ~~**Build lessons file**~~ — was empty; [`ai_context/LESSONS.md`](./LESSONS.md) now exists and carries the full-width-main decision (2026-05-25). Append future cross-step decisions as they surface.
- **Operations runbook** — `docs/operations/` is referenced but the folder is empty. Needs `deployment.md`, `backup.md`, `recovery.md`, `oncall.md` populated for sysadmins.
- **BPMN diagrams** — `docs/bpmn/` is referenced but the visual diagrams from the legacy PLYMA spec haven't been migrated. `docs/business-processes.md` covers the same flows in text form; the visual diagrams are a "nice to have."
- **ADRs** — `docs/adr/` is empty. The first ADRs should retroactively capture: choice of 4-level org hierarchy as a first-class model, signed-document immutability triple-layer enforcement, on-premise deployment as a hard constraint.
- **Real client logos** — the landing page's trust band has gray placeholders + a `<!-- TODO: Replace with real client logos -->` comment.

---

## Naming history

| Name | Era | Status |
|---|---|---|
| **PLYMO** | Early concept, pre-2025 | Legacy. Appears in the earliest spec. |
| **PLYMA** | 2025 spec phase | Legacy. Appears in `docs/Plyma_Technical_Spec_v1.0.docx`, early landing-page drafts. From Greek *plimo* — "flow." |
| **Devon** | 2026+ (current) | Shipping name. All new artifacts use Devon. |

When you encounter PLYMO or PLYMA in legacy material, mentally substitute Devon. Same product.

---

## How to think about this file

Update this snapshot when any of the following change:

- Module status flips (a module moves from "in spec" to "in production" or gets de-scoped)
- Roadmap reshuffles
- A canonical doc is added or removed
- The competitive picture shifts (new competitor, EDoc ships something significant)
- Brand voice or language defaults change
- The landing page's overall structure changes (not every visual tweak — those go in `HISTORY.md`)
- A new "open question" emerges or an existing one gets resolved

If a change is too granular for this file, it belongs in `HISTORY.md`. If it's structural, both files get updated.
