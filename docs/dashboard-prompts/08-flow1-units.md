# STEP 08 — Flow 1: Tarkibiy bo'linmalar (org tree CRUD, mobile-first)

## Prerequisite
Master prompt loaded. Steps 01–07 complete.

## Goal
Build the structural-units page (`/units`) covering Flow 1 in the TZ §3:
- Tree view on desktop (`md+`), Accordion on mobile
- Create / edit / archive / move (re-parent) operations
- Search by name or code (debounced)
- Filter by type and status
- Tap a node → details sheet with child counts, employee count, head info, sub-nodes
- All validation per TZ §3.3 (unique-within-parent name, max depth 7, type-vs-parent rules, no circular references)

## Deliverables
- `dashboard/src/features/units/UnitsPage.tsx`
- `dashboard/src/features/units/UnitsTreeDesktop.tsx`
- `dashboard/src/features/units/UnitsAccordionMobile.tsx`
- `dashboard/src/features/units/UnitFormSheet.tsx` — create + edit (reusable; renders as `Dialog` on desktop, `Sheet` from bottom on mobile via the `ResponsiveDialog` helper)
- `dashboard/src/features/units/UnitDetailsSheet.tsx`
- `dashboard/src/features/units/unit.schema.ts` — zod form schema
- `dashboard/src/components/common/ResponsiveDialog.tsx` — `Dialog` ≥md / `Sheet` <md
- `dashboard/src/components/common/StatusBadge.tsx` — colour + icon + label
- `dashboard/src/components/common/SearchInput.tsx` — 300ms debounced
- Mock-backend additions: `updateUnit`, `archiveUnit`, `moveUnit`
- Extend `uz.json` with `dashboard.units.*` keys
- Replace `/units` placeholder with `<UnitsPage />`

## Tasks

### 1. ResponsiveDialog helper

```tsx
// src/components/common/ResponsiveDialog.tsx
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/lib/use-media-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** desktop dialog width; default 'sm:max-w-lg' */
  size?: string;
}

export default function ResponsiveDialog(p: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (isDesktop) {
    return (
      <Dialog open={p.open} onOpenChange={p.onOpenChange}>
        <DialogContent className={p.size ?? 'sm:max-w-lg'}>
          <DialogHeader>
            <DialogTitle>{p.title}</DialogTitle>
            {p.description && <DialogDescription>{p.description}</DialogDescription>}
          </DialogHeader>
          {p.children}
          {p.footer && <DialogFooter>{p.footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={p.open} onOpenChange={p.onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] flex flex-col rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{p.title}</SheetTitle>
          {p.description && <SheetDescription>{p.description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">{p.children}</div>
        {p.footer && (
          <SheetFooter className="border-t border-line pt-4 -mx-6 px-6 pb-safe sticky bottom-0 bg-background">
            {p.footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### 2. StatusBadge

```tsx
// src/components/common/StatusBadge.tsx
import { Check, Archive, Clock, AlertCircle, X, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type StatusKind =
  | 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'PENDING_APPROVAL'
  | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED'
  | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';

const STYLES: Record<StatusKind, { cls: string; icon: React.ComponentType<{ className?: string }>; key: string }> = {
  ACTIVE: { cls: 'bg-emerald-soft text-emerald-deep', icon: Check, key: 'common:status.active' },
  ARCHIVED: { cls: 'bg-muted text-muted-foreground', icon: Archive, key: 'common:status.archived' },
  DRAFT: { cls: 'bg-cream-warm text-cinnamon', icon: Clock, key: 'common:status.draft' },
  PENDING_APPROVAL: { cls: 'bg-cinnamon-soft text-cinnamon', icon: Clock, key: 'common:status.pending' },
  APPROVED: { cls: 'bg-emerald-soft text-emerald-deep', icon: Check, key: 'common:status.approved' },
  REJECTED: { cls: 'bg-destructive/10 text-destructive', icon: X, key: 'common:status.rejected' },
  EXPIRED: { cls: 'bg-muted text-muted-foreground', icon: AlertCircle, key: 'common:status.expired' },
  REVOKED: { cls: 'bg-destructive/10 text-destructive', icon: Lock, key: 'common:status.revoked' },
  SUSPENDED: { cls: 'bg-muted text-muted-foreground', icon: Lock, key: 'common:status.suspended' },
  TERMINATED: { cls: 'bg-muted text-muted-foreground', icon: Archive, key: 'common:status.terminated' },
  ON_LEAVE: { cls: 'bg-cinnamon-soft text-cinnamon', icon: Clock, key: 'common:status.on-leave' },
};

export default function StatusBadge({ status, className }: { status: StatusKind; className?: string }) {
  const { t } = useTranslation(['common']);
  const s = STYLES[status];
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium border-transparent', s.cls, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(s.key)}
    </Badge>
  );
}
```

### 3. SearchInput

```tsx
// src/components/common/SearchInput.tsx
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({ value, onChange, placeholder, debounceMs = 300 }: Props) {
  const { t } = useTranslation(['common']);
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
      <Input
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder ?? t('common:labels.search-placeholder')}
        className="pl-9 pr-9 h-10 bg-surface"
        aria-label={placeholder}
      />
      {local && (
        <button
          type="button"
          onClick={() => { setLocal(''); onChange(''); }}
          aria-label={t('common:actions.reset')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

### 4. Form schema — `src/features/units/unit.schema.ts`

```ts
import { z } from 'zod';

export const unitFormSchema = z.object({
  nameUz: z.string().min(3, 'common.errors.min-length').max(255),
  shortName: z.string().max(50).optional().or(z.literal('')),
  code: z.string().regex(/^[A-Z0-9\-]{2,20}$/i, 'dashboard.units.errors.invalid-code').optional().or(z.literal('')),
  type: z.enum(['DEPARTMENT', 'DIRECTORATE', 'DIVISION', 'DEPARTMENT_SUB', 'SECTION', 'OTHER']),
  parentUuid: z.string().uuid().nullable(),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;
```

### 5. UnitFormSheet (create + edit)

```tsx
// src/features/units/UnitFormSheet.tsx
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import type { Unit, UnitType } from '@/types/domain';
import { unitFormSchema, type UnitFormValues } from './unit.schema';
import { createUnit, updateUnit } from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** existing unit when editing, otherwise null */
  unit: Unit | null;
  /** parent options for the dropdown */
  allUnits: Unit[];
  /** prefilled parent for "create child" entry */
  defaultParentUuid?: string | null;
  onSaved: (u: Unit) => void;
}

// child type rules per TZ §3.3
const ALLOWED_CHILDREN: Record<UnitType, UnitType[]> = {
  DEPARTMENT: ['DIRECTORATE', 'DIVISION', 'OTHER'],
  DIRECTORATE: ['DIVISION', 'DEPARTMENT_SUB', 'SECTION', 'OTHER'],
  DIVISION: ['DEPARTMENT_SUB', 'SECTION', 'OTHER'],
  DEPARTMENT_SUB: ['SECTION', 'OTHER'],
  SECTION: ['OTHER'],
  OTHER: ['OTHER'],
};

export default function UnitFormSheet({ open, onOpenChange, unit, allUnits, defaultParentUuid, onSaved }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const actor = useAuthStore(s => s.user!.uuid);

  const isEdit = !!unit;
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      nameUz: unit?.nameUz ?? '',
      shortName: unit?.shortName ?? '',
      code: unit?.code ?? '',
      type: unit?.type ?? 'DIVISION',
      parentUuid: unit ? unit.parentUuid : (defaultParentUuid ?? null),
      description: unit?.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      nameUz: unit?.nameUz ?? '',
      shortName: unit?.shortName ?? '',
      code: unit?.code ?? '',
      type: unit?.type ?? 'DIVISION',
      parentUuid: unit ? unit.parentUuid : (defaultParentUuid ?? null),
      description: unit?.description ?? '',
    });
  }, [unit, defaultParentUuid, form]);

  const parentUuid = form.watch('parentUuid');
  const parent = useMemo(() => allUnits.find(u => u.uuid === parentUuid) ?? null, [allUnits, parentUuid]);
  const allowedTypes: UnitType[] = parent ? ALLOWED_CHILDREN[parent.type] : ['DEPARTMENT', 'OTHER'];

  async function onSubmit(values: UnitFormValues) {
    try {
      const payload = { ...values, shortName: values.shortName || undefined, code: values.code || (Math.random().toString(36).slice(2, 8).toUpperCase()), description: values.description || undefined };
      let saved: Unit;
      if (isEdit) saved = await updateUnit(unit!.uuid, payload, actor);
      else saved = await createUnit(payload, actor);
      onSaved(saved);
      toast.success(t(isEdit ? 'dashboard:units.toast.updated' : 'dashboard:units.toast.created'));
      onOpenChange(false);
    } catch {
      toast.error(t('common:errors.network'));
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(isEdit ? 'dashboard:units.form.edit-title' : 'dashboard:units.form.create-title')}
      description={t('dashboard:units.form.description')}
      footer={
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button form="unit-form" type="submit" className="flex-1 md:flex-none">
            {t('common:actions.save')}
          </Button>
        </div>
      }
    >
      <form id="unit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nameUz">{t('dashboard:units.form.name')} *</Label>
          <Input id="nameUz" {...form.register('nameUz')} className="h-11" />
          {form.formState.errors.nameUz && (
            <p className="text-xs text-destructive">{t(form.formState.errors.nameUz.message as string)}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shortName">{t('dashboard:units.form.short-name')}</Label>
            <Input id="shortName" {...form.register('shortName')} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">{t('dashboard:units.form.code')}</Label>
            <Input id="code" {...form.register('code')} placeholder={t('dashboard:units.form.code-placeholder')} className="h-11" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('dashboard:units.form.parent')}</Label>
          <Select value={parentUuid ?? '__root__'} onValueChange={v => form.setValue('parentUuid', v === '__root__' ? null : v)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">{t('dashboard:units.form.root')}</SelectItem>
              {allUnits.filter(u => u.uuid !== unit?.uuid).map(u => (
                <SelectItem key={u.uuid} value={u.uuid}>{u.nameUz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('dashboard:units.form.type')} *</Label>
          <Select value={form.watch('type')} onValueChange={v => form.setValue('type', v as UnitType)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allowedTypes.map(typ => (
                <SelectItem key={typ} value={typ}>{t(`common:unit-types.${typ}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('dashboard:units.form.type-hint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('dashboard:units.form.description-label')}</Label>
          <Textarea id="description" {...form.register('description')} rows={3} />
        </div>
      </form>
    </ResponsiveDialog>
  );
}
```

Install `@hookform/resolvers`:
```bash
npm install react-hook-form @hookform/resolvers
```

### 6. UnitsTreeDesktop

Recursive tree component with expand/collapse. Each row: chevron, type badge, name, employee count, kebab menu (edit / add child / archive).

```tsx
// src/features/units/UnitsTreeDesktop.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Unit, Employee } from '@/types/domain';

interface Props {
  units: Unit[];
  employees: Employee[];
  search: string;
  onEdit: (u: Unit) => void;
  onAddChild: (parent: Unit) => void;
  onArchive: (u: Unit) => void;
  onOpen: (u: Unit) => void;
}

function buildChildren(units: Unit[]) {
  const map = new Map<string | null, Unit[]>();
  for (const u of units) {
    const k = u.parentUuid;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(u);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz'));
  return map;
}

export default function UnitsTreeDesktop({ units, employees, search, onEdit, onAddChild, onArchive, onOpen }: Props) {
  const children = useMemo(() => buildChildren(units), [units]);
  const empCountByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees) map.set(e.primaryUnitUuid, (map.get(e.primaryUnitUuid) ?? 0) + 1);
    return map;
  }, [employees]);

  const matches = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    return new Set(units.filter(u => u.nameUz.toLowerCase().includes(q) || u.code.toLowerCase().includes(q)).map(u => u.uuid));
  }, [units, search]);

  const roots = children.get(null) ?? [];
  return (
    <div className="bg-surface border border-line rounded-lg">
      {roots.map(r => (
        <Node key={r.uuid} unit={r} depth={0} children={children} empCount={empCountByUnit} matches={matches} onEdit={onEdit} onAddChild={onAddChild} onArchive={onArchive} onOpen={onOpen} />
      ))}
    </div>
  );
}

function Node({
  unit, depth, children, empCount, matches, onEdit, onAddChild, onArchive, onOpen,
}: {
  unit: Unit;
  depth: number;
  children: Map<string | null, Unit[]>;
  empCount: Map<string, number>;
  matches: Set<string> | null;
  onEdit: (u: Unit) => void;
  onAddChild: (p: Unit) => void;
  onArchive: (u: Unit) => void;
  onOpen: (u: Unit) => void;
}) {
  const { t } = useTranslation(['dashboard', 'common']);
  const kids = children.get(unit.uuid) ?? [];
  const [open, setOpen] = useState(depth < 1);
  const isMatch = !matches || matches.has(unit.uuid);
  const hasMatchingDescendant = matches ? kids.some(k => k.path.includes(unit.uuid) && matches.has(k.uuid)) : false;
  if (matches && !isMatch && !hasMatchingDescendant) return null;

  return (
    <div>
      <div
        className={cn('flex items-center gap-2 py-2.5 px-3 border-b border-line/60 last:border-b-0 hover:bg-cream-warm transition-colors', isMatch && matches && 'bg-cinnamon-soft/40')}
        style={{ paddingLeft: 12 + depth * 20 }}
      >
        {kids.length > 0 ? (
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'collapse' : 'expand'}
            className="p-1 -ml-1 rounded hover:bg-cream-deep"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
          </button>
        ) : <span className="w-6" />}

        <button onClick={() => onOpen(unit)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-ink truncate">{unit.nameUz}</span>
            <Badge variant="outline" className="text-[10px] font-medium border-line bg-cream">
              {t(`common:unit-types.${unit.type}`)}
            </Badge>
            {unit.status === 'ARCHIVED' && (
              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-transparent">
                {t('common:status.archived')}
              </Badge>
            )}
          </div>
        </button>

        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {(empCount.get(unit.uuid) ?? 0)} {t('dashboard:units.tree.employees-suffix')}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onAddChild(unit)}>
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard:units.tree.add-child')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(unit)}>
              {t('common:actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onArchive(unit)} className="text-destructive focus:text-destructive">
              {t('common:actions.archive')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {open && kids.map(k => (
        <Node key={k.uuid} unit={k} depth={depth + 1} children={children} empCount={empCount} matches={matches} onEdit={onEdit} onAddChild={onAddChild} onArchive={onArchive} onOpen={onOpen} />
      ))}
    </div>
  );
}
```

### 7. UnitsAccordionMobile

```tsx
// src/features/units/UnitsAccordionMobile.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import type { Unit, Employee } from '@/types/domain';

interface Props {
  units: Unit[];
  employees: Employee[];
  onOpen: (u: Unit) => void;
  onAddChild: (p: Unit) => void;
}

export default function UnitsAccordionMobile({ units, employees, onOpen, onAddChild }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const roots = useMemo(() => units.filter(u => u.parentUuid === null), [units]);
  const childrenMap = useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const u of units) if (u.parentUuid) { (m.get(u.parentUuid) ?? m.set(u.parentUuid, []).get(u.parentUuid)!).push(u); }
    return m;
  }, [units]);
  const empCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of employees) m.set(e.primaryUnitUuid, (m.get(e.primaryUnitUuid) ?? 0) + 1);
    return m;
  }, [employees]);

  return (
    <Accordion type="multiple" className="space-y-2">
      {roots.map(root => (
        <AccordionItem key={root.uuid} value={root.uuid} className="bg-surface border border-line rounded-lg overflow-hidden data-[state=open]:shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:bg-cream-warm">
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{root.nameUz}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(`common:unit-types.${root.type}`)} · {empCount.get(root.uuid) ?? 0} {t('dashboard:units.tree.employees-suffix')}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-2 pt-0">
            {(childrenMap.get(root.uuid) ?? []).map(child => (
              <button
                key={child.uuid}
                onClick={() => onOpen(child)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md hover:bg-cream-warm text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{child.nameUz}</p>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] border-line bg-cream mr-1">
                      {t(`common:unit-types.${child.type}`)}
                    </Badge>
                    {empCount.get(child.uuid) ?? 0} {t('dashboard:units.tree.employees-suffix')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => onAddChild(root)} className="w-full justify-start text-emerald mt-2">
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard:units.tree.add-child')}
            </Button>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

> Mobile accordion supports two visible levels (root + first child). Tapping a child opens the details sheet which lets the user drill deeper.

### 8. UnitDetailsSheet

A `Sheet` from the right (desktop) / bottom (mobile) that shows: full name, code, type, status, head employee, child count, employee count, sub-units list, actions (edit, archive, add child). Tapping a sub-unit re-opens the sheet for that one.

```tsx
// src/features/units/UnitDetailsSheet.tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Archive, ChevronRight } from 'lucide-react';
import type { Unit, Employee } from '@/types/domain';
import { listEmployees } from '@/lib/mock-backend';

interface Props {
  unit: Unit | null;
  allUnits: Unit[];
  onClose: () => void;
  onEdit: (u: Unit) => void;
  onAddChild: (p: Unit) => void;
  onArchive: (u: Unit) => void;
}

export default function UnitDetailsSheet({ unit, allUnits, onClose, onEdit, onAddChild, onArchive }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [empCount, setEmpCount] = useState<number | null>(null);

  const children = useMemo(() => unit ? allUnits.filter(u => u.parentUuid === unit.uuid) : [], [allUnits, unit]);

  useEffect(() => {
    if (!unit) return;
    (async () => {
      const emps = await listEmployees({ unitUuid: unit.uuid });
      setEmpCount(emps.length);
    })();
  }, [unit]);

  return (
    <Sheet open={!!unit} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {unit && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">{unit.nameUz}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-line bg-cream">{t(`common:unit-types.${unit.type}`)}</Badge>
                <span className="text-xs text-muted-foreground">{unit.code}</span>
              </div>
            </SheetHeader>
            <Separator className="my-4" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{t('dashboard:units.details.employees')}</dt><dd className="font-medium">{empCount ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{t('dashboard:units.details.children')}</dt><dd className="font-medium">{children.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{t('dashboard:units.details.head')}</dt><dd className="font-medium">{unit.headEmployeeUuid ?? t('dashboard:units.details.no-head')}</dd></div>
            </dl>

            {children.length > 0 && (
              <>
                <Separator className="my-4" />
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">{t('dashboard:units.details.children')}</p>
                <ul className="space-y-1">
                  {children.map(c => (
                    <li key={c.uuid}>
                      <button className="w-full text-left flex items-center justify-between py-2 px-3 rounded-md hover:bg-cream-warm">
                        <span className="text-sm">{c.nameUz}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={() => onEdit(unit)} variant="outline"><Pencil className="h-4 w-4 mr-2" />{t('common:actions.edit')}</Button>
              <Button onClick={() => onAddChild(unit)} variant="outline"><Plus className="h-4 w-4 mr-2" />{t('dashboard:units.tree.add-child')}</Button>
              <Button onClick={() => onArchive(unit)} variant="ghost" className="text-destructive hover:text-destructive"><Archive className="h-4 w-4 mr-2" />{t('common:actions.archive')}</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### 9. UnitsPage — composition

```tsx
// src/features/units/UnitsPage.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import LoadingState from '@/components/common/LoadingState';

import { useMediaQuery } from '@/lib/use-media-query';
import UnitsTreeDesktop from './UnitsTreeDesktop';
import UnitsAccordionMobile from './UnitsAccordionMobile';
import UnitFormSheet from './UnitFormSheet';
import UnitDetailsSheet from './UnitDetailsSheet';

import { listUnits, listEmployees, archiveUnit } from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Unit, Employee } from '@/types/domain';

export default function UnitsPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const actor = useAuthStore(s => s.user!.uuid);

  const [units, setUnits] = useState<Unit[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [defaultParent, setDefaultParent] = useState<string | null>(null);
  const [detailsUnit, setDetailsUnit] = useState<Unit | null>(null);

  async function reload() {
    const [u, e] = await Promise.all([listUnits(), listEmployees()]);
    setUnits(u);
    setEmployees(e);
  }

  useEffect(() => { reload(); }, []);

  function startCreate(parentUuid: string | null = null) {
    setEditingUnit(null);
    setDefaultParent(parentUuid);
    setFormOpen(true);
  }

  function startEdit(u: Unit) {
    setEditingUnit(u);
    setDefaultParent(null);
    setFormOpen(true);
  }

  async function handleArchive(u: Unit) {
    const empsInUnit = employees.filter(e => e.primaryUnitUuid === u.uuid && e.status !== 'TERMINATED');
    if (empsInUnit.length > 0) {
      toast.error(t('dashboard:units.errors.has-employees', { count: empsInUnit.length }));
      return;
    }
    try {
      await archiveUnit(u.uuid, actor);
      toast.success(t('dashboard:units.toast.archived'));
      await reload();
    } catch {
      toast.error(t('common:errors.network'));
    }
  }

  const filtered = (units ?? []).filter(u => filterStatus === 'ALL' ? true : u.status === filterStatus);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('dashboard:units.page-title')}
        subtitle={t('dashboard:units.page-subtitle')}
        actions={
          <Button onClick={() => startCreate(null)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard:units.tree.add-root')}
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('dashboard:units.search-placeholder')} />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="md:w-44 h-10">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
            <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('common:status.archived')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!units && <LoadingState rows={6} />}
      {units && (isDesktop ? (
        <UnitsTreeDesktop
          units={filtered}
          employees={employees}
          search={search}
          onEdit={startEdit}
          onAddChild={p => startCreate(p.uuid)}
          onArchive={handleArchive}
          onOpen={setDetailsUnit}
        />
      ) : (
        <UnitsAccordionMobile
          units={filtered}
          employees={employees}
          onOpen={setDetailsUnit}
          onAddChild={p => startCreate(p.uuid)}
        />
      ))}

      <UnitFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        unit={editingUnit}
        allUnits={units ?? []}
        defaultParentUuid={defaultParent}
        onSaved={() => reload()}
      />

      <UnitDetailsSheet
        unit={detailsUnit}
        allUnits={units ?? []}
        onClose={() => setDetailsUnit(null)}
        onEdit={u => { setDetailsUnit(null); startEdit(u); }}
        onAddChild={p => { setDetailsUnit(null); startCreate(p.uuid); }}
        onArchive={u => { setDetailsUnit(null); handleArchive(u); }}
      />
    </div>
  );
}
```

### 10. Mock-backend additions

In `src/lib/mock-backend/index.ts`, flesh out:

```ts
export async function updateUnit(uuid: string, patch: Partial<Unit>, actorUuid: string): Promise<Unit> {
  await simulatedDelay();
  maybeFail();
  const units = readTable<Unit>(Tables.units, []);
  const idx = units.findIndex(u => u.uuid === uuid);
  if (idx === -1) throw new Error('not found');
  const before = units[idx];
  // Disallow circular: new parent cannot be self or descendant
  if (patch.parentUuid && (patch.parentUuid === uuid || units.find(u => u.uuid === patch.parentUuid)?.path.includes(uuid))) {
    throw new Error('cycle');
  }
  // Validate name unique within parent
  const newName = patch.nameUz ?? before.nameUz;
  const newParent = patch.parentUuid !== undefined ? patch.parentUuid : before.parentUuid;
  const sibling = units.find(u => u.uuid !== uuid && u.parentUuid === newParent && u.nameUz.toLowerCase() === newName.toLowerCase());
  if (sibling) throw new Error('duplicate');

  const updated: Unit = { ...before, ...patch, updatedAt: new Date().toISOString(), updatedBy: actorUuid };
  // Recompute path if parent changed
  if (patch.parentUuid !== undefined) {
    const parent = patch.parentUuid ? units.find(u => u.uuid === patch.parentUuid) : null;
    updated.level = parent ? parent.level + 1 : 0;
    updated.path = parent ? `${parent.path}${uuid}/` : `/${uuid}/`;
    // Recursively update descendant paths
    for (const d of units.filter(u => u.path.includes(`/${uuid}/`) && u.uuid !== uuid)) {
      const newPathPrefix = updated.path;
      d.path = d.path.replace(new RegExp(`.*/${uuid}/`), newPathPrefix);
      d.level = d.path.split('/').filter(Boolean).length - 1;
    }
  }
  units[idx] = updated;
  writeTable(Tables.units, units);
  await appendAudit({ action: 'UPDATE', resourceType: 'unit', resourceUuid: uuid, resourceLabel: updated.nameUz, actorUuid });
  return updated;
}

export async function archiveUnit(uuid: string, actorUuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const units = readTable<Unit>(Tables.units, []);
  const idx = units.findIndex(u => u.uuid === uuid);
  if (idx === -1) return;
  units[idx].status = 'ARCHIVED';
  units[idx].updatedAt = new Date().toISOString();
  units[idx].updatedBy = actorUuid;
  writeTable(Tables.units, units);
  await appendAudit({ action: 'ARCHIVE', resourceType: 'unit', resourceUuid: uuid, resourceLabel: units[idx].nameUz, actorUuid });
}
```

`createUnit` should already exist from step 06. Add error messages localised through `error-codes` style — throw `Error` with codes the UI maps to translated strings.

### 11. Extend `uz.json`

Add `dashboard.units.*`:
```json
"units": {
  "page-title": "Tarkibiy tuzilma",
  "page-subtitle": "Tashkilot iyerarxiyasini boshqaring",
  "search-placeholder": "Bo'linma nomi yoki kodi bo'yicha qidirish...",
  "tree": {
    "add-root": "+ Yangi bo'linma",
    "add-child": "Bola bo'linma qo'shish",
    "employees-suffix": "xodim"
  },
  "form": {
    "create-title": "Yangi bo'linma yaratish",
    "edit-title": "Bo'linmani tahrirlash",
    "description": "Bo'linmaning asosiy ma'lumotlarini kiriting.",
    "name": "Nomi",
    "short-name": "Qisqartma",
    "code": "Ichki kod",
    "code-placeholder": "DEP-IT-01 (avtomatik yaratiladi)",
    "parent": "Ota-bo'linma",
    "root": "Ildiz (yo'q)",
    "type": "Turi",
    "type-hint": "Ota-bo'linma turidan kelib chiqib bola turlar cheklanadi",
    "description-label": "Tavsif"
  },
  "details": {
    "employees": "Xodimlar soni",
    "children": "Bola bo'linmalar",
    "head": "Rahbar",
    "no-head": "Belgilanmagan"
  },
  "toast": {
    "created": "Bo'linma yaratildi",
    "updated": "Bo'linma yangilandi",
    "archived": "Bo'linma arxivlandi"
  },
  "errors": {
    "invalid-code": "Kod faqat harf, raqam va tire bo'lishi mumkin (2–20 belgi)",
    "duplicate-name": "Shu nomdagi bo'linma allaqachon mavjud",
    "has-employees": "Bu bo'linmada {{count}} ta xodim ishlaydi. Avval ularni boshqa bo'linmaga ko'chiring.",
    "max-depth": "Maksimal 7 daraja iyerarxiya joiz",
    "cycle": "Bo'linma o'z avlodiga ota bo'la olmaydi"
  }
}
```

### 12. Update router

```tsx
<Route path="/units" element={<Protected><UnitsPage /></Protected>} />
```

## Acceptance checks

- [ ] **Desktop**: tree renders recursively with expand/collapse chevrons; clicking the row opens details; kebab menu offers Edit / Add child / Archive
- [ ] **Mobile (360px)**: accordion with root departments collapsed by default; tap → expands and lists direct children; tap a child → details sheet from bottom (full height)
- [ ] Create form: empty validation (name required), parent dropdown shows all units, child-type dropdown reflects parent-allowed list (DEPARTMENT under nothing, DIRECTORATE under DEPARTMENT, etc.)
- [ ] Trying to archive a unit with employees → red toast "Bu bo'linmada N ta xodim ishlaydi..."
- [ ] Trying to set a unit's parent to one of its own descendants → red toast "Bo'linma o'z avlodiga ota bo'la olmaydi"
- [ ] Creating a duplicate name within the same parent → red toast "Shu nomdagi bo'linma allaqachon mavjud"
- [ ] Search input debounces 300ms; matching nodes highlight (`bg-cinnamon-soft/40`); non-matching collapsed branches still render their matching descendants
- [ ] After every mutation, the tree reloads — counts and rows reflect the change
- [ ] Audit log has new entries: CREATE / UPDATE / ARCHIVE for each operation
- [ ] All copy via `t()` — no hardcoded strings in JSX
- [ ] 3% random network failure surfaces toast and leaves data unchanged
- [ ] Tested at 360 / 768 / 1024 / 1280px

## Notes

- **Drag-and-drop move** is out of scope per master §17. The "Move" functionality is exposed via re-parenting in the Edit form (changing the Parent dropdown). Path recompute happens server-side (well, mock-backend).
- **Max depth check**: implement in `createUnit`/`updateUnit` by counting `path` segments. Throw with code `max-depth`.
- **Search match logic**: highlight the matched node, render ancestors collapsed but make sure matching descendants render even if the parent doesn't match.
- For very deep trees, the tree component's indent stops at `~12 levels` visually (capped) — but data depth limit is 7 per the TZ.

## What "done" looks like

The HR_ADMIN can build out the entire org structure end-to-end. Each operation reflects immediately in counts and the audit log. The mobile accordion feels comfortable on a phone, the desktop tree handles dozens of nodes without lag.
