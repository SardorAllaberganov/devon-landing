import { z } from 'zod';

// === Enum schemas ===

export const roleSchema = z.enum([
  'ROLE_SUPER_ADMIN',
  'ROLE_HR_ADMIN',
  'ROLE_HR_OPERATOR',
  'ROLE_UNIT_HEAD',
  'ROLE_EMPLOYEE',
  'ROLE_AUDITOR',
  'ROLE_DEVONXONA',
]);

export const unitTypeSchema = z.enum([
  'DEPARTMENT',
  'DIRECTORATE',
  'DIVISION',
  'DEPARTMENT_SUB',
  'SECTION',
  'OTHER',
]);

export const unitStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const employmentTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
]);

export const employeeStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
]);

export const genderSchema = z.enum(['M', 'F']);

export const assignmentTypeSchema = z.enum([
  'PRIMARY',
  'COMBINATION',
  'ACTING',
  'TEMPORARY',
]);

export const certStatusSchema = z.enum([
  'PENDING_APPROVAL',
  'ACTIVE',
  'EXPIRED',
  'REVOKED',
  'REJECTED',
]);

export const certTypeSchema = z.enum(['SIGNING', 'ENCRYPTION', 'BOTH']);

export const revocationReasonSchema = z.enum([
  'EXPIRED',
  'EMPLOYEE_TERMINATED',
  'COMPROMISED',
  'REPLACED',
  'MANUAL',
]);

export const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'ARCHIVE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'UNIT_TRANSFER',
  'CERTIFICATE_UPLOADED',
  'CERTIFICATE_APPROVED',
  // CERTIFICATE_REJECTED landed in the domain union during step 12 but was
  // never mirrored here — synced alongside the step-16 POV_SWITCHED addition.
  'CERTIFICATE_REJECTED',
  'CERTIFICATE_REVOKED',
  'PROFILE_CHANGE_REQUESTED',
  'PROFILE_CHANGE_APPROVED',
  'POV_SWITCHED',
  'DOCUMENT_CREATED',
  'DOCUMENT_SENT_FOR_REVIEW',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_SIGNED',
  'DOCUMENT_CLOSED',
  'DOCUMENT_VIEWED',
  'DOCUMENT_EMAILED',
  'LETTER_REGISTERED',
  'LETTER_ROUTED',
  'LETTER_ASSIGNED',
  'LETTER_EXECUTED',
  'LETTER_ACCEPTED',
  'LETTER_SIGNED',
  'LETTER_DISPATCHED',
  'LETTER_CLOSED',
]);

export const auditResourceTypeSchema = z.enum([
  'unit',
  'employee',
  'assignment',
  'certificate',
  'user',
  'profile-request',
  'document',
  'letter',
]);

// === Field validators reused across schemas + form schemas ===

export const pinflRegex = /^[1-6]\d{13}$/;
export const pinflSchema = z
  .string()
  .length(14, { message: 'common.errors.invalid-pinfl' })
  .regex(pinflRegex, { message: 'common.errors.invalid-pinfl' });

export const uzPhoneRegex = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
export const uzPhoneSchema = z
  .string()
  .regex(uzPhoneRegex, { message: 'common.errors.invalid-phone' });

export const corporateEmailSchema = z
  .string()
  .email({ message: 'common.errors.invalid-email' })
  .regex(/@devon\.uz$/i, { message: 'common.errors.email-must-be-corporate' });

// === Entity schemas ===

export const unitSchema = z.object({
  uuid: z.string().uuid(),
  nameUz: z.string().min(3).max(255),
  nameRu: z.string().optional(),
  shortName: z.string().max(50).optional(),
  code: z.string().min(2).max(40),
  type: unitTypeSchema,
  parentUuid: z.string().uuid().nullable(),
  level: z.number().int().min(0).max(6),
  path: z.string(),
  headEmployeeUuid: z.string().uuid().optional(),
  deputyEmployeeUuid: z.string().uuid().optional(),
  status: unitStatusSchema,
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
});

export const employmentOrderExtractSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  uploadedAt: z.string(),
});

export const employeeSchema = z.object({
  uuid: z.string().uuid(),
  userUuid: z.string().uuid(),
  lastName: z.string().min(1).max(100),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  fullNameGenerated: z.string(),
  gender: genderSchema,
  birthDate: z.string().optional(),
  pinfl: pinflSchema,
  passportSeries: z.string().optional(),
  workPhone: z.string().optional(),
  internalExtension: z.string().optional(),
  mobilePhone: uzPhoneSchema,
  corporateEmail: corporateEmailSchema,
  personalEmail: z.string().email().optional(),
  primaryUnitUuid: z.string().uuid(),
  positionId: z.string(),
  employmentType: employmentTypeSchema,
  hireDate: z.string(),
  employmentOrderExtract: employmentOrderExtractSchema.optional(),
  terminationDate: z.string().optional(),
  status: employeeStatusSchema,
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const assignmentSchema = z.object({
  uuid: z.string().uuid(),
  employeeUuid: z.string().uuid(),
  unitUuid: z.string().uuid(),
  positionId: z.string(),
  isPrimary: z.boolean(),
  startDate: z.string(),
  endDate: z.string().optional(),
  workloadPercent: z.number().int().min(0).max(100),
  type: assignmentTypeSchema,
  reason: z.string().optional(),
  createdAt: z.string(),
});

export const certificateSchema = z.object({
  uuid: z.string().uuid(),
  employeeUuid: z.string().uuid(),
  serialNumber: z.string(),
  thumbprint: z.string(),
  subjectPinfl: z.string(),
  subjectCommonName: z.string(),
  subjectOrganization: z.string().optional(),
  issuerName: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  keyUsage: z.array(z.string()),
  certificateType: certTypeSchema,
  status: certStatusSchema,
  rejectionReason: z.string().optional(),
  uploadedByUuid: z.string().uuid(),
  approvedByUuid: z.string().uuid().optional(),
  approvedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  revocationReason: revocationReasonSchema.optional(),
  createdAt: z.string(),
});

export const userSchema = z.object({
  uuid: z.string().uuid(),
  employeeUuid: z.string().uuid().optional(),
  email: z.string().email(),
  passwordHash: z.string(),
  roles: z.array(roleSchema),
  mustChangePassword: z.boolean(),
  passwordChangedAt: z.string().optional(),
  createdAt: z.string(),
});

export const auditEntrySchema = z.object({
  uuid: z.string().uuid(),
  actorUuid: z.string(),
  actorName: z.string(),
  action: auditActionSchema,
  resourceType: auditResourceTypeSchema,
  resourceUuid: z.string(),
  resourceLabel: z.string(),
  changes: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

export const profileChangeRequestSchema = z.object({
  uuid: z.string().uuid(),
  employeeUuid: z.string().uuid(),
  fields: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  createdAt: z.string(),
  reviewedAt: z.string().optional(),
  reviewedByUuid: z.string().uuid().optional(),
});

export const positionSchema = z.object({
  id: z.string(),
  nameUz: z.string(),
  allowedUnitTypes: z.array(unitTypeSchema),
});

export const notificationTypeSchema = z.enum([
  'DOC_REVIEW_REQUESTED',
  'DOC_DECIDED',
  'DOC_APPROVED',
  'DOC_REJECTED',
  'DOC_SIGN_REQUESTED',
  'DOC_SIGNED',
  'DOC_CLOSED',
  'LETTER_ROUTED',
  'LETTER_ASSIGNED',
  'LETTER_EXECUTED',
  'LETTER_ACCEPTED',
  'LETTER_SIGN_REQUESTED',
  'LETTER_DISPATCHED',
]);

export const appNotificationSchema = z.object({
  uuid: z.string().uuid(),
  recipientEmployeeUuid: z.string().uuid(),
  type: notificationTypeSchema,
  titleKey: z.string().min(1),
  params: z.record(z.string(), z.string()),
  resourceType: z.enum(['document', 'letter']),
  resourceUuid: z.string().uuid(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

// === Documents (milestone 2, step 17) ===

export const documentSourceSchema = z.enum(['TEMPLATE', 'UPLOAD']);

export const documentStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'REJECTED',
  'APPROVED',
  'SIGNED',
  'CLOSED',
]);

export const confidentialitySchema = z.enum(['ODDIY', 'MAXFIY']);

export const fileMetaSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  uploadedAt: z.string(),
});

export const templateFieldSchema = z.object({
  key: z.string().min(1),
  labelKey: z.string().min(1),
  kind: z.enum(['text', 'textarea', 'date', 'employee']),
  required: z.boolean(),
});

export const documentTemplateSchema = z.object({
  uuid: z.string().uuid(),
  code: z.enum(['BUYRUQ', 'XIZMAT_XATI', 'MALUMOTNOMA', 'ARIZA', 'BILDIRISHNOMA']),
  nameUz: z.string().min(1),
  descriptionUz: z.string().min(1),
  bodyTemplate: z.string().min(1),
  fields: z.array(templateFieldSchema),
});

export const documentViewRecordSchema = z.object({
  employeeUuid: z.string().uuid(),
  viewedAt: z.string(),
});

export const documentEntitySchema = z.object({
  uuid: z.string().uuid(),
  number: z.string().regex(/^HJ-2026\/\d{4}$/),
  title: z.string().min(1),
  source: documentSourceSchema,
  templateUuid: z.string().uuid().optional(),
  values: z.record(z.string(), z.string()).optional(),
  renderedBody: z.string().optional(),
  fileMeta: fileMetaSchema.optional(),
  confidentiality: confidentialitySchema,
  creatorUuid: z.string().uuid(),
  recipientUuid: z.string().uuid(),
  signerUuid: z.string().uuid().optional(),
  requiresApproval: z.boolean(),
  status: documentStatusSchema,
  round: z.number().int().min(1),
  viewedBy: z.array(documentViewRecordSchema),
  sentForReviewAt: z.string().optional(),
  approvedAt: z.string().optional(),
  signedAt: z.string().optional(),
  closedAt: z.string().optional(),
  archivedAt: z.string().optional(),
  emailedTo: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const approvalDecisionSchema = z.enum([
  'PENDING',
  'APPROVED',
  'APPROVED_WITH_COMMENT',
  'REJECTED',
]);

export const approvalStepSchema = z.object({
  uuid: z.string().uuid(),
  documentUuid: z.string().uuid(),
  round: z.number().int().min(1),
  order: z.number().int().min(1),
  employeeUuid: z.string().uuid(),
  decision: approvalDecisionSchema,
  comment: z.string().optional(),
  decidedAt: z.string().optional(),
});

export const signatureRecordSchema = z.object({
  uuid: z.string().uuid(),
  resourceType: z.enum(['document', 'letter']),
  resourceUuid: z.string().uuid(),
  employeeUuid: z.string().uuid(),
  certificateUuid: z.string().uuid(),
  algorithm: z.literal('RSA-PKCS7'),
  signatureHex: z.string().min(1),
  signedAt: z.string(),
});

// === Letters (milestone 2, step 20) ===

export const letterDirectionSchema = z.enum(['INCOMING', 'OUTGOING']);

export const letterStatusSchema = z.enum([
  'REGISTERED',
  'ROUTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'EXECUTED',
  'ON_SIGNATURE',
  'RESPONDED',
  'DISPATCHED',
  'CLOSED',
  'CLOSED_NO_RESPONSE',
]);

export const letterChannelSchema = z.enum(['POCHTA', 'EMAIL', 'KURYER', 'QOGOZ']);

export const letterSchema = z.object({
  uuid: z.string().uuid(),
  direction: letterDirectionSchema,
  number: z.string().regex(/^(K|CH)-2026\/\d{4}$/),
  externalOrg: z.string().min(1),
  subject: z.string().min(1),
  channel: letterChannelSchema,
  fileMeta: fileMetaSchema.optional(),
  receivedAt: z.string().optional(),
  deadline: z.string().optional(),
  routedToUnitUuid: z.string().uuid().optional(),
  assignedEmployeeUuid: z.string().uuid().optional(),
  requiresSignature: z.boolean(),
  executionComment: z.string().optional(),
  responseFileMeta: fileMetaSchema.optional(),
  responseDocumentUuid: z.string().uuid().optional(),
  linkedIncomingUuid: z.string().uuid().optional(),
  status: letterStatusSchema,
  registeredByUuid: z.string().uuid(),
  dispatchedAt: z.string().optional(),
  closedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
