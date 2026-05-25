# STEP 02 — Tailwind + shadcn/ui + Devon brand tokens

## Prerequisite
Master prompt loaded. Step 01 complete (Vite scaffold ready).

## Goal
Install and configure Tailwind CSS, initialise shadcn/ui with `style: new-york`, wire Devon's brand palette into CSS variables so every shadcn component renders in Devon brand colours automatically. Install the shadcn primitives needed across the build.

## Deliverables
- `dashboard/tailwind.config.ts` extending the theme with Devon palette
- `dashboard/postcss.config.js`
- `dashboard/src/index.css` with Tailwind layers + Devon CSS variables
- `dashboard/components.json` — shadcn config
- `dashboard/src/components/ui/` populated with the primitive set listed below
- `dashboard/src/lib/utils.ts` with the `cn()` helper
- A demo button on the home placeholder rendering in emerald to verify wiring

## Tasks

### 1. Install Tailwind and PostCSS

```bash
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`. Rename `tailwind.config.js` → `tailwind.config.ts` and update contents (see step 3).

### 2. Create `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Install the deps:
```bash
npm install clsx tailwind-merge class-variance-authority
```

### 3. Configure `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Devon palette (source-of-truth lives in :root vars in index.css)
        cream: { DEFAULT: 'hsl(var(--cream))', deep: 'hsl(var(--cream-deep))', warm: 'hsl(var(--cream-warm))' },
        ink: { DEFAULT: 'hsl(var(--ink))', soft: 'hsl(var(--ink-soft))' },
        emerald: {
          DEFAULT: 'hsl(var(--emerald))',
          deep: 'hsl(var(--emerald-deep))',
          soft: 'hsl(var(--emerald-soft))',
        },
        cinnamon: { DEFAULT: 'hsl(var(--cinnamon))', soft: 'hsl(var(--cinnamon-soft))' },
        signal: 'hsl(var(--signal))',

        // shadcn semantic tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 4. Write `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Devon palette */
    --cream: 38 40% 97%;
    --cream-deep: 41 39% 91%;
    --cream-warm: 42 47% 93%;
    --surface: 0 0% 100%;
    --ink: 230 14% 8%;
    --ink-soft: 224 16% 12%;
    --body-fg: 224 8% 38%;
    --muted-fg: 225 6% 64%;
    --line: 41 30% 87%;
    --emerald: 154 43% 21%;
    --emerald-deep: 155 43% 16%;
    --emerald-soft: 150 22% 92%;
    --cinnamon: 28 64% 45%;
    --cinnamon-soft: 32 67% 89%;
    --signal: 153 33% 36%;

    /* shadcn semantic tokens — map to Devon */
    --background: var(--cream);
    --foreground: var(--ink);
    --card: var(--surface);
    --card-foreground: var(--ink);
    --popover: var(--surface);
    --popover-foreground: var(--ink);
    --primary: var(--emerald);
    --primary-foreground: var(--cream);
    --secondary: var(--cream-deep);
    --secondary-foreground: var(--ink);
    --muted: var(--cream-warm);
    --muted-foreground: var(--body-fg);
    --accent: var(--cinnamon-soft);
    --accent-foreground: var(--cinnamon);
    --destructive: 0 70% 45%;
    --destructive-foreground: var(--cream);
    --border: var(--line);
    --input: var(--line);
    --ring: var(--emerald);
    --radius: 0.75rem;
  }

  * {
    @apply border-border;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: 'ss01', 'cv11', 'tnum';
  }

  /* Mobile safe-area bottom padding for sticky action bars */
  .pb-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 1rem);
  }
}
```

Add the Inter + Fraunces font links to `index.html` (same as landing):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600&display=swap" rel="stylesheet">
```

Import `src/index.css` from `src/main.tsx`.

### 5. Initialise shadcn/ui

```bash
npx shadcn@latest init
```

Answer prompts:
- TypeScript: yes
- Style: **new-york**
- Base color: **neutral** (we override via CSS vars)
- CSS file: `src/index.css`
- CSS variables: yes
- Tailwind config: `tailwind.config.ts`
- Import alias for components: `@/components`
- Import alias for utils: `@/lib/utils`
- React Server Components: no
- Write configuration to `components.json`: yes

### 6. Add the primitive set

```bash
npx shadcn@latest add button input label textarea card dialog sheet drawer table badge separator tabs accordion dropdown-menu avatar alert alert-dialog scroll-area skeleton sonner form select checkbox radio-group switch popover command tooltip breadcrumb pagination progress
```

Verify each landed under `src/components/ui/`. If any conflict on import paths, accept the default — Tailwind variables are already wired so the colours are correct.

### 7. Wire up the toaster

Edit `src/App.tsx`:

```tsx
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="container py-12">
      <h1 className="text-4xl font-bold tracking-tight text-ink mb-4">Devon Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Scaffold + Tailwind + shadcn ready. Step 02 complete.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Button>Primary (emerald)</Button>
        <Button variant="secondary">Secondary (cream-deep)</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </main>
  );
}
```

### 8. Sonner toast position

Sonner should be `top-center` on mobile (avoids covering the sticky CTA) and `bottom-right` on desktop. Move this customisation into the AppShell in Step 05; for now leave it at `top-center` globally.

## Acceptance checks

- [ ] `npm run dev` shows the demo buttons rendered in Devon brand colours: Primary in emerald (`#1F4E3F`), Secondary in cream-deep (`#F2EDDF`), Destructive in red
- [ ] Body background is cream (`#FBF9F4`); body text is ink (`#0F1014`)
- [ ] Inter is loaded — inspect the headline in DevTools, computed `font-family` includes `Inter`
- [ ] `Fraunces` is loaded but not in use yet (verify via DevTools network tab)
- [ ] `src/components/ui/` contains all 26 primitives listed above
- [ ] Tailwind utility `text-emerald` resolves to `hsl(154 43% 21%)`
- [ ] Hovering a `<Button>` shows the focus ring in emerald — this verifies `--ring` mapping
- [ ] `npm run build` succeeds; no Tailwind purge warnings; the built CSS contains the Devon palette variables

## Notes

- **Do NOT** edit shadcn primitive files (`src/components/ui/*.tsx`) directly unless you must override variants. Compose them in feature components instead.
- If you find a missing primitive later, add it via `npx shadcn@latest add <name>` — do not hand-roll.
- `darkMode: ['class']` is set but no dark theme is wired. Out of scope for the demo.

## What "done" looks like

Every shadcn primitive renders in Devon brand colours. The `cn()` helper is exported. The home placeholder shows a row of brand-coloured buttons that confirm token wiring end-to-end.
