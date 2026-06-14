# Design Spec — Devon Brand Restyle (blue/navy + Craftwork Grotesk)

> **Status:** approved in brainstorming (2026-06-14), pending written-spec review.
> **Scope:** full visual rebrand of both surfaces — `landing/index.html` and the `dashboard/` SPA.
> **Author:** brainstorming session 2026-06-14.

---

## 1. Goal

Replace Devon's current "warm chrome" identity (emerald `#1F4E3F` + cream + cinnamon, Inter + Fraunces) with the newly delivered brand: vivid blue `#0878FE` + deep navy `#011528`, Craftwork Grotesk, and the new icon-mark / full-logo SVGs. The change must land cohesively across the marketing landing page and the admin dashboard, keep WCAG 2.1 AA contrast, and remove the external Google-Fonts dependency to honor Devon's on-premise data-sovereignty constraint.

**Delivered assets (in `assets/`):**
- `assets/devon_icon.svg` — icon mark (blue swoosh, `#0878fe`).
- `assets/devon_logo_full.svg` — icon + "Devon" wordmark (blue) + slogan (navy `#011528`).
- `assets/craftwork-grotesk/` — `CraftworkGrotesk-{Regular,Medium,SemiBold,Bold,Heavy}.ttf` + `CraftworkGroteskGX.ttf` (variable).

## 2. Decisions locked (from brainstorming)

| # | Decision | Choice |
|---|---|---|
| 1 | Rebrand scope | **Full rebrand, both surfaces** (landing + dashboard) |
| 2 | Chrome temperature | **Cool corporate** — white surfaces, cool-gray canvas, slate text, blue actions (white sidebar, not navy) |
| 3 | Palette | Approved full token set (§3) |
| 4 | Dashboard hue-token names | **Rename to honest names** (`emerald→brand/primary`, `cream→canvas`, `cinnamon→warning`, `signal→success`); already-neutral names (`ink`/`line`/`surface`/`body`/`muted-fg`) keep their names, repointed |
| 5 | Typography | **Display/body split** — Craftwork Grotesk for display (headings, wordmark, buttons, slogan, A4 title); **Inter stays** for body, tables, forms, numeric/tabular data. Fraunces retired |
| 6 | Font hosting | **Self-host both** Craftwork Grotesk and Inter; remove Google Fonts `<link>` from both surfaces (on-premise compliance) |
| 7 | Logo lockup | Icon-mark SVG + live "Devon" text in Craftwork Grotesk; favicon redesigned around the new mark; `theme-color` → navy `#011528` |

## 3. Color system

### 3.1 Brand & semantic palette (canonical values)

| Role | Hex | HSL (for `index.css`) | Usage |
|---|---|---|---|
| brand | `#0878FE` | `213 99% 51%` | logo fill, focus ring, large/decorative accents (≥3:1 only) |
| primary | `#0A6BE0` | `213 91% 46%` | buttons, links, interactive text/icons (white text 5:1 ✓; on-white 5:1 ✓) |
| primary-deep | `#0850A8` | `213 91% 35%` | hover / active / pressed |
| brand-soft | `#EAF2FE` | `214 90% 96%` | active nav bg, info bg, tints |
| navy / ink | `#011528` | `209 96% 8%` | headings, primary text |
| canvas | `#F7F9FC` | `213 38% 98%` | page background |
| surface | `#FFFFFF` | `0 0% 100%` | cards, sidebar, top bar |
| surface-2 | `#F1F5F9` | `210 40% 96%` | hover fills, table stripes, secondary surface |
| line | `#E6EAF0` | `216 27% 92%` | borders, dividers |
| body | `#475569` | `215 19% 35%` | body text (7.5:1 ✓) |
| muted | `#64748B` | `215 16% 47%` | labels, secondary text (4.8:1 ✓) |
| faint | `#94A3B8` | `215 20% 65%` | placeholder / disabled (large or non-text only) |
| success | `#16A34A` | `142 76% 36%` | active, completed, signed-positive |
| success-soft | `#DCFCE7` | `141 79% 93%` | success badge bg |
| warning | `#D97706` | `32 95% 44%` | pending, deadlines, expiring (replaces cinnamon role) |
| warning-soft | `#FEF3C7` | `48 96% 89%` | warning badge bg |
| error | `#DC2626` | `0 72% 51%` | rejected, errors, destructive |
| error-soft | `#FEE2E2` | `0 93% 94%` | error badge bg |
| info | = primary `#0A6BE0` | — | informational (e.g. SIGNED badge) |

### 3.2 shadcn semantic token mapping (`dashboard/src/index.css` `:root`)

| shadcn var | New value | (source role) |
|---|---|---|
| `--background` | `213 38% 98%` | canvas |
| `--foreground` | `209 96% 8%` | ink/navy |
| `--card` / `--popover` | `0 0% 100%` | surface |
| `--card-foreground` / `--popover-foreground` | `209 96% 8%` | ink |
| `--primary` | `213 91% 46%` | primary (#0A6BE0) |
| `--primary-foreground` | `0 0% 100%` | white |
| `--secondary` | `210 40% 96%` | surface-2 |
| `--secondary-foreground` | `209 96% 8%` | ink |
| `--muted` | `210 40% 96%` | surface-2 |
| `--muted-foreground` | `215 16% 47%` | muted |
| `--accent` | `214 90% 96%` | brand-soft |
| `--accent-foreground` | `213 91% 46%` | primary |
| `--destructive` | `0 72% 51%` | error |
| `--border` / `--input` | `216 27% 92%` | line |
| `--ring` | `213 99% 51%` | brand (#0878FE) |
| `--sidebar` | `0 0% 100%` | surface (white sidebar — cool corporate) |
| `--sidebar-foreground` | `209 96% 8%` | ink |
| `--sidebar-primary` | `213 91% 46%` | primary |
| `--sidebar-primary-foreground` | `0 0% 100%` | white |
| `--sidebar-accent` | `214 90% 96%` | brand-soft (active nav) |
| `--sidebar-accent-foreground` | `213 91% 46%` | primary |
| `--sidebar-border` | `216 27% 92%` | line |
| `--sidebar-ring` | `213 99% 51%` | brand |
| `--chart-1..5` | brand `213 99% 51%` · navy `209 96% 8%` · success `142 76% 36%` · warning `32 95% 44%` · muted `215 16% 47%` | blue-led progression |

`--radius` unchanged (`0.75rem`).

### 3.3 Devon brand-token rename map (the `--color-*` layer + `@theme inline`)

| Old token | New token | New value | Notes |
|---|---|---|---|
| `--color-emerald` | `--color-primary` (+ new `--color-brand`) | `#0A6BE0` (brand `#0878FE`) | blanket-rename `emerald → primary` (accessible). Selectively use `brand` for large/identity/logo spots only |
| `--color-emerald-deep` | `--color-primary-deep` | `#0850A8` | hover/active |
| `--color-emerald-soft` | `--color-brand-soft` | `#EAF2FE` | active-nav / info tint |
| `--color-cinnamon` | `--color-warning` | `#D97706` | pending/deadline semantic |
| `--color-cinnamon-soft` | `--color-warning-soft` | `#FEF3C7` | |
| `--color-signal` | `--color-success` | `#16A34A` | (was green secondary; 0 utility uses today) |
| `--color-cream` | `--color-canvas` | `#F7F9FC` | page bg |
| `--color-cream-deep` | `--color-surface-2` | `#F1F5F9` | |
| `--color-cream-warm` | `--color-surface-2` | `#F1F5F9` | merged into surface-2 |
| `--color-surface` | `--color-surface` (keep) | `#FFFFFF` | |
| `--color-ink` | `--color-ink` (repoint) | `#011528` | |
| `--color-ink-soft` | `--color-ink-soft` (repoint) | `#0A2540` | |
| `--color-body` / `--color-body-fg` | keep (repoint) | `#475569` | |
| `--color-muted-fg` | keep (repoint) | `#64748B` | |
| `--color-line` | keep (repoint) | `#E6EAF0` | |
| — (new) | `--color-brand` | `#0878FE` | identity/focus/large accents |
| — (new) | `--color-success-soft` | `#DCFCE7` | badge bg |
| — (new) | `--color-error` / `--color-error-soft` | `#DC2626` / `#FEE2E2` | badge bg + direct use |

**Mechanics:** rename = lockstep edit in three places — the `:root` definition, the `@theme inline` exposure, and every consumer utility (`text-emerald`→`text-primary`, `bg-cream`→`bg-canvas`, `bg-cinnamon-soft`→`bg-warning-soft`, etc.). Each token is a separate find/replace pass. Verification: after each pass, `grep -r "emerald\|cream\|cinnamon\|signal" dashboard/src` returns **0** (outside the words "Devonxona" etc. which contain none of these). `StatusBadge`'s color config record is the highest-value single edit (badge backgrounds move from emerald-soft/cinnamon-soft to the new soft tokens).

## 4. Typography system

### 4.1 Font roles

- `--font-display: "Craftwork Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif` — **NEW**.
- `--font-heading: var(--font-display)` — repointed from `var(--font-sans)`. Auto-converts shadcn Card / Dialog / Sheet / AlertDialog titles (which already use `font-heading`) to Craftwork Grotesk for free.
- `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif` — **unchanged** (body, tables, forms, tabular numbers).
- `--font-serif` — **removed** (Fraunces retired).

**Display surfaces that must adopt `font-display`/`font-heading` (currently default to Inter):**
- `PageHeader` `<h1>` (page titles).
- The `Button` cva base string (one edit → all buttons).
- StatCard value, dashboard greeting, big numerals meant as display.
- The 4 `font-serif` spots → swap to `font-display`: `LoginPage.tsx:91,104`, `Sidebar.tsx:105` (slogan), `A4Preview.tsx:73` (doc title).

Body, table cells, form inputs, and `font-variant-numeric: tabular-nums` data stay on `--font-sans` (Inter).

### 4.2 Self-hosting (both surfaces; removes Google Fonts)

- **Craftwork Grotesk** — vendor the variable font as `woff2` (convert `CraftworkGroteskGX.ttf` → `.woff2`; ~58 KB ttf → ~25 KB woff2). Fallback: ship the ttf if woff2 tooling unavailable. `@font-face` with `font-weight: 400 800` range (variable). If static-weight route is preferred: Medium 500, SemiBold 600, Bold 700, Heavy 800 (display rarely needs 400).
- **Inter** — vendor `woff2` weights 400/500/600/700 (e.g. from the Inter release or Google Fonts woff2). Commit into the repo (on-premise: no external fetch at runtime).
- **Dashboard** placement: `dashboard/public/fonts/`; `@font-face` blocks added to `dashboard/src/index.css`; remove the `<link href="…fonts.googleapis.com…">` from `dashboard/index.html`.
- **Landing** placement: `landing/fonts/`; `@font-face` in landing's inline `<style>`; remove the Google-Fonts `<link>` from `landing/index.html`.

## 5. Logo & favicon

- Copy `devon_icon.svg` + `devon_logo_full.svg` into `dashboard/public/` and `landing/`.
- **Wordmark lockup** (Sidebar, TopBar mobile logo, LoginPage): inline `<svg>` icon mark + `<span class="font-display font-extrabold text-ink">Devon</span>`. Replace the current geometric "D" + uppercase `DEVON` (`tracking-[0.16em]`) treatment. Standardize on mixed-case **"Devon"** per the brand wordmark (drop the uppercase letter-spaced form).
- **Favicon** (`dashboard/public/favicon.svg` + `landing/favicon.svg`): redesign around the blue swoosh mark — icon mark on a white rounded-square (or transparent), replacing the green-"D"+cinnamon-diamond. Update `apple-touch-icon` on landing.
- **`theme-color`** meta: `#1F4E3F` → `#011528` (navy) in both `dashboard/index.html` and `landing/index.html`.

## 6. Dashboard implementation surface

1. `dashboard/src/index.css` — rewrite `:root` (shadcn vars §3.2 + brand tokens §3.3), `@theme inline` exposure (rename + add tokens, add `--font-display`, repoint `--font-heading`, drop `--font-serif`), add `@font-face` blocks. Print rules + `.pb-safe`/`.no-scrollbar` unchanged.
2. `dashboard/index.html` — remove Google-Fonts `<link>`; flip `theme-color`; favicon already `/devon-landing/dashboard/favicon.svg` (file content swapped).
3. Token consumer sweep — per-token find/replace across `dashboard/src/**` (~70 files); highest-value: `StatusBadge`, layout (`Sidebar`/`TopBar`/`UserMenu`/`AppShell`), `dashboard-home/*`, `common/*` state components.
4. Typography adopters — `Button` cva, `PageHeader` h1, StatCard, the 4 `font-serif` spots.
5. Logo lockup — `Sidebar.tsx`, `TopBar.tsx`, `LoginPage.tsx`.
6. `dashboard/public/favicon.svg` + `dashboard/public/fonts/*` + the two logo SVGs.

## 7. Landing page implementation surface

`landing/index.html` is one self-contained file.

1. **`:root` vars** — rewrite the brand vars (cream→canvas, emerald→primary/brand, cinnamon→warning, etc.) using §3.1 values; keep the same var names where the landing already uses neutral names, rename hue vars for honesty (landing is isolated, low risk).
2. **Section rotation recolor** — the current warm pastel rotation (cream → white → peach → mint → navy → cream → lavender) is recolored to a **cool** sequence: canvas `#F7F9FC` → white → brand-soft `#EAF2FE` → navy `#011528` → canvas → light-blue tint. Exact per-section mapping finalized in the plan; the navy section stays navy (now on-brand).
3. **Hardcoded-hex sweep** — replace inline hexes: `#1F4E3F`→primary/navy (×84), `#BC6E2B`→warning (×52), cream `#FBF9F4`/`#FBF8F3`→canvas/white (×74), plus the SVG illustration colors (device mockups, org-tree, Kanban, ERI phone) recolored to the blue/navy/slate system.
4. **Fonts** — self-host Inter + Craftwork Grotesk; remove Google-Fonts `<link>`. Replace Fraunces `.serif` / `.serif-accent` / `.quote-mark` / `.slogan` with Craftwork Grotesk (drop `font-style: italic`). **This overrides the prior LESSONS.md note** that the landing intentionally keeps italic Fraunces — that lesson is corrected in the doc cascade.
5. **Logo** — nav wordmark, hero, footer brand → icon mark + "Devon" in Craftwork Grotesk (or the full-logo SVG in the footer where the slogan belongs). Favicon + `apple-touch-icon` + `theme-color` updated.
6. Trust-band gray placeholders unchanged (pre-existing TODO, out of scope).

## 8. Accessibility verification (WCAG 2.1 AA — required by `.claude/rules/accessibility.md`)

- Body text `#475569` on white = 7.5:1 ✓; on canvas `#F7F9FC` ≈ 7.2:1 ✓.
- Muted `#64748B` on white = 4.8:1 ✓ (normal text).
- `faint #94A3B8` — large/non-text only (≈2.9:1).
- Interactive `primary #0A6BE0`: white-on-primary 5:1 ✓ (buttons); primary-on-white 5:1 ✓ (links).
- `brand #0878FE`: 4.1:1 on white — reserved for focus ring + non-text UI (≥3:1 floor ✓) and large/decorative; **never** small body text.
- Status badges: success `#15803D`/green-soft, warning `#B45309`/amber-soft, error `#B91C1C`/red-soft — all darkened foregrounds on soft tints, AA for the badge label size.
- Never color-alone for status (existing icon+label pairing in StatusBadge preserved).
- Focus ring contrast vs adjacent surface ≥3:1 ✓ (`#0878FE`).

## 9. Doc cascade (CLAUDE.md requirement)

- **`ai_context/AI_CONTEXT.md`** — update "Brand voice & language defaults" (palette/fonts), "Landing page — current state" (visual style, fonts, favicon, section rotation), and the dashboard "Visual direction" + token-mapping paragraphs (emerald/cream/cinnamon → new system; Inter+Fraunces → Inter+Craftwork Grotesk). Mark the "Real client logos" gap unchanged.
- **`ai_context/LESSONS.md`** — correct the Typography section: the "`font-serif` was italic-only" entry and the "landing intentionally keeps italic Fraunces" note no longer apply (Fraunces removed). Add a rebrand lesson: token-rename mechanics + the brand/primary contrast split + self-hosting for on-premise.
- **`ai_context/HISTORY.md`** — append a session entry logging the rebrand.
- **`docs/adr/`** — add the **first ADR**: "Brand restyle — blue/navy palette, two-layer token rename, display/body font split, self-hosted fonts for on-premise." (Closes part of the empty-ADR gap noted in AI_CONTEXT.)
- **`README.md`** — verify no color/font facts to update (README is product-facing, no visual specifics expected); update only if a brand reference exists.
- `dashboard/QA_NOTES.md` — add a rebrand observational-QA checklist (six viewports, contrast spot-checks, font-load FOUT check, favicon, print).

## 10. Out of scope / non-goals

- No dark mode (light-only today; `@custom-variant dark` stays but no `.dark` palette is authored).
- No layout / component-structure changes — visual tokens, fonts, and logo only.
- No new features, copy, or i18n keys (slogan text unchanged).
- Landing trust-band real client logos (pre-existing TODO).
- The `.claude/rules/*` files are a mismatched fintech (ZhiPay) template, not Devon's design system — not edited here (pre-existing condition; `design-system-layers.md`/`accessibility.md`/`core-principles.md` principles still honored generically).
- No `SEED_VERSION` bump (no fixture/data identity change).

## 11. Verification plan

- `cd dashboard && npm run build` — clean, modules count noted, **< 500 KB gzip** target held (self-hosted fonts are static assets, not bundle).
- `npm run lint` + `tsc` — no new errors beyond the tolerated baseline.
- `grep -rn "emerald\|cream\|cinnamon\|signal\|Fraunces\|fonts.googleapis" dashboard/src dashboard/index.html` → **0** (proves the rename + Google-Fonts removal are complete).
- `grep -n "1F4E3F\|BC6E2B\|FBF9F4\|FBF8F3\|Fraunces\|googleapis" landing/index.html` → **0**.
- Dev-server route sweep (all ~24 routes 200, no console errors, fonts load locally).
- Contrast spot-checks per §8.
- Visual sweep at 360/390/768/1024/1280/1920 (handed to operator via QA_NOTES, per project convention).

## 12. Risks

- **Token-rename misses** — 70-file sweep risks a stray old class; mitigated by the grep-to-zero gate after each token.
- **`emerald → primary` vs `brand` judgment** — most map to `primary` (accessible); a handful of large/identity spots want `brand` (#0878FE). Plan flags the identity spots explicitly (logo lockup, any oversized hero accents).
- **Craftwork Grotesk woff2 conversion** — if no `woff2`/`fonttools` tooling locally, fall back to shipping the variable `.ttf` (larger, still self-hosted/compliant).
- **Inter woff2 vendoring** — must source the files; if unavailable offline, document the source and commit them.
- **Landing section recolor is subjective** — the cool-rotation mapping is a design call; may need one visual iteration after build.

---

*Per the project rule, this spec is left in the working tree and not committed until the user runs `/commit`.*
