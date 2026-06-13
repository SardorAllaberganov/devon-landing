# Devon — Build Lessons

> Things that surfaced during build that future sessions should respect. Organized by topic, not chronologically. Pair with [`HISTORY.md`](./HISTORY.md) (timeline) and [`AI_CONTEXT.md`](./AI_CONTEXT.md) (snapshot).

---

## Animation

### Don't put `backdrop-filter` on overlays that animate alongside `transform`

**Decision (2026-05-26, post-step-06 drawer polish):** The shadcn `Sheet` primitive's overlay no longer uses `backdrop-blur` — it's plain `bg-black/30`. See [`sheet.tsx`](../dashboard/src/components/ui/sheet.tsx).

**Why:** `backdrop-filter` forces a full-screen paint on every frame the overlay is visible. When the SheetContent is sliding in via `transform: translateX(...)` at the same time, the GPU's compositor thread has to interleave: read backdrop → blur → paint, then translate the panel, then repeat per frame. The result is visible stutter on mobile and on slower laptops. Removing the blur lets the transform animation run pure on the compositor thread.

**How to apply:**
- Never put `backdrop-blur` / `backdrop-filter` on a fixed-position overlay that fades in or sits behind a sliding/scaling element.
- If you want visual separation, use opacity (`bg-black/30` to `bg-black/50`) — composited cheaply.
- Static surfaces (a non-animating page header that uses `backdrop-blur` once on scroll) are fine — the cost is one paint, not per-frame.

### Use `slide-in-from-<side>-full`, NOT `slide-in-from-<side>` (unsuffixed)

**Trap (2026-05-26):** Tailwind's IDE plugin `suggestCanonicalClasses` lint flags `slide-in-from-left-[100%]` as redundant and suggests rewriting to `slide-in-from-left` (no suffix). **The suggestion is wrong.** tw-animate-css v1.4 doesn't define the unsuffixed form — it silently compiles to no rule, and the drawer loses its slide animation entirely (just fades).

**How to apply:**
- For a full-edge slide, write `slide-in-from-<side>-full` (canonical Tailwind `-full` token = 100%).
- For an arbitrary partial slide, use the numeric spacing scale: `slide-in-from-left-10` (40 px), `slide-in-from-left-16` (64 px), etc.
- Ignore the IDE's "canonical" suggestion on these specific utilities. If you accept it, the rule silently disappears.

### Form-control height — primitives default to h-10 (40 px), do NOT rely on consumer overrides for SelectTrigger

**Decision (2026-05-26):** [`input.tsx`](../dashboard/src/components/ui/input.tsx), [`select.tsx`](../dashboard/src/components/ui/select.tsx), and [`button.tsx`](../dashboard/src/components/ui/button.tsx) primitives all default to `h-10` (40 px) in the dashboard. The Nova preset originally shipped `h-8` (32 px) for all three — that's below comfortable mobile touch targets and causes a subtle CSS-specificity bug on `SelectTrigger`.

**The SelectTrigger trap:** the primitive sets its height via a data-attribute selector — `data-[size=default]:h-8` — which has CSS specificity `(0,1,1)`. A consumer writing `<SelectTrigger className="h-11">` adds a plain `.h-11` class at specificity `(0,1,0)`. The data-attribute rule wins. `tailwind-merge` doesn't detect the conflict because the conditional prefix differs (it sees them as separate utilities, not duplicates). Result: the trigger renders at 32 px while a sibling `<Input className="h-11">` renders correctly at 44 px (Input has no data-attribute selector, so the plain `h-*` override resolves normally). Visual mismatch in every form row that mixed inputs and selects.

**Why edit the primitive instead of slapping `!h-10` everywhere:** the h-8 default was wrong for **every** form in the dashboard — there's no call site that legitimately wanted 32 px form controls. This is exactly the "edit shadcn primitives only when the default is wrong for *every* call site" rule from the next entry below.

**How to apply:**
- New forms: drop `className="h-10"` / `h-11` overrides on `Input`, `SelectTrigger`, and `Button`. The primitives now hit 40 px on their own.
- If you need a **taller** trigger (e.g., login page CTA at h-12): pass `className="!h-12"` (Tailwind v4 important modifier) OR write a matching data-attribute override at equal specificity (`[&[data-size=default]]:h-12`). Just `className="h-12"` won't beat the primitive's `data-[size=default]:h-10`.
- For **shorter** controls in dense contexts (table-row kebabs, topbar chrome): use the explicit smaller variants — `size="sm"` on Button (h-8), `size="sm"` on SelectTrigger (h-8), `size="icon-sm"` for icon buttons (h-8 w-8). Don't override via `h-7` className.
- `Button`'s `default` is `h-10`; `lg` is `h-11`; `sm` is `h-8`; `xs` is `h-6`. Icon variants are `icon-xs` (h-6), `icon-sm` (h-8), `icon` (h-9), `icon-lg` (h-10). Match the icon variant to the surrounding chrome's density.
- **LoginPage CTA still uses `className="h-12"`** — `Button` doesn't have a data-attribute height selector (it uses cva, not data-attribute conditionals), so the plain `h-12` override resolves correctly. Same story for the few topbar-density overrides like `UserMenu`'s `h-9`.

**Reference:** [`dashboard/src/components/ui/{input,select,button}.tsx`](../dashboard/src/components/ui/) for the bumped defaults; [`dashboard/src/features/units/UnitFormSheet.tsx`](../dashboard/src/features/units/UnitFormSheet.tsx) for the cleaned-up form where every `Input` and `SelectTrigger` now lets the primitive own the height.

### Edit shadcn primitives only when the default is wrong for *every* call site

**Rule:** the convention is "don't edit `src/components/ui/*.tsx`". But when shadcn's default is broken in a way that affects every future use of the primitive (not just one screen), edit the primitive once and call out the exception. Per-call-site overrides for primitive-level defaults are a code smell — every future consumer pays the same fix.

**Examples that warranted editing the primitive (2026-05-26):**
- `Sheet` overlay's backdrop-blur causing animation stutter
- `Sheet` content sliding only 40 px instead of full-edge
- `Sheet` content's `ease-in-out` curve feeling mechanical on drawer motion

**Examples that should stay as call-site overrides:**
- Specific surface color (e.g., the mobile nav drawer's `bg-cream-deep` matches the Sidebar; other Sheets might want `bg-popover`).
- Specific width / max-width (each drawer instance has its own sizing).
- Hiding the close button (some Sheets need it, some don't).

When in doubt: if the same override would land on every consumer, push it into the primitive.

---

## Mock backend

### Bump `SEED_VERSION` whenever `seed.ts` changes identity (rename, status mix, hierarchy)

**Decision (2026-05-26, third HR_ADMIN rename in a single day):** [`seed.ts`](../dashboard/src/lib/mock-backend/seed.ts) carries a `SEED_VERSION` constant (currently `'3'`) compared against `localStorage['devon.dashboard.seeded']` inside `seedIfEmpty()`. If the stored value differs from the constant, the next app load silently calls `resetAndSeed()` and writes the new version.

**Why:** The original guard was a literal `localStorage.getItem(SEED_FLAG) === '1'` — once any user had been seeded, no future change to `seed.ts` would ever reseed them. Two renames in this session shipped silently broken because of this: the user's cached `localStorage` retained the original `Allaberganov Sardor` data, and even my session-refresh hook in `useAuthStore.refreshSessionUser()` re-resolved the cached session against the *cached seed* (returning the old name unchanged). Versioning gives us a one-line invalidation knob.

**How to apply:**
- Bump `SEED_VERSION` (string increment) whenever you change anything in `seed.ts` that affects identity or distribution: FIO renames, password changes, status-mix shifts (e.g., the 18/4/2/1 certificate split), org-tree reshapes, new fixture rows, removed rows. Trivial edits that don't change observable data (a refactor, a renamed local helper, a comment) don't need a bump.
- Existing users get the new seed on their next page load — no "Reset demo" required, no logout needed. Their session also re-syncs via `useAuthStore.refreshSessionUser()` (fired from [`main.tsx`](../dashboard/src/main.tsx) right after `seedIfEmpty()`).
- Drawback to acknowledge: bumping reseeds wipes any units / employees / certs the user created or edited in their demo session. That's correct for a demo (the seed *is* the canonical state) but worth mentioning if a real customer is in the middle of evaluating the demo.

**Reference:** [`dashboard/src/lib/mock-backend/seed.ts`](../dashboard/src/lib/mock-backend/seed.ts) (the `SEED_VERSION` constant + `seedIfEmpty` / `resetAndSeed` pair), [`dashboard/src/stores/useAuthStore.ts`](../dashboard/src/stores/useAuthStore.ts) (`refreshSessionUser` that resyncs the cached session against the freshly-seeded employee record).

### Use native `crypto.randomUUID()`, do NOT install the `uuid` package

**Decision (2026-05-26, step 06 mock-backend):** UUIDs in the mock backend (`seed.ts`, `mock-backend/index.ts`) come from the browser-native `crypto.randomUUID()` API — available in every modern browser since 2022 and supported on the localhost dev server and the HTTPS GitHub Pages deploy.

**Why:** The original step 06 prompt suggests `npm install uuid @types/uuid` — that was idiomatic in 2020 but is now legacy. The native API saves a runtime dep + a `@types` dep + bundle size (~15 KB minified for `uuid` v9 with all its formats). Web Crypto's `randomUUID()` returns the same RFC 4122 v4 format string and has identical collision properties.

**How to apply:**
- When future steps (07+) need a new UUID, write `crypto.randomUUID()` directly. Never import from `uuid` or `nanoid`.
- The local helper convention is `const uid = () => crypto.randomUUID()` at the top of files that mint many UUIDs (see `mock-backend/index.ts`, `seed.ts`).
- This is browser-only — works in the SPA. If we ever add SSR or Node-side helpers, switch to `node:crypto`'s `randomUUID()` instead.

**Reference:** [`dashboard/src/lib/mock-backend/seed.ts`](../dashboard/src/lib/mock-backend/seed.ts), [`mock-backend/index.ts`](../dashboard/src/lib/mock-backend/index.ts).

---

## Layout

### Dashboard main content area is full-width

**Decision (2026-05-25, step 05 AppShell):** the `<main>` inside [`AppShell.tsx`](../dashboard/src/components/layout/AppShell.tsx) does **not** clamp to a max-width. Content fills the full viewport minus the desktop sidebar (240px on `lg+`, 0 below) and the horizontal padding (`px-4` → `md:px-6`).

**Why:** Devon's dashboard is a data-dense admin surface — tables, kanban boards, audit logs, employee lists — that benefits from horizontal room. The original step 05 prompt set `max-w-[1280px] mx-auto` on `<main>` which made the page feel like a marketing landing page on wide monitors (1440+) and wasted vertical scrolling on tables that would otherwise fit horizontally.

**How to apply:**
- When adding new dashboard pages, let `<PageHeader>` + content sit directly under `<main>` without an outer `max-w-*` wrapper on the page shell.
- If a specific page legitimately needs constrained width (e.g., a one-column form, the employee wizard step content), use `max-w-*` on the *inner* form/section container — not on the page shell.
- Do **not** re-introduce a clamp on `<main>` in `AppShell.tsx` even if a later step prompt suggests it.

---

## Typography

### `font-serif` was italic-only — toggling the `italic` class can't fix it

**Trap (2026-06-13):** removing the Tailwind `italic` class from the serif slogan/wordmark (login split-pane, sidebar footer) and the A4 document-preview title did **nothing** — they still rendered slanted. Cause: [`dashboard/index.html`](../dashboard/index.html) loaded Fraunces with the italic axis only (`family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600`). `--font-serif: "Fraunces", Georgia, serif`, so the only Fraunces face the browser had was italic; requesting upright just used the italic face (or fell back). The slant lives in the **loaded font face**, not in a CSS `font-style`.

**Fix:** load the roman variant — `family=Fraunces:opsz,wght@9..144,500;9..144,600` (drop the `ital` axis). Now every `font-serif` element renders upright. There is no `font-style: italic` anywhere in `src/**/*.css`.

**How to apply:**
- If serif text looks italic and you find no `italic` class / `font-style`, check the Google Fonts `<link>` axis list — `ital,...@1,...` means only italic was fetched. Add/keep `@0,...` (roman) or drop the `ital` axis.
- To support BOTH styles, request both: `ital,opsz,wght@0,...;1,...`. Devon's dashboard only needs roman now (all italic was removed per the user's request).
- The **landing page** (`landing/index.html`) is a separate surface and intentionally keeps the italic Fraunces slogan as a brand accent — don't "fix" it there.
