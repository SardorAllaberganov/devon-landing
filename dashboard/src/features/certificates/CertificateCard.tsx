import { useTranslation } from 'react-i18next';
import { AlertCircle, Calendar } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/i18n/uz-locale';
import { cn } from '@/lib/utils';
import type { Certificate, Employee } from '@/types/domain';

interface Props {
  cert: Certificate;
  employee?: Employee;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const EXPIRING_SOON_MS = 30 * 86_400_000;

export default function CertificateCard({ cert, employee, selected, onSelect, onClick }: Props) {
  const { t } = useTranslation(['dashboard']);
  const expiringSoon =
    cert.status === 'ACTIVE' &&
    new Date(cert.validTo).getTime() - Date.now() < EXPIRING_SOON_MS;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer p-4 transition-shadow hover:shadow-sm',
        selected && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={!!selected}
              onCheckedChange={() => onSelect()}
              aria-label={t('dashboard:certificates.select-aria')}
            />
          </div>
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-brand-soft text-xs font-semibold text-primary-deep">
            {employee ? initials(employee.fullNameGenerated) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {employee?.fullNameGenerated ?? cert.subjectCommonName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{cert.issuerName}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
            <Calendar className="h-3 w-3" aria-hidden />
            {formatDate(cert.validFrom)} – {formatDate(cert.validTo)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={cert.status} />
            {expiringSoon && (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <AlertCircle className="h-3 w-3" />
                {t('dashboard:certificates.card.expiring-soon')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
