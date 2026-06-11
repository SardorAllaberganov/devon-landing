# Design: Required "Buyruqdan ko'chirma" attachment in the add-employee wizard

**Date:** 2026-06-11
**Status:** Approved (storage approach + full design confirmed by product owner)
**Surface:** Dashboard demo SPA — `/employees/new` wizard, Step 3 "Ish o'rni"

## Requirement

Add a file-attachment field to the employee-creation wizard:

| Property | Value |
|---|---|
| Field label | Buyruqdan ko'chirma (Extract from the Employment Order) |
| Description | Upload the certified extract of the hiring order signed by the Director |
| Accepted formats | PDF, JPG, PNG |
| Status | **Required** at employee creation |

## Decisions (approved)

1. **Placement:** inline in Step 3 "Ish o'rni" (workplace step), full-width block after the hire-date/role grid. No new wizard step — `TOTAL_STEPS`, `STEP_FORM_IDS`, stepper, and review edit-jumps stay untouched.
2. **Storage: metadata only.** The mock backend persists `{ fileName, fileSize, mimeType, uploadedAt }` — never bytes — matching the certificate convention (X.509 metadata, no PFX bytes). The `File` object is discarded immediately after pick-time validation. Consequences: no localStorage-quota risk, a realistic 10 MB limit is safe, and the file is not retrievable after creation (acceptable for the demo; a real backend owns file storage).
3. **Size limit:** 10 MB (`MAX_ORDER_EXTRACT_SIZE_BYTES = 10 * 1024 * 1024`).
4. **Immutable post-creation:** not editable in `UpdateEmployeeSheet` (same lock convention as PINFL / hire-date / employment type). Replacement flows are out of scope for the demo.
5. **Seeded employees get extract metadata** so profiles don't render 30 empty rows → identity-changing seed edit → `SEED_VERSION` bumps `'3' → '4'` (existing browsers silently reseed on next load; demo-session edits are wiped — correct per `ai_context/LESSONS.md`).
6. **Policy-layer enforcement:** `createEmployeeFull` rejects a missing extract with a typed `EmployeeValidationError('order-extract-missing')` — required-ness is not UI-only.

## Detailed design

### Naming conventions

| Context | Name |
|---|---|
| Domain field on `Employee` | `employmentOrderExtract?: EmploymentOrderExtract` (optional for back-compat) |
| Domain type (`types/domain.ts`) | `EmploymentOrderExtract = { fileName: string; fileSize: number; mimeType: string; uploadedAt: string }` |
| Zod schema (`mock-backend/schemas.ts`) | `employmentOrderExtractSchema` (`.optional()` on `employeeSchema`) |
| Wizard form / store field (`WizardStep3`) | `employmentOrderExtract: { fileName; fileSize; mimeType } \| null` (no `uploadedAt` — backend stamps it) |
| i18n key segment | `order-extract` (kebab, concise) |
| Validation error code | `'order-extract-missing'` on `EmployeeValidationError` |

### Step 3 UX

- Label "Buyruqdan ko'chirma" + required `*` marker (existing visual convention).
- Hint below the control (existing `hints.*` pattern, `text-xs text-muted-foreground`):
  *"Direktor tomonidan imzolangan ishga qabul qilish buyrug'ining tasdiqlangan ko'chirmasi (PDF, JPG yoki PNG, maks. 10 MB)."*
- Picker reuses the `CertificateUploadPage` pattern: hidden `<input type="file" accept=".pdf,.jpg,.jpeg,.png" ref>` + outlined Button ("Fayl tanlash", Upload icon). The hidden input's `onChange` validates, extracts metadata, calls `setValue('employmentOrderExtract', meta, { shouldValidate: true })`, then clears `input.value` (so re-picking the same file re-fires `onChange`).
- After pick: chip with `FileText` icon + `fileName` + `formatBytes(fileSize)` + replace ("Almashtirish") and remove (icon-X with `sr-only` "O'chirish") affordances. The chip renders from **stored metadata**, not the `File` object — so it survives step navigation (store persists metadata; the `File` is gone).
- Errors render inline per wizard convention: `<p className="text-xs text-destructive">{t(error.message)}</p>`.

### Validation (two layers)

**Pick-time (component):**
- Type whitelist: `application/pdf`, `image/jpeg`, `image/png`; fall back to extension check (`.pdf/.jpg/.jpeg/.png`) when `File.type` is empty → error key `dashboard:employees.wizard.errors.order-extract-format`.
- Size ≤ `MAX_ORDER_EXTRACT_SIZE_BYTES` → `dashboard:employees.wizard.errors.order-extract-too-large`.
- On failure: `form.setError('employmentOrderExtract', { type: 'manual', message: <key> })`, field value untouched.

**Submit-time (zod, `step3Schema`):**
- `employmentOrderExtract: z.object({ fileName: z.string().min(1), fileSize: z.number().positive(), mimeType: z.string().min(1) }).nullable().refine(v => v !== null, { message: 'common:errors.required' })` — gates Next exactly like other required fields.
- Constants `MAX_ORDER_EXTRACT_SIZE_BYTES` and `ORDER_EXTRACT_MIME_TYPES` live in `employee.schema.ts` (schema layer owns validation facts).

**Create-time (mock backend):**
- `createEmployeeFull` throws `EmployeeValidationError('order-extract-missing')` when input lacks the metadata; stamps `uploadedAt: NOW()`; the CREATE audit entry gains `context: { orderExtractFileName }`.

### Data flow

```
pick file → validate type/size → { fileName, fileSize, mimeType } → RHF field
  → step-3 submit → Zustand WizardStep3 → ReviewScreen row
  → createEmployeeFull payload → Employee.employmentOrderExtract (+ uploadedAt)
  → CREATE audit context
```

`File` bytes never leave the pick handler. Nothing non-serializable enters the Zustand store (`isDirty()` JSON comparison stays valid; empty-state default is `null`).

### Display surfaces

- **ReviewScreen (step 5):** new `Row` in the Ish o'rni section — label `fields.order-extract`, value `` `${fileName} (${formatBytes(fileSize)})` `` (Row already takes strings).
- **Profile Info tab (`ProfileInfoTab.tsx`):** new read-only row "Buyruqdan ko'chirma" near hire-date, same `fileName (size)` format; `—` for any legacy row without the field (defensive; seed covers all).
- **`UpdateEmployeeSheet`:** untouched — field is locked post-creation.
- **Shared helper:** extract `formatBytes` to `dashboard/src/lib/format.ts` with B/KB/MB support (current copy is bespoke in `CertificateUploadPage` and KB-only); the certificate page switches to the shared helper.

### Seed (`seed.ts`)

- All 30 seeded employees get `employmentOrderExtract` with plausible values: file names like `buyruq_2023-45_kochirma.pdf` (ASCII, no apostrophes), mostly PDF with a few JPG/PNG, sizes ~180 KB–1.2 MB, `uploadedAt` aligned with each employee's `hireDate`.
- `SEED_VERSION: '3' → '4'`.

### i18n (uz.json only; ru/en stay stubs with UZ fallback)

| Key | UZ copy |
|---|---|
| `dashboard.employees.wizard.fields.order-extract` | Buyruqdan ko'chirma |
| `dashboard.employees.wizard.hints.order-extract` | Direktor tomonidan imzolangan ishga qabul qilish buyrug'ining tasdiqlangan ko'chirmasi (PDF, JPG yoki PNG, maks. 10 MB). |
| `dashboard.employees.wizard.actions.choose-file` | Fayl tanlash |
| `dashboard.employees.wizard.actions.replace-file` | Almashtirish |
| `dashboard.employees.wizard.actions.remove-file` | O'chirish |
| `dashboard.employees.wizard.errors.order-extract-format` | Faqat PDF, JPG yoki PNG formatdagi fayllar qabul qilinadi |
| `dashboard.employees.wizard.errors.order-extract-too-large` | Fayl hajmi 10 MB dan oshmasligi kerak |
| `dashboard.employees.profile.info.fields.order-extract` (follows the existing profile-info fields block; exact parent path confirmed at implementation) | Buyruqdan ko'chirma |

Required-empty submit reuses `common:errors.required`.

### Doc cascade (same change set)

1. `docs/product-specification.md` — employee creation now requires the certified hiring-order extract.
2. `docs/use-cases.md` UC-17 — wizard main flow gains the required upload step.
3. `docs/business-processes.md` BP-1 — clarify the two distinct attachments: **order extract = in-wizard, pre-creation (new)**; position instructions ("lavozim yo'riqnomasi") = post-creation step 9 (unchanged).
4. `docs/glossary.md` — add "Buyruqdan ko'chirma" beside the existing "Buyruq" entry.
5. `docs/dashboard-prompts/10-flow2-employee-wizard.md` — addendum so the prompt set doesn't drift from the built wizard.
6. `ai_context/AI_CONTEXT.md` + `ai_context/HISTORY.md` checkpoint at the end.

### Out of scope

- Real file upload/storage (no backend; metadata-only per master prompt §17).
- Post-creation replacement of the extract + a dedicated audit action for it.
- Attachment affordances on the employee list table.
- RU/EN translations (v1.1 roadmap).

### Verification checklist

- [ ] `tsc -b && npm run build` clean.
- [ ] Wizard manual pass: pick / replace / remove / oversize file / wrong format / submit-without-file (blocked with inline error) / happy path through review → created employee shows the row in profile.
- [ ] Step navigation away and back to Step 3 keeps the selected-file chip (metadata-driven).
- [ ] Reseed check: bumped `SEED_VERSION` reseeds an existing browser; profiles show seeded extract rows.
- [ ] Mobile spot-check (360 px): chip + buttons wrap without overflow; tap targets ≥ 44 pt.
- [ ] i18n: no hardcoded literals; all new strings via keys.
