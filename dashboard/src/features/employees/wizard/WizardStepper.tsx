import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const steps = [
  { key: '1', titleKey: 'dashboard:employees.wizard.step-1.title' },
  { key: '2', titleKey: 'dashboard:employees.wizard.step-2.title' },
  { key: '3', titleKey: 'dashboard:employees.wizard.step-3.title' },
  { key: '4', titleKey: 'dashboard:employees.wizard.step-4.title' },
  { key: 'r', titleKey: 'dashboard:employees.wizard.review.title' },
] as const;

interface Props {
  current: number;
}

export default function WizardStepper({ current }: Props) {
  const { t } = useTranslation(['dashboard']);

  return (
    <nav aria-label={t('dashboard:employees.wizard.stepper-label')} className="border-b border-line">
      {/* Mobile: scrollable pill row */}
      <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-3 md:hidden">
        {steps.map((s, i) => (
          <li
            key={s.key}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-medium',
              i < current && 'border-emerald/30 bg-emerald-soft text-emerald-deep',
              i === current && 'border-emerald bg-emerald text-cream',
              i > current && 'border-line bg-cream-deep text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums',
                i === current ? 'bg-cream/25' : 'bg-cream/0',
              )}
            >
              {i < current ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="max-w-[8rem] truncate">{t(s.titleKey)}</span>
          </li>
        ))}
      </ol>

      {/* Desktop: numbered stepper across the band */}
      <ol className="hidden items-center gap-4 px-6 py-4 md:flex">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className="flex flex-1 items-center gap-3"
            aria-current={i === current ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                i < current && 'bg-emerald-soft text-emerald-deep',
                i === current && 'bg-emerald text-cream',
                i > current && 'bg-cream-deep text-muted-foreground',
              )}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'truncate text-sm font-medium',
                i === current ? 'text-ink' : 'text-muted-foreground',
              )}
            >
              {t(s.titleKey)}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
