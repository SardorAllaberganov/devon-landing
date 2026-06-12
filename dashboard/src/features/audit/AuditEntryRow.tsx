import { useTranslation } from 'react-i18next';
import {
  Archive,
  ArrowRightLeft,
  BadgeCheck,
  ClipboardCheck,
  Drama,
  Eye,
  FileCheck,
  FileCheck2,
  FilePenLine,
  FilePlus,
  FileX,
  Forward,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  MailPlus,
  Pencil,
  PenLine,
  Plus,
  Send,
  SendHorizontal,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Trash2,
  Upload,
  UserCheck,
  UserCog,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

import { formatDateTime } from '@/i18n/uz-locale';
import type { AuditAction, AuditEntry, Unit } from '@/types/domain';

const ACTION_ICON: Record<AuditAction, LucideIcon> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  ARCHIVE: Archive,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  PASSWORD_CHANGED: KeyRound,
  UNIT_TRANSFER: ArrowRightLeft,
  CERTIFICATE_UPLOADED: Upload,
  CERTIFICATE_APPROVED: ShieldCheck,
  CERTIFICATE_REJECTED: ShieldOff,
  CERTIFICATE_REVOKED: ShieldX,
  PROFILE_CHANGE_REQUESTED: UserCog,
  PROFILE_CHANGE_APPROVED: UserCheck,
  POV_SWITCHED: Drama,
  DOCUMENT_CREATED: FilePlus,
  DOCUMENT_SENT_FOR_REVIEW: Send,
  DOCUMENT_APPROVED: FileCheck,
  DOCUMENT_REJECTED: FileX,
  DOCUMENT_SIGNED: FilePenLine,
  DOCUMENT_CLOSED: FileCheck2,
  DOCUMENT_VIEWED: Eye,
  DOCUMENT_EMAILED: Mail,
  LETTER_REGISTERED: MailPlus,
  LETTER_ROUTED: Forward,
  LETTER_ASSIGNED: UserPlus,
  LETTER_EXECUTED: ClipboardCheck,
  LETTER_ACCEPTED: BadgeCheck,
  LETTER_SIGNED: PenLine,
  LETTER_DISPATCHED: SendHorizontal,
  LETTER_CLOSED: MailCheck,
};

interface Props {
  entry: AuditEntry;
  /** Unit lookup so UNIT_TRANSFER diffs can render unit names instead of uuids. */
  unitsByUuid: Map<string, Unit>;
  /** When true, render the mobile card layout; otherwise the desktop table row. */
  variant: 'card' | 'row';
}

function renderDiffValue(
  key: string,
  raw: unknown,
  unitsByUuid: Map<string, Unit>,
): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw !== 'string') return String(raw);
  if (key === 'unit') return unitsByUuid.get(raw)?.nameUz ?? raw;
  return raw;
}

function DiffBlock({
  changes,
  unitsByUuid,
}: {
  changes: AuditEntry['changes'];
  unitsByUuid: Map<string, Unit>;
}) {
  const { t } = useTranslation(['dashboard']);
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <dl className="mt-2 space-y-1 rounded-md bg-cream-warm/40 px-3 py-2 text-xs">
      {Object.entries(changes).map(([key, change]) => {
        const labelKey = `dashboard:audit.diff.${key}`;
        const label = t(labelKey, { defaultValue: key });
        return (
          <div key={key} className="flex flex-wrap items-center gap-1.5">
            <dt className="font-medium text-muted-foreground">{label}:</dt>
            <dd className="text-ink">
              <span>{renderDiffValue(key, change.from, unitsByUuid)}</span>
              <span className="mx-1.5 text-muted-foreground">
                {t('dashboard:audit.diff.arrow')}
              </span>
              <span className="font-medium">
                {renderDiffValue(key, change.to, unitsByUuid)}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function AuditEntryRow({ entry, unitsByUuid, variant }: Props) {
  const { t } = useTranslation(['dashboard']);
  const Icon = ACTION_ICON[entry.action];

  if (variant === 'card') {
    return (
      <li className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cream-warm text-emerald">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {formatDateTime(entry.createdAt)}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink">
              <span className="font-medium">{entry.actorName}</span>{' '}
              <span className="text-muted-foreground">
                {t(`dashboard:audit.actions.${entry.action}`)}
              </span>{' '}
              <span className="text-ink">{entry.resourceLabel}</span>
            </p>
            <DiffBlock changes={entry.changes} unitsByUuid={unitsByUuid} />
          </div>
        </div>
      </li>
    );
  }

  return (
    <tr className="border-b border-line/60 last:border-b-0 align-top">
      <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-foreground">
        {formatDateTime(entry.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-ink">{entry.actorName}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm text-ink">
          <Icon className="h-4 w-4 text-emerald" />
          {t(`dashboard:audit.actions.${entry.action}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm text-ink">{entry.resourceLabel}</span>
          <span className="text-xs text-muted-foreground">
            {t(`dashboard:audit.resource-types.${entry.resourceType}`)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <DiffBlock changes={entry.changes} unitsByUuid={unitsByUuid} />
      </td>
    </tr>
  );
}
