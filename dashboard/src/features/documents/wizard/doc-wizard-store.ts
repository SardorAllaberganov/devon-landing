import { create } from 'zustand';

import type { Confidentiality, DocumentSource } from '@/types/domain';

import type { DocFileMeta } from './document.schema';

export interface DocWizardContent {
  title: string;
  recipientUuid: string;
  /** Empty string = no ERI signer (acceptance branch). */
  signerUuid: string;
  confidentiality: Confidentiality;
  /** Template placeholder values keyed by `TemplateField.key`. */
  values: Record<string, string>;
}

export interface DocWizardData {
  source: DocumentSource;
  templateUuid: string | null;
  fileMeta: DocFileMeta | null;
  content: DocWizardContent;
  requiresApproval: boolean;
  /** Ordered kelishuv chain (employee uuids). */
  participantUuids: string[];
}

function emptyData(): DocWizardData {
  return {
    source: 'TEMPLATE',
    templateUuid: null,
    fileMeta: null,
    content: {
      title: '',
      recipientUuid: '',
      signerUuid: '',
      confidentiality: 'ODDIY',
      values: {},
    },
    requiresApproval: true,
    participantUuids: [],
  };
}

interface DocWizardState {
  current: number;
  data: DocWizardData;
  setSource: (source: DocumentSource) => void;
  /** Switching templates drops the placeholder values — keys won't match. */
  setTemplate: (templateUuid: string) => void;
  setFileMeta: (meta: DocFileMeta | null) => void;
  setContent: (content: DocWizardContent) => void;
  setRequiresApproval: (on: boolean) => void;
  setParticipants: (uuids: string[]) => void;
  setCurrent: (n: number) => void;
  next: () => void;
  prev: () => void;
  isDirty: () => boolean;
  reset: () => void;
}

export const TOTAL_STEPS = 4; // 3 form steps + review

export const useDocWizardStore = create<DocWizardState>((set, get) => ({
  current: 0,
  data: emptyData(),
  setSource: (source) => set((s) => ({ data: { ...s.data, source } })),
  setTemplate: (templateUuid) =>
    set((s) => ({
      data:
        s.data.templateUuid === templateUuid
          ? s.data
          : {
              ...s.data,
              templateUuid,
              content: { ...s.data.content, values: {} },
            },
    })),
  setFileMeta: (fileMeta) => set((s) => ({ data: { ...s.data, fileMeta } })),
  setContent: (content) => set((s) => ({ data: { ...s.data, content } })),
  setRequiresApproval: (requiresApproval) =>
    set((s) => ({ data: { ...s.data, requiresApproval } })),
  setParticipants: (participantUuids) =>
    set((s) => ({ data: { ...s.data, participantUuids } })),
  setCurrent: (n) => set({ current: Math.max(0, Math.min(n, TOTAL_STEPS - 1)) }),
  next: () => set((s) => ({ current: Math.min(s.current + 1, TOTAL_STEPS - 1) })),
  prev: () => set((s) => ({ current: Math.max(0, s.current - 1) })),
  isDirty: () => {
    const empty = emptyData();
    return JSON.stringify(get().data) !== JSON.stringify(empty);
  },
  reset: () => set({ current: 0, data: emptyData() }),
}));
