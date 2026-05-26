import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Certificate, Employee } from '@/types/domain';

import CertificateCard from './CertificateCard';

export type DnDDropInput = {
  certUuid: string;
  fromStatus: Certificate['status'];
  toStatus: Certificate['status'];
};

export type DnDReorderInput = {
  activeUuid: string;
  overUuid: string;
};

const COLUMNS: Array<{
  key: Certificate['status'];
  headerBg: string;
  headerText: string;
}> = [
  { key: 'PENDING_APPROVAL', headerBg: 'bg-cinnamon-soft', headerText: 'text-cinnamon' },
  { key: 'ACTIVE', headerBg: 'bg-emerald-soft', headerText: 'text-emerald-deep' },
  { key: 'EXPIRED', headerBg: 'bg-cream-deep', headerText: 'text-ink-soft' },
  { key: 'REVOKED', headerBg: 'bg-destructive/10', headerText: 'text-destructive' },
];

// Source columns whose cards are draggable. Terminal columns (EXPIRED /
// REVOKED) are read-only — their cards never move and aren't reorderable.
const DRAGGABLE_FROM: Certificate['status'][] = ['PENDING_APPROVAL', 'ACTIVE'];

// Allowed cross-column destinations per source. Anything not listed here
// surfaces a "forbidden transition" toast in the parent's onDrop handler.
const ALLOWED_TRANSITIONS: Partial<Record<Certificate['status'], Certificate['status'][]>> = {
  PENDING_APPROVAL: ['ACTIVE'],
  ACTIVE: ['REVOKED'],
};

function isAllowed(from: Certificate['status'], to: Certificate['status']): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

interface Props {
  certs: Certificate[];
  employees: Employee[];
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
  onDrop: (input: DnDDropInput) => void;
  onReorder: (input: DnDReorderInput) => void;
}

export default function CertificatesKanban({
  certs,
  employees,
  selected,
  onToggleSelect,
  onOpen,
  onDrop,
  onReorder,
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

  // Activation distance 8 px keeps tap-to-open-detail-sheet working: under
  // 8 px of movement, no drag engages and the click falls through to the
  // card's onClick. Keyboard sensor enables Space/Enter to grab + arrows
  // to move — same accessibility as before sortable.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [dragging, setDragging] = useState<Certificate | null>(null);

  // After a real drag, the browser still fires a synthesized click on the
  // released element. SortableCard's onClickCapture consults this ref and
  // suppresses that click so the detail sheet doesn't open on top of the
  // drop result. setTimeout(0) clears it on the next macrotask, after the
  // click has been processed.
  const justDragged = useRef(false);

  function onDragStart(e: DragStartEvent) {
    const cert = certs.find((c) => c.uuid === e.active.id);
    if (cert) setDragging(cert);
  }

  function onDragEnd(e: DragEndEvent) {
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);

    setDragging(null);
    if (!e.over) return;

    const activeId = String(e.active.id);
    const overId = String(e.over.id);
    if (activeId === overId) return;

    const fromStatus = e.active.data.current?.fromStatus as Certificate['status'] | undefined;
    if (!fromStatus) return;

    // Resolve the destination status: dropping on a card uses that card's
    // status; dropping on column empty space uses the column id (a status).
    const overData = e.over.data.current as
      | { type?: 'card' | 'column'; fromStatus?: Certificate['status']; status?: Certificate['status'] }
      | undefined;
    const toStatus =
      overData?.type === 'card' ? overData.fromStatus : overData?.status;
    if (!toStatus) return;

    // Same column — within-column reorder via SortableContext semantics.
    if (fromStatus === toStatus) {
      // Reorder only makes sense if we landed on a card (over.id is another
      // card UUID). Releasing on the column's empty space at the same column
      // is a no-op.
      if (overData?.type === 'card') {
        onReorder({ activeUuid: activeId, overUuid: overId });
      }
      return;
    }

    // Different column — existing approve / revoke / forbidden flow.
    onDrop({ certUuid: activeId, fromStatus, toStatus });
  }

  return (
    <DndContext
      sensors={sensors}
      // closestCenter is the standard sortable collision algorithm: snaps
      // to the nearest droppable center. Works well for both within-column
      // reorder (cards in the same SortableContext) and cross-column drop
      // (column-level droppables registered alongside the sortable cards).
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.key}
            status={col.key}
            headerBg={col.headerBg}
            headerText={col.headerText}
            label={t(`dashboard:certificates.columns.${col.key}`)}
            rows={rowsByStatus[col.key] ?? []}
            emptyLabel={t('dashboard:certificates.empty-column')}
            empByUuid={empByUuid}
            selected={selected}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            draggingFrom={dragging?.status ?? null}
            justDraggedRef={justDragged}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className="w-72 cursor-grabbing opacity-90 shadow-lg">
            <CertificateCard cert={dragging} employee={empByUuid.get(dragging.employeeUuid)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface DroppableColumnProps {
  status: Certificate['status'];
  headerBg: string;
  headerText: string;
  label: string;
  emptyLabel: string;
  rows: Certificate[];
  empByUuid: Map<string, Employee>;
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
  draggingFrom: Certificate['status'] | null;
  justDraggedRef: React.MutableRefObject<boolean>;
}

function DroppableColumn({
  status,
  headerBg,
  headerText,
  label,
  emptyLabel,
  rows,
  empByUuid,
  selected,
  onToggleSelect,
  onOpen,
  draggingFrom,
  justDraggedRef,
}: DroppableColumnProps) {
  // Column-level droppable so empty columns can still receive cross-column
  // drops, and the column lights up for valid cross-column targets.
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { type: 'column', status } });

  // Cross-column drop hint: only show on columns OTHER than the source.
  // Within-column (source === status) shows no hint since within-column
  // gets the sortable preview shift instead.
  const allowed = draggingFrom ? isAllowed(draggingFrom, status) : null;
  const dropHint =
    draggingFrom && draggingFrom !== status
      ? allowed
        ? 'ring-2 ring-emerald ring-offset-2 ring-offset-cream'
        : 'ring-2 ring-destructive/40 ring-offset-2 ring-offset-cream opacity-60'
      : '';
  const isOverAndAllowed = isOver && allowed;

  // Only PENDING / ACTIVE columns participate in sortable. Terminal columns
  // (EXPIRED / REVOKED) keep their cards static — neither reorderable nor
  // cross-column-draggable.
  const sortable = DRAGGABLE_FROM.includes(status);

  const list = (
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        rows.map((c) => (
          <SortableCard
            key={c.uuid}
            cert={c}
            employee={empByUuid.get(c.employeeUuid)}
            selected={selected.has(c.uuid)}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            justDraggedRef={justDraggedRef}
          />
        ))
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-120 flex-col rounded-xl border border-line bg-cream-deep/40 p-3 transition-shadow',
        dropHint,
        isOverAndAllowed && 'bg-emerald-soft/40',
      )}
    >
      <div className={`mb-3 flex items-center justify-between rounded-md px-3 py-2 ${headerBg}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${headerText}`}>
          {label}
        </span>
        <Badge variant="outline" className="border-line bg-cream tabular-nums">
          {rows.length}
        </Badge>
      </div>
      {sortable ? (
        <SortableContext
          id={status}
          items={rows.map((c) => c.uuid)}
          strategy={verticalListSortingStrategy}
        >
          {list}
        </SortableContext>
      ) : (
        list
      )}
    </div>
  );
}

interface SortableCardProps {
  cert: Certificate;
  employee?: Employee;
  selected: boolean;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
  justDraggedRef: React.MutableRefObject<boolean>;
}

function SortableCard({
  cert,
  employee,
  selected,
  onToggleSelect,
  onOpen,
  justDraggedRef,
}: SortableCardProps) {
  const draggable = DRAGGABLE_FROM.includes(cert.status);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cert.uuid,
    data: { type: 'card', fromStatus: cert.status },
    disabled: !draggable,
  });

  function handleClickCapture(e: React.MouseEvent) {
    if (justDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  // useSortable's `transform` shifts the card during sorting animations
  // (e.g., as other cards in the same column make room for the dragged
  // item). CSS.Transform.toString converts it to a CSS transform string.
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? listeners : {})}
      {...attributes}
      onClickCapture={handleClickCapture}
      className={cn(
        // select-none prevents the browser's native blue text-selection
        // highlight from appearing as the user drags across cards. Without
        // it, pointerdown + mousemove on text content reads as a selection
        // gesture and paints the blue overlay underneath the drag preview.
        'select-none',
        // Draggable cards (PENDING / ACTIVE) get the grab cursor; terminal
        // cards (EXPIRED / REVOKED) get not-allowed to signal their DnD
        // affordance is unavailable. The `**:cursor-not-allowed` (Tailwind
        // v4 universal-descendant variant) overrides the inner
        // CertificateCard's cursor-pointer baked into the Card primitive.
        draggable
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-not-allowed **:cursor-not-allowed',
        isDragging && 'opacity-30',
      )}
    >
      <CertificateCard
        cert={cert}
        employee={employee}
        selected={selected}
        onSelect={cert.status === 'PENDING_APPROVAL' ? () => onToggleSelect(cert.uuid) : undefined}
        onClick={() => onOpen(cert)}
      />
    </div>
  );
}
