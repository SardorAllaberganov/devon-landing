import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Unit } from '@/types/domain';

import {
  activeFilterCount,
  defaultFilters,
  type EmployeeFiltersState,
  type EmployeeStatusFilter,
  type EmploymentTypeFilter,
} from './filters';

interface Props {
  filters: EmployeeFiltersState;
  onChange: (next: EmployeeFiltersState) => void;
  units: Unit[];
}

const ALL_UNITS = '__all__';

export default function EmployeeFilterSheetMobile({ filters, onChange, units }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  // Reset the draft to current applied filters every time the sheet opens, so
  // a previously discarded draft doesn't leak into the next session.
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const activeCount = activeFilterCount(filters);
  const activeUnits = units.filter((u) => u.status === 'ACTIVE');

  function apply() {
    onChange({ ...draft, page: 1 });
    setOpen(false);
  }

  function reset() {
    const next: EmployeeFiltersState = {
      ...filters,
      unitUuid: null,
      status: defaultFilters.status,
      employmentType: defaultFilters.employmentType,
      page: 1,
    };
    setDraft(next);
    onChange(next);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <Filter className="mr-2 h-4 w-4" />
          {t('common:actions.filter')}
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-emerald px-1.5 text-[10px] font-semibold tabular-nums text-cream">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-line p-6 text-left">
          <SheetTitle className="pr-10">{t('common:actions.filter')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label>{t('dashboard:employees.list.filter-unit')}</Label>
            <Select
              value={draft.unitUuid ?? ALL_UNITS}
              onValueChange={(v) =>
                setDraft({ ...draft, unitUuid: v === ALL_UNITS ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
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
          </div>

          <div className="space-y-2">
            <Label>{t('dashboard:employees.list.filter-status')}</Label>
            <Select
              value={draft.status}
              onValueChange={(v) =>
                setDraft({ ...draft, status: v as EmployeeStatusFilter })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
                <SelectItem value="ON_LEAVE">{t('common:status.on-leave')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('common:status.suspended')}</SelectItem>
                <SelectItem value="DRAFT">{t('common:status.draft')}</SelectItem>
                <SelectItem value="TERMINATED">
                  {t('common:status.terminated')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('dashboard:employees.list.filter-employment')}</Label>
            <Select
              value={draft.employmentType}
              onValueChange={(v) =>
                setDraft({ ...draft, employmentType: v as EmploymentTypeFilter })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
                <SelectItem value="FULL_TIME">
                  {t('common:employment-types.FULL_TIME')}
                </SelectItem>
                <SelectItem value="PART_TIME">
                  {t('common:employment-types.PART_TIME')}
                </SelectItem>
                <SelectItem value="CONTRACT">
                  {t('common:employment-types.CONTRACT')}
                </SelectItem>
                <SelectItem value="INTERN">
                  {t('common:employment-types.INTERN')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="pb-safe border-t border-line bg-background px-6 pt-4">
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              {t('common:actions.reset')}
            </Button>
            <Button className="flex-1" onClick={apply}>
              {t('common:actions.confirm')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
