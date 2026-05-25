# STEP 10 — Flow 2 part B: Xodim yaratish Wizard (mobile-first, full-screen on mobile)

## Prerequisite
Master prompt loaded. Steps 01–09 complete.

## Goal
Build `/employees/new` — the 4-step employee creation wizard described in TZ §4.4. **Full-screen route on mobile, modal-ish on desktop.** All four steps follow the same skeleton: form area scrolls; primary CTA sticks to the bottom on mobile so it's always above the keyboard. Final review screen lets the HR_ADMIN see everything before submitting; on submit, the mock-backend creates `Employee + User + Assignment + Audit` atomically.

## Deliverables
- `dashboard/src/features/employees/wizard/EmployeeWizardPage.tsx` — the route, mobile-first
- `dashboard/src/features/employees/wizard/WizardStepper.tsx`
- `dashboard/src/features/employees/wizard/Step1Personal.tsx`
- `dashboard/src/features/employees/wizard/Step2Contact.tsx`
- `dashboard/src/features/employees/wizard/Step3Work.tsx`
- `dashboard/src/features/employees/wizard/Step4Login.tsx`
- `dashboard/src/features/employees/wizard/ReviewScreen.tsx`
- `dashboard/src/features/employees/wizard/employee.schema.ts` — zod schemas per step
- `dashboard/src/features/employees/wizard/wizard-store.ts` — Zustand for in-flight wizard state
- Mock-backend additions: `createEmployeeFull()` if not yet implemented
- Extend `uz.json` with `dashboard.employees.wizard.*`
- Replace `/employees/new` placeholder with `<EmployeeWizardPage />`

## Tasks

### 1. Wizard store

```ts
// src/features/employees/wizard/wizard-store.ts
import { create } from 'zustand';
import type { Gender, EmploymentType, Role } from '@/types/domain';

export interface WizardData {
  step1: {
    lastName: string;
    firstName: string;
    middleName: string;
    gender: Gender;
    birthDate: string;        // ISO
    pinfl: string;
    passportSeries: string;
  };
  step2: {
    workPhone: string;
    internalExtension: string;
    mobilePhone: string;
    corporateEmail: string;
    personalEmail: string;
  };
  step3: {
    primaryUnitUuid: string;
    positionId: string;
    employmentType: EmploymentType;
    hireDate: string;
    role: Role;
  };
  step4: {
    login: string;              // derived from corporateEmail by default
    password: string;           // generated
    notifySms: boolean;
    notifyEmail: boolean;
  };
}

const empty: WizardData = {
  step1: { lastName: '', firstName: '', middleName: '', gender: 'M', birthDate: '', pinfl: '', passportSeries: '' },
  step2: { workPhone: '', internalExtension: '', mobilePhone: '', corporateEmail: '', personalEmail: '' },
  step3: { primaryUnitUuid: '', positionId: '', employmentType: 'FULL_TIME', hireDate: new Date().toISOString().slice(0, 10), role: 'ROLE_EMPLOYEE' },
  step4: { login: '', password: '', notifySms: true, notifyEmail: true },
};

interface State {
  data: WizardData;
  setStep1: (v: Partial<WizardData['step1']>) => void;
  setStep2: (v: Partial<WizardData['step2']>) => void;
  setStep3: (v: Partial<WizardData['step3']>) => void;
  setStep4: (v: Partial<WizardData['step4']>) => void;
  reset: () => void;
}

export const useWizardStore = create<State>(set => ({
  data: empty,
  setStep1: v => set(s => ({ data: { ...s.data, step1: { ...s.data.step1, ...v } } })),
  setStep2: v => set(s => ({ data: { ...s.data, step2: { ...s.data.step2, ...v } } })),
  setStep3: v => set(s => ({ data: { ...s.data, step3: { ...s.data.step3, ...v } } })),
  setStep4: v => set(s => ({ data: { ...s.data, step4: { ...s.data.step4, ...v } } })),
  reset: () => set({ data: empty }),
}));
```

### 2. Step schemas — `employee.schema.ts`

```ts
import { z } from 'zod';

export const step1Schema = z.object({
  lastName: z.string().min(1, 'common:errors.required').max(100),
  firstName: z.string().min(1, 'common:errors.required').max(100),
  middleName: z.string().max(100).optional().or(z.literal('')),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().optional().or(z.literal('')).refine(v => {
    if (!v) return true;
    const age = (Date.now() - new Date(v).getTime()) / 31557600000;
    return age >= 18;
  }, { message: 'dashboard:employees.wizard.errors.age-18' }),
  pinfl: z.string().regex(/^[1-6]\d{13}$/, 'common:errors.invalid-pinfl'),
  passportSeries: z.string().optional().or(z.literal('')),
});

export const step2Schema = z.object({
  workPhone: z.string().optional().or(z.literal('')),
  internalExtension: z.string().optional().or(z.literal('')),
  mobilePhone: z.string().regex(/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, 'common:errors.invalid-phone'),
  corporateEmail: z.string().email('common:errors.invalid-email').regex(/@devon\.uz$/i, 'common:errors.email-must-be-corporate'),
  personalEmail: z.string().email('common:errors.invalid-email').optional().or(z.literal('')),
});

export const step3Schema = z.object({
  primaryUnitUuid: z.string().uuid('common:errors.required'),
  positionId: z.string().min(1, 'common:errors.required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  hireDate: z.string().min(1, 'common:errors.required'),
  role: z.enum(['ROLE_EMPLOYEE', 'ROLE_UNIT_HEAD', 'ROLE_HR_OPERATOR', 'ROLE_AUDITOR']),
});

export const step4Schema = z.object({
  login: z.string().min(3),
  password: z.string()
    .min(8, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[A-Z]/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[a-z]/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/\d/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[^A-Za-z0-9]/, 'dashboard:employees.wizard.errors.password-weak'),
  notifySms: z.boolean(),
  notifyEmail: z.boolean(),
});
```

### 3. WizardStepper (mobile: horizontal pill scroll; desktop: numbered stepper)

```tsx
// src/features/employees/wizard/WizardStepper.tsx
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step { key: string; titleKey: string; }
const steps: Step[] = [
  { key: '1', titleKey: 'dashboard:employees.wizard.step-1.title' },
  { key: '2', titleKey: 'dashboard:employees.wizard.step-2.title' },
  { key: '3', titleKey: 'dashboard:employees.wizard.step-3.title' },
  { key: '4', titleKey: 'dashboard:employees.wizard.step-4.title' },
  { key: 'r', titleKey: 'dashboard:employees.wizard.review.title' },
];

export default function WizardStepper({ current }: { current: number }) {
  const { t } = useTranslation(['dashboard']);
  return (
    <nav aria-label="Steps" className="border-b border-line">
      {/* Mobile: horizontal scroll of compact pills */}
      <ol className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-3 -mx-4 px-4 no-scrollbar">
        {steps.map((s, i) => (
          <li key={s.key} className={cn(
            'shrink-0 flex items-center gap-2 px-3 h-8 rounded-full text-xs font-medium border',
            i < current && 'bg-emerald-soft border-emerald/30 text-emerald-deep',
            i === current && 'bg-emerald text-cream border-emerald',
            i > current && 'bg-cream-deep border-line text-muted-foreground'
          )}>
            <span className="w-5 h-5 rounded-full bg-cream/30 flex items-center justify-center text-[10px] tabular-nums">
              {i < current ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="truncate max-w-[8rem]">{t(s.titleKey)}</span>
          </li>
        ))}
      </ol>

      {/* Desktop: numbered stepper across the top */}
      <ol className="hidden md:flex items-center justify-between gap-4 px-6 py-4">
        {steps.map((s, i) => (
          <li key={s.key} className="flex-1 flex items-center gap-3">
            <span className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 transition-colors',
              i < current && 'bg-emerald-soft text-emerald-deep',
              i === current && 'bg-emerald text-cream',
              i > current && 'bg-cream-deep text-muted-foreground'
            )}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn('text-sm font-medium truncate', i === current ? 'text-ink' : 'text-muted-foreground')}>
              {t(s.titleKey)}
            </span>
            {i < steps.length - 1 && <span className="flex-1 h-px bg-line" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

> The pills use `overflow-x-auto` on mobile so all 5 steps fit even on 360px. Hide the scrollbar with a Tailwind utility plugin or a small `.no-scrollbar` class in `index.css`:
> ```css
> .no-scrollbar { scrollbar-width: none; }
> .no-scrollbar::-webkit-scrollbar { display: none; }
> ```

### 4. Step 1 — Shaxsiy ma'lumotlar

```tsx
// src/features/employees/wizard/Step1Personal.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { step1Schema } from './employee.schema';
import { useWizardStore } from './wizard-store';
import { listEmployees } from '@/lib/mock-backend';

interface Props { onValid: (next: () => void) => void; }

export default function Step1Personal({ onValid }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const { data, setStep1 } = useWizardStore();
  const form = useForm({ resolver: zodResolver(step1Schema), defaultValues: data.step1, mode: 'onBlur' });
  const [pinflCheck, setPinflCheck] = useState<'idle' | 'checking' | 'unique' | 'taken'>('idle');

  // Real-time PINFL dedup (debounced)
  const pinfl = form.watch('pinfl');
  useEffect(() => {
    if (!/^[1-6]\d{13}$/.test(pinfl)) { setPinflCheck('idle'); return; }
    setPinflCheck('checking');
    const id = setTimeout(async () => {
      const all = await listEmployees();
      setPinflCheck(all.some(e => e.pinfl === pinfl) ? 'taken' : 'unique');
    }, 400);
    return () => clearTimeout(id);
  }, [pinfl]);

  // Persist values into the store on every change
  const values = form.watch();
  useEffect(() => { setStep1(values); }, [values, setStep1]);

  // Expose a validator the parent can call before "Next"
  onValid(async () => {
    const ok = await form.trigger();
    return ok && pinflCheck !== 'taken';
  });

  return (
    <form className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('dashboard:employees.wizard.fields.last-name')} *</Label>
          <Input id="lastName" {...form.register('lastName')} autoCapitalize="words" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('dashboard:employees.wizard.fields.first-name')} *</Label>
          <Input id="firstName" {...form.register('firstName')} autoCapitalize="words" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">{t('dashboard:employees.wizard.fields.middle-name')}</Label>
          <Input id="middleName" {...form.register('middleName')} autoCapitalize="words" className="h-12" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('dashboard:employees.wizard.fields.gender')} *</Label>
        <RadioGroup value={form.watch('gender')} onValueChange={v => form.setValue('gender', v as 'M' | 'F')} className="flex gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="M" id="g-m" />
            <span>{t('common:genders.M')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="F" id="g-f" />
            <span>{t('common:genders.F')}</span>
          </label>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthDate">{t('dashboard:employees.wizard.fields.birth-date')}</Label>
          <Input id="birthDate" type="date" {...form.register('birthDate')} className="h-12" />
          {form.formState.errors.birthDate && (
            <p className="text-xs text-destructive">{t(form.formState.errors.birthDate.message as string)}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pinfl">{t('dashboard:employees.wizard.fields.pinfl')} *</Label>
          <div className="relative">
            <Input
              id="pinfl"
              {...form.register('pinfl')}
              inputMode="numeric"
              maxLength={14}
              placeholder="14 ta raqam"
              className="h-12 pr-10 font-mono tabular-nums"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {pinflCheck === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {pinflCheck === 'unique' && <span className="text-emerald text-sm">✓</span>}
              {pinflCheck === 'taken' && <span className="text-destructive text-sm">✗</span>}
            </div>
          </div>
          {pinflCheck === 'taken' && (
            <p className="text-xs text-destructive">{t('common:errors.pinfl-taken')}</p>
          )}
          {form.formState.errors.pinfl && pinflCheck !== 'taken' && (
            <p className="text-xs text-destructive">{t(form.formState.errors.pinfl.message as string)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportSeries">{t('dashboard:employees.wizard.fields.passport')}</Label>
        <Input id="passportSeries" {...form.register('passportSeries')} placeholder="AA1234567" className="h-12" />
      </div>
    </form>
  );
}
```

> The `onValid` prop is the wizard parent's way to ask "is the current step valid?" before allowing "Next". Implement it as a ref-style callback registration; the parent stores the latest validator and calls it on "Next".

### 5. Step 2 — Aloqa ma'lumotlari

Similar shape: `workPhone`, `internalExtension`, `mobilePhone`, `corporateEmail`, `personalEmail`. Phone field uses `inputMode="tel"` and a soft mask: as the user types, format to `+998 XX XXX XX XX`. Corporate email helper text reminds: "must end with `@devon.uz`".

Realtime corporate email dedup: same pattern as PINFL.

### 6. Step 3 — Ish o'rni va lavozim

```tsx
// Sketch (full implementation mirrors Step 1)
- primaryUnitUuid: Combobox with search across all ACTIVE units, sub-labelled with their `type`
- positionId: Combobox filtered by the chosen unit's `type` (using positions.allowedUnitTypes)
- employmentType: RadioGroup with 4 options laid out as 2x2 on mobile, horizontal on desktop
- hireDate: date input, default today
- role: Select — ROLE_EMPLOYEE (default), ROLE_UNIT_HEAD, ROLE_HR_OPERATOR, ROLE_AUDITOR (no SUPER/ADMIN here)
```

> Use shadcn's `Command` + `Popover` to build a `Combobox` (the canonical pattern from shadcn docs). On mobile, treat the Combobox trigger as a full-width 48-tall button that opens a `Sheet` from the bottom with a `Command` search inside.

### 7. Step 4 — Kirish ma'lumotlari

```tsx
// Step4Login.tsx (sketch)
const corp = data.step2.corporateEmail;
useEffect(() => {
  // Auto-derive login from corporate email's local part (first.last)
  setStep4({ login: corp.split('@')[0] });
}, [corp]);

function generatePassword() {
  // 10-char password: uppercase + lowercase + digit + special
  const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
  const l = 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)];
  const d = '23456789'[Math.floor(Math.random() * 8)];
  const s = '!@#$%&*'[Math.floor(Math.random() * 7)];
  const rest = Array.from({ length: 6 }, () => {
    const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return pool[Math.floor(Math.random() * pool.length)];
  }).join('');
  return (u + l + d + s + rest).split('').sort(() => Math.random() - 0.5).join('');
}
```

UI: read-only login (with "edit" button), password field with a "Generate" button + "copy" button + "show/hide" toggle. Two checkboxes for SMS and email notification (both checked by default). Strength meter (use `Progress`).

### 8. ReviewScreen

Summary card per step with an "Edit" link back to that step. Use `Tabs` on desktop, stacked `Card`s on mobile. Submit button is the primary CTA.

```tsx
async function onSubmit() {
  try {
    setBusy(true);
    const result = await createEmployeeFull({
      employee: {
        lastName: data.step1.lastName,
        firstName: data.step1.firstName,
        middleName: data.step1.middleName || undefined,
        gender: data.step1.gender,
        birthDate: data.step1.birthDate || undefined,
        pinfl: data.step1.pinfl,
        passportSeries: data.step1.passportSeries || undefined,
        workPhone: data.step2.workPhone || undefined,
        internalExtension: data.step2.internalExtension || undefined,
        mobilePhone: data.step2.mobilePhone,
        corporateEmail: data.step2.corporateEmail,
        personalEmail: data.step2.personalEmail || undefined,
        primaryUnitUuid: data.step3.primaryUnitUuid,
        positionId: data.step3.positionId,
        employmentType: data.step3.employmentType,
        hireDate: data.step3.hireDate,
      },
      password: data.step4.password,
      role: data.step3.role,
    }, actor);
    reset();
    toast.success(t('dashboard:employees.wizard.success', { name: result.employee.fullNameGenerated }));
    navigate(`/employees/${result.employee.uuid}`);
  } catch (e) {
    toast.error(t('common:errors.network'));
  } finally {
    setBusy(false);
  }
}
```

### 9. EmployeeWizardPage — full-screen on mobile, sheet-ish on desktop

```tsx
// EmployeeWizardPage.tsx (sketch)
- Mobile (<md): `min-h-screen flex flex-col` with the stepper at top, scrollable content in the middle, sticky CTA bar at the bottom (`pb-safe`)
- Desktop (≥md): centred card max-w-3xl with the stepper inside; content scrolls inside, CTA bar at the bottom of the card

```

Layout:

```tsx
<div className="min-h-screen bg-background flex flex-col">
  {/* Mobile top bar — Close + title; replaces the normal AppShell header for this route */}
  <header className="md:hidden h-14 px-4 flex items-center gap-3 border-b border-line bg-surface">
    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
    <h1 className="text-base font-semibold text-ink">{t('dashboard:employees.wizard.title')}</h1>
  </header>

  <div className="hidden md:block">
    <PageHeader title={t('dashboard:employees.wizard.title')} subtitle={...} actions={<Button variant="ghost" onClick={onClose}>{t('common:actions.cancel')}</Button>} />
  </div>

  <div className="flex-1 flex flex-col md:items-center md:justify-start md:py-8">
    <div className="w-full md:max-w-3xl md:bg-surface md:border md:border-line md:rounded-xl md:shadow-sm flex flex-col flex-1">
      <WizardStepper current={current} />
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {current === 0 && <Step1Personal onValid={...} />}
        {current === 1 && <Step2Contact onValid={...} />}
        {current === 2 && <Step3Work onValid={...} />}
        {current === 3 && <Step4Login onValid={...} />}
        {current === 4 && <ReviewScreen />}
      </div>
      <footer className="border-t border-line px-4 md:px-8 py-4 pb-safe bg-surface sticky bottom-0 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={current === 0} onClick={prev}>{t('common:actions.previous')}</Button>
        {current < 4 ? (
          <Button onClick={next}>{t('common:actions.next')}</Button>
        ) : (
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('dashboard:employees.wizard.submit-cta')}
          </Button>
        )}
      </footer>
    </div>
  </div>
</div>
```

Important: on mobile this route DOES NOT render inside `<AppShell>` (no sidebar/topbar). It's its own full-screen surface. On desktop it can either stay full-screen or render inside the shell — keep it full-screen for consistency; the AppShell route wrapper should detect this path and skip the shell.

Two ways to handle that:
- Option A: Don't wrap `/employees/new` with `<AppShell>` in the router (only wrap with `<RequireAuth>`). The wizard renders its own chrome.
- Option B: Add a `noShell` prop on `Protected` and pass it on this route.

Pick Option A — cleaner.

```tsx
// router.tsx
<Route path="/employees/new" element={<RequireAuth><EmployeeWizardPage /></RequireAuth>} />
```

### 10. Mock-backend `createEmployeeFull`

If not already implemented in step 06, add it now. It must run as a single mock transaction:

```ts
export async function createEmployeeFull(payload: {
  employee: Omit<Employee, 'uuid' | 'userUuid' | 'fullNameGenerated' | 'createdAt' | 'updatedAt' | 'status'>;
  password: string;
  role: Role;
}, actorUuid: string): Promise<{ employee: Employee; user: User; assignment: Assignment }> {
  await simulatedDelay();
  maybeFail();

  const employees = readTable<Employee>(Tables.employees, []);
  const users = readTable<User>(Tables.users, []);
  const assignments = readTable<Assignment>(Tables.assignments, []);

  // Uniqueness checks (TZ §4.4)
  if (employees.some(e => e.pinfl === payload.employee.pinfl)) {
    throw Object.assign(new Error('pinfl-taken'), { code: 'pinfl-taken' });
  }
  if (users.some(u => u.email.toLowerCase() === payload.employee.corporateEmail.toLowerCase())) {
    throw Object.assign(new Error('email-taken'), { code: 'email-taken' });
  }

  const userUuid = uuid();
  const employeeUuid = uuid();
  const assignmentUuid = uuid();
  const now = new Date().toISOString();
  const fullName = [payload.employee.lastName, payload.employee.firstName, payload.employee.middleName].filter(Boolean).join(' ');

  const user: User = {
    uuid: userUuid,
    employeeUuid,
    email: payload.employee.corporateEmail,
    passwordHash: await sha256Hex(payload.password),
    roles: [payload.role],
    mustChangePassword: true,
    createdAt: now,
  };

  const employee: Employee = {
    ...payload.employee,
    uuid: employeeUuid,
    userUuid,
    fullNameGenerated: fullName,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const assignment: Assignment = {
    uuid: assignmentUuid,
    employeeUuid,
    unitUuid: payload.employee.primaryUnitUuid,
    positionId: payload.employee.positionId,
    isPrimary: true,
    startDate: payload.employee.hireDate,
    workloadPercent: 100,
    type: 'PRIMARY',
    createdAt: now,
  };

  employees.push(employee);
  users.push(user);
  assignments.push(assignment);

  writeTable(Tables.employees, employees);
  writeTable(Tables.users, users);
  writeTable(Tables.assignments, assignments);

  await appendAudit({
    action: 'CREATE',
    resourceType: 'employee',
    resourceUuid: employeeUuid,
    resourceLabel: fullName,
    actorUuid,
  });

  return { employee, user, assignment };
}
```

### 11. Extend `uz.json`

```json
"employees": {
  "wizard": {
    "title": "Yangi xodim qo'shish",
    "step-1": { "title": "Shaxsiy ma'lumotlar" },
    "step-2": { "title": "Aloqa" },
    "step-3": { "title": "Ish o'rni" },
    "step-4": { "title": "Kirish" },
    "review": { "title": "Ko'rib chiqish" },
    "submit-cta": "Xodim yaratish",
    "fields": {
      "last-name": "Familiya",
      "first-name": "Ism",
      "middle-name": "Sharif",
      "gender": "Jinsi",
      "birth-date": "Tug'ilgan sanasi",
      "pinfl": "JSHShIR",
      "passport": "Passport seriya/raqami",
      "work-phone": "Ish telefoni",
      "extension": "Ichki raqam",
      "mobile-phone": "Mobil telefon",
      "corporate-email": "Korporativ pochta",
      "personal-email": "Shaxsiy pochta",
      "unit": "Tarkibiy bo'linma",
      "position": "Lavozim",
      "employment-type": "Ish turi",
      "hire-date": "Ishga qabul sanasi",
      "role": "Tizimdagi roli",
      "login": "Login",
      "password": "Parol",
      "notify-sms": "SMS orqali yuborish",
      "notify-email": "Email orqali yuborish"
    },
    "actions": {
      "generate-password": "Yangi parol yaratish",
      "copy-password": "Nusxalash",
      "show-password": "Ko'rsatish",
      "hide-password": "Yashirish"
    },
    "errors": {
      "age-18": "Xodim 18 yoshdan katta bo'lishi kerak",
      "password-weak": "Parol kamida 8 belgi, 1 katta harf, 1 raqam, 1 maxsus belgi"
    },
    "success": "{{name}} muvaffaqiyatli yaratildi"
  }
}
```

## Acceptance checks

- [ ] **Mobile (360px)**: wizard takes the full screen. Top bar has `X` to close. Stepper pills scroll horizontally. Content scrolls. Bottom CTA bar sticks above the iOS safe area.
- [ ] **Desktop**: wizard renders inside a centred card, `max-w-3xl`, with the stepper across the top.
- [ ] **Step 1**: required fields enforced; gender radios are tap-friendly; PINFL field shows live dedup (loader → ✓ unique / ✗ taken).
- [ ] **Step 2**: `+998 90 123 45 67` format enforced; corporate email must end with `@devon.uz`; live dedup.
- [ ] **Step 3**: unit combobox searchable; position dropdown filtered by unit type; role select shows localised labels.
- [ ] **Step 4**: login auto-derived from corporate email; "Generate" produces a 10-char password meeting all rules; copy button works (clipboard); show/hide toggle works.
- [ ] **Review**: each step has a summary card with an "Edit" link back to that step (preserves entered data in the store).
- [ ] On submit, mock-backend creates `Employee + User + Assignment + Audit` atomically; success toast; navigation to `/employees/:uuid`.
- [ ] Submitting with an existing PINFL → error toast "Bu JSHShIR allaqachon ro'yxatdan o'tgan".
- [ ] Submitting with simulated network failure (3%) → error toast; wizard data preserved (user can retry).
- [ ] Closing mid-wizard prompts a `confirm()` ("Are you sure? Your progress will be lost."), if data is dirty.
- [ ] All copy via `t()`. Tested at 360 / 768 / 1024 / 1280px.

## Notes

- The wizard data lives in a Zustand store (not in URL state) so the user can navigate forward and back without losing progress. Closing with the `X` clears the store after a confirmation.
- The `onValid` callback pattern is one of several options for parent-child validation. Alternatives: lift `react-hook-form` into the parent with a single union schema. Either works; pick the cleaner one.
- PINFL & corporate-email uniqueness checks are intentionally **client-side calls to the mock backend** — this exercises the same path the real backend would take.
- For position filtering: read positions from `listPositions()`, filter by the selected unit's `type` matching `position.allowedUnitTypes`. If nothing matches, show "Bu bo'linma turiga mos lavozimlar topilmadi" and disable Next.
- Real SMS / email OTP is out of scope. The two notify checkboxes in step 4 are visual stubs. The `success` toast names the employee but the credential delivery is implicit.

## What "done" looks like

The HR_ADMIN can create an employee end-to-end on a phone without ever zooming in. The wizard feels like a polished mobile app, not a desktop form crammed onto small glass. On submit, the new employee appears immediately in the list (step 09) and in the org tree's counts (step 08).
