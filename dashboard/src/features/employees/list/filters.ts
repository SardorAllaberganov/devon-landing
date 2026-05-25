import type { EmployeeStatus, EmploymentType } from '@/types/domain';

export type EmployeeStatusFilter = EmployeeStatus | 'ALL';
export type EmploymentTypeFilter = EmploymentType | 'ALL';

export interface EmployeeFiltersState {
  search: string;
  unitUuid: string | null;
  status: EmployeeStatusFilter;
  employmentType: EmploymentTypeFilter;
  page: number;
  perPage: number;
}

export const defaultFilters: EmployeeFiltersState = {
  search: '',
  unitUuid: null,
  status: 'ACTIVE',
  employmentType: 'ALL',
  page: 1,
  perPage: 20,
};

/**
 * Counts non-default filter values for the "active filter" badge on the
 * mobile trigger. `search` is excluded because it has its own input visible
 * outside the sheet — counting it would double-signal.
 */
export function activeFilterCount(filters: EmployeeFiltersState): number {
  let n = 0;
  if (filters.unitUuid) n += 1;
  if (filters.status !== defaultFilters.status) n += 1;
  if (filters.employmentType !== defaultFilters.employmentType) n += 1;
  return n;
}
