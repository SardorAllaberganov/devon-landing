import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'emerald' | 'cinnamon' | 'signal';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: string; trend: 'up' | 'down' | 'flat' };
  tone?: Tone;
  className?: string;
}

const toneMap: Record<Tone, string> = {
  default: 'bg-surface',
  emerald: 'bg-emerald text-cream',
  cinnamon: 'bg-cinnamon text-cream',
  signal: 'bg-cream-deep text-ink',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'default',
  className,
}: Props) {
  const dark = tone === 'emerald' || tone === 'cinnamon';
  return (
    <Card className={cn('flex flex-col gap-3 border p-5 md:p-6', toneMap[tone], className)}>
      <div className="flex items-start justify-between">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            dark ? 'text-cream/70' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            'rounded-md p-1.5',
            dark ? 'bg-cream/15 text-cream' : 'bg-cream-deep text-emerald',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p
          className={cn(
            'text-3xl font-extrabold leading-none tracking-tight md:text-4xl',
            dark ? 'text-cream' : 'text-ink',
          )}
        >
          {value}
        </p>
        {delta && (
          <p
            className={cn(
              'mt-2 text-xs',
              dark ? 'text-cream/70' : 'text-muted-foreground',
            )}
          >
            {delta.value}
          </p>
        )}
      </div>
    </Card>
  );
}
