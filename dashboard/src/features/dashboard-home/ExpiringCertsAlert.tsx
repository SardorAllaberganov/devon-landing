import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { listCertificates } from '@/lib/mock-backend';

const HORIZON_DAYS = 30;
const HORIZON_MS = HORIZON_DAYS * 86_400_000;

export default function ExpiringCertsAlert() {
  const { t } = useTranslation(['dashboard']);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const certs = await listCertificates({ status: 'ACTIVE' });
      const horizon = Date.now() + HORIZON_MS;
      const expiring = certs.filter((c) => new Date(c.validTo).getTime() < horizon).length;
      if (!cancelled) setCount(expiring);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === 0) return null;

  return (
    <Alert className="border-cinnamon/30 bg-cinnamon-soft text-ink">
      <AlertCircle className="h-4 w-4 text-cinnamon" />
      <AlertTitle className="text-ink">
        {t('dashboard:home.expiring-alert.title', { count })}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-ink/80 md:flex-row md:items-center md:justify-between">
        <span>{t('dashboard:home.expiring-alert.body')}</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-cinnamon/40 bg-cream text-ink hover:bg-cream-deep"
        >
          <Link to="/certificates?filter=expiring">
            {t('dashboard:home.expiring-alert.cta')}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
