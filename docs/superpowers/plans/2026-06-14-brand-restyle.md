# Devon Brand Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Devon's warm emerald/cream/cinnamon + Inter/Fraunces identity with the new blue `#0878FE` / navy `#011528` + Craftwork Grotesk brand across the landing page and the dashboard SPA, self-hosting all fonts.

**Architecture:** Token-driven. The dashboard palette lives entirely in `dashboard/src/index.css` (two layers: shadcn semantic vars + Devon `--color-*` brand tokens); rewriting those + a mechanical per-token consumer rename propagates the palette. Fonts split: Craftwork Grotesk (`--font-display`/`--font-heading`) for display, Inter (`--font-sans`) for body/data. The landing is one self-contained HTML file edited in place. Verification is grep-to-zero + build + lint + route sweep (this project has no UI test harness by design).

**Tech Stack:** Vite 8 + React 19 + Tailwind CSS 4 (CSS-first, `@theme inline`) + shadcn/ui; landing is vanilla HTML/CSS. Inter self-hosted via `@fontsource/inter`; Craftwork Grotesk vendored as woff2/ttf.

**Spec:** [`docs/superpowers/specs/2026-06-14-brand-restyle-design.md`](../specs/2026-06-14-brand-restyle-design.md)

> **⚠ Commit policy:** This repo requires the user to run `/commit`; **do not auto-commit**. Each task ends with a **Checkpoint** (verify + leave changes in the working tree). The user batches commits via `/commit` at the phase boundaries noted below.

---

## File Structure

**Phase A — Assets & fonts (foundation)**
- Create: `dashboard/src/assets/fonts/CraftworkGrotesk-Variable.woff2` (or `.ttf` fallback)
- Create: `landing/fonts/CraftworkGrotesk-Variable.woff2` (+ Inter woff2 weights)
- Create: `dashboard/public/devon_icon.svg`, `dashboard/public/devon_logo_full.svg`, `landing/devon_icon.svg`, `landing/devon_logo_full.svg`
- Modify: `dashboard/package.json` (add `@fontsource/inter`)

**Phase B — Dashboard**
- Modify: `dashboard/src/index.css` (the heart — tokens, fonts, @font-face)
- Modify: `dashboard/index.html` (drop Google Fonts, theme-color)
- Modify: `dashboard/src/main.tsx` (import Inter weights)
- Modify (sweep): `dashboard/src/**/*.{tsx,ts,css}` (token rename)
- Modify: `dashboard/src/components/ui/button.tsx`, `components/common/PageHeader.tsx`, StatCard, the 4 `font-serif` spots
- Create: `dashboard/src/components/common/BrandMark.tsx`; Modify: `Sidebar.tsx`, `TopBar.tsx`, `LoginPage.tsx`
- Replace: `dashboard/public/favicon.svg`

**Phase C — Landing**
- Modify: `landing/index.html` (vars, hex sweep, section recolor, fonts, logo, favicon)
- Replace: `landing/favicon.svg`

**Phase D — Doc cascade**
- Modify: `ai_context/AI_CONTEXT.md`, `ai_context/LESSONS.md`, `ai_context/HISTORY.md`, `dashboard/QA_NOTES.md`, `README.md` (verify)
- Create: `docs/adr/0001-brand-restyle.md`

---

## Phase A — Assets & Fonts

### Task A1: Vendor logo SVGs into both surfaces

**Files:**
- Create: `dashboard/public/devon_icon.svg`, `dashboard/public/devon_logo_full.svg`
- Create: `landing/devon_icon.svg`, `landing/devon_logo_full.svg`

- [ ] **Step 1: Copy the delivered SVGs**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
cp assets/devon_icon.svg dashboard/public/devon_icon.svg
cp assets/devon_logo_full.svg dashboard/public/devon_logo_full.svg
cp assets/devon_icon.svg landing/devon_icon.svg
cp assets/devon_logo_full.svg landing/devon_logo_full.svg
```

- [ ] **Step 2: Verify**

Run: `ls dashboard/public/devon_*.svg landing/devon_*.svg`
Expected: all four paths listed.

### Task A2: Self-host Inter (dashboard) via @fontsource

**Files:**
- Modify: `dashboard/package.json`

- [ ] **Step 1: Install @fontsource/inter (self-hosted, no Google)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
npm install @fontsource/inter@^5
```

- [ ] **Step 2: Verify the package ships woff2**

Run: `ls node_modules/@fontsource/inter/files/*.woff2 | head`
Expected: woff2 files listed (these get bundled by Vite into the build — fully self-hosted).

### Task A3: Vendor Craftwork Grotesk as woff2 (with ttf fallback)

**Files:**
- Create: `dashboard/src/assets/fonts/` and `landing/fonts/`

- [ ] **Step 1: Make the font dirs**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
mkdir -p dashboard/src/assets/fonts landing/fonts
```

- [ ] **Step 2: Try converting the variable font to woff2 (preferred — ~58 KB ttf → ~25 KB woff2)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
python3 -c "import fontTools" 2>/dev/null && pip3 install brotli >/dev/null 2>&1; \
python3 - <<'PY' 2>/dev/null && echo "WOFF2 OK" || echo "WOFF2 FAILED — use ttf fallback in Step 3"
from fontTools.ttLib import TTFont
f = TTFont("assets/craftwork-grotesk/CraftworkGroteskGX.ttf")
f.flavor = "woff2"
f.save("dashboard/src/assets/fonts/CraftworkGrotesk-Variable.woff2")
f.save("landing/fonts/CraftworkGrotesk-Variable.woff2")
PY
```

- [ ] **Step 3: Fallback — if woff2 conversion failed, ship the ttf instead**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
if [ ! -f dashboard/src/assets/fonts/CraftworkGrotesk-Variable.woff2 ]; then
  cp assets/craftwork-grotesk/CraftworkGroteskGX.ttf dashboard/src/assets/fonts/CraftworkGrotesk-Variable.ttf
  cp assets/craftwork-grotesk/CraftworkGroteskGX.ttf landing/fonts/CraftworkGrotesk-Variable.ttf
  echo "Using TTF fallback — update @font-face url()/format() in Tasks B1 & C1 to .ttf / 'truetype'"
fi
```

- [ ] **Step 4: Vendor Inter woff2 into landing (landing has no bundler)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
# Pull the same self-hosted Inter weights the dashboard uses, from the installed package.
for w in 400 500 600 700; do
  src=$(ls dashboard/node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2 2>/dev/null)
  [ -n "$src" ] && cp "$src" "landing/fonts/inter-${w}.woff2"
done
ls landing/fonts/
```

Expected: `CraftworkGrotesk-Variable.woff2` (or `.ttf`) + `inter-400/500/600/700.woff2` present.

- [ ] **Checkpoint A:** `ls -R dashboard/src/assets/fonts landing/fonts dashboard/public/devon_*.svg` shows all assets. Leave in working tree (user `/commit`s Phase A).

---

## Phase B — Dashboard

### Task B1: Rewrite `dashboard/src/index.css` — tokens + fonts + @font-face

**Files:**
- Modify: `dashboard/src/index.css`

- [ ] **Step 1: Add @font-face blocks at the top (after the three `@import` lines, before `@custom-variant`)**

Insert after line 3 (`@import "tw-animate-css";`). If Task A3 used the **ttf fallback**, change `.woff2` → `.ttf` and `format("woff2")` → `format("truetype")`.

```css
/* Self-hosted brand fonts (on-premise: no external font CDN) */
@font-face {
  font-family: "Craftwork Grotesk";
  src: url("./assets/fonts/CraftworkGrotesk-Variable.woff2") format("woff2");
  font-weight: 400 800;
  font-style: normal;
  font-display: swap;
}
/* Inter is self-hosted via @fontsource (imported in main.tsx) */
```

- [ ] **Step 2: Replace the entire `:root { … }` block (current lines 7–63) with the new palette**

```css
:root {
  /* shadcn semantic tokens — Devon blue/navy palette in HSL */
  --background: hsl(213 38% 98%);          /* canvas */
  --foreground: hsl(209 96% 8%);           /* ink / navy */
  --card: hsl(0 0% 100%);                  /* surface */
  --card-foreground: hsl(209 96% 8%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(209 96% 8%);
  --primary: hsl(213 91% 46%);             /* primary #0A6BE0 (accessible) */
  --primary-foreground: hsl(0 0% 100%);    /* white */
  --secondary: hsl(210 40% 96%);           /* surface-2 */
  --secondary-foreground: hsl(209 96% 8%);
  --muted: hsl(210 40% 96%);               /* surface-2 */
  --muted-foreground: hsl(215 16% 47%);    /* muted */
  --accent: hsl(214 90% 96%);              /* brand-soft */
  --accent-foreground: hsl(213 91% 46%);   /* primary */
  --destructive: hsl(0 72% 51%);           /* error */
  --border: hsl(216 27% 92%);              /* line */
  --input: hsl(216 27% 92%);
  --ring: hsl(213 99% 51%);                /* brand #0878FE */
  --radius: 0.75rem;

  /* Sidebar tokens — white sidebar (cool corporate) */
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(209 96% 8%);
  --sidebar-primary: hsl(213 91% 46%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(214 90% 96%);
  --sidebar-accent-foreground: hsl(213 91% 46%);
  --sidebar-border: hsl(216 27% 92%);
  --sidebar-ring: hsl(213 99% 51%);

  /* Chart palette — blue-led progression */
  --chart-1: hsl(213 99% 51%);             /* brand */
  --chart-2: hsl(209 96% 8%);              /* navy */
  --chart-3: hsl(142 76% 36%);             /* success */
  --chart-4: hsl(32 95% 44%);              /* warning */
  --chart-5: hsl(215 16% 47%);             /* muted */

  /* Devon brand-name tokens — direct use via text-primary, bg-canvas, etc. */
  --color-canvas: hsl(213 38% 98%);
  --color-surface: hsl(0 0% 100%);
  --color-surface-2: hsl(210 40% 96%);
  --color-ink: hsl(209 96% 8%);
  --color-ink-soft: hsl(209 60% 14%);
  --color-body: hsl(215 19% 35%);
  --color-body-fg: hsl(215 19% 35%);
  --color-muted-fg: hsl(215 16% 47%);
  --color-line: hsl(216 27% 92%);
  --color-brand: hsl(213 99% 51%);         /* #0878FE — identity / focus / large accents */
  --color-primary: hsl(213 91% 46%);       /* #0A6BE0 — interactive text/buttons */
  --color-primary-deep: hsl(213 91% 35%);  /* hover/active */
  --color-brand-soft: hsl(214 90% 96%);    /* active nav / info tint */
  --color-success: hsl(142 76% 36%);
  --color-success-soft: hsl(141 79% 93%);
  --color-warning: hsl(32 95% 44%);
  --color-warning-soft: hsl(48 96% 89%);
  --color-error: hsl(0 72% 51%);
  --color-error-soft: hsl(0 93% 94%);
}
```

- [ ] **Step 3: Replace the Devon brand-token exposure inside `@theme inline` (current lines 66–81)**

```css
  /* Expose Devon brand-name tokens as Tailwind utilities */
  --color-canvas: var(--color-canvas);
  --color-surface: var(--color-surface);
  --color-surface-2: var(--color-surface-2);
  --color-ink: var(--color-ink);
  --color-ink-soft: var(--color-ink-soft);
  --color-body: var(--color-body);
  --color-body-fg: var(--color-body-fg);
  --color-muted-fg: var(--color-muted-fg);
  --color-line: var(--color-line);
  --color-brand: var(--color-brand);
  --color-primary: var(--color-primary);
  --color-primary-deep: var(--color-primary-deep);
  --color-brand-soft: var(--color-brand-soft);
  --color-success: var(--color-success);
  --color-success-soft: var(--color-success-soft);
  --color-warning: var(--color-warning);
  --color-warning-soft: var(--color-warning-soft);
  --color-error: var(--color-error);
  --color-error-soft: var(--color-error-soft);
```

- [ ] **Step 4: Replace the font tokens in `@theme inline` (current lines 121–123)**

```css
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Craftwork Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-display);
```

(`--font-serif` is deleted — Fraunces retired.)

- [ ] **Step 5: Verify CSS compiles via build**

Run: `cd dashboard && npm run build`
Expected: build succeeds (a few `text-emerald`/`bg-cream` utilities may still exist in consumers — that's fine until Task B4; Tailwind v4 only errors on missing `@theme` tokens used in `@apply`, not arbitrary class strings).
If build fails on an unknown utility in `@apply`, note the file for Task B4.

### Task B2: Strip Google Fonts + flip theme-color in `dashboard/index.html`

**Files:**
- Modify: `dashboard/index.html`

- [ ] **Step 1: Remove the three font `<link>` lines (the preconnect pair + the Google Fonts stylesheet, current lines 8–10) and flip theme-color**

Delete:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap" rel="stylesheet" />
```
Change:
```html
    <meta name="theme-color" content="#1F4E3F" />
```
to:
```html
    <meta name="theme-color" content="#011528" />
```

- [ ] **Step 2: Verify no Google Fonts remain**

Run: `grep -n "googleapis\|gstatic\|Fraunces" dashboard/index.html`
Expected: no output.

### Task B3: Import self-hosted Inter weights in `main.tsx`

**Files:**
- Modify: `dashboard/src/main.tsx`

- [ ] **Step 1: Add the Inter imports at the very top of `main.tsx` (before other imports)**

```ts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
```

- [ ] **Step 2: Verify build bundles them**

Run: `cd dashboard && npm run build`
Expected: build succeeds; `dist/assets/` contains `inter-*.woff2` files (self-hosted).
Run: `ls dashboard/dist/assets/*.woff2 | head`
Expected: woff2 assets present.

### Task B4: Mechanical token-rename sweep across `dashboard/src`

**Files:**
- Modify (sweep): all `dashboard/src/**/*.{tsx,ts,css}` except `index.css` (already done)

> Each token is one find/replace pass over class strings, then a grep-to-zero gate. Order matters: do longer/compound names before their prefixes.
>
> **⚠ Two traps (do not skip):**
> 1. **macOS `sed` has no `\b`** — use **`perl -i -pe`** for word-boundary replacements (`perl` ships with macOS).
> 2. **Do NOT sweep `signal`** in consumer files. The `signal` *color* token has **zero** utility consumers (it lived only in `index.css`, already handled in B1). The 7 src files containing "signal" use `AbortSignal` / `.signal` (fetch/AbortController) — renaming would break real code. `signal` is intentionally excluded below.
>
> `\b<token>\b` protects against substring collisions (e.g. `\bcream\b` will not match `stream`/`scream`/`creamy`).

- [ ] **Step 1: Rename the compound `*-soft` and `*-deep` tokens first (literal substrings — `sed` is safe here)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
FILES=$(grep -rl "emerald\|cream\|cinnamon" src --include="*.tsx" --include="*.ts" --include="*.css" | grep -v "src/index.css")
for f in $FILES; do
  sed -i '' \
    -e 's/emerald-soft/brand-soft/g' \
    -e 's/emerald-deep/primary-deep/g' \
    -e 's/cinnamon-soft/warning-soft/g' \
    -e 's/cream-deep/surface-2/g' \
    -e 's/cream-warm/surface-2/g' \
    "$f"
done
echo "compound pass done over $(echo "$FILES" | wc -l) files"
```

- [ ] **Step 2: Rename the base tokens (word-boundary via `perl`; `signal` deliberately omitted)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
FILES=$(grep -rl "emerald\|cream\|cinnamon" src --include="*.tsx" --include="*.ts" --include="*.css" | grep -v "src/index.css")
for f in $FILES; do
  perl -i -pe 's/\bemerald\b/primary/g; s/\bcream\b/canvas/g; s/\bcinnamon\b/warning/g;' "$f"
done
echo "base pass done"
```

- [ ] **Step 3: Grep-to-zero gate (the core verification)**

Run:
```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
grep -rnw "emerald\|cinnamon\|cream" src --include="*.tsx" --include="*.ts" --include="*.css" | grep -v "src/index.css"
```
Expected: **no output.** (`-w` matches whole words only, so `Devonxona`/`stream`/`AbortSignal` never false-positive. `signal` is not scanned — it's legitimate `AbortSignal` code.) If any line appears, hand-fix it and re-run.

- [ ] **Step 4: Review the high-value file `StatusBadge`**

Open `dashboard/src/components/common/StatusBadge.tsx` and confirm each status maps to the intended new token: ACTIVE/APPROVED/SIGNED-positive → `success` / `success-soft` or `brand`/`brand-soft`; PENDING_APPROVAL/EXPIRED/ON_LEAVE → `warning`/`warning-soft`; REJECTED/REVOKED/TERMINATED → `error`/`error-soft`; neutral (ARCHIVED/DRAFT) → `muted`/`surface-2`. Adjust any badge whose blanket-renamed color now reads wrong (e.g. a SIGNED badge that should be brand-blue, not green).

- [ ] **Step 5: Promote identity spots from `primary` to `brand`**

The blanket rename made every old `emerald` → `primary` (#0A6BE0, accessible). A few **large/identity** spots want the true brand blue `#0878FE` (`brand`): the login split-pane brand panel background, any oversized hero/marketing accent inside the app, and decorative large icons. Review these files and switch `primary`→`brand` only where the element is large/decorative (never small text):
- `dashboard/src/features/auth/LoginPage.tsx`
Leave all interactive text/buttons/links on `primary`.

- [ ] **Step 6: Build + lint gate**

Run: `cd dashboard && npm run build && npm run lint`
Expected: build clean; lint shows only the pre-existing tolerated `set-state-in-effect` / RHF `incompatible-library` baseline (no new errors).

### Task B5: Typography adopters — apply the display font

**Files:**
- Modify: `dashboard/src/components/ui/button.tsx:8`
- Modify: `dashboard/src/components/common/PageHeader.tsx:14`
- Modify: `dashboard/src/features/auth/LoginPage.tsx` (2 `font-serif`), `dashboard/src/components/layout/Sidebar.tsx:105`, `dashboard/src/features/documents/detail/A4Preview.tsx:73`

- [ ] **Step 1: Buttons → display font.** In `button.tsx`, add `font-heading` to the cva base string (it currently has `… text-sm font-medium whitespace-nowrap …`). Change `text-sm font-medium` to `text-sm font-medium font-heading`.

- [ ] **Step 2: Page titles → display font.** In `PageHeader.tsx`, change the `<h1>` class from `text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl` to `font-heading text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl`.

- [ ] **Step 3: Retire `font-serif` → `font-display`.** Replace `font-serif` with `font-display` in all four spots:

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
grep -rl "font-serif" src --include="*.tsx" | xargs sed -i '' 's/font-serif/font-display/g'
grep -rn "font-serif" src --include="*.tsx"   # expect: no output
```

- [ ] **Step 4: Grep gate for the retired font + verify display font present**

Run:
```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
grep -rn "font-serif\|Fraunces" src && echo "FAIL: serif remains" || echo "serif retired OK"
```
Expected: "serif retired OK".

- [ ] **Step 5: Build gate**

Run: `cd dashboard && npm run build`
Expected: clean.

### Task B6: Logo lockup + favicon

**Files:**
- Create: `dashboard/src/components/common/BrandMark.tsx`
- Modify: `dashboard/src/components/layout/Sidebar.tsx:82`, `dashboard/src/components/layout/TopBar.tsx:35`, `dashboard/src/features/auth/LoginPage.tsx:85,116`
- Replace: `dashboard/public/favicon.svg`

- [ ] **Step 1: Create the reusable `BrandMark` (inline icon SVG, no file import — base-safe)**

Create `dashboard/src/components/common/BrandMark.tsx`:
```tsx
import { cn } from '@/lib/utils';

/** Devon icon mark (blue swoosh). Decorative — pair with a text wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 715.15 712.76" aria-hidden className={cn('shrink-0', className)}>
      <path
        fill="currentColor"
        d="M341.05,557.1l54.54-1.34,58.28,129.84c-149.13,49.03-312.65-11.78-397.7-143.83C-31.75,405.26-14.67,227.79,94.84,110.91,205.64-7.34,383.13-34.67,524.95,46.54c138.15,79.11,208.93,244.03,161.49,403.62l-132.48-58.73c12.68-73.68-11.34-147.38-64.81-194.16-56.62-49.54-133.77-67.97-204.82-42.36-96.38,34.75-153.08,126.85-138.38,226.99,13.93,94.9,92.55,170.93,195.11,175.19Z"
      />
      <path
        fill="currentColor"
        d="M694.2,598.65l-94.4,94.3c-16.56,16.54-38.17,23.08-60.76,18.28-22.3-4.74-36.61-20.65-46.8-43.55l-75.37-169.2c-11.95-26.83-6.09-53.37,13.4-72.23,19.32-18.69,46.68-22.67,73.05-10.5l184.2,85c37.18,17.16,34.2,70.41,6.68,97.9Z"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Sidebar wordmark.** In `Sidebar.tsx`, replace the current brand line (`<span className="font-black text-lg tracking-[0.16em] text-ink">DEVON</span>` at line 82, plus whatever mark precedes it) with the icon + mixed-case wordmark:
```tsx
<BrandMark className="size-7 text-brand" />
<span className="font-display text-xl font-extrabold tracking-tight text-ink">Devon</span>
```
Add `import { BrandMark } from '@/components/common/BrandMark';` at the top.

- [ ] **Step 3: TopBar mobile logo.** In `TopBar.tsx:35`, replace `<span className="font-black text-sm tracking-[0.16em] text-ink">DEVON</span>` (and adjacent mark) with:
```tsx
<BrandMark className="size-6 text-brand" />
<span className="font-display text-base font-extrabold tracking-tight text-ink">Devon</span>
```
Add the `BrandMark` import.

- [ ] **Step 4: LoginPage wordmark (both spots, lines 85 & 116).** Replace each `<span className="font-black text-xl tracking-[0.16em] text-ink">DEVON</span>` with:
```tsx
<BrandMark className="size-7 text-brand" />
<span className="font-display text-xl font-extrabold tracking-tight text-ink">Devon</span>
```
Add the `BrandMark` import. (The slogan spans at lines 91/104 are already `font-display` after Task B5 Step 3 — keep them, recolored via Task B4.)

- [ ] **Step 5: Replace the dashboard favicon**

Overwrite `dashboard/public/favicon.svg` with the new mark on a white rounded square:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#FFFFFF"/>
  <g transform="translate(12 12) scale(0.056)">
    <path fill="#0878FE" d="M341.05,557.1l54.54-1.34,58.28,129.84c-149.13,49.03-312.65-11.78-397.7-143.83C-31.75,405.26-14.67,227.79,94.84,110.91,205.64-7.34,383.13-34.67,524.95,46.54c138.15,79.11,208.93,244.03,161.49,403.62l-132.48-58.73c12.68-73.68-11.34-147.38-64.81-194.16-56.62-49.54-133.77-67.97-204.82-42.36-96.38,34.75-153.08,126.85-138.38,226.99,13.93,94.9,92.55,170.93,195.11,175.19Z"/>
    <path fill="#0878FE" d="M694.2,598.65l-94.4,94.3c-16.56,16.54-38.17,23.08-60.76,18.28-22.3-4.74-36.61-20.65-46.8-43.55l-75.37-169.2c-11.95-26.83-6.09-53.37,13.4-72.23,19.32-18.69,46.68-22.67,73.05-10.5l184.2,85c37.18,17.16,34.2,70.41,6.68,97.9Z"/>
  </g>
</svg>
```

- [ ] **Step 6: Build + lint gate**

Run: `cd dashboard && npm run build && npm run lint`
Expected: clean (baseline lint only).

### Task B7: Dashboard verification sweep

- [ ] **Step 1: Full audit grep (proves rename + Google-Fonts removal complete)**

Run:
```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
{ grep -rnw "emerald\|cinnamon\|cream" dashboard/src; \
  grep -rn "Fraunces\|font-serif\|googleapis\|gstatic\|1F4E3F\|BC6E2B" dashboard/src dashboard/index.html; } | grep -v "dashboard/src/index.css:.*--color"
```
Expected: **no output.** (`signal` is excluded — `AbortSignal` is legitimate.)

- [ ] **Step 2: tsc + build + lint**

Run: `cd dashboard && npx tsc --noEmit && npm run build && npm run lint`
Expected: tsc clean; build clean (note module count + gzip < 500 KB); lint at tolerated baseline.

- [ ] **Step 3: Dev-server route sweep**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon/dashboard
npm run dev &  # note the local URL/base
```
Manually (or via curl on the printed base) load `/`, `/login`, `/employees`, `/employees/new`, `/units`, `/certificates`, `/documents`, `/documents/new`, `/approvals`, `/letters`, `/tasks`, `/audit`, `/profile`. Expected: all render, fonts load locally (Network tab shows woff2 from the app origin, **no fonts.googleapis.com**), colors are blue/navy, no console errors. Stop the dev server.

- [ ] **Checkpoint B:** Dashboard rebranded. Leave in working tree (user `/commit`s Phase B).

---

## Phase C — Landing

### Task C1: Landing fonts — self-host, drop Google Fonts

**Files:**
- Modify: `landing/index.html`

- [ ] **Step 1: Remove the Google-Fonts `<link>` lines (current lines 11–13) and add `@font-face` to the inline `<style>`**

Delete the `preconnect` lines + the `fonts.googleapis.com` stylesheet `<link>`. Then add at the top of the inline `<style>` block (use `.ttf`/`truetype` if Task A3 fell back):
```css
@font-face{font-family:"Craftwork Grotesk";src:url("fonts/CraftworkGrotesk-Variable.woff2") format("woff2");font-weight:400 800;font-display:swap}
@font-face{font-family:"Inter";src:url("fonts/inter-400.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Inter";src:url("fonts/inter-500.woff2") format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:"Inter";src:url("fonts/inter-600.woff2") format("woff2");font-weight:600;font-display:swap}
@font-face{font-family:"Inter";src:url("fonts/inter-700.woff2") format("woff2");font-weight:700;font-display:swap}
```

- [ ] **Step 2: Repoint the serif rules to Craftwork Grotesk (drop italic).** In the inline CSS, change every `.serif`, `.hero h1 .serif-accent`, `.quote-mark`, and `.footer-brand .slogan` rule: replace `font-family:'Fraunces',Georgia,serif` → `font-family:'Craftwork Grotesk',sans-serif` and remove `font-style:italic`.

- [ ] **Step 3: Grep gate**

Run: `grep -n "googleapis\|gstatic\|Fraunces\|font-style:italic" landing/index.html`
Expected: no output.

### Task C2: Landing `:root` vars + section recolor

**Files:**
- Modify: `landing/index.html`

- [ ] **Step 1: Replace the `:root` brand vars (current lines ~16–31) with the cool palette**

```css
  --canvas:#F7F9FC;
  --canvas-deep:#EEF2F8;
  --surface:#FFFFFF;
  --ink:#011528;
  --ink-soft:#0A2540;
  --body:#475569;
  --muted:#64748B;
  --line:#E6EAF0;
  --line-soft:#EEF2F8;
  --brand:#0878FE;
  --primary:#0A6BE0;
  --primary-deep:#0850A8;
  --brand-soft:#EAF2FE;
  --warning:#D97706;
  --warning-soft:#FEF3C7;
  --success:#16A34A;
```

- [ ] **Step 2: Rename var consumers (`var(--cream*)` → `var(--canvas*)`, `var(--emerald*)` → `var(--primary)`/`var(--brand)`, `var(--cinnamon*)` → `var(--warning*)`, `var(--signal)` → `var(--success)`)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
sed -i '' \
  -e 's/var(--cream-deep)/var(--canvas-deep)/g' \
  -e 's/var(--cream-warm)/var(--canvas-deep)/g' \
  -e 's/var(--cream)/var(--canvas)/g' \
  -e 's/var(--emerald-deep)/var(--primary-deep)/g' \
  -e 's/var(--emerald-soft)/var(--brand-soft)/g' \
  -e 's/var(--emerald)/var(--primary)/g' \
  -e 's/var(--cinnamon-soft)/var(--warning-soft)/g' \
  -e 's/var(--cinnamon)/var(--warning)/g' \
  -e 's/var(--signal)/var(--success)/g' \
  landing/index.html
grep -n "var(--cream\|var(--emerald\|var(--cinnamon\|var(--signal" landing/index.html  # expect: none
```

- [ ] **Step 3: Recolor the section-rotation classes.** Find the section-background utility rules (`.section--cream`, `.section--warm`, `.section--surface`, `.section--ink`, and any peach/mint/lavender variants). Set them to the cool sequence: keep `.section--surface` white; `.section--cream` → `var(--canvas)`; `.section--warm` → `var(--brand-soft)`; `.section--ink` → `var(--ink)` (navy, text `var(--canvas)`); any peach/mint/lavender variants → alternate `var(--canvas-deep)` / `var(--brand-soft)`. Confirm visually after build.

### Task C3: Landing hardcoded-hex sweep + SVG illustration recolor

**Files:**
- Modify: `landing/index.html`

- [ ] **Step 1: Replace the hardcoded brand hexes (covers inline SVG illustration colors too)**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
sed -i '' \
  -e 's/#1F4E3F/#0A6BE0/Ig' \
  -e 's/#173A30/#0850A8/Ig' \
  -e 's/#E5EEEA/#EAF2FE/Ig' \
  -e 's/#BC6E2B/#D97706/Ig' \
  -e 's/#F5E6D2/#FEF3C7/Ig' \
  -e 's/#FBF9F4/#F7F9FC/Ig' \
  -e 's/#FBF8F3/#F7F9FC/Ig' \
  -e 's/#F2EDDF/#EEF2F8/Ig' \
  -e 's/#F6F1E4/#EEF2F8/Ig' \
  -e 's/#E8E3D6/#E6EAF0/Ig' \
  -e 's/#EFEBE0/#EEF2F8/Ig' \
  -e 's/#3D7B66/#16A34A/Ig' \
  landing/index.html
```

- [ ] **Step 2: Grep gate for old brand hexes**

Run: `grep -ni "1F4E3F\|173A30\|BC6E2B\|FBF9F4\|FBF8F3\|F2EDDF\|3D7B66" landing/index.html`
Expected: no output. (Other neutral hexes like `#0F1014` ink and `#5A5E6A` body remain — repoint those in Step 3 if desired, but they read fine.)

- [ ] **Step 3: Repoint remaining neutral text hexes to the cool ink/body**

```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
sed -i '' -e 's/#0F1014/#011528/Ig' -e 's/#1A1D24/#0A2540/Ig' -e 's/#5A5E6A/#475569/Ig' landing/index.html
```

- [ ] **Step 4: Eyeball the inline SVG illustrations** (hero MacBook mock, document list, Kanban, org-tree, ERI phone). Confirm each now uses blue/navy/slate; manually fix any illustration accent the bulk sed missed (e.g. a green/amber detail that should now be blue). Look for `ИМЗО` Cyrillic text-fill `#BC6E2B`→ now `#D97706` (already swept).

### Task C4: Landing logo + favicon + theme-color

**Files:**
- Modify: `landing/index.html`
- Replace: `landing/favicon.svg`

- [ ] **Step 1: Flip theme-color (line 8)**

Change `<meta name="theme-color" content="#1F4E3F">` → `<meta name="theme-color" content="#011528">`.
(The favicon `<link>` + apple-touch-icon already point at `favicon.svg` — the file content is swapped in Step 3.)

- [ ] **Step 2: Update the nav/hero/footer wordmark.** Find the navbar wordmark (text "DEVON" / "Devon" with the old inline "D" mark) and the footer brand block. Replace the inline mark with the icon SVG (reuse the two `<path>`s from `landing/devon_icon.svg`, `fill="#0878FE"`) and render the wordmark text in Craftwork Grotesk (`font-family:'Craftwork Grotesk'`, weight 800, mixed-case "Devon"). In the footer, the slogan stays Craftwork Grotesk (already done in C1 Step 2) in `var(--primary)` or `var(--warning)` accent.

- [ ] **Step 3: Replace `landing/favicon.svg`** with the same new favicon markup as dashboard (Task B6 Step 5).

- [ ] **Step 4: Grep gate**

Run: `grep -ni "1F4E3F\|Fraunces\|googleapis\|DEVON<" landing/index.html`
Expected: no output (the uppercase `DEVON` wordmark is gone; mixed-case "Devon" remains).

### Task C5: Landing verification

- [ ] **Step 1: Final grep audit**

Run:
```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
grep -ni "1F4E3F\|173A30\|BC6E2B\|FBF9F4\|FBF8F3\|F2EDDF\|3D7B66\|Fraunces\|googleapis\|gstatic\|var(--cream\|var(--emerald\|var(--cinnamon" landing/index.html
```
Expected: **no output.**

- [ ] **Step 2: Visual check.** Open `landing/index.html` in a browser (or `python3 -m http.server` from `landing/`). Confirm: blue/navy palette throughout, Craftwork Grotesk headings + Inter body, fonts load from `fonts/` locally (no Google), new logo + favicon, section rotation reads cool/cohesive, device-mockup SVGs recolored, mobile menu still works (<820px). Note any section that needs a color nudge (per spec §7.2 — recolor is a judgment call; iterate once if needed).

- [ ] **Checkpoint C:** Landing rebranded. Leave in working tree (user `/commit`s Phase C).

---

## Phase D — Doc Cascade

### Task D1: Update `ai_context/AI_CONTEXT.md`

**Files:**
- Modify: `ai_context/AI_CONTEXT.md`

- [ ] **Step 1:** In "Brand voice & language defaults", replace the warm-palette/Inter+Fraunces description with the new identity: blue `#0878FE` / navy `#011528`, Craftwork Grotesk (display) + Inter (body), self-hosted (on-premise), cool-corporate surfaces.

- [ ] **Step 2:** In "Landing page — current state", update the visual-style bullet (wio-inspired warm pastel rotation → cool blue/navy rotation), fonts (Inter+Fraunces → Inter+Craftwork Grotesk, self-hosted), brand assets (favicon = blue mark; theme-color navy), and note Fraunces removed.

- [ ] **Step 3:** In the dashboard "Visual direction" + token-mapping paragraphs, replace the emerald/cream/cinnamon→shadcn mapping with the new token map (brand/primary/canvas/surface-2/warning/success) and Inter+CWG split. Note the hue-token rename (`emerald→primary/brand`, `cream→canvas`, `cinnamon→warning`, `signal→success`).

- [ ] **Step 4:** Verify no stale color/font claims remain: `grep -ni "emerald\|cinnamon\|cream\|fraunces" ai_context/AI_CONTEXT.md` — review each hit; the only acceptable remaining mentions are historical ("was emerald…") in the naming/history context.

### Task D2: Correct `ai_context/LESSONS.md`

**Files:**
- Modify: `ai_context/LESSONS.md`

- [ ] **Step 1:** In the Typography section, mark the "`font-serif` was italic-only" entry and the "landing intentionally keeps the italic Fraunces" note as **superseded by the 2026-06-14 rebrand** (Fraunces removed from both surfaces; serif role retired). Keep the historical note but add the supersession line.

- [ ] **Step 2:** Add a new lesson: **"Brand restyle — token rename + brand/primary contrast split"** covering: (a) the two-layer token architecture made the palette swap a values-rewrite + per-token consumer sweep with a grep-to-zero gate; (b) `#0878FE` fails AA as small text (4.1:1) so `brand` (identity/focus) and `primary` (#0A6BE0, interactive) are split; (c) fonts are self-hosted (`@fontsource/inter` + vendored Craftwork Grotesk woff2) to honor on-premise — no Google Fonts.

### Task D3: Append `ai_context/HISTORY.md` entry

**Files:**
- Modify: `ai_context/HISTORY.md`

- [ ] **Step 1:** Append a dated entry (2026-06-14) summarizing the rebrand: scope (both surfaces), palette (blue/navy cool-corporate), token rename, font split (CWG display / Inter body, self-hosted, Google Fonts dropped), new logo/favicon/theme-color, and the doc cascade. Link the spec + this plan + the ADR.

### Task D4: Write the first ADR

**Files:**
- Create: `docs/adr/0001-brand-restyle.md`

- [ ] **Step 1:** Create `docs/adr/0001-brand-restyle.md` with standard ADR sections — **Context** (new brand assets delivered; old warm identity clashed; on-premise font constraint), **Decision** (cool-corporate blue/navy palette; two-layer token rename to honest names; display/body font split; self-hosted fonts), **Consequences** (cohesive rebrand; ~70-file mechanical churn; `brand` vs `primary` contrast discipline going forward; no dark mode; landing section-recolor is a maintained judgment), **Status: Accepted (2026-06-14)**. Reference the spec.

### Task D5: QA_NOTES rebrand checklist + README verify

**Files:**
- Modify: `dashboard/QA_NOTES.md`, `README.md`

- [ ] **Step 1:** Add a "Brand restyle QA — 2026-06-14" section to `dashboard/QA_NOTES.md`: six-viewport sweep (360/390/768/1024/1280/1920), contrast spot-checks (body/muted/primary/badges per spec §8), font-load/FOUT check (woff2 from app origin, no Google), favicon + theme-color, print isolation still works, login + sidebar wordmark render. Mark observational items for the human operator.

- [ ] **Step 2:** Verify README has no brand-color/font facts to update: `grep -ni "emerald\|cream\|cinnamon\|fraunces\|inter\b" README.md`. Expected: no output (README is product-facing, no visual specifics). If any hit, update or confirm it's unrelated.

- [ ] **Checkpoint D:** Doc cascade complete. Leave in working tree (user `/commit`s Phase D).

---

## Final Verification

- [ ] **Repo-wide old-brand audit:**
```bash
cd /Users/sardorallaberganov/Desktop/Projects/Devon
{ grep -rnw "emerald\|cinnamon\|cream" dashboard/src landing/index.html; \
  grep -rn "Fraunces\|googleapis\|gstatic\|1F4E3F\|BC6E2B\|FBF9F4" dashboard/src dashboard/index.html landing/index.html; } \
  | grep -v "index.css:.*--color"
```
Expected: no output. (`signal` excluded — `AbortSignal` is real code. Historical mentions in `ai_context/*` are intentional and not scanned here.)

- [ ] **Dashboard:** `cd dashboard && npx tsc --noEmit && npm run build && npm run lint` — all clean, gzip < 500 KB.

- [ ] **Both surfaces visual:** dashboard dev-server + landing in a browser — blue/navy, Craftwork Grotesk display + Inter body, self-hosted fonts (no external font calls in Network), new logo + favicon.

- [ ] **Hand off the observational sweep** (viewports, real device, Lighthouse) to the operator via `QA_NOTES.md`.

- [ ] **Tell the user to run `/commit`** (do not auto-commit).

---

## Self-Review Notes (author)

- **Spec coverage:** §3 palette → B1/B4; §3.3 rename → B4; §4 typography → B1/B5; §4.2 self-host → A2/A3/B1/B3/C1; §5 logo/favicon → B6/C4; §6 dashboard surface → B*; §7 landing → C*; §8 a11y → B4-S4/S5 + B7 + QA; §9 doc cascade → D*. All covered.
- **No placeholders:** every code/command step is concrete; the only judgment calls (StatusBadge per-status mapping, landing section recolor, identity `brand` promotions) are explicitly scoped with criteria, not left vague.
- **Type/name consistency:** token names match across B1 (definition) and B4 (consumers): `brand`, `primary`, `primary-deep`, `brand-soft`, `canvas`, `surface-2`, `warning`/`-soft`, `success`/`-soft`, `error`/`-soft`. Font tokens `--font-display`/`--font-heading`/`--font-sans` consistent across B1/B5. `BrandMark` created in B6-S1, consumed B6-S2/3/4.
