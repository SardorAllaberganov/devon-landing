import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  BellOff,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileCheck2,
  FilePen,
  FileSearch,
  FileSignature,
  FileX2,
  Forward,
  PenLine,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelative } from '@/i18n/uz-locale';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationType } from '@/types/domain';

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  DOC_REVIEW_REQUESTED: FileSearch,
  DOC_DECIDED: FilePen,
  DOC_APPROVED: FileCheck2,
  DOC_REJECTED: FileX2,
  DOC_SIGN_REQUESTED: FileSignature,
  DOC_SIGNED: ShieldCheck,
  DOC_CLOSED: FileCheck,
  LETTER_ROUTED: Forward,
  LETTER_ASSIGNED: ClipboardList,
  LETTER_EXECUTED: ClipboardCheck,
  LETTER_ACCEPTED: BadgeCheck,
  LETTER_SIGN_REQUESTED: PenLine,
  LETTER_DISPATCHED: Send,
};

interface Props {
  /** `null` while loading. */
  notifications: AppNotification[] | null;
  onRowClick: (notification: AppNotification) => void;
}

export default function NotificationsList({ notifications, onRowClick }: Props) {
  const { t } = useTranslation(['dashboard']);

  if (notifications === null) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title={t('dashboard:notifications.empty-title')}
        body={t('dashboard:notifications.empty-body')}
        className="py-10"
      />
    );
  }

  return (
    <ul className="divide-y divide-line/60">
      {notifications.map((n) => {
        const Icon = TYPE_ICON[n.type];
        return (
          <li key={n.uuid}>
            <button
              type="button"
              onClick={() => onRowClick(n)}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-warm/60',
                !n.isRead && 'bg-cream-warm/40',
              )}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cream-warm text-emerald">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm leading-snug text-ink',
                    !n.isRead && 'font-medium',
                  )}
                >
                  {t(n.titleKey, n.params)}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatRelative(n.createdAt)}
                </span>
              </span>
              {!n.isRead && (
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
