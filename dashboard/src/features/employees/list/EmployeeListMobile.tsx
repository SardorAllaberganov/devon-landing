import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';
import type { Employee, Unit } from '@/types/domain';

interface Props {
  rows: Employee[];
  unitsByUuid: Map<string, Unit>;
  positionsById: Map<string, string>;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function EmployeeListMobile({ rows, unitsByUuid, positionsById }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);

  return (
    <ul className="space-y-2">
      {rows.map((emp) => (
        <li key={emp.uuid}>
          <button
            type="button"
            onClick={() => navigate(`/employees/${emp.uuid}`)}
            aria-label={t('dashboard:employees.list.open-profile', {
              name: emp.fullNameGenerated,
            })}
            className="flex min-h-[64px] w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2/30"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-brand-soft text-sm font-semibold text-primary-deep">
                {initials(emp.fullNameGenerated)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {emp.fullNameGenerated}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {unitsByUuid.get(emp.primaryUnitUuid)?.nameUz ?? '—'} ·{' '}
                {positionsById.get(emp.positionId) ?? emp.positionId}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={emp.status} />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}
