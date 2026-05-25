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
