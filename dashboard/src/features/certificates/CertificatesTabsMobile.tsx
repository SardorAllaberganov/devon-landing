import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Certificate, Employee } from '@/types/domain';

import CertificateCard from './CertificateCard';

const STATUSES: Certificate['status'][] = [
  'PENDING_APPROVAL',
  'ACTIVE',
  'EXPIRED',
  'REVOKED',
];

// Underline-tab trigger className — same recipe as the step-11 profile page.
// flex-none beats the primitive's flex-1; matching `group-data-horizontal/tabs:`
// prefix on the after-pseudo overrides the primitive's default 5 px offset so
// the indicator sits flush on the TabsList's border-b baseline.
const TAB_TRIGGER_CN =
  'h-auto flex-none rounded-none px-3 py-2.5 text-sm ' +
  'data-active:text-primary data-active:font-semibold ' +
  'group-data-horizontal/tabs:after:-bottom-px ' +
  'group-data-horizontal/tabs:after:h-0.5 ' +
  'group-data-horizontal/tabs:after:bg-primary';

interface Props {
  certs: Certificate[];
  employees: Employee[];
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
}

export default function CertificatesTabsMobile({
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
  const [tab, setTab] = useState<Certificate['status']>('PENDING_APPROVAL');
  const countOf = (s: Certificate['status']) =>
    certs.filter((c) => c.status === s).length;
  const rows = certs.filter((c) => c.status === tab);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as Certificate['status'])}
      className="space-y-3"
    >
      <TabsList
        variant="line"
        className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-line p-0"
      >
        {STATUSES.map((s) => (
          <TabsTrigger key={s} value={s} className={TAB_TRIGGER_CN}>
            {t(`dashboard:certificates.columns.${s}`)}
            <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-surface-2 px-1.5 text-[10px] font-semibold tabular-nums text-ink">
              {countOf(s)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {STATUSES.map((s) => (
        <TabsContent key={s} value={s} className="space-y-2">
          {s === tab && rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-line bg-surface-2/40 py-8 text-center text-sm text-muted-foreground">
              {t('dashboard:certificates.empty-column')}
            </p>
          )}
          {s === tab &&
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
            ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
