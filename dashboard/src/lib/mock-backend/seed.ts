// Devon mock-backend seed. Produces realistic Uzbek data the demo
// can be exercised against immediately — ~26 units in the 4-level
// hierarchy (+ the root-level Devonxona), 31 employees, 31 primary
// assignments, 26 certificates in the 19/4/2/1 status distribution,
// ~70 audit entries spread over the last 30 days, the position
// catalogue, ~20 milestone-2 notifications across the personas, and
// (step 17) 5 document templates + 12 documents walking the BPMN 3.4
// chain with internally-consistent approval steps and signatures.
//
// Uses native `crypto.randomUUID()` — browsers ship it natively
// since 2022. No `uuid` npm package needed.

import { sha256Hex } from '@/lib/hash';
import { renderTemplate } from '@/features/documents/renderTemplate';
import { Tables, clearAll, writeTable } from './storage';
import type {
  AppNotification,
  ApprovalDecision,
  ApprovalStep,
  Assignment,
  AuditAction,
  AuditEntry,
  AuditResourceType,
  Certificate,
  CertStatus,
  CertType,
  Confidentiality,
  DocumentEntity,
  DocumentStatus,
  DocumentTemplate,
  Employee,
  FileMeta,
  Gender,
  NotificationType,
  Position,
  Role,
  SignatureRecord,
  Unit,
  UnitType,
  User,
} from '@/types/domain';

const SEED_FLAG = 'devon.dashboard.seeded';
// Bump whenever seed.ts changes shape OR fixture identity (renames, status
// distributions, hierarchy reshapes). Mismatched versions in localStorage
// trigger a silent reseed on next app load — keeps demos consistent without
// asking users to hit "Reset demo" after every change.
const SEED_VERSION = '6';

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

// === Fixed resource UUIDs (milestone 2 rails) ===

// Fixed literals, valid v4 shape. Documents d001–d006 are seeded below
// (step 17) so the step-16 notification deep-links resolve against real
// rows; letters f001–f003 follow in step 20.
const DOC_UUID = (n: number) => `00000000-0000-4000-8000-00000000d00${n}`;
const LETTER_UUID = (n: number) => `00000000-0000-4000-8000-00000000f00${n}`;

// === Document domain (milestone 2, step 17 — BPMN 3.4) ===

// FIO literals for template values + comments. Must match the `fios` table.
const FIO_XODIM = 'Sobirova Dilnoza Murodovna';

const documentTemplates: DocumentTemplate[] = [
  {
    uuid: '00000000-0000-4000-8000-00000000c001',
    code: 'BUYRUQ',
    nameUz: 'Buyruq',
    descriptionUz: "Tashkilot bo'yicha buyruq (tayinlash, o'tkazish, rag'batlantirish)",
    // RAQAM is a 5th field beyond the prompt's 2–4 guideline — the example
    // body uses the token, and a seeded template must never render «—».
    bodyTemplate:
      '{{SANA}} dagi {{RAQAM}}-sonli buyruqqa asosan {{XODIM_FIO}}\n' +
      'quyidagi vazifaga tayinlansin: {{MAZMUN}}.\n' +
      'Asos: {{ASOS}}.',
    fields: [
      { key: 'SANA', labelKey: 'dashboard:documents.fields.SANA', kind: 'date', required: true },
      { key: 'RAQAM', labelKey: 'dashboard:documents.fields.RAQAM', kind: 'text', required: true },
      { key: 'XODIM_FIO', labelKey: 'dashboard:documents.fields.XODIM_FIO', kind: 'employee', required: true },
      { key: 'MAZMUN', labelKey: 'dashboard:documents.fields.MAZMUN', kind: 'textarea', required: true },
      { key: 'ASOS', labelKey: 'dashboard:documents.fields.ASOS', kind: 'text', required: true },
    ],
  },
  {
    uuid: '00000000-0000-4000-8000-00000000c002',
    code: 'XIZMAT_XATI',
    nameUz: 'Xizmat xati',
    descriptionUz: "Bo'linmalararo ichki yozishmalar uchun xizmat xati",
    bodyTemplate:
      '{{KIMGA}}ga\n\n' +
      "{{SANA}} holatiga ko'ra quyidagi masala bo'yicha xizmat xati yo'llanmoqda:\n" +
      '{{MAZMUN}}\n\n' +
      'Ijro muddati: {{MUDDAT}}.',
    fields: [
      { key: 'KIMGA', labelKey: 'dashboard:documents.fields.KIMGA', kind: 'text', required: true },
      { key: 'SANA', labelKey: 'dashboard:documents.fields.SANA', kind: 'date', required: true },
      { key: 'MAZMUN', labelKey: 'dashboard:documents.fields.MAZMUN', kind: 'textarea', required: true },
      { key: 'MUDDAT', labelKey: 'dashboard:documents.fields.MUDDAT', kind: 'date', required: false },
    ],
  },
  {
    uuid: '00000000-0000-4000-8000-00000000c003',
    code: 'MALUMOTNOMA',
    nameUz: "Ma'lumotnoma",
    descriptionUz: "Xodimning ish joyidan ma'lumotnoma",
    bodyTemplate:
      "Ushbu ma'lumotnoma {{XODIM_FIO}}ga berildi.\n" +
      'U haqiqatan ham tashkilotda {{LAVOZIM}} lavozimida faoliyat yuritadi.\n' +
      "Ma'lumotnoma {{MAQSAD}} taqdim etish uchun berildi.",
    fields: [
      { key: 'XODIM_FIO', labelKey: 'dashboard:documents.fields.XODIM_FIO', kind: 'employee', required: true },
      { key: 'LAVOZIM', labelKey: 'dashboard:documents.fields.LAVOZIM', kind: 'text', required: true },
      { key: 'MAQSAD', labelKey: 'dashboard:documents.fields.MAQSAD', kind: 'text', required: true },
    ],
  },
  {
    uuid: '00000000-0000-4000-8000-00000000c004',
    code: 'ARIZA',
    nameUz: 'Ariza',
    descriptionUz: "Xodimning rahbariyatga arizasi (ta'til, ruxsat, so'rov)",
    bodyTemplate:
      "Sizdan {{SANA}}dan boshlab menga {{MAZMUN}} berishingizni so'rayman.\n" +
      'Sabab: {{SABAB}}.',
    fields: [
      { key: 'SANA', labelKey: 'dashboard:documents.fields.SANA', kind: 'date', required: true },
      { key: 'MAZMUN', labelKey: 'dashboard:documents.fields.MAZMUN', kind: 'textarea', required: true },
      { key: 'SABAB', labelKey: 'dashboard:documents.fields.SABAB', kind: 'text', required: true },
    ],
  },
  {
    uuid: '00000000-0000-4000-8000-00000000c005',
    code: 'BILDIRISHNOMA',
    nameUz: 'Bildirishnoma',
    descriptionUz: "Barcha bo'linmalarga yo'naltiriladigan rasmiy bildirishnoma",
    bodyTemplate:
      "Barcha bo'linmalar e'tiboriga!\n\n" +
      '{{SANA}} kunidan boshlab {{MAZMUN}}.\n' +
      "Mas'ul shaxs: {{MASUL_FIO}}.",
    fields: [
      { key: 'SANA', labelKey: 'dashboard:documents.fields.SANA', kind: 'date', required: true },
      { key: 'MAZMUN', labelKey: 'dashboard:documents.fields.MAZMUN', kind: 'textarea', required: true },
      { key: 'MASUL_FIO', labelKey: 'dashboard:documents.fields.MASUL_FIO', kind: 'employee', required: true },
    ],
  },
];

interface DocStepSpec {
  order: number;
  employeeUuid: string;
  decision: ApprovalDecision;
  /** Required for decided steps. */
  daysAgo?: number;
  comment?: string;
}

interface DocSpec {
  /** Fixed literal for the six notification-referenced docs; others mint one. */
  uuid?: string;
  number: string;
  title: string;
  /** TEMPLATE source when set; UPLOAD (with fileMeta) otherwise. */
  templateCode?: DocumentTemplate['code'];
  /** Final display strings — employee-kind values are FIOs here, not uuids. */
  values?: Record<string, string>;
  fileMeta?: FileMeta;
  confidentiality?: Confidentiality;
  creator: string;
  recipient: string;
  signer?: string;
  requiresApproval: boolean;
  status: DocumentStatus;
  createdDaysAgo: number;
  sentDaysAgo?: number;
  approvedDaysAgo?: number;
  signedDaysAgo?: number;
  closedDaysAgo?: number;
  emailedTo?: string[];
  viewedBy?: { employeeUuid: string; daysAgo: number }[];
  steps?: DocStepSpec[];
}

// 12 documents: 2 DRAFT · 3 IN_REVIEW (current PENDING participant =
// RAHBAR / BOLIM_BOSHLIGI / HR_ADMIN respectively) · 1 REJECTED ·
// 2 APPROVED (one signature queue, one acceptance queue) · 2 SIGNED ·
// 2 CLOSED. The six DOC_UUID literals line up with the step-16
// notification story (numbers 0003/0005/0007/0008/0009/0011).
const docSpecs: DocSpec[] = [
  {
    number: 'HJ-2026/0001',
    title: "Kirish-chiqish tartibi to'g'risida bildirishnoma",
    templateCode: 'BILDIRISHNOMA',
    values: {
      SANA: '01.06.2026',
      MAZMUN: 'binoga kirish-chiqish yangi elektron ruxsatnomalar orqali amalga oshiriladi',
      MASUL_FIO: 'Ergasheva Zarina Yusupovna',
    },
    creator: PERSONAS.HR_ADMIN,
    recipient: PERSONAS.XODIM,
    // "Kelishuv varaqasi kerakmi? → Yo'q" + no signer ⇒ the recipient
    // accepted and the document went straight to CLOSED.
    requiresApproval: false,
    status: 'CLOSED',
    createdDaysAgo: 20,
    sentDaysAgo: 19.5,
    approvedDaysAgo: 19.5,
    closedDaysAgo: 19,
    viewedBy: [{ employeeUuid: PERSONAS.XODIM, daysAgo: 19.2 }],
  },
  {
    number: 'HJ-2026/0002',
    title: "Lavozimga tayinlash to'g'risida buyruq",
    templateCode: 'BUYRUQ',
    values: {
      SANA: '28.05.2026',
      RAQAM: '17',
      XODIM_FIO: FIO_XODIM,
      MAZMUN: "API Sho'basida integratsiya loyihasini muvofiqlashtirish",
      ASOS: "bo'lim boshlig'ining taqdimnomasi",
    },
    creator: PERSONAS.BOLIM_BOSHLIGI,
    recipient: PERSONAS.XODIM,
    signer: PERSONAS.RAHBAR,
    requiresApproval: true,
    status: 'SIGNED',
    createdDaysAgo: 15,
    sentDaysAgo: 14.5,
    approvedDaysAgo: 14,
    signedDaysAgo: 13.5,
    steps: [{ order: 1, employeeUuid: PERSONAS.HR_ADMIN, decision: 'APPROVED', daysAgo: 14 }],
    viewedBy: [
      { employeeUuid: PERSONAS.HR_ADMIN, daysAgo: 14.2 },
      { employeeUuid: PERSONAS.RAHBAR, daysAgo: 13.8 },
      { employeeUuid: PERSONAS.XODIM, daysAgo: 13 },
    ],
  },
  {
    uuid: DOC_UUID(3),
    number: 'HJ-2026/0003',
    title: "Ta'til berish to'g'risida ariza",
    templateCode: 'ARIZA',
    values: {
      SANA: '15.06.2026',
      MAZMUN: "yillik mehnat ta'tili (14 kun)",
      SABAB: 'oilaviy sharoit',
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.BOLIM_BOSHLIGI,
    requiresApproval: true,
    status: 'REJECTED',
    createdDaysAgo: 5,
    sentDaysAgo: 4.8,
    steps: [
      {
        order: 1,
        employeeUuid: PERSONAS.BOLIM_BOSHLIGI,
        decision: 'REJECTED',
        daysAgo: 4.5,
        comment: "Ta'til jadvaliga mos kelmaydi — muddatni bo'lim jadvali bilan kelishib qayta kiriting.",
      },
    ],
    viewedBy: [{ employeeUuid: PERSONAS.BOLIM_BOSHLIGI, daysAgo: 4.6 }],
  },
  {
    number: 'HJ-2026/0004',
    title: "Ish joyidan ma'lumotnoma",
    templateCode: 'MALUMOTNOMA',
    values: {
      XODIM_FIO: FIO_XODIM,
      LAVOZIM: 'Dasturchi',
      MAQSAD: 'bank muassasasiga',
    },
    creator: PERSONAS.HR_ADMIN,
    recipient: PERSONAS.BOLIM_BOSHLIGI,
    // No signer ⇒ sits in the BOLIM_BOSHLIGI acceptance queue.
    requiresApproval: true,
    status: 'APPROVED',
    createdDaysAgo: 3,
    sentDaysAgo: 2.8,
    approvedDaysAgo: 2.6,
    steps: [{ order: 1, employeeUuid: PERSONAS.RAHBAR, decision: 'APPROVED', daysAgo: 2.6 }],
    viewedBy: [
      { employeeUuid: PERSONAS.RAHBAR, daysAgo: 2.7 },
      { employeeUuid: PERSONAS.BOLIM_BOSHLIGI, daysAgo: 2 },
    ],
  },
  {
    uuid: DOC_UUID(2),
    number: 'HJ-2026/0005',
    title: "Server resurslarini kengaytirish to'g'risida",
    templateCode: 'XIZMAT_XATI',
    values: {
      KIMGA: "Infratuzilma Boshqarmasi boshlig'i",
      SANA: '09.06.2026',
      MAZMUN: "API xizmatlari yuklamasining o'sishi munosabati bilan qo'shimcha server resurslari ajratish so'raladi",
      MUDDAT: '20.06.2026',
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.HR_ADMIN,
    signer: PERSONAS.RAHBAR,
    requiresApproval: true,
    status: 'SIGNED',
    createdDaysAgo: 2.5,
    sentDaysAgo: 2.3,
    approvedDaysAgo: 2.1,
    signedDaysAgo: 1.8,
    emailedTo: ['arxiv@devon.uz'],
    steps: [{ order: 1, employeeUuid: PERSONAS.BOLIM_BOSHLIGI, decision: 'APPROVED', daysAgo: 2.1 }],
    viewedBy: [
      { employeeUuid: PERSONAS.BOLIM_BOSHLIGI, daysAgo: 2.2 },
      { employeeUuid: PERSONAS.RAHBAR, daysAgo: 1.9 },
      { employeeUuid: PERSONAS.HR_ADMIN, daysAgo: 1.5 },
    ],
  },
  {
    number: 'HJ-2026/0006',
    title: "Texnik ta'minotni kengaytirish to'g'risida",
    templateCode: 'XIZMAT_XATI',
    values: {
      KIMGA: 'IT Departamenti rahbari',
      SANA: '10.06.2026',
      MAZMUN: "ishlab chiqish serverlari uchun qo'shimcha quvvat ajratish masalasini ko'rib chiqish so'raladi",
      MUDDAT: '30.06.2026',
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.HR_ADMIN,
    signer: PERSONAS.RAHBAR,
    // Current PENDING participant = RAHBAR (order 2) → his decision queue.
    requiresApproval: true,
    status: 'IN_REVIEW',
    createdDaysAgo: 1.5,
    sentDaysAgo: 1.4,
    steps: [
      {
        order: 1,
        employeeUuid: PERSONAS.BOLIM_BOSHLIGI,
        decision: 'APPROVED_WITH_COMMENT',
        daysAgo: 1.0,
        comment: "Byudjet doirasida ma'qullayman.",
      },
      { order: 2, employeeUuid: PERSONAS.RAHBAR, decision: 'PENDING' },
    ],
    viewedBy: [{ employeeUuid: PERSONAS.BOLIM_BOSHLIGI, daysAgo: 1.1 }],
  },
  {
    uuid: DOC_UUID(1),
    number: 'HJ-2026/0007',
    title: "Qo'shimcha jihozlar ajratish to'g'risida",
    templateCode: 'XIZMAT_XATI',
    values: {
      KIMGA: 'IT Departamenti rahbari',
      SANA: '11.06.2026',
      MAZMUN: "yangi xodimlar uchun ish stansiyalari ajratish so'raladi",
      MUDDAT: '25.06.2026',
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.BOLIM_BOSHLIGI,
    signer: PERSONAS.RAHBAR,
    // Kelishuv done → APPROVED, awaiting the Rahbar's ERI (signature queue).
    requiresApproval: true,
    status: 'APPROVED',
    createdDaysAgo: 0.3,
    sentDaysAgo: 0.2,
    approvedDaysAgo: 0.15,
    steps: [{ order: 1, employeeUuid: PERSONAS.BOLIM_BOSHLIGI, decision: 'APPROVED', daysAgo: 0.15 }],
    viewedBy: [{ employeeUuid: PERSONAS.BOLIM_BOSHLIGI, daysAgo: 0.18 }],
  },
  {
    uuid: DOC_UUID(6),
    number: 'HJ-2026/0008',
    title: "Attestatsiya o'tkazish to'g'risida bildirishnoma",
    templateCode: 'BILDIRISHNOMA',
    values: {
      SANA: '15.06.2026',
      MAZMUN: "Backend Bo'limida navbatdagi attestatsiya o'tkaziladi",
      MASUL_FIO: HR_ADMIN_NAME,
    },
    creator: PERSONAS.BOLIM_BOSHLIGI,
    recipient: PERSONAS.RAHBAR,
    // Current PENDING participant = HR_ADMIN → his decision queue.
    requiresApproval: true,
    status: 'IN_REVIEW',
    createdDaysAgo: 0.5,
    sentDaysAgo: 0.4,
    steps: [{ order: 1, employeeUuid: PERSONAS.HR_ADMIN, decision: 'PENDING' }],
  },
  {
    uuid: DOC_UUID(4),
    number: 'HJ-2026/0009',
    title: 'Boshqarma majlisi bayonnomasi',
    fileMeta: {
      fileName: 'majlis_bayonnomasi_2026-21.pdf',
      fileSize: 642 * 1024,
      mimeType: 'application/pdf',
      uploadedAt: DAYS_AGO(4),
    },
    confidentiality: 'MAXFIY',
    creator: PERSONAS.BOLIM_BOSHLIGI,
    recipient: PERSONAS.HR_ADMIN,
    // No signer ⇒ the HR_ADMIN recipient accepted → CLOSED.
    requiresApproval: true,
    status: 'CLOSED',
    createdDaysAgo: 4,
    sentDaysAgo: 3.8,
    approvedDaysAgo: 3.5,
    closedDaysAgo: 3.2,
    steps: [{ order: 1, employeeUuid: PERSONAS.RAHBAR, decision: 'APPROVED', daysAgo: 3.5 }],
    viewedBy: [
      { employeeUuid: PERSONAS.RAHBAR, daysAgo: 3.6 },
      { employeeUuid: PERSONAS.HR_ADMIN, daysAgo: 3.3 },
    ],
  },
  {
    number: 'HJ-2026/0010',
    title: 'Hamkorlik taklifi (skan)',
    fileMeta: {
      fileName: 'hamkorlik_taklifi_skan.pdf',
      fileSize: 418 * 1024,
      mimeType: 'application/pdf',
      uploadedAt: DAYS_AGO(0.8),
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.BOLIM_BOSHLIGI,
    requiresApproval: true,
    status: 'DRAFT',
    createdDaysAgo: 0.8,
    steps: [{ order: 1, employeeUuid: PERSONAS.BOLIM_BOSHLIGI, decision: 'PENDING' }],
  },
  {
    uuid: DOC_UUID(5),
    number: 'HJ-2026/0011',
    title: "Doimiy lavozimga tayinlash to'g'risida buyruq",
    templateCode: 'BUYRUQ',
    values: {
      SANA: '10.06.2026',
      RAQAM: '23',
      XODIM_FIO: "Norbo'taeva Mohira Sherzodovna",
      MAZMUN: "doimiy mehnat shartnomasiga o'tkazilsin",
      ASOS: "sinov muddati yakunlari to'g'risidagi xulosa",
    },
    creator: PERSONAS.HR_ADMIN,
    recipient: PERSONAS.RAHBAR,
    signer: PERSONAS.RAHBAR,
    // RAHBAR (order 1) decided; current PENDING participant =
    // BOLIM_BOSHLIGI (order 2) → his decision queue.
    requiresApproval: true,
    status: 'IN_REVIEW',
    createdDaysAgo: 0.7,
    sentDaysAgo: 0.6,
    steps: [
      { order: 1, employeeUuid: PERSONAS.RAHBAR, decision: 'APPROVED', daysAgo: 0.3 },
      { order: 2, employeeUuid: PERSONAS.BOLIM_BOSHLIGI, decision: 'PENDING' },
    ],
    viewedBy: [{ employeeUuid: PERSONAS.RAHBAR, daysAgo: 0.35 }],
  },
  {
    number: 'HJ-2026/0012',
    title: "Malaka oshirish kursi to'g'risida",
    templateCode: 'XIZMAT_XATI',
    // MUDDAT deliberately unfilled — the optional field of this fresh draft
    // renders as «—» until the creator completes it (renderTemplate rule).
    values: {
      KIMGA: 'Kadrlar Departamenti',
      SANA: '12.06.2026',
      MAZMUN: "malaka oshirish kursiga yo'llanma berish so'raladi",
    },
    creator: PERSONAS.XODIM,
    recipient: PERSONAS.HR_ADMIN,
    requiresApproval: true,
    status: 'DRAFT',
    createdDaysAgo: 0.1,
    steps: [
      { order: 1, employeeUuid: PERSONAS.BOLIM_BOSHLIGI, decision: 'PENDING' },
      { order: 2, employeeUuid: PERSONAS.RAHBAR, decision: 'PENDING' },
    ],
  },
];

function buildDocumentDomain(certificates: Certificate[]): {
  documents: DocumentEntity[];
  approvalSteps: ApprovalStep[];
  signatures: SignatureRecord[];
} {
  const templateByCode = new Map(documentTemplates.map((t) => [t.code, t]));
  const documents: DocumentEntity[] = [];
  const approvalSteps: ApprovalStep[] = [];
  const signatures: SignatureRecord[] = [];

  const activeCertOf = (employeeUuid: string): Certificate => {
    const cert = certificates.find(
      (c) => c.employeeUuid === employeeUuid && c.status === 'ACTIVE',
    );
    if (!cert) throw new Error(`Seed invariant broken: no ACTIVE cert for ${employeeUuid}`);
    return cert;
  };

  // Math.random()-based hex is fine for seed fixtures (the runtime
  // signDocument mutation uses crypto.getRandomValues).
  const fakeSignatureHex = () => randomHex(256);

  for (const spec of docSpecs) {
    const template = spec.templateCode ? templateByCode.get(spec.templateCode) : undefined;
    const docUuid = spec.uuid ?? uuid();
    const terminalDaysAgo = spec.signedDaysAgo ?? spec.closedDaysAgo;
    const updatedDaysAgo =
      terminalDaysAgo ?? spec.approvedDaysAgo ?? spec.sentDaysAgo ?? spec.createdDaysAgo;

    documents.push({
      uuid: docUuid,
      number: spec.number,
      title: spec.title,
      source: template ? 'TEMPLATE' : 'UPLOAD',
      templateUuid: template?.uuid,
      renderedBody: template ? renderTemplate(template.bodyTemplate, spec.values ?? {}) : undefined,
      fileMeta: spec.fileMeta,
      confidentiality: spec.confidentiality ?? 'ODDIY',
      creatorUuid: spec.creator,
      recipientUuid: spec.recipient,
      signerUuid: spec.signer,
      requiresApproval: spec.requiresApproval,
      status: spec.status,
      round: 1,
      viewedBy: (spec.viewedBy ?? []).map((v) => ({
        employeeUuid: v.employeeUuid,
        viewedAt: DAYS_AGO(v.daysAgo),
      })),
      sentForReviewAt: spec.sentDaysAgo !== undefined ? DAYS_AGO(spec.sentDaysAgo) : undefined,
      approvedAt: spec.approvedDaysAgo !== undefined ? DAYS_AGO(spec.approvedDaysAgo) : undefined,
      signedAt: spec.signedDaysAgo !== undefined ? DAYS_AGO(spec.signedDaysAgo) : undefined,
      closedAt: spec.closedDaysAgo !== undefined ? DAYS_AGO(spec.closedDaysAgo) : undefined,
      // The simulated nightly archive job stamps terminal docs immediately.
      archivedAt: terminalDaysAgo !== undefined ? DAYS_AGO(terminalDaysAgo) : undefined,
      emailedTo: spec.emailedTo,
      createdAt: DAYS_AGO(spec.createdDaysAgo),
      updatedAt: DAYS_AGO(updatedDaysAgo),
    });

    for (const step of spec.steps ?? []) {
      approvalSteps.push({
        uuid: uuid(),
        documentUuid: docUuid,
        round: 1,
        order: step.order,
        employeeUuid: step.employeeUuid,
        decision: step.decision,
        comment: step.comment,
        decidedAt: step.daysAgo !== undefined ? DAYS_AGO(step.daysAgo) : undefined,
      });
    }

    if (spec.status === 'SIGNED' && spec.signer) {
      signatures.push({
        uuid: uuid(),
        resourceType: 'document',
        resourceUuid: docUuid,
        employeeUuid: spec.signer,
        certificateUuid: activeCertOf(spec.signer).uuid,
        algorithm: 'RSA-PKCS7',
        signatureHex: fakeSignatureHex(),
        signedAt: DAYS_AGO(spec.signedDaysAgo!),
      });
    }
  }

  // Spare third record: the Rahbar's ERI on the dispatched outgoing letter
  // CH-2026/0001 from the step-16 notification story. Step 20 must seed
  // that letter under LETTER_UUID(3) with requiresSignature: true so this
  // signature resolves retroactively (same convention as the doc UUIDs).
  signatures.push({
    uuid: uuid(),
    resourceType: 'letter',
    resourceUuid: LETTER_UUID(3),
    employeeUuid: PERSONAS.RAHBAR,
    certificateUuid: activeCertOf(PERSONAS.RAHBAR).uuid,
    algorithm: 'RSA-PKCS7',
    signatureHex: fakeSignatureHex(),
    signedAt: DAYS_AGO(2.6),
  });

  return { documents, approvalSteps, signatures };
}

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
  const { documents, approvalSteps, signatures } = buildDocumentDomain(certificates);

  writeTable(Tables.positions, positions);
  writeTable(Tables.units, units);
  writeTable(Tables.employees, employees);
  writeTable(Tables.users, users);
  writeTable(Tables.assignments, assignments);
  writeTable(Tables.certificates, certificates);
  writeTable(Tables.audit, audit);
  writeTable(Tables.profileRequests, []);
  writeTable(Tables.notifications, notifications);
  writeTable(Tables.documentTemplates, documentTemplates);
  writeTable(Tables.documents, documents);
  writeTable(Tables.approvalSteps, approvalSteps);
  writeTable(Tables.signatures, signatures);

  localStorage.setItem(SEED_FLAG, SEED_VERSION);
}

export { NOW, DAYS_AGO };
