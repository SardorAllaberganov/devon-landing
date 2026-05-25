import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function formatPinfl(pinfl: string): string {
  return pinfl.replace(/(.{4})/g, '$1 ').trim();
}

export default function EmployeeListTable({ rows, unitsByUuid, positionsById }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader className="bg-cream-warm/40">
          <TableRow>
            <TableHead>{t('dashboard:employees.list.col-fio')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-unit')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-position')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-pinfl')}</TableHead>
            <TableHead>{t('dashboard:employees.list.col-status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((emp) => (
            <TableRow
              key={emp.uuid}
              className="cursor-pointer hover:bg-cream-warm/30"
              onClick={() => navigate(`/employees/${emp.uuid}`)}
            >
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-emerald-soft text-xs font-semibold text-emerald-deep">
                      {initials(emp.fullNameGenerated)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {emp.fullNameGenerated}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {emp.corporateEmail}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-body">
                <span className="block max-w-[20ch] truncate">
                  {unitsByUuid.get(emp.primaryUnitUuid)?.nameUz ?? '—'}
                </span>
              </TableCell>
              <TableCell className="text-sm text-body">
                {positionsById.get(emp.positionId) ?? emp.positionId}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                {formatPinfl(emp.pinfl)}
              </TableCell>
              <TableCell>
                <StatusBadge status={emp.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
