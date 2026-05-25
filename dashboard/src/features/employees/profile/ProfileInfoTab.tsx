import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Power } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/i18n/uz-locale';
import { MockNetworkError, terminateEmployee } from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Employee } from '@/types/domain';

import UpdateEmployeeSheet from './UpdateEmployeeSheet';

interface Props {
  employee: Employee;
  onChanged: (next: Employee) => void;
}

function formatPinfl(pinfl: string): string {
  return pinfl.replace(/(.{4})/g, '$1 ').trim();
}

export default function ProfileInfoTab({ employee, onChanged }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const actor = useAuthStore((s) => s.user?.uuid ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const terminated = employee.status === 'TERMINATED';

  const rows: { key: string; label: string; value: string | null }[] = [
    {
      key: 'pinfl',
      label: t('dashboard:employees.profile.info.fields.pinfl'),
      value: formatPinfl(employee.pinfl),
    },
    {
      key: 'gender',
      label: t('dashboard:employees.profile.info.fields.gender'),
      value: t(`dashboard:employees.profile.info.gender.${employee.gender}`),
    },
    {
      key: 'birthDate',
      label: t('dashboard:employees.profile.info.fields.birth-date'),
      value: employee.birthDate ? formatDate(employee.birthDate) : null,
    },
    {
      key: 'passport',
      label: t('dashboard:employees.profile.info.fields.passport'),
      value: employee.passportSeries ?? null,
    },
    {
      key: 'mobilePhone',
      label: t('dashboard:employees.profile.info.fields.mobile-phone'),
      value: employee.mobilePhone,
    },
    {
      key: 'workPhone',
      label: t('dashboard:employees.profile.info.fields.work-phone'),
      value:
        [employee.workPhone, employee.internalExtension && `(${employee.internalExtension})`]
          .filter(Boolean)
          .join(' ') || null,
    },
    {
      key: 'corporateEmail',
      label: t('dashboard:employees.profile.info.fields.corporate-email'),
      value: employee.corporateEmail,
    },
    {
      key: 'personalEmail',
      label: t('dashboard:employees.profile.info.fields.personal-email'),
      value: employee.personalEmail ?? null,
    },
    {
      key: 'hireDate',
      label: t('dashboard:employees.profile.info.fields.hire-date'),
      value: employee.hireDate ? formatDate(employee.hireDate) : null,
    },
    {
      key: 'terminationDate',
      label: t('dashboard:employees.profile.info.fields.termination-date'),
      value: employee.terminationDate ? formatDate(employee.terminationDate) : null,
    },
    {
      key: 'employmentType',
      label: t('dashboard:employees.profile.info.fields.employment-type'),
      value: t(`dashboard:employees.profile.info.employment.${employee.employmentType}`),
    },
  ];

  async function onConfirmTerminate() {
    try {
      setTerminating(true);
      await terminateEmployee(employee.uuid, actor);
      toast.success(
        t('dashboard:employees.profile.terminate.success', { name: employee.fullNameGenerated }),
      );
      setTerminateOpen(false);
      // Re-navigate to the same route so the page re-fetches the now-terminated
      // employee. Replacing the entry keeps the back button intact.
      navigate(`/employees/${employee.uuid}`, { replace: true });
    } catch (err) {
      if (err instanceof MockNetworkError) {
        toast.error(t('common:errors.network'));
      } else {
        toast.error(t('common:errors.unknown'));
      }
    } finally {
      setTerminating(false);
    }
  }

  return (
    <div className="pt-4 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">
          {t('dashboard:employees.profile.info.heading')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" />
            {t('dashboard:employees.profile.info.edit')}
          </Button>
          {!terminated && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setTerminateOpen(true)}
            >
              <Power className="mr-1 h-4 w-4" />
              {t('dashboard:employees.profile.terminate.cta')}
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-line bg-surface p-5 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-0.5 border-b border-line/50 pb-2 last:border-b-0 md:border-b-0 md:pb-0">
            <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
            <dd className="text-sm text-ink">
              {row.value ?? (
                <span className="text-muted-foreground">
                  {t('dashboard:employees.profile.info.empty-value')}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <UpdateEmployeeSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={employee}
        onSaved={onChanged}
      />

      <AlertDialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard:employees.profile.terminate.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard:employees.profile.terminate.body', { name: employee.fullNameGenerated })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={terminating}>
              {t('dashboard:employees.profile.terminate.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmTerminate();
              }}
              disabled={terminating}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('dashboard:employees.profile.terminate.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
