import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useActingEmployee } from '@/lib/acting';
import { listTasks } from '@/lib/mock-backend';

/**
 * Home banner telling the acting persona about their pending tasks.
 *
 * - MANAGER (headedUnitUuids.length > 0): shows tasks assigned BY them that
 *   are waiting for review (`UNDER_REVIEW`). Uses `assigned-by-me` box.
 * - WORKER: shows their own open tasks (`NEW` or `IN_PROGRESS`). Uses
 *   `assigned-to-me` box.
 *
 * Null-rendered when the count is zero. Re-resolves on POV switch (actingUuid
 * in deps), matching the PendingApprovalsAlert pattern exactly.
 */
export default function PendingTasksAlert() {
  const { t } = useTranslation(['dashboard']);
  const acting = useActingEmployee();
  const actingUuid = acting?.employee.uuid;
  const isManager = (acting?.headedUnitUuids.length ?? 0) > 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!actingUuid) return;
    let cancelled = false;
    (async () => {
      try {
        if (isManager) {
          // Manager: tasks assigned BY me that are waiting for review.
          const items = await listTasks({ box: 'assigned-by-me' }, actingUuid);
          const pending = items.filter((t) => t.status === 'UNDER_REVIEW');
          if (!cancelled) setCount(pending.length);
        } else {
          // Worker: my own open tasks (NEW or IN_PROGRESS).
          const items = await listTasks({ box: 'assigned-to-me' }, actingUuid);
          const active = items.filter(
            (t) => t.status === 'NEW' || t.status === 'IN_PROGRESS',
          );
          if (!cancelled) setCount(active.length);
        }
      } catch {
        // Read flake — leave the previous count; next POV switch retries.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actingUuid, isManager]);

  if (count === 0) return null;

  const titleKey = isManager
    ? 'dashboard:home.tasks-alert.review'
    : 'dashboard:home.tasks-alert.active';

  return (
    <Alert className="border-primary/30 bg-surface-2 text-ink">
      <ListTodo className="h-4 w-4 text-primary" />
      <AlertTitle className="text-ink">{t(titleKey, { count })}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-ink/80 md:flex-row md:items-center md:justify-between">
        <span>{t('dashboard:home.tasks-alert.body')}</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-primary/40 bg-canvas text-ink hover:bg-surface-2"
        >
          <Link to="/tasks">{t('dashboard:home.tasks-alert.cta')}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
