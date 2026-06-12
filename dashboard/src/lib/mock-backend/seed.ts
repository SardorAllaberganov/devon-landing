// Devon mock-backend seed. Produces realistic Uzbek data the demo
// can be exercised against immediately — ~26 units in the 4-level
// hierarchy (+ the root-level Devonxona), 31 employees, 31 primary
// assignments, 26 certificates in the 19/4/2/1 status distribution,
// ~70 audit entries spread over the last 30 days, the position
// catalogue, and ~20 milestone-2 notifications across the personas.
//
// Uses native `crypto.randomUUID()` — browsers ship it natively
// since 2022. No `uuid` npm package needed.

import { sha256Hex } from '@/lib/hash';
import { Tables, clearAll, writeTable } from './storage';
import type {
  AppNotification,
  Assignment,
  AuditAction,
  AuditEntry,
  AuditResourceType,
  Certificate,
  CertStatus,
  CertType,
  Employee,
  Gender,
  NotificationType,
  Position,
  Role,
  Unit,
  UnitType,
  User,
} from '@/types/domain';

const SEED_FLAG = 'devon.dashboard.seeded';
// Bump whenever seed.ts changes shape OR fixture identity (renames, status
// distributions, hierarchy reshapes). Mismatched versions in localStorage
// trigger a silent reseed on next app load — keeps demos consistent without
// asking users to hit "Reset demo" after every change.
const SEED_VERSION = '5';

const uuid = () => crypto.randomUUID();
const NOW = () => new Date().toISOString();
const DAYS_AGO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const DAYS_FROM_NOW = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const HR_ADMIN_USER_UUID = 'demo-hr-admin-uuid';
const HR_ADMIN_NAME = 'Pulatov Asilbek Karimovich';
const CA_NAME = "YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ";
const ORG_SHORT = 'Devon Demo';

function asciiSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function emailFor(firstName: string, lastName: string): string {
  return `${asciiSlug(firstName)}.${asciiSlug(lastName)}@devon.uz`;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Generate a plausible PINFL matching the /^[1-6]\d{13}$/ regex.
// First digit encodes century + gender per Uzbek convention.
function generatePinfl(gender: Gender, hireYear: number): string {
  const firstDigit = gender === 'M' ? (hireYear < 2018 ? '3' : '5') : hireYear < 2018 ? '4' : '6';
  let rest = '';
  for (let i = 0; i < 13; i++) rest += randInt(0, 9);
  return firstDigit + rest;
}

const MOBILE_PREFIXES = ['90', '91', '93', '94', '97', '98', '99'] as const;

function generatePhone(): string {
  return `+998 ${pick(MOBILE_PREFIXES)} ${pad(randInt(100, 999), 3)} ${pad(randInt(10, 99), 2)} ${pad(randInt(10, 99), 2)}`;
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, 15)];
  return s;
}

// === POV personas (milestone 2, step 16) ===

// Fixed literal employee UUIDs (valid v4 shape — version nibble 4, variant 8)
// so steps 17–21 can seed documents/letters referencing the personas
// deterministically. Everything else keeps `crypto.randomUUID()`.
export const PERSONAS = {
  /** Pulatov Asilbek Karimovich — Kadrlar bo'yicha admin (the login user). */
  HR_ADMIN: '00000000-0000-4000-8000-00000000a001',
  /** Karimov Bekzod Anvarovich — IT Departamenti rahbari (root-level head). */
  RAHBAR: '00000000-0000-4000-8000-00000000a002',
  /** Akhmedov Akmal Zafarbekovich — Backend Bo'limi boshlig'i. */
  BOLIM_BOSHLIGI: '00000000-0000-4000-8000-00000000a003',
  /** Yusupova Nilufar Baxtiyorovna — Devonxona xodimi. */
  DEVONXONA: '00000000-0000-4000-8000-00000000a004',
  /** Sobirova Dilnoza Murodovna — API Sho'basi dasturchisi (oddiy xodim). */
  XODIM: '00000000-0000-4000-8000-00000000a005',
} as const;

export type PersonaKey = keyof typeof PERSONAS;

// === Positions catalogue ===

const positions: Position[] = [
  { id: 'POS-DIR', nameUz: 'Direktor', allowedUnitTypes: ['DEPARTMENT'] },
  { id: 'POS-DEP-HEAD', nameUz: 'Departament rahbari', allowedUnitTypes: ['DEPARTMENT'] },
  {
    id: 'POS-DIRECT-HEAD',
    nameUz: "Boshqarma boshlig'i",
    allowedUnitTypes: ['DIRECTORATE'],
  },
  { id: 'POS-DIV-HEAD', nameUz: "Bo'lim boshlig'i", allowedUnitTypes: ['DIVISION'] },
  { id: 'POS-SUB-HEAD', nameUz: "Sho'ba boshlig'i", allowedUnitTypes: ['DEPARTMENT_SUB'] },
  {
    id: 'POS-LEAD-DEV',
    nameUz: 'Bosh dasturchi',
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION'],
  },
  {
    id: 'POS-DEV',
    nameUz: 'Dasturchi',
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION', 'DIVISION'],
  },
  {
    id: 'POS-ANALYST',
    nameUz: 'Tahlilchi',
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION', 'DIRECTORATE'],
  },
  {
    id: 'POS-SPECIALIST',
    nameUz: 'Mutaxassis',
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION', 'DIVISION', 'DIRECTORATE'],
  },
  {
    id: 'POS-ACCOUNTANT',
    nameUz: 'Buxgalter',
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION', 'DIVISION', 'DIRECTORATE'],
  },
  {
    id: 'POS-HR-MANAGER',
    nameUz: "Kadrlar bo'limi boshlig'i",
    allowedUnitTypes: ['DIRECTORATE', 'DIVISION'],
  },
  {
    id: 'POS-HR-SPEC',
    nameUz: "Kadrlar bo'yicha mutaxassis",
    allowedUnitTypes: ['DEPARTMENT_SUB', 'SECTION', 'DIRECTORATE', 'DIVISION'],
  },
  { id: 'POS-LAWYER', nameUz: 'Yurist', allowedUnitTypes: ['DIVISION', 'SECTION'] },
  {
    id: 'POS-SECURITY-SPEC',
    nameUz: 'Xavfsizlik mutaxassisi',
    allowedUnitTypes: ['DIVISION', 'SECTION', 'DEPARTMENT_SUB'],
  },
  {
    id: 'POS-CHANCELLERY',
    nameUz: 'Devonxona xodimi',
    allowedUnitTypes: ['OTHER'],
  },
];

// Positions whose holder heads their unit — drives `headEmployeeUuid` wiring
// (the POV switcher's `headedUnitUuids` and the M2 approval queues key off it).
const HEAD_POSITION_IDS = new Set([
  'POS-DIR',
  'POS-DEP-HEAD',
  'POS-DIRECT-HEAD',
  'POS-DIV-HEAD',
  'POS-SUB-HEAD',
  'POS-HR-MANAGER',
]);

// === Unit tree builder ===

interface UnitSpec {
  code: string;
  nameUz: string;
  shortName?: string;
  type: UnitType;
  parentCode: string | null;
}

const unitSpecs: UnitSpec[] = [
  // Level 0 — departments
  {
    code: 'DEP-IT',
    nameUz: 'Axborot Texnologiyalari Departamenti',
    shortName: 'IT Departamenti',
    type: 'DEPARTMENT',
    parentCode: null,
  },
  {
    code: 'DEP-HR',
    nameUz: 'Kadrlar Departamenti',
    shortName: 'Kadrlar',
    type: 'DEPARTMENT',
    parentCode: null,
  },
  {
    code: 'DEP-FIN',
    nameUz: 'Moliya Departamenti',
    shortName: 'Moliya',
    type: 'DEPARTMENT',
    parentCode: null,
  },
  {
    code: 'DEP-LEG',
    nameUz: 'Yuridik Departamenti',
    shortName: 'Yuridik',
    type: 'DEPARTMENT',
    parentCode: null,
  },
  {
    code: 'DEP-OPS',
    nameUz: 'Operatsion Departamenti',
    shortName: 'Operatsion',
    type: 'DEPARTMENT',
    parentCode: null,
  },
  {
    code: 'DEP-SEC',
    nameUz: 'Xavfsizlik Departamenti',
    shortName: 'Xavfsizlik',
    type: 'DEPARTMENT',
    parentCode: null,
  },

  // IT branch
  {
    code: 'DEP-IT-INF',
    nameUz: 'Infratuzilma Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-IT',
  },
  {
    code: 'DEP-IT-INF-NET',
    nameUz: "Tarmoq Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-IT-INF',
  },
  {
    code: 'DEP-IT-INF-SRV',
    nameUz: "Server Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-IT-INF',
  },
  {
    code: 'DEP-IT-DEV',
    nameUz: "Dasturiy Ta'minot Boshqarmasi",
    type: 'DIRECTORATE',
    parentCode: 'DEP-IT',
  },
  {
    code: 'DEP-IT-DEV-BE',
    nameUz: "Backend Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-IT-DEV',
  },
  {
    code: 'DEP-IT-DEV-BE-API',
    nameUz: "API Sho'basi",
    type: 'DEPARTMENT_SUB',
    parentCode: 'DEP-IT-DEV-BE',
  },
  {
    code: 'DEP-IT-DEV-FE',
    nameUz: "Frontend Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-IT-DEV',
  },
  {
    code: 'DEP-IT-DEV-FE-UI',
    nameUz: "UI Sho'basi",
    type: 'DEPARTMENT_SUB',
    parentCode: 'DEP-IT-DEV-FE',
  },

  // HR branch
  {
    code: 'DEP-HR-REC',
    nameUz: 'Ishga Yollash Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-HR',
  },
  {
    code: 'DEP-HR-REC-ONB',
    nameUz: "Onboarding Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-HR-REC',
  },
  {
    code: 'DEP-HR-COMP',
    nameUz: 'Tovon va Imtiyozlar Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-HR',
  },

  // Finance branch
  {
    code: 'DEP-FIN-ACC',
    nameUz: 'Buxgalteriya Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-FIN',
  },
  {
    code: 'DEP-FIN-ACC-TAX',
    nameUz: "Soliq Hisoboti Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-FIN-ACC',
  },
  {
    code: 'DEP-FIN-BUD',
    nameUz: 'Byudjet Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-FIN',
  },

  // Legal branch
  {
    code: 'DEP-LEG-CORP',
    nameUz: "Korporativ Huquq Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-LEG',
  },

  // Operations branch
  {
    code: 'DEP-OPS-LOG',
    nameUz: 'Logistika Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-OPS',
  },
  {
    code: 'DEP-OPS-PROC',
    nameUz: 'Xaridlar Boshqarmasi',
    type: 'DIRECTORATE',
    parentCode: 'DEP-OPS',
  },

  // Security branch
  {
    code: 'DEP-SEC-INFO',
    nameUz: "Axborot Xavfsizligi Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-SEC',
  },
  {
    code: 'DEP-SEC-PHYS',
    nameUz: "Jismoniy Xavfsizlik Bo'limi",
    type: 'DIVISION',
    parentCode: 'DEP-SEC',
  },

  // Devonxona (chancellery) — root-level service unit; owns incoming/outgoing
  // letter registration + dispatch in milestone 2 (BPMN 3.3).
  {
    code: 'DEV-01',
    nameUz: 'Devonxona',
    type: 'OTHER',
    parentCode: null,
  },
];

function buildUnits(): { units: Unit[]; byCode: Map<string, Unit> } {
  const byCode = new Map<string, Unit>();
  const units: Unit[] = [];

  // First pass: create units without path
  for (const spec of unitSpecs) {
    const parent = spec.parentCode ? byCode.get(spec.parentCode) : null;
    const level = parent ? parent.level + 1 : 0;
    const u: Unit = {
      uuid: uuid(),
      nameUz: spec.nameUz,
      shortName: spec.shortName,
      code: spec.code,
      type: spec.type,
      parentUuid: parent?.uuid ?? null,
      level,
      path: '',
      status: 'ACTIVE',
      createdAt: DAYS_AGO(120),
      updatedAt: DAYS_AGO(60),
      createdBy: HR_ADMIN_USER_UUID,
      updatedBy: HR_ADMIN_USER_UUID,
    };
    units.push(u);
    byCode.set(spec.code, u);
  }

  // Second pass: compute paths
  for (const u of units) {
    if (u.parentUuid === null) {
      u.path = `/${u.uuid}/`;
    } else {
      const parent = units.find((p) => p.uuid === u.parentUuid)!;
      u.path = `${parent.path}${u.uuid}/`;
    }
  }

  return { units, byCode };
}

// === Employees + Users + Assignments ===

// FIO catalogue. Order is significant — index 0 is the HR_ADMIN.
interface Fio {
  lastName: string;
  firstName: string;
  middleName: string;
  gender: Gender;
}

const fios: Fio[] = [
  { lastName: 'Pulatov', firstName: 'Asilbek', middleName: 'Karimovich', gender: 'M' },
  { lastName: 'Karimov', firstName: 'Bekzod', middleName: 'Anvarovich', gender: 'M' },
  { lastName: 'Yusupov', firstName: 'Jasur', middleName: 'Rustamovich', gender: 'M' },
  { lastName: 'Tursunov', firstName: 'Doniyor', middleName: 'Olimovich', gender: 'M' },
  { lastName: 'Saidov', firstName: 'Bobur', middleName: 'Tohirovich', gender: 'M' },
  { lastName: 'Rashidov', firstName: 'Ilxomjon', middleName: 'Shavkatovich', gender: 'M' },
  { lastName: 'Akhmedov', firstName: 'Akmal', middleName: 'Zafarbekovich', gender: 'M' },
  { lastName: 'Komilov', firstName: 'Sherzod', middleName: 'Iskandarovich', gender: 'M' },
  { lastName: 'Mirzayev', firstName: 'Aziz', middleName: 'Davronovich', gender: 'M' },
  { lastName: 'Toshmuhammedov', firstName: "Ulug'bek", middleName: 'Ravshanovich', gender: 'M' },
  { lastName: 'Xolmatov', firstName: 'Shohrux', middleName: 'Maxsumovich', gender: 'M' },
  { lastName: 'Nazarov', firstName: 'Sanjar', middleName: 'Erkinovich', gender: 'M' },
  { lastName: 'Egamberdiyev', firstName: 'Otabek', middleName: 'Nurmuhammadovich', gender: 'M' },
  { lastName: 'Abdullaev', firstName: 'Husan', middleName: 'Akbarovich', gender: 'M' },
  { lastName: 'Ergashev', firstName: 'Davron', middleName: 'Lazizovich', gender: 'M' },
  { lastName: 'Sobirova', firstName: 'Dilnoza', middleName: 'Murodovna', gender: 'F' },
  { lastName: "Norbo'taeva", firstName: 'Mohira', middleName: 'Sherzodovna', gender: 'F' },
  { lastName: "Yo'ldosheva", firstName: 'Nilufar', middleName: 'Bahodirovna', gender: 'F' },
  { lastName: 'Saidova', firstName: 'Gulnoza', middleName: 'Ruxshonovna', gender: 'F' },
  { lastName: 'Rakhimova', firstName: 'Aziza', middleName: 'Doniyorovna', gender: 'F' },
  { lastName: 'Komilova', firstName: 'Mahliyo', middleName: 'Ozodbekovna', gender: 'F' },
  { lastName: 'Tursunova', firstName: 'Madina', middleName: 'Farxodovna', gender: 'F' },
  { lastName: 'Saidova', firstName: 'Shaxnoza', middleName: 'Olimjonovna', gender: 'F' },
  { lastName: 'Xolmatova', firstName: 'Charos', middleName: 'Akmalovna', gender: 'F' },
  { lastName: 'Karimova', firstName: 'Diyora', middleName: 'Rashidovna', gender: 'F' },
  { lastName: 'Ergasheva', firstName: 'Zarina', middleName: 'Yusupovna', gender: 'F' },
  { lastName: 'Mirzaeva', firstName: 'Sevara', middleName: 'Bahromovna', gender: 'F' },
  { lastName: 'Toshmuhammedova', firstName: 'Marjona', middleName: 'Anvarovna', gender: 'F' },
  { lastName: 'Egamberdiyeva', firstName: 'Sevinch', middleName: 'Nodirovna', gender: 'F' },
  { lastName: 'Akhmedova', firstName: 'Munisa', middleName: 'Akrambekovna', gender: 'F' },
  // Index 30 — the Devonxona persona (milestone 2, step 16).
  { lastName: 'Yusupova', firstName: 'Nilufar', middleName: 'Baxtiyorovna', gender: 'F' },
];

// FIO index → { unitCode, positionId, employmentType, status, hireDaysAgo }
interface Assign {
  fioIdx: number;
  unitCode: string;
  positionId: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status?: Employee['status'];
  hireDaysAgo: number;
  /** Fixed employee UUID — only the five POV personas pin theirs (see PERSONAS). */
  employeeUuid?: string;
  /** Role override — defaults to HR_ADMIN for index 0, ROLE_EMPLOYEE otherwise. */
  roles?: Role[];
}

const fioToUnit: Assign[] = [
  // Index 0 — Asilbek, HR_ADMIN (persona: HR_ADMIN)
  {
    fioIdx: 0,
    unitCode: 'DEP-HR-REC',
    positionId: 'POS-HR-MANAGER',
    hireDaysAgo: 1100,
    employeeUuid: PERSONAS.HR_ADMIN,
  },

  // IT branch
  {
    // Persona: RAHBAR — head of the root IT Departament.
    fioIdx: 1,
    unitCode: 'DEP-IT',
    positionId: 'POS-DEP-HEAD',
    hireDaysAgo: 1500,
    employeeUuid: PERSONAS.RAHBAR,
  },
  { fioIdx: 2, unitCode: 'DEP-IT-INF', positionId: 'POS-DIRECT-HEAD', hireDaysAgo: 1200 },
  { fioIdx: 3, unitCode: 'DEP-IT-INF-NET', positionId: 'POS-SPECIALIST', hireDaysAgo: 800 },
  { fioIdx: 4, unitCode: 'DEP-IT-INF-SRV', positionId: 'POS-SPECIALIST', hireDaysAgo: 700 },
  { fioIdx: 5, unitCode: 'DEP-IT-DEV', positionId: 'POS-DIRECT-HEAD', hireDaysAgo: 1300 },
  {
    // Persona: BOLIM_BOSHLIGI — head of the Backend Bo'lim; sits one level
    // above the XODIM persona so the M2 approval chain walks one branch.
    fioIdx: 6,
    unitCode: 'DEP-IT-DEV-BE',
    positionId: 'POS-DIV-HEAD',
    hireDaysAgo: 900,
    employeeUuid: PERSONAS.BOLIM_BOSHLIGI,
  },
  { fioIdx: 7, unitCode: 'DEP-IT-DEV-BE-API', positionId: 'POS-LEAD-DEV', hireDaysAgo: 600 },
  {
    // Persona: XODIM — oddiy xodim inside the Backend Bo'lim's subtree.
    fioIdx: 15,
    unitCode: 'DEP-IT-DEV-BE-API',
    positionId: 'POS-DEV',
    employmentType: 'FULL_TIME',
    hireDaysAgo: 380,
    employeeUuid: PERSONAS.XODIM,
  },
  { fioIdx: 8, unitCode: 'DEP-IT-DEV-FE', positionId: 'POS-DIV-HEAD', hireDaysAgo: 950 },
  { fioIdx: 9, unitCode: 'DEP-IT-DEV-FE-UI', positionId: 'POS-LEAD-DEV', hireDaysAgo: 500 },
  {
    fioIdx: 16,
    unitCode: 'DEP-IT-DEV-FE-UI',
    positionId: 'POS-DEV',
    employmentType: 'INTERN',
    hireDaysAgo: 90,
  },

  // HR branch
  { fioIdx: 10, unitCode: 'DEP-HR', positionId: 'POS-DEP-HEAD', hireDaysAgo: 1400 },
  { fioIdx: 17, unitCode: 'DEP-HR-REC-ONB', positionId: 'POS-HR-SPEC', hireDaysAgo: 420 },
  { fioIdx: 18, unitCode: 'DEP-HR-COMP', positionId: 'POS-HR-SPEC', hireDaysAgo: 650 },
  {
    fioIdx: 11,
    unitCode: 'DEP-HR-COMP',
    positionId: 'POS-HR-SPEC',
    status: 'ON_LEAVE',
    hireDaysAgo: 1100,
  },

  // Finance branch
  { fioIdx: 12, unitCode: 'DEP-FIN', positionId: 'POS-DEP-HEAD', hireDaysAgo: 1600 },
  { fioIdx: 19, unitCode: 'DEP-FIN-ACC', positionId: 'POS-ACCOUNTANT', hireDaysAgo: 480 },
  { fioIdx: 20, unitCode: 'DEP-FIN-ACC-TAX', positionId: 'POS-ACCOUNTANT', hireDaysAgo: 320 },
  { fioIdx: 21, unitCode: 'DEP-FIN-BUD', positionId: 'POS-ANALYST', hireDaysAgo: 280 },

  // Legal branch
  { fioIdx: 13, unitCode: 'DEP-LEG', positionId: 'POS-DEP-HEAD', hireDaysAgo: 1700 },
  { fioIdx: 22, unitCode: 'DEP-LEG-CORP', positionId: 'POS-LAWYER', hireDaysAgo: 540 },
  { fioIdx: 23, unitCode: 'DEP-LEG-CORP', positionId: 'POS-LAWYER', hireDaysAgo: 220 },

  // Ops branch
  {
    fioIdx: 14,
    unitCode: 'DEP-OPS-LOG',
    positionId: 'POS-SPECIALIST',
    employmentType: 'CONTRACT',
    hireDaysAgo: 200,
  },
  { fioIdx: 24, unitCode: 'DEP-OPS-PROC', positionId: 'POS-SPECIALIST', hireDaysAgo: 360 },
  {
    fioIdx: 29,
    unitCode: 'DEP-OPS-PROC',
    positionId: 'POS-SPECIALIST',
    employmentType: 'PART_TIME',
    hireDaysAgo: 110,
  },

  // Security branch
  { fioIdx: 25, unitCode: 'DEP-SEC-INFO', positionId: 'POS-SECURITY-SPEC', hireDaysAgo: 720 },
  { fioIdx: 26, unitCode: 'DEP-SEC-INFO', positionId: 'POS-SECURITY-SPEC', hireDaysAgo: 250 },
  { fioIdx: 27, unitCode: 'DEP-SEC-PHYS', positionId: 'POS-SPECIALIST', hireDaysAgo: 850 },
  { fioIdx: 28, unitCode: 'DEP-SEC-PHYS', positionId: 'POS-SPECIALIST', hireDaysAgo: 180 },

  // Devonxona
  {
    // Persona: DEVONXONA — registers and dispatches letters in M2 (BPMN 3.3).
    fioIdx: 30,
    unitCode: 'DEV-01',
    positionId: 'POS-CHANCELLERY',
    hireDaysAgo: 460,
    employeeUuid: PERSONAS.DEVONXONA,
    roles: ['ROLE_DEVONXONA'],
  },
];

async function buildEmployeesAndUsers(byCode: Map<string, Unit>): Promise<{
  employees: Employee[];
  users: User[];
  assignments: Assignment[];
}> {
  const employees: Employee[] = [];
  const users: User[] = [];
  const assignments: Assignment[] = [];

  // Mostly PDFs with a few scans, picked deterministically per employee.
  const extractMimes = [
    'application/pdf',
    'application/pdf',
    'application/pdf',
    'image/jpeg',
    'image/png',
  ] as const;

  for (const assign of fioToUnit) {
    const fio = fios[assign.fioIdx]!;
    const unit = byCode.get(assign.unitCode);
    if (!unit) throw new Error(`Unit not found: ${assign.unitCode}`);

    const isHrAdmin = assign.fioIdx === 0;
    const hireDate = DAYS_AGO(assign.hireDaysAgo);
    const hireYear = new Date(hireDate).getUTCFullYear();
    const fullNameGenerated = `${fio.lastName} ${fio.firstName} ${fio.middleName}`;

    const extractMime = extractMimes[assign.fioIdx % extractMimes.length]!;
    const extractExt =
      extractMime === 'application/pdf' ? 'pdf' : extractMime === 'image/png' ? 'png' : 'jpg';

    const employeeUuid = assign.employeeUuid ?? uuid();
    const userUuid = isHrAdmin ? HR_ADMIN_USER_UUID : uuid();

    const corporateEmail = isHrAdmin
      ? 'admin@devon.uz'
      : emailFor(fio.firstName, fio.lastName);

    const employee: Employee = {
      uuid: employeeUuid,
      userUuid,
      lastName: fio.lastName,
      firstName: fio.firstName,
      middleName: fio.middleName,
      fullNameGenerated,
      gender: fio.gender,
      birthDate: DAYS_AGO(365 * randInt(24, 55)).slice(0, 10),
      pinfl: generatePinfl(fio.gender, hireYear),
      mobilePhone: generatePhone(),
      corporateEmail,
      primaryUnitUuid: unit.uuid,
      positionId: assign.positionId,
      employmentType: assign.employmentType ?? 'FULL_TIME',
      hireDate,
      employmentOrderExtract: {
        fileName: `buyruq_${hireYear}-${10 + assign.fioIdx * 3 + randInt(0, 2)}_kochirma.${extractExt}`,
        fileSize: randInt(180, 1200) * 1024,
        mimeType: extractMime,
        uploadedAt: hireDate,
      },
      status: assign.status ?? 'ACTIVE',
      createdAt: hireDate,
      updatedAt: DAYS_AGO(Math.max(1, assign.hireDaysAgo - randInt(10, 60))),
    };
    employees.push(employee);

    const user: User = {
      uuid: userUuid,
      employeeUuid,
      email: corporateEmail,
      passwordHash: await sha256Hex(isHrAdmin ? 'Demo2026!' : 'Welcome2026!'),
      roles: assign.roles ?? (isHrAdmin ? ['ROLE_HR_ADMIN'] : ['ROLE_EMPLOYEE']),
      mustChangePassword: !isHrAdmin,
      createdAt: hireDate,
    };
    users.push(user);

    // Head-position holders head their unit. First holder wins — the seed
    // never places two head positions in one unit.
    if (HEAD_POSITION_IDS.has(assign.positionId) && !unit.headEmployeeUuid) {
      unit.headEmployeeUuid = employeeUuid;
    }

    assignments.push({
      uuid: uuid(),
      employeeUuid,
      unitUuid: unit.uuid,
      positionId: assign.positionId,
      isPrimary: true,
      startDate: hireDate,
      workloadPercent: assign.employmentType === 'PART_TIME' ? 50 : 100,
      type: 'PRIMARY',
      createdAt: hireDate,
    });
  }

  return { employees, users, assignments };
}

// === Certificates ===

function buildCertificates(employees: Employee[]): Certificate[] {
  // 19 ACTIVE / 4 PENDING_APPROVAL / 2 EXPIRED / 1 REVOKED = 26 total
  // (the 19th ACTIVE belongs to the Devonxona persona, added in step 16).
  // Distribute across ~17 employees so some have multiple, some have none.
  //
  // POV-persona invariant (step 16): every PERSONAS employee must be ACTIVE
  // and hold at least one ACTIVE certificate — the ERI signing steps (19/21)
  // depend on it. HR_ADMIN/RAHBAR/BOLIM_BOSHLIGI/XODIM sit at employee
  // indices 0/1/6/8 of `activeOwners` below; DEVONXONA gets hers explicitly.
  const certificates: Certificate[] = [];

  function makeCert(
    employee: Employee,
    status: CertStatus,
    certificateType: CertType,
    overrides: Partial<Certificate> = {},
  ): Certificate {
    const validFromBase = status === 'EXPIRED' ? DAYS_AGO(800) : DAYS_AGO(180);
    const validToBase =
      status === 'EXPIRED' ? DAYS_AGO(80) : DAYS_FROM_NOW(365 - 180);
    const cert: Certificate = {
      uuid: uuid(),
      employeeUuid: employee.uuid,
      serialNumber: randomHex(16).toUpperCase(),
      thumbprint: randomHex(40),
      subjectPinfl: employee.pinfl,
      subjectCommonName: employee.fullNameGenerated,
      subjectOrganization: ORG_SHORT,
      issuerName: CA_NAME,
      validFrom: validFromBase,
      validTo: validToBase,
      keyUsage:
        certificateType === 'BOTH'
          ? ['digitalSignature', 'keyEncipherment', 'nonRepudiation']
          : certificateType === 'SIGNING'
            ? ['digitalSignature', 'nonRepudiation']
            : ['keyEncipherment'],
      certificateType,
      status,
      uploadedByUuid: HR_ADMIN_USER_UUID,
      approvedByUuid:
        status === 'ACTIVE' || status === 'EXPIRED' || status === 'REVOKED'
          ? HR_ADMIN_USER_UUID
          : undefined,
      approvedAt:
        status === 'ACTIVE' || status === 'EXPIRED' || status === 'REVOKED'
          ? DAYS_AGO(150)
          : undefined,
      createdAt: status === 'PENDING_APPROVAL' ? DAYS_AGO(randInt(1, 5)) : DAYS_AGO(180),
      ...overrides,
    };
    return cert;
  }

  // 18 ACTIVE — distribute across first 14 employees, with a few employees holding 2
  const activeOwners = [0, 1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 19, 22, 0, 5, 9, 25];
  for (let i = 0; i < 18; i++) {
    const emp = employees[activeOwners[i % activeOwners.length]!]!;
    certificates.push(
      makeCert(emp, 'ACTIVE', i % 3 === 0 ? 'BOTH' : i % 2 === 0 ? 'SIGNING' : 'ENCRYPTION'),
    );
  }

  // 4 PENDING_APPROVAL — recent uploads waiting on HR_ADMIN review
  const pendingOwners = [15, 16, 17, 20];
  for (const idx of pendingOwners) {
    const emp = employees[idx]!;
    certificates.push(makeCert(emp, 'PENDING_APPROVAL', 'SIGNING'));
  }

  // 2 EXPIRED — old certs past their validity window
  certificates.push(makeCert(employees[3]!, 'EXPIRED', 'SIGNING'));
  certificates.push(makeCert(employees[14]!, 'EXPIRED', 'BOTH'));

  // 1 REVOKED — compromised / replaced
  certificates.push(
    makeCert(employees[4]!, 'REVOKED', 'SIGNING', {
      revokedAt: DAYS_AGO(45),
      revocationReason: 'COMPROMISED',
    }),
  );

  // 1 more ACTIVE — the Devonxona persona joined after the original 25-cert
  // distribution was laid out; she signs outgoing letters in step 21.
  const devonxonaEmp = employees.find((e) => e.uuid === PERSONAS.DEVONXONA);
  if (devonxonaEmp) certificates.push(makeCert(devonxonaEmp, 'ACTIVE', 'SIGNING'));

  return certificates;
}

// === Notifications (milestone 2 rails) ===

// Placeholder resource UUIDs (fixed literals, valid v4 shape). Steps 17/20
// seed real documents/letters under these exact UUIDs so the notification
// deep-links below start resolving retroactively. Until then a click lands
// on the step-16 placeholder pages / home redirect — acceptable per step 16.
const DOC_UUID = (n: number) => `00000000-0000-4000-8000-00000000d00${n}`;
const LETTER_UUID = (n: number) => `00000000-0000-4000-8000-00000000f00${n}`;

interface NotificationSpec {
  recipient: string;
  type: NotificationType;
  params: Record<string, string>;
  resourceType: AppNotification['resourceType'];
  resourceUuid: string;
  isRead: boolean;
  daysAgo: number;
}

function buildNotifications(employees: Employee[]): AppNotification[] {
  const nameOf = (employeeUuid: string) =>
    employees.find((e) => e.uuid === employeeUuid)?.fullNameGenerated ?? '';
  const xodim = nameOf(PERSONAS.XODIM);
  const rahbar = nameOf(PERSONAS.RAHBAR);
  const bolim = nameOf(PERSONAS.BOLIM_BOSHLIGI);
  const devonxona = nameOf(PERSONAS.DEVONXONA);
  const hrAdmin = nameOf(PERSONAS.HR_ADMIN);

  // 20 rows across the five personas — every NotificationType appears at
  // least once, read/unread mixed, timestamps spread over the last 5 days.
  // The story follows two documents and two letters walking their BPMN
  // chains between the personas.
  const specs: NotificationSpec[] = [
    // HJ-2026/0007 — XODIM's draft mid-chain: kelishuv → qaror → imzo
    {
      recipient: PERSONAS.BOLIM_BOSHLIGI,
      type: 'DOC_REVIEW_REQUESTED',
      params: { docNumber: 'HJ-2026/0007', actorName: xodim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(1),
      isRead: false,
      daysAgo: 0.2,
    },
    {
      recipient: PERSONAS.XODIM,
      type: 'DOC_DECIDED',
      params: { docNumber: 'HJ-2026/0007', actorName: bolim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(1),
      isRead: false,
      daysAgo: 0.15,
    },
    {
      recipient: PERSONAS.RAHBAR,
      type: 'DOC_SIGN_REQUESTED',
      params: { docNumber: 'HJ-2026/0007', actorName: xodim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(1),
      isRead: false,
      daysAgo: 0.1,
    },

    // HJ-2026/0005 — fully approved + signed
    {
      recipient: PERSONAS.XODIM,
      type: 'DOC_APPROVED',
      params: { docNumber: 'HJ-2026/0005', actorName: bolim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(2),
      isRead: true,
      daysAgo: 2.1,
    },
    {
      recipient: PERSONAS.XODIM,
      type: 'DOC_SIGNED',
      params: { docNumber: 'HJ-2026/0005', actorName: rahbar },
      resourceType: 'document',
      resourceUuid: DOC_UUID(2),
      isRead: true,
      daysAgo: 1.8,
    },
    {
      recipient: PERSONAS.HR_ADMIN,
      type: 'DOC_SIGNED',
      params: { docNumber: 'HJ-2026/0005', actorName: rahbar },
      resourceType: 'document',
      resourceUuid: DOC_UUID(2),
      isRead: false,
      daysAgo: 1.8,
    },

    // HJ-2026/0003 — rejected, back to rework
    {
      recipient: PERSONAS.XODIM,
      type: 'DOC_REJECTED',
      params: { docNumber: 'HJ-2026/0003', actorName: bolim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(3),
      isRead: true,
      daysAgo: 4.5,
    },

    // HJ-2026/0009 — accepted without ERI (CLOSED branch)
    {
      recipient: PERSONAS.BOLIM_BOSHLIGI,
      type: 'DOC_CLOSED',
      params: { docNumber: 'HJ-2026/0009', actorName: hrAdmin },
      resourceType: 'document',
      resourceUuid: DOC_UUID(4),
      isRead: true,
      daysAgo: 3.2,
    },

    // Standalone review requests landing on RAHBAR / HR_ADMIN
    {
      recipient: PERSONAS.RAHBAR,
      type: 'DOC_REVIEW_REQUESTED',
      params: { docNumber: 'HJ-2026/0011', actorName: hrAdmin },
      resourceType: 'document',
      resourceUuid: DOC_UUID(5),
      isRead: false,
      daysAgo: 0.6,
    },
    {
      recipient: PERSONAS.HR_ADMIN,
      type: 'DOC_REVIEW_REQUESTED',
      params: { docNumber: 'HJ-2026/0008', actorName: bolim },
      resourceType: 'document',
      resourceUuid: DOC_UUID(6),
      isRead: false,
      daysAgo: 0.4,
    },
    {
      recipient: PERSONAS.HR_ADMIN,
      type: 'DOC_DECIDED',
      params: { docNumber: 'HJ-2026/0011', actorName: rahbar },
      resourceType: 'document',
      resourceUuid: DOC_UUID(5),
      isRead: true,
      daysAgo: 0.3,
    },

    // K-2026/0002 — incoming letter walking BPMN 3.3: route → assign →
    // execute → accept
    {
      recipient: PERSONAS.BOLIM_BOSHLIGI,
      type: 'LETTER_ROUTED',
      params: { letterNumber: 'K-2026/0002', actorName: devonxona },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(1),
      isRead: true,
      daysAgo: 5.0,
    },
    {
      recipient: PERSONAS.XODIM,
      type: 'LETTER_ASSIGNED',
      params: { letterNumber: 'K-2026/0002', actorName: bolim },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(1),
      isRead: true,
      daysAgo: 4.8,
    },
    {
      recipient: PERSONAS.BOLIM_BOSHLIGI,
      type: 'LETTER_EXECUTED',
      params: { letterNumber: 'K-2026/0002', actorName: xodim },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(1),
      isRead: false,
      daysAgo: 1.2,
    },
    {
      recipient: PERSONAS.DEVONXONA,
      type: 'LETTER_EXECUTED',
      params: { letterNumber: 'K-2026/0002', actorName: xodim },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(1),
      isRead: true,
      daysAgo: 1.1,
    },
    {
      recipient: PERSONAS.XODIM,
      type: 'LETTER_ACCEPTED',
      params: { letterNumber: 'K-2026/0002', actorName: bolim },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(1),
      isRead: false,
      daysAgo: 0.9,
    },

    // K-2026/0004 — response awaiting the Rahbar's ERI
    {
      recipient: PERSONAS.RAHBAR,
      type: 'LETTER_SIGN_REQUESTED',
      params: { letterNumber: 'K-2026/0004', actorName: devonxona },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(2),
      isRead: false,
      daysAgo: 0.5,
    },
    {
      recipient: PERSONAS.DEVONXONA,
      type: 'LETTER_ACCEPTED',
      params: { letterNumber: 'K-2026/0004', actorName: bolim },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(2),
      isRead: false,
      daysAgo: 0.7,
    },

    // CH-2026/0001 — outgoing reply dispatched
    {
      recipient: PERSONAS.DEVONXONA,
      type: 'LETTER_DISPATCHED',
      params: { letterNumber: 'CH-2026/0001', actorName: devonxona },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(3),
      isRead: true,
      daysAgo: 2.5,
    },
    {
      recipient: PERSONAS.HR_ADMIN,
      type: 'LETTER_DISPATCHED',
      params: { letterNumber: 'CH-2026/0001', actorName: devonxona },
      resourceType: 'letter',
      resourceUuid: LETTER_UUID(3),
      isRead: false,
      daysAgo: 2.4,
    },
  ];

  return specs.map((s) => ({
    uuid: uuid(),
    recipientEmployeeUuid: s.recipient,
    type: s.type,
    titleKey: `dashboard:notifications.title.${s.type}`,
    params: s.params,
    resourceType: s.resourceType,
    resourceUuid: s.resourceUuid,
    isRead: s.isRead,
    createdAt: DAYS_AGO(s.daysAgo),
  }));
}

// === Audit ===

function buildAudit(employees: Employee[], units: Unit[], certificates: Certificate[]): AuditEntry[] {
  const entries: AuditEntry[] = [];

  function add(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceUuid: string,
    resourceLabel: string,
    daysAgo: number,
    actorUuid = HR_ADMIN_USER_UUID,
    actorName = HR_ADMIN_NAME,
  ) {
    entries.push({
      uuid: uuid(),
      actorUuid,
      actorName,
      action,
      resourceType,
      resourceUuid,
      resourceLabel,
      createdAt: DAYS_AGO(daysAgo - Math.random()),
    });
  }

  // Login traffic — Asilbek logs in ~daily
  for (let d = 30; d >= 0; d -= 1) {
    if (Math.random() < 0.7) {
      add('LOGIN', 'user', HR_ADMIN_USER_UUID, HR_ADMIN_NAME, d);
    }
  }

  // Unit CREATEs (seeded in batches in the past 120 days, but we surface a few in the last 30)
  for (let i = 0; i < 3; i++) {
    const unit = pick(units);
    add('UPDATE', 'unit', unit.uuid, unit.nameUz, randInt(2, 28));
  }

  // Employee CREATEs and UPDATEs
  for (let i = 0; i < 8; i++) {
    const emp = pick(employees);
    const action = pick(['CREATE', 'UPDATE'] as const);
    add(action, 'employee', emp.uuid, emp.fullNameGenerated, randInt(1, 29));
  }

  // Unit transfers
  for (let i = 0; i < 4; i++) {
    const emp = pick(employees);
    add('UNIT_TRANSFER', 'employee', emp.uuid, emp.fullNameGenerated, randInt(2, 25));
  }

  // Certificate uploads + approvals + the revocation
  for (const cert of certificates) {
    const emp = employees.find((e) => e.uuid === cert.employeeUuid);
    if (!emp) continue;
    const label = `ERI · ${emp.fullNameGenerated}`;
    if (cert.status === 'PENDING_APPROVAL') {
      add('CERTIFICATE_UPLOADED', 'certificate', cert.uuid, label, randInt(1, 5));
    }
    if (cert.status === 'ACTIVE') {
      // Upload + approval ~30 days back, half sampled
      if (Math.random() < 0.5) {
        const upload = randInt(8, 28);
        add('CERTIFICATE_UPLOADED', 'certificate', cert.uuid, label, upload);
        add('CERTIFICATE_APPROVED', 'certificate', cert.uuid, label, Math.max(1, upload - 1));
      }
    }
    if (cert.status === 'REVOKED') {
      add('CERTIFICATE_REVOKED', 'certificate', cert.uuid, label, 14);
    }
  }

  // Password change for one employee
  const target = employees[8]!;
  add('PASSWORD_CHANGED', 'user', target.userUuid, target.fullNameGenerated, 7);

  // Profile change request approval
  add('PROFILE_CHANGE_APPROVED', 'profile-request', uuid(), `Profil · ${employees[17]!.fullNameGenerated}`, 4);

  // Sort by createdAt descending (newest first) for the consumer's convenience
  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return entries;
}

// === Public seeding API ===

export async function seedIfEmpty(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG) === SEED_VERSION) return;
  await resetAndSeed();
}

export async function resetAndSeed(): Promise<void> {
  clearAll();
  const { units, byCode } = buildUnits();
  const { employees, users, assignments } = await buildEmployeesAndUsers(byCode);
  const certificates = buildCertificates(employees);
  const audit = buildAudit(employees, units, certificates);
  const notifications = buildNotifications(employees);

  writeTable(Tables.positions, positions);
  writeTable(Tables.units, units);
  writeTable(Tables.employees, employees);
  writeTable(Tables.users, users);
  writeTable(Tables.assignments, assignments);
  writeTable(Tables.certificates, certificates);
  writeTable(Tables.audit, audit);
  writeTable(Tables.profileRequests, []);
  writeTable(Tables.notifications, notifications);

  localStorage.setItem(SEED_FLAG, SEED_VERSION);
}

export { NOW, DAYS_AGO };
