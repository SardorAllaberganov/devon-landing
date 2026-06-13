import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Loader2, PenLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/i18n/uz-locale';
import type { Employee, SignatureRecord } from '@/types/domain';

interface Props {
  signatures: SignatureRecord[];
  employees: Map<string, Employee>;
  /** certificateUuid → serialNumber. */
  certSerials: Map<string, string>;
}

/**
 * §2.3 "imzo tarixini saqlash va tekshirish". The per-row "Tekshirish" runs a
 * ~600 ms fake verify (master §17 theatre — no real PKCS#7 validation) and
 * settles into an inline "Imzo haqiqiy" badge.
 */
export default function SignatureHistoryCard({ signatures, employees, certSerials }: Props) {
  const { t } = useTranslation(['dashboard']);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<Set<string>>(new Set());

  function verify(uuid: string) {
    setVerifying(uuid);
    setTimeout(() => {
      setVerifying(null);
      setVerified((prev) => new Set(prev).add(uuid));
    }, 600);
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">
        {t('dashboard:documents.detail.signatures.title')}
      </h2>

      {signatures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('dashboard:documents.detail.signatures.empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {signatures.map((sig) => (
            <li key={sig.uuid} className="rounded-lg border border-line bg-background/60 p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-soft text-emerald">
                  <PenLine className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {employees.get(sig.employeeUuid)?.fullNameGenerated ?? '—'}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(sig.signedAt)} · {sig.algorithm}
                  </p>
                  <Link
                    to="/certificates"
                    className="mt-0.5 block truncate font-mono text-xs text-emerald hover:underline"
                  >
                    {certSerials.get(sig.certificateUuid) ?? sig.certificateUuid}
                  </Link>
                </div>
              </div>
              <div className="mt-2.5">
                {verified.has(sig.uuid) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-soft px-2 py-1 text-xs font-medium text-emerald-deep">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    {t('dashboard:documents.detail.signatures.verify-ok')}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={verifying === sig.uuid}
                    onClick={() => verify(sig.uuid)}
                  >
                    {verifying === sig.uuid && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    {t('dashboard:documents.detail.signatures.verify')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
