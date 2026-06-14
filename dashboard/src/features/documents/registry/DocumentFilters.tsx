import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';

import SearchInput from '@/components/common/SearchInput';
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
import type { DocumentStatus } from '@/types/domain';

import {
  activeFilterCount,
  defaultFilters,
  type DocumentsFiltersState,
  type DocumentStatusFilter,
} from './filters';

interface Props {
  filters: DocumentsFiltersState;
  onChange: (next: DocumentsFiltersState) => void;
}

const STATUSES: { value: DocumentStatus; key: string }[] = [
  { value: 'DRAFT', key: 'common:status.draft' },
  { value: 'IN_REVIEW', key: 'common:status.in-review' },
  { value: 'REJECTED', key: 'common:status.rejected' },
  { value: 'APPROVED', key: 'common:status.approved' },
  { value: 'SIGNED', key: 'common:status.signed' },
  { value: 'CLOSED', key: 'common:status.closed' },
];

function StatusSelect({
  value,
  onChange,
}: {
  value: DocumentStatusFilter;
  onChange: (v: DocumentStatusFilter) => void;
}) {
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DocumentStatusFilter)}>
      <SelectTrigger className="w-full md:w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t('common:labels.all')}</SelectItem>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {t(s.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Registry filters: inline row on `md+`, search + bottom-sheet (draft state,
 * Apply / Reset) below — the step-09 employee-list pattern.
 */
export default function DocumentFilters({ filters, onChange }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  // Reset the draft to current applied filters every time the sheet opens, so
  // a previously discarded draft doesn't leak into the next session.
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const activeCount = activeFilterCount(filters);

  function apply() {
    onChange({ ...draft, page: 1 });
    setOpen(false);
  }

  function reset() {
    const next: DocumentsFiltersState = {
      ...filters,
      status: defaultFilters.status,
      page: 1,
    };
    setDraft(next);
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      {/* Desktop: inline row */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="w-72">
          <SearchInput
            value={filters.search}
            onChange={(v) => onChange({ ...filters, search: v, page: 1 })}
            placeholder={t('dashboard:documents.registry.search-placeholder')}
          />
        </div>
        <StatusSelect
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status, page: 1 })}
        />
      </div>

      {/* Mobile: search + filter sheet */}
      <div className="flex gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => onChange({ ...filters, search: v, page: 1 })}
            placeholder={t('dashboard:documents.registry.search-placeholder')}
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Filter className="mr-2 h-4 w-4" />
              {t('common:actions.filter')}
              {activeCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] font-semibold tabular-nums text-canvas">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex h-auto flex-col gap-0 rounded-t-2xl p-0"
          >
            <SheetHeader className="border-b border-line p-6 text-left">
              <SheetTitle className="pr-10">{t('common:actions.filter')}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label>{t('dashboard:documents.registry.filter-status')}</Label>
                <StatusSelect
                  value={draft.status}
                  onChange={(status) => setDraft({ ...draft, status })}
                />
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
      </div>
    </>
  );
}
