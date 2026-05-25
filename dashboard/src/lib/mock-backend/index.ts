// Public mock-backend API. Each read does a `simulatedDelay()`; each
// mutation does `simulatedDelay()` → `maybeFail()` → read-modify-write
// → `appendAudit()`. All entities are persisted to the namespaced
// localStorage tables defined in `./storage.ts`.

import { simulatedDelay } from './delay';
import { maybeFail } from './errors';
import { readTable, writeTable, Tables } from './storage';
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
  actorUuid?: string;
  limit?: number;
}

export async function listAudit(filters?: AuditFilters): Promise<AuditEntry[]> {
  await simulatedDelay();
  let rows = readTable<AuditEntry>(Tables.audit, []);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.resourceType) rows = rows.filter((r) => r.resourceType === filters.resourceType);
  if (filters?.actorUuid) rows = rows.filter((r) => r.actorUuid === filters.actorUuid);
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
  const level = parent ? parent.level + 1 : 0;
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
  const updated: Unit = {
    ...before,
    ...patch,
    updatedAt: NOW(),
    updatedBy: actorUuid,
  };
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

export async function transferEmployee(
  input: TransferInput,
  actorUuid: string,
): Promise<Assignment> {
  await simulatedDelay();
  maybeFail();
  const assignments = readAssignments();

  if (input.closeOldAssignment) {
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i]!;
      if (a.employeeUuid === input.employeeUuid && a.isPrimary && !a.endDate) {
        assignments[i] = { ...a, endDate: input.startDate, isPrimary: false };
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
    context: {
      newUnitUuid: input.newUnitUuid,
      newPositionId: input.newPositionId,
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

  const emp = readEmployees().find((e) => e.uuid === input.employeeUuid);
  await appendAudit({
    actorUuid,
    action: 'CERTIFICATE_UPLOADED',
    resourceType: 'certificate',
    resourceUuid: cert.uuid,
    resourceLabel: `ERI · ${emp?.fullNameGenerated ?? input.employeeUuid}`,
  });
  if (input.autoApprove) {
    await appendAudit({
      actorUuid,
      action: 'CERTIFICATE_APPROVED',
      resourceType: 'certificate',
      resourceUuid: cert.uuid,
      resourceLabel: `ERI · ${emp?.fullNameGenerated ?? input.employeeUuid}`,
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
  certs[idx] = updated;
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
    action: 'CERTIFICATE_APPROVED', // reuse action; context carries the rejection
    resourceType: 'certificate',
    resourceUuid: uuid,
    resourceLabel: `ERI · ${emp?.fullNameGenerated ?? updated.employeeUuid}`,
    context: { decision: 'REJECTED', reason },
  });
  return updated;
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
  certs[idx] = updated;
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

// === Re-exports ===

export { seedIfEmpty, resetAndSeed } from './seed';
export { MockNetworkError } from './errors';
