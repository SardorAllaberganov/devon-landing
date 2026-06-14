import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'warning' | 'neutral' | 'destructive';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: string; trend: 'up' | 'down' | 'flat' };
  tone?: Tone;
  /** When set, the whole card becomes a router link to this route. */
  to?: string;
  className?: string;
}

const toneMap: Record<Tone, string> = {
  default: 'bg-surface',
  primary: 'bg-primary text-canvas',
  warning: 'bg-warning text-canvas',
  neutral: 'bg-surface-2 text-ink',
  // Calm-not-alarming: soft tint + destructive accent on icon/value, never a
  // solid red card (admin home should signal, not shout — see admin patterns).
  destructive: 'bg-destructive/10 border-destructive/30',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'default',
  to,
  className,
}: Props) {
  const dark = tone === 'primary' || tone === 'warning';
  const card = (
    <Card
      className={cn(
        'flex h-full flex-col gap-3 border p-5 md:p-6',
        toneMap[tone],
        to &&
          'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            dark ? 'text-canvas/70' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            'rounded-md p-1.5',
            dark
              ? 'bg-canvas/15 text-canvas'
              : tone === 'destructive'
                ? 'bg-destructive/15 text-destructive'
                : 'bg-surface-2 text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p
          className={cn(
            'font-heading text-3xl font-extrabold leading-none tracking-tight md:text-4xl',
            dark ? 'text-canvas' : tone === 'destructive' ? 'text-destructive' : 'text-ink',
          )}
        >
          {value}
        </p>
        {delta && (
          <p
            className={cn(
              'mt-2 text-xs',
              dark ? 'text-canvas/70' : 'text-muted-foreground',
            )}
          >
            {delta.value}
          </p>
        )}
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-xl">
        {card}
      </Link>
    );
  }
  return card;
}
