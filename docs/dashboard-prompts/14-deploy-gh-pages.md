# STEP 14 — GitHub Pages deploy (landing + dashboard in one site)

## Prerequisite
Master prompt loaded. Steps 01–13 complete. Local `npm run build` produces a valid `dashboard/dist/`.

## Goal
Extend the existing GitHub Pages workflow so a single deploy ships both the landing page (existing) and the React dashboard (new). Configure the SPA 404 fallback so refreshing or deep-linking to `/dashboard/employees` works on a static host. Smoke-test the production deploy.

## Deliverables
- Updated `.github/workflows/deploy.yml`
- `dashboard/public/404.html` (SPA fallback)
- Updated `dashboard/index.html` (script for spa-github-pages handoff)
- `.gitignore` adjustments (don't commit `dashboard/dist` or `dashboard/node_modules`)
- Production verification checklist

## Tasks

### 1. SPA 404 fallback — `dashboard/public/404.html`

Standard [spa-github-pages](https://github.com/rafgraph/spa-github-pages) snippet:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Devon</title>
    <script>
      // Single Page Apps for GitHub Pages
      // MIT License (https://github.com/rafgraph/spa-github-pages)
      var pathSegmentsToKeep = 2; // <repo>/dashboard/
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
```

> `pathSegmentsToKeep = 2` because the live URL has two segments before SPA routes: `/Devon/dashboard/`. If the repo path changes (e.g., custom domain), update this.

### 2. SPA handoff in `dashboard/index.html`

Add a small script in the `<head>` BEFORE the main bundle loads. This decodes the redirect from `404.html` back into a clean URL the React router can consume:

```html
<script>
  // Single Page Apps for GitHub Pages — handoff
  // MIT License
  (function (l) {
    if (l.search[1] === '/' ) {
      var decoded = l.search.slice(1).split('&').map(function (s) {
        return s.replace(/~and~/g, '&');
      }).join('?');
      window.history.replaceState(
        null, null,
        l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location));
</script>
```

Place this script *before* the `<script type="module" src="/src/main.tsx">` line.

### 3. Update `.github/workflows/deploy.yml`

Current workflow uploads only `./landing`. Extend it to build the dashboard and combine both into the artifact.

```yaml
name: Deploy Devon site (landing + dashboard) to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'landing/**'
      - 'dashboard/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dashboard deps
        working-directory: ./dashboard
        run: npm ci

      - name: Build dashboard
        working-directory: ./dashboard
        run: npm run build

      - name: Assemble Pages artifact
        run: |
          mkdir -p ./pages-dist
          cp -R ./landing/. ./pages-dist/
          mkdir -p ./pages-dist/dashboard
          cp -R ./dashboard/dist/. ./pages-dist/dashboard/

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./pages-dist

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Key points:
- Two jobs: `build` and `deploy`, so the artifact is cleanly produced before deploy.
- Node 20 LTS.
- `npm ci` (deterministic install) instead of `npm install`.
- Workflow triggers on changes to `landing/`, `dashboard/`, or itself.

### 4. `.gitignore` adjustments

Append to the repo root `.gitignore`:

```
# Dashboard build artefacts
dashboard/node_modules/
dashboard/dist/
dashboard/.vite/

# Tooling
dashboard/.eslintcache
```

### 5. Verify `vite.config.ts` base path matches the repo

If the user's repo path is `<owner>/Devon`, then the live URLs are:
- Landing: `https://<owner>.github.io/Devon/`
- Dashboard: `https://<owner>.github.io/Devon/dashboard/`

So `vite.config.ts` must have `base: '/Devon/dashboard/'`. If the repo is a User Pages repo (`<owner>.github.io`), the base is `/dashboard/` instead.

Confirm before deploying. The `index.html`'s favicon href and `404.html`'s `pathSegmentsToKeep` must align.

### 6. Add a deploy preview run

Before pushing to main:

```bash
cd dashboard
npm ci
npm run build
npx serve dist -p 4173
```

Open `http://localhost:4173/Devon/dashboard/` — verify the app loads at the sub-path. Test deep-linking by directly navigating to `http://localhost:4173/Devon/dashboard/employees`. (This will 404 on `serve` without the fallback — that's expected; GitHub Pages routes 404s to `404.html` which then redirects.)

### 7. Push & verify

```bash
git add dashboard .github/workflows/deploy.yml .gitignore
git commit -m "feat(dashboard): scaffold + deploy to GitHub Pages"
git push origin main
```

Watch the workflow run in the GitHub UI. On success:

- Visit `https://<owner>.github.io/Devon/` — landing still loads
- Visit `https://<owner>.github.io/Devon/dashboard/` — login screen loads
- Login with `admin@devon.uz` / `Demo2026!`
- Navigate around — all routes work
- Refresh on `/Devon/dashboard/employees` — works (404 → fallback → SPA route)
- Direct paste of `https://<owner>.github.io/Devon/dashboard/audit` in a new tab — works

### 8. Add a "Demo" link from landing

Edit `landing/index.html` and make the existing CTA point to `/Devon/dashboard/` (or whatever the resolved sub-path is). The "Demo so'rang" button on the landing should now open the live dashboard.

Find the CTA in `landing/index.html`:
```html
<a href="..." class="btn btn-primary">Demo so'rang</a>
```
Change to:
```html
<a href="dashboard/" class="btn btn-primary">Demoga kirish</a>
```
(Relative href so it works both locally and on GH Pages.)

## Acceptance checks

- [ ] `git push` triggers the workflow; workflow finishes green
- [ ] `https://<owner>.github.io/Devon/` loads the landing
- [ ] `https://<owner>.github.io/Devon/dashboard/` loads the login screen
- [ ] Login → home → navigate to every route → no console errors
- [ ] Hard-refresh on a deep route (e.g., `/Devon/dashboard/units`) → page renders correctly
- [ ] Direct link share (e.g., `/Devon/dashboard/employees/<uuid>`) opens the right profile
- [ ] Devtools network tab: no requests to `vite.svg` or other absent assets
- [ ] Favicon loads on dashboard tab
- [ ] Landing CTA "Demoga kirish" navigates to the dashboard
- [ ] **Mobile production check**: open the live dashboard on a phone; every breakpoint works as it did locally
- [ ] `Reset demo` in the user menu works in production (clears `devon.dashboard.*` localStorage and re-seeds)

## Notes

- If the repo path changes, three places must be kept in sync:
  - `dashboard/vite.config.ts` → `base`
  - `dashboard/public/404.html` → `pathSegmentsToKeep`
  - `dashboard/index.html` → favicon `href`
- The deploy may take 30–90 seconds. Pages cache layer occasionally needs a hard refresh.
- If you ever switch to a custom domain (e.g., `dashboard.devon.uz`), then:
  - `base` becomes `/`
  - `pathSegmentsToKeep` becomes `0`
  - Add a `CNAME` file under `dashboard/public/`

## What "done" looks like

A single push to `main` rebuilds and redeploys both the landing and the React dashboard. Customers can click "Demoga kirish" on the marketing page and immediately interact with the product. Refreshing a deep URL doesn't break.
