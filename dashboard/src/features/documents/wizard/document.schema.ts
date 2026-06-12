import { z } from 'zod';

import type { DocumentTemplate } from '@/types/domain';

// Uploaded document file — same metadata-only convention as the employee
// wizard's "Buyruqdan ko'chirma" (no bytes stored). The schema layer owns
// these facts so the picker and any future consumer share one source of truth.
export const MAX_DOC_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const DOC_FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export const DOC_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const docFileMetaSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
});
export type DocFileMeta = z.infer<typeof docFileMetaSchema>;

/**
 * Step 2 schema is built dynamically from the selected template's
 * `TemplateField[]` — one string entry per placeholder under `values`,
 * required flags taken from the field definition. UPLOAD documents (or a
 * not-yet-loaded template) get an empty `values` object. The wizard mounts
 * the step-2 form only after the template has resolved, so the resolver never
 * needs to swap mid-flight.
 */
export function buildStep2Schema(template: DocumentTemplate | null) {
  // Typed as ZodString (not ZodType<string>) so both the schema's input and
  // output sides infer Record<string, string> — ZodType<string> leaves the
  // input side `unknown`, which breaks the react-hook-form Resolver match.
  const valueShape: Record<string, z.ZodString> = {};
  for (const field of template?.fields ?? []) {
    valueShape[field.key] = field.required
      ? z.string().min(1, 'common:errors.required')
      : z.string();
  }
  return z.object({
    title: z.string().min(1, 'common:errors.required').max(200, 'common:errors.max-length'),
    recipientUuid: z.string().min(1, 'common:errors.required'),
    /** Empty string = "ERI imzo talab qilinmaydi" (acceptance branch). */
    signerUuid: z.string(),
    confidentiality: z.enum(['ODDIY', 'MAXFIY']),
    values: z.object(valueShape),
  });
}

export type Step2Values = z.infer<ReturnType<typeof buildStep2Schema>>;
