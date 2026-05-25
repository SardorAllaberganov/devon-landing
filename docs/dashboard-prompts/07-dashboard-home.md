# STEP 07 — Dashboard home (stats + recent activity + quick actions)

## Prerequisite
Master prompt loaded. Steps 01–06 complete (mock backend seeded, AppShell wired).

## Goal
Build the home page (`/`) that an HR_ADMIN sees first after login: a responsive stats row, a recent-activity card sourced from the audit log, an "expiring certificates" alert, and a quick-actions block. The layout must collapse cleanly from 4-col stats on desktop to 1-col stacked on mobile.

## Deliverables
- `dashboard/src/features/dashboard-home/DashboardHome.tsx`
- `dashboard/src/features/dashboard-home/StatsRow.tsx`
- `dashboard/src/features/dashboard-home/RecentActivityCard.tsx`
- `dashboard/src/features/dashboard-home/ExpiringCertsAlert.tsx`
- `dashboard/src/features/dashboard-home/QuickActions.tsx`
- `dashboard/src/components/common/StatCard.tsx` — reusable, used by StatsRow
- `dashboard/src/components/common/LoadingState.tsx`
- `dashboard/src/components/common/EmptyState.tsx`
- `dashboard/src/components/common/ErrorState.tsx`
- Replace the `Placeholder` for `/` route with `<DashboardHome />`
- Extend `uz.json` with `dashboard.home.*` keys

## Tasks

### 1. Common state components

`src/components/common/LoadingState.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
```

`src/components/common/EmptyState.tsx`:
```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, body, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-6', className)}>
      {Icon && (
        <div className="mb-4 w-12 h-12 rounded-full bg-cream-warm text-cinnamon flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

`src/components/common/ErrorState.tsx`:
```tsx
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

export default function ErrorState({ title, body, onRetry }: Props) {
  const { t } = useTranslation(['common']);
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="mb-3 w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title ?? t('common:errors.unknown')}</h3>
      {body && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{body}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          {t('common:actions.reset')}
        </Button>
      )}
    </div>
  );
}
```

### 2. Reusable `StatCard`

`src/components/common/StatCard.tsx`:
```tsx
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: string; trend: 'up' | 'down' | 'flat' };
  tone?: 'default' | 'emerald' | 'cinnamon' | 'signal';
  className?: string;
}

const toneMap = {
  default: 'bg-surface',
  emerald: 'bg-emerald text-cream',
  cinnamon: 'bg-cinnamon text-cream',
  signal: 'bg-cream-deep text-ink',
};

export default function StatCard({ icon: Icon, label, value, delta, tone = 'default', className }: Props) {
  const dark = tone === 'emerald' || tone === 'cinnamon';
  return (
    <Card className={cn('p-5 md:p-6 flex flex-col gap-3 border', toneMap[tone], className)}>
      <div className="flex items-start justify-between">
        <p className={cn('text-xs font-semibold tracking-wider uppercase', dark ? 'text-cream/70' : 'text-muted-foreground')}>
          {label}
        </p>
        <span
          className={cn(
            'rounded-md p-1.5',
            dark ? 'bg-cream/15 text-cream' : 'bg-cream-deep text-emerald'
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className={cn('text-3xl md:text-4xl font-extrabold leading-none tracking-tight', dark ? 'text-cream' : 'text-ink')}>
          {value}
        </p>
        {delta && (
          <p className={cn('mt-2 text-xs', dark ? 'text-cream/70' : 'text-muted-foreground')}>
            {delta.value}
          </p>
        )}
      </div>
    </Card>
  );
}
```

### 3. StatsRow — `src/features/dashboard-home/StatsRow.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Network, KeySquare, Clock } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { listEmployees, listUnits, listCertificates } from '@/lib/mock-backend';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatsRow() {
  const { t } = useTranslation(['dashboard']);
  const [data, setData] = useState<{ emp: number; units: number; active: number; pending: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emp, units, certs] = await Promise.all([
        listEmployees(),
        listUnits(),
        listCertificates(),
      ]);
      if (cancelled) return;
      setData({
        emp: emp.filter(e => e.status === 'ACTIVE').length,
        units: units.filter(u => u.status === 'ACTIVE').length,
        active: certs.filter(c => c.status === 'ACTIVE').length,
        pending: certs.filter(c => c.status === 'PENDING_APPROVAL').length,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Users} label={t('dashboard:home.stats.employees')} value={data.emp} tone="emerald" />
      <StatCard icon={Network} label={t('dashboard:home.stats.units')} value={data.units} />
      <StatCard icon={KeySquare} label={t('dashboard:home.stats.active-certs')} value={data.active} tone="signal" />
      <StatCard icon={Clock} label={t('dashboard:home.stats.pending-approvals')} value={data.pending} tone="cinnamon" />
    </div>
  );
}
```

### 4. RecentActivityCard

```tsx
// src/features/dashboard-home/RecentActivityCard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/common/LoadingState';
import { listAudit } from '@/lib/mock-backend';
import { formatRelative } from '@/i18n/uz-locale';
import type { AuditEntry } from '@/types/domain';

const ACTION_ICON: Record<string, string> = {
  CREATE: '✚',
  UPDATE: '✎',
  ARCHIVE: '⌫',
  LOGIN: '⇄',
  UNIT_TRANSFER: '↻',
  CERTIFICATE_UPLOADED: '🔑',
  CERTIFICATE_APPROVED: '✓',
  CERTIFICATE_REVOKED: '⊘',
};

export default function RecentActivityCard() {
  const { t } = useTranslation(['dashboard']);
  const [rows, setRows] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    (async () => setRows(await listAudit({ limit: 8 })))();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">
          {t('dashboard:home.recent-activity')}
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/audit">{t('common:actions.view-all')}</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {!rows && <LoadingState rows={6} />}
        {rows && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t('dashboard:home.no-activity')}
          </p>
        )}
        {rows && rows.length > 0 && (
          <ul className="divide-y divide-line">
            {rows.map(r => (
              <li key={r.uuid} className="py-3 flex items-start gap-3">
                <span className="mt-0.5 w-7 h-7 rounded-md bg-cream-warm text-emerald flex items-center justify-center text-sm font-semibold shrink-0">
                  {ACTION_ICON[r.action] ?? '•'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink leading-snug truncate">
                    <span className="font-medium">{r.actorName}</span>{' '}
                    <span className="text-muted-foreground">{t(`dashboard:audit.actions.${r.action}`)}</span>{' '}
                    <span className="text-ink">{r.resourceLabel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(r.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

Add audit-action translations to `uz.json` under `dashboard.audit.actions.*`:
```json
"audit": {
  "actions": {
    "CREATE": "yaratdi",
    "UPDATE": "yangiladi",
    "DELETE": "o'chirdi",
    "ARCHIVE": "arxivladi",
    "LOGIN": "tizimga kirdi",
    "LOGOUT": "tizimdan chiqdi",
    "PASSWORD_CHANGED": "parolni o'zgartirdi",
    "UNIT_TRANSFER": "bo'linmaga ko'chirildi",
    "CERTIFICATE_UPLOADED": "ERI yukladi",
    "CERTIFICATE_APPROVED": "ERIni tasdiqladi",
    "CERTIFICATE_REVOKED": "ERIni bekor qildi",
    "PROFILE_CHANGE_REQUESTED": "profil o'zgarishini so'radi",
    "PROFILE_CHANGE_APPROVED": "profil o'zgarishini tasdiqladi"
  }
}
```

### 5. ExpiringCertsAlert

```tsx
// src/features/dashboard-home/ExpiringCertsAlert.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { listCertificates } from '@/lib/mock-backend';

export default function ExpiringCertsAlert() {
  const { t } = useTranslation(['dashboard']);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const certs = await listCertificates({ status: 'ACTIVE' });
      const horizon = Date.now() + 30 * 86_400_000;
      setCount(certs.filter(c => new Date(c.validTo).getTime() < horizon).length);
    })();
  }, []);

  if (count === 0) return null;

  return (
    <Alert className="bg-cinnamon-soft border-cinnamon/30 text-ink">
      <AlertCircle className="h-4 w-4 text-cinnamon" />
      <AlertTitle className="text-ink">
        {t('dashboard:home.expiring-alert.title', { count })}
      </AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span>{t('dashboard:home.expiring-alert.body')}</span>
        <Button asChild variant="outline" size="sm" className="bg-cream border-cinnamon/40 hover:bg-cinnamon-soft">
          <Link to="/certificates?filter=expiring">{t('dashboard:home.expiring-alert.cta')}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### 6. QuickActions

```tsx
// src/features/dashboard-home/QuickActions.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, NetworkIcon, KeySquare, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

const items = [
  { to: '/employees/new', icon: UserPlus, key: 'dashboard:home.quick.new-employee' },
  { to: '/units', icon: NetworkIcon, key: 'dashboard:home.quick.manage-units' },
  { to: '/certificates/upload', icon: KeySquare, key: 'dashboard:home.quick.upload-cert' },
  { to: '/audit', icon: FileText, key: 'dashboard:home.quick.view-audit' },
];

export default function QuickActions() {
  const { t } = useTranslation(['dashboard']);
  return (
    <Card className="p-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map(it => (
          <Link
            key={it.to}
            to={it.to}
            className="group flex flex-col items-center gap-2 p-4 rounded-md hover:bg-cream-warm transition-colors text-center"
          >
            <span className="w-10 h-10 rounded-md bg-cream-deep text-emerald flex items-center justify-center group-hover:bg-emerald group-hover:text-cream transition-colors">
              <it.icon className="h-5 w-5" />
            </span>
            <span className="text-xs md:text-sm font-medium text-ink leading-tight">
              {t(it.key)}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
```

### 7. Compose into `DashboardHome`

```tsx
// src/features/dashboard-home/DashboardHome.tsx
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import StatsRow from './StatsRow';
import RecentActivityCard from './RecentActivityCard';
import ExpiringCertsAlert from './ExpiringCertsAlert';
import QuickActions from './QuickActions';
import { useAuthStore } from '@/stores/useAuthStore';

export default function DashboardHome() {
  const { t } = useTranslation(['dashboard']);
  const user = useAuthStore(s => s.user);
  const firstName = user?.fullName.split(' ')[1] ?? user?.fullName ?? '';

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title={t('dashboard:home.greeting', { name: firstName })}
        subtitle={t('dashboard:home.subtitle')}
      />
      <ExpiringCertsAlert />
      <StatsRow />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityCard />
        </div>
        {/* Reserve the right column for future widgets (e.g., upcoming reviews) */}
        <div className="hidden lg:block" />
      </div>
    </div>
  );
}
```

### 8. Add `dashboard.home.*` keys to `uz.json`

```json
"home": {
  "greeting": "Salom, {{name}}!",
  "subtitle": "Bugun nima qilamiz?",
  "stats": {
    "employees": "Faol xodimlar",
    "units": "Tarkibiy bo'linmalar",
    "active-certs": "Faol ERI kalitlari",
    "pending-approvals": "Tasdiqlash kutilmoqda"
  },
  "recent-activity": "So'nggi harakatlar",
  "no-activity": "Harakatlar yo'q",
  "expiring-alert": {
    "title": "{{count}} ta ERI muddati 30 kun ichida tugaydi",
    "body": "Xodimlarga muddati tugayotgan kalitlarni yangilashni eslatib qo'ying.",
    "cta": "Ko'rib chiqish"
  },
  "quick": {
    "new-employee": "Yangi xodim",
    "manage-units": "Tuzilmani boshqarish",
    "upload-cert": "ERI yuklash",
    "view-audit": "Audit jurnali"
  }
}
```

### 9. Wire route

Replace `Placeholder title="Bosh sahifa"` in `router.tsx` with `<DashboardHome />`.

## Acceptance checks

- [ ] After login, `/` shows: greeting with first name, expiring-certs alert (if any), 4 stat cards, quick actions, recent activity
- [ ] **Mobile (360px)**: stats stack 1-col; quick actions 2-col; activity card full width; alert wraps gracefully
- [ ] **Tablet (768px)**: stats 2-col; quick actions 4-col
- [ ] **Desktop (1280px)**: stats 4-col; activity card 2/3 width with reserved space on the right
- [ ] StatCard tones render correctly: emerald (dark), default (white), signal (cream-deep), cinnamon (dark)
- [ ] Recent activity rows show actor name + localised verb + resource label + relative time ("3 soat oldin")
- [ ] Clicking "Hammasini ko'rish" navigates to `/audit`
- [ ] Quick action cards navigate to their target routes
- [ ] Loading states: stat cards show skeleton; activity card shows skeleton rows
- [ ] Empty state: clearing audit table via DevTools and reloading shows "Harakatlar yo'q"
- [ ] All strings via `t()`. No hardcoded user-facing text.
- [ ] No layout shift between skeleton → loaded state

## Notes

- The right-column placeholder on desktop is intentional — future widgets (upcoming KYC reviews, deadlines) will land there. Keep it reserved so the design feels balanced even now.
- Audit-actions translation file is critical: every action key from `AuditAction` must exist in `dashboard.audit.actions.*`. Missing keys render as raw codes — easy to spot.
- Greeting uses interpolation `{{name}}` — verify i18next passes the value through.
- ExpiringCertsAlert returns `null` when count is 0 — no empty alert pollution.

## What "done" looks like

A confident first impression. The HR_ADMIN lands on the home page and sees their org at a glance — counts, recent moves, what needs attention. Every breakpoint looks intentional.
