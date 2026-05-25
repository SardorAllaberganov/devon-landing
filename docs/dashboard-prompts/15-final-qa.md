# STEP 15 — Final QA pass (mobile, a11y, all 6 states, copy review)

## Prerequisite
Master prompt loaded. Steps 01–14 complete. Production deploy is live.

## Goal
Sweep every screen against the quality bar in master §14. Catch the small things that always slip during incremental builds: focus rings, contrast, sticky-CTA misses on mobile, console warnings, missing translation keys, empty/loading/error states that were stubbed and never wired.

Treat this as a *checklist run*, not a coding step. Most outcomes are tweaks to existing files — not new files.

## Deliverables
- A pass through every screen at the six target viewports (360 / 390 / 768 / 1024 / 1280 / 1920)
- Fixes for anything below the quality bar
- A short `QA_NOTES.md` in the dashboard root documenting any known limitations (out-of-scope items already noted in master §17 don't count; new issues found during QA do)
- Zero console errors / warnings in production
- Updated `ai_context/HISTORY.md` entry for the dashboard launch

## Sweep checklist

Run this list for **every screen** unless noted otherwise.

### Per-screen quality bar

| Check | What to do |
|---|---|
| **Empty state** | Trigger an empty list (filter to none / clear seed data). Confirm a real empty state renders with icon + title + body + (optional) CTA. |
| **Loading state** | Throttle network in DevTools (Slow 3G). Confirm skeleton/shimmer shows, not blank. |
| **Error state** | Force a failure (`localStorage` to invalid JSON, or temporarily raise `maybeFail()` probability to 1). Confirm error UI renders with a Retry where applicable. |
| **Success state** | Standard happy path renders. |
| **Offline** | DevTools → Network → Offline. App should not crash; UI should still render last-loaded data (we already have it in localStorage). |
| **Partial data** | Force one of the lists to be partially populated (e.g., 0 certs but 30 employees) — counts and links must remain coherent. |

### Per-viewport check

| Width | What to verify |
|---|---|
| **360 × 640** | All tap targets ≥ 44pt. Sidebar drawer slides full-screen. No horizontal scroll. Sticky CTAs visible above keyboard. Text doesn't truncate critical info. |
| **390 × 844** | iPhone-realistic layout. Safe-area bottom respected on wizard/transfer. |
| **768 × 1024** | iPad portrait. Sidebar still drawer (per breakpoints), search visible. |
| **1024 × 1366** | iPad Pro. Sidebar inline. Tables show all columns. |
| **1280 × 800** | Standard laptop. Max-width centred. Page footers don't float oddly. |
| **1920 × 1080** | Desktop. Content centred, gutters consistent. No stretched single-column lists in the middle. |

### a11y sweep

- [ ] Every interactive element has a visible focus ring (emerald)
- [ ] Tab order is logical on each page (`Tab` cycles top-to-bottom, left-to-right)
- [ ] Modals trap focus; `Esc` dismisses
- [ ] All icons have `aria-hidden` or accessible labels
- [ ] All form fields have `<Label htmlFor>` bound
- [ ] All buttons have a visible text label or `aria-label`
- [ ] Status badges combine icon + text (not colour alone)
- [ ] Body text contrast ≥ 4.5:1 (check with DevTools' contrast checker on ink-on-cream and ink-on-emerald)
- [ ] No animations exceed 3 Hz flashing
- [ ] `prefers-reduced-motion: reduce` disables non-essential transitions — toggle it in DevTools' rendering panel and verify
- [ ] Keyboard-only navigation can complete the wizard end-to-end without a mouse

### i18n sweep

- [ ] Open every screen with the language detector pointed to `ru` (set `localStorage.devon.dashboard.lang = 'ru'` and reload) — every visible string falls back to UZ (because `ru.json` is empty). No raw key strings (`dashboard.foo.bar`) leak into the UI.
- [ ] `grep -RIn '"[А-Яа-я]"' dashboard/src` — should find nothing. Any Russian literal in JSX is a bug.
- [ ] `grep -RIn '<[A-Z][a-z]\+>[^<{]*</[A-Z]' dashboard/src` — heuristic scan for hardcoded JSX text. Tighten in the editor.
- [ ] All toast strings come from `t()`. No `toast.success("...")` literals.
- [ ] Numbers render via `formatNumber()` — no raw `5000000` in tables
- [ ] Dates render via `formatDate()`/`formatDateTime()`/`formatRelative()` — never the default `Date.toString()`

### Performance sweep

- [ ] Lighthouse (mobile + desktop) — aim:
  - Performance ≥ 85
  - Accessibility ≥ 95
  - Best Practices ≥ 95
  - SEO N/A (auth-gated)
- [ ] Bundle size: `dashboard/dist/assets/*.js` should be < 500KB gzipped for the main chunk. If larger, check for unused shadcn primitives and remove them.
- [ ] No console errors. No 404 asset requests. No React strict-mode duplicate-warning leakages.

### Mock-backend sanity

- [ ] `Reset demo` from user menu re-seeds cleanly
- [ ] 3% failure rate visible across an hour of use (you'll see a couple of toast errors)
- [ ] After resetting, recently-created entities (employees, units, certs) reappear from the seed

### Copy / brand sweep

- [ ] Slogan "Rivolanish intizom bilan!" appears at the sidebar footer
- [ ] Eyebrow text uses cinnamon (not ink) on cream sections
- [ ] Fraunces italic used only on accent words (e.g., "intizomli") — never paragraphs
- [ ] No occurrences of "PLYMA" / "PLYMO" in user-facing copy
- [ ] No occurrences of tech stack names (Laravel, PostgreSQL, Vite, React) — these are internal, not customer-facing
- [ ] Page titles match the page (`Devon — Boshqaruv paneli` is fine globally; `document.title` updates can be added later)

## Things to fix as you find them

Most QA findings will be in three categories:

1. **Forgotten empty/loading/error states** — wire them by reusing `EmptyState`, `LoadingState`, `ErrorState`.
2. **Tap target too small** — bump button padding / icon button to `size="icon"` with explicit `h-11 w-11` if needed.
3. **Hardcoded strings** — move them to `uz.json` and replace with `t('key')`. Add stub keys to `ru.json`/`en.json` (empty values).

If you find an architectural issue (e.g., the auth store doesn't refresh after password change), open an issue/comment in `QA_NOTES.md` rather than fixing it inline — escalate to the user for prioritisation.

## QA_NOTES.md template

Create `dashboard/QA_NOTES.md`:

```markdown
# Devon Dashboard — QA Notes

Last full QA: <YYYY-MM-DD>

## Known limitations (demo-acceptable)

- Mock backend simulates 3% network failure; UI exercises error paths but no real recovery is possible
- Real PFX parsing not implemented — uploads use a fake metadata extractor (see master §17)
- Real E-IMZO plugin handshake not implemented — replaced with a 1.5s mocked challenge-response
- Single user role demoed (HR_ADMIN); other roles' surfaces exist in the data model but not in the demo UI
- Hardcoded credentials shown on the login screen — intentional for demo discoverability

## Outstanding issues

(Issues found during QA that need follow-up. Empty if everything is clean.)

- [ ] ...

## Lighthouse scores (mobile)

- Performance: <n>
- Accessibility: <n>
- Best Practices: <n>

## Lighthouse scores (desktop)

- Performance: <n>
- Accessibility: <n>
- Best Practices: <n>
```

## Update `ai_context/HISTORY.md`

Add an entry at the top:

```markdown
## <YYYY-MM-DD> — Dashboard MVP launched on GitHub Pages

Built the Devon Dashboard as a Vite + React + TypeScript + shadcn/ui SPA covering all four flows from `docs/Plyma TZ xodim kiritish.docx`: structural-unit tree CRUD, employee-creation wizard, assignment transfers + timeline, ERI certificate management with Kanban + PFX upload (mocked). Mobile-first throughout — sidebar drawer, tables-to-cards, full-screen wizard on mobile. i18n scaffolded via react-i18next with UZ filled, RU/EN files stubbed. Mock backend in localStorage with realistic seed data (~30 employees, 25 units, 25 certificates, 60+ audit entries). Single HR_ADMIN demo user (`admin@devon.uz` / `Demo2026!`). Deployed alongside the existing landing page via an extended `.github/workflows/deploy.yml`; landing CTA now routes to the live dashboard.

**Files touched:** `dashboard/` (created), `.github/workflows/deploy.yml`, `landing/index.html`, `.gitignore`, `ai_context/HISTORY.md`, `ai_context/AI_CONTEXT.md`

```

## Update `ai_context/AI_CONTEXT.md`

Open `ai_context/AI_CONTEXT.md` and:
1. Add a new section "Dashboard — current state" summarising the SPA: stack, scope (4 flows), deploy URL, demo credentials
2. Update the canonical-documents table with a row for the dashboard
3. If applicable, move "User manual (Uzbek)" up the priority list — the dashboard now needs a customer-facing how-to-use document

## Acceptance checks

- [ ] Every screen passes its quality bar at every target viewport
- [ ] Zero console errors / warnings in production
- [ ] Lighthouse mobile + desktop scores recorded in `QA_NOTES.md`
- [ ] `QA_NOTES.md` exists and is current
- [ ] `ai_context/HISTORY.md` has a new entry
- [ ] `ai_context/AI_CONTEXT.md` mentions the dashboard
- [ ] Production deploy still works after any QA fixes

## Notes

- Resist the temptation to refactor during QA. Note architectural issues in `QA_NOTES.md`; address them in a follow-up sprint, not this pass.
- "Done" here means "polished for demo." The product still has obvious gaps relative to production (real backend, real PKI, real RBAC, more roles in the UI). Those are roadmap, not QA bugs.

## What "done" looks like

A live, polished demo. Customer can click the landing CTA on a phone, land on the login screen, tap through 4 flows, and walk away convinced this is a real product. Every breakpoint feels considered. Every empty state has a thought behind it. The team has a written list of known limitations they can articulate confidently.
