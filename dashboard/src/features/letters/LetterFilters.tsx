import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Filter } from 'lucide-react';

import SearchInput from '@/components/common/SearchInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type { LetterStatus } from '@/types/domain';

import {
  activeFilterCount,
  defaultFilters,
  type LettersFiltersState,
  type LetterStatusFilter,
} from './filters';

interface Props {
  filters: LettersFiltersState;
  onChange: (next: LettersFiltersState) => void;
}

const STATUSES: { value: LetterStatus; key: string }[] = [
  { value: 'REGISTERED', key: 'common:status.registered' },
  { value: 'ROUTED', key: 'common:status.routed' },
  { value: 'ASSIGNED', key: 'common:status.assigned' },
  { value: 'IN_PROGRESS', key: 'common:status.in-progress' },
  { value: 'EXECUTED', key: 'common:status.executed' },
  { value: 'ON_SIGNATURE', key: 'common:status.on-signature' },
  { value: 'RESPONDED', key: 'common:status.responded' },
  { value: 'DISPATCHED', key: 'common:status.dispatched' },
  { value: 'CLOSED', key: 'common:status.closed' },
  { value: 'CLOSED_NO_RESPONSE', key: 'common:status.closed-no-response' },
];

function StatusSelect({
  value,
  onChange,
}: {
  value: LetterStatusFilter;
  onChange: (v: LetterStatusFilter) => void;
}) {
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LetterStatusFilter)}>
      <SelectTrigger className="w-full md:w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t('dashboard:letters.registry.filter-status-all')}</SelectItem>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {t(s.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Muddati o'tgan" toggle chip — `aria-pressed` carries the state. */
function OverdueChip({
  pressed,
  onToggle,
}: {
  pressed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation(['dashboard']);
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        'shrink-0',
        pressed && 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive',
      )}
    >
      <AlertTriangle className="mr-2 h-4 w-4" aria-hidden />
      {t('dashboard:letters.registry.filter-overdue')}
    </Button>
  );
}

/**
 * Registry filters: inline row on `md+`, search + bottom-sheet (draft state,
 * Apply / Reset) below — the documents-registry / step-09 pattern.
 */
export default function LetterFilters({ filters, onChange }: Props) {
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
    const next: LettersFiltersState = {
      ...filters,
      status: defaultFilters.status,
      overdueOnly: defaultFilters.overdueOnly,
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
            placeholder={t('dashboard:letters.registry.search-placeholder')}
          />
        </div>
        <StatusSelect
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status, page: 1 })}
        />
        <OverdueChip
          pressed={filters.overdueOnly}
          onToggle={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly, page: 1 })}
        />
      </div>

      {/* Mobile: search + filter sheet */}
      <div className="flex gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => onChange({ ...filters, search: v, page: 1 })}
            placeholder={t('dashboard:letters.registry.search-placeholder')}
          />
        </div>
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
            className="flex h-auto flex-col gap-0 rounded-t-2xl p-0"
          >
            <SheetHeader className="border-b border-line p-6 text-left">
              <SheetTitle className="pr-10">{t('common:actions.filter')}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label>{t('dashboard:letters.registry.filter-status')}</Label>
                <StatusSelect
                  value={draft.status}
                  onChange={(status) => setDraft({ ...draft, status })}
                />
              </div>
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={draft.overdueOnly}
                  onCheckedChange={(v) => setDraft({ ...draft, overdueOnly: v === true })}
                />
                <span className="text-sm text-ink">
                  {t('dashboard:letters.registry.filter-overdue')}
                </span>
              </label>
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
