# Devon — Project State Snapshot

> **What this file is.** A single-page current-state snapshot of Devon: what it is, what's done, what's in flight, where the canonical docs live, and the cultural/language defaults future sessions should respect. Updated on every `/doc_sync`. Pair with [`HISTORY.md`](./HISTORY.md), which is the chronological log of how we got here.

---

## What Devon is

**Devon** — on-premise corporate platform for digitizing internal document workflows in Uzbek organizations. Replaces paper-based "soglasovaniya" (collaborative approval) with a fully digital, auditable system. Codename **PLYMA** in earlier specs; **PLYMO** before that. The product is the same; the name evolved.

- **Audience:** Government bodies, state-owned enterprises, banks, holding companies, ministries — 50+ employees, hierarchical structure, existing paper workflow.
- **Deployment:** Fully on-premise (data sovereignty is a hard constraint).
- **Languages:** Uzbek-first. Russian and English are secondary / planned.
- **Roles:** Super Admin · Department Head · Employee.
- **Org hierarchy (canonical, 4 levels):** Departament → Boshqarma → Bo'lim → Sho'ba.

---

## Module status (v1.0 — ships with 8 modules)

| # | Module | Status |
|---|---|:---:|
| 1 | User & Authentication | ✅ in v1.0 spec |
| 2 | Document Management | ✅ in v1.0 spec |
| 3 | Electronic Digital Signature (ERI) | ✅ in v1.0 spec |
| 4 | Approval Workflow ("List soglasovaniya") | ✅ in v1.0 spec |
| 5 | Task Delegation (Kanban) | ✅ in v1.0 spec |
| 6 | Organizational Structure | ✅ in v1.0 spec |
| 7 | Integration & Export | ✅ in v1.0 spec |
| 8 | Incoming/Outgoing Letters | ✅ in v1.0 spec |

All eight are specified in [`docs/product-specification.md`](../docs/product-specification.md). "Spec'd" ≠ "shipped" — engineering implementation is separate from this doc set.

### Roadmap

| Release | Scope |
|---|---|
| **v1.0 (current spec)** | All 8 modules above, Uzbek UI only |
| **v1.1 (planned)** | Russian-language UI, mobile-responsive refinement, throttling/rate limiting |
| **v1.2 (planned)** | 2FA, advanced reporting dashboard, SSO (enterprise) |
| **Post-v1.2** | Native mobile apps, AI-assisted document classification, e-gov integrations |

---

## Canonical documents — where each truth lives

| Topic | File | Audience |
|---|---|---|
| Product overview, modules, roles, roadmap | [`README.md`](../README.md) | All stakeholders |
| **Product specification (canonical)** | [`docs/product-specification.md`](../docs/product-specification.md) | Product, BA, Eng, QA, Sales |
| Business processes (swim-lane flows) | [`docs/business-processes.md`](../docs/business-processes.md) | BA, QA, customer implementation |
| Functional use cases (UC-01 … UC-20) | [`docs/use-cases.md`](../docs/use-cases.md) | QA, BA, Product |
| Glossary (Uzbek/Russian terms, pronunciation, naming history) | [`docs/glossary.md`](../docs/glossary.md) | Non-Uzbek-speaking team members |
| Competitive analysis & positioning | [`docs/competitive-analysis.md`](../docs/competitive-analysis.md) | Sales, Product, BA |
| Marketing landing page (Uzbek) | [`landing/index.html`](../landing/index.html) | Marketing, Sales, Web |
| Workflow orchestration (how to work on Devon) | [`CLAUDE.md`](../CLAUDE.md) | AI assistants, contributors |
| Legacy technical spec (reference only) | `docs/Plyma_Technical_Spec_v1.0.docx` | Historical reference |
| Session work log | [`ai_context/HISTORY.md`](./HISTORY.md) | Internal, contributors |

**Source-of-truth rule:** if a `docs/` file conflicts with anything else (this file included), the doc wins — fix the doc first, then update derivative artifacts.

---

## Competitive landscape (snapshot)

Closest direct competitor: **EDoc** (`edoc.uz`) — same market, same e-imzo (ERI) requirement. Devon's differentiation against them: integrated experience (documents + signatures + approvals + tasks in one product), modern UI, audit completeness.

Broader alternative: **Bitrix24** — but only when the buyer's primary need is sales-team management with documents as a side feature. Devon is the opposite: documents-and-approval as the primary, with tasks adjacent.

International tier (M-Files, DocuWare): great products, no Uzbek presence, no e-imzo. Devon wins on local fit.

Full breakdown in [`docs/competitive-analysis.md`](../docs/competitive-analysis.md).

---

## Brand voice & language defaults

- **Uzbek-first in all customer-facing copy.** Don't ship `[NEEDS_TRANSLATION]` placeholders in Uzbek. Russian and English follow as translation passes.
- **The slogan** — *Rivolanish intizom bilan!* ("Development through discipline") — appears in the footer in italic accent colour.
- **No tech-stack mentions on the landing page or product docs.** No Laravel, Livewire, PostgreSQL, etc. The audience is decision-makers, not developers. Engineering details live in code and ADRs, not in README/landing/product-spec.
- **Use the project glossary** ([`docs/glossary.md`](../docs/glossary.md)) for terminology. Prefer `Ichki server` or `Mahalliy yechim` over `On-premise` in Uzbek copy. Prefer `Hujjat aylanmasi` over `Document flow`. Etc.

---

## Landing page — current state

`landing/index.html` is a single self-contained HTML file deployed via GitHub Pages (`.github/workflows/deploy.yml` and `static.yml`). Current state:

- **Visual style** — wio.io-inspired with warm pastel section rotation (cream → white → peach → mint → navy → cream → lavender). Inter + Fraunces from Google Fonts. No external JS libraries.
- **Device mockups** — silver MacBook Pro frames (matching the user's reference photo) used across hero, document list, and Kanban sections. Realistic iPhone 15 Pro frame for the ERI signing flow. All animations smoothly looped with `calcMode="spline"` + eased `keySplines`.
- **Imkoniyatlar (Features) bento section** — 6 bento cards. Two charts are richly animated:
  - **Tashkiliy tuzilma** — 4-level org tree (Departament → Boshqarma → Bo'lim → Sho'ba) with a walking active path that highlights each node in sequence, ending in an amber pulse-ring on the destination Sho'ba.
  - **Vazifa doskasi (Kanban)** — 4 columns, cards with priority chips/due dates/avatars, a card travels Col 1 → 4 with column-arrival flashes, dashed drop-slot, and a cursor following the path.
- **Mobile responsive** — hamburger menu below 820px (full-screen overlay outside `<header>` to avoid `backdrop-filter` stacking trap). Breakpoints at 1100/820/768/480.
- **Hero chips** — floating decorative cards anchored with `calc(50% ± 510px)` so they never overlap the centered headline; hidden below 1400px.
- **Hero copy** — eyebrow reads "Mahalliy yechim · O'zbekiston uchun yaratilgan" (was "On-premise · ..." until corrected for Uzbek-first feel).

---

## Open questions / known gaps

- **User manual (Uzbek)** — `docs/user-manual-uz.md` is referenced in the README but doesn't exist yet. Needs writing for end-user onboarding.
- **Operations runbook** — `docs/operations/` is referenced but the folder is empty. Needs `deployment.md`, `backup.md`, `recovery.md`, `oncall.md` populated for sysadmins.
- **BPMN diagrams** — `docs/bpmn/` is referenced but the visual diagrams from the legacy PLYMA spec haven't been migrated. `docs/business-processes.md` covers the same flows in text form; the visual diagrams are a "nice to have."
- **ADRs** — `docs/adr/` is empty. The first ADRs should retroactively capture: choice of 4-level org hierarchy as a first-class model, signed-document immutability triple-layer enforcement, on-premise deployment as a hard constraint.
- **Real client logos** — the landing page's trust band has gray placeholders + a `<!-- TODO: Replace with real client logos -->` comment.

---

## Naming history

| Name | Era | Status |
|---|---|---|
| **PLYMO** | Early concept, pre-2025 | Legacy. Appears in the earliest spec. |
| **PLYMA** | 2025 spec phase | Legacy. Appears in `docs/Plyma_Technical_Spec_v1.0.docx`, early landing-page drafts. From Greek *plimo* — "flow." |
| **Devon** | 2026+ (current) | Shipping name. All new artifacts use Devon. |

When you encounter PLYMO or PLYMA in legacy material, mentally substitute Devon. Same product.

---

## How to think about this file

Update this snapshot when any of the following change:

- Module status flips (a module moves from "in spec" to "in production" or gets de-scoped)
- Roadmap reshuffles
- A canonical doc is added or removed
- The competitive picture shifts (new competitor, EDoc ships something significant)
- Brand voice or language defaults change
- The landing page's overall structure changes (not every visual tweak — those go in `HISTORY.md`)
- A new "open question" emerges or an existing one gets resolved

If a change is too granular for this file, it belongs in `HISTORY.md`. If it's structural, both files get updated.
