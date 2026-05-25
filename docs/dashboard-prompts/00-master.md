# MASTER PROMPT — Devon Dashboard

> Load this file FIRST in every session that builds or modifies the Devon Dashboard. Then layer the relevant step prompt (`01-...`, `02-...`, etc.) for the task. Without this file, the step prompts lack the context they need.

---

## 1. Product context

**Devon** is an on-premise corporate platform for digitising internal document workflows in Uzbek organisations — government bodies, state-owned enterprises, banks, holding companies, ministries. It replaces paper-based "soglasovaniya" (collaborative approval) with a fully digital, auditable system.

- **Audience:** 50+ employee organisations with hierarchical structures and existing paper workflows
- **Deployment model:** Fully on-premise. Data sovereignty is a hard constraint
- **Languages:** Uzbek-first. Russian and English are first-class targets for later phases
- **Roles:** Super Admin · HR Admin · HR Operator · Unit Head · Employee · Auditor
- **Org hierarchy (4 levels, canonical Uzbek names):** Departament → Boshqarma → Bo'lim → Sho'ba

**Naming history.** Codename evolution: PLYMO → PLYMA → **Devon** (current). Legacy artefacts (the TZ docx in particular) use "PLYMA" — treat as Devon.

---

## 2. What you are building

A **Vite + React + TypeScript single-page application** that demonstrates the **HR & User Management module** from the source-of-truth technical specification `docs/Plyma TZ xodim kiritish.docx`. The module covers four business flows:

| # | Flow | Uzbek term |
|---|---|---|
| 1 | Structural-unit (org) tree CRUD | Tarkibiy bo'linmalar |
| 2 | Employee onboarding via 4-step wizard | Xodimni tizimga kiritish |
| 3 | Employee ↔ unit assignment, transfers, history | Biriktirish va o'tkazma |
| 4 | ERI (digital certificate) management | Elektron raqamli imzo (ERI) kalitlari |

**This is a frontend-only demo deployed to GitHub Pages.** There is no real backend. All "API" interactions are mocked via `localStorage` with realistic Uzbek seed data. The point is to show prospective customers (Uzbek decision-makers in government / banking / SOE) what the system looks and feels like.

---

## 3. Repository context

Devon already has a marketing landing page at `landing/index.html` deployed via `.github/workflows/deploy.yml`. The dashboard lives in a **sibling folder** named `dashboard/`. The Pages workflow will be extended to ship both:

- `<owner>.github.io/<repo>/` → `landing/index.html` (existing)
- `<owner>.github.io/<repo>/dashboard/` → React SPA (new — what you build)

Relevant existing files to be aware of:

| Path | What it is |
|---|---|
| `README.md` | Product overview |
| `CLAUDE.md` | Workflow orchestration rules |
| `ai_context/AI_CONTEXT.md` | Current project state snapshot |
| `ai_context/HISTORY.md` | Session log |
| `landing/index.html` | Marketing site, source of brand tokens |
| `landing/favicon.svg` | Brand mark, re-use for dashboard |
| `.github/workflows/deploy.yml` | Existing Pages deploy (will be extended in step 14) |
| `.claude/rules/*.md` | Design discipline rules (some Devon, some legacy ZhiPay — apply selectively) |
| `docs/Plyma TZ xodim kiritish.docx` | The TZ (Uzbek). Treat as the canonical functional spec |
| `docs/product-specification.md` | Higher-level product spec |
| `docs/glossary.md` | Uzbek terminology + pronunciation |

---

## 4. Tech stack (locked)

| Concern | Choice | Notes |
|---|---|---|
| Build tool | **Vite 8** | `--template react-ts`; ships split tsconfig (`tsconfig.json` references `tsconfig.app.json` + `tsconfig.node.json`) |
| Language | **TypeScript 6** | `"strict": true`; no `baseUrl` (deprecated in TS 6 — paths resolve relative to tsconfig) |
| Framework | **React 19** | function components only |
| UI library | **shadcn/ui** (v4+ CLI) | `--template vite --base radix --preset nova` (Nova is the current shadcn preset analogue of the old "new-york" style); themed via CSS vars to Devon palette. The `form` registry entry is silently skipped by the Nova preset — hand-add a canonical form primitive when a real form lands. |
| Styling | **Tailwind CSS 4** | CSS-first config via `@theme inline` in `index.css`; no `tailwind.config.ts`. Vite integration via `@tailwindcss/vite` plugin. Animations via `tw-animate-css` (drop-in replacement for v3's `tailwindcss-animate`). |
| Routing | **react-router-dom v6** | `BrowserRouter`, `basename` from `import.meta.env.BASE_URL` |
| Global state | **Zustand** | one store per concern (`useAuthStore`, `useUiStore`, etc.) |
| Server-state | Not used | plain async functions over the mock backend; no React Query |
| Forms | **react-hook-form + zod** | shadcn's default |
| i18n | **react-i18next** | namespaces `common` and `dashboard`; UZ filled, RU/EN scaffolded |
| Date | **date-fns** | `uz` locale |
| Icons | **lucide-react** | tree-shaken |
| Toasts | **sonner** (via shadcn) | top-centre on mobile, bottom-right on desktop |
| Tests | Skipped for the demo | can be added later (Vitest + RTL) |

Do **not** introduce additional runtime dependencies without strong justification.

---

## 5. Brand tokens — Devon palette mapped to shadcn semantic tokens

Devon's landing palette MUST drive the dashboard. shadcn components consume CSS variables defined in `index.css`. Tailwind's theme reads the same variables.

### Devon palette (source of truth: `landing/index.html`)

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--cream` | `#FBF9F4` | `38 40% 97%` | App background |
| `--cream-deep` | `#F2EDDF` | `41 39% 91%` | Sidebar background, soft sections |
| `--cream-warm` | `#F6F1E4` | `42 47% 93%` | Page header bands, hero stat backgrounds |
| `--surface` | `#FFFFFF` | `0 0% 100%` | Cards, table rows, work surfaces |
| `--ink` | `#0F1014` | `230 14% 8%` | Primary text |
| `--ink-soft` | `#1A1D24` | `224 16% 12%` | Secondary text on dark surfaces |
| `--body` | `#5A5E6A` | `224 8% 38%` | Body / paragraph text |
| `--muted-fg` | `#9DA0A8` | `225 6% 64%` | Captions, placeholders |
| `--line` | `#E8E3D6` | `41 30% 87%` | Borders, dividers |
| `--emerald` | `#1F4E3F` | `154 43% 21%` | **Primary brand colour** — buttons, active nav, focus ring |
| `--emerald-deep` | `#173A30` | `155 43% 16%` | Primary hover |
| `--emerald-soft` | `#E5EEEA` | `150 22% 92%` | Primary pill backgrounds, status ACTIVE |
| `--cinnamon` | `#BC6E2B` | `28 64% 45%` | Accent — eyebrow text, secondary badges |
| `--cinnamon-soft` | `#F5E6D2` | `32 67% 89%` | Cinnamon pill backgrounds, status PENDING |
| `--signal` | `#3D7B66` | `153 33% 36%` | Positive signal — success toasts, completion dots |

### shadcn semantic mapping (in `index.css`)

Tailwind v4 is CSS-first — there is no `tailwind.config.ts`. The canonical wiring uses three layers in `src/index.css`:

1. **Imports** — `tailwindcss`, `shadcn/tailwind.css`, `tw-animate-css`.
2. **`:root`** — defines shadcn's semantic CSS variables (`--primary`, `--background`, etc.) with `hsl(...)` values drawn from the Devon palette. Also exposes Devon brand-name tokens (`--color-emerald`, `--color-cream-deep`, etc.) for direct utility access.
3. **`@theme inline`** — maps both the shadcn semantic vars and the Devon brand-name vars to Tailwind utility tokens (`--color-primary: var(--primary)` etc.), so utilities like `bg-primary`, `text-emerald`, `bg-cream-deep` all resolve correctly.

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* shadcn semantic tokens — mapped to Devon palette in HSL */
  --background: hsl(38 40% 97%);          /* cream */
  --foreground: hsl(230 14% 8%);          /* ink */
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(230 14% 8%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(230 14% 8%);
  --primary: hsl(154 43% 21%);            /* emerald */
  --primary-foreground: hsl(38 40% 97%);
  --secondary: hsl(41 39% 91%);           /* cream-deep */
  --secondary-foreground: hsl(230 14% 8%);
  --muted: hsl(42 47% 93%);               /* cream-warm */
  --muted-foreground: hsl(224 8% 38%);
  --accent: hsl(32 67% 89%);              /* cinnamon-soft */
  --accent-foreground: hsl(28 64% 45%);   /* cinnamon */
  --destructive: hsl(0 70% 45%);
  --border: hsl(41 30% 87%);              /* line */
  --input: hsl(41 30% 87%);
  --ring: hsl(154 43% 21%);
  --radius: 0.75rem;

  /* Sidebar + chart tokens (used by shadcn sidebar/chart primitives later) */
  --sidebar: hsl(41 39% 91%);
  --sidebar-foreground: hsl(230 14% 8%);
  --sidebar-primary: hsl(154 43% 21%);
  --sidebar-primary-foreground: hsl(38 40% 97%);
  --sidebar-accent: hsl(32 67% 89%);
  --sidebar-accent-foreground: hsl(28 64% 45%);
  --sidebar-border: hsl(41 30% 87%);
  --sidebar-ring: hsl(154 43% 21%);
  --chart-1: hsl(154 43% 21%);
  --chart-2: hsl(28 64% 45%);
  --chart-3: hsl(153 33% 36%);
  --chart-4: hsl(155 43% 16%);
  --chart-5: hsl(225 6% 64%);

  /* Devon brand-name tokens (also exposed via @theme inline below) */
  --color-cream: hsl(38 40% 97%);
  --color-cream-deep: hsl(41 39% 91%);
  --color-emerald: hsl(154 43% 21%);
  --color-cinnamon: hsl(28 64% 45%);
  /* ...etc. — see dashboard/src/index.css for the full list */
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-emerald: var(--color-emerald);
  /* ...full list in dashboard/src/index.css */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Fraunces", Georgia, serif;
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

Vite plugs Tailwind in via `@tailwindcss/vite` (one `plugins: [react(), tailwindcss()]` line in `vite.config.ts`). shadcn primitives use the semantic names (`bg-primary`, `text-foreground`, `border-border`) directly; the Devon palette is wired in once and inherits everywhere.

---

## 6. Visual tone — "brand-warm chrome, neutral work surfaces"

| Surface category | Background | Spacing | Brand usage |
|---|---|---|---|
| **Chrome** — sidebar, top bar, page headers, hero stat cards, empty states, login page | `cream` / `cream-deep` / `cream-warm` | Generous (24–32px paddings) | Emerald for active states, cinnamon for accent / eyebrow |
| **Work surfaces** — data tables, form fields inside cards, wizard step content, modal bodies | `surface` (white) | Tight (12–16px paddings, 44pt row min on mobile) | Brand only on status badges, primary CTAs, focus rings |

### Typography
- **Inter** for UI text (already loaded by landing's Google Fonts link — re-load from same CDN)
- **Fraunces** italic for restrained accents only (e.g., the word "Boshqaring" inside a page title) — never run paragraphs in Fraunces
- Tabular figures for numbers in tables: `font-feature-settings: "tnum"`

### Iconography
- `lucide-react` only
- 16px in dense rows, 20px standard, 24px in primary CTAs
- Stroke width 1.6 for crispness

---

## 7. Mobile-first rules (NON-NEGOTIABLE)

> The first time many prospective customers see this demo will be on a phone — a Telegram-shared link clicked from a meeting. The dashboard MUST be usable on a 360×640 viewport, not merely "not broken."

### Breakpoints (Tailwind defaults)

| Token | Min width | Treat as |
|---|---|---|
| (default) | 0 | Mobile portrait — start here |
| `sm` | 640px | Large phone / phablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small laptop |
| `xl` | 1280px | Laptop / desktop |
| `2xl` | 1536px | Large desktop |

Max content width: 1280px (mirror landing's container). Centre with `mx-auto px-4 md:px-8`.

### Mobile→desktop component patterns

| Component | Mobile (<768px) | Desktop (≥768px) |
|---|---|---|
| **Sidebar nav** | Hidden by default. Hamburger opens a `Sheet` (full-height drawer from the left) | Persistent left sidebar, 240px wide |
| **Top bar** | Compressed: hamburger · logo dot · avatar | Full: logo · breadcrumbs · global search · notifications · avatar |
| **Page header** | Title + primary CTA stack vertically; secondary actions in an overflow menu | Title left, primary + secondary CTAs right |
| **Data tables** | Stack as a card list — each row a `Card` with key fields, swipe/tap into detail | Full `Table` with all columns |
| **Wizard** (4 steps) | **Dedicated full-screen route** (`/employees/new`). One step per scroll view. Stepper as a horizontal pill scroll at top, primary CTA sticky at bottom | Modal `Dialog` (or `Sheet` from right) with stepper across the top |
| **Org tree** | `Accordion` — each level expands inline | True tree view with expand/collapse chevrons |
| **Form fields** | Single column; labels above; sticky action bar at bottom | Two-column where appropriate; actions inline at end of form |
| **Modals** | `Sheet` from bottom, full height when content is long | `Dialog` centred, max-width 560px |
| **Filters** | Filter chip row → tapping opens a `Sheet` from bottom with all filters | Inline above the table |
| **Kanban** (certificates) | Tabs per column (one column visible at a time) | Horizontal scrolling Kanban |
| **Timeline** (assignments) | Vertical, full width | Vertical, max-width 720px, indented |

### Touch & input
- Minimum tap target **44×44pt** on mobile (per a11y rules)
- No hover-only affordances on mobile (no tooltip-only actions)
- Use `inputMode="numeric"` for PINFL field, `inputMode="tel"` for phone, `autoCapitalize="words"` for FIO
- Forms get a `sticky bottom-0 bg-background border-t` action bar on mobile so the primary CTA is always reachable above the keyboard
- Disable text selection on chrome elements (`select-none` on sidebar, top bar)

### Tested at (every screen)
| Width | Device class |
|---|---|
| 360×640 | Small Android (Galaxy A) |
| 390×844 | iPhone 14 / 15 |
| 768×1024 | iPad portrait |
| 1024×1366 | iPad Pro |
| 1280×800 | Small laptop |
| 1920×1080 | Standard desktop |

If a screen doesn't work at 360px, it is not done.

### Reduced-motion
Respect `prefers-reduced-motion: reduce` — disable non-essential animations and transitions. Use Tailwind's `motion-safe:` / `motion-reduce:` variants.

---

## 8. Localisation (i18n) rules

**react-i18next** is wired from day one with UZ filled. RU and EN files exist but mostly empty — UZ fallback fires for missing keys.

### Setup
```
src/i18n/
  index.ts                       — i18next + react-i18next config
  locales/uz.json                — primary language, fully populated
  locales/ru.json                — empty objects, populated in v1.1
  locales/en.json                — empty objects, populated later
```

### Key naming convention

`<surface>.<screen>.<element>` with kebab-case segments inside.

```
common.actions.save                     "Saqlash"
common.actions.cancel                   "Bekor qilish"
common.actions.delete                   "O'chirish"
common.actions.confirm                  "Tasdiqlash"
common.errors.required                  "Bu maydon majburiy"
common.errors.invalid-pinfl             "JSHShIR noto'g'ri formatda"
common.status.active                    "Faol"
common.status.archived                  "Arxivlangan"

dashboard.sidebar.nav-home              "Bosh sahifa"
dashboard.sidebar.nav-units             "Tarkibiy tuzilma"
dashboard.sidebar.nav-employees         "Xodimlar"
dashboard.sidebar.nav-certificates      "Sertifikatlar"
dashboard.sidebar.nav-audit             "Audit jurnali"
dashboard.sidebar.nav-profile           "Mening profilim"

dashboard.login.title                   "Devon platformasiga kirish"
dashboard.login.email-label             "Korporativ pochta"
dashboard.login.password-label          "Parol"
dashboard.login.cta                     "Kirish"
dashboard.login.demo-hint               "Demo: admin@devon.uz / Demo2026!"

dashboard.employees.list.title          "Xodimlar"
dashboard.employees.list.cta-new        "+ Yangi xodim"
dashboard.employees.list.empty-title    "Hozircha xodimlar yo'q"
dashboard.employees.list.empty-body     "Yangi xodim qo'shish uchun yuqoridagi tugmani bosing."

dashboard.employees.wizard.step-1.title "Shaxsiy ma'lumotlar"
dashboard.employees.wizard.step-2.title "Aloqa ma'lumotlari"
dashboard.employees.wizard.step-3.title "Ish o'rni va lavozim"
dashboard.employees.wizard.step-4.title "Kirish ma'lumotlari"

... and so on for every other surface
```

### Rules
- **Never hardcode user-facing strings.** Every `<Text>`, button label, placeholder, toast message, error message, page title flows through `t('key')`.
- For numbers: `new Intl.NumberFormat('uz-UZ').format(n)` — space group separator, comma decimal
- For dates: `format(date, 'dd.MM.yyyy', { locale: uzLocale })` — `dd.MM.yyyy` for `uz`/`ru`
- For pluralisation: ICU MessageFormat via i18next plural rules — every count-bearing key tested
- Translation files are JSON, sorted by key, two-space indent

---

## 9. Mock backend rules

There is no real server. The "backend" is a thin async layer over `localStorage`.

### Layout
```
src/lib/mock-backend/
  index.ts          — public API surface
  storage.ts        — typed localStorage wrapper with namespacing + versioning
  seed.ts           — initial seed data (called on first app load)
  schemas.ts        — zod schemas mirroring the TZ data model
  delay.ts          — simulated network latency (200–600ms random)
  errors.ts         — MockNetworkError + 3% random failure simulation
```

### Behaviour
- All API functions return `Promise<T>`. Add `200–600ms` random delay to simulate network.
- On first app load, if `localStorage.getItem('devon.dashboard.seeded') !== '1'`, seed the database and set the flag.
- Mutations: read → mutate → write atomically. The whole "table" stays in one JSON value per resource (`devon.dashboard.employees`, `devon.dashboard.units`, etc.).
- **3% random failure simulation** on mutations so error states are exercised in the demo (toast: "Tarmoq xatosi, qayta urinib ko'ring").
- Add a "Reset demo data" action in the user menu — clears `devon.dashboard.*` keys and re-seeds.

### Storage key namespace
```
devon.dashboard.seeded             "1" once seed has run
devon.dashboard.session            JSON: { user, expiresAt }
devon.dashboard.units              JSON: Unit[]
devon.dashboard.employees          JSON: Employee[]
devon.dashboard.assignments        JSON: Assignment[]
devon.dashboard.certificates       JSON: Certificate[]
devon.dashboard.users              JSON: User[]
devon.dashboard.audit              JSON: AuditEntry[]
devon.dashboard.profile-requests   JSON: ProfileChangeRequest[]
```

### Seed scale (realistic, not toy)
- ~6 root departments, ~25 sub-units total spanning all 4 hierarchy levels
- ~30 employees with real-looking Uzbek FIO (e.g., "Pulatov Asilbek Karimovich"), plausible 14-digit PINFL, plausible Tashkent-area phone numbers
- ~25 certificates: 18 ACTIVE · 4 PENDING_APPROVAL · 2 EXPIRED · 1 REVOKED
- Audit log seeded with 60–80 entries covering CREATE, UPDATE, TRANSFER, ERI_UPLOAD events
- 1 demo HR_ADMIN user: `admin@devon.uz` / `Demo2026!`

---

## 10. Authentication model (demo)

- **Single demo user.** Credentials shown as a hint below the login form.
- Auth state lives in Zustand store `useAuthStore`, persisted to `localStorage` as `devon.dashboard.session`.
- Session shape:
  ```ts
  type Session = {
    user: { uuid: string; email: string; fullName: string; roles: Role[] };
    issuedAt: string;   // ISO
    expiresAt: string;  // ISO, +8h from issuedAt
  };
  ```
- Login: validate against the seeded HR_ADMIN user. On success, write session, redirect to `?from=` or `/`.
- Logout: clear session, redirect to `/login`.
- `<RequireAuth>` wrapper: if no session or session expired, redirect to `/login?from=<current-path>`.
- The single user has `roles: ['ROLE_HR_ADMIN']`. The sidebar shows everything HR_ADMIN can access.
- Code is structured so adding more roles later is a data change (extend the seeded users + the role-gating helper), not a refactor.

---

## 11. Routing (react-router-dom v6)

### Vite config
```ts
// vite.config.ts
export default defineConfig({
  base: '/Devon/dashboard/',   // adjust to actual repo path; will be set in step 14
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

### Router setup
```tsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
  <Routes>...</Routes>
</BrowserRouter>
```

### Route table

| Path | Component | Auth | Notes |
|---|---|---|---|
| `/login` | `LoginPage` | public | Mobile-first, full-viewport |
| `/` | `DashboardHome` | required | Stats + recent activity + quick actions |
| `/units` | `UnitsPage` | required | Tree (desktop) / Accordion (mobile) |
| `/employees` | `EmployeeListPage` | required | Table (desktop) / card list (mobile) |
| `/employees/new` | `EmployeeWizardPage` | required | **Full-screen route on mobile**; dialog/sheet on desktop |
| `/employees/:uuid` | `EmployeeProfilePage` | required | Tabs: Info · Bo'linmalar · ERI · Tarix |
| `/employees/:uuid/transfer` | `EmployeeTransferPage` | required | Mobile: full screen; desktop: sheet |
| `/certificates` | `CertificatesPage` | required | Kanban (desktop) / tabs (mobile) |
| `/certificates/upload` | `CertificateUploadPage` | required | PFX upload + fake metadata extract |
| `/profile` | `ProfilePage` | required | Self-service edit |
| `/audit` | `AuditLogPage` | required | Read-only |
| `*` | `NotFoundPage` | depends | "Sahifa topilmadi" |

### SPA fallback for GitHub Pages
`public/404.html` implements the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect trick so deep-linking and refresh both work.

---

## 12. File structure

```
dashboard/
  public/
    404.html                                    SPA fallback redirect
    favicon.svg                                 copied from landing/favicon.svg
  src/
    main.tsx                                    React entry
    App.tsx                                     <BrowserRouter><Router /></BrowserRouter>
    router.tsx                                  Route table
    index.css                                   Tailwind layers + Devon CSS vars
    vite-env.d.ts

    i18n/
      index.ts
      locales/uz.json
      locales/ru.json
      locales/en.json

    lib/
      mock-backend/
        index.ts                                public API
        storage.ts
        seed.ts
        schemas.ts
        delay.ts
        errors.ts
      utils.ts                                  cn(), formatters, pluralisers
      validators.ts                             reusable zod refinements (pinfl, phone, email)

    stores/
      useAuthStore.ts
      useUiStore.ts                             sidebar open state, theme, locale

    types/
      domain.ts                                 Unit, Employee, Assignment, Certificate, User, AuditEntry
      session.ts

    components/
      ui/                                       shadcn primitives (auto-generated, do not edit signatures)
      layout/
        AppShell.tsx                            outer layout with sidebar + topbar
        Sidebar.tsx                             desktop list / mobile sheet
        TopBar.tsx
        UserMenu.tsx
        MobileNavTrigger.tsx
      common/
        EmptyState.tsx
        ErrorState.tsx
        LoadingState.tsx
        StatusBadge.tsx                         color + icon + label per status
        StatCard.tsx
        PageHeader.tsx                          title + actions, responsive
        DataTableMobile.tsx                     generic table-to-card wrapper
        ResponsiveDialog.tsx                    Dialog on md+, Sheet on mobile
        Pagination.tsx
        SearchInput.tsx                         with 300ms debounce

    features/
      auth/
        LoginPage.tsx
        RequireAuth.tsx
      dashboard-home/
        DashboardHome.tsx
        StatsRow.tsx
        RecentActivityCard.tsx
        QuickActions.tsx
      units/
        UnitsPage.tsx
        UnitsTreeDesktop.tsx
        UnitsAccordionMobile.tsx
        UnitFormSheet.tsx                       create + edit (reusable)
        unit.schema.ts
      employees/
        list/
          EmployeeListPage.tsx
          EmployeeListTable.tsx
          EmployeeListMobile.tsx
          EmployeeFilters.tsx
        wizard/
          EmployeeWizardPage.tsx                full-screen on mobile
          WizardStepper.tsx
          Step1Personal.tsx
          Step2Contact.tsx
          Step3Work.tsx
          Step4Login.tsx
          ReviewScreen.tsx
          employee.schema.ts
          wizard-store.ts                       zustand for in-flight wizard state
        profile/
          EmployeeProfilePage.tsx
          ProfileInfoTab.tsx
          ProfileUnitsTab.tsx
          ProfileCertificatesTab.tsx
          ProfileHistoryTab.tsx
        assignments/
          EmployeeTransferPage.tsx
          TransferForm.tsx
          AssignmentTimeline.tsx
      certificates/
        CertificatesPage.tsx
        CertificatesKanban.tsx                  desktop columns
        CertificatesTabsMobile.tsx              mobile tabs per status
        CertificateCard.tsx
        CertificateUploadPage.tsx               PFX upload, fake parser
        FakePfxParser.ts                        returns plausible metadata after a delay
      profile/
        ProfilePage.tsx
      audit/
        AuditLogPage.tsx
      _shared/
        constants.ts                            unit types, employment types, role keys

  index.html
  package.json
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  components.json                               shadcn config
  .eslintrc.cjs
  .gitignore
```

---

## 13. Naming and code conventions

| Concern | Rule |
|---|---|
| Component files | `PascalCase.tsx`, one component per file unless tightly coupled |
| Hooks | `useFoo.ts` |
| Stores | `useFooStore.ts` |
| Schemas | `foo.schema.ts` (zod) |
| Types | `domain.ts` exports all domain types from a single file |
| Imports | Use `@/...` alias from `src/` |
| Ordering inside files | imports → types → component → sub-components → exports |
| Comments | Only when the WHY is non-obvious. No "what" comments. |
| Console logs | Strip before final QA pass |
| Magic numbers | Constants in `_shared/constants.ts` |

---

## 14. Quality bars — apply to every screen

Every screen, no exceptions, must satisfy:

- [ ] **6 states wired**: empty, loading, success, error, offline (best-effort), partial-data
- [ ] **Mobile**: works at 360×640, tap targets ≥ 44pt, sticky CTA where needed
- [ ] **Desktop**: works at 1280×800, no horizontal scroll
- [ ] **a11y**: keyboard navigable, visible focus rings, semantic HTML, ARIA where appropriate, contrast ≥ 4.5:1 body / ≥ 3:1 large text & icons
- [ ] **i18n**: zero hardcoded user-facing strings; everything via `t('key')`
- [ ] **Status visualisation**: never colour alone — always icon + label
- [ ] **Forms**: validation messages localised, inline + form-level, sticky action bar on mobile
- [ ] **Animations**: respect `prefers-reduced-motion`
- [ ] **Loading states**: skeleton or shimmer, not blank
- [ ] **Empty states**: helpful copy + a primary CTA where applicable

---

## 15. Data-model essentials (mirrors the TZ)

Domain types live in `src/types/domain.ts`. Mirror the TZ schemas; use `uuid` strings as primary identifiers in the client (server-side `id` ints are irrelevant for the demo).

```ts
export type UnitType =
  | 'DEPARTMENT'        // Departament
  | 'DIRECTORATE'       // Boshqarma
  | 'DIVISION'          // Bo'lim
  | 'DEPARTMENT_SUB'    // Sho'ba
  | 'SECTION'
  | 'OTHER';

export type UnitStatus = 'ACTIVE' | 'ARCHIVED';

export interface Unit {
  uuid: string;
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  code: string;                  // "DEP-IT-01"
  type: UnitType;
  parentUuid: string | null;     // null = root
  level: number;                 // 0 = root
  path: string;                  // "/root/dep-it/..."
  headEmployeeUuid?: string;
  deputyEmployeeUuid?: string;
  status: UnitStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'DRAFT' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type Gender = 'M' | 'F';

export interface Employee {
  uuid: string;
  userUuid: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  fullNameGenerated: string;
  gender: Gender;
  birthDate?: string;            // ISO date
  pinfl: string;                 // 14 digits
  passportSeries?: string;
  workPhone?: string;
  internalExtension?: string;
  mobilePhone: string;
  corporateEmail: string;
  personalEmail?: string;
  primaryUnitUuid: string;
  positionId: string;            // for simplicity use a string key into the positions seed
  employmentType: EmploymentType;
  hireDate: string;
  terminationDate?: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentType = 'PRIMARY' | 'COMBINATION' | 'ACTING' | 'TEMPORARY';

export interface Assignment {
  uuid: string;
  employeeUuid: string;
  unitUuid: string;
  positionId: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
  workloadPercent: number;       // 0–100
  type: AssignmentType;
  reason?: string;
  createdAt: string;
}

export type CertStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'REJECTED';
export type CertType = 'SIGNING' | 'ENCRYPTION' | 'BOTH';

export interface Certificate {
  uuid: string;
  employeeUuid: string;
  serialNumber: string;
  thumbprint: string;
  subjectPinfl: string;
  subjectCommonName: string;
  subjectOrganization?: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  keyUsage: string[];
  certificateType: CertType;
  status: CertStatus;
  rejectionReason?: string;
  uploadedByUuid: string;
  approvedByUuid?: string;
  approvedAt?: string;
  revokedAt?: string;
  revocationReason?: 'EXPIRED' | 'EMPLOYEE_TERMINATED' | 'COMPROMISED' | 'REPLACED' | 'MANUAL';
  createdAt: string;
}

export type Role =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_HR_ADMIN'
  | 'ROLE_HR_OPERATOR'
  | 'ROLE_UNIT_HEAD'
  | 'ROLE_EMPLOYEE'
  | 'ROLE_AUDITOR';

export interface User {
  uuid: string;
  employeeUuid?: string;
  email: string;
  passwordHash: string;          // demo: stored as plain SHA-256 hex of the literal password
  roles: Role[];
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  createdAt: string;
}

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE'
  | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGED'
  | 'UNIT_TRANSFER' | 'CERTIFICATE_UPLOADED' | 'CERTIFICATE_APPROVED'
  | 'CERTIFICATE_REVOKED' | 'PROFILE_CHANGE_REQUESTED' | 'PROFILE_CHANGE_APPROVED';

export interface AuditEntry {
  uuid: string;
  actorUuid: string;
  actorName: string;
  action: AuditAction;
  resourceType: 'unit' | 'employee' | 'assignment' | 'certificate' | 'user' | 'profile-request';
  resourceUuid: string;
  resourceLabel: string;         // human-readable
  changes?: Record<string, { from: unknown; to: unknown }>;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface ProfileChangeRequest {
  uuid: string;
  employeeUuid: string;
  fields: Record<string, { from: unknown; to: unknown }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedByUuid?: string;
}
```

---

## 16. Validators (zod refinements)

`src/lib/validators.ts` exports reusable refinements:

```ts
export const pinflRegex = /^[1-6]\d{13}$/;

export const pinflSchema = z.string()
  .length(14, { message: 'common.errors.invalid-pinfl' })
  .regex(pinflRegex, { message: 'common.errors.invalid-pinfl' });

export const uzPhoneSchema = z.string().regex(
  /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/,
  { message: 'common.errors.invalid-phone' }
);

export const corporateEmailSchema = z.string().email().regex(
  /@devon\.uz$/i, { message: 'common.errors.email-must-be-corporate' }
);

// uniqueness checks (async, hit mock backend)
export async function ensurePinflUnique(value: string, exceptUuid?: string) {
  const { listEmployees } = await import('@/lib/mock-backend');
  const all = await listEmployees();
  return !all.some(e => e.pinfl === value && e.uuid !== exceptUuid);
}
```

PINFL real-time dedup check in the wizard fires `ensurePinflUnique` with a 400ms debounce.

---

## 17. Out of scope (do NOT attempt)

- Real backend / Laravel / PostgreSQL — everything is mocked
- Real PFX parsing or PKI cryptography — fake the metadata extraction
- Real E-IMZO plugin WebSocket — mock the handshake with a delay
- Real SMS / email OTP — the wizard's "send credentials" step is a visual stub
- Unit / integration / E2E tests — skipped for the demo
- Dark mode — single light theme only
- Server-side i18n routing — react-i18next handles everything client-side
- Real RBAC enforcement — single HR_ADMIN user; navigation matches their permissions
- Real Drag-and-drop tree reordering — propose it visually with up/down buttons or a "Move to..." modal; full DnD is a stretch goal

---

## 18. How to use this prompt set

1. **Open a fresh AI session.**
2. **Paste this master prompt** as the system / first message.
3. **Paste the step prompt** for the current task (`01-scaffold.md`, then `02-...`, etc.). One step per session is ideal — keeps context focused.
4. **Execute** the step; review the output; commit; move on.
5. The steps are **strictly sequential**. Step N assumes Steps 1..(N-1) are complete. Do not skip ahead.
6. At the end of each step, the AI must:
   - List the files created/modified
   - Run through the step's Acceptance checks and mark them off
   - Note any deviations from the prompt with reasoning
7. If a step prompt feels too large for a single session, decompose it locally — but do not invent new steps without updating this master.

---

## 19. References

- **TZ** (canonical functional spec): `docs/Plyma TZ xodim kiritish.docx`
- **Workflow rules**: `CLAUDE.md`
- **Project state**: `ai_context/AI_CONTEXT.md`
- **Session log**: `ai_context/HISTORY.md`
- **Brand tokens source**: `landing/index.html` (`:root` block)
- **shadcn/ui docs**: https://ui.shadcn.com/
- **spa-github-pages trick**: https://github.com/rafgraph/spa-github-pages
- **react-i18next docs**: https://react.i18next.com/

---

*Devon — Rivolanish intizom bilan!*
