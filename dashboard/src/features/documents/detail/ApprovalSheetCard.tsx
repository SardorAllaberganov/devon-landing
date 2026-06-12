import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, MessageSquareText, X, type LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/i18n/uz-locale';
import { cn } from '@/lib/utils';
import type { ApprovalDecision, ApprovalStep, DocumentEntity, Employee } from '@/types/domain';

interface Props {
  document: DocumentEntity;
  /** All rounds, ordered by (round, order) — halted chains stay visible. */
  steps: ApprovalStep[];
  employees: Map<string, Employee>;
  positionNames: Map<string, string>;
}

const DECISION_BADGE: Record<
  ApprovalDecision,
  { icon: LucideIcon; cls: string; key: string }
> = {
  PENDING: {
    icon: Clock,
    cls: 'bg-muted text-muted-foreground',
    key: 'dashboard:documents.detail.approval-sheet.decision.PENDING',
  },
  APPROVED: {
    icon: Check,
    cls: 'bg-emerald-soft text-emerald-deep',
    key: 'dashboard:documents.detail.approval-sheet.decision.APPROVED',
  },
  APPROVED_WITH_COMMENT: {
    icon: MessageSquareText,
    cls: 'bg-emerald-soft text-emerald-deep',
    key: 'dashboard:documents.detail.approval-sheet.decision.APPROVED_WITH_COMMENT',
  },
  REJECTED: {
    icon: X,
    cls: 'bg-destructive/10 text-destructive',
    key: 'dashboard:documents.detail.approval-sheet.decision.REJECTED',
  },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * The auto-generated kelishuv varaqasi (§2.4) as a vertical timeline —
 * AssignmentTimeline rail pattern. Earlier (halted) rounds stay reachable
 * through the round selector; per BP-4 they are immutable history.
 */
export default function ApprovalSheetCard({
  document: doc,
  steps,
  employees,
  positionNames,
}: Props) {
  const { t } = useTranslation(['dashboard']);
  const [viewRound, setViewRound] = useState(doc.round);

  // A refetch after resubmit can bump doc.round — follow it. Adjust-during-
  // render pattern (react.dev "adjusting state when a prop changes").
  const [prevRound, setPrevRound] = useState(doc.round);
  if (prevRound !== doc.round) {
    setPrevRound(doc.round);
    setViewRound(doc.round);
  }

  const roundSteps = steps.filter((s) => s.round === viewRound);
  // Strictly-sequential chain: the actionable step is the first PENDING of
  // the *current* round while the document is IN_REVIEW.
  const currentStepUuid =
    doc.status === 'IN_REVIEW' && viewRound === doc.round
      ? roundSteps.find((s) => s.decision === 'PENDING')?.uuid
      : undefined;

  return (
    <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          {t('dashboard:documents.detail.approval-sheet.title')}
        </h2>
        {doc.round > 1 && (
          <Select value={String(viewRound)} onValueChange={(v) => setViewRound(Number(v))}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: doc.round }, (_, i) => i + 1).map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {t('dashboard:documents.detail.approval-sheet.round', { n: r })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!doc.requiresApproval ? (
        <p className="text-sm text-muted-foreground">
          {t('dashboard:documents.detail.approval-sheet.no-approval')}
        </p>
      ) : roundSteps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('dashboard:documents.detail.approval-sheet.empty-round')}
        </p>
      ) : (
        <ol className="relative ml-2 space-y-4 border-l-2 border-line pl-5">
          {roundSteps.map((step) => {
            const emp = employees.get(step.employeeUuid);
            const isCurrent = step.uuid === currentStepUuid;
            const badge = DECISION_BADGE[step.decision];
            const BadgeIcon = badge.icon;
            return (
              <li key={step.uuid} className="relative">
                <span
                  className={cn(
                    'absolute top-2 -left-[27px] h-3 w-3 rounded-full',
                    isCurrent
                      ? 'border-2 border-emerald bg-surface ring-4 ring-emerald-soft'
                      : step.decision === 'APPROVED' ||
                          step.decision === 'APPROVED_WITH_COMMENT'
                        ? 'bg-emerald'
                        : step.decision === 'REJECTED'
                          ? 'bg-destructive'
                          : 'border-2 border-line bg-surface',
                  )}
                  aria-hidden
                />
                <div className="rounded-lg border border-line bg-background/60 p-3">
                  <div className="flex items-start gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-emerald text-cream text-[10px] font-bold">
                        {emp ? initials(emp.fullNameGenerated) : step.order}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        <span className="mr-1 tabular-nums text-muted-foreground">
                          {step.order}.
                        </span>
                        {emp?.fullNameGenerated ?? '—'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {emp ? (positionNames.get(emp.positionId) ?? '') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('gap-1 border-transparent font-medium', badge.cls)}
                    >
                      <BadgeIcon className="h-3 w-3" aria-hidden />
                      {t(badge.key)}
                    </Badge>
                    {isCurrent && (
                      <span className="text-xs font-medium text-emerald">
                        {t('dashboard:documents.detail.approval-sheet.queue-here')}
                      </span>
                    )}
                    {step.decidedAt && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(step.decidedAt)}
                      </span>
                    )}
                  </div>
                  {step.comment && (
                    <p className="mt-2 text-xs italic text-muted-foreground">{step.comment}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
