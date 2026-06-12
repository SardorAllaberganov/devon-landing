// Devon domain types — mirrors the HR & ERI TZ data model (master §15).
// All entity ids are `uuid` strings on the client; server-side ints are
// irrelevant for the localStorage-backed mock backend.

export type Role =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_HR_ADMIN'
  | 'ROLE_HR_OPERATOR'
  | 'ROLE_UNIT_HEAD'
  | 'ROLE_EMPLOYEE'
  | 'ROLE_AUDITOR'
  | 'ROLE_DEVONXONA';

// === Units ===

export type UnitType =
  | 'DEPARTMENT'
  | 'DIRECTORATE'
  | 'DIVISION'
  | 'DEPARTMENT_SUB'
  | 'SECTION'
  | 'OTHER';

export type UnitStatus = 'ACTIVE' | 'ARCHIVED';

export interface Unit {
  uuid: string;
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  code: string;
  type: UnitType;
  parentUuid: string | null;
  level: number;
  path: string;
  headEmployeeUuid?: string;
  deputyEmployeeUuid?: string;
  status: UnitStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// === Employees ===

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'TERMINATED';
export type Gender = 'M' | 'F';

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

export interface Employee {
  uuid: string;
  userUuid: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  fullNameGenerated: string;
  gender: Gender;
  birthDate?: string;
  pinfl: string;
  passportSeries?: string;
  workPhone?: string;
  internalExtension?: string;
  mobilePhone: string;
  corporateEmail: string;
  personalEmail?: string;
  primaryUnitUuid: string;
  positionId: string;
  employmentType: EmploymentType;
  hireDate: string;
  employmentOrderExtract?: EmploymentOrderExtract;
  terminationDate?: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// === Assignments ===

export type AssignmentType = 'PRIMARY' | 'COMBINATION' | 'ACTING' | 'TEMPORARY';

export interface Assignment {
  uuid: string;
  employeeUuid: string;
  unitUuid: string;
  positionId: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
  workloadPercent: number;
  type: AssignmentType;
  reason?: string;
  createdAt: string;
}

// === Certificates (ERI) ===

export type CertStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'REJECTED';
export type CertType = 'SIGNING' | 'ENCRYPTION' | 'BOTH';
export type RevocationReason =
  | 'EXPIRED'
  | 'EMPLOYEE_TERMINATED'
  | 'COMPROMISED'
  | 'REPLACED'
  | 'MANUAL';

export interface Certificate {
  uuid: string;
  employeeUuid: string;
  serialNumber: string;
  thumbprint: string;
  subjectPinfl: string;
  subjectCommonName: string;
  subjectOrganization?: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  keyUsage: string[];
  certificateType: CertType;
  status: CertStatus;
  rejectionReason?: string;
  uploadedByUuid: string;
  approvedByUuid?: string;
  approvedAt?: string;
  revokedAt?: string;
  revocationReason?: RevocationReason;
  createdAt: string;
}

// === Users (auth) ===

export interface User {
  uuid: string;
  employeeUuid?: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  createdAt: string;
}

// === Audit ===

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'UNIT_TRANSFER'
  | 'CERTIFICATE_UPLOADED'
  | 'CERTIFICATE_APPROVED'
  | 'CERTIFICATE_REJECTED'
  | 'CERTIFICATE_REVOKED'
  | 'PROFILE_CHANGE_REQUESTED'
  | 'PROFILE_CHANGE_APPROVED'
  | 'POV_SWITCHED';

export type AuditResourceType =
  | 'unit'
  | 'employee'
  | 'assignment'
  | 'certificate'
  | 'user'
  | 'profile-request';

export interface AuditEntry {
  uuid: string;
  actorUuid: string;
  actorName: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceUuid: string;
  resourceLabel: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  context?: Record<string, unknown>;
  createdAt: string;
}

// === Profile change requests (employee self-service) ===

export interface ProfileChangeRequest {
  uuid: string;
  employeeUuid: string;
  fields: Record<string, { from: unknown; to: unknown }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedByUuid?: string;
}

// === Positions (seeded catalogue, not user-created in the demo) ===

export interface Position {
  id: string;
  nameUz: string;
  allowedUnitTypes: UnitType[];
}

// === Notifications (milestone 2, master §15) ===

export type NotificationType =
  | 'DOC_REVIEW_REQUESTED'
  | 'DOC_DECIDED'
  | 'DOC_APPROVED'
  | 'DOC_REJECTED'
  | 'DOC_SIGN_REQUESTED'
  | 'DOC_SIGNED'
  | 'DOC_CLOSED'
  | 'LETTER_ROUTED'
  | 'LETTER_ASSIGNED'
  | 'LETTER_EXECUTED'
  | 'LETTER_ACCEPTED'
  | 'LETTER_SIGN_REQUESTED'
  | 'LETTER_DISPATCHED';

// Named AppNotification because `Notification` collides with lib.dom's global type.
export interface AppNotification {
  uuid: string;
  recipientEmployeeUuid: string;
  type: NotificationType;
  /** Fully-qualified i18n key (`dashboard:notifications.title.*`) — body text is NEVER stored as a literal. */
  titleKey: string;
  /** Interpolation values: docNumber, letterNumber, actorName, … */
  params: Record<string, string>;
  resourceType: 'document' | 'letter';
  resourceUuid: string;
  isRead: boolean;
  createdAt: string;
}
