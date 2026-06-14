import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Plus } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Employee, Unit } from '@/types/domain';

interface Props {
  units: Unit[];
  employees: Employee[];
  onOpen: (u: Unit) => void;
  onAddChild: (parent: Unit) => void;
}

function buildChildrenMap(units: Unit[]): Map<string, Unit[]> {
  const map = new Map<string, Unit[]>();
  for (const u of units) {
    if (!u.parentUuid) continue;
    const list = map.get(u.parentUuid);
    if (list) list.push(u);
    else map.set(u.parentUuid, [u]);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz'));
  return map;
}

function buildEmployeeCount(employees: Employee[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of employees) {
    if (e.status === 'TERMINATED') continue;
    map.set(e.primaryUnitUuid, (map.get(e.primaryUnitUuid) ?? 0) + 1);
  }
  return map;
}

export default function UnitsAccordionMobile({ units, employees, onOpen, onAddChild }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const roots = useMemo(
    () =>
      units
        .filter((u) => u.parentUuid === null)
        .sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz')),
    [units],
  );
  const childrenMap = useMemo(() => buildChildrenMap(units), [units]);
  const empCount = useMemo(() => buildEmployeeCount(employees), [employees]);

  if (roots.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
        {t('dashboard:units.empty.title')}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {roots.map((root) => {
        const kids = childrenMap.get(root.uuid) ?? [];
        return (
          <AccordionItem
            key={root.uuid}
            value={root.uuid}
            className="overflow-hidden rounded-lg border border-line bg-surface data-[state=open]:shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-surface-2">
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-ink">{root.nameUz}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`common:unit-types.${root.type}`)} ·{' '}
                  {empCount.get(root.uuid) ?? 0} {t('dashboard:units.tree.employees-suffix')}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-2 pt-0">
              {kids.map((child) => (
                <button
                  key={child.uuid}
                  type="button"
                  onClick={() => onOpen(child)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{child.nameUz}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="border-line bg-canvas text-[10px]"
                      >
                        {t(`common:unit-types.${child.type}`)}
                      </Badge>
                      <span>
                        {empCount.get(child.uuid) ?? 0}{' '}
                        {t('dashboard:units.tree.employees-suffix')}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddChild(root)}
                className="mt-2 w-full justify-start text-primary"
              >
                <Plus className="mr-2 h-4 w-4" /> {t('dashboard:units.tree.add-child')}
              </Button>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
