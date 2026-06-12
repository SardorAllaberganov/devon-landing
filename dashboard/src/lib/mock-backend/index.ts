// Public mock-backend API. Each read does a `simulatedDelay()`; each
// mutation does `simulatedDelay()` → `maybeFail()` → read-modify-write
// → `appendAudit()`. All entities are persisted to the namespaced
// localStorage tables defined in `./storage.ts`.

import { simulatedDelay } from './delay';
import {
  AssignmentValidationError,
  CertificateValidationError,
  DocumentValidationError,
  EmployeeValidationError,
  LetterValidationError,
  maybeFail,
  PasswordValidationError,
  UnitValidationError,
} from './errors';
import { readTable, writeTable, Tables } from './storage';
import { renderTemplate } from '@/features/documents/renderTemplate';

// Max nesting depth for the org tree (TZ §3.3 caps real hierarchies at 7).
const MAX_UNIT_DEPTH = 7;

function nameClashesWithSibling(
  units: Unit[],
  parentUuid: string | null,
  name: string,
  ignoreUuid?: string,
): boolean {
  const lc = name.trim().toLowerCase();
  return units.some(
    (u) =>
      u.uuid !== ignoreUuid &&
      u.parentUuid === parentUuid &&
      u.status === 'ACTIVE' &&
      u.nameUz.trim().toLowerCase() === lc,
  );
}
import { sha256Hex } from '@/lib/hash';
import type {
  AppNotification,
  ApprovalDecision,
  ApprovalStep,
  Assignment,
  AuditAction,
  AuditEntry,
  AuditResourceType,
  Certificate,
  Confidentiality,
  DocumentEntity,
  DocumentSource,
  DocumentStatus,
  DocumentTemplate,
  Employee,
  EmploymentOrderExtract,
  FileMeta,
  Letter,
  LetterChannel,
  LetterDirection,
  LetterStatus,
  NotificationType,
  Position,
  ProfileChangeRequest,
  SignatureRecord,
  Unit,
  User,
} from '@/types/domain';

const uid = () => crypto.randomUUID();
const NOW = () => new Date().toISOString();

// === Internal helpers ===

function readUnits(): Unit[] {
  return readTable<Unit>(Tables.units, []);
}
function readEmployees(): Employee[] {
  return readTable<Employee>(Tables.employees, []);
}
function readAssignments(): Assignment[] {
  return readTable<Assignment>(Tables.assignments, []);
}
function readCertificates(): Certificate[] {
  return readTable<Certificate>(Tables.certificates, []);
}
function readUsers(): User[] {
  return readTable<User>(Tables.users, []);
}
function readProfileRequests(): ProfileChangeRequest[] {
  return readTable<ProfileChangeRequest>(Tables.profileRequests, []);
}
function readNotifications(): AppNotification[] {
  return readTable<AppNotification>(Tables.notifications, []);
}

function actorNameFor(actorUuid: string): string {
  const user = readUsers().find((u) => u.uuid === actorUuid);
  if (!user?.employeeUuid) return user?.email ?? 'System';
  return (
    readEmployees().find((e) => e.uuid === user.employeeUuid)?.fullNameGenerated ??
    user.email
  );
}

// === Audit (internal + exported) ===

export interface AuditInput {
  actorUuid: string;
  actorName?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceUuid: string;
  resourceLabel: string;
  changes?: AuditEntry['changes'];
  context?: AuditEntry['context'];
}

export async function appendAudit(entry: AuditInput): Promise<void> {
  const audit = readTable<AuditEntry>(Tables.audit, []);
  audit.push({
    uuid: uid(),
    createdAt: NOW(),
    actorName: entry.actorName ?? actorNameFor(entry.actorUuid),
    actorUuid: entry.actorUuid,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceUuid: entry.resourceUuid,
    resourceLabel: entry.resourceLabel,
    changes: entry.changes,
    context: entry.context,
  });
  writeTable(Tables.audit, audit);
}

// === Reads — units ===

export async function listUnits(): Promise<Unit[]> {
  await simulatedDelay();
  return readUnits();
}

export async function getUnit(uuid: string): Promise<Unit | null> {
  await simulatedDelay();
  return readUnits().find((u) => u.uuid === uuid) ?? null;
}

// === Reads — employees ===

export interface EmployeeFilters {
  search?: string;
  unitUuid?: string;
  status?: Employee['status'];
  positionId?: string;
}

export async function listEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  await simulatedDelay();
  let rows = readEmployees();
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.fullNameGenerated.toLowerCase().includes(q) ||
        r.corporateEmail.toLowerCase().includes(q) ||
        r.pinfl.includes(q),
    );
  }
  if (filters?.unitUuid) rows = rows.filter((r) => r.primaryUnitUuid === filters.unitUuid);
  if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters?.positionId) rows = rows.filter((r) => r.positionId === filters.positionId);
  return rows;
}

export async function getEmployee(uuid: string): Promise<Employee | null> {
  await simulatedDelay();
  return readEmployees().find((e) => e.uuid === uuid) ?? null;
}

// === Reads — assignments ===

export async function listAssignments(employeeUuid?: string): Promise<Assignment[]> {
  await simulatedDelay();
  const rows = readAssignments();
  return employeeUuid ? rows.filter((r) => r.employeeUuid === employeeUuid) : rows;
}

// === Reads — certificates ===

export interface CertificateFilters {
  status?: Certificate['status'];
  employeeUuid?: string;
}

export async function listCertificates(filters?: CertificateFilters): Promise<Certificate[]> {
  await simulatedDelay();
  let rows = readCertificates();
  if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters?.employeeUuid) rows = rows.filter((r) => r.employeeUuid === filters.employeeUuid);
  return rows;
}

// === Reads — audit ===

export interface AuditFilters {
  resourceType?: AuditEntry['resourceType'];
  resourceUuid?: string;
  actorUuid?: string;
  /** Inclusive lower bound (ISO date or datetime string). */
  dateFrom?: string;
  /** Inclusive upper bound (ISO date or datetime string). */
  dateTo?: string;
  limit?: number;
}

export async function listAudit(filters?: AuditFilters): Promise<AuditEntry[]> {
  await simulatedDelay();
  let rows = readTable<AuditEntry>(Tables.audit, []);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.resourceType) rows = rows.filter((r) => r.resourceType === filters.resourceType);
  if (filters?.resourceUuid) rows = rows.filter((r) => r.resourceUuid === filters.resourceUuid);
  if (filters?.actorUuid) rows = rows.filter((r) => r.actorUuid === filters.actorUuid);
  if (filters?.dateFrom) {
    const from = filters.dateFrom;
    rows = rows.filter((r) => r.createdAt >= from);
  }
  if (filters?.dateTo) {
    // Date inputs yield `YYYY-MM-DD`; treat the upper bound as inclusive
    // through end-of-day so a same-day pick still returns rows from that day.
    const to =
      filters.dateTo.length === 10 ? `${filters.dateTo}T23:59:59.999Z` : filters.dateTo;
    rows = rows.filter((r) => r.createdAt <= to);
  }
  if (filters?.limit) rows = rows.slice(0, filters.limit);
  return rows;
}

// === Reads — positions ===

export async function listPositions(): Promise<Position[]> {
  await simulatedDelay();
  return readTable<Position>(Tables.positions, []);
}

// === Reads — users ===

export async function findUserByEmail(email: string): Promise<User | null> {
  await simulatedDelay();
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Resolve the user (auth/roles) row backing an employee — used by the POV switcher. */
export async function findUserByEmployee(employeeUuid: string): Promise<User | null> {
  await simulatedDelay();
  return readUsers().find((u) => u.employeeUuid === employeeUuid) ?? null;
}

// === Reads — profile change requests ===

export async function listProfileRequests(
  status?: ProfileChangeRequest['status'],
): Promise<ProfileChangeRequest[]> {
  await simulatedDelay();
  let rows = readProfileRequests();
  if (status) rows = rows.filter((r) => r.status === status);
  return rows;
}

// === Notifications (milestone 2) ===

export type NotificationInput = Omit<AppNotification, 'uuid' | 'isRead' | 'createdAt'>;

/**
 * Internal mutation-surface helper (like `appendAudit`): milestone-2
 * mutations call this on every BPMN state transition. Deliberately NO
 * `maybeFail()` and no simulated latency — a notification must never be
 * the flaky part of the mutation it rides on. Unshifts to the front so
 * the table stays newest-first.
 */
export async function appendNotification(input: NotificationInput): Promise<AppNotification> {
  const notifications = readNotifications();
  const notification: AppNotification = {
    ...input,
    uuid: uid(),
    isRead: false,
    createdAt: NOW(),
  };
  notifications.unshift(notification);
  writeTable(Tables.notifications, notifications);
  return notification;
}

export async function listNotifications(
  recipientEmployeeUuid: string,
  opts?: { unreadOnly?: boolean },
): Promise<AppNotification[]> {
  await simulatedDelay();
  let rows = readNotifications().filter(
    (n) => n.recipientEmployeeUuid === recipientEmployeeUuid,
  );
  if (opts?.unreadOnly) rows = rows.filter((n) => !n.isRead);
  // Table is kept newest-first by appendNotification; re-sort defensively
  // since seeded rows carry hand-spread timestamps.
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return rows;
}

export async function markNotificationRead(uuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const notifications = readNotifications();
  const idx = notifications.findIndex((n) => n.uuid === uuid);
  if (idx === -1) return;
  notifications[idx] = { ...notifications[idx]!, isRead: true };
  writeTable(Tables.notifications, notifications);
}

export async function markAllNotificationsRead(recipientEmployeeUuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const notifications = readNotifications().map((n) =>
    n.recipientEmployeeUuid === recipientEmployeeUuid && !n.isRead
      ? { ...n, isRead: true }
      : n,
  );
  writeTable(Tables.notifications, notifications);
}

// === Mutations — units ===

export interface CreateUnitInput {
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  code: string;
  type: Unit['type'];
  parentUuid: string | null;
  description?: string;
}

export async function createUnit(input: CreateUnitInput, actorUuid: string): Promise<Unit> {
  await simulatedDelay();
  maybeFail();
  const units = readUnits();
  const parent = input.parentUuid ? units.find((u) => u.uuid === input.parentUuid) : null;
  if (input.parentUuid && !parent) throw new UnitValidationError('invalid-parent');
  const level = parent ? parent.level + 1 : 0;
  if (level >= MAX_UNIT_DEPTH) throw new UnitValidationError('max-depth');
  if (nameClashesWithSibling(units, input.parentUuid, input.nameUz)) {
    throw new UnitValidationError('duplicate-name');
  }
  const newUnit: Unit = {
    uuid: uid(),
    nameUz: input.nameUz,
    nameRu: input.nameRu,
    shortName: input.shortName,
    code: input.code,
    type: input.type,
    parentUuid: input.parentUuid,
    level,
    path: '',
    status: 'ACTIVE',
    description: input.description,
    createdAt: NOW(),
    updatedAt: NOW(),
    createdBy: actorUuid,
    updatedBy: actorUuid,
  };
  newUnit.path = parent ? `${parent.path}${newUnit.uuid}/` : `/${newUnit.uuid}/`;
  units.push(newUnit);
  writeTable(Tables.units, units);
  await appendAudit({
    actorUuid,
    action: 'CREATE',
    resourceType: 'unit',
    resourceUuid: newUnit.uuid,
    resourceLabel: newUnit.nameUz,
  });
  return newUnit;
}

export async function updateUnit(
  uuid: string,
  patch: Partial<Omit<Unit, 'uuid' | 'createdAt' | 'createdBy' | 'level' | 'path'>>,
  actorUuid: string,
): Promise<Unit> {
  await simulatedDelay();
  maybeFail();
  const units = readUnits();
  const idx = units.findIndex((u) => u.uuid === uuid);
  if (idx === -1) throw new Error(`Unit not found: ${uuid}`);
  const before = units[idx]!;

  const parentChanging =
    Object.prototype.hasOwnProperty.call(patch, 'parentUuid') &&
    patch.parentUuid !== before.parentUuid;
  const newParentUuid = parentChanging ? (patch.parentUuid ?? null) : before.parentUuid;

  if (parentChanging && newParentUuid) {
    if (newParentUuid === uuid) throw new UnitValidationError('cycle');
    const newParent = units.find((u) => u.uuid === newParentUuid);
    if (!newParent) throw new UnitValidationError('invalid-parent');
    // Descendant detection: any unit whose path passes through `uuid` is a
    // descendant (paths look like `/root/.../uuid/.../leaf/`).
    if (newParent.path.includes(`/${uuid}/`)) throw new UnitValidationError('cycle');
    const newLevel = newParent.level + 1;
    if (newLevel >= MAX_UNIT_DEPTH) throw new UnitValidationError('max-depth');
  }

  const newName = patch.nameUz ?? before.nameUz;
  const nameChanging = newName !== before.nameUz;
  if ((parentChanging || nameChanging) && nameClashesWithSibling(units, newParentUuid, newName, uuid)) {
    throw new UnitValidationError('duplicate-name');
  }

  const updated: Unit = {
    ...before,
    ...patch,
    parentUuid: newParentUuid,
    updatedAt: NOW(),
    updatedBy: actorUuid,
  };

  // Re-derive level + path for self and descendants when the parent moves.
  if (parentChanging) {
    const newParent = newParentUuid ? units.find((u) => u.uuid === newParentUuid) ?? null : null;
    updated.level = newParent ? newParent.level + 1 : 0;
    updated.path = newParent ? `${newParent.path}${uuid}/` : `/${uuid}/`;
    const oldPathFragment = before.path; // ends with `/${uuid}/`
    for (const descendant of units) {
      if (descendant.uuid === uuid) continue;
      if (!descendant.path.startsWith(oldPathFragment)) continue;
      const remainder = descendant.path.slice(oldPathFragment.length);
      const rewritten = `${updated.path}${remainder}`;
      descendant.path = rewritten;
      descendant.level = rewritten.split('/').filter(Boolean).length - 1;
      descendant.updatedAt = NOW();
      descendant.updatedBy = actorUuid;
      if (descendant.level >= MAX_UNIT_DEPTH) {
        throw new UnitValidationError('max-depth');
      }
    }
  }

  units[idx] = updated;
  writeTable(Tables.units, units);
  await appendAudit({
    actorUuid,
    action: 'UPDATE',
    resourceType: 'unit',
    resourceUuid: uuid,
    resourceLabel: updated.nameUz,
  });
  return updated;
}

export async function archiveUnit(uuid: string, actorUuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const units = readUnits();
  const idx = units.findIndex((u) => u.uuid === uuid);
  if (idx === -1) throw new Error(`Unit not found: ${uuid}`);
  units[idx] = { ...units[idx]!, status: 'ARCHIVED', updatedAt: NOW(), updatedBy: actorUuid };
  writeTable(Tables.units, units);
  await appendAudit({
    actorUuid,
    action: 'ARCHIVE',
    resourceType: 'unit',
    resourceUuid: uuid,
    resourceLabel: units[idx]!.nameUz,
  });
}

// === Mutations — employees ===

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

export async function createEmployeeFull(
  input: CreateEmployeeFullInput,
  actorUuid: string,
): Promise<{ employee: Employee; user: User; assignment: Assignment }> {
  await simulatedDelay();
  maybeFail();
  const employees = readEmployees();
  const users = readUsers();
  const assignments = readAssignments();

  const e = input.employee;

  // The certified hiring-order extract is required before the profile can be
  // created. Enforced here (policy layer), not just by the wizard UI.
  if (!input.orderExtract?.fileName) {
    throw new EmployeeValidationError('order-extract-missing');
  }

  // Uniqueness checks per TZ §4.4 — fail before any writes so a partial
  // create can't strand orphan records.
  if (employees.some((x) => x.pinfl === e.pinfl && x.status !== 'TERMINATED')) {
    throw new EmployeeValidationError('pinfl-taken');
  }
  const emailLc = e.corporateEmail.toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === emailLc)) {
    throw new EmployeeValidationError('email-taken');
  }

  const employeeUuid = uid();
  const userUuid = uid();
  const fullNameGenerated = [e.lastName, e.firstName, e.middleName].filter(Boolean).join(' ');

  const employee: Employee = {
    ...e,
    uuid: employeeUuid,
    userUuid,
    fullNameGenerated,
    employmentOrderExtract: { ...input.orderExtract, uploadedAt: NOW() },
    status: 'ACTIVE',
    createdAt: NOW(),
    updatedAt: NOW(),
  };
  const user: User = {
    uuid: userUuid,
    employeeUuid,
    email: e.corporateEmail,
    passwordHash: await sha256Hex(input.password),
    roles: [input.role],
    mustChangePassword: true,
    createdAt: NOW(),
  };
  const assignment: Assignment = {
    uuid: uid(),
    employeeUuid,
    unitUuid: e.primaryUnitUuid,
    positionId: e.positionId,
    isPrimary: true,
    startDate: e.hireDate,
    workloadPercent: 100,
    type: 'PRIMARY',
    createdAt: NOW(),
  };

  employees.push(employee);
  users.push(user);
  assignments.push(assignment);
  writeTable(Tables.employees, employees);
  writeTable(Tables.users, users);
  writeTable(Tables.assignments, assignments);

  await appendAudit({
    actorUuid,
    action: 'CREATE',
    resourceType: 'employee',
    resourceUuid: employeeUuid,
    resourceLabel: fullNameGenerated,
    context: { orderExtractFileName: input.orderExtract.fileName },
  });

  return { employee, user, assignment };
}

export async function updateEmployee(
  uuid: string,
  // employmentOrderExtract is immutable post-creation (legal document signed
  // at hire time) — same lock as PINFL.
  patch: Partial<
    Omit<Employee, 'uuid' | 'userUuid' | 'createdAt' | 'fullNameGenerated' | 'employmentOrderExtract'>
  >,
  actorUuid: string,
): Promise<Employee> {
  await simulatedDelay();
  maybeFail();
  const employees = readEmployees();
  const idx = employees.findIndex((e) => e.uuid === uuid);
  if (idx === -1) throw new Error(`Employee not found: ${uuid}`);
  const before = employees[idx]!;
  const next: Employee = {
    ...before,
    ...patch,
    fullNameGenerated: [
      patch.lastName ?? before.lastName,
      patch.firstName ?? before.firstName,
      patch.middleName ?? before.middleName,
    ]
      .filter(Boolean)
      .join(' '),
    updatedAt: NOW(),
  };
  employees[idx] = next;
  writeTable(Tables.employees, employees);
  await appendAudit({
    actorUuid,
    action: 'UPDATE',
    resourceType: 'employee',
    resourceUuid: uuid,
    resourceLabel: next.fullNameGenerated,
  });
  return next;
}

export async function terminateEmployee(uuid: string, actorUuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const employees = readEmployees();
  const idx = employees.findIndex((e) => e.uuid === uuid);
  if (idx === -1) throw new Error(`Employee not found: ${uuid}`);
  const target = employees[idx]!;
  employees[idx] = {
    ...target,
    status: 'TERMINATED',
    terminationDate: NOW(),
    updatedAt: NOW(),
  };
  writeTable(Tables.employees, employees);

  // Cascade: revoke all active certificates for this employee
  const certs = readCertificates();
  let changed = false;
  for (let i = 0; i < certs.length; i++) {
    const cert = certs[i]!;
    if (cert.employeeUuid === uuid && cert.status === 'ACTIVE') {
      certs[i] = {
        ...cert,
        status: 'REVOKED',
        revokedAt: NOW(),
        revocationReason: 'EMPLOYEE_TERMINATED',
      };
      changed = true;
      await appendAudit({
        actorUuid,
        action: 'CERTIFICATE_REVOKED',
        resourceType: 'certificate',
        resourceUuid: cert.uuid,
        resourceLabel: `ERI · ${target.fullNameGenerated}`,
        context: { reason: 'EMPLOYEE_TERMINATED' },
      });
    }
  }
  if (changed) writeTable(Tables.certificates, certs);

  await appendAudit({
    actorUuid,
    action: 'UPDATE',
    resourceType: 'employee',
    resourceUuid: uuid,
    resourceLabel: target.fullNameGenerated,
    context: { status: 'TERMINATED' },
  });
}

// === Mutations — assignments / transfers ===

export interface TransferInput {
  employeeUuid: string;
  newUnitUuid: string;
  newPositionId: string;
  startDate: string;
  workloadPercent: number;
  type: Assignment['type'];
  closeOldAssignment: boolean;
  reason?: string;
}

export const MAX_TOTAL_WORKLOAD_PERCENT = 150;

export async function transferEmployee(
  input: TransferInput,
  actorUuid: string,
): Promise<Assignment> {
  await simulatedDelay();
  maybeFail();
  const assignments = readAssignments();

  const activeForEmployee = assignments.filter(
    (a) => a.employeeUuid === input.employeeUuid && !a.endDate,
  );
  // If we're closing the old assignment(s), their workload drops out of the
  // sum. Otherwise the new assignment stacks on top of every existing active
  // row and the combined total must respect the per-employee cap.
  const carriedWorkload = input.closeOldAssignment
    ? 0
    : activeForEmployee.reduce((sum, a) => sum + a.workloadPercent, 0);
  if (carriedWorkload + input.workloadPercent > MAX_TOTAL_WORKLOAD_PERCENT) {
    throw new AssignmentValidationError('workload-exceeded');
  }

  // Capture the "before" state so the audit entry can carry a real diff.
  const previousPrimary = activeForEmployee.find((a) => a.isPrimary);
  const previousUnitUuid = previousPrimary?.unitUuid;
  const previousPositionId = previousPrimary?.positionId;

  if (input.closeOldAssignment) {
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i]!;
      if (a.employeeUuid === input.employeeUuid && !a.endDate) {
        assignments[i] = { ...a, endDate: input.startDate, isPrimary: false };
      }
    }
  } else if (input.type === 'PRIMARY') {
    // Promoting a new PRIMARY while keeping the old row open — the old row
    // must lose its `isPrimary` flag so we never persist two open primaries.
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i]!;
      if (a.employeeUuid === input.employeeUuid && a.isPrimary && !a.endDate) {
        assignments[i] = { ...a, isPrimary: false };
      }
    }
  }

  const newAssignment: Assignment = {
    uuid: uid(),
    employeeUuid: input.employeeUuid,
    unitUuid: input.newUnitUuid,
    positionId: input.newPositionId,
    isPrimary: input.type === 'PRIMARY' || input.closeOldAssignment,
    startDate: input.startDate,
    workloadPercent: input.workloadPercent,
    type: input.type,
    reason: input.reason,
    createdAt: NOW(),
  };
  assignments.push(newAssignment);
  writeTable(Tables.assignments, assignments);

  // Update employee's primaryUnitUuid + positionId if this is the new primary
  if (newAssignment.isPrimary) {
    const employees = readEmployees();
    const idx = employees.findIndex((e) => e.uuid === input.employeeUuid);
    if (idx !== -1) {
      employees[idx] = {
        ...employees[idx]!,
        primaryUnitUuid: input.newUnitUuid,
        positionId: input.newPositionId,
        updatedAt: NOW(),
      };
      writeTable(Tables.employees, employees);
    }
  }

  const emp = readEmployees().find((e) => e.uuid === input.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'UNIT_TRANSFER',
    resourceType: 'employee',
    resourceUuid: input.employeeUuid,
    resourceLabel: emp?.fullNameGenerated ?? input.employeeUuid,
    changes: {
      unit: { from: previousUnitUuid ?? null, to: input.newUnitUuid },
      position: { from: previousPositionId ?? null, to: input.newPositionId },
    },
    context: {
      assignmentType: input.type,
      workloadPercent: input.workloadPercent,
      closedOld: input.closeOldAssignment,
      reason: input.reason,
    },
  });
  return newAssignment;
}

// === Mutations — certificates ===

export interface UploadCertificateInput {
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
  certificateType: Certificate['certificateType'];
  autoApprove?: boolean;
}

export async function uploadCertificate(
  input: UploadCertificateInput,
  actorUuid: string,
): Promise<Certificate> {
  await simulatedDelay();
  maybeFail();
  const certs = readCertificates();

  // TZ §6.2 — sertifikat egasining JSHShIRi xodimning JSHShIRiga teng bo'lishi shart.
  const employee = readEmployees().find((e) => e.uuid === input.employeeUuid);
  if (employee && employee.pinfl !== input.subjectPinfl) {
    throw new CertificateValidationError('pinfl-mismatch');
  }
  // Serial-uniqueness across the whole certs table (case-insensitive).
  const serialLc = input.serialNumber.toLowerCase();
  if (certs.some((c) => c.serialNumber.toLowerCase() === serialLc)) {
    throw new CertificateValidationError('serial-taken');
  }

  const cert: Certificate = {
    uuid: uid(),
    employeeUuid: input.employeeUuid,
    serialNumber: input.serialNumber,
    thumbprint: input.thumbprint,
    subjectPinfl: input.subjectPinfl,
    subjectCommonName: input.subjectCommonName,
    subjectOrganization: input.subjectOrganization,
    issuerName: input.issuerName,
    validFrom: input.validFrom,
    validTo: input.validTo,
    keyUsage: input.keyUsage,
    certificateType: input.certificateType,
    status: input.autoApprove ? 'ACTIVE' : 'PENDING_APPROVAL',
    uploadedByUuid: actorUuid,
    approvedByUuid: input.autoApprove ? actorUuid : undefined,
    approvedAt: input.autoApprove ? NOW() : undefined,
    createdAt: NOW(),
  };
  certs.push(cert);
  writeTable(Tables.certificates, certs);

  const label = `ERI · ${employee?.fullNameGenerated ?? input.employeeUuid}`;
  await appendAudit({
    actorUuid,
    action: 'CERTIFICATE_UPLOADED',
    resourceType: 'certificate',
    resourceUuid: cert.uuid,
    resourceLabel: label,
  });
  if (input.autoApprove) {
    await appendAudit({
      actorUuid,
      action: 'CERTIFICATE_APPROVED',
      resourceType: 'certificate',
      resourceUuid: cert.uuid,
      resourceLabel: label,
    });
  }
  return cert;
}

export async function approveCertificate(
  uuid: string,
  actorUuid: string,
): Promise<Certificate> {
  await simulatedDelay();
  maybeFail();
  const certs = readCertificates();
  const idx = certs.findIndex((c) => c.uuid === uuid);
  if (idx === -1) throw new Error(`Certificate not found: ${uuid}`);
  const updated: Certificate = {
    ...certs[idx]!,
    status: 'ACTIVE',
    approvedByUuid: actorUuid,
    approvedAt: NOW(),
  };
  // Reorder: pull the cert out of its existing slot and prepend so it
  // surfaces at the TOP of the destination column. Without the reorder,
  // listCertificates would keep returning the cert in its original
  // insertion position — the optimistic UI's "card lands at the top"
  // would visually snap back to the middle of the column after reload.
  certs.splice(idx, 1);
  certs.unshift(updated);
  writeTable(Tables.certificates, certs);
  const emp = readEmployees().find((e) => e.uuid === updated.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'CERTIFICATE_APPROVED',
    resourceType: 'certificate',
    resourceUuid: uuid,
    resourceLabel: `ERI · ${emp?.fullNameGenerated ?? updated.employeeUuid}`,
  });
  return updated;
}

export async function rejectCertificate(
  uuid: string,
  reason: string,
  actorUuid: string,
): Promise<Certificate> {
  await simulatedDelay();
  maybeFail();
  const certs = readCertificates();
  const idx = certs.findIndex((c) => c.uuid === uuid);
  if (idx === -1) throw new Error(`Certificate not found: ${uuid}`);
  const updated: Certificate = {
    ...certs[idx]!,
    status: 'REJECTED',
    rejectionReason: reason,
  };
  certs[idx] = updated;
  writeTable(Tables.certificates, certs);
  const emp = readEmployees().find((e) => e.uuid === updated.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'CERTIFICATE_REJECTED',
    resourceType: 'certificate',
    resourceUuid: uuid,
    resourceLabel: `ERI · ${emp?.fullNameGenerated ?? updated.employeeUuid}`,
    context: { reason },
  });
  return updated;
}

/**
 * Persist a new display order for certificates. UI-cosmetic operation
 * (no audit entry): the order in the table drives the column rendering
 * order in CertificatesPage, so writing the reordered array makes the
 * within-column drag-and-drop reorder stick across reload.
 *
 * Any cert UUIDs not present in `orderedUuids` (e.g. seeded between the
 * UI read and write) are appended at the end so we never drop rows.
 */
export async function reorderCertificates(orderedUuids: string[]): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const certs = readCertificates();
  const byUuid = new Map(certs.map((c) => [c.uuid, c]));
  const reordered: Certificate[] = [];
  for (const id of orderedUuids) {
    const cert = byUuid.get(id);
    if (cert) {
      reordered.push(cert);
      byUuid.delete(id);
    }
  }
  for (const remaining of byUuid.values()) reordered.push(remaining);
  writeTable(Tables.certificates, reordered);
}

export async function revokeCertificate(
  uuid: string,
  reason: Certificate['revocationReason'],
  actorUuid: string,
): Promise<Certificate> {
  await simulatedDelay();
  maybeFail();
  const certs = readCertificates();
  const idx = certs.findIndex((c) => c.uuid === uuid);
  if (idx === -1) throw new Error(`Certificate not found: ${uuid}`);
  const updated: Certificate = {
    ...certs[idx]!,
    status: 'REVOKED',
    revokedAt: NOW(),
    revocationReason: reason,
  };
  // Reorder (see approveCertificate for rationale): prepend so the revoked
  // cert surfaces at the TOP of the REVOKED column, matching the optimistic
  // visual move from the drag-and-drop flow.
  certs.splice(idx, 1);
  certs.unshift(updated);
  writeTable(Tables.certificates, certs);
  const emp = readEmployees().find((e) => e.uuid === updated.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'CERTIFICATE_REVOKED',
    resourceType: 'certificate',
    resourceUuid: uuid,
    resourceLabel: `ERI · ${emp?.fullNameGenerated ?? updated.employeeUuid}`,
    context: { reason },
  });
  return updated;
}

// === Mutations — profile change requests + password ===

export interface SubmitProfileChangeInput {
  employeeUuid: string;
  fields: Record<string, { from: unknown; to: unknown }>;
}

/**
 * File a profile-change request for asynchronous HR review (TZ §4.6). Used
 * by `ROLE_EMPLOYEE` whose self-edits don't auto-apply. HR_ADMIN's own
 * edits skip this path and call `updateEmployee` directly.
 */
export async function submitProfileChangeRequest(
  input: SubmitProfileChangeInput,
  actorUuid: string,
): Promise<ProfileChangeRequest> {
  await simulatedDelay();
  maybeFail();
  const requests = readProfileRequests();
  const employee = readEmployees().find((e) => e.uuid === input.employeeUuid);
  const request: ProfileChangeRequest = {
    uuid: uid(),
    employeeUuid: input.employeeUuid,
    fields: input.fields,
    status: 'PENDING',
    createdAt: NOW(),
  };
  requests.push(request);
  writeTable(Tables.profileRequests, requests);
  await appendAudit({
    actorUuid,
    action: 'PROFILE_CHANGE_REQUESTED',
    resourceType: 'profile-request',
    resourceUuid: request.uuid,
    resourceLabel: employee?.fullNameGenerated ?? input.employeeUuid,
    changes: input.fields,
  });
  return request;
}

/**
 * HR review of a pending profile-change request. APPROVED → field patch
 * applied to the employee record; REJECTED → request is closed with a
 * reason. Both write a `PROFILE_CHANGE_APPROVED` audit entry (the
 * `REJECTED` outcome rides on the same action; the `context.decision`
 * field disambiguates if needed — kept compact since the demo doesn't
 * surface rejected requests in a separate filter yet).
 */
export async function approveProfileRequest(
  uuid: string,
  actorUuid: string,
  decision: 'APPROVED' | 'REJECTED',
  rejectionReason?: string,
): Promise<ProfileChangeRequest> {
  await simulatedDelay();
  maybeFail();
  const requests = readProfileRequests();
  const idx = requests.findIndex((r) => r.uuid === uuid);
  if (idx === -1) throw new Error(`Profile-change request not found: ${uuid}`);
  const before = requests[idx]!;
  const updated: ProfileChangeRequest = {
    ...before,
    status: decision,
    rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
    reviewedAt: NOW(),
    reviewedByUuid: actorUuid,
  };
  requests[idx] = updated;
  writeTable(Tables.profileRequests, requests);

  // Apply the patch when approved. The `fields` shape is
  // `{ key: { from, to } }` — pull `to` into the employee patch.
  if (decision === 'APPROVED') {
    const patch: Partial<Employee> = {};
    for (const [key, change] of Object.entries(before.fields)) {
      (patch as Record<string, unknown>)[key] = change.to;
    }
    if (Object.keys(patch).length > 0) {
      await updateEmployee(before.employeeUuid, patch, actorUuid);
    }
  }

  const employee = readEmployees().find((e) => e.uuid === before.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'PROFILE_CHANGE_APPROVED',
    resourceType: 'profile-request',
    resourceUuid: uuid,
    resourceLabel: employee?.fullNameGenerated ?? before.employeeUuid,
    context: { decision, rejectionReason },
  });
  return updated;
}

/**
 * Change the current user's password. Throws `PasswordValidationError`
 * with code `'current-wrong'` when the supplied current password
 * doesn't match the stored hash. On success: updates the hash, stamps
 * `passwordChangedAt`, clears `mustChangePassword`, and writes a
 * `PASSWORD_CHANGED` audit entry.
 */
export async function changePassword(
  userUuid: string,
  current: string,
  next: string,
): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const users = readUsers();
  const idx = users.findIndex((u) => u.uuid === userUuid);
  if (idx === -1) throw new Error(`User not found: ${userUuid}`);
  const before = users[idx]!;
  const currentHash = await sha256Hex(current);
  if (before.passwordHash !== currentHash) {
    throw new PasswordValidationError('current-wrong');
  }
  users[idx] = {
    ...before,
    passwordHash: await sha256Hex(next),
    passwordChangedAt: NOW(),
    mustChangePassword: false,
  };
  writeTable(Tables.users, users);
  await appendAudit({
    actorUuid: userUuid,
    action: 'PASSWORD_CHANGED',
    resourceType: 'user',
    resourceUuid: userUuid,
    resourceLabel: before.email,
  });
}

// === Documents (milestone 2, step 17 — BPMN 3.4 / BP-4) ===
//
// Policy layer per CLAUDE.md: per-document authorization is enforced HERE,
// against the *acting* employee uuid each mutation receives — never by UI
// hiding alone. Walking the API from the browser console hits the same
// guards as the screens in steps 18–19.

function readDocumentTemplates(): DocumentTemplate[] {
  return readTable<DocumentTemplate>(Tables.documentTemplates, []);
}
function readDocuments(): DocumentEntity[] {
  return readTable<DocumentEntity>(Tables.documents, []);
}
function readApprovalSteps(): ApprovalStep[] {
  return readTable<ApprovalStep>(Tables.approvalSteps, []);
}
function readSignatures(): SignatureRecord[] {
  return readTable<SignatureRecord>(Tables.signatures, []);
}

/**
 * M2 mutations receive the acting *employee* uuid as `actorUuid` (the
 * step-16 POV rail), not a user uuid — so the audit actor name resolves
 * from the employees table directly instead of `actorNameFor`.
 */
function employeeNameFor(employeeUuid: string): string {
  return (
    readEmployees().find((e) => e.uuid === employeeUuid)?.fullNameGenerated ?? employeeUuid
  );
}

function docLabel(doc: DocumentEntity): string {
  return `${doc.number} · ${doc.title}`;
}

function stepsOfRound(
  steps: ApprovalStep[],
  documentUuid: string,
  round: number,
): ApprovalStep[] {
  return steps
    .filter((s) => s.documentUuid === documentUuid && s.round === round)
    .sort((a, b) => a.order - b.order);
}

/** Fake detached-signature hex via crypto.getRandomValues (FakePfxParser convention). */
function randomSignatureHex(bytes = 128): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Year hardcoded per master §17 — the demo never crosses a year boundary. */
function nextDocumentNumber(documents: DocumentEntity[]): string {
  let max = 0;
  for (const d of documents) {
    const m = /^HJ-2026\/(\d{4})$/.exec(d.number);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `HJ-2026/${String(max + 1).padStart(4, '0')}`;
}

/**
 * Employee-kind fields arrive as employee UUIDs from the wizard's Combobox —
 * resolve them to the FIO before substitution so the rendered body carries
 * names, not identifiers.
 */
function resolveTemplateValues(
  template: DocumentTemplate,
  values: Record<string, string>,
): Record<string, string> {
  const employees = readEmployees();
  const resolved: Record<string, string> = { ...values };
  for (const field of template.fields) {
    if (field.kind !== 'employee') continue;
    const raw = resolved[field.key];
    if (!raw) continue;
    const employee = employees.find((e) => e.uuid === raw);
    if (employee) resolved[field.key] = employee.fullNameGenerated;
  }
  return resolved;
}

async function notifyDocument(
  recipients: string[],
  type: NotificationType,
  doc: DocumentEntity,
  params: Record<string, string>,
  titleKeyOverride?: string,
): Promise<void> {
  for (const recipientEmployeeUuid of new Set(recipients)) {
    await appendNotification({
      recipientEmployeeUuid,
      type,
      titleKey: titleKeyOverride ?? `dashboard:notifications.title.${type}`,
      params,
      resourceType: 'document',
      resourceUuid: doc.uuid,
    });
  }
}

/**
 * "Imzolash kerakmi?" branch (BPMN 3.4 node 10/11): with a signer set, ask
 * for the ERI; with none, ask the recipient to accept. Both ride the
 * DOC_SIGN_REQUESTED type — the stored titleKey disambiguates the copy.
 */
async function notifySignerOrRecipient(
  doc: DocumentEntity,
  actorName: string,
): Promise<void> {
  if (doc.signerUuid) {
    await notifyDocument([doc.signerUuid], 'DOC_SIGN_REQUESTED', doc, {
      docNumber: doc.number,
      actorName,
    });
  } else {
    await notifyDocument(
      [doc.recipientUuid],
      'DOC_SIGN_REQUESTED',
      doc,
      { docNumber: doc.number, actorName },
      'dashboard:notifications.title.DOC_ACCEPT_REQUESTED',
    );
  }
}

// === Reads — documents ===

export async function listDocumentTemplates(): Promise<DocumentTemplate[]> {
  await simulatedDelay();
  return readDocumentTemplates();
}

export interface DocumentFilters {
  status?: DocumentStatus;
  creatorUuid?: string;
  recipientUuid?: string;
  archivedOnly?: boolean;
  search?: string;
}

export async function listDocuments(filters?: DocumentFilters): Promise<DocumentEntity[]> {
  await simulatedDelay();
  let rows = readDocuments();
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters?.creatorUuid) rows = rows.filter((r) => r.creatorUuid === filters.creatorUuid);
  if (filters?.recipientUuid) {
    rows = rows.filter((r) => r.recipientUuid === filters.recipientUuid);
  }
  if (filters?.archivedOnly) rows = rows.filter((r) => Boolean(r.archivedAt));
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.number.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
    );
  }
  return rows;
}

export interface DocumentDetail {
  document: DocumentEntity;
  /**
   * Steps of ALL rounds, ordered by (round, order). Halted rounds are
   * immutable history that the detail page's round selector keeps visible
   * (BP-4: rejected chains are never deleted); filter by `document.round`
   * for the actionable chain.
   */
  steps: ApprovalStep[];
  signatures: SignatureRecord[];
}

export async function getDocument(uuid: string): Promise<DocumentDetail | null> {
  await simulatedDelay();
  const document = readDocuments().find((d) => d.uuid === uuid);
  if (!document) return null;
  return {
    document,
    steps: readApprovalSteps()
      .filter((s) => s.documentUuid === uuid)
      .sort((a, b) => a.round - b.round || a.order - b.order),
    signatures: readSignatures().filter(
      (s) => s.resourceType === 'document' && s.resourceUuid === uuid,
    ),
  };
}

/** One row of the `/approvals` queue (step 19). */
export type ApprovalQueueItem =
  | { kind: 'decision'; document: DocumentEntity; step: ApprovalStep }
  | { kind: 'signature'; document: DocumentEntity }
  | { kind: 'acceptance'; document: DocumentEntity };

export async function listMyApprovals(actorUuid: string): Promise<ApprovalQueueItem[]> {
  await simulatedDelay();
  const documents = readDocuments();
  const steps = readApprovalSteps();
  const items: ApprovalQueueItem[] = [];
  for (const document of documents) {
    if (document.status === 'IN_REVIEW') {
      // The strictly-sequential chain means exactly one step is actionable:
      // the first PENDING of the current round.
      const pending = stepsOfRound(steps, document.uuid, document.round).find(
        (s) => s.decision === 'PENDING',
      );
      if (pending && pending.employeeUuid === actorUuid) {
        items.push({ kind: 'decision', document, step: pending });
      }
    } else if (document.status === 'APPROVED') {
      if (document.signerUuid === actorUuid) {
        items.push({ kind: 'signature', document });
      } else if (!document.signerUuid && document.recipientUuid === actorUuid) {
        items.push({ kind: 'acceptance', document });
      }
    }
  }
  items.sort((a, b) =>
    (b.document.sentForReviewAt ?? b.document.createdAt).localeCompare(
      a.document.sentForReviewAt ?? a.document.createdAt,
    ),
  );
  return items;
}

/**
 * §2.2 "who viewed" requirement: append to `viewedBy` once per employee.
 * The first view also writes a DOCUMENT_VIEWED audit entry; repeat views
 * are no-ops. Deliberately no `maybeFail()` — viewing must never error.
 */
export async function recordDocumentView(uuid: string, actorUuid: string): Promise<void> {
  await simulatedDelay();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === uuid);
  if (idx === -1) return;
  const doc = documents[idx]!;
  if (doc.viewedBy.some((v) => v.employeeUuid === actorUuid)) return;
  documents[idx] = {
    ...doc,
    viewedBy: [...doc.viewedBy, { employeeUuid: actorUuid, viewedAt: NOW() }],
  };
  writeTable(Tables.documents, documents);
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'DOCUMENT_VIEWED',
    resourceType: 'document',
    resourceUuid: uuid,
    resourceLabel: docLabel(doc),
  });
}

// === Mutations — documents ===

export interface CreateDocumentInput {
  title: string;
  source: DocumentSource;
  /** source = TEMPLATE. */
  templateUuid?: string;
  /** source = TEMPLATE — placeholder values keyed by `TemplateField.key`. */
  values?: Record<string, string>;
  /** source = UPLOAD — pick-time metadata; `uploadedAt` is stamped here. */
  fileMeta?: Omit<FileMeta, 'uploadedAt'>;
  confidentiality: Confidentiality;
  recipientUuid: string;
  signerUuid?: string;
  requiresApproval: boolean;
  /** Ordered kelishuv chain; required when `requiresApproval`. */
  participantUuids?: string[];
}

function assertValidParticipants(participantUuids: string[], creatorUuid: string): void {
  const unique = new Set(participantUuids);
  if (
    participantUuids.length < 1 ||
    unique.size !== participantUuids.length ||
    unique.has(creatorUuid)
  ) {
    // Programmer/UI error, not a policy violation — the step-18 wizard
    // prevents all three cases before submit.
    throw new Error('participantUuids must be ordered, non-empty, duplicate-free and exclude the creator');
  }
}

export async function createDocument(
  input: CreateDocumentInput,
  actorUuid: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();

  let templateUuid: string | undefined;
  let templateCode: string | undefined;
  let values: Record<string, string> | undefined;
  let renderedBody: string | undefined;
  let fileMeta: FileMeta | undefined;

  if (input.source === 'TEMPLATE') {
    const template = readDocumentTemplates().find((t) => t.uuid === input.templateUuid);
    if (!template || !input.values) {
      throw new Error('TEMPLATE documents require templateUuid + values');
    }
    templateUuid = template.uuid;
    templateCode = template.code;
    // Raw values persist alongside the rendered body so the rework loop
    // (step 19's "Tahrirlash") can re-enter the wizard prefilled.
    values = input.values;
    renderedBody = renderTemplate(
      template.bodyTemplate,
      resolveTemplateValues(template, input.values),
    );
  } else {
    if (!input.fileMeta) throw new Error('UPLOAD documents require fileMeta');
    fileMeta = { ...input.fileMeta, uploadedAt: NOW() };
  }

  if (input.requiresApproval) {
    assertValidParticipants(input.participantUuids ?? [], actorUuid);
  }

  const doc: DocumentEntity = {
    uuid: uid(),
    number: nextDocumentNumber(documents),
    title: input.title,
    source: input.source,
    templateUuid,
    values,
    renderedBody,
    fileMeta,
    confidentiality: input.confidentiality,
    creatorUuid: actorUuid,
    recipientUuid: input.recipientUuid,
    signerUuid: input.signerUuid,
    requiresApproval: input.requiresApproval,
    status: 'DRAFT',
    round: 1,
    viewedBy: [],
    createdAt: NOW(),
    updatedAt: NOW(),
  };
  documents.unshift(doc);
  writeTable(Tables.documents, documents);

  if (input.requiresApproval) {
    const steps = readApprovalSteps();
    (input.participantUuids ?? []).forEach((employeeUuid, i) => {
      steps.push({
        uuid: uid(),
        documentUuid: doc.uuid,
        round: 1,
        order: i + 1,
        employeeUuid,
        decision: 'PENDING',
      });
    });
    writeTable(Tables.approvalSteps, steps);
  }

  // DRAFT create is audit-only — notifications start at submit.
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'DOCUMENT_CREATED',
    resourceType: 'document',
    resourceUuid: doc.uuid,
    resourceLabel: docLabel(doc),
    context: { number: doc.number, source: doc.source, template: templateCode },
  });
  return doc;
}

export interface UpdateDraftDocumentInput {
  title?: string;
  /** TEMPLATE docs — complete placeholder value set; the body is re-rendered. */
  values?: Record<string, string>;
  /** UPLOAD docs — replacement pick-time metadata. */
  fileMeta?: Omit<FileMeta, 'uploadedAt'>;
  recipientUuid?: string;
  /** Pass `null` to clear the signer (switches the chain's end to acceptance). */
  signerUuid?: string | null;
  confidentiality?: Confidentiality;
  /** Rebuilds the PENDING steps of the *upcoming* round only. */
  participantUuids?: string[];
}

export async function updateDraftDocument(
  uuid: string,
  patch: UpdateDraftDocumentInput,
  actorUuid: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === uuid);
  if (idx === -1) throw new Error(`Document not found: ${uuid}`);
  const before = documents[idx]!;
  if (before.status !== 'DRAFT' && before.status !== 'REJECTED') {
    throw new DocumentValidationError('not-editable');
  }
  if (before.creatorUuid !== actorUuid) throw new DocumentValidationError('not-creator');

  const next: DocumentEntity = { ...before, updatedAt: NOW() };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.recipientUuid !== undefined) next.recipientUuid = patch.recipientUuid;
  if (patch.signerUuid !== undefined) next.signerUuid = patch.signerUuid ?? undefined;
  if (patch.confidentiality !== undefined) next.confidentiality = patch.confidentiality;
  if (patch.values && before.source === 'TEMPLATE' && before.templateUuid) {
    const template = readDocumentTemplates().find((t) => t.uuid === before.templateUuid);
    if (template) {
      next.values = patch.values;
      next.renderedBody = renderTemplate(
        template.bodyTemplate,
        resolveTemplateValues(template, patch.values),
      );
    }
  }
  if (patch.fileMeta && before.source === 'UPLOAD') {
    next.fileMeta = { ...patch.fileMeta, uploadedAt: NOW() };
  }
  documents[idx] = next;
  writeTable(Tables.documents, documents);

  if (patch.participantUuids && next.requiresApproval) {
    assertValidParticipants(patch.participantUuids, actorUuid);
    // For a DRAFT the upcoming round IS the current round (nothing decided
    // yet). After a rejection it's round + 1 — the decided steps of the
    // halted round stay untouched as immutable history.
    const upcomingRound = before.status === 'DRAFT' ? before.round : before.round + 1;
    const steps = readApprovalSteps().filter(
      (s) => !(s.documentUuid === uuid && s.round === upcomingRound),
    );
    patch.participantUuids.forEach((employeeUuid, i) => {
      steps.push({
        uuid: uid(),
        documentUuid: uuid,
        round: upcomingRound,
        order: i + 1,
        employeeUuid,
        decision: 'PENDING',
      });
    });
    writeTable(Tables.approvalSteps, steps);
  }

  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'UPDATE',
    resourceType: 'document',
    resourceUuid: uuid,
    resourceLabel: docLabel(next),
  });
  return next;
}

export async function submitDocumentForReview(
  uuid: string,
  actorUuid: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === uuid);
  if (idx === -1) throw new Error(`Document not found: ${uuid}`);
  const before = documents[idx]!;
  if (before.status !== 'DRAFT' && before.status !== 'REJECTED') {
    throw new DocumentValidationError('wrong-status');
  }
  if (before.creatorUuid !== actorUuid) throw new DocumentValidationError('not-creator');
  const actorName = employeeNameFor(actorUuid);

  let next: DocumentEntity;
  if (before.requiresApproval) {
    let round = before.round;
    if (before.status === 'REJECTED') {
      // Resubmit after rework: new round. Steps may already exist (the
      // participant list was edited during rework); otherwise clone the
      // halted round's chain as fresh PENDING steps.
      round = before.round + 1;
      const steps = readApprovalSteps();
      if (stepsOfRound(steps, uuid, round).length === 0) {
        for (const p of stepsOfRound(steps, uuid, before.round)) {
          steps.push({
            uuid: uid(),
            documentUuid: uuid,
            round,
            order: p.order,
            employeeUuid: p.employeeUuid,
            decision: 'PENDING',
          });
        }
        writeTable(Tables.approvalSteps, steps);
      }
    }
    next = { ...before, status: 'IN_REVIEW', round, sentForReviewAt: NOW(), updatedAt: NOW() };
    documents[idx] = next;
    writeTable(Tables.documents, documents);
    const first = stepsOfRound(readApprovalSteps(), uuid, round)[0];
    if (first) {
      await notifyDocument([first.employeeUuid], 'DOC_REVIEW_REQUESTED', next, {
        docNumber: next.number,
        actorName,
      });
    }
  } else {
    // BPMN 3.4 "Kelishuv varaqasi kerakmi? → Yo'q": implicit approval,
    // straight to the sign/accept gate.
    next = {
      ...before,
      status: 'APPROVED',
      sentForReviewAt: NOW(),
      approvedAt: NOW(),
      updatedAt: NOW(),
    };
    documents[idx] = next;
    writeTable(Tables.documents, documents);
    await notifySignerOrRecipient(next, actorName);
  }

  await appendAudit({
    actorUuid,
    actorName,
    action: 'DOCUMENT_SENT_FOR_REVIEW',
    resourceType: 'document',
    resourceUuid: uuid,
    resourceLabel: docLabel(next),
    context: { round: next.round },
  });
  return next;
}

export async function decideApproval(
  documentUuid: string,
  actorUuid: string,
  decision: Exclude<ApprovalDecision, 'PENDING'>,
  comment?: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === documentUuid);
  if (idx === -1) throw new Error(`Document not found: ${documentUuid}`);
  const doc = documents[idx]!;
  if (doc.status !== 'IN_REVIEW') throw new DocumentValidationError('wrong-status');

  const allSteps = readApprovalSteps();
  const roundSteps = stepsOfRound(allSteps, documentUuid, doc.round);
  const mine = roundSteps.find((s) => s.employeeUuid === actorUuid);
  if (!mine) throw new DocumentValidationError('not-participant');
  if (mine.decision !== 'PENDING') throw new DocumentValidationError('already-decided');
  if (roundSteps.some((s) => s.order < mine.order && s.decision === 'PENDING')) {
    // The demo chain is strictly sequential (BP-4) — no out-of-turn decisions.
    throw new DocumentValidationError('out-of-order');
  }
  if (decision === 'REJECTED' && !comment?.trim()) {
    throw new DocumentValidationError('comment-required');
  }

  const stepIdx = allSteps.findIndex((s) => s.uuid === mine.uuid);
  allSteps[stepIdx] = {
    ...mine,
    decision,
    comment: comment?.trim() || undefined,
    decidedAt: NOW(),
  };
  writeTable(Tables.approvalSteps, allSteps);

  const actorName = employeeNameFor(actorUuid);
  let next = doc;

  if (decision === 'REJECTED') {
    // Halt the round: the document goes back to the creator for rework; the
    // remaining steps stay PENDING as the frozen history of the halted round.
    next = { ...doc, status: 'REJECTED', updatedAt: NOW() };
    documents[idx] = next;
    writeTable(Tables.documents, documents);
    await notifyDocument([doc.creatorUuid], 'DOC_REJECTED', next, {
      docNumber: doc.number,
      actorName,
    });
  } else {
    await notifyDocument([doc.creatorUuid], 'DOC_DECIDED', doc, {
      docNumber: doc.number,
      actorName,
      decision,
    });
    const stillPending = roundSteps.some(
      (s) => s.uuid !== mine.uuid && s.decision === 'PENDING',
    );
    if (!stillPending) {
      next = { ...doc, status: 'APPROVED', approvedAt: NOW(), updatedAt: NOW() };
      documents[idx] = next;
      writeTable(Tables.documents, documents);
      await notifyDocument([doc.creatorUuid], 'DOC_APPROVED', next, {
        docNumber: doc.number,
        actorName,
      });
      await notifySignerOrRecipient(next, actorName);
    }
  }

  await appendAudit({
    actorUuid,
    actorName,
    action: decision === 'REJECTED' ? 'DOCUMENT_REJECTED' : 'DOCUMENT_APPROVED',
    resourceType: 'document',
    resourceUuid: documentUuid,
    resourceLabel: docLabel(doc),
    context: {
      decision,
      order: mine.order,
      round: doc.round,
      comment: comment?.trim() || undefined,
    },
  });
  return next;
}

export async function signDocument(
  documentUuid: string,
  actorUuid: string,
  certificateUuid: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === documentUuid);
  if (idx === -1) throw new Error(`Document not found: ${documentUuid}`);
  const doc = documents[idx]!;
  if (doc.status !== 'APPROVED') throw new DocumentValidationError('wrong-status');
  if (doc.signerUuid !== actorUuid) throw new DocumentValidationError('not-signer');
  const cert = readCertificates().find((c) => c.uuid === certificateUuid);
  if (!cert || cert.status !== 'ACTIVE' || cert.employeeUuid !== actorUuid) {
    throw new DocumentValidationError('cert-invalid');
  }

  const signatures = readSignatures();
  signatures.unshift({
    uuid: uid(),
    resourceType: 'document',
    resourceUuid: documentUuid,
    employeeUuid: actorUuid,
    certificateUuid,
    algorithm: 'RSA-PKCS7',
    signatureHex: randomSignatureHex(),
    signedAt: NOW(),
  });
  writeTable(Tables.signatures, signatures);

  // `archivedAt` stamps immediately: the TLH's nightly archive job is
  // simulated by archiving the moment a terminal status lands (master §17).
  const next: DocumentEntity = {
    ...doc,
    status: 'SIGNED',
    signedAt: NOW(),
    archivedAt: NOW(),
    updatedAt: NOW(),
  };
  documents[idx] = next;
  writeTable(Tables.documents, documents);

  const actorName = employeeNameFor(actorUuid);
  await notifyDocument([doc.creatorUuid, doc.recipientUuid], 'DOC_SIGNED', next, {
    docNumber: doc.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'DOCUMENT_SIGNED',
    resourceType: 'document',
    resourceUuid: documentUuid,
    resourceLabel: docLabel(next),
    context: { certificateSerial: cert.serialNumber },
  });
  return next;
}

/** The no-ERI branch (BPMN 3.4 node 11.2) — the recipient accepts and the document closes. */
export async function acceptDocument(
  documentUuid: string,
  actorUuid: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === documentUuid);
  if (idx === -1) throw new Error(`Document not found: ${documentUuid}`);
  const doc = documents[idx]!;
  if (doc.status !== 'APPROVED' || doc.signerUuid) {
    throw new DocumentValidationError('wrong-status');
  }
  if (doc.recipientUuid !== actorUuid) throw new DocumentValidationError('not-recipient');

  const next: DocumentEntity = {
    ...doc,
    status: 'CLOSED',
    closedAt: NOW(),
    archivedAt: NOW(),
    updatedAt: NOW(),
  };
  documents[idx] = next;
  writeTable(Tables.documents, documents);

  const actorName = employeeNameFor(actorUuid);
  await notifyDocument([doc.creatorUuid], 'DOC_CLOSED', next, {
    docNumber: doc.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'DOCUMENT_CLOSED',
    resourceType: 'document',
    resourceUuid: documentUuid,
    resourceLabel: docLabel(next),
  });
  return next;
}

/** Mock email export (§2.7) — appends to the log; no real mail per master §17. */
export async function emailDocument(
  uuid: string,
  actorUuid: string,
  email: string,
): Promise<DocumentEntity> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === uuid);
  if (idx === -1) throw new Error(`Document not found: ${uuid}`);
  const doc = documents[idx]!;
  if (doc.status !== 'SIGNED' && doc.status !== 'CLOSED') {
    throw new DocumentValidationError('wrong-status');
  }
  const next: DocumentEntity = {
    ...doc,
    emailedTo: [...(doc.emailedTo ?? []), email],
    updatedAt: NOW(),
  };
  documents[idx] = next;
  writeTable(Tables.documents, documents);
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'DOCUMENT_EMAILED',
    resourceType: 'document',
    resourceUuid: uuid,
    resourceLabel: docLabel(next),
    context: { email },
  });
  return next;
}

/**
 * Delete a document — allowed ONLY for the creator's own DRAFT. This is the
 * §2.2 signed-document protection: there is deliberately NO code path that
 * removes a non-DRAFT row, regardless of role.
 */
export async function deleteDocument(uuid: string, actorUuid: string): Promise<void> {
  await simulatedDelay();
  maybeFail();
  const documents = readDocuments();
  const idx = documents.findIndex((d) => d.uuid === uuid);
  if (idx === -1) throw new Error(`Document not found: ${uuid}`);
  const doc = documents[idx]!;
  if (doc.status !== 'DRAFT') throw new DocumentValidationError('not-deletable');
  if (doc.creatorUuid !== actorUuid) throw new DocumentValidationError('not-creator');
  documents.splice(idx, 1);
  writeTable(Tables.documents, documents);
  // Drop the draft's PENDING chain too — no orphan steps.
  writeTable(
    Tables.approvalSteps,
    readApprovalSteps().filter((s) => s.documentUuid !== uuid),
  );
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'DELETE',
    resourceType: 'document',
    resourceUuid: uuid,
    resourceLabel: docLabel(doc),
  });
}

// === Letters (milestone 2, step 20 — BPMN 3.3 / BP-3) ===
//
// Same policy contract as documents: per-letter authorization is enforced
// HERE against the *acting* employee uuid each mutation receives. Walking
// the API from the browser console hits the same guards as the screens
// (registry in this step; detail actions in step 21).

function readLetters(): Letter[] {
  return readTable<Letter>(Tables.letters, []);
}

function letterLabel(letter: Letter): string {
  return `${letter.number} · ${letter.subject}`;
}

/**
 * Year hardcoded per master §17 (documents convention). Separate counters
 * per prefix: incoming 'K-2026/NNNN', outgoing 'CH-2026/NNNN'.
 */
function nextLetterNumber(letters: Letter[], prefix: 'K' | 'CH'): string {
  const re = new RegExp(`^${prefix}-2026/(\\d{4})$`);
  let max = 0;
  for (const l of letters) {
    const m = re.exec(l.number);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-2026/${String(max + 1).padStart(4, '0')}`;
}

// --- Persona resolution (BPMN 3.3 swim lanes) ---

/** Devonxona = the actor's user carries ROLE_DEVONXONA. */
function isDevonxona(employeeUuid: string): boolean {
  const user = readUsers().find((u) => u.employeeUuid === employeeUuid);
  return user?.roles.includes('ROLE_DEVONXONA') ?? false;
}

/** Rahbar = the actor heads a root-level unit (level 0 + headEmployeeUuid). */
function isRahbar(employeeUuid: string): boolean {
  return readUnits().some(
    (u) => u.level === 0 && u.headEmployeeUuid === employeeUuid,
  );
}

/** Unit head = the actor heads the unit itself or any of its ancestors. */
function headsUnitOrAncestor(employeeUuid: string, unitUuid: string): boolean {
  const units = readUnits();
  let current = units.find((u) => u.uuid === unitUuid);
  while (current) {
    if (current.headEmployeeUuid === employeeUuid) return true;
    const parentUuid = current.parentUuid;
    current = parentUuid ? units.find((u) => u.uuid === parentUuid) : undefined;
  }
  return false;
}

/**
 * "The Rahbar" for a routed letter = head of the root ancestor of the routed
 * unit — the leader of the branch the letter is being executed in. Used for
 * notification targeting (the `isRahbar` *policy* check stays generic).
 */
function rahbarOverUnit(unitUuid: string): string | undefined {
  const units = readUnits();
  let current = units.find((u) => u.uuid === unitUuid);
  while (current && current.parentUuid) {
    const parentUuid: string = current.parentUuid;
    current = units.find((u) => u.uuid === parentUuid);
  }
  return current?.headEmployeeUuid;
}

/** All employees carrying ROLE_DEVONXONA (the demo seeds exactly one). */
function devonxonaEmployeeUuids(): string[] {
  return readUsers()
    .filter((u) => u.roles.includes('ROLE_DEVONXONA') && u.employeeUuid)
    .map((u) => u.employeeUuid!);
}

function unitHeadOf(unitUuid: string | undefined): string | undefined {
  if (!unitUuid) return undefined;
  return readUnits().find((u) => u.uuid === unitUuid)?.headEmployeeUuid;
}

async function notifyLetter(
  recipients: Array<string | undefined>,
  type: NotificationType,
  letter: Letter,
  params: Record<string, string>,
): Promise<void> {
  const unique = new Set(recipients.filter((r): r is string => Boolean(r)));
  for (const recipientEmployeeUuid of unique) {
    await appendNotification({
      recipientEmployeeUuid,
      type,
      titleKey: `dashboard:notifications.title.${type}`,
      params,
      resourceType: 'letter',
      resourceUuid: letter.uuid,
    });
  }
}

// --- Overdue (shared by `listLetters` and the registry badge) ---

const TERMINAL_LETTER_STATUSES: ReadonlySet<LetterStatus> = new Set([
  'CLOSED',
  'CLOSED_NO_RESPONSE',
  'DISPATCHED',
]);

/** Overdue = deadline strictly before today AND the letter is not terminal. */
export function isLetterOverdue(letter: Letter): boolean {
  if (!letter.deadline || TERMINAL_LETTER_STATUSES.has(letter.status)) return false;
  return letter.deadline.slice(0, 10) < NOW().slice(0, 10);
}

// === Reads — letters ===

export interface LetterFilters {
  direction?: LetterDirection;
  status?: LetterStatus;
  search?: string;
  overdueOnly?: boolean;
}

export async function listLetters(filters?: LetterFilters): Promise<Letter[]> {
  await simulatedDelay();
  let rows = readLetters();
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.direction) rows = rows.filter((r) => r.direction === filters.direction);
  if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters?.overdueOnly) rows = rows.filter(isLetterOverdue);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.externalOrg.toLowerCase().includes(q),
    );
  }
  return rows;
}

export interface LetterDetail {
  letter: Letter;
  signatures: SignatureRecord[];
  /** On INCOMING rows — the dispatched OUTGOING reply, if any. */
  linkedOutgoing?: Letter;
  /** On OUTGOING rows — the INCOMING letter being answered, if any. */
  linkedIncoming?: Letter;
  routedToUnitName?: string;
  assignedEmployeeName?: string;
  registeredByName: string;
}

export async function getLetter(uuid: string): Promise<LetterDetail | null> {
  await simulatedDelay();
  const letters = readLetters();
  const letter = letters.find((l) => l.uuid === uuid);
  if (!letter) return null;
  return {
    letter,
    signatures: readSignatures().filter(
      (s) => s.resourceType === 'letter' && s.resourceUuid === uuid,
    ),
    linkedOutgoing:
      letter.direction === 'INCOMING'
        ? letters.find((l) => l.linkedIncomingUuid === uuid)
        : undefined,
    linkedIncoming: letter.linkedIncomingUuid
      ? letters.find((l) => l.uuid === letter.linkedIncomingUuid)
      : undefined,
    routedToUnitName: letter.routedToUnitUuid
      ? readUnits().find((u) => u.uuid === letter.routedToUnitUuid)?.nameUz
      : undefined,
    assignedEmployeeName: letter.assignedEmployeeUuid
      ? employeeNameFor(letter.assignedEmployeeUuid)
      : undefined,
    registeredByName: employeeNameFor(letter.registeredByUuid),
  };
}

// === Mutations — letters ===

export interface RegisterIncomingLetterInput {
  externalOrg: string;
  subject: string;
  channel: LetterChannel;
  /** ISO date (yyyy-mm-dd) — when the paper/email actually arrived. */
  receivedAt: string;
  /** ISO date — ijro muddati; drives the overdue badge. */
  deadline?: string;
  /** "Javobga rahbar imzosi talab qilinadi". */
  requiresSignature: boolean;
  /** Scanned original — pick-time metadata; `uploadedAt` is stamped here. */
  fileMeta?: Omit<FileMeta, 'uploadedAt'>;
}

export async function registerIncomingLetter(
  input: RegisterIncomingLetterInput,
  actorUuid: string,
): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  if (!isDevonxona(actorUuid)) throw new LetterValidationError('not-devonxona');
  const letters = readLetters();
  const letter: Letter = {
    uuid: uid(),
    direction: 'INCOMING',
    number: nextLetterNumber(letters, 'K'),
    externalOrg: input.externalOrg,
    subject: input.subject,
    channel: input.channel,
    fileMeta: input.fileMeta ? { ...input.fileMeta, uploadedAt: NOW() } : undefined,
    receivedAt: input.receivedAt,
    deadline: input.deadline,
    requiresSignature: input.requiresSignature,
    status: 'REGISTERED',
    registeredByUuid: actorUuid,
    createdAt: NOW(),
    updatedAt: NOW(),
  };
  letters.unshift(letter);
  writeTable(Tables.letters, letters);
  // Registration is Devonxona's own act — audit-only, notifications start at routing.
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'LETTER_REGISTERED',
    resourceType: 'letter',
    resourceUuid: letter.uuid,
    resourceLabel: letterLabel(letter),
    context: { number: letter.number, channel: letter.channel, externalOrg: letter.externalOrg },
  });
  return letter;
}

export async function routeLetter(
  uuid: string,
  unitUuid: string,
  actorUuid: string,
): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'REGISTERED') throw new LetterValidationError('wrong-status');
  if (!isRahbar(actorUuid)) throw new LetterValidationError('not-rahbar');
  const unit = readUnits().find((u) => u.uuid === unitUuid);
  // Programmer/UI error, not a policy violation — the step-21 picker only
  // offers existing ACTIVE units.
  if (!unit || unit.status !== 'ACTIVE') throw new Error(`Cannot route to unit: ${unitUuid}`);

  const next: Letter = { ...before, status: 'ROUTED', routedToUnitUuid: unitUuid, updatedAt: NOW() };
  letters[idx] = next;
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  await notifyLetter([unit.headEmployeeUuid], 'LETTER_ROUTED', next, {
    letterNumber: next.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_ROUTED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { unit: unit.nameUz },
  });
  return next;
}

export async function assignLetterExecutor(
  uuid: string,
  employeeUuid: string,
  actorUuid: string,
): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'ROUTED') throw new LetterValidationError('wrong-status');
  const routedUnit = before.routedToUnitUuid!;
  if (!headsUnitOrAncestor(actorUuid, routedUnit)) {
    throw new LetterValidationError('not-unit-head');
  }
  // The executor must belong to the routed unit's subtree (open assignment
  // or primary unit there — a bo'lim head assigns from his sho'bas too).
  // Programmer/UI error — the step-21 picker only offers members.
  const units = readUnits();
  const routedPath = units.find((u) => u.uuid === routedUnit)?.path ?? '';
  const inSubtree = (unitUuid: string) =>
    Boolean(routedPath) &&
    (units.find((u) => u.uuid === unitUuid)?.path.startsWith(routedPath) ?? false);
  const belongs =
    readAssignments().some(
      (a) => a.employeeUuid === employeeUuid && !a.endDate && inSubtree(a.unitUuid),
    ) ||
    readEmployees().some(
      (e) => e.uuid === employeeUuid && inSubtree(e.primaryUnitUuid),
    );
  if (!belongs) throw new Error(`Executor ${employeeUuid} does not belong to unit ${routedUnit}`);

  const next: Letter = {
    ...before,
    status: 'ASSIGNED',
    assignedEmployeeUuid: employeeUuid,
    updatedAt: NOW(),
  };
  letters[idx] = next;
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  await notifyLetter([employeeUuid], 'LETTER_ASSIGNED', next, {
    letterNumber: next.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_ASSIGNED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { executor: employeeNameFor(employeeUuid) },
  });
  return next;
}

/**
 * Timeline realism only (ASSIGNED → IN_PROGRESS). Audited as LETTER_EXECUTED
 * with `context.phase = 'started'` — CLAUDE.md requires every meaningful state
 * change in the trail, and the canonical action set has no separate "started"
 * verb; the context field carries the distinction.
 */
export async function startLetterExecution(uuid: string, actorUuid: string): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'ASSIGNED') throw new LetterValidationError('wrong-status');
  if (before.assignedEmployeeUuid !== actorUuid) {
    throw new LetterValidationError('not-executor');
  }

  const next: Letter = { ...before, status: 'IN_PROGRESS', updatedAt: NOW() };
  letters[idx] = next;
  writeTable(Tables.letters, letters);
  await appendAudit({
    actorUuid,
    actorName: employeeNameFor(actorUuid),
    action: 'LETTER_EXECUTED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { phase: 'started' },
  });
  return next;
}

export interface SubmitLetterExecutionInput {
  /** BPMN 7.1 — comment-only execution. Present (even empty) selects this path. */
  executionComment?: string;
  /** BPMN 7.2 — ready response file (pick-time metadata). */
  responseFileMeta?: Omit<FileMeta, 'uploadedAt'>;
  /** BPMN 7.2 alt — response composed as an internal document. */
  responseDocumentUuid?: string;
}

export async function submitLetterExecution(
  uuid: string,
  input: SubmitLetterExecutionInput,
  actorUuid: string,
): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'ASSIGNED' && before.status !== 'IN_PROGRESS') {
    throw new LetterValidationError('wrong-status');
  }
  if (before.assignedEmployeeUuid !== actorUuid) {
    throw new LetterValidationError('not-executor');
  }

  const commentPath = input.executionComment !== undefined;
  if (commentPath && !input.executionComment!.trim()) {
    throw new LetterValidationError('comment-required');
  }
  if (!commentPath && !input.responseFileMeta && !input.responseDocumentUuid) {
    throw new LetterValidationError('missing-response');
  }

  const next: Letter = {
    ...before,
    status: 'EXECUTED',
    executionComment: commentPath ? input.executionComment!.trim() : undefined,
    responseFileMeta: input.responseFileMeta
      ? { ...input.responseFileMeta, uploadedAt: NOW() }
      : undefined,
    responseDocumentUuid: input.responseDocumentUuid,
    updatedAt: NOW(),
  };
  letters[idx] = next;
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  await notifyLetter([unitHeadOf(next.routedToUnitUuid)], 'LETTER_EXECUTED', next, {
    letterNumber: next.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_EXECUTED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { phase: 'submitted', mode: commentPath ? 'comment' : 'response' },
  });
  return next;
}

/**
 * Unit-head acceptance gate (BPMN 3.3 node 8). Branches:
 * - comment-only execution → CLOSED_NO_RESPONSE (nothing to sign or dispatch,
 *   so the `requiresSignature` flag is irrelevant on this path);
 * - response present + requiresSignature → ON_SIGNATURE (Rahbar's ERI next);
 * - response present, no signature required → RESPONDED (ready for dispatch).
 */
export async function acceptLetterExecution(uuid: string, actorUuid: string): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'EXECUTED') throw new LetterValidationError('wrong-status');
  if (!headsUnitOrAncestor(actorUuid, before.routedToUnitUuid!)) {
    throw new LetterValidationError('not-unit-head');
  }

  const hasResponse = Boolean(before.responseFileMeta || before.responseDocumentUuid);
  const status: LetterStatus = !hasResponse
    ? 'CLOSED_NO_RESPONSE'
    : before.requiresSignature
      ? 'ON_SIGNATURE'
      : 'RESPONDED';
  const next: Letter = {
    ...before,
    status,
    closedAt: status === 'CLOSED_NO_RESPONSE' ? NOW() : before.closedAt,
    updatedAt: NOW(),
  };
  letters[idx] = next;
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  const params = { letterNumber: next.number, actorName };
  // The executor always learns their work was accepted; the branch target
  // (Rahbar or Devonxona) learns what to do next.
  await notifyLetter([next.assignedEmployeeUuid], 'LETTER_ACCEPTED', next, params);
  if (status === 'ON_SIGNATURE') {
    await notifyLetter([rahbarOverUnit(next.routedToUnitUuid!)], 'LETTER_SIGN_REQUESTED', next, params);
  } else {
    await notifyLetter(devonxonaEmployeeUuids(), 'LETTER_ACCEPTED', next, params);
  }
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_ACCEPTED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { outcome: status },
  });
  return next;
}

export async function signLetter(
  uuid: string,
  certificateUuid: string,
  actorUuid: string,
): Promise<Letter> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'ON_SIGNATURE') throw new LetterValidationError('wrong-status');
  if (!isRahbar(actorUuid)) throw new LetterValidationError('not-rahbar');
  const cert = readCertificates().find((c) => c.uuid === certificateUuid);
  if (!cert || cert.status !== 'ACTIVE' || cert.employeeUuid !== actorUuid) {
    throw new LetterValidationError('cert-invalid');
  }

  const signatures = readSignatures();
  signatures.unshift({
    uuid: uid(),
    resourceType: 'letter',
    resourceUuid: uuid,
    employeeUuid: actorUuid,
    certificateUuid,
    algorithm: 'RSA-PKCS7',
    signatureHex: randomSignatureHex(),
    signedAt: NOW(),
  });
  writeTable(Tables.signatures, signatures);

  const next: Letter = { ...before, status: 'RESPONDED', updatedAt: NOW() };
  letters[idx] = next;
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  // The signature gate is cleared — Devonxona can dispatch now.
  await notifyLetter(devonxonaEmployeeUuids(), 'LETTER_ACCEPTED', next, {
    letterNumber: next.number,
    actorName,
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_SIGNED',
    resourceType: 'letter',
    resourceUuid: uuid,
    resourceLabel: letterLabel(next),
    context: { certificateSerial: cert.serialNumber },
  });
  return next;
}

export interface DispatchLetterInput {
  /** Outbound channel for the reply. */
  channel: LetterChannel;
}

/**
 * Devonxona dispatch (BPMN 3.3 node 10): the incoming letter CLOSES and the
 * OUTGOING reply row is created in one step — auto-numbered 'CH-2026/NNNN',
 * terminal `DISPATCHED`, linked back via `linkedIncomingUuid`, addressee =
 * the incoming sender, carrying the response package as its `fileMeta`.
 */
export async function dispatchLetter(
  uuid: string,
  input: DispatchLetterInput,
  actorUuid: string,
): Promise<{ incoming: Letter; outgoing: Letter }> {
  await simulatedDelay();
  maybeFail();
  const letters = readLetters();
  const idx = letters.findIndex((l) => l.uuid === uuid);
  if (idx === -1) throw new Error(`Letter not found: ${uuid}`);
  const before = letters[idx]!;
  if (before.status !== 'RESPONDED') throw new LetterValidationError('wrong-status');
  if (!isDevonxona(actorUuid)) throw new LetterValidationError('not-devonxona');

  const now = NOW();
  const outgoing: Letter = {
    uuid: uid(),
    direction: 'OUTGOING',
    number: nextLetterNumber(letters, 'CH'),
    externalOrg: before.externalOrg,
    subject: before.subject,
    channel: input.channel,
    fileMeta: before.responseFileMeta,
    responseDocumentUuid: before.responseDocumentUuid,
    requiresSignature: before.requiresSignature,
    linkedIncomingUuid: before.uuid,
    status: 'DISPATCHED',
    registeredByUuid: actorUuid,
    dispatchedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const incoming: Letter = {
    ...before,
    status: 'CLOSED',
    dispatchedAt: now,
    closedAt: now,
    updatedAt: now,
  };
  letters[idx] = incoming;
  letters.unshift(outgoing);
  writeTable(Tables.letters, letters);

  const actorName = employeeNameFor(actorUuid);
  const params = { letterNumber: outgoing.number, actorName };
  await notifyLetter(
    [incoming.assignedEmployeeUuid, unitHeadOf(incoming.routedToUnitUuid)],
    'LETTER_DISPATCHED',
    incoming,
    params,
  );
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_DISPATCHED',
    resourceType: 'letter',
    resourceUuid: incoming.uuid,
    resourceLabel: letterLabel(incoming),
    context: { outgoingNumber: outgoing.number, channel: input.channel },
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_DISPATCHED',
    resourceType: 'letter',
    resourceUuid: outgoing.uuid,
    resourceLabel: letterLabel(outgoing),
    context: { linkedIncomingNumber: incoming.number, channel: input.channel },
  });
  await appendAudit({
    actorUuid,
    actorName,
    action: 'LETTER_CLOSED',
    resourceType: 'letter',
    resourceUuid: incoming.uuid,
    resourceLabel: letterLabel(incoming),
  });
  return { incoming, outgoing };
}

// === Re-exports ===

export { seedIfEmpty, resetAndSeed, PERSONAS } from './seed';
export type { PersonaKey } from './seed';
export {
  AssignmentValidationError,
  CertificateValidationError,
  DocumentValidationError,
  EmployeeValidationError,
  LetterValidationError,
  MockNetworkError,
  PasswordValidationError,
  UnitValidationError,
} from './errors';
export type {
  AssignmentValidationCode,
  CertificateValidationCode,
  DocumentValidationCode,
  EmployeeValidationCode,
  LetterValidationCode,
  PasswordValidationCode,
  UnitValidationCode,
} from './errors';
