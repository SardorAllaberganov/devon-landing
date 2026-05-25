import { useTranslation } from 'react-i18next';

import SearchInput from '@/components/common/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Unit } from '@/types/domain';

import {
  type EmployeeFiltersState,
  type EmployeeStatusFilter,
} from './filters';

interface Props {
  filters: EmployeeFiltersState;
  onChange: (next: EmployeeFiltersState) => void;
  units: Unit[];
}

const ALL_UNITS = '__all__';

export default function EmployeeFilters({ filters, onChange, units }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const activeUnits = units.filter((u) => u.status === 'ACTIVE');

  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <SearchInput
          value={filters.search}
          onChange={(v) => onChange({ ...filters, search: v, page: 1 })}
          placeholder={t('dashboard:employees.list.search-placeholder')}
        />
      </div>

      <Select
        value={filters.unitUuid ?? ALL_UNITS}
        onValueChange={(v) =>
          onChange({ ...filters, unitUuid: v === ALL_UNITS ? null : v, page: 1 })
        }
      >
        <SelectTrigger className="md:w-56">
          <SelectValue placeholder={t('dashboard:employees.list.filter-unit')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_UNITS}>
            {t('dashboard:employees.list.all-units')}
          </SelectItem>
          {activeUnits.map((u) => (
            <SelectItem key={u.uuid} value={u.uuid}>
              {u.nameUz}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as EmployeeStatusFilter, page: 1 })
        }
      >
        <SelectTrigger className="md:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
          <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
          <SelectItem value="ON_LEAVE">{t('common:status.on-leave')}</SelectItem>
          <SelectItem value="SUSPENDED">{t('common:status.suspended')}</SelectItem>
          <SelectItem value="DRAFT">{t('common:status.draft')}</SelectItem>
          <SelectItem value="TERMINATED">{t('common:status.terminated')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
