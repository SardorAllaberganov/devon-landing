import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

export default function ErrorState({ title, body, onRetry }: Props) {
  const { t } = useTranslation(['common']);
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title ?? t('common:errors.unknown')}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          {t('common:actions.reset')}
        </Button>
      )}
    </div>
  );
}
