import type { DocumentStatus } from '@/types/domain';

export type DocumentStatusFilter = DocumentStatus | 'ALL';

export interface DocumentsFiltersState {
  search: string;
  status: DocumentStatusFilter;
  page: number;
  perPage: number;
}

export const defaultFilters: DocumentsFiltersState = {
  search: '',
  status: 'ALL',
  page: 1,
  perPage: 20,
};

/**
 * Counts non-default filter values for the "active filter" badge on the
 * mobile trigger. `search` is excluded because it has its own input visible
 * outside the sheet — counting it would double-signal.
 */
export function activeFilterCount(filters: DocumentsFiltersState): number {
  return filters.status !== defaultFilters.status ? 1 : 0;
}
