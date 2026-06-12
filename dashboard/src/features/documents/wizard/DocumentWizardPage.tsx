import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Send, X } from 'lucide-react';

import WizardStepper from '@/components/common/WizardStepper';
import { Button } from '@/components/ui/button';
import { useActingEmployee } from '@/lib/acting';
import {
  createDocument,
  DocumentValidationError,
  MockNetworkError,
  submitDocumentForReview,
  type CreateDocumentInput,
} from '@/lib/mock-backend';

import { type DocWizardData, TOTAL_STEPS, useDocWizardStore } from './doc-wizard-store';
import Step1Type, { STEP1_FORM_ID } from './Step1Type';
import Step2Content, { STEP2_FORM_ID } from './Step2Content';
import Step3Approvers, { STEP3_FORM_ID } from './Step3Approvers';
import Step4Review from './Step4Review';

const STEP_FORM_IDS: Record<number, string | null> = {
  0: STEP1_FORM_ID,
  1: STEP2_FORM_ID,
  2: STEP3_FORM_ID,
  3: null, // review — no inline form
};

const STEPS = [
  { key: '1', titleKey: 'dashboard:documents.wizard.step-1.title' },
  { key: '2', titleKey: 'dashboard:documents.wizard.step-2.title' },
  { key: '3', titleKey: 'dashboard:documents.wizard.step-3.title' },
  { key: 'r', titleKey: 'dashboard:documents.wizard.review.title' },
] as const;

function buildInput(data: DocWizardData): CreateDocumentInput {
  return {
    title: data.content.title,
    source: data.source,
    templateUuid: data.source === 'TEMPLATE' ? (data.templateUuid ?? undefined) : undefined,
    values: data.source === 'TEMPLATE' ? data.content.values : undefined,
    fileMeta: data.source === 'UPLOAD' && data.fileMeta ? data.fileMeta : undefined,
    confidentiality: data.content.confidentiality,
    recipientUuid: data.content.recipientUuid,
    signerUuid: data.content.signerUuid || undefined,
    requiresApproval: data.requiresApproval,
    participantUuids: data.requiresApproval ? data.participantUuids : undefined,
  };
}

export default function DocumentWizardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const acting = useActingEmployee();
  const current = useDocWizardStore((s) => s.current);
  const data = useDocWizardStore((s) => s.data);
  const prev = useDocWizardStore((s) => s.prev);
  const isDirty = useDocWizardStore((s) => s.isDirty);
  const reset = useDocWizardStore((s) => s.reset);

  const [busy, setBusy] = useState<'draft' | 'review' | null>(null);
  // Survives a network flake between create and submit-for-review: the retry
  // must not create a second document.
  const [createdUuid, setCreatedUuid] = useState<string | null>(null);

  function onClose() {
    if (isDirty() && !window.confirm(t('dashboard:documents.wizard.confirm-close'))) {
      return;
    }
    reset();
    navigate('/documents');
  }

  function toastError(err: unknown) {
    if (err instanceof DocumentValidationError) {
      toast.error(t(`dashboard:documents.errors.${err.code}`));
    } else if (err instanceof MockNetworkError) {
      toast.error(t('common:errors.network'));
    } else {
      toast.error(t('common:errors.unknown'));
    }
  }

  async function onSaveDraft() {
    if (!acting) return;
    setBusy('draft');
    try {
      const doc = await createDocument(buildInput(data), acting.employee.uuid);
      toast.success(
        t('dashboard:documents.wizard.toast-draft-saved', { number: doc.number }),
      );
      reset();
      navigate('/documents');
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(null);
    }
  }

  async function onSubmitForReview() {
    if (!acting) return;
    setBusy('review');
    try {
      let uuid = createdUuid;
      if (!uuid) {
        const doc = await createDocument(buildInput(data), acting.employee.uuid);
        uuid = doc.uuid;
        setCreatedUuid(doc.uuid);
      }
      const doc = await submitDocumentForReview(uuid, acting.employee.uuid);
      toast.success(
        t(
          data.requiresApproval
            ? 'dashboard:documents.wizard.toast-sent-for-review'
            : 'dashboard:documents.wizard.toast-submitted',
          { number: doc.number },
        ),
      );
      reset();
      setCreatedUuid(null);
      navigate(`/documents/${doc.uuid}`);
    } catch (err) {
      // Draft stays in the store (and `createdUuid` survives) — retryable.
      toastError(err);
    } finally {
      setBusy(null);
    }
  }

  const activeFormId = STEP_FORM_IDS[current];
  const isReview = current === TOTAL_STEPS - 1;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Mobile-only top bar (replaces AppShell chrome for this route) */}
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
          {t('dashboard:documents.wizard.title')}
        </h1>
      </header>

      {/* Desktop header */}
      <header className="hidden items-center justify-between border-b border-line bg-surface px-6 py-4 md:flex">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {t('dashboard:documents.wizard.title')}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('dashboard:documents.wizard.subtitle')}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
      </header>

      <div className="flex flex-1 flex-col md:px-6 md:py-8">
        <div className="flex w-full flex-1 flex-col md:rounded-xl md:border md:border-line md:bg-surface md:shadow-sm">
          <WizardStepper
            steps={STEPS}
            current={current}
            ariaLabelKey="dashboard:documents.wizard.stepper-label"
          />

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {current === 0 && <Step1Type />}
            {current === 1 && <Step2Content />}
            {current === 2 && <Step3Approvers />}
            {current === 3 && <Step4Review />}
          </div>

          <footer className="pb-safe sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 pt-4 md:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={prev}
              disabled={current === 0 || busy !== null}
            >
              {t('common:actions.previous')}
            </Button>
            {isReview ? (
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={busy !== null || !acting || createdUuid !== null}
                >
                  {busy === 'draft' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('dashboard:documents.wizard.submit-draft')}
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitForReview}
                  disabled={busy !== null || !acting}
                >
                  {busy === 'review' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {t('dashboard:documents.wizard.submit-review')}
                </Button>
              </div>
            ) : activeFormId ? (
              <Button form={activeFormId} type="submit">
                {t('common:actions.next')}
              </Button>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
