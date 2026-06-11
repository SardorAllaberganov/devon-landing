import { create } from 'zustand';
import type { EmploymentType, Gender, Role } from '@/types/domain';

import type { OrderExtractMeta } from './employee.schema';

export interface WizardStep1 {
  lastName: string;
  firstName: string;
  middleName: string;
  gender: Gender;
  birthDate: string;
  pinfl: string;
  passportSeries: string;
}

export interface WizardStep2 {
  workPhone: string;
  internalExtension: string;
  mobilePhone: string;
  corporateEmail: string;
  personalEmail: string;
}

export interface WizardStep3 {
  primaryUnitUuid: string;
  positionId: string;
  employmentType: EmploymentType;
  hireDate: string;
  role: Extract<Role, 'ROLE_EMPLOYEE' | 'ROLE_UNIT_HEAD' | 'ROLE_HR_OPERATOR' | 'ROLE_AUDITOR'>;
  employmentOrderExtract: OrderExtractMeta | null;
}

export interface WizardStep4 {
  login: string;
  password: string;
  notifySms: boolean;
  notifyEmail: boolean;
}

export interface WizardData {
  step1: WizardStep1;
  step2: WizardStep2;
  step3: WizardStep3;
  step4: WizardStep4;
}

function emptyData(): WizardData {
  return {
    step1: {
      lastName: '',
      firstName: '',
      middleName: '',
      gender: 'M',
      birthDate: '',
      pinfl: '',
      passportSeries: '',
    },
    step2: {
      workPhone: '',
      internalExtension: '',
      mobilePhone: '',
      corporateEmail: '',
      personalEmail: '',
    },
    step3: {
      primaryUnitUuid: '',
      positionId: '',
      employmentType: 'FULL_TIME',
      hireDate: new Date().toISOString().slice(0, 10),
      role: 'ROLE_EMPLOYEE',
      employmentOrderExtract: null,
    },
    step4: {
      login: '',
      password: '',
      notifySms: true,
      notifyEmail: true,
    },
  };
}

interface WizardState {
  current: number;
  data: WizardData;
  setStep1: (v: WizardStep1) => void;
  setStep2: (v: WizardStep2) => void;
  setStep3: (v: WizardStep3) => void;
  setStep4: (v: WizardStep4) => void;
  setCurrent: (n: number) => void;
  next: () => void;
  prev: () => void;
  isDirty: () => boolean;
  reset: () => void;
}

export const TOTAL_STEPS = 5; // 4 form steps + review

export const useWizardStore = create<WizardState>((set, get) => ({
  current: 0,
  data: emptyData(),
  setStep1: (v) => set((s) => ({ data: { ...s.data, step1: v } })),
  setStep2: (v) => set((s) => ({ data: { ...s.data, step2: v } })),
  setStep3: (v) => set((s) => ({ data: { ...s.data, step3: v } })),
  setStep4: (v) => set((s) => ({ data: { ...s.data, step4: v } })),
  setCurrent: (n) => set({ current: Math.max(0, Math.min(n, TOTAL_STEPS - 1)) }),
  next: () => set((s) => ({ current: Math.min(s.current + 1, TOTAL_STEPS - 1) })),
  prev: () => set((s) => ({ current: Math.max(0, s.current - 1) })),
  isDirty: () => {
    const empty = emptyData();
    return JSON.stringify(get().data) !== JSON.stringify(empty);
  },
  reset: () => set({ current: 0, data: emptyData() }),
}));
