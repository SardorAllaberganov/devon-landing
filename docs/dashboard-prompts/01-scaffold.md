# STEP 01 — Scaffold Vite + React + TypeScript

## Prerequisite
Master prompt loaded.

## Goal
Create an empty Vite + React + TypeScript project inside `dashboard/` (sibling to `landing/`), with the base path configured for GitHub Pages sub-path deployment. Dev server should serve at `/dashboard/` and `npm run build` should produce a `dist/` directory.

## Deliverables
- `dashboard/` directory with Vite project scaffold
- `dashboard/package.json` with project name `devon-dashboard`
- `dashboard/vite.config.ts` configured with the correct `base` and the `@/` alias
- `dashboard/tsconfig.json` with strict mode and the `@/*` path alias
- `dashboard/.gitignore` (Vite default)
- `dashboard/index.html` with Uzbek `lang="uz"`, Devon title, theme-color meta
- `dashboard/public/favicon.svg` (copied from `landing/favicon.svg`)
- `dashboard/README.md` — one-page how-to-run

## Tasks

### 1. Scaffold the Vite project

From the repo root:
```bash
npm create vite@latest dashboard -- --template react-ts
cd dashboard
npm install
```

Verify the default Vite app starts: `npm run dev`. Stop the server.

### 2. Configure base path

The dashboard ships under `/<repo>/dashboard/` on GitHub Pages. Use the repo name `Devon`.

Edit `dashboard/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: '/Devon/dashboard/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: '/Devon/dashboard/',
  },
});
```

> If the repository name changes, this `base` is the single source of truth — update it here and the deploy workflow once.

### 3. TypeScript paths

Edit `dashboard/tsconfig.json` to add the `@/*` alias and ensure strict mode:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json` keeps Vite's default config-only scope.

### 4. Update `index.html`

Replace the Vite default `dashboard/index.html` with:

```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/Devon/dashboard/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#1F4E3F" />
    <title>Devon — Boshqaruv paneli</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

> `viewport-fit=cover` matters for iOS safe-area insets, used later by the mobile sticky CTA pattern.

### 5. Copy the favicon

```bash
cp ../landing/favicon.svg public/favicon.svg
```

### 6. Clean default boilerplate

Replace `src/App.tsx` with a minimal placeholder that proves wiring works:

```tsx
export default function App() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Devon Dashboard</h1>
      <p>Scaffold ready. Step 01 complete.</p>
    </main>
  );
}
```

Delete:
- `src/App.css`
- `src/index.css` (will be re-created in Step 02 with Tailwind)
- `src/assets/react.svg` (unused)
- `public/vite.svg` (unused)

Update `src/main.tsx` to remove the `index.css` import.

### 7. Write `dashboard/README.md`

```markdown
# Devon Dashboard

On-premise corporate document workflow platform — admin dashboard.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/Devon/dashboard/`.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deployed automatically via `.github/workflows/deploy.yml`.

## Stack

Vite · React 18 · TypeScript · shadcn/ui · Tailwind · react-router · react-i18next · Zustand. See `docs/dashboard-prompts/00-master.md` for the full spec.
```

## Acceptance checks

- [ ] `dashboard/` exists at the repo root, sibling to `landing/`
- [ ] `cd dashboard && npm install` succeeds with zero peer-dep warnings unaccounted for
- [ ] `npm run dev` serves the placeholder page at `http://localhost:5173/Devon/dashboard/`
- [ ] Visiting `http://localhost:5173/` redirects/serves to the dashboard base path
- [ ] `npm run build` produces `dashboard/dist/` with `index.html` referencing assets under `/Devon/dashboard/assets/...`
- [ ] `import x from '@/lib/whatever'` resolves cleanly in TypeScript (verify by writing a temporary import in `App.tsx` and confirming no red squiggle, then revert)
- [ ] Browser tab shows the Devon favicon and the Uzbek page title

## Notes

- We are intentionally **not** installing Tailwind, shadcn, router, i18n yet. Each gets its own step so a fresh session can focus on one concern.
- If the user's GitHub repo is at a different path (not `Devon`), update `vite.config.ts#base` and `index.html#favicon href`.
- Do NOT commit `node_modules` (Vite scaffold's `.gitignore` already excludes it).

## What "done" looks like

A clean Vite scaffold with the right base path, ready for Step 02 to layer Tailwind + shadcn/ui on top.
