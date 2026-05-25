import { z } from 'zod';

const optionalString = (max: number) =>
  z.union([z.literal(''), z.string().max(max)]).optional();

export const unitFormSchema = z.object({
  nameUz: z
    .string()
    .min(3, 'common:errors.min-length')
    .max(255, 'common:errors.max-length'),
  shortName: optionalString(50),
  code: z
    .union([
      z.literal(''),
      z.string().regex(/^[A-Z0-9-]{2,20}$/i, 'dashboard:units.errors.invalid-code'),
    ])
    .optional(),
  type: z.enum(['DEPARTMENT', 'DIRECTORATE', 'DIVISION', 'DEPARTMENT_SUB', 'SECTION', 'OTHER']),
  parentUuid: z.string().uuid().nullable(),
  description: optionalString(1000),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;
