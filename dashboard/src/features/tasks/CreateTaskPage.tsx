import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, X } from 'lucide-react';

import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { useActingEmployee } from '@/lib/acting';

import CreateTaskForm from './CreateTaskForm';

const FORM_ID = 'create-task-form';

export default function CreateTaskPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const acting = useActingEmployee();
  const [submitting, setSubmitting] = useState(false);

  if (!acting) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <LoadingState rows={4} />
      </div>
    );
  }

  // Assigning a task is a manager action (heads at least one unit). As a modal
  // this page was only reachable from a manager-gated button; as a route anyone
  // could paste the URL, so guard here too (the backend re-validates scope —
  // this is the "don't surface controls a role can't use" rule).
  if (acting.headedUnitUuids.length === 0) {
    return <Navigate to="/tasks" replace />;
  }

  const onClose = () => navigate('/tasks');

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Mobile-only top bar — wizard parity */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t('common:actions.close')}
        >
          <X className="h-5 w-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-ink">
          {t('dashboard:tasks.create.title')}
        </h1>
      </header>

      {/* Desktop header */}
      <header className="hidden items-center justify-between border-b border-line bg-surface px-6 py-4 md:flex">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/tasks">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('dashboard:tasks.create.back')}
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {t('dashboard:tasks.create.title')}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('dashboard:tasks.create.subtitle')}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
      </header>

      <div className="flex flex-1 flex-col md:items-center md:py-8">
        <div className="flex w-full flex-1 flex-col md:max-w-3xl md:rounded-xl md:border md:border-line md:bg-surface md:shadow-sm">
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <CreateTaskForm
              formId={FORM_ID}
              acting={acting}
              onSubmittingChange={setSubmitting}
            />
          </div>

          <footer className="pb-safe sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 pt-4 md:px-8">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common:actions.cancel')}
            </Button>
            <Button form={FORM_ID} type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard:tasks.create.cta-submit')}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}
