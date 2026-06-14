import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Archive,
  Check,
  CheckCheck,
  Circle,
  Clock,
  Eye,
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
  | 'CLOSED_NO_RESPONSE'
  // Task statuses (M2 step 23+).
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'DONE';

interface Style {
  cls: string;
  icon: LucideIcon;
  key: string;
}

const STYLES: Record<StatusKind, Style> = {
  ACTIVE: { cls: 'bg-success-soft text-success-fg', icon: Check, key: 'common:status.active' },
  ARCHIVED: { cls: 'bg-muted text-muted-foreground', icon: Archive, key: 'common:status.archived' },
  DRAFT: { cls: 'bg-muted text-muted-foreground', icon: Clock, key: 'common:status.draft' },
  PENDING_APPROVAL: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Clock,
    key: 'common:status.pending',
  },
  APPROVED: {
    cls: 'bg-success-soft text-success-fg',
    icon: Check,
    key: 'common:status.approved',
  },
  REJECTED: { cls: 'bg-error-soft text-error-fg', icon: X, key: 'common:status.rejected' },
  EXPIRED: {
    cls: 'bg-error-soft text-error-fg',
    icon: AlertCircle,
    key: 'common:status.expired',
  },
  REVOKED: {
    cls: 'bg-error-soft text-error-fg',
    icon: Lock,
    key: 'common:status.revoked',
  },
  SUSPENDED: {
    cls: 'bg-muted text-muted-foreground',
    icon: Lock,
    key: 'common:status.suspended',
  },
  TERMINATED: {
    cls: 'bg-error-soft text-error-fg',
    icon: Archive,
    key: 'common:status.terminated',
  },
  ON_LEAVE: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Clock,
    key: 'common:status.on-leave',
  },
  // Document statuses (M2, BP-4 canon).
  IN_REVIEW: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Hourglass,
    key: 'common:status.in-review',
  },
  SIGNED: {
    cls: 'bg-brand-soft text-primary-deep',
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
    cls: 'bg-warning-soft text-warning-fg',
    icon: Inbox,
    key: 'common:status.registered',
  },
  ROUTED: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Forward,
    key: 'common:status.routed',
  },
  ASSIGNED: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: UserRound,
    key: 'common:status.assigned',
  },
  IN_PROGRESS: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Play,
    key: 'common:status.in-progress',
  },
  EXECUTED: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: CheckCheck,
    key: 'common:status.executed',
  },
  ON_SIGNATURE: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: PenLine,
    key: 'common:status.on-signature',
  },
  RESPONDED: {
    cls: 'bg-brand-soft text-primary-deep',
    icon: MailCheck,
    key: 'common:status.responded',
  },
  DISPATCHED: {
    cls: 'bg-brand-soft text-primary-deep',
    icon: SendHorizontal,
    key: 'common:status.dispatched',
  },
  CLOSED_NO_RESPONSE: {
    cls: 'bg-muted text-muted-foreground',
    icon: Archive,
    key: 'common:status.closed-no-response',
  },
  // Task statuses.
  NEW: { cls: 'bg-muted text-muted-foreground', icon: Circle, key: 'common:status.new' },
  UNDER_REVIEW: {
    cls: 'bg-warning-soft text-warning-fg',
    icon: Eye,
    key: 'common:status.under-review',
  },
  DONE: { cls: 'bg-success-soft text-success-fg', icon: CheckCheck, key: 'common:status.done' },
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
