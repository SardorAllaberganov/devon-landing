import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  ArrowRightLeft,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  ShieldX,
  Trash2,
  Upload,
  UserCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingState from '@/components/common/LoadingState';
import { listAudit } from '@/lib/mock-backend';
import { formatRelative } from '@/i18n/uz-locale';
import type { AuditAction, AuditEntry } from '@/types/domain';

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
  CERTIFICATE_REVOKED: ShieldX,
  PROFILE_CHANGE_REQUESTED: UserCog,
  PROFILE_CHANGE_APPROVED: UserCheck,
};

export default function RecentActivityCard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [rows, setRows] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await listAudit({ limit: 8 });
      if (!cancelled) setRows(result);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">
          {t('dashboard:home.recent-activity')}
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/audit">{t('common:actions.view-all')}</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {!rows && <LoadingState rows={6} />}
        {rows && rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('dashboard:home.no-activity')}
          </p>
        )}
        {rows && rows.length > 0 && (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const Icon = ACTION_ICON[r.action];
              return (
                <li key={r.uuid} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cream-warm text-emerald">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-snug text-ink">
                      <span className="font-medium">{r.actorName}</span>{' '}
                      <span className="text-muted-foreground">
                        {t(`dashboard:audit.actions.${r.action}`)}
                      </span>{' '}
                      <span className="text-ink">{r.resourceLabel}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelative(r.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
