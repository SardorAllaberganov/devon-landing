// Public mock-backend API. Each read does a `simulatedDelay()`; each
// mutation does `simulatedDelay()` → `maybeFail()` → read-modify-write
// → `appendAudit()`. All entities are persisted to the namespaced
// localStorage tables defined in `./storage.ts`.

import { simulatedDelay } from './delay';
import {
  AssignmentValidationError,
  CertificateValidationError,
  EmployeeValidationError,
  maybeFail,
  PasswordValidationError,
  UnitValidationError,
} from './errors';
import { readTable, writeTable, Tables } from './storage';

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
  Assignment,
  AuditAction,
  AuditEntry,
  AuditResourceType,
  Certificate,
  Employee,
  Position,
  ProfileChangeRequest,
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

// === Reads — profile change requests ===

export async function listProfileRequests(
  status?: ProfileChangeRequest['status'],
): Promise<ProfileChangeRequest[]> {
  await simulatedDelay();
  let rows = readProfileRequests();
  if (status) rows = rows.filter((r) => r.status === status);
  return rows;
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
    'uuid' | 'userUuid' | 'fullNameGenerated' | 'createdAt' | 'updatedAt' | 'status'
  >;
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
  });

  return { employee, user, assignment };
}

export async function updateEmployee(
  uuid: string,
  patch: Partial<Omit<Employee, 'uuid' | 'userUuid' | 'createdAt' | 'fullNameGenerated'>>,
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

// === Re-exports ===

export { seedIfEmpty, resetAndSeed } from './seed';
export {
  AssignmentValidationError,
  CertificateValidationError,
  EmployeeValidationError,
  MockNetworkError,
  PasswordValidationError,
  UnitValidationError,
} from './errors';
export type {
  AssignmentValidationCode,
  CertificateValidationCode,
  EmployeeValidationCode,
  PasswordValidationCode,
  UnitValidationCode,
} from './errors';
