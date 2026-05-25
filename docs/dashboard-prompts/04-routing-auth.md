# STEP 04 — Routing & Auth shell (mobile-first login)

## Prerequisite
Master prompt loaded. Steps 01–03 complete.

## Goal
Set up react-router-dom v6 with the sub-path `basename`. Create the Zustand-based mock auth store. Build a fully mobile-first login page. Wire a `<RequireAuth>` wrapper that redirects unauthenticated users to `/login?from=<path>` and back upon success.

## Deliverables
- `dashboard/src/router.tsx` — route table
- `dashboard/src/App.tsx` — wraps router in `<BrowserRouter>`
- `dashboard/src/stores/useAuthStore.ts` — Zustand store with `login`, `logout`, `restoreSession`
- `dashboard/src/features/auth/LoginPage.tsx` — mobile-first login
- `dashboard/src/features/auth/RequireAuth.tsx` — route guard
- `dashboard/src/lib/hash.ts` — tiny SHA-256 helper for "password hashing" in the demo (not real security)
- Add `dashboard.login.*` keys to `uz.json`
- Placeholder pages for each protected route so navigation works (these get filled in later steps)

## Tasks

### 1. Install dependencies

```bash
npm install react-router-dom zustand
```

### 2. Create the auth store — `src/stores/useAuthStore.ts`

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/types/domain';

export interface SessionUser {
  uuid: string;
  email: string;
  fullName: string;
  roles: Role[];
}

interface AuthState {
  user: SessionUser | null;
  issuedAt: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; reason: 'invalid-credentials' | 'network' }>;
  logout: () => void;
  isExpired: () => boolean;
}

const STORAGE_KEY = 'devon.dashboard.session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      issuedAt: null,
      expiresAt: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // 3% chance of simulated network failure (matches mock-backend rules)
        if (Math.random() < 0.03) return { ok: false, reason: 'network' };
        await new Promise(r => setTimeout(r, 300 + Math.random() * 300));

        // Step 07 introduces the proper mock-backend.users seed. Until then, hardcode here.
        const expectedEmail = 'admin@devon.uz';
        const expectedPassword = 'Demo2026!';

        if (email.trim().toLowerCase() !== expectedEmail || password !== expectedPassword) {
          return { ok: false, reason: 'invalid-credentials' };
        }

        const now = new Date();
        const issuedAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

        set({
          user: {
            uuid: 'demo-hr-admin-uuid',
            email: expectedEmail,
            fullName: 'Sardor Allaberganov',
            roles: ['ROLE_HR_ADMIN'],
          },
          issuedAt,
          expiresAt,
          isAuthenticated: true,
        });
        return { ok: true };
      },
      logout: () => set({ user: null, issuedAt: null, expiresAt: null, isAuthenticated: false }),
      isExpired: () => {
        const exp = get().expiresAt;
        if (!exp) return true;
        return new Date(exp).getTime() < Date.now();
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

> When Step 07 lands, refactor `login()` to read from `mock-backend.users` and compare hashed passwords. For now the literal credentials live here so the login flow is exercisable end-to-end before the mock backend exists.

### 3. Add domain types — `src/types/domain.ts`

For now, only what the auth store needs. Full types arrive in Step 07; create the file with just `Role`:

```ts
export type Role =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_HR_ADMIN'
  | 'ROLE_HR_OPERATOR'
  | 'ROLE_UNIT_HEAD'
  | 'ROLE_EMPLOYEE'
  | 'ROLE_AUDITOR';
```

### 4. Add login translation keys to `uz.json`

Append to the `dashboard` namespace in `src/i18n/locales/uz.json`:

```json
"login": {
  "title": "Devon platformasiga kirish",
  "subtitle": "Korporativ pochta va parol orqali",
  "email-label": "Korporativ pochta",
  "email-placeholder": "ism.familiya@devon.uz",
  "password-label": "Parol",
  "password-placeholder": "Parolingizni kiriting",
  "remember-me": "Meni eslab qol",
  "forgot-password": "Parolni unutdingizmi?",
  "cta": "Kirish",
  "ctaLoading": "Tekshirilmoqda...",
  "demo-hint-title": "Demo ma'lumotlari",
  "demo-hint-body": "admin@devon.uz / Demo2026!",
  "errors": {
    "invalid-credentials": "Email yoki parol noto'g'ri",
    "network": "Tarmoq xatosi. Qayta urinib ko'ring."
  },
  "footer": "© 2026 Devon. Barcha huquqlar himoyalangan."
}
```

### 5. Build the login page — `src/features/auth/LoginPage.tsx`

Mobile-first. Layout:
- On mobile (`<768px`): single full-viewport column. Logo at top. Form centred. Footer at bottom.
- On desktop (`≥768px`): split layout. Left pane (60%) shows the brand: cream background, large logo, slogan, illustration. Right pane (40%) shows the form against `surface` (white).

```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const from = params.get('from') ?? '/';

  const [email, setEmail] = useState('admin@devon.uz');
  const [password, setPassword] = useState('Demo2026!');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(t(`dashboard:login.errors.${result.reason}`));
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Brand pane — hidden on mobile, visible md+ */}
      <aside className="hidden md:flex md:w-3/5 lg:w-2/3 bg-cream-deep relative overflow-hidden">
        <div className="m-auto max-w-md p-12">
          <div className="flex items-center gap-3 mb-12">
            <span className="block w-3 h-3 rotate-45 bg-emerald"></span>
            <span className="font-black text-xl tracking-[0.16em] text-ink">DEVON</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-ink mb-6">
            Hujjat aylanmasi{' '}
            <span className="font-serif italic font-medium text-emerald">intizomli</span>
            <br />va xavfsiz.
          </h2>
          <p className="text-body text-lg leading-relaxed">
            Tarkibiy bo'linmalar, xodimlar, kelishuv zanjirlari va ERI kalitlari — bitta on-premise platformada.
          </p>
        </div>
        <span className="absolute bottom-8 left-12 text-cinnamon font-serif italic text-base">
          {t('dashboard:sidebar.footer-slogan')}
        </span>
      </aside>

      {/* Form pane */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile-only header */}
          <div className="md:hidden mb-8 flex items-center gap-3 justify-center">
            <span className="block w-3 h-3 rotate-45 bg-emerald"></span>
            <span className="font-black text-xl tracking-[0.16em] text-ink">DEVON</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
            {t('dashboard:login.title')}
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {t('dashboard:login.subtitle')}
          </p>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t('dashboard:login.email-label')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder={t('dashboard:login.email-placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={busy}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('dashboard:login.password-label')}</Label>
                <Link to="#" className="text-xs text-emerald hover:text-emerald-deep">
                  {t('dashboard:login.forgot-password')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('dashboard:login.password-placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={busy}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={v => setRemember(!!v)} />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                {t('dashboard:login.remember-me')}
              </Label>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={busy} className="w-full h-12 text-base">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t('dashboard:login.ctaLoading')}
                </>
              ) : (
                t('dashboard:login.cta')
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-cream-warm border border-line">
            <p className="text-xs font-semibold tracking-wider uppercase text-cinnamon mb-1">
              {t('dashboard:login.demo-hint-title')}
            </p>
            <p className="text-sm text-body font-mono">{t('dashboard:login.demo-hint-body')}</p>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            {t('dashboard:login.footer')}
          </p>
        </div>
      </section>
    </div>
  );
}
```

> Mobile-first details:
> - Brand pane is hidden below `md`. On mobile, only the form pane is shown with a compact logo header.
> - All inputs are `h-12` (48px) → comfortable touch targets.
> - The demo credentials are *prefilled* — one-tap login on mobile.
> - The form respects the viewport: `min-h-screen` + `flex` + `items-center` keeps the form centred even on tall phones.
> - The `Checkbox` + label uses a generous tap target via the wrapping flex row.

### 6. Build `RequireAuth.tsx`

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ReactElement } from 'react';

interface Props {
  children: ReactElement;
}

export function RequireAuth({ children }: Props) {
  const { isAuthenticated, isExpired, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || isExpired()) {
    if (isExpired()) logout();
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return children;
}
```

### 7. Define the route table — `src/router.tsx`

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';

// Placeholder pages — populated in later steps.
function Placeholder({ title }: { title: string }) {
  return (
    <main className="container py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming in a later step.</p>
    </main>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Placeholder title="Bosh sahifa" />
          </RequireAuth>
        }
      />
      <Route
        path="/units"
        element={
          <RequireAuth>
            <Placeholder title="Tarkibiy tuzilma" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees"
        element={
          <RequireAuth>
            <Placeholder title="Xodimlar" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/new"
        element={
          <RequireAuth>
            <Placeholder title="Yangi xodim" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/:uuid"
        element={
          <RequireAuth>
            <Placeholder title="Xodim profili" />
          </RequireAuth>
        }
      />
      <Route
        path="/certificates"
        element={
          <RequireAuth>
            <Placeholder title="ERI kalitlari" />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Placeholder title="Mening profilim" />
          </RequireAuth>
        }
      />
      <Route
        path="/audit"
        element={
          <RequireAuth>
            <Placeholder title="Audit jurnali" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### 8. Wrap with `BrowserRouter` in `App.tsx`

```tsx
import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
      <Toaster richColors closeButton position="top-center" />
    </BrowserRouter>
  );
}
```

> `BASE_URL` is `/Devon/dashboard/`. Trim the trailing slash for `basename`.

## Acceptance checks

- [ ] Visit `/Devon/dashboard/` while logged out → redirects to `/Devon/dashboard/login?from=%2F`
- [ ] Login with **wrong** credentials → red `Alert` shows "Email yoki parol noto'g'ri"
- [ ] Login with **correct** credentials (`admin@devon.uz` / `Demo2026!`) → redirects back to `/` and shows the "Bosh sahifa" placeholder
- [ ] After login, reload the page → still authenticated (session persisted to localStorage)
- [ ] Manually edit localStorage's session `expiresAt` to a past timestamp, reload → redirected to `/login`
- [ ] **Mobile (360×640)**: Login page is fully usable. Brand pane is hidden. Logo header visible. Form fits. Inputs are 48px tall. No horizontal scroll.
- [ ] **Tablet (768×1024)**: Brand pane appears on the left, form on the right.
- [ ] **Desktop (1280×800)**: Brand pane occupies 2/3, form occupies 1/3, both vertically centred.
- [ ] Try a deep link `/Devon/dashboard/employees` while logged out → after login, lands on `/employees` (not `/`)
- [ ] Network simulation: refresh and login a few times — within ~30 attempts you should see one "Tarmoq xatosi" toast/alert (3% failure rate)
- [ ] All strings on the login page are sourced from `t('key')`. No hardcoded UZ text in JSX.

## Notes

- The hardcoded credential check inside the store is a Step 04 stopgap. Step 07 refactors `login()` to call `mock-backend/users.findByEmail` and compare a SHA-256 hash. The session shape and store API do not change at that point.
- The placeholder pages use the same container but no app shell — that lands in Step 05. After Step 05, every protected route renders inside `<AppShell>` with the sidebar and top bar.
- Do NOT use `HashRouter`. We chose BrowserRouter + SPA 404 fallback.

## What "done" looks like

A user lands on `/login`, taps the prefilled CTA, and is taken to the home placeholder. Reloading keeps them in. Bad credentials show a localised error. Mobile and desktop layouts both look intentional.
