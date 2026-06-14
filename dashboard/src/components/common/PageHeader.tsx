import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className }: Props) {
  return (
    <div className={cn('mb-6 md:mb-8', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
