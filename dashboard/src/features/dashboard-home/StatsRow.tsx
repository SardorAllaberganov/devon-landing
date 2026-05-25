import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Network, KeySquare, Clock } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { listEmployees, listUnits, listCertificates } from '@/lib/mock-backend';

interface StatData {
  emp: number;
  units: number;
  active: number;
  pending: number;
}

export default function StatsRow() {
  const { t } = useTranslation(['dashboard']);
  const [data, setData] = useState<StatData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emp, units, certs] = await Promise.all([
        listEmployees(),
        listUnits(),
        listCertificates(),
      ]);
      if (cancelled) return;
      setData({
        emp: emp.filter((e) => e.status === 'ACTIVE').length,
        units: units.filter((u) => u.status === 'ACTIVE').length,
        active: certs.filter((c) => c.status === 'ACTIVE').length,
        pending: certs.filter((c) => c.status === 'PENDING_APPROVAL').length,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label={t('dashboard:home.stats.employees')}
        value={data.emp}
        tone="emerald"
      />
      <StatCard icon={Network} label={t('dashboard:home.stats.units')} value={data.units} />
      <StatCard
        icon={KeySquare}
        label={t('dashboard:home.stats.active-certs')}
        value={data.active}
        tone="signal"
      />
      <StatCard
        icon={Clock}
        label={t('dashboard:home.stats.pending-approvals')}
        value={data.pending}
        tone="cinnamon"
      />
    </div>
  );
}
