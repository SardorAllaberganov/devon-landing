import { z } from 'zod';

// === Enum schemas ===

export const roleSchema = z.enum([
  'ROLE_SUPER_ADMIN',
  'ROLE_HR_ADMIN',
  'ROLE_HR_OPERATOR',
  'ROLE_UNIT_HEAD',
  'ROLE_EMPLOYEE',
  'ROLE_AUDITOR',
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
  'CERTIFICATE_REVOKED',
  'PROFILE_CHANGE_REQUESTED',
  'PROFILE_CHANGE_APPROVED',
]);

export const auditResourceTypeSchema = z.enum([
  'unit',
  'employee',
  'assignment',
  'certificate',
  'user',
  'profile-request',
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
