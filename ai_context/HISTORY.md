# Devon — Session History

Reverse-chronological checkpoint log of significant work done with AI assistance. Each entry: date, one-line summary, files touched.

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
