# STEP 11 — Flow 3: Employee profile + Assignment transfer + Timeline

## Prerequisite
Master prompt loaded. Steps 01–10 complete.

## Goal
Build the employee profile (`/employees/:uuid`) — a tabbed page with Info, Bo'linmalar (assignments), ERI (certificates summary), and Tarix (audit). Then build the transfer flow (`/employees/:uuid/transfer`) and the vertical assignment timeline. Together these cover TZ §5 (Flow 3).

## Deliverables
- `dashboard/src/features/employees/profile/EmployeeProfilePage.tsx`
- `dashboard/src/features/employees/profile/ProfileInfoTab.tsx`
- `dashboard/src/features/employees/profile/ProfileUnitsTab.tsx`
- `dashboard/src/features/employees/profile/ProfileCertificatesTab.tsx`
- `dashboard/src/features/employees/profile/ProfileHistoryTab.tsx`
- `dashboard/src/features/employees/assignments/EmployeeTransferPage.tsx`
- `dashboard/src/features/employees/assignments/TransferForm.tsx`
- `dashboard/src/features/employees/assignments/AssignmentTimeline.tsx`
- Mock-backend addition: `transferEmployee()` (per TZ §5.4)
- Extend `uz.json` with `dashboard.employees.profile.*` and `dashboard.employees.transfer.*`
- Replace `/employees/:uuid` and `/employees/:uuid/transfer` placeholders

## Tasks

### 1. EmployeeProfilePage

```tsx
// EmployeeProfilePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, KeySquare, Pencil, Power, UserPlus, History } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';

import ProfileInfoTab from './ProfileInfoTab';
import ProfileUnitsTab from './ProfileUnitsTab';
import ProfileCertificatesTab from './ProfileCertificatesTab';
import ProfileHistoryTab from './ProfileHistoryTab';

import { getEmployee } from '@/lib/mock-backend';
import type { Employee } from '@/types/domain';

function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function EmployeeProfilePage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<Employee | null | undefined>(undefined);

  useEffect(() => {
    if (!uuid) return;
    (async () => setEmp(await getEmployee(uuid)))();
  }, [uuid]);

  if (emp === undefined) return <LoadingState rows={6} />;
  if (emp === null) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t('dashboard:employees.profile.not-found')}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/employees">{t('common:actions.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Back link (mobile-prominent) */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
        <Link to="/employees"><ArrowLeft className="h-4 w-4 mr-1" />{t('dashboard:employees.profile.back')}</Link>
      </Button>

      {/* Identity hero — mobile-stacked */}
      <div className="bg-cream-deep border border-line rounded-xl p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 shrink-0">
            <AvatarFallback className="bg-emerald text-cream text-xl font-bold">
              {initials(emp.fullNameGenerated)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
              {emp.fullNameGenerated}
            </h1>
            <p className="mt-1 text-sm text-body">
              {emp.corporateEmail} · {emp.mobilePhone}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={emp.status} />
              <span className="text-xs text-muted-foreground">
                {t('dashboard:employees.profile.pinfl-label')}:
                <span className="ml-1 font-mono tabular-nums text-ink">
                  {emp.pinfl.replace(/(.{4})/g, '$1 ').trim()}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
            <Button onClick={() => navigate(`/employees/${emp.uuid}/transfer`)} variant="outline" className="md:w-auto">
              <UserPlus className="h-4 w-4 mr-2" /> {t('dashboard:employees.profile.transfer')}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="info"><Pencil className="h-4 w-4 mr-2" />{t('dashboard:employees.profile.tabs.info')}</TabsTrigger>
          <TabsTrigger value="units"><UserPlus className="h-4 w-4 mr-2" />{t('dashboard:employees.profile.tabs.units')}</TabsTrigger>
          <TabsTrigger value="certs"><KeySquare className="h-4 w-4 mr-2" />{t('dashboard:employees.profile.tabs.certs')}</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />{t('dashboard:employees.profile.tabs.history')}</TabsTrigger>
        </TabsList>
        <TabsContent value="info"><ProfileInfoTab employee={emp} onChanged={(e: Employee) => setEmp(e)} /></TabsContent>
        <TabsContent value="units"><ProfileUnitsTab employee={emp} /></TabsContent>
        <TabsContent value="certs"><ProfileCertificatesTab employee={emp} /></TabsContent>
        <TabsContent value="history"><ProfileHistoryTab employee={emp} /></TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2. ProfileInfoTab — read-only display + "Edit" button (opens `UpdateEmployeeSheet`)

Show all employee fields as a description list. Edit button opens a `ResponsiveDialog` with a form mirroring step-1+step-2 of the wizard (excluding PINFL — that's locked after creation). Saving calls `updateEmployee`.

```tsx
// Sketch
- Field list: full name, PINFL, gender, birth date, passport, work phone, ext, mobile, corp email, personal email, hire date, employment type, status
- Two action buttons in the tab header: "Edit" (opens the edit sheet) and "Terminate" (red, opens a confirmation dialog)
- Mobile: each field is its own row; desktop: 2-column grid
```

`terminateEmployee` cascades to revoke all certs (handled in mock-backend).

### 3. ProfileUnitsTab + AssignmentTimeline

Vertical timeline of all assignments for the employee. Most recent on top. Each entry:
- Period: `01.07.2024 – hozirgacha` (or close date if ended)
- Unit name + chevron to the unit's details
- Position name
- `isPrimary` chip + assignment type
- Workload % bar

```tsx
// ProfileUnitsTab.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AssignmentTimeline from '../assignments/AssignmentTimeline';
import { listAssignments, listUnits, listPositions } from '@/lib/mock-backend';
import type { Assignment, Employee, Position, Unit } from '@/types/domain';

interface Props { employee: Employee; }

export default function ProfileUnitsTab({ employee }: Props) {
  const { t } = useTranslation(['dashboard']);
  const [rows, setRows] = useState<Assignment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    (async () => {
      const [a, u, p] = await Promise.all([listAssignments(employee.uuid), listUnits(), listPositions()]);
      setRows(a.sort((x, y) => y.startDate.localeCompare(x.startDate)));
      setUnits(u);
      setPositions(p);
    })();
  }, [employee.uuid]);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">{t('dashboard:employees.profile.units.heading')}</h3>
        <Button asChild variant="outline" size="sm">
          <Link to={`/employees/${employee.uuid}/transfer`}>
            <Plus className="h-4 w-4 mr-1" />{t('dashboard:employees.profile.units.add')}
          </Link>
        </Button>
      </div>
      <AssignmentTimeline assignments={rows} units={units} positions={positions} />
    </div>
  );
}
```

### 4. AssignmentTimeline component

```tsx
// AssignmentTimeline.tsx
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/i18n/uz-locale';
import type { Assignment, Position, Unit } from '@/types/domain';

interface Props {
  assignments: Assignment[];
  units: Unit[];
  positions: Position[];
}

export default function AssignmentTimeline({ assignments, units, positions }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const unitName = (u: string) => units.find(x => x.uuid === u)?.nameUz ?? '—';
  const posName = (p: string) => positions.find(x => x.id === p)?.nameUz ?? p;

  if (assignments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t('dashboard:employees.profile.units.empty')}
      </p>
    );
  }

  return (
    <ol className="relative border-l-2 border-line ml-2 space-y-5 pl-6">
      {assignments.map(a => (
        <li key={a.uuid} className="relative">
          <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full ${a.endDate ? 'bg-muted-foreground' : 'bg-emerald ring-4 ring-emerald-soft'}`} />
          <div className="bg-surface border border-line rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDate(a.startDate)} – {a.endDate ? formatDate(a.endDate) : t('dashboard:employees.profile.units.current')}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {a.isPrimary && <Badge className="bg-emerald-soft text-emerald-deep border-transparent">{t('dashboard:employees.profile.units.primary')}</Badge>}
                <Badge variant="outline" className="border-line bg-cream">{t(`dashboard:employees.profile.units.types.${a.type}`)}</Badge>
              </div>
            </div>
            <p className="text-sm font-semibold text-ink">{unitName(a.unitUuid)}</p>
            <p className="text-sm text-body">{posName(a.positionId)}</p>
            {a.workloadPercent !== 100 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('dashboard:employees.profile.units.workload', { pct: a.workloadPercent })}
                </p>
                <Progress value={a.workloadPercent} className="h-1.5" />
              </div>
            )}
            {a.reason && <p className="mt-2 text-xs text-muted-foreground italic">{a.reason}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

### 5. EmployeeTransferPage + TransferForm

```tsx
// EmployeeTransferPage.tsx (sketch)
- Mobile: full-screen route with top bar `X` + title; sticky bottom CTA
- Desktop: page rendered inside AppShell with PageHeader + form card
- Form fields per TZ §5.4:
  - newUnitUuid (Combobox, required; show "current: <unit>" hint)
  - newPositionId (Combobox filtered by unit type)
  - startDate (default today, can be future)
  - workloadPercent (slider + numeric input)
  - type: RadioGroup of PRIMARY / COMBINATION / ACTING / TEMPORARY
  - reason (textarea, optional)
  - closeOldAssignment: checkbox, default true; auto-disabled when type=COMBINATION
- Validation:
  - Sum of active workloadPercent across all assignments ≤ 150% (compute client-side via listAssignments())
  - If type=PRIMARY and an existing primary exists, prompt: "Existing primary will be closed automatically."
- On submit: call transferEmployee() and navigate back to profile
```

Mobile chrome similar to wizard: no AppShell, custom top bar.

### 6. Mock-backend `transferEmployee`

```ts
export async function transferEmployee(input: {
  employeeUuid: string;
  newUnitUuid: string;
  newPositionId: string;
  startDate: string;
  workloadPercent: number;
  type: Assignment['type'];
  closeOldAssignment: boolean;
  reason?: string;
}, actorUuid: string): Promise<Assignment> {
  await simulatedDelay();
  maybeFail();
  const assignments = readTable<Assignment>(Tables.assignments, []);
  const employees = readTable<Employee>(Tables.employees, []);
  const empIdx = employees.findIndex(e => e.uuid === input.employeeUuid);
  if (empIdx === -1) throw new Error('not-found');

  const active = assignments.filter(a => a.employeeUuid === input.employeeUuid && !a.endDate);

  // Workload guard: 150%
  const otherWorkload = active.reduce((s, a) => s + a.workloadPercent, 0);
  if (input.closeOldAssignment) {
    // closing replaces, so excluded
  }
  const effective = (input.closeOldAssignment ? 0 : otherWorkload) + input.workloadPercent;
  if (effective > 150) {
    throw Object.assign(new Error('workload-exceeded'), { code: 'workload-exceeded' });
  }

  // Close existing assignments
  if (input.closeOldAssignment) {
    for (const a of active) {
      a.endDate = new Date(new Date(input.startDate).getTime() - 86_400_000).toISOString().slice(0, 10);
    }
  }
  if (input.type === 'PRIMARY') {
    // Demote existing primary if any (still open)
    for (const a of assignments.filter(a => a.employeeUuid === input.employeeUuid && a.isPrimary && !a.endDate)) {
      a.isPrimary = false;
    }
  }

  const newAssignment: Assignment = {
    uuid: uuid(),
    employeeUuid: input.employeeUuid,
    unitUuid: input.newUnitUuid,
    positionId: input.newPositionId,
    isPrimary: input.type === 'PRIMARY',
    startDate: input.startDate,
    workloadPercent: input.workloadPercent,
    type: input.type,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  };
  assignments.push(newAssignment);

  // Update employee.primaryUnitUuid / positionId when primary
  if (input.type === 'PRIMARY') {
    employees[empIdx].primaryUnitUuid = input.newUnitUuid;
    employees[empIdx].positionId = input.newPositionId;
    employees[empIdx].updatedAt = new Date().toISOString();
  }

  writeTable(Tables.assignments, assignments);
  writeTable(Tables.employees, employees);
  await appendAudit({
    action: 'UNIT_TRANSFER',
    resourceType: 'assignment',
    resourceUuid: newAssignment.uuid,
    resourceLabel: employees[empIdx].fullNameGenerated,
    actorUuid,
    changes: { unit: { from: '...', to: input.newUnitUuid }, position: { from: '...', to: input.newPositionId } },
  });
  return newAssignment;
}
```

### 7. ProfileCertificatesTab

Lightweight read view: list of the employee's certificates with status badges, validity window, "Yangi yuklash" CTA → `/certificates/upload?employee=<uuid>`. Full cert UI lives in step 12.

### 8. ProfileHistoryTab

Filtered audit log scoped to this employee (`listAudit({ actorUuid: employee.uuid })` plus filter by `resourceUuid === employee.uuid`). Vertical list, mobile-friendly.

### 9. Update router

```tsx
<Route path="/employees/:uuid" element={<Protected><EmployeeProfilePage /></Protected>} />
<Route path="/employees/:uuid/transfer" element={<RequireAuth><EmployeeTransferPage /></RequireAuth>} />
```

> Transfer page skips `<AppShell>` for the same reason as the wizard.

### 10. Extend `uz.json`

```json
"employees": {
  "profile": {
    "not-found": "Xodim topilmadi",
    "back": "Xodimlar ro'yxati",
    "pinfl-label": "JSHShIR",
    "transfer": "Boshqa bo'linmaga ko'chirish",
    "tabs": {
      "info": "Ma'lumotlar",
      "units": "Bo'linmalar",
      "certs": "ERI kalitlari",
      "history": "Tarix"
    },
    "units": {
      "heading": "Biriktirmalar tarixi",
      "add": "Yangi biriktirma",
      "empty": "Hozircha biriktirmalar yo'q",
      "current": "hozirgacha",
      "primary": "Asosiy",
      "workload": "{{pct}}% ish yuki",
      "types": {
        "PRIMARY": "Asosiy",
        "COMBINATION": "Kombinatsiya",
        "ACTING": "i.o.",
        "TEMPORARY": "Vaqtinchalik"
      }
    }
  },
  "transfer": {
    "title": "Bo'linmaga ko'chirish",
    "current-label": "Joriy bo'linma: {{name}}",
    "new-unit": "Yangi bo'linma",
    "new-position": "Yangi lavozim",
    "start-date": "Ko'chirish sanasi",
    "workload": "Ish yuki ({{pct}}%)",
    "type": "Turi",
    "reason": "Sabab yoki buyruq raqami",
    "close-old": "Eski biriktirmani yopish",
    "combine-note": "Kombinatsiya — eski biriktirma davom etadi",
    "submit": "Ko'chirishni saqlash",
    "errors": {
      "workload-exceeded": "Jami ish yuki 150% dan oshib ketadi. Eski biriktirmani yoping yoki foizni kamaytiring."
    },
    "success": "{{name}} muvaffaqiyatli ko'chirildi"
  }
}
```

## Acceptance checks

- [ ] `/employees/:uuid` renders identity hero + 4 tabs
- [ ] **Mobile**: identity hero stacks; transfer CTA below the avatar; tabs scroll horizontally
- [ ] **Desktop**: identity hero is a horizontal row; tabs inline
- [ ] "Edit" in Info tab opens the responsive dialog/sheet with editable fields (PINFL locked)
- [ ] "Terminate" in Info tab opens an `<AlertDialog>` confirmation. On confirm: employee.status=TERMINATED, all employee's certs become REVOKED (reason=EMPLOYEE_TERMINATED). Audit entry written.
- [ ] Units tab shows a vertical timeline; current assignment has filled emerald dot, past has muted dot
- [ ] Transferring an employee creates a new assignment, optionally closes the old one, audit entry written
- [ ] Trying to transfer to bring total workload over 150% → red toast
- [ ] Trying to make a second PRIMARY assignment → existing PRIMARY is demoted automatically (toast notes it)
- [ ] Certs tab shows status badges per cert; "Yangi yuklash" routes to upload (step 12)
- [ ] History tab shows recent actions on this employee
- [ ] All copy via `t()`. Tested at 360 / 768 / 1024 / 1280px.

## Notes

- The terminate cascade (auto-revoke certs) is critical per TZ §6.6 — implement in `terminateEmployee()` if not done in step 06.
- For the transfer page, **mobile route doesn't include `<AppShell>`** (like the wizard) — full-screen experience.
- Audit changes object: include `unitFrom` / `unitTo` and `positionFrom` / `positionTo` so the audit log view in step 13 can render meaningful diffs.

## What "done" looks like

Click an employee in the list → see their full profile. Tap "Boshqa bo'linmaga ko'chirish" → fill the transfer form on the phone → see the new assignment immediately in the timeline.
