# Required "Buyruqdan ko'chirma" Attachment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required file-attachment field ("Buyruqdan ko'chirma" — certified extract of the hiring order signed by the Director; PDF/JPG/PNG, ≤ 10 MB) to Step 3 of the add-employee wizard, persisted as metadata-only in the mock backend, surfaced on the review screen and profile Info tab, seeded for existing employees, and cascaded through the product docs.

**Spec:** `docs/superpowers/specs/2026-06-11-employee-order-extract-attachment-design.md` (approved).

**Architecture:** The `File` object never leaves the pick handler — pick-time validation extracts `{ fileName, fileSize, mimeType }`, which flows through the existing zod → Zustand → review → `createEmployeeFull` pipeline as plain serializable data. `createEmployeeFull` stamps `uploadedAt` and enforces presence at the policy layer (`EmployeeValidationError('order-extract-missing')`). The field is immutable post-creation (excluded from `updateEmployee`'s patch type).

**Tech stack:** Vite + React 19 + TS, react-hook-form + zod, Zustand, react-i18next (UZ-first), shadcn/ui, localStorage mock backend.

**Testing note:** This repo has **no automated-test infrastructure** — tests are explicitly deferred per the master prompt §17 and `CLAUDE.md`'s demo scope. Verification per task is `npm run build` (which runs `tsc -b && vite build`) plus dev-server/manual checks. Do not introduce a test framework for this change.

**Branch/commits:** Commit directly to `main`, matching all 15 prior dashboard build steps (no `develop` branch exists in this repo). All `npm` commands run from `dashboard/`.

---

### Task 1: Shared `formatBytes` helper

The certificate page has a bespoke B/KB-only `formatBytes`; the new field needs MB. Extract a shared helper, switch the certificate page to it.

**Files:**
- Create: `dashboard/src/lib/format.ts`
- Modify: `dashboard/src/features/certificates/CertificateUploadPage.tsx:39-42`

- [ ] **Step 1: Create the helper**

```ts
// dashboard/src/lib/format.ts
/** Human-readable file size. 1024-based, one decimal above bytes. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Switch CertificateUploadPage to the shared helper**

In `dashboard/src/features/certificates/CertificateUploadPage.tsx`, delete the local function (lines 39–42):

```ts
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}
```

and add to the existing `@/` import block near the top of the file:

```ts
import { formatBytes } from '@/lib/format';
```

- [ ] **Step 3: Verify build**

Run: `cd dashboard && npm run build`
Expected: exits 0, no TS errors, "✓ built in …".

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/lib/format.ts dashboard/src/features/certificates/CertificateUploadPage.tsx
git commit -m "refactor(dashboard): extract shared formatBytes helper with MB support"
```

---

### Task 2: Domain model, backend zod schema, error code, seed

Add the optional `employmentOrderExtract` field to the data model (optional = backward-compatible with stored rows; requiredness is enforced at creation in Task 4), the new validation code, and seed metadata for all 30 employees (identity-changing → `SEED_VERSION` bump).

**Files:**
- Modify: `dashboard/src/types/domain.ts:56-81` (Employee interface)
- Modify: `dashboard/src/lib/mock-backend/schemas.ts:132-157` (employeeSchema)
- Modify: `dashboard/src/lib/mock-backend/errors.ts:19`
- Modify: `dashboard/src/lib/mock-backend/seed.ts:33` (SEED_VERSION) and `~498-540` (buildEmployees loop)

- [ ] **Step 1: Add the domain type**

In `dashboard/src/types/domain.ts`, immediately above `export interface Employee {`:

```ts
/**
 * Certified extract of the hiring order ("buyruqdan ko'chirma") signed by the
 * Director — required at employee creation. Metadata only: the demo's mock
 * backend never stores file bytes (same convention as ERI certificates).
 */
export interface EmploymentOrderExtract {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}
```

Inside `Employee`, after the `hireDate: string;` line, add:

```ts
  employmentOrderExtract?: EmploymentOrderExtract;
```

- [ ] **Step 2: Add the backend zod schema**

In `dashboard/src/lib/mock-backend/schemas.ts`, above `export const employeeSchema = z.object({`:

```ts
export const employmentOrderExtractSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  uploadedAt: z.string(),
});
```

Inside `employeeSchema`, after the `hireDate: z.string(),` line, add:

```ts
  employmentOrderExtract: employmentOrderExtractSchema.optional(),
```

- [ ] **Step 3: Extend the validation-code union**

In `dashboard/src/lib/mock-backend/errors.ts`, change line 19:

```ts
export type EmployeeValidationCode = 'pinfl-taken' | 'email-taken';
```

to:

```ts
export type EmployeeValidationCode = 'pinfl-taken' | 'email-taken' | 'order-extract-missing';
```

- [ ] **Step 4: Seed extract metadata for every employee**

In `dashboard/src/lib/mock-backend/seed.ts`:

(a) Bump the version at line 33:

```ts
const SEED_VERSION = '4';
```

(b) Above the `for (const assign of fioToUnit) {` loop (just after the `const assignments: Assignment[] = [];` line at ~500), add:

```ts
  // Mostly PDFs with a few scans, picked deterministically per employee.
  const extractMimes = [
    'application/pdf',
    'application/pdf',
    'application/pdf',
    'image/jpeg',
    'image/png',
  ] as const;
```

(c) Inside the loop, after `const fullNameGenerated = ...` (~line 510), add:

```ts
    const extractMime = extractMimes[assign.fioIdx % extractMimes.length]!;
    const extractExt =
      extractMime === 'application/pdf' ? 'pdf' : extractMime === 'image/png' ? 'png' : 'jpg';
```

(d) In the `const employee: Employee = { ... }` literal, after the `hireDate,` line, add:

```ts
      employmentOrderExtract: {
        fileName: `buyruq_${hireYear}-${10 + assign.fioIdx * 3 + randInt(0, 2)}_kochirma.${extractExt}`,
        fileSize: randInt(180, 1200) * 1024,
        mimeType: extractMime,
        uploadedAt: hireDate,
      },
```

(`randInt`, `hireYear`, and `hireDate` already exist in this scope.)

- [ ] **Step 5: Verify build**

Run: `cd dashboard && npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/types/domain.ts dashboard/src/lib/mock-backend/schemas.ts dashboard/src/lib/mock-backend/errors.ts dashboard/src/lib/mock-backend/seed.ts
git commit -m "feat(dashboard): EmploymentOrderExtract model + seeded metadata, SEED_VERSION 4"
```

---

### Task 3: Wizard form layer (schema, store, field component, Step 3, review)

**Files:**
- Modify: `dashboard/src/features/employees/wizard/employee.schema.ts:41-47`
- Modify: `dashboard/src/features/employees/wizard/wizard-store.ts:22-28,62-68`
- Create: `dashboard/src/features/employees/wizard/OrderExtractField.tsx`
- Modify: `dashboard/src/features/employees/wizard/Step3Work.tsx`
- Modify: `dashboard/src/features/employees/wizard/ReviewScreen.tsx:143-161`
- Modify: `dashboard/src/i18n/locales/uz.json` (wizard blocks)

- [ ] **Step 1: Add validation constants + metadata schema + step-3 field**

In `dashboard/src/features/employees/wizard/employee.schema.ts`, above `export const step3Schema`:

```ts
// "Buyruqdan ko'chirma" — certified extract of the hiring order. Required at
// creation; PDF/JPG/PNG only; 10 MB cap. The schema layer owns these facts so
// the picker component and any future consumer share one source of truth.
export const MAX_ORDER_EXTRACT_SIZE_BYTES = 10 * 1024 * 1024;
export const ORDER_EXTRACT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;
export const ORDER_EXTRACT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

export const orderExtractMetaSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
});
export type OrderExtractMeta = z.infer<typeof orderExtractMetaSchema>;
```

Inside `step3Schema`, after the `role: z.enum([...]),` line, add:

```ts
  employmentOrderExtract: orderExtractMetaSchema
    .nullable()
    .refine((v) => v !== null, 'common:errors.required'),
```

- [ ] **Step 2: Extend the wizard store**

In `dashboard/src/features/employees/wizard/wizard-store.ts`:

(a) Add to the imports:

```ts
import type { OrderExtractMeta } from './employee.schema';
```

(b) In `interface WizardStep3` (after the `role:` line), add:

```ts
  employmentOrderExtract: OrderExtractMeta | null;
```

(c) In `emptyData()`'s `step3` object (after `role: 'ROLE_EMPLOYEE',`), add:

```ts
      employmentOrderExtract: null,
```

- [ ] **Step 3: Create the field component**

```tsx
// dashboard/src/features/employees/wizard/OrderExtractField.tsx
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatBytes } from '@/lib/format';

import {
  MAX_ORDER_EXTRACT_SIZE_BYTES,
  ORDER_EXTRACT_EXTENSIONS,
  ORDER_EXTRACT_MIME_TYPES,
  type OrderExtractMeta,
} from './employee.schema';

interface Props {
  value: OrderExtractMeta | null;
  errorKey?: string;
  onChange: (meta: OrderExtractMeta | null) => void;
  onError: (messageKey: string) => void;
}

function isAllowed(file: File): boolean {
  if ((ORDER_EXTRACT_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Some browsers/OSes leave File.type empty — fall back to the extension.
  if (file.type === '') {
    const name = file.name.toLowerCase();
    return ORDER_EXTRACT_EXTENSIONS.some((ext) => name.endsWith(ext));
  }
  return false;
}

function mimeFor(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

export default function OrderExtractField({ value, errorKey, onChange, onError }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File | null) {
    if (!file) return;
    if (!isAllowed(file)) {
      onError('dashboard:employees.wizard.errors.order-extract-format');
      return;
    }
    if (file.size > MAX_ORDER_EXTRACT_SIZE_BYTES) {
      onError('dashboard:employees.wizard.errors.order-extract-too-large');
      return;
    }
    // Metadata only — the File object is dropped here; the mock backend never
    // stores bytes (same convention as ERI certificates).
    onChange({ fileName: file.name, fileSize: file.size, mimeType: mimeFor(file) });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="employmentOrderExtract">
        {t('dashboard:employees.wizard.fields.order-extract')}{' '}
        <span className="text-destructive">*</span>
      </Label>
      <input
        ref={inputRef}
        id="employmentOrderExtract"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          // Re-picking the same file must re-fire onChange.
          e.target.value = '';
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          <FileText className="h-4 w-4 shrink-0 text-emerald" />
          <span className="min-w-0 flex-1 truncate text-sm text-ink">
            {value.fileName}{' '}
            <span className="text-muted-foreground">({formatBytes(value.fileSize)})</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {t('dashboard:employees.wizard.actions.replace-file')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            aria-label={t('dashboard:employees.wizard.actions.remove-file')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t('dashboard:employees.wizard.actions.choose-file')}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {t('dashboard:employees.wizard.hints.order-extract')}
      </p>
      {errorKey && <p className="text-xs text-destructive">{t(errorKey)}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Wire the field into Step 3**

In `dashboard/src/features/employees/wizard/Step3Work.tsx`:

(a) Add the import next to the other local imports:

```ts
import OrderExtractField from './OrderExtractField';
```

(b) Next to the existing watches (`const employmentType = form.watch(...)`), add:

```ts
  const employmentOrderExtract = form.watch('employmentOrderExtract');
```

(c) After the closing `</div>` of the hire-date/role grid (line 247, just before `</form>`), add:

```tsx
      <OrderExtractField
        value={employmentOrderExtract}
        errorKey={errors.employmentOrderExtract?.message as string | undefined}
        onChange={(meta) => {
          form.clearErrors('employmentOrderExtract');
          form.setValue('employmentOrderExtract', meta, {
            shouldDirty: true,
            shouldValidate: meta !== null,
          });
        }}
        onError={(key) =>
          form.setError('employmentOrderExtract', { type: 'manual', message: key })
        }
      />
```

(`shouldValidate: meta !== null` keeps removal from flashing "required" immediately; the zod gate still blocks Next.)

- [ ] **Step 5: Add the review-screen row**

In `dashboard/src/features/employees/wizard/ReviewScreen.tsx`:

(a) Add the import:

```ts
import { formatBytes } from '@/lib/format';
```

(b) In the step-3 `<Section>` (stepIndex 2), after the `role` Row (line ~160), add:

```tsx
        <Row
          label={t('dashboard:employees.wizard.fields.order-extract')}
          value={
            data.step3.employmentOrderExtract
              ? `${data.step3.employmentOrderExtract.fileName} (${formatBytes(
                  data.step3.employmentOrderExtract.fileSize,
                )})`
              : undefined
          }
        />
```

- [ ] **Step 6: Add the wizard i18n keys (uz.json)**

In `dashboard/src/i18n/locales/uz.json`, inside `dashboard.employees.wizard`:

(a) In `"fields"`, after `"role": "Tizimdagi roli",` add:

```json
          "order-extract": "Buyruqdan ko'chirma",
```

(b) Replace the `"hints"` block:

```json
        "hints": {
          "corporate-email": "Pochta @devon.uz bilan tugashi shart",
          "derived-login": "Login korporativ pochtadan avtomatik olinadi. O'zgartirish uchun yuqoridagi tugmani bosing."
        },
```

with:

```json
        "hints": {
          "corporate-email": "Pochta @devon.uz bilan tugashi shart",
          "derived-login": "Login korporativ pochtadan avtomatik olinadi. O'zgartirish uchun yuqoridagi tugmani bosing.",
          "order-extract": "Direktor tomonidan imzolangan ishga qabul qilish buyrug'ining tasdiqlangan ko'chirmasi (PDF, JPG yoki PNG, maks. 10 MB)"
        },
```

(c) Replace the wizard `"actions"` block:

```json
        "actions": {
          "show-password": "Parolni ko'rsatish",
          "hide-password": "Parolni yashirish",
          "copy-password": "Nusxalash",
          "regenerate-password": "Yangi parol yaratish",
          "use-derived-login": "Avtomatik loginni qaytarish",
          "copied": "Nusxalandi"
        },
```

with:

```json
        "actions": {
          "show-password": "Parolni ko'rsatish",
          "hide-password": "Parolni yashirish",
          "copy-password": "Nusxalash",
          "regenerate-password": "Yangi parol yaratish",
          "use-derived-login": "Avtomatik loginni qaytarish",
          "copied": "Nusxalandi",
          "choose-file": "Fayl tanlash",
          "replace-file": "Almashtirish",
          "remove-file": "O'chirish"
        },
```

(d) Replace the wizard `"errors"` block:

```json
        "errors": {
          "age-18": "Xodim 18 yoshdan katta bo'lishi kerak",
          "password-weak": "Parol kamida 8 belgi, katta va kichik harflar, raqam va maxsus belgini o'z ichiga olishi kerak",
          "no-units": "Faol bo'linmalar topilmadi",
          "no-positions-for-unit": "Bu bo'linma turiga mos lavozim yo'q"
        }
```

with:

```json
        "errors": {
          "age-18": "Xodim 18 yoshdan katta bo'lishi kerak",
          "password-weak": "Parol kamida 8 belgi, katta va kichik harflar, raqam va maxsus belgini o'z ichiga olishi kerak",
          "no-units": "Faol bo'linmalar topilmadi",
          "no-positions-for-unit": "Bu bo'linma turiga mos lavozim yo'q",
          "order-extract-format": "Faqat PDF, JPG yoki PNG formatdagi fayllar qabul qilinadi",
          "order-extract-too-large": "Fayl hajmi 10 MB dan oshmasligi kerak"
        }
```

- [ ] **Step 7: Verify build + wizard behavior**

Run: `cd dashboard && npm run build`
Expected: exits 0.

Run: `cd dashboard && npm run dev` (background), then probe: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/devon-landing/dashboard/employees/new`
Expected: `200`. In a browser (if available): Step 3 shows the field; submitting without a file shows "Bu maydon majburiy"; a `.txt` file shows the format error; picking a PDF shows the chip; navigating to Step 4 and back keeps the chip; the review screen shows the filename row. Stop the dev server after.

- [ ] **Step 8: Commit**

```bash
git add dashboard/src/features/employees/wizard/ dashboard/src/i18n/locales/uz.json
git commit -m "feat(dashboard): required Buyruqdan ko'chirma attachment field in wizard step 3"
```

---

### Task 4: Backend enforcement + submit payload

**Files:**
- Modify: `dashboard/src/lib/mock-backend/index.ts:386-471` (CreateEmployeeFullInput, createEmployeeFull, updateEmployee)
- Modify: `dashboard/src/features/employees/wizard/EmployeeWizardPage.tsx`
- Modify: `dashboard/src/i18n/locales/uz.json` (common errors)

- [ ] **Step 1: Extend `CreateEmployeeFullInput` and enforce in `createEmployeeFull`**

In `dashboard/src/lib/mock-backend/index.ts`:

(a) Add `EmploymentOrderExtract` to the existing `import type { ... } from '@/types/domain'` list.

(b) Replace the input interface:

```ts
export interface CreateEmployeeFullInput {
  employee: Omit<
    Employee,
    'uuid' | 'userUuid' | 'fullNameGenerated' | 'createdAt' | 'updatedAt' | 'status'
  >;
  password: string;
  role: User['roles'][number];
}
```

with:

```ts
export interface CreateEmployeeFullInput {
  employee: Omit<
    Employee,
    | 'uuid'
    | 'userUuid'
    | 'fullNameGenerated'
    | 'createdAt'
    | 'updatedAt'
    | 'status'
    | 'employmentOrderExtract'
  >;
  /** Pick-time metadata from the wizard; `uploadedAt` is stamped here. */
  orderExtract: Omit<EmploymentOrderExtract, 'uploadedAt'>;
  password: string;
  role: User['roles'][number];
}
```

(c) In `createEmployeeFull`, before the pinfl uniqueness check (after `const e = input.employee;`), add:

```ts
  // The certified hiring-order extract is required before the profile can be
  // created. Enforced here (policy layer), not just by the wizard UI.
  if (!input.orderExtract?.fileName) {
    throw new EmployeeValidationError('order-extract-missing');
  }
```

(d) In the `const employee: Employee = { ... }` literal, after `fullNameGenerated,` add:

```ts
    employmentOrderExtract: { ...input.orderExtract, uploadedAt: NOW() },
```

(e) Extend the `appendAudit` call at the end of `createEmployeeFull`:

```ts
  await appendAudit({
    actorUuid,
    action: 'CREATE',
    resourceType: 'employee',
    resourceUuid: employeeUuid,
    resourceLabel: fullNameGenerated,
    context: { orderExtractFileName: input.orderExtract.fileName },
  });
```

(f) Lock the field post-creation — in `updateEmployee`'s signature, change the patch type from:

```ts
  patch: Partial<Omit<Employee, 'uuid' | 'userUuid' | 'createdAt' | 'fullNameGenerated'>>,
```

to:

```ts
  // employmentOrderExtract is immutable post-creation (legal document signed
  // at hire time) — same lock as PINFL.
  patch: Partial<
    Omit<Employee, 'uuid' | 'userUuid' | 'createdAt' | 'fullNameGenerated' | 'employmentOrderExtract'>
  >,
```

- [ ] **Step 2: Pass the metadata from the wizard submit**

In `dashboard/src/features/employees/wizard/EmployeeWizardPage.tsx`:

(a) Next to the other store selectors, add:

```ts
  const setCurrent = useWizardStore((s) => s.setCurrent);
```

(b) At the top of `onSubmit()` (before `setBusy(true);`), add:

```ts
    const orderExtract = data.step3.employmentOrderExtract;
    if (!orderExtract) {
      // Step 3's zod gate makes this unreachable in practice; if the store is
      // ever in a bad state, bounce back instead of failing the create.
      toast.error(t('common:errors.order-extract-missing'));
      setCurrent(2);
      return;
    }
```

(c) In the `createEmployeeFull` call, after the `employee: { ... },` object, add:

```ts
          orderExtract,
```

(The existing catch block already maps any `EmployeeValidationError` code to `common:errors.<code>` — no change needed.)

- [ ] **Step 3: Add the common error key**

In `dashboard/src/i18n/locales/uz.json`, in the top-level `common` → `"errors"` block, after `"email-taken": "Bu email allaqachon ro'yxatdan o'tgan",` add:

```json
      "order-extract-missing": "Buyruqdan ko'chirma biriktirilmagan",
```

- [ ] **Step 4: Verify build**

Run: `cd dashboard && npm run build`
Expected: exits 0. (TS now guarantees every `createEmployeeFull` call site passes `orderExtract` — the wizard page is the only call site outside `seed.ts`, which builds employees directly.)

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/lib/mock-backend/index.ts dashboard/src/features/employees/wizard/EmployeeWizardPage.tsx dashboard/src/i18n/locales/uz.json
git commit -m "feat(dashboard): enforce order extract in createEmployeeFull, wire wizard payload"
```

---

### Task 5: Profile Info tab row

**Files:**
- Modify: `dashboard/src/features/employees/profile/ProfileInfoTab.tsx:44-103`
- Modify: `dashboard/src/i18n/locales/uz.json` (profile info fields)

- [ ] **Step 1: Add the row**

In `dashboard/src/features/employees/profile/ProfileInfoTab.tsx`:

(a) Add the import:

```ts
import { formatBytes } from '@/lib/format';
```

(b) In the `rows` array, after the `employmentType` entry (line ~98-102), add:

```ts
    {
      key: 'orderExtract',
      label: t('dashboard:employees.profile.info.fields.order-extract'),
      value: employee.employmentOrderExtract
        ? `${employee.employmentOrderExtract.fileName} (${formatBytes(
            employee.employmentOrderExtract.fileSize,
          )})`
        : null,
    },
```

(The existing row renderer shows the localized empty-value dash for `null` — covers any legacy row without the field.)

- [ ] **Step 2: Add the i18n key**

In `dashboard/src/i18n/locales/uz.json`, in `dashboard.employees.profile.info.fields`, after `"employment-type": "Ish turi",` add:

```json
            "order-extract": "Buyruqdan ko'chirma",
```

- [ ] **Step 3: Verify build**

Run: `cd dashboard && npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/features/employees/profile/ProfileInfoTab.tsx dashboard/src/i18n/locales/uz.json
git commit -m "feat(dashboard): show Buyruqdan ko'chirma on the profile info tab"
```

---

### Task 6: Doc cascade

The hiring-order extract is **distinct** from the existing post-creation "lavozim yo'riqnomasi" attachment — every edit below preserves that distinction.

**Files:**
- Modify: `docs/product-specification.md:152`
- Modify: `docs/use-cases.md` (UC-17 main flow)
- Modify: `docs/business-processes.md` (BP-1 steps 3 and 9)
- Modify: `docs/glossary.md` (Document terms table)
- Modify: `README.md:72`
- Modify: `docs/dashboard-prompts/10-flow2-employee-wizard.md` (end-of-file addendum)

- [ ] **Step 1: product-specification.md** — after the line

```
- **Employee profile** — full name, department assignment, position title, internal phone extension, external phone, email, photograph.
```

insert:

```
- **Employment-order extract ("buyruqdan ko'chirma")** — the certified extract of the hiring order signed by the Director, attached as a required document (PDF, JPG, or PNG) when HR creates the employee profile. Distinct from the position instructions below, which are attached after the profile exists.
```

- [ ] **Step 2: use-cases.md UC-17** — replace the main flow list:

```
1. HR opens the employee-creation form.
2. Fills in: name, position, department (drill-down through the four-level org tree), email, phone, internal extension.
3. Attaches the position instructions ("lavozim yo'riqnomasi").
4. Saves.
5. Devon creates the profile in `pending-first-login` state.
6. Devon issues a one-time password.
7. HR communicates the credentials to the new hire (via the organization's standard onboarding channel).
8. New hire logs in (UC-01 A3 forces password change).
9. New hire reviews their profile (UC-02).
10. New hire confirms profile or requests corrections.
11. Profile transitions to `active`.
```

with:

```
1. HR opens the employee-creation form.
2. Fills in: name, position, department (drill-down through the four-level org tree), email, phone, internal extension.
3. Attaches the certified extract of the hiring order ("buyruqdan ko'chirma") signed by the Director — required; PDF, JPG, or PNG. The form cannot be saved without it.
4. Attaches the position instructions ("lavozim yo'riqnomasi").
5. Saves.
6. Devon creates the profile in `pending-first-login` state.
7. Devon issues a one-time password.
8. HR communicates the credentials to the new hire (via the organization's standard onboarding channel).
9. New hire logs in (UC-01 A3 forces password change).
10. New hire reviews their profile (UC-02).
11. New hire confirms profile or requests corrections.
12. Profile transitions to `active`.
```

- [ ] **Step 3: business-processes.md BP-1** — replace the step-3 row:

```
| 3 | HR | Enter employee data | Required fields: full name, position, phone, internal extension, department assignment (dropdown), email, login |
```

with:

```
| 3 | HR | Enter employee data and attach the employment-order extract | Required fields: full name, position, phone, internal extension, department assignment (dropdown), email, login, certified extract of the hiring order ("buyruqdan ko'chirma", PDF/JPG/PNG) signed by the Director |
```

and replace the step-9 row:

```
| 9 | HR | Confirm the profile and attach supporting documents | Position instructions ("lavozim yo'riqnomasi"), employment contract reference, etc. |
```

with:

```
| 9 | HR | Confirm the profile and attach supporting documents | Position instructions ("lavozim yo'riqnomasi"), employment contract reference, etc. The employment-order extract ("buyruqdan ko'chirma") is not attached here — it is already required at step 3, before the profile exists. |
```

- [ ] **Step 4: glossary.md** — in the "Document and correspondence terms" table, after the **Buyruq** row, insert:

```
| **Buyruqdan ko'chirma** | Extract from an order | The certified extract of the hiring order, signed by a director — attached (PDF/JPG/PNG) as a required document when an employee profile is created in Devon. Distinct from *lavozim yo'riqnomasi*, which is attached after the profile exists. |
```

- [ ] **Step 5: README.md** — replace line 72:

```
- Employee profile: full name, department, position, phone, internal extension
```

with:

```
- Employee profile: full name, department, position, phone, internal extension, certified employment-order extract ("buyruqdan ko'chirma", required at creation)
```

- [ ] **Step 6: dashboard-prompts/10-flow2-employee-wizard.md** — append at end of file:

```markdown
---

## Addendum — 2026-06-11: required "Buyruqdan ko'chirma" attachment (Step 3)

Step 3 (Ish o'rni) gained a required file-attachment field after the original build:

- **Field:** `employmentOrderExtract` — the certified extract of the hiring order signed by the Director.
- **Formats:** PDF, JPG, PNG; max 10 MB (`MAX_ORDER_EXTRACT_SIZE_BYTES` in `employee.schema.ts`).
- **Storage:** metadata only (`{ fileName, fileSize, mimeType, uploadedAt }`) — the mock backend never stores bytes, matching the certificate convention. `uploadedAt` is stamped by `createEmployeeFull`.
- **Validation:** pick-time type/size checks in `OrderExtractField.tsx`; zod-required in `step3Schema`; `createEmployeeFull` throws `EmployeeValidationError('order-extract-missing')` if absent.
- **Surfaces:** review-screen row, profile Info tab row. Immutable post-creation (excluded from `updateEmployee`'s patch type and `UpdateEmployeeSheet`).
- **Seed:** all seeded employees carry extract metadata; `SEED_VERSION` bumped `'3' → '4'`.

See `docs/superpowers/specs/2026-06-11-employee-order-extract-attachment-design.md`.
```

- [ ] **Step 7: Commit**

```bash
git add docs/product-specification.md docs/use-cases.md docs/business-processes.md docs/glossary.md README.md docs/dashboard-prompts/10-flow2-employee-wizard.md
git commit -m "docs: cascade Buyruqdan ko'chirma requirement through product canon"
```

---

### Task 7: Final verification + ai_context checkpoint

**Files:**
- Modify: `ai_context/AI_CONTEXT.md`
- Modify: `ai_context/HISTORY.md`

- [ ] **Step 1: Full build + route probe**

```bash
cd dashboard && npm run build
```
Expected: exits 0. Record the module count / JS size / gzip size from the output for the checkpoint entry.

```bash
cd dashboard && npm run dev &
sleep 4
for r in "" employees employees/new certificates profile audit units; do
  curl -s -o /dev/null -w "%{http_code} /$r\n" "http://localhost:5173/devon-landing/dashboard/$r"
done
kill %1
```
Expected: `200` for every route.

- [ ] **Step 2: Manual checklist (browser; flag for the human operator if no browser available)**

- [ ] Hard-reload an existing session → silent reseed (SEED_VERSION 4); existing employee profiles show "Buyruqdan ko'chirma" rows with seeded file names.
- [ ] `/employees/new` Step 3: submit without file → "Bu maydon majburiy" inline; `.txt` → format error; > 10 MB → size error; valid PDF → chip with name + size.
- [ ] Replace and remove (X) work; step 4 → back to step 3 keeps the chip.
- [ ] Review screen shows the file row; created employee's profile shows the row; `/audit` CREATE entry exists for the new employee.
- [ ] Mobile 360 px: chip + buttons wrap without horizontal scroll.

- [ ] **Step 3: Update `ai_context/HISTORY.md`** — add a reverse-chronological entry at the top, following the existing format. Content skeleton (fill build numbers from Step 1's output):

```markdown
## 2026-06-11 — Required "Buyruqdan ko'chirma" attachment in the employee wizard

Added the required hiring-order-extract attachment field to wizard Step 3 (Ish o'rni) per the approved spec (`docs/superpowers/specs/2026-06-11-employee-order-extract-attachment-design.md`). Metadata-only storage ({ fileName, fileSize, mimeType, uploadedAt } — no bytes, certificate convention); pick-time type/size validation (PDF/JPG/PNG, ≤ 10 MB) in the new `OrderExtractField.tsx`; zod-required gate in `step3Schema`; policy-layer enforcement via `EmployeeValidationError('order-extract-missing')` in `createEmployeeFull` (which stamps `uploadedAt` and writes the file name into the CREATE audit context). Field is immutable post-creation (excluded from `updateEmployee`'s patch type; not in `UpdateEmployeeSheet`). New rows on the review screen and the profile Info tab. Shared `formatBytes` helper extracted to `src/lib/format.ts` (B/KB/MB; certificate upload page switched to it). All 30 seeded employees carry extract metadata; `SEED_VERSION` bumped '3' → '4' (existing browsers silently reseed). Doc cascade: product-specification §User/Auth capability list, UC-17 main flow, BP-1 steps 3/9 (order extract is in-wizard pre-creation; lavozim yo'riqnomasi stays post-creation), glossary "Buyruqdan ko'chirma" entry, README profile line, prompt-set addendum in 10-flow2.

**Build state:** `npm run build` → <N> modules, <X> KB CSS, <Y> KB JS / <Z> KB gzip.

**Files touched:**
- `dashboard/src/lib/format.ts` (new)
- `dashboard/src/features/certificates/CertificateUploadPage.tsx`
- `dashboard/src/types/domain.ts`
- `dashboard/src/lib/mock-backend/schemas.ts`, `errors.ts`, `seed.ts`, `index.ts`
- `dashboard/src/features/employees/wizard/employee.schema.ts`, `wizard-store.ts`, `OrderExtractField.tsx` (new), `Step3Work.tsx`, `ReviewScreen.tsx`, `EmployeeWizardPage.tsx`
- `dashboard/src/features/employees/profile/ProfileInfoTab.tsx`
- `dashboard/src/i18n/locales/uz.json`
- `docs/product-specification.md`, `docs/use-cases.md`, `docs/business-processes.md`, `docs/glossary.md`, `README.md`, `docs/dashboard-prompts/10-flow2-employee-wizard.md`
- `ai_context/AI_CONTEXT.md`, `ai_context/HISTORY.md` (this entry)
```

- [ ] **Step 4: Update `ai_context/AI_CONTEXT.md`** — three precise edits:
  1. In the "Foundation (steps 01–06)" paragraph, update the seed-flag mention `SEED_VERSION = '3'` → `SEED_VERSION = '4'`.
  2. In the "Flow 2 part B at `/employees/new` (step 10)" paragraph, after the sentence describing Step 3 ("Ish o'rni (unit Combobox + type-filtered position Select + employment-type RadioGroup + hireDate + role)"), extend the parenthetical to include `+ required Buyruqdan ko'chirma attachment (metadata-only, PDF/JPG/PNG ≤ 10 MB)`.
  3. In the "Seed contents" paragraph, add: `every employee carries employmentOrderExtract metadata (fake hiring-order file names; no bytes)` and update the SEED_VERSION mention there if present.

- [ ] **Step 5: Commit**

```bash
git add ai_context/AI_CONTEXT.md ai_context/HISTORY.md
git commit -m "docs(ai_context): checkpoint for Buyruqdan ko'chirma attachment feature"
```

---

## Out of scope (per approved spec)

- Real file upload/storage; post-creation replacement flows; a dedicated audit action for extract changes; employee-list affordances; RU/EN translations (v1.1).
