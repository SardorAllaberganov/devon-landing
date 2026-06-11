import { z } from 'zod';

const optionalString = (max: number) =>
  z.union([z.literal(''), z.string().max(max)]).optional();

const eighteenYears = 18 * 31557600000;

export const step1Schema = z.object({
  lastName: z.string().min(1, 'common:errors.required').max(100),
  firstName: z.string().min(1, 'common:errors.required').max(100),
  middleName: optionalString(100),
  gender: z.enum(['M', 'F']),
  birthDate: z
    .union([
      z.literal(''),
      z.string().refine(
        (v) => Date.now() - new Date(v).getTime() >= eighteenYears,
        { message: 'dashboard:employees.wizard.errors.age-18' },
      ),
    ])
    .optional(),
  pinfl: z.string().regex(/^[1-6]\d{13}$/, 'common:errors.invalid-pinfl'),
  passportSeries: optionalString(20),
});

export const step2Schema = z.object({
  workPhone: optionalString(30),
  internalExtension: optionalString(10),
  mobilePhone: z
    .string()
    .regex(/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, 'common:errors.invalid-phone'),
  corporateEmail: z
    .string()
    .email('common:errors.invalid-email')
    .regex(/@devon\.uz$/i, 'common:errors.email-must-be-corporate'),
  personalEmail: z
    .union([z.literal(''), z.string().email('common:errors.invalid-email')])
    .optional(),
});

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

export const step3Schema = z.object({
  primaryUnitUuid: z.string().uuid('common:errors.required'),
  positionId: z.string().min(1, 'common:errors.required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  hireDate: z.string().min(1, 'common:errors.required'),
  role: z.enum(['ROLE_EMPLOYEE', 'ROLE_UNIT_HEAD', 'ROLE_HR_OPERATOR', 'ROLE_AUDITOR']),
  // The explicit `: boolean` return keeps TS 5.5+ from inferring a type
  // predicate, which would make zod's refine narrow the output type to
  // non-null and break the react-hook-form Resolver input/output match.
  employmentOrderExtract: orderExtractMetaSchema
    .nullable()
    .refine((v): boolean => v !== null, 'common:errors.required'),
});

export const step4Schema = z.object({
  login: z.string().min(3, 'common:errors.min-length').max(64),
  password: z
    .string()
    .min(8, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[A-Z]/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[a-z]/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/\d/, 'dashboard:employees.wizard.errors.password-weak')
    .regex(/[^A-Za-z0-9]/, 'dashboard:employees.wizard.errors.password-weak'),
  notifySms: z.boolean(),
  notifyEmail: z.boolean(),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type Step4Values = z.infer<typeof step4Schema>;

/**
 * Scores password strength on a 0–4 scale based on charclass coverage + length.
 * Used by Step 4's Progress strength meter — distinct from the zod schema's
 * pass/fail gate.
 */
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}
