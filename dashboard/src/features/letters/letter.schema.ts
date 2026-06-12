// Form schema for Devonxona's register-incoming dialog (step 20, BPMN 3.3
// node 1). Error messages are i18n keys — the dialog renders them via t().

import { z } from 'zod';

export const MAX_SCAN_SIZE_BYTES = 10 * 1024 * 1024;
export const SCAN_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const SCAN_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

/** Pick-time metadata — the mock backend stamps `uploadedAt` itself. */
export interface ScanMeta {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const registerLetterSchema = z
  .object({
    externalOrg: z.string().trim().min(1, 'dashboard:letters.register.org-required'),
    subject: z.string().trim().min(1, 'dashboard:letters.register.subject-required'),
    channel: z.enum(['POCHTA', 'EMAIL', 'KURYER', 'QOGOZ']),
    receivedAt: z.string().min(1, 'dashboard:letters.register.received-at-required'),
    deadline: z.string(),
    requiresSignature: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // The date input carries min=today too; this backstops manual entry.
    if (values.deadline && values.deadline < todayIso()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deadline'],
        message: 'dashboard:letters.register.deadline-past',
      });
    }
  });

export type RegisterLetterFormValues = z.infer<typeof registerLetterSchema>;

/** Fresh defaults per dialog open — `receivedAt` must be *today's* today. */
export function makeRegisterLetterDefaults(): RegisterLetterFormValues {
  return {
    externalOrg: '',
    subject: '',
    channel: 'POCHTA',
    receivedAt: todayIso(),
    deadline: '',
    requiresSignature: false,
  };
}

export { todayIso };
