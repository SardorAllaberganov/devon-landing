import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/i18n/uz-locale';
import type { Assignment, Position, Unit } from '@/types/domain';

interface Props {
  assignments: Assignment[];
  units: Unit[];
  positions: Position[];
}

export default function AssignmentTimeline({ assignments, units, positions }: Props) {
  const { t } = useTranslation(['dashboard']);

  if (assignments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('dashboard:employees.profile.units.empty')}
      </p>
    );
  }

  const unitOf = (uuid: string) => units.find((u) => u.uuid === uuid);
  const posName = (id: string) => positions.find((p) => p.id === id)?.nameUz ?? id;

  return (
    <ol className="relative ml-2 space-y-5 border-l-2 border-line pl-6">
      {assignments.map((a) => {
        const unit = unitOf(a.unitUuid);
        const active = !a.endDate;
        return (
          <li key={a.uuid} className="relative">
            <span
              className={`absolute top-1.5 -left-[31px] h-3 w-3 rounded-full ${
                active ? 'bg-emerald ring-4 ring-emerald-soft' : 'bg-muted-foreground'
              }`}
              aria-hidden
            />
            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <p className="text-xs tabular-nums text-muted-foreground">
                  {formatDate(a.startDate)} ·{' '}
                  {a.endDate ? formatDate(a.endDate) : t('dashboard:employees.profile.units.current')}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {a.isPrimary && (
                    <Badge className="border-transparent bg-emerald-soft text-emerald-deep">
                      {t('dashboard:employees.profile.units.primary')}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-line bg-cream">
                    {t(`dashboard:employees.profile.units.types.${a.type}`)}
                  </Badge>
                </div>
              </div>

              {unit ? (
                <Link
                  to={`/units?focus=${unit.uuid}`}
                  className="group inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-emerald"
                >
                  {unit.nameUz}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <p className="text-sm font-semibold text-ink">—</p>
              )}
              <p className="text-sm text-body">{posName(a.positionId)}</p>

              {a.workloadPercent !== 100 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t('dashboard:employees.profile.units.workload', { pct: a.workloadPercent })}
                  </p>
                  <Progress value={a.workloadPercent} className="h-1.5" />
                </div>
              )}

              {a.reason && (
                <p className="mt-2 text-xs italic text-muted-foreground">{a.reason}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
