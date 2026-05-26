import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Plus, X } from 'lucide-react';

import LoadingState from '@/components/common/LoadingState';
import PageHeader from '@/components/common/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/use-media-query';
import {
  approveCertificate,
  listCertificates,
  listEmployees,
  MockNetworkError,
} from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Certificate, Employee } from '@/types/domain';

import ApproveDialog from './ApproveDialog';
import CertificateDetailsSheet from './CertificateDetailsSheet';
import CertificatesKanban from './CertificatesKanban';
import CertificatesTabsMobile from './CertificatesTabsMobile';
import RejectDialog from './RejectDialog';
import RevokeDialog from './RevokeDialog';

type ActiveDialog = 'approve' | 'reject' | 'revoke' | null;

export default function CertificatesPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const actor = useAuthStore((s) => s.user?.uuid ?? '');

  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCert, setOpenCert] = useState<Certificate | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Step-11 profile cert tab CTA routes here with `?upload=1&employee=<uuid>`.
  // Bounce straight to the upload page so the user doesn't get dropped on the
  // board first.
  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      const empId = searchParams.get('employee');
      navigate(`/certificates/upload${empId ? `?employee=${empId}` : ''}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const reload = useCallback(async () => {
    const [c, e] = await Promise.all([listCertificates(), listEmployees()]);
    setCerts(c);
    setEmployees(e);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggle(uuid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  }

  async function bulkApprove() {
    const ids = Array.from(selected);
    setBulkBusy(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await approveCertificate(id, actor);
        ok++;
      } catch (err) {
        // 3% simulated-failure rate per mock backend — skip and report the
        // actual success count at the end.
        if (!(err instanceof MockNetworkError)) {
          // Unexpected error — log to console for diagnosis, still continue.
          console.error('Bulk approve failed for', id, err);
        }
      }
    }
    setBulkBusy(false);
    toast.success(t('dashboard:certificates.toast.bulk-approved', { count: ok }));
    setSelected(new Set());
    await reload();
  }

  const pendingCount = useMemo(
    () => certs?.filter((c) => c.status === 'PENDING_APPROVAL').length ?? 0,
    [certs],
  );

  const openEmployee = useMemo(
    () => (openCert ? employees.find((e) => e.uuid === openCert.employeeUuid) : undefined),
    [openCert, employees],
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('dashboard:certificates.title')}
        subtitle={t('dashboard:certificates.subtitle', { count: pendingCount })}
        actions={
          <Button asChild>
            <Link to="/certificates/upload">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard:certificates.upload-cta')}
            </Link>
          </Button>
        }
      />

      {selected.size > 0 && (
        <Alert className="flex flex-col gap-3 border-emerald/30 bg-cream-deep md:flex-row md:items-center md:justify-between">
          <AlertDescription className="text-ink">
            {t('dashboard:certificates.bulk.selected', { count: selected.size })}
          </AlertDescription>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set())}
              disabled={bulkBusy}
            >
              <X className="mr-1 h-4 w-4" />
              {t('common:actions.cancel')}
            </Button>
            <Button size="sm" onClick={bulkApprove} disabled={bulkBusy}>
              <Check className="mr-1 h-4 w-4" />
              {t('dashboard:certificates.bulk.approve-cta')} ({selected.size})
            </Button>
          </div>
        </Alert>
      )}

      {!certs ? (
        <LoadingState rows={6} />
      ) : isDesktop ? (
        <CertificatesKanban
          certs={certs}
          employees={employees}
          selected={selected}
          onToggleSelect={toggle}
          onOpen={setOpenCert}
        />
      ) : (
        <CertificatesTabsMobile
          certs={certs}
          employees={employees}
          selected={selected}
          onToggleSelect={toggle}
          onOpen={setOpenCert}
        />
      )}

      <CertificateDetailsSheet
        cert={openCert}
        employee={openEmployee}
        onClose={() => setOpenCert(null)}
        onApprove={() => setDialog('approve')}
        onReject={() => setDialog('reject')}
        onRevoke={() => setDialog('revoke')}
      />

      {openCert && dialog === 'approve' && (
        <ApproveDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          cert={openCert}
          employee={openEmployee}
          onDone={async () => {
            setDialog(null);
            setOpenCert(null);
            await reload();
          }}
        />
      )}
      {openCert && dialog === 'reject' && (
        <RejectDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          cert={openCert}
          employee={openEmployee}
          onDone={async () => {
            setDialog(null);
            setOpenCert(null);
            await reload();
          }}
        />
      )}
      {openCert && dialog === 'revoke' && (
        <RevokeDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          cert={openCert}
          employee={openEmployee}
          onDone={async () => {
            setDialog(null);
            setOpenCert(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}
