import { useTranslation } from 'react-i18next';

import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/stores/useAuthStore';

import ExpiringCertsAlert from './ExpiringCertsAlert';
import PendingApprovalsAlert from './PendingApprovalsAlert';
import PendingTasksAlert from './PendingTasksAlert';
import QuickActions from './QuickActions';
import RecentActivityCard from './RecentActivityCard';
import StatsRow from './StatsRow';

/**
 * Seeded FIOs are stored "Surname Given Patronymic" — splitting on space and
 * taking index 1 produces the given name. Fallback to the whole name if the
 * convention ever drifts.
 */
function firstNameOf(fullName: string | undefined): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : parts[0];
}

export default function DashboardHome() {
  const { t } = useTranslation(['dashboard']);
  const user = useAuthStore((s) => s.user);
  const firstName = firstNameOf(user?.fullName);

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title={t('dashboard:home.greeting', { name: firstName })}
        subtitle={t('dashboard:home.subtitle')}
      />
      <PendingApprovalsAlert />
      <PendingTasksAlert />
      <ExpiringCertsAlert />
      <StatsRow />
      <QuickActions />
      <RecentActivityCard />
    </div>
  );
}
