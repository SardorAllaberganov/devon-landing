# STEP 05 — App shell (sidebar drawer on mobile, top bar, user menu)

## Prerequisite
Master prompt loaded. Steps 01–04 complete (login flow works, route table exists).

## Goal
Wrap every protected route in a persistent **AppShell** with a responsive sidebar (full drawer on mobile via `Sheet`, persistent column on desktop), a compact top bar with breadcrumbs / search / user menu, and a content area that adapts cleanly across all six target viewports.

## Deliverables
- `dashboard/src/components/layout/AppShell.tsx`
- `dashboard/src/components/layout/Sidebar.tsx`
- `dashboard/src/components/layout/TopBar.tsx`
- `dashboard/src/components/layout/UserMenu.tsx`
- `dashboard/src/components/layout/MobileNavTrigger.tsx`
- `dashboard/src/stores/useUiStore.ts` — sidebar open state, theme, locale (locale wiring later)
- `dashboard/src/components/common/PageHeader.tsx` — title + actions, responsive
- `router.tsx` updated to render each protected route inside `<AppShell>`
- `i18n/locales/uz.json` extended (`dashboard.sidebar.*`, `dashboard.topbar.*`, `dashboard.user-menu.*` — already added in step 03, verify completeness)

## Tasks

### 1. Install lucide-react (icons)

```bash
npm install lucide-react
```

### 2. Create the UI store — `src/stores/useUiStore.ts`

```ts
import { create } from 'zustand';

interface UiState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

export const useUiStore = create<UiState>(set => ({
  mobileNavOpen: false,
  setMobileNavOpen: open => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set(s => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
```

### 3. Sidebar — `src/components/layout/Sidebar.tsx`

Same component, two presentations:
- Mobile (`<lg`): rendered inside a `Sheet` from the left. Triggered by the top bar's hamburger.
- Desktop (`≥lg`): rendered inline as a persistent 240px column.

```tsx
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Network,
  Users,
  KeySquare,
  ScrollText,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const managementNav: NavItem[] = [
  { to: '/', labelKey: 'dashboard:sidebar.nav-home', icon: LayoutDashboard },
  { to: '/units', labelKey: 'dashboard:sidebar.nav-units', icon: Network },
  { to: '/employees', labelKey: 'dashboard:sidebar.nav-employees', icon: Users },
  { to: '/certificates', labelKey: 'dashboard:sidebar.nav-certificates', icon: KeySquare },
  { to: '/audit', labelKey: 'dashboard:sidebar.nav-audit', icon: ScrollText },
];

const personalNav: NavItem[] = [
  { to: '/profile', labelKey: 'dashboard:sidebar.nav-profile', icon: UserCircle2 },
];

interface Props {
  onNavigate?: () => void; // close drawer on mobile
}

export default function Sidebar({ onNavigate }: Props) {
  const { t } = useTranslation(['dashboard']);

  return (
    <nav className="flex flex-col h-full bg-cream-deep border-r border-line">
      {/* Logo / wordmark */}
      <div className="px-6 h-16 flex items-center gap-3 border-b border-line/60">
        <span className="block w-3 h-3 rotate-45 bg-emerald" aria-hidden />
        <span className="font-black text-lg tracking-[0.16em] text-ink">DEVON</span>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        <NavSection title={t('dashboard:sidebar.section-management')} items={managementNav} onNavigate={onNavigate} />
        <NavSection title={t('dashboard:sidebar.section-personal')} items={personalNav} onNavigate={onNavigate} />
      </div>

      {/* Footer slogan */}
      <div className="px-6 py-4 border-t border-line/60">
        <p className="font-serif italic text-cinnamon text-sm">
          {t('dashboard:sidebar.footer-slogan')}
        </p>
      </div>
    </nav>
  );
}

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const { t } = useTranslation(['dashboard']);
  return (
    <div>
      <p className="px-3 mb-2 text-[10.5px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 h-11 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald text-cream'
                    : 'text-body hover:text-ink hover:bg-cream/60'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. TopBar — `src/components/layout/TopBar.tsx`

```tsx
import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MobileNavTrigger from './MobileNavTrigger';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export default function TopBar() {
  const { t } = useTranslation(['dashboard']);

  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-line">
      <div className="h-16 flex items-center gap-3 px-4 md:px-6">
        <MobileNavTrigger />

        {/* Logo (mobile only — replaces sidebar wordmark when nav is closed) */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="block w-2.5 h-2.5 rotate-45 bg-emerald" aria-hidden />
          <span className="font-black text-sm tracking-[0.16em] text-ink">DEVON</span>
        </div>

        {/* Search — hidden on smallest, visible from sm+ */}
        <div className="hidden sm:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              placeholder={t('dashboard:topbar.search-placeholder')}
              className="pl-9 bg-surface h-10"
              aria-label={t('dashboard:topbar.search-placeholder')}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('dashboard:topbar.notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{t('dashboard:topbar.notifications')}</DropdownMenuLabel>
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                {t('dashboard:topbar.no-notifications')}
              </p>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

### 5. MobileNavTrigger — `src/components/layout/MobileNavTrigger.tsx`

Renders a hamburger that opens a `Sheet` containing the sidebar. Only visible below `lg`.

```tsx
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUiStore } from '@/stores/useUiStore';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';

export default function MobileNavTrigger() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
```

### 6. UserMenu — `src/components/layout/UserMenu.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCcw, Settings as SettingsIcon, UserCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function initials(fullName: string) {
  return fullName.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function UserMenu() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function onResetDemo() {
    // Step 07 wires the proper reset; for now just clear the session.
    Object.keys(localStorage)
      .filter(k => k.startsWith('devon.dashboard.'))
      .forEach(k => localStorage.removeItem(k));
    toast.success("Demo ma'lumotlar qayta tiklandi. Sahifa qayta yuklanadi.");
    setTimeout(() => window.location.reload(), 800);
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-1.5 gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-emerald text-cream text-xs font-semibold">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium text-ink">{user.fullName.split(' ')[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold text-ink truncate">{user.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <UserCircle2 className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onResetDemo}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.reset-demo')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('common:actions.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 7. AppShell — `src/components/layout/AppShell.tsx`

```tsx
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden lg:block lg:w-60 shrink-0">
        <div className="fixed inset-y-0 left-0 w-60">
          <Sidebar />
        </div>
      </div>

      {/* Main column — content fills full viewport (minus sidebar + padding).
          Do NOT add max-w-* / mx-auto here. Devon is a data-dense admin surface;
          tables, kanban, audit logs benefit from horizontal room. If a specific
          page needs constrained width (single-column form), use max-w-* on the
          inner form container, not on <main>. See ai_context/LESSONS.md. */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 8. PageHeader — `src/components/common/PageHeader.tsx`

A reusable responsive header for every page.

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className }: Props) {
  return (
    <div className={cn('mb-6 md:mb-8', className)}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
```

### 9. Wrap protected routes in `AppShell` (router update)

Edit `src/router.tsx`. Wrap every protected route's element. Example:

```tsx
<Route
  path="/"
  element={
    <RequireAuth>
      <AppShell>
        <Placeholder title="Bosh sahifa" />
      </AppShell>
    </RequireAuth>
  }
/>
```

> Bonus: extract a `<Protected>` helper to reduce noise:
> ```tsx
> function Protected({ children }: { children: ReactElement }) {
>   return <RequireAuth><AppShell>{children}</AppShell></RequireAuth>;
> }
> ```
> Then `element={<Protected><Placeholder title="…" /></Protected>}`. Same in subsequent steps.

### 10. Sonner position responsiveness

Update `App.tsx` so the toaster sits `top-center` on mobile and `bottom-right` on desktop.

```tsx
import { useMediaQuery } from '@/lib/use-media-query'; // create this if not present
...
const isDesktop = useMediaQuery('(min-width: 768px)');
<Toaster richColors closeButton position={isDesktop ? 'bottom-right' : 'top-center'} />
```

Helper `src/lib/use-media-query.ts`:
```ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
```

## Acceptance checks

- [ ] **Desktop (≥1024px)**: sidebar visible on the left, 240px wide, content area fills the full remaining viewport width (no max-w clamp — see [`ai_context/LESSONS.md`](../../ai_context/LESSONS.md)). No hamburger visible.
- [ ] **Tablet (768–1023px)**: sidebar hidden, hamburger in top bar opens it as a `Sheet`. Search visible.
- [ ] **Mobile (<768px)**: hamburger + compact DEVON wordmark in top bar; search hidden, notifications + user menu still visible. Tapping hamburger slides the sidebar in from the left, covering the screen. Tapping any nav item or the close button closes the drawer.
- [ ] **Mobile 360px**: top bar fits without overflow. Avatar shows initials only (no first-name span). All tap targets ≥ 44pt.
- [ ] Active nav state is the emerald pill with cream text. Inactive items hover to dark text + cream background.
- [ ] User menu shows full name, email, demo reset, logout. Logout returns to `/login`.
- [ ] Reset demo clears localStorage and reloads.
- [ ] Sonner toasts appear at `top-center` on mobile, `bottom-right` on desktop.
- [ ] No layout shift when toggling the mobile sidebar.
- [ ] Keyboard: `Tab` cycles through hamburger → search → bell → user-menu correctly. Focus rings visible.
- [ ] All sidebar / topbar / user-menu strings come from `t('key')`.
- [ ] Tested at 360 / 390 / 768 / 1024 / 1280 / 1920px viewports.

## Notes

- The sidebar always renders the same component — only its container changes (Sheet on mobile, inline div on desktop). This guarantees identical nav semantics.
- Reset-demo is intentionally available *before* Step 07. It just clears anything namespaced `devon.dashboard.*`. After Step 07, the reset additionally re-seeds.
- The compact mobile logo in the top bar duplicates the sidebar wordmark — both show DEVON, but only one is visible at a time depending on viewport.
- We deliberately don't add a "breadcrumb" component yet. Pages with deeper hierarchy (e.g., `/employees/:uuid/transfer`) get a back link inside the page header instead — simpler on mobile.

## What "done" looks like

Every protected page now has the full Devon chrome around it. The sidebar drawer feels native on mobile (slide-in, scroll-locked, dismissable). The user menu lets you log out and reset the demo. The placeholder pages still say "Coming in a later step" — that's expected. Subsequent steps fill the placeholders one by one.
