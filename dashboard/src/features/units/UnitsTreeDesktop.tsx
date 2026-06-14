import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronRight, MoreVertical, Pencil, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Employee, Unit } from '@/types/domain';

interface Props {
  units: Unit[];
  employees: Employee[];
  search: string;
  onEdit: (u: Unit) => void;
  onAddChild: (parent: Unit) => void;
  onArchive: (u: Unit) => void;
  onOpen: (u: Unit) => void;
}

function buildChildrenMap(units: Unit[]): Map<string | null, Unit[]> {
  const map = new Map<string | null, Unit[]>();
  for (const u of units) {
    const key = u.parentUuid;
    const list = map.get(key);
    if (list) list.push(u);
    else map.set(key, [u]);
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

/**
 * For each direct hit, also surface every ancestor uuid (derived from `path`)
 * so the tree can render the full chain that leads to a deep match.
 */
function buildVisibleSet(units: Unit[], query: string): { visible: Set<string>; hits: Set<string> } | null {
  if (!query.trim()) return null;
  const q = query.trim().toLowerCase();
  const hits = new Set<string>();
  for (const u of units) {
    if (
      u.nameUz.toLowerCase().includes(q) ||
      u.code.toLowerCase().includes(q) ||
      (u.shortName?.toLowerCase().includes(q) ?? false)
    ) {
      hits.add(u.uuid);
    }
  }
  const visible = new Set<string>(hits);
  for (const u of units) {
    if (!hits.has(u.uuid)) continue;
    for (const segment of u.path.split('/').filter(Boolean)) visible.add(segment);
  }
  return { visible, hits };
}

export default function UnitsTreeDesktop({
  units,
  employees,
  search,
  onEdit,
  onAddChild,
  onArchive,
  onOpen,
}: Props) {
  const childrenMap = useMemo(() => buildChildrenMap(units), [units]);
  const empCount = useMemo(() => buildEmployeeCount(employees), [employees]);
  const filter = useMemo(() => buildVisibleSet(units, search), [units, search]);
  const roots = childrenMap.get(null) ?? [];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {roots.length === 0 ? (
        <EmptyRoots />
      ) : (
        roots.map((root) => (
          <Node
            key={root.uuid}
            unit={root}
            depth={0}
            childrenMap={childrenMap}
            empCount={empCount}
            filter={filter}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onArchive={onArchive}
            onOpen={onOpen}
          />
        ))
      )}
    </div>
  );
}

function EmptyRoots() {
  const { t } = useTranslation(['dashboard']);
  return (
    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
      {t('dashboard:units.empty.title')}
    </div>
  );
}

interface NodeProps {
  unit: Unit;
  depth: number;
  childrenMap: Map<string | null, Unit[]>;
  empCount: Map<string, number>;
  filter: { visible: Set<string>; hits: Set<string> } | null;
  onEdit: (u: Unit) => void;
  onAddChild: (p: Unit) => void;
  onArchive: (u: Unit) => void;
  onOpen: (u: Unit) => void;
}

function Node({
  unit,
  depth,
  childrenMap,
  empCount,
  filter,
  onEdit,
  onAddChild,
  onArchive,
  onOpen,
}: NodeProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const kids = childrenMap.get(unit.uuid) ?? [];
  // When searching, expand every ancestor of a hit; otherwise default to depth-0 open.
  const [openByUser, setOpenByUser] = useState<boolean | null>(null);
  const searchOpen = filter !== null;
  const open = openByUser ?? (searchOpen ? true : depth < 1);

  if (filter && !filter.visible.has(unit.uuid)) return null;

  const isHit = filter?.hits.has(unit.uuid) ?? false;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 border-b border-line/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2',
          isHit && 'bg-warning-soft/40',
        )}
        style={{ paddingLeft: 12 + depth * 20 }}
      >
        {kids.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpenByUser(!open)}
            aria-label={open ? t('common:actions.close') : t('common:actions.show-more')}
            className="-ml-1 rounded p-1 hover:bg-surface-2"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', open && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-6" />
        )}

        <button
          type="button"
          onClick={() => onOpen(unit)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{unit.nameUz}</span>
            <Badge
              variant="outline"
              className="border-line bg-canvas text-[10px] font-medium"
            >
              {t(`common:unit-types.${unit.type}`)}
            </Badge>
            {unit.status === 'ARCHIVED' && (
              <Badge
                variant="outline"
                className="border-transparent bg-muted text-[10px] text-muted-foreground"
              >
                {t('common:status.archived')}
              </Badge>
            )}
          </div>
        </button>

        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {empCount.get(unit.uuid) ?? 0} {t('dashboard:units.tree.employees-suffix')}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('common:actions.show-more')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuItem onSelect={() => onAddChild(unit)} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard:units.tree.add-child')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(unit)} className="whitespace-nowrap">
              <Pencil className="mr-2 h-4 w-4" />
              {t('common:actions.edit')}
            </DropdownMenuItem>
            {unit.status === 'ACTIVE' && (
              <DropdownMenuItem
                onSelect={() => onArchive(unit)}
                className="whitespace-nowrap text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                {t('common:actions.archive')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {open &&
        kids.map((k) => (
          <Node
            key={k.uuid}
            unit={k}
            depth={depth + 1}
            childrenMap={childrenMap}
            empCount={empCount}
            filter={filter}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onArchive={onArchive}
            onOpen={onOpen}
          />
        ))}
    </div>
  );
}
