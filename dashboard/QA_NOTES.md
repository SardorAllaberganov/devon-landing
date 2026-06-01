# Devon Dashboard — QA Notes

Last full QA: **2026-06-01** (automated pass; observational sweep TBD by human operator)

Live: <https://sardorallaberganov.github.io/devon-landing/dashboard/>
Demo credentials: `admin@devon.uz` / `Demo2026!`

---

## Known limitations (demo-acceptable per master §17)

These are intentional simplifications for the demo build, not bugs.

- **Mock backend** — there is no real server. All "API" calls hit a typed wrapper over `localStorage` with simulated 200–600 ms latency and a 3 % random failure rate. UI exercises error paths via the simulated failures but no real recovery is possible (no retry queues, no offline reconciliation).
- **Real PFX parsing not implemented** — certificate uploads route through a fake metadata extractor (`features/certificates/FakePfxParser.ts`) that returns plausible X.509 data with the employee's PINFL/FIO mirrored so the round-trip passes the backend's `pinfl-mismatch` guard. Wrong passwords are NOT actually verified — any password is accepted and metadata is generated regardless.
- **Real E-IMZO plugin handshake not implemented** — replaced with a 1.5 s mocked challenge-response (`ShieldCheck` pulse) per master §17 ("fake the WebSocket with a delay").
- **Single user role demoed (HR_ADMIN)** — other roles (`ROLE_SUPER_ADMIN`, `ROLE_HR_OPERATOR`, `ROLE_UNIT_HEAD`, `ROLE_EMPLOYEE`, `ROLE_AUDITOR`) exist in the data model and seed data but aren't accessible via login in the demo. No "Switch to employee POV" toggle ships in v1.
- **Hardcoded credentials shown on the login screen** — intentional for demo discoverability. A real deploy would remove the `demo-hint` block from `LoginPage`.
- **Profile-change request approval path is unreachable in the demo** — `submitProfileChangeRequest` + `approveProfileRequest` are wired and audit-logged, but HR_ADMIN edits apply directly via `updateEmployee` (skipping the request flow), so no PENDING requests ever accumulate for the demo user to approve. The empty-state copy on the "Tahrirlash so'rovlari" tab explains the workflow exists for `ROLE_EMPLOYEE`.
- **Real SMS / email OTP / notification delivery** — not implemented. The wizard's "notify-SMS" / "notify-email" checkboxes are persisted to the new-employee record but no message is sent.
- **No automated tests** — Vitest / Playwright deliberately deferred per master §17. Verification is manual via the dev server + production smoke.
- **Russian and English locale files are empty** — `ru.json` / `en.json` are `{ "common": {}, "dashboard": {} }`. All strings fall back to UZ via `fallbackLng: 'uz'`. Filling these is part of the v1.1 roadmap.
- **Documents are not real PDFs** — there's no file upload / preview pipeline for actual document attachments. The TZ flows around document approval are out of scope for this demo (planned for a later milestone covering modules 2 + 4 + 8).

---

## Outstanding issues

QA findings that need follow-up. Listed in priority order (high → low).

### Architectural / requires user prioritisation

- [ ] **Production bundle is a single ~922 KB / 266 KB-gzipped chunk.** Comfortably inside the prompt's `<500 KB gzipped` target, but a single chunk means every route loads the full app on first visit. Code-splitting by route (lazy `React.lazy()` per `features/*/Page.tsx`) would cut TTI on the dashboard home substantially. Out of scope for QA per the prompt's "resist the temptation to refactor" rule; logged as a v1.1 performance follow-up.
- [ ] **Eight unused shadcn primitives** sit in `dashboard/src/components/ui/`: `breadcrumb`, `drawer`, `form`, `input-group`, `pagination`, `scroll-area`, `switch`, `tooltip`. Combined ~24 KB raw source; tree-shaking already excludes them from the bundle, so this is cosmetic dead code. Removing `drawer.tsx` would also let `vaul` come out of `package.json`. Backlog item — no bundle-size urgency.
- [ ] **`LoginPage` carries no already-authenticated guard.** A user with an active session who navigates to `/login` directly sees the login screen instead of being redirected home. Cosmetic on the canonical entry path (the landing CTAs all hit `dashboard/`, and `RequireAuth` handles the unauthenticated bounce) but worth adding a 1-line redirect for direct-paste resilience.
- [ ] **Lint surfaces `setState-in-effect` warnings** from the React Compiler rules in `AuditLogPage.tsx`, `ProfilePage.tsx`, and `UnitsPage.tsx` (the last predates step 13). All three follow the same pattern: `useEffect(() => { setLoading(true); fetch(...).then(setData) })`. The pattern is correct for the current architecture but the new lint rule flags it. Either move fetches into a React Query / SWR layer (large refactor) or pragma-disable per-line. Not blocking the build.

### Fixed during this QA pass

- [x] **React Router v7 future-flag warnings on every boot** — opted into `v7_startTransition` + `v7_relativeSplatPath` via `<BrowserRouter future={...}>` in [`App.tsx`](src/App.tsx). Zero console warnings on a fresh dev-server boot now.
- [x] **English `Close` sr-only labels on Sheet + Dialog corner-X buttons** — every modal / drawer / detail sheet inherited an English `Close` announcement on a Uzbek-first UI. Replaced with `Yopish` directly in [`sheet.tsx`](src/components/ui/sheet.tsx) and [`dialog.tsx`](src/components/ui/dialog.tsx) per the LESSONS.md "edit shadcn primitives only when the default is wrong for every call site" rule — this affected every Sheet and every Dialog.

### Pending observational sweep (human operator)

These need DevTools / a real browser / a phone. I cannot drive them from an agentic session.

- [ ] **Six-viewport sweep** at 360 × 640 / 390 × 844 / 768 × 1024 / 1024 × 1366 / 1280 × 800 / 1920 × 1080. Walk every route. Look for: horizontal scroll, clipped text, tap targets below 44 pt on mobile, sticky CTAs covered by keyboard, sidebar drawer not full-screen below `lg`, tables not collapsing to cards below `md`.
- [ ] **Lighthouse runs** — mobile + desktop on the live deploy:
  - `/` (dashboard home)
  - `/employees`
  - `/employees/new` (wizard, full-screen route)
  - `/employees/:uuid` (profile)
  - `/certificates` (Kanban)
  - `/audit`
  - `/profile`
  Target: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95. Scores drop into the table below.
- [ ] **Throttled-network skeleton check** — DevTools → Slow 3G → confirm `LoadingState` skeletons render on first paint of `/units`, `/employees`, `/certificates`, `/audit`, `/profile`. No blank screens.
- [ ] **Forced-failure sweep** — temporarily raise `maybeFail(probability = 0.5)` in `lib/mock-backend/errors.ts` or set an invalid JSON on one of the `devon.dashboard.*` localStorage tables, walk every route, confirm `ErrorState` renders with a Retry where applicable.
- [ ] **Offline check** — DevTools → Network → Offline. Existing pages render from cached localStorage data; new mutations should toast a network error, not crash.
- [ ] **Empty-state check** — filter every list to zero results (e.g. `/employees?search=zzzz`, archive every unit) and confirm `EmptyState` renders with a real icon + title + body.
- [ ] **Keyboard-only navigation** — complete the employee wizard end-to-end using `Tab` / `Shift+Tab` / `Enter` only, no mouse. Every step's "Keyingisi" button must be reachable and the wizard must save successfully.
- [ ] **`prefers-reduced-motion`** — toggle in DevTools Rendering panel, reload the certificates Kanban + the employee wizard transitions + the sidebar drawer slide. Animations should either skip or use instant transitions; no jarring snaps.
- [ ] **Focus ring visibility** — Tab through every screen and confirm the emerald focus ring is visible on every interactive element. Particularly check: shadcn `Select` triggers, `Combobox` triggers, Kanban cards (drag-handle), table rows (clickable), card grids.
- [ ] **Status-badge colour-only check** — confirm every `StatusBadge` carries both icon + text, never colour alone.
- [ ] **Contrast spot-checks** — DevTools' contrast checker on ink-on-cream and ink-on-emerald combinations. Should be ≥ 4.5:1 for body, ≥ 3:1 for large text.
- [ ] **Mobile real-device check** — iPhone safe-area on `/employees/new` wizard footer + `/employees/:uuid/transfer` footer (`pb-safe`). Hamburger menu opens full-screen. Hardware back button doesn't escape the SPA mid-wizard.
- [ ] **Hard-refresh on deep routes** on the live deploy — paste `/devon-landing/dashboard/employees/<uuid>` in a fresh tab. The SPA 404 fallback should hand off via `?/employees/<uuid>` and the right profile should load.
- [ ] **"Reset demo" against the published bundle** — click in the user menu, confirm the localStorage tables clear + reseed, the page reloads, and the HR_ADMIN is back to `admin@devon.uz` with their original FIO and `mustChangePassword = true`.

---

## Lighthouse scores

Run on the production deploy after a hard-refresh.

### Mobile (DevTools → Lighthouse → Mobile)

- Performance: `<TBD>`
- Accessibility: `<TBD>`
- Best Practices: `<TBD>`

### Desktop (DevTools → Lighthouse → Desktop)

- Performance: `<TBD>`
- Accessibility: `<TBD>`
- Best Practices: `<TBD>`

---

## Automated checks run on 2026-06-01

These are the checks that landed during the agentic QA pass — they don't replace the observational sweep above but cover the parts that scripts can verify.

| Check | Result |
|---|---|
| Cyrillic-literal grep in `dashboard/src` (excl. locale files) | Clean |
| Hardcoded JSX text heuristic | Clean (only intentional `DEVON` brand wordmarks + `sr-only` accessibility labels) |
| `toast.<level>("literal")` non-`t()` calls | Clean |
| `PLYMA` / `PLYMO` in user-facing strings | Clean |
| Tech-stack name leak (`Laravel` / `PostgreSQL` / `React` / `Vite` etc.) in i18n + landing | Clean |
| `Date.toString()` / `toLocaleDateString` without `formatDate*` | Clean |
| Raw `≥4-digit` numeric literals in JSX | Clean |
| Production build (`npm run build`) | 2902 modules · 116.22 KB CSS · 922.46 KB JS / **266.28 KB gzip** |
| Bundle size vs. < 500 KB gzipped target | **PASS** (266 KB ≪ 500 KB) |
| Dev-server warnings on cold boot | **0** (was 2 RR future-flag warnings before fix) |
| Route reachability (9 routes via `curl`) | All 200 |

---

## Cross-references

- Build prompt: [`docs/dashboard-prompts/15-final-qa.md`](../docs/dashboard-prompts/15-final-qa.md)
- Master prompt §17 (out-of-scope): [`docs/dashboard-prompts/00-master.md`](../docs/dashboard-prompts/00-master.md)
- Build lessons (cross-step decisions): [`ai_context/LESSONS.md`](../ai_context/LESSONS.md)
- Project snapshot: [`ai_context/AI_CONTEXT.md`](../ai_context/AI_CONTEXT.md)
