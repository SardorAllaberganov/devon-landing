# STEP 06 — Mock backend foundation (localStorage + seed + schemas)

## Prerequisite
Master prompt loaded. Steps 01–05 complete.

## Goal
Stand up a fully-typed mock backend layered over `localStorage` with:
- zod schemas mirroring the TZ data model
- async API functions for every entity (CRUD + queries)
- simulated network latency (200–600ms)
- 3% random failure simulation on mutations
- realistic Uzbek seed data
- "Reset demo" hook that re-seeds cleanly

After this step, the auth store's hardcoded credential check is refactored to read from `mock-backend.users`. Every subsequent feature step consumes this layer.

## Deliverables
- `dashboard/src/types/domain.ts` — full domain types (extend the partial file from step 04)
- `dashboard/src/lib/mock-backend/schemas.ts` — zod schemas
- `dashboard/src/lib/mock-backend/storage.ts` — typed namespaced localStorage wrapper
- `dashboard/src/lib/mock-backend/delay.ts` — simulated latency
- `dashboard/src/lib/mock-backend/errors.ts` — `MockNetworkError`
- `dashboard/src/lib/mock-backend/seed.ts` — initial seed data + `seedIfEmpty()`, `resetAndSeed()`
- `dashboard/src/lib/mock-backend/index.ts` — public API surface
- `dashboard/src/lib/hash.ts` — `sha256Hex(str)` for demo password hashing
- `useAuthStore.login()` refactored to use the mock backend's user table
- UserMenu's "Reset demo" wired to `resetAndSeed()`
- `seedIfEmpty()` called from `main.tsx` before React renders

## Tasks

### 1. Install zod (already required by shadcn forms in step 02; verify)

```bash
npm list zod
# If not installed:
npm install zod
```

### 2. Domain types — `src/types/domain.ts`

Replace the partial file from step 04 with the full set documented in master §15. Copy the types from the master prompt verbatim:

```ts
export type Role =
  | 'ROLE_SUPER_ADMIN' | 'ROLE_HR_ADMIN' | 'ROLE_HR_OPERATOR'
  | 'ROLE_UNIT_HEAD'   | 'ROLE_EMPLOYEE' | 'ROLE_AUDITOR';

export type UnitType =
  | 'DEPARTMENT' | 'DIRECTORATE' | 'DIVISION'
  | 'DEPARTMENT_SUB' | 'SECTION' | 'OTHER';
export type UnitStatus = 'ACTIVE' | 'ARCHIVED';

export interface Unit { /* ... full shape from master §15 ... */ }
export interface Employee { /* ... */ }
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'DRAFT' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type Gender = 'M' | 'F';

export type AssignmentType = 'PRIMARY' | 'COMBINATION' | 'ACTING' | 'TEMPORARY';
export interface Assignment { /* ... */ }

export type CertStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'REJECTED';
export type CertType = 'SIGNING' | 'ENCRYPTION' | 'BOTH';
export interface Certificate { /* ... */ }

export interface User { /* ... */ }

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE'
  | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGED'
  | 'UNIT_TRANSFER' | 'CERTIFICATE_UPLOADED' | 'CERTIFICATE_APPROVED'
  | 'CERTIFICATE_REVOKED' | 'PROFILE_CHANGE_REQUESTED' | 'PROFILE_CHANGE_APPROVED';
export interface AuditEntry { /* ... */ }

export interface ProfileChangeRequest { /* ... */ }

// Positions are seeded data, not user-created in the demo
export interface Position {
  id: string;        // 'POS-DEV' etc.
  nameUz: string;
  allowedUnitTypes: UnitType[];
}
```

> Copy the exact field lists from master §15. Keep the file under ~250 lines.

### 3. zod schemas — `src/lib/mock-backend/schemas.ts`

```ts
import { z } from 'zod';

export const unitTypeSchema = z.enum([
  'DEPARTMENT', 'DIRECTORATE', 'DIVISION', 'DEPARTMENT_SUB', 'SECTION', 'OTHER',
]);

export const unitStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const unitSchema = z.object({
  uuid: z.string().uuid(),
  nameUz: z.string().min(3).max(255),
  nameRu: z.string().optional(),
  shortName: z.string().max(50).optional(),
  code: z.string().min(2).max(20),
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

export const employeeSchema = z.object({
  uuid: z.string().uuid(),
  userUuid: z.string().uuid(),
  lastName: z.string().min(1).max(100),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  fullNameGenerated: z.string(),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().optional(),
  pinfl: z.string().regex(/^[1-6]\d{13}$/, 'common.errors.invalid-pinfl'),
  passportSeries: z.string().optional(),
  workPhone: z.string().optional(),
  internalExtension: z.string().optional(),
  mobilePhone: z.string().regex(/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/),
  corporateEmail: z.string().email(),
  personalEmail: z.string().email().optional(),
  primaryUnitUuid: z.string().uuid(),
  positionId: z.string(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  hireDate: z.string(),
  terminationDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const assignmentSchema = z.object({ /* ... */ });
export const certificateSchema = z.object({ /* ... */ });
export const userSchema = z.object({ /* ... */ });
export const auditEntrySchema = z.object({ /* ... */ });
export const profileChangeRequestSchema = z.object({ /* ... */ });
```

Complete each schema by mirroring the domain types. Schema names must match: e.g., camelCase field names match the TS interfaces.

### 4. Storage layer — `src/lib/mock-backend/storage.ts`

```ts
const NAMESPACE = 'devon.dashboard.';

export function readTable<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeTable<T>(key: string, rows: T[]): void {
  localStorage.setItem(NAMESPACE + key, JSON.stringify(rows));
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith(NAMESPACE))
    .forEach(k => localStorage.removeItem(k));
}

export const Tables = {
  units: 'units',
  employees: 'employees',
  assignments: 'assignments',
  certificates: 'certificates',
  users: 'users',
  audit: 'audit',
  profileRequests: 'profile-requests',
  positions: 'positions',
} as const;
```

### 5. Delay + error simulation

`src/lib/mock-backend/delay.ts`:
```ts
export function simulatedDelay(): Promise<void> {
  const ms = 200 + Math.random() * 400;
  return new Promise(r => setTimeout(r, ms));
}
```

`src/lib/mock-backend/errors.ts`:
```ts
export class MockNetworkError extends Error {
  constructor() {
    super('Network error simulated by mock backend');
    this.name = 'MockNetworkError';
  }
}

export function maybeFail(probability = 0.03): void {
  if (Math.random() < probability) throw new MockNetworkError();
}
```

Conventions:
- All **mutations** call `maybeFail()` once after `simulatedDelay()`.
- **Reads** do not fail randomly. Reads only delay.

### 6. Tiny hash helper — `src/lib/hash.ts`

```ts
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

> Demo only. Real password hashing would use bcrypt/argon2 server-side.

### 7. Seed data — `src/lib/mock-backend/seed.ts`

Realistic, Uzbek-flavoured. Use deterministic UUIDs (e.g., `crypto.randomUUID()` once during seed; persisted afterwards). The seed must produce:

- **6 root departments** (`DEPARTMENT`), each with 2–3 `DIRECTORATE` children, some with `DIVISION` and `SECTION` grandchildren. ~25 units total.
- **~30 employees** with plausible Uzbek FIO, 14-digit PINFL (must pass `/^[1-6]\d{13}$/`), `+998 9X XXX XX XX` phones, `@devon.uz` corporate emails (use `firstname.lastname@devon.uz` slug rule).
- **1 HR_ADMIN user**: `admin@devon.uz` / password hash of `Demo2026!`, linked to one of the seeded employees.
- **~30 active assignments** (one primary per employee linking them to their `primaryUnitUuid`).
- **~25 certificates**: 18 ACTIVE, 4 PENDING_APPROVAL, 2 EXPIRED, 1 REVOKED. Distribute across employees so some employees have multiple, some have none.
- **~60–80 audit entries** spread across the last 30 days, mixing CREATE, UPDATE, LOGIN, UNIT_TRANSFER, CERTIFICATE_UPLOADED, CERTIFICATE_APPROVED.
- **~12 positions** in `Tables.positions` with `allowedUnitTypes` per position.

```ts
// src/lib/mock-backend/seed.ts
import { v4 as uuid } from 'uuid'; // npm install uuid @types/uuid
import { Tables, clearAll, readTable, writeTable } from './storage';
import { sha256Hex } from '@/lib/hash';
import type {
  Unit, Employee, User, Assignment, Certificate, AuditEntry, Position,
} from '@/types/domain';

const SEED_FLAG = 'devon.dashboard.seeded';

const NOW = () => new Date().toISOString();
const DAYS_AGO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

// Position catalogue
const positions: Position[] = [
  { id: 'POS-DIR', nameUz: 'Direktor', allowedUnitTypes: ['DEPARTMENT'] },
  { id: 'POS-DEP-DIR', nameUz: 'Departament rahbari', allowedUnitTypes: ['DEPARTMENT'] },
  { id: 'POS-DIRECT-HEAD', nameUz: 'Boshqarma boshlig\'i', allowedUnitTypes: ['DIRECTORATE'] },
  { id: 'POS-DIV-HEAD', nameUz: 'Bo\'lim boshlig\'i', allowedUnitTypes: ['DIVISION'] },
  { id: 'POS-SUB-HEAD', nameUz: 'Sho\'ba boshlig\'i', allowedUnitTypes: ['DEPARTMENT_SUB'] },
  { id: 'POS-LEAD-DEV', nameUz: 'Bosh dasturchi', allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'] },
  { id: 'POS-DEV', nameUz: 'Dasturchi', allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'] },
  { id: 'POS-ANALYST', nameUz: 'Tahlilchi', allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'] },
  { id: 'POS-SPECIALIST', nameUz: 'Mutaxassis', allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'] },
  { id: 'POS-ACCOUNTANT', nameUz: 'Buxgalter', allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'] },
  { id: 'POS-HR-MANAGER', nameUz: 'Kadrlar bo\'limi boshlig\'i', allowedUnitTypes: ['DIVISION'] },
  { id: 'POS-HR-SPEC', nameUz: 'Kadrlar bo\'yicha mutaxassis', allowedUnitTypes: ['SECTION', 'DEPARTMENT_SUB'] },
];

// Helpers
function makeUnit(partial: Partial<Unit> & Pick<Unit, 'nameUz' | 'type' | 'parentUuid' | 'level' | 'code'>): Unit {
  const id = uuid();
  return {
    uuid: id,
    nameUz: partial.nameUz,
    shortName: partial.shortName,
    code: partial.code,
    type: partial.type,
    parentUuid: partial.parentUuid,
    level: partial.level,
    path: '', // filled after tree is assembled
    status: 'ACTIVE',
    createdAt: DAYS_AGO(120),
    updatedAt: DAYS_AGO(120),
    createdBy: 'demo-hr-admin-uuid',
    updatedBy: 'demo-hr-admin-uuid',
    ...partial,
  };
}

// Build the org tree
function buildUnits(): Unit[] {
  const units: Unit[] = [];

  const itDept = makeUnit({ nameUz: 'Axborot Texnologiyalari Departamenti', shortName: 'IT Departamenti', code: 'DEP-IT', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  const hrDept = makeUnit({ nameUz: 'Kadrlar Departamenti', shortName: 'Kadrlar', code: 'DEP-HR', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  const finDept = makeUnit({ nameUz: 'Moliya Departamenti', shortName: 'Moliya', code: 'DEP-FIN', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  const legalDept = makeUnit({ nameUz: 'Yuridik Departamenti', shortName: 'Yuridik', code: 'DEP-LEG', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  const opsDept = makeUnit({ nameUz: 'Operatsion Departamenti', shortName: 'Operatsion', code: 'DEP-OPS', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  const secDept = makeUnit({ nameUz: 'Xavfsizlik Departamenti', shortName: 'Xavfsizlik', code: 'DEP-SEC', type: 'DEPARTMENT', parentUuid: null, level: 0 });
  units.push(itDept, hrDept, finDept, legalDept, opsDept, secDept);

  // IT department children
  const itInfra = makeUnit({ nameUz: 'Infratuzilma Boshqarmasi', code: 'DEP-IT-INF', type: 'DIRECTORATE', parentUuid: itDept.uuid, level: 1 });
  const itDev = makeUnit({ nameUz: 'Dasturiy Ta\'minot Boshqarmasi', code: 'DEP-IT-DEV', type: 'DIRECTORATE', parentUuid: itDept.uuid, level: 1 });
  units.push(itInfra, itDev);

  const itDevBack = makeUnit({ nameUz: 'Backend Bo\'limi', code: 'DEP-IT-DEV-BE', type: 'DIVISION', parentUuid: itDev.uuid, level: 2 });
  const itDevFront = makeUnit({ nameUz: 'Frontend Bo\'limi', code: 'DEP-IT-DEV-FE', type: 'DIVISION', parentUuid: itDev.uuid, level: 2 });
  units.push(itDevBack, itDevFront);

  const itDevBackApi = makeUnit({ nameUz: 'API Sho\'basi', code: 'DEP-IT-DEV-BE-API', type: 'DEPARTMENT_SUB', parentUuid: itDevBack.uuid, level: 3 });
  units.push(itDevBackApi);

  // HR department children
  const hrRec = makeUnit({ nameUz: 'Ishga Yollash Boshqarmasi', code: 'DEP-HR-REC', type: 'DIRECTORATE', parentUuid: hrDept.uuid, level: 1 });
  const hrComp = makeUnit({ nameUz: 'Tovon va Imtiyozlar Boshqarmasi', code: 'DEP-HR-COMP', type: 'DIRECTORATE', parentUuid: hrDept.uuid, level: 1 });
  units.push(hrRec, hrComp);

  // Finance children
  const finAcc = makeUnit({ nameUz: 'Buxgalteriya Boshqarmasi', code: 'DEP-FIN-ACC', type: 'DIRECTORATE', parentUuid: finDept.uuid, level: 1 });
  const finBud = makeUnit({ nameUz: 'Byudjet Boshqarmasi', code: 'DEP-FIN-BUD', type: 'DIRECTORATE', parentUuid: finDept.uuid, level: 1 });
  units.push(finAcc, finBud);

  // Legal
  const legalCorp = makeUnit({ nameUz: 'Korporativ Huquq Bo\'limi', code: 'DEP-LEG-CORP', type: 'DIVISION', parentUuid: legalDept.uuid, level: 1 });
  units.push(legalCorp);

  // Ops
  const opsLog = makeUnit({ nameUz: 'Logistika Boshqarmasi', code: 'DEP-OPS-LOG', type: 'DIRECTORATE', parentUuid: opsDept.uuid, level: 1 });
  const opsProc = makeUnit({ nameUz: 'Xaridlar Boshqarmasi', code: 'DEP-OPS-PROC', type: 'DIRECTORATE', parentUuid: opsDept.uuid, level: 1 });
  units.push(opsLog, opsProc);

  // Security
  const secInfo = makeUnit({ nameUz: 'Axborot Xavfsizligi Bo\'limi', code: 'DEP-SEC-INFO', type: 'DIVISION', parentUuid: secDept.uuid, level: 1 });
  const secPhys = makeUnit({ nameUz: 'Jismoniy Xavfsizlik Bo\'limi', code: 'DEP-SEC-PHYS', type: 'DIVISION', parentUuid: secDept.uuid, level: 1 });
  units.push(secInfo, secPhys);

  // Compute paths
  const byId = new Map(units.map(u => [u.uuid, u]));
  for (const u of units) {
    if (u.parentUuid === null) {
      u.path = `/${u.uuid}/`;
    } else {
      const parent = byId.get(u.parentUuid)!;
      u.path = `${parent.path}${u.uuid}/`;
    }
  }
  return units;
}

// Build employees + users + assignments
async function buildEmployeesAndUsers(units: Unit[]): Promise<{ employees: Employee[]; users: User[]; assignments: Assignment[] }> {
  // Carefully chosen Uzbek FIOs — gender-aware
  const fios: Array<[string, string, string, 'M' | 'F']> = [
    ['Allaberganov', 'Sardor', 'Otabekovich', 'M'],
    ['Karimov', 'Bekzod', 'Anvarovich', 'M'],
    ['Sobirova', 'Dilnoza', 'Murodovna', 'F'],
    ['Yusupov', 'Jasur', 'Rustamovich', 'M'],
    ['Norbo\'taeva', 'Mohira', 'Sherzodovna', 'F'],
    // ... continue to 30 entries — mix gender, vary patronymics with o'g'li / qizi naturally
  ];

  const employees: Employee[] = [];
  const users: User[] = [];
  const assignments: Assignment[] = [];
  const HR_ADMIN_UUID = 'demo-hr-admin-uuid';
  const HR_ADMIN_EMP_UUID = uuid();

  // First the HR_ADMIN — Sardor Allaberganov
  const hrUnit = units.find(u => u.code === 'DEP-HR-REC')!;
  const hrEmp: Employee = {
    uuid: HR_ADMIN_EMP_UUID,
    userUuid: HR_ADMIN_UUID,
    lastName: 'Allaberganov',
    firstName: 'Sardor',
    middleName: 'Otabekovich',
    fullNameGenerated: 'Allaberganov Sardor Otabekovich',
    gender: 'M',
    birthDate: '1990-03-15',
    pinfl: '32905901230011',
    mobilePhone: '+998 90 123 45 67',
    corporateEmail: 'admin@devon.uz',
    primaryUnitUuid: hrUnit.uuid,
    positionId: 'POS-HR-MANAGER',
    employmentType: 'FULL_TIME',
    hireDate: DAYS_AGO(800),
    status: 'ACTIVE',
    createdAt: DAYS_AGO(800),
    updatedAt: DAYS_AGO(40),
  };
  employees.push(hrEmp);

  const hrAdminUser: User = {
    uuid: HR_ADMIN_UUID,
    employeeUuid: HR_ADMIN_EMP_UUID,
    email: 'admin@devon.uz',
    passwordHash: await sha256Hex('Demo2026!'),
    roles: ['ROLE_HR_ADMIN'],
    mustChangePassword: false,
    createdAt: DAYS_AGO(800),
  };
  users.push(hrAdminUser);

  assignments.push({
    uuid: uuid(),
    employeeUuid: HR_ADMIN_EMP_UUID,
    unitUuid: hrUnit.uuid,
    positionId: 'POS-HR-MANAGER',
    isPrimary: true,
    startDate: DAYS_AGO(800),
    workloadPercent: 100,
    type: 'PRIMARY',
    createdAt: DAYS_AGO(800),
  });

  // The remaining ~29 employees — distribute across units
  // (Generate plausible PINFLs that pass the regex: first digit 1-6, then 13 more digits)
  // (Each gets one primary Assignment)
  // ... iterate fios and assign to varied units
  // Implementation: round-robin across leaf-ish units (DIVISION / DEPARTMENT_SUB / SECTION)
  // For each: create User, Employee, Assignment

  return { employees, users, assignments };
}

function buildCertificates(employees: Employee[]): Certificate[] {
  // 18 ACTIVE, 4 PENDING_APPROVAL, 2 EXPIRED, 1 REVOKED
  // Scattered across employees so distribution is realistic
  // CA name: "YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ"
  // Use plausible serial numbers, thumbprints (random hex), validFrom/validTo dates
  return [/* ... */];
}

function buildAudit(employees: Employee[], units: Unit[]): AuditEntry[] {
  // 60-80 entries spread over 30 days
  // Mix of CREATE / UPDATE / LOGIN / UNIT_TRANSFER / CERTIFICATE_UPLOADED / CERTIFICATE_APPROVED
  return [/* ... */];
}

export async function seedIfEmpty(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG) === '1') return;
  await resetAndSeed();
}

export async function resetAndSeed(): Promise<void> {
  clearAll();
  const units = buildUnits();
  const { employees, users, assignments } = await buildEmployeesAndUsers(units);
  const certificates = buildCertificates(employees);
  const audit = buildAudit(employees, units);

  writeTable(Tables.positions, positions);
  writeTable(Tables.units, units);
  writeTable(Tables.employees, employees);
  writeTable(Tables.users, users);
  writeTable(Tables.assignments, assignments);
  writeTable(Tables.certificates, certificates);
  writeTable(Tables.audit, audit);
  writeTable(Tables.profileRequests, []);

  localStorage.setItem(SEED_FLAG, '1');
}
```

Install `uuid`:
```bash
npm install uuid
npm install -D @types/uuid
```

> Flesh out the placeholder sections (`fios` to 30 entries, `buildCertificates`, `buildAudit`) with realistic data. Quality matters: this is the demo data customers will see.

### 8. Public API — `src/lib/mock-backend/index.ts`

```ts
import { v4 as uuid } from 'uuid';
import { simulatedDelay } from './delay';
import { maybeFail } from './errors';
import { readTable, writeTable, Tables } from './storage';
import type {
  Unit, Employee, User, Assignment, Certificate, AuditEntry, ProfileChangeRequest, Position,
} from '@/types/domain';

// === Reads ===

export async function listUnits(): Promise<Unit[]> {
  await simulatedDelay();
  return readTable<Unit>(Tables.units, []);
}

export async function listEmployees(filters?: {
  search?: string;
  unitUuid?: string;
  status?: Employee['status'];
}): Promise<Employee[]> {
  await simulatedDelay();
  let rows = readTable<Employee>(Tables.employees, []);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(r =>
      r.fullNameGenerated.toLowerCase().includes(q) ||
      r.corporateEmail.toLowerCase().includes(q) ||
      r.pinfl.includes(q)
    );
  }
  if (filters?.unitUuid) rows = rows.filter(r => r.primaryUnitUuid === filters.unitUuid);
  if (filters?.status) rows = rows.filter(r => r.status === filters.status);
  return rows;
}

export async function getEmployee(uuid: string): Promise<Employee | null> {
  await simulatedDelay();
  return readTable<Employee>(Tables.employees, []).find(e => e.uuid === uuid) ?? null;
}

export async function listAssignments(employeeUuid?: string): Promise<Assignment[]> {
  await simulatedDelay();
  const rows = readTable<Assignment>(Tables.assignments, []);
  return employeeUuid ? rows.filter(r => r.employeeUuid === employeeUuid) : rows;
}

export async function listCertificates(filters?: {
  status?: Certificate['status'];
  employeeUuid?: string;
}): Promise<Certificate[]> {
  await simulatedDelay();
  let rows = readTable<Certificate>(Tables.certificates, []);
  if (filters?.status) rows = rows.filter(r => r.status === filters.status);
  if (filters?.employeeUuid) rows = rows.filter(r => r.employeeUuid === filters.employeeUuid);
  return rows;
}

export async function listAudit(filters?: {
  resourceType?: AuditEntry['resourceType'];
  actorUuid?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  await simulatedDelay();
  let rows = readTable<AuditEntry>(Tables.audit, []);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.resourceType) rows = rows.filter(r => r.resourceType === filters.resourceType);
  if (filters?.actorUuid) rows = rows.filter(r => r.actorUuid === filters.actorUuid);
  if (filters?.limit) rows = rows.slice(0, filters.limit);
  return rows;
}

export async function listPositions(): Promise<Position[]> {
  await simulatedDelay();
  return readTable<Position>(Tables.positions, []);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await simulatedDelay();
  return readTable<User>(Tables.users, []).find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

// === Mutations (each: simulatedDelay → maybeFail → mutate) ===

export async function createUnit(input: Omit<Unit, 'uuid' | 'level' | 'path' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, actorUuid: string): Promise<Unit> {
  await simulatedDelay();
  maybeFail();
  const units = readTable<Unit>(Tables.units, []);
  const parent = input.parentUuid ? units.find(u => u.uuid === input.parentUuid) : null;
  const level = parent ? parent.level + 1 : 0;
  const u: Unit = {
    ...input,
    uuid: uuid(),
    level,
    path: '', // computed below
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: actorUuid,
    updatedBy: actorUuid,
  };
  u.path = parent ? `${parent.path}${u.uuid}/` : `/${u.uuid}/`;
  units.push(u);
  writeTable(Tables.units, units);
  await appendAudit({ action: 'CREATE', resourceType: 'unit', resourceUuid: u.uuid, resourceLabel: u.nameUz, actorUuid });
  return u;
}

export async function updateUnit(uuid: string, patch: Partial<Unit>, actorUuid: string): Promise<Unit> { /* ... */ }
export async function archiveUnit(uuid: string, actorUuid: string): Promise<void> { /* ... */ }

export async function createEmployeeFull(payload: {
  employee: Omit<Employee, 'uuid' | 'userUuid' | 'fullNameGenerated' | 'createdAt' | 'updatedAt' | 'status'>;
  password: string;
  role: User['roles'][number];
}, actorUuid: string): Promise<{ employee: Employee; user: User; assignment: Assignment }> {
  /* ... full transactional creation including User + Assignment + audit ... */
}

export async function updateEmployee(uuid: string, patch: Partial<Employee>, actorUuid: string): Promise<Employee> { /* ... */ }
export async function terminateEmployee(uuid: string, actorUuid: string): Promise<void> { /* ... cascade: revoke all certs ... */ }

export async function transferEmployee(input: {
  employeeUuid: string;
  newUnitUuid: string;
  newPositionId: string;
  startDate: string;
  workloadPercent: number;
  type: Assignment['type'];
  closeOldAssignment: boolean;
  reason?: string;
}, actorUuid: string): Promise<Assignment> { /* ... */ }

export async function uploadCertificate(payload: Omit<Certificate, 'uuid' | 'status' | 'createdAt' | 'uploadedByUuid'> & { autoApprove?: boolean }, actorUuid: string): Promise<Certificate> { /* ... */ }
export async function approveCertificate(uuid: string, actorUuid: string): Promise<Certificate> { /* ... */ }
export async function rejectCertificate(uuid: string, reason: string, actorUuid: string): Promise<Certificate> { /* ... */ }
export async function revokeCertificate(uuid: string, reason: Certificate['revocationReason'], actorUuid: string): Promise<Certificate> { /* ... */ }

export async function appendAudit(entry: Omit<AuditEntry, 'uuid' | 'createdAt' | 'actorName'> & { actorName?: string }): Promise<void> { /* ... */ }

export { seedIfEmpty, resetAndSeed } from './seed';
export { MockNetworkError } from './errors';
```

> Fill in every `/* ... */` stub. Mutations always: (1) `simulatedDelay()` → (2) `maybeFail()` → (3) read-modify-write → (4) append audit entry.

### 9. Refactor `useAuthStore.login()`

```ts
import { findUserByEmail } from '@/lib/mock-backend';
import { sha256Hex } from '@/lib/hash';
// ...
login: async (email, password) => {
  try {
    const user = await findUserByEmail(email);
    if (!user) return { ok: false, reason: 'invalid-credentials' };
    const hash = await sha256Hex(password);
    if (hash !== user.passwordHash) return { ok: false, reason: 'invalid-credentials' };
    // Look up employee for fullName
    const { listEmployees } = await import('@/lib/mock-backend');
    const employee = (await listEmployees()).find(e => e.uuid === user.employeeUuid);
    const fullName = employee?.fullNameGenerated ?? user.email;
    const now = new Date();
    set({
      user: { uuid: user.uuid, email: user.email, fullName, roles: user.roles },
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      isAuthenticated: true,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
},
```

### 10. Initialise on app start

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { seedIfEmpty } from '@/lib/mock-backend';

seedIfEmpty().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

### 11. Wire UserMenu reset to `resetAndSeed`

Update the `onResetDemo` handler in `UserMenu.tsx`:
```tsx
import { resetAndSeed } from '@/lib/mock-backend';
...
async function onResetDemo() {
  await resetAndSeed();
  toast.success("Demo ma'lumotlar qayta tiklandi. Sahifa qayta yuklanadi.");
  setTimeout(() => window.location.reload(), 800);
}
```

## Acceptance checks

- [ ] First load: `localStorage.devon.dashboard.seeded === '1'` and all tables are populated
- [ ] In DevTools: `JSON.parse(localStorage['devon.dashboard.employees']).length === 30` (or close — count matches your seed)
- [ ] `JSON.parse(localStorage['devon.dashboard.certificates'])` contains 25 entries with the documented status distribution (18/4/2/1)
- [ ] Login still works with `admin@devon.uz` / `Demo2026!` — auth store now reads from the mock-backend user table
- [ ] Login with wrong password — toast "Email yoki parol noto'g'ri"
- [ ] Login with random simulated network failure (rerun a few times) — toast "Tarmoq xatosi" appears with ~3% probability
- [ ] Reset demo from user menu clears all `devon.dashboard.*` keys, re-seeds, reloads. Counts match again.
- [ ] `npm run build` succeeds — no unused imports, no TS errors
- [ ] All 30 PINFLs pass `/^[1-6]\d{13}$/`
- [ ] All 30 corporate emails end with `@devon.uz`
- [ ] Audit log has 60+ entries; reverse-chronologically sorted by `listAudit()`

## Notes

- The seed function is intentionally large — be thorough. Realistic data sells the demo.
- Audit entries are append-only by convention. There is no `updateAudit` or `deleteAudit` in the public API.
- The `appendAudit()` helper is called from every mutation. Future steps rely on this for the audit log view.
- This step does **not** require any UI changes beyond the auth store refactor. Routing, layout, and login still look the same — but the data now actually exists.

## What "done" looks like

`listEmployees()` returns 30 realistic employees, `listUnits()` returns 25 units in a 4-level hierarchy, `listCertificates()` returns 25 certificates with the right status mix. The demo's data spine is in place; subsequent feature steps consume this layer without further plumbing.
