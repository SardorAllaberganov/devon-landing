import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Archive,
  Check,
  CheckCheck,
  Clock,
  Forward,
  Hourglass,
  Inbox,
  Lock,
  MailCheck,
  PenLine,
  Play,
  SendHorizontal,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusKind =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'ON_LEAVE'
  | 'IN_REVIEW'
  | 'SIGNED'
  | 'CLOSED'
  | 'REGISTERED'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'EXECUTED'
  | 'ON_SIGNATURE'
  | 'RESPONDED'
  | 'DISPATCHED'
  | 'CLOSED_NO_RESPONSE';

interface Style {
  cls: string;
  icon: LucideIcon;
  key: string;
}

const STYLES: Record<StatusKind, Style> = {
  ACTIVE: { cls: 'bg-emerald-soft text-emerald-deep', icon: Check, key: 'common:status.active' },
  ARCHIVED: { cls: 'bg-muted text-muted-foreground', icon: Archive, key: 'common:status.archived' },
  DRAFT: { cls: 'bg-cream-warm text-cinnamon', icon: Clock, key: 'common:status.draft' },
  PENDING_APPROVAL: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: Clock,
    key: 'common:status.pending',
  },
  APPROVED: {
    cls: 'bg-emerald-soft text-emerald-deep',
    icon: Check,
    key: 'common:status.approved',
  },
  REJECTED: { cls: 'bg-destructive/10 text-destructive', icon: X, key: 'common:status.rejected' },
  EXPIRED: {
    cls: 'bg-muted text-muted-foreground',
    icon: AlertCircle,
    key: 'common:status.expired',
  },
  REVOKED: {
    cls: 'bg-destructive/10 text-destructive',
    icon: Lock,
    key: 'common:status.revoked',
  },
  SUSPENDED: {
    cls: 'bg-muted text-muted-foreground',
    icon: Lock,
    key: 'common:status.suspended',
  },
  TERMINATED: {
    cls: 'bg-muted text-muted-foreground',
    icon: Archive,
    key: 'common:status.terminated',
  },
  ON_LEAVE: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: Clock,
    key: 'common:status.on-leave',
  },
  // Document statuses (M2, BP-4 canon).
  IN_REVIEW: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: Hourglass,
    key: 'common:status.in-review',
  },
  SIGNED: {
    cls: 'bg-emerald-soft text-emerald-deep',
    icon: PenLine,
    key: 'common:status.signed',
  },
  CLOSED: {
    cls: 'bg-muted text-muted-foreground',
    icon: CheckCheck,
    key: 'common:status.closed',
  },
  // Letter statuses (M2 step 20, BP-3 canon). CLOSED above is shared.
  REGISTERED: {
    cls: 'bg-cream-warm text-cinnamon',
    icon: Inbox,
    key: 'common:status.registered',
  },
  ROUTED: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: Forward,
    key: 'common:status.routed',
  },
  ASSIGNED: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: UserRound,
    key: 'common:status.assigned',
  },
  IN_PROGRESS: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: Play,
    key: 'common:status.in-progress',
  },
  EXECUTED: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: CheckCheck,
    key: 'common:status.executed',
  },
  ON_SIGNATURE: {
    cls: 'bg-cinnamon-soft text-cinnamon',
    icon: PenLine,
    key: 'common:status.on-signature',
  },
  RESPONDED: {
    cls: 'bg-emerald-soft text-emerald-deep',
    icon: MailCheck,
    key: 'common:status.responded',
  },
  DISPATCHED: {
    cls: 'bg-emerald-soft text-emerald-deep',
    icon: SendHorizontal,
    key: 'common:status.dispatched',
  },
  CLOSED_NO_RESPONSE: {
    cls: 'bg-muted text-muted-foreground',
    icon: Archive,
    key: 'common:status.closed-no-response',
  },
};

interface Props {
  status: StatusKind;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation(['common']);
  const style = STYLES[status];
  const Icon = style.icon;
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 border-transparent font-medium', style.cls, className)}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {t(style.key)}
    </Badge>
  );
}
