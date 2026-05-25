# Devon — Session History

Reverse-chronological checkpoint log of significant work done with AI assistance. Each entry: date, one-line summary, files touched.

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
