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

Output goes to `dist/`. Deployed automatically via `.github/workflows/deploy.yml` (extended in step 14).

## Stack

Vite · React 19 · TypeScript · shadcn/ui · Tailwind · react-router · react-i18next · Zustand. See [`../docs/dashboard-prompts/00-master.md`](../docs/dashboard-prompts/00-master.md) for the full spec.
