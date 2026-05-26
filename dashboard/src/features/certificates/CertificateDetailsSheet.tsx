import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink, ShieldOff, X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatDateTime } from '@/i18n/uz-locale';
import type { Certificate, Employee } from '@/types/domain';

interface Props {
  cert: Certificate | null;
  employee?: Employee;
  onClose: () => void;
  onApprove: (cert: Certificate) => void;
  onReject: (cert: Certificate) => void;
  onRevoke: (cert: Certificate) => void;
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

export default function CertificateDetailsSheet({
  cert,
  employee,
  onClose,
  onApprove,
  onReject,
  onRevoke,
}: Props) {
  const { t } = useTranslation(['dashboard', 'common']);

  const open = !!cert;
  const isPending = cert?.status === 'PENDING_APPROVAL';
  const isActive = cert?.status === 'ACTIVE';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {cert && (
          <>
            <SheetHeader className="border-b border-line p-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-emerald-soft text-sm font-semibold text-emerald-deep">
                    {initials(employee?.fullNameGenerated ?? cert.subjectCommonName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="pr-10 text-left text-lg">
                    {employee?.fullNameGenerated ?? cert.subjectCommonName}
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    {t('dashboard:certificates.details.title')}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={cert.status} />
                {employee && (
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Link to={`/employees/${employee.uuid}`} onClick={onClose}>
                      <ExternalLink className="mr-1 h-3 w-3" />
                      {t('common:actions.open-profile')}
                    </Link>
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <dl className="space-y-3 text-sm">
                <Row label={t('dashboard:certificates.details.issuer')} value={cert.issuerName} />
                <Row
                  label={t('dashboard:certificates.details.serial')}
                  value={
                    <span className="break-all font-mono text-xs tabular-nums">
                      {cert.serialNumber}
                    </span>
                  }
                />
                <Row
                  label={t('dashboard:certificates.details.thumbprint')}
                  value={
                    <span className="break-all font-mono text-xs tabular-nums">
                      {cert.thumbprint}
                    </span>
                  }
                />
                <Row
                  label={t('dashboard:certificates.details.key-usage')}
                  value={cert.keyUsage.join(', ')}
                />
                <Row
                  label={t('dashboard:certificates.details.validity')}
                  value={
                    <span className="tabular-nums">
                      {formatDate(cert.validFrom)} – {formatDate(cert.validTo)}
                    </span>
                  }
                />
                <Row
                  label={t('dashboard:certificates.details.uploaded-at')}
                  value={<span className="tabular-nums">{formatDateTime(cert.createdAt)}</span>}
                />
                {cert.rejectionReason && (
                  <Row
                    label={t('dashboard:certificates.details.rejection-reason')}
                    value={<span className="text-destructive">{cert.rejectionReason}</span>}
                  />
                )}
                {cert.revocationReason && (
                  <Row
                    label={t('dashboard:certificates.details.revocation-reason')}
                    value={
                      <span className="text-cinnamon">
                        {cert.revocationReason === 'EMPLOYEE_TERMINATED'
                          ? t('dashboard:audit.actions.UPDATE')
                          : t(`dashboard:certificates.revoke.reasons.${cert.revocationReason}`)}
                      </span>
                    }
                  />
                )}
              </dl>
            </div>

            {(isPending || isActive) && (
              <SheetFooter className="border-t border-line p-4">
                <div className="flex w-full flex-col gap-2">
                  {isPending && (
                    <>
                      <Button onClick={() => onApprove(cert)} className="w-full justify-center">
                        <Check className="mr-2 h-4 w-4" />
                        {t('dashboard:certificates.actions.approve')}
                      </Button>
                      <Button
                        onClick={() => onReject(cert)}
                        variant="outline"
                        className="w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t('dashboard:certificates.actions.reject')}
                      </Button>
                    </>
                  )}
                  {isActive && (
                    <Button
                      onClick={() => onRevoke(cert)}
                      variant="outline"
                      className="w-full justify-center border-cinnamon/40 text-cinnamon hover:bg-cinnamon-soft/40 hover:text-cinnamon"
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      {t('dashboard:certificates.actions.revoke')}
                    </Button>
                  )}
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
