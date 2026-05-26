import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import type { Certificate, Employee } from '@/types/domain';

import CertificateCard from './CertificateCard';

const COLUMNS: Array<{
  key: Certificate['status'];
  headerBg: string;
  headerText: string;
}> = [
  {
    key: 'PENDING_APPROVAL',
    headerBg: 'bg-cinnamon-soft',
    headerText: 'text-cinnamon',
  },
  {
    key: 'ACTIVE',
    headerBg: 'bg-emerald-soft',
    headerText: 'text-emerald-deep',
  },
  {
    key: 'EXPIRED',
    headerBg: 'bg-cream-deep',
    headerText: 'text-ink-soft',
  },
  {
    key: 'REVOKED',
    headerBg: 'bg-destructive/10',
    headerText: 'text-destructive',
  },
];

interface Props {
  certs: Certificate[];
  employees: Employee[];
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
}

export default function CertificatesKanban({
  certs,
  employees,
  selected,
  onToggleSelect,
  onOpen,
}: Props) {
  const { t } = useTranslation(['dashboard']);
  const empByUuid = useMemo(
    () => new Map(employees.map((e) => [e.uuid, e])),
    [employees],
  );
  const rowsByStatus = useMemo(() => {
    const grouped: Record<Certificate['status'], Certificate[]> = {
      PENDING_APPROVAL: [],
      ACTIVE: [],
      EXPIRED: [],
      REVOKED: [],
      REJECTED: [],
    };
    for (const c of certs) {
      if (grouped[c.status]) grouped[c.status]!.push(c);
    }
    return grouped;
  }, [certs]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const rows = rowsByStatus[col.key] ?? [];
        return (
          <div
            key={col.key}
            className="flex min-h-[480px] flex-col rounded-xl border border-line bg-cream-deep/40 p-3"
          >
            <div
              className={`mb-3 flex items-center justify-between rounded-md px-3 py-2 ${col.headerBg}`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${col.headerText}`}
              >
                {t(`dashboard:certificates.columns.${col.key}`)}
              </span>
              <Badge variant="outline" className="border-line bg-cream tabular-nums">
                {rows.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {rows.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t('dashboard:certificates.empty-column')}
                </p>
              ) : (
                rows.map((c) => (
                  <CertificateCard
                    key={c.uuid}
                    cert={c}
                    employee={empByUuid.get(c.employeeUuid)}
                    selected={selected.has(c.uuid)}
                    onSelect={
                      c.status === 'PENDING_APPROVAL' ? () => onToggleSelect(c.uuid) : undefined
                    }
                    onClick={() => onOpen(c)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
