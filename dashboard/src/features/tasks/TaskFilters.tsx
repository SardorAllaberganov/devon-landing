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
import type { TaskPriority } from '@/types/domain';

// ─── Filter state ─────────────────────────────────────────────────────────────

export type TaskPriorityFilter = TaskPriority | 'ALL';

export interface TaskFiltersState {
  priority: TaskPriorityFilter;
  overdueOnly: boolean;
  search: string;
}

export const defaultTaskFilters: TaskFiltersState = {
  priority: 'ALL',
  overdueOnly: false,
  search: '',
};

export function activeTaskFilterCount(f: TaskFiltersState): number {
  let n = 0;
  if (f.priority !== 'ALL') n++;
  if (f.overdueOnly) n++;
  return n;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PRIORITIES: { value: TaskPriority; key: string }[] = [
  { value: 'HIGH', key: 'dashboard:tasks.priority.HIGH' },
  { value: 'MEDIUM', key: 'dashboard:tasks.priority.MEDIUM' },
  { value: 'STANDARD', key: 'dashboard:tasks.priority.STANDARD' },
];

function PrioritySelect({
  value,
  onChange,
}: {
  value: TaskPriorityFilter;
  onChange: (v: TaskPriorityFilter) => void;
}) {
  const { t } = useTranslation(['dashboard']);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaskPriorityFilter)}>
      <SelectTrigger className="w-full md:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t('dashboard:tasks.filters.priority-all')}</SelectItem>
        {PRIORITIES.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {t(p.key)}
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
        pressed &&
          'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive',
      )}
    >
      <AlertTriangle className="mr-2 h-4 w-4" aria-hidden />
      {t('dashboard:tasks.filters.overdue')}
    </Button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  filters: TaskFiltersState;
  onChange: (next: TaskFiltersState) => void;
}

/**
 * Task filters: inline row on `md+`, search + bottom-sheet (draft state,
 * Apply / Reset) below — the same pattern as LetterFilters.
 */
export default function TaskFilters({ filters, onChange }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  // Reset the draft to current applied filters every time the sheet opens, so
  // a previously discarded draft doesn't leak into the next session.
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const activeCount = activeTaskFilterCount(filters);

  function apply() {
    onChange({ ...draft });
    setOpen(false);
  }

  function reset() {
    const next: TaskFiltersState = {
      ...filters,
      priority: defaultTaskFilters.priority,
      overdueOnly: defaultTaskFilters.overdueOnly,
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
            onChange={(v) => onChange({ ...filters, search: v })}
            placeholder={t('dashboard:tasks.filters.search-placeholder')}
          />
        </div>
        <PrioritySelect
          value={filters.priority}
          onChange={(priority) => onChange({ ...filters, priority })}
        />
        <OverdueChip
          pressed={filters.overdueOnly}
          onToggle={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
        />
      </div>

      {/* Mobile: search + filter sheet */}
      <div className="flex gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => onChange({ ...filters, search: v })}
            placeholder={t('dashboard:tasks.filters.search-placeholder')}
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
                <Label>{t('dashboard:tasks.filters.priority-all')}</Label>
                <PrioritySelect
                  value={draft.priority}
                  onChange={(priority) => setDraft({ ...draft, priority })}
                />
              </div>
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={draft.overdueOnly}
                  onCheckedChange={(v) => setDraft({ ...draft, overdueOnly: v === true })}
                />
                <span className="text-sm text-ink">
                  {t('dashboard:tasks.filters.overdue')}
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
