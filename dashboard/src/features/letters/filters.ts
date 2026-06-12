import type { LetterStatus } from '@/types/domain';

export type LetterStatusFilter = LetterStatus | 'ALL';

export interface LettersFiltersState {
  search: string;
  status: LetterStatusFilter;
  overdueOnly: boolean;
  page: number;
  perPage: number;
}

export const defaultFilters: LettersFiltersState = {
  search: '',
  status: 'ALL',
  overdueOnly: false,
  page: 1,
  perPage: 20,
};

/**
 * Counts non-default filter values for the "active filter" badge on the
 * mobile trigger. `search` is excluded — it has its own always-visible input
 * (documents-registry convention).
 */
export function activeFilterCount(filters: LettersFiltersState): number {
  return (
    (filters.status !== defaultFilters.status ? 1 : 0) + (filters.overdueOnly ? 1 : 0)
  );
}
