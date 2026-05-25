# STEP 09 — Flow 2 part A: Xodimlar ro'yxati (employees list, mobile-first)

## Prerequisite
Master prompt loaded. Steps 01–08 complete.

## Goal
Build `/employees` — the searchable, filterable, paginated employee list. Table on `md+`, card list on `<md`. A primary "+ Yangi xodim" CTA opens the wizard route (built in step 10). Tapping a row opens the employee profile route (built in step 11). Filter panel adapts: inline on desktop, a slide-up `Sheet` on mobile.

## Deliverables
- `dashboard/src/features/employees/list/EmployeeListPage.tsx`
- `dashboard/src/features/employees/list/EmployeeListTable.tsx`
- `dashboard/src/features/employees/list/EmployeeListMobile.tsx`
- `dashboard/src/features/employees/list/EmployeeFilters.tsx`
- `dashboard/src/features/employees/list/EmployeeFilterSheetMobile.tsx`
- `dashboard/src/components/common/Pagination.tsx`
- `dashboard/src/components/common/DataTableMobile.tsx` — generic, optional
- Extend `uz.json` with `dashboard.employees.list.*`
- Replace `/employees` placeholder with `<EmployeeListPage />`

## Tasks

### 1. Filters state shape

```ts
// src/features/employees/list/filters.ts
import type { EmployeeStatus } from '@/types/domain';

export interface EmployeeFiltersState {
  search: string;
  unitUuid: string | null;
  status: EmployeeStatus | 'ALL';
  employmentType: 'ALL' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  page: number;
  perPage: number;
}

export const defaultFilters: EmployeeFiltersState = {
  search: '',
  unitUuid: null,
  status: 'ACTIVE',
  employmentType: 'ALL',
  page: 1,
  perPage: 20,
};
```

### 2. Filters component (desktop inline)

```tsx
// src/features/employees/list/EmployeeFilters.tsx
import { useTranslation } from 'react-i18next';
import SearchInput from '@/components/common/SearchInput';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Unit } from '@/types/domain';
import type { EmployeeFiltersState } from './filters';

interface Props {
  filters: EmployeeFiltersState;
  onChange: (next: EmployeeFiltersState) => void;
  units: Unit[];
}

export default function EmployeeFilters({ filters, onChange, units }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      <div className="flex-1">
        <SearchInput
          value={filters.search}
          onChange={v => onChange({ ...filters, search: v, page: 1 })}
          placeholder={t('dashboard:employees.list.search-placeholder')}
        />
      </div>

      <Select
        value={filters.unitUuid ?? '__all__'}
        onValueChange={v => onChange({ ...filters, unitUuid: v === '__all__' ? null : v, page: 1 })}
      >
        <SelectTrigger className="md:w-56 h-10">
          <SelectValue placeholder={t('dashboard:employees.list.filter-unit')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('common:labels.all')}</SelectItem>
          {units.filter(u => u.status === 'ACTIVE').map(u => (
            <SelectItem key={u.uuid} value={u.uuid}>{u.nameUz}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={v => onChange({ ...filters, status: v as any, page: 1 })}
      >
        <SelectTrigger className="md:w-44 h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
          <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
          <SelectItem value="ON_LEAVE">{t('common:status.on-leave')}</SelectItem>
          <SelectItem value="SUSPENDED">{t('common:status.suspended')}</SelectItem>
          <SelectItem value="DRAFT">{t('common:status.draft')}</SelectItem>
          <SelectItem value="TERMINATED">{t('common:status.terminated')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 3. Filter Sheet for mobile

```tsx
// src/features/employees/list/EmployeeFilterSheetMobile.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Unit } from '@/types/domain';
import type { EmployeeFiltersState } from './filters';

interface Props {
  filters: EmployeeFiltersState;
  onChange: (next: EmployeeFiltersState) => void;
  units: Unit[];
}

export default function EmployeeFilterSheetMobile({ filters, onChange, units }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const activeCount = (filters.unitUuid ? 1 : 0) + (filters.status !== 'ACTIVE' ? 1 : 0) + (filters.employmentType !== 'ALL' ? 1 : 0);

  function apply() {
    onChange({ ...draft, page: 1 });
    setOpen(false);
  }

  function reset() {
    const next = { ...filters, unitUuid: null, status: 'ACTIVE' as const, employmentType: 'ALL' as const, page: 1 };
    setDraft(next);
    onChange(next);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={v => { setOpen(v); if (v) setDraft(filters); }}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 shrink-0">
          <Filter className="h-4 w-4 mr-2" />
          {t('common:actions.filter')}
          {activeCount > 0 && (
            <span className="ml-2 px-1.5 rounded-full bg-emerald text-cream text-[10px] font-semibold tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{t('common:actions.filter')}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">{t('dashboard:employees.list.filter-unit')}</label>
            <Select
              value={draft.unitUuid ?? '__all__'}
              onValueChange={v => setDraft({ ...draft, unitUuid: v === '__all__' ? null : v })}
            >
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('common:labels.all')}</SelectItem>
                {units.filter(u => u.status === 'ACTIVE').map(u => (
                  <SelectItem key={u.uuid} value={u.uuid}>{u.nameUz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">{t('common:status.active')}</label>
            <Select value={draft.status} onValueChange={v => setDraft({ ...draft, status: v as any })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
                <SelectItem value="ON_LEAVE">{t('common:status.on-leave')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('common:status.suspended')}</SelectItem>
                <SelectItem value="DRAFT">{t('common:status.draft')}</SelectItem>
                <SelectItem value="TERMINATED">{t('common:status.terminated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">{t('dashboard:employees.list.filter-employment')}</label>
            <Select value={draft.employmentType} onValueChange={v => setDraft({ ...draft, employmentType: v as any })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
                <SelectItem value="FULL_TIME">{t('common:employment-types.FULL_TIME')}</SelectItem>
                <SelectItem value="PART_TIME">{t('common:employment-types.PART_TIME')}</SelectItem>
                <SelectItem value="CONTRACT">{t('common:employment-types.CONTRACT')}</SelectItem>
                <SelectItem value="INTERN">{t('common:employment-types.INTERN')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-t border-line pt-4 pb-safe -mx-6 px-6 flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={reset}>{t('common:actions.reset')}</Button>
          <Button className="flex-1 h-12" onClick={apply}>{t('common:actions.confirm')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 4. Pagination

```tsx
// src/components/common/Pagination.tsx
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  page: number;
  perPage: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, perPage, total, onChange }: Props) {
  const { t } = useTranslation(['dashboard']);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t('dashboard:pagination.range', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs px-2 tabular-nums">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

Add the key:
```json
"pagination": { "range": "{{from}}–{{to}} / {{total}}" }
```
inside `dashboard` namespace.

### 5. EmployeeListTable (desktop)

```tsx
// src/features/employees/list/EmployeeListTable.tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';
import type { Employee, Unit } from '@/types/domain';

interface Props {
  rows: Employee[];
  units: Unit[];
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function EmployeeListTable({ rows, units }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'common']);
  const unitsByUuid = new Map(units.map(u => [u.uuid, u]));

  return (
    <div className="bg-surface border border-line rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-cream-warm/40">
          <TableRow>
            <TableHead>{t('dashboard:employees.list.col-fio')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-unit')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-position')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-pinfl')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(emp => (
            <TableRow key={emp.uuid} className="cursor-pointer hover:bg-cream-warm/30" onClick={() => navigate(`/employees/${emp.uuid}`)}>
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-emerald-soft text-emerald-deep text-xs font-semibold">
                      {initials(emp.fullNameGenerated)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{emp.fullNameGenerated}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.corporateEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-body truncate">
                {unitsByUuid.get(emp.primaryUnitUuid)?.nameUz ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-body">{emp.positionId}</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
                {emp.pinfl.replace(/(.{4})/g, '$1 ').trim()}
              </TableCell>
              <TableCell><StatusBadge status={emp.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 6. EmployeeListMobile (card stack)

```tsx
// src/features/employees/list/EmployeeListMobile.tsx
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';
import type { Employee, Unit } from '@/types/domain';

interface Props {
  rows: Employee[];
  units: Unit[];
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function EmployeeListMobile({ rows, units }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const unitsByUuid = new Map(units.map(u => [u.uuid, u]));

  return (
    <ul className="space-y-2">
      {rows.map(emp => (
        <li key={emp.uuid}>
          <button
            onClick={() => navigate(`/employees/${emp.uuid}`)}
            className="w-full bg-surface border border-line rounded-lg p-3 flex items-center gap-3 text-left hover:bg-cream-warm/30 transition-colors min-h-[64px]"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-emerald-soft text-emerald-deep text-sm font-semibold">
                {initials(emp.fullNameGenerated)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{emp.fullNameGenerated}</p>
              <p className="text-xs text-muted-foreground truncate">
                {unitsByUuid.get(emp.primaryUnitUuid)?.nameUz ?? '—'}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={emp.status} />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### 7. EmployeeListPage

```tsx
// src/features/employees/list/EmployeeListPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

import PageHeader from '@/components/common/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';

import EmployeeFilters from './EmployeeFilters';
import EmployeeFilterSheetMobile from './EmployeeFilterSheetMobile';
import EmployeeListTable from './EmployeeListTable';
import EmployeeListMobile from './EmployeeListMobile';
import { defaultFilters, type EmployeeFiltersState } from './filters';

import { listEmployees, listUnits } from '@/lib/mock-backend';
import { useMediaQuery } from '@/lib/use-media-query';
import type { Employee, Unit } from '@/types/domain';

export default function EmployeeListPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeeFiltersState>(defaultFilters);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    (async () => {
      const [u] = await Promise.all([listUnits()]);
      setUnits(u);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEmployees(null);
    (async () => {
      const all = await listEmployees({
        search: filters.search || undefined,
        unitUuid: filters.unitUuid ?? undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
      });
      const filtered = filters.employmentType === 'ALL'
        ? all
        : all.filter(e => e.employmentType === filters.employmentType);
      if (!cancelled) setEmployees(filtered);
    })();
    return () => { cancelled = true; };
  }, [filters.search, filters.unitUuid, filters.status, filters.employmentType]);

  const total = employees?.length ?? 0;
  const paged = useMemo(() => {
    if (!employees) return [];
    const from = (filters.page - 1) * filters.perPage;
    return employees.slice(from, from + filters.perPage);
  }, [employees, filters.page, filters.perPage]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('dashboard:employees.list.title')}
        subtitle={t('dashboard:employees.list.subtitle', { total })}
        actions={
          <Button onClick={() => navigate('/employees/new')} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard:employees.list.cta-new')}
          </Button>
        }
      />

      {/* Filters: inline on desktop, search + filter button on mobile */}
      <div className="hidden md:block">
        <EmployeeFilters filters={filters} onChange={setFilters} units={units} />
      </div>
      <div className="md:hidden flex gap-2">
        <div className="flex-1">
          <input
            type="search"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            placeholder={t('dashboard:employees.list.search-placeholder')}
            className="w-full h-10 px-3 rounded-md border border-line bg-surface text-sm"
          />
        </div>
        <EmployeeFilterSheetMobile filters={filters} onChange={setFilters} units={units} />
      </div>

      {!employees && <LoadingState rows={8} />}
      {employees && employees.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('dashboard:employees.list.empty-title')}
          body={t('dashboard:employees.list.empty-body')}
          action={
            <Button onClick={() => navigate('/employees/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('dashboard:employees.list.cta-new')}
            </Button>
          }
        />
      )}
      {employees && employees.length > 0 && (
        <>
          {isDesktop ? (
            <EmployeeListTable rows={paged} units={units} />
          ) : (
            <EmployeeListMobile rows={paged} units={units} />
          )}
          <Pagination
            page={filters.page}
            perPage={filters.perPage}
            total={total}
            onChange={page => setFilters({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}
```

### 8. Translation keys — extend `uz.json`

```json
"employees": {
  "list": {
    "title": "Xodimlar",
    "subtitle": "Jami: {{total}} ta",
    "cta-new": "+ Yangi xodim",
    "search-placeholder": "FIO, email yoki JSHShIR bo'yicha qidirish...",
    "filter-unit": "Bo'linma",
    "filter-employment": "Ish turi",
    "empty-title": "Hozircha xodimlar topilmadi",
    "empty-body": "Filtr shartlarini o'zgartiring yoki yangi xodim yarating.",
    "col-fio": "FIO va aloqa",
    "col-unit": "Bo'linma",
    "col-position": "Lavozim",
    "col-pinfl": "JSHShIR",
    "col-status": "Holat"
  }
}
```

### 9. Update router

```tsx
<Route path="/employees" element={<Protected><EmployeeListPage /></Protected>} />
```

## Acceptance checks

- [ ] List renders 20 employees per page; pagination controls work
- [ ] **Desktop**: full table with avatar + name + email, unit, position, masked PINFL, status badge
- [ ] **Mobile (360px)**: card stack — each card has avatar, name, unit, status. Tap target ≥ 64px high.
- [ ] Search: typing "Sardor" filters to matching employees within 300ms (debounce)
- [ ] Filter by unit: only employees in the selected unit appear
- [ ] Filter by status: switching to TERMINATED shows the (likely empty) set; switching back to ACTIVE restores the full set
- [ ] **Mobile**: filter sheet from bottom shows active filter count badge on the trigger button (only counts non-default filter values)
- [ ] Empty state with relevant CTA when no rows match
- [ ] Tapping a row navigates to `/employees/:uuid` (placeholder for now — built in step 11)
- [ ] Tapping "+ Yangi xodim" navigates to `/employees/new` (placeholder for now — built in step 10)
- [ ] PINFL displayed in 4-digit groups with spaces (not raw)
- [ ] All copy via `t()`. No hardcoded UZ strings.
- [ ] Loading skeleton during fetch; no layout jump
- [ ] Tested at 360 / 768 / 1024 / 1280px

## Notes

- PINFL is shown in the table at desktop sizes only — too wide for mobile cards. Mobile cards show name + unit + status + chevron.
- Avatars use initials with the emerald-soft background — keeps the chrome warm.
- We are not paginating server-side because the demo data is small. `listEmployees()` returns everything; pagination is client-side. If the demo grows, swap to server-side pagination by passing `page`/`perPage` to the mock API.

## What "done" looks like

The list feels like a real product. Filter, search, paginate, scan rows quickly on desktop, swipe through cards on mobile. The CTA in the page header is always visible, ready for step 10's wizard.
