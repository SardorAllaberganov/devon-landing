# Devon Dashboard — Build Prompt Set

This folder contains a structured set of prompts that drive the build of the **Devon Dashboard** — a Vite + React + TypeScript single-page application demonstrating the HR & User Management module from `../Plyma TZ xodim kiritish.docx`. The prompts are designed for execution across multiple AI sessions; each step assumes the previous steps are complete.

## Files

| File | What it is |
|---|---|
| [`00-master.md`](./00-master.md) | **Foundational context.** Loaded into every session. Tech stack, brand tokens, mobile-first rules, i18n rules, mock-backend rules, file structure, quality bars. |
| [`01-scaffold.md`](./01-scaffold.md) | Vite + React + TS scaffold, base path, favicon |
| [`02-tailwind-shadcn.md`](./02-tailwind-shadcn.md) | Tailwind + shadcn/ui + Devon brand tokens, primitive install |
| [`03-i18n.md`](./03-i18n.md) | react-i18next, Uzbek JSON skeleton, date/number helpers |
| [`04-routing-auth.md`](./04-routing-auth.md) | Router, mock auth, mobile-first login page |
| [`05-app-shell.md`](./05-app-shell.md) | Sidebar drawer, top bar, user menu, responsive layout |
| [`06-mock-backend.md`](./06-mock-backend.md) | localStorage-backed mock API, schemas, seed data |
| [`07-dashboard-home.md`](./07-dashboard-home.md) | Home page: stats, activity, quick actions, expiring-cert alert |
| [`08-flow1-units.md`](./08-flow1-units.md) | Flow 1: Tarkibiy bo'linmalar (org tree CRUD, accordion on mobile) |
| [`09-flow2-employees-list.md`](./09-flow2-employees-list.md) | Flow 2 list: table on desktop, cards on mobile, filter sheet |
| [`10-flow2-employee-wizard.md`](./10-flow2-employee-wizard.md) | Flow 2 wizard: 4-step employee creation, full-screen on mobile |
| [`11-flow3-assignments.md`](./11-flow3-assignments.md) | Flow 3: profile, assignment transfer, vertical timeline |
| [`12-flow4-certificates.md`](./12-flow4-certificates.md) | Flow 4: Kanban + tabs, PFX upload (fake parser), approval queue |
| [`13-profile-audit.md`](./13-profile-audit.md) | Self-service profile + password change + audit log |
| [`14-deploy-gh-pages.md`](./14-deploy-gh-pages.md) | Extend GH Pages workflow, SPA 404 fallback, smoke test |
| [`15-final-qa.md`](./15-final-qa.md) | Full QA sweep: mobile, a11y, six states, copy review |

## How to use this set

### Recommended flow (one step per session)

1. **Open a fresh AI session** in Cursor / Claude Code / Copilot CLI.
2. **Paste `00-master.md` first** as the foundational context.
3. **Then paste the current step prompt** (e.g., `01-scaffold.md`).
4. Let the AI execute the step. Review the produced files.
5. Commit the changes.
6. Move to the next step in a new session.

This pattern keeps each session's context window focused on one concern, avoiding drift and stale assumptions.

### Alternative: monolithic session

If you prefer one long session:

1. Paste `00-master.md`.
2. Then paste `01-scaffold.md`. Wait for completion.
3. Paste `02-tailwind-shadcn.md`. Continue.
4. ...and so on through `15-final-qa.md`.

Token usage will be heavier and the AI may forget earlier acceptance criteria. The per-session flow is preferred.

### Skipping ahead

**Don't.** Each step assumes the previous ones are complete:

- Step 04 (routing) assumes step 02 (shadcn) is in place
- Step 06 (mock backend) seeds data that step 07 (home), step 08 (units), step 09 (employees) all read
- Step 10 (wizard) calls `createEmployeeFull` which only exists after step 06

If a step is too large for a single session, decompose it locally — but don't reorder.

## Decisions baked into the set

These decisions came out of a brainstorming session and are encoded throughout the prompts. They are not up for re-litigation step-by-step:

| Decision | Choice | Where it lives |
|---|---|---|
| **Scope** | Full 4-flow demo | Master §2 |
| **URL strategy** | Same site, `/dashboard/` sub-path, BrowserRouter + SPA 404 trick | Master §11, step 14 |
| **Visual tone** | Brand-warm chrome, neutral work surfaces | Master §6 |
| **i18n** | react-i18next scaffolded day-one, UZ filled, RU/EN empty | Master §8, step 03 |
| **Auth/roles** | Single HR_ADMIN demo user, hardcoded credentials shown on login | Master §10, step 04 |
| **Mobile-first** | Sidebar drawer, tables→cards, full-screen wizard on mobile, sticky CTAs | Master §7 |
| **Mock backend** | localStorage + zod schemas + 3% failure simulation + seeded data | Master §9, step 06 |
| **Tests** | Skipped for the demo; can be added later | Master §17 |

If a decision needs to change mid-build, update `00-master.md` first, then propagate to the affected step prompts.

## Repo layout once complete

```
Devon/
├── landing/                        ← existing marketing site
│   ├── index.html
│   └── favicon.svg
├── dashboard/                      ← built via this prompt set
│   ├── public/
│   │   ├── 404.html
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/             ← shadcn + layout + common
│   │   ├── features/               ← auth, dashboard-home, units, employees, certificates, profile, audit
│   │   ├── i18n/
│   │   ├── lib/                    ← mock-backend, utils, validators
│   │   ├── stores/                 ← zustand
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
├── .github/workflows/deploy.yml   ← extended to ship both
└── docs/dashboard-prompts/        ← this folder
```

## When to update this prompt set

- A core decision changes (e.g., switch from BrowserRouter to HashRouter) → update `00-master.md` first, then the impacted steps.
- A new module is added to the demo (e.g., a fifth flow) → add `16-...md`, update this README's table.
- A step prompt produced wrong output → fix the prompt's acceptance checks or task list so the next session catches the issue.
- The TZ document is updated → reflect the changes in `00-master.md` §15 (data models) and the relevant flow step.

Do **not** edit the produced code in `dashboard/src/...` from this folder. The prompts produce code; the code is the source of truth for behaviour. The prompts capture intent and conventions.

## Related docs

- [`../Plyma TZ xodim kiritish.docx`](../Plyma%20TZ%20xodim%20kiritish.docx) — TZ source-of-truth
- [`../product-specification.md`](../product-specification.md) — higher-level product spec
- [`../../CLAUDE.md`](../../CLAUDE.md) — workflow orchestration
- [`../../ai_context/AI_CONTEXT.md`](../../ai_context/AI_CONTEXT.md) — current project state
- [`../../landing/index.html`](../../landing/index.html) — brand tokens source
