# Devon — Session History

Reverse-chronological checkpoint log of significant work done with AI assistance. Each entry: date, one-line summary, files touched.

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
