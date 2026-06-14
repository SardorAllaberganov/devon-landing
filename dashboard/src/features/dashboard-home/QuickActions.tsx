import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardPlus,
  FilePlus2,
  FileText,
  KeySquare,
  MailPlus,
  Network,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { useActingEmployee } from '@/lib/acting';

interface Item {
  to: string;
  icon: LucideIcon;
  key: string;
  /** When set, the tile renders only if the acting persona has the role. */
  devonxonaOnly?: boolean;
  /** When set, the tile renders only if the acting persona is a manager. */
  managerOnly?: boolean;
}

const items: Item[] = [
  { to: '/employees/new', icon: UserPlus, key: 'dashboard:home.quick.new-employee' },
  { to: '/documents/new', icon: FilePlus2, key: 'dashboard:home.quick.new-document' },
  {
    to: '/letters/new',
    icon: MailPlus,
    key: 'dashboard:home.quick.register-letter',
    devonxonaOnly: true,
  },
  { to: '/units', icon: Network, key: 'dashboard:home.quick.manage-units' },
  { to: '/certificates', icon: KeySquare, key: 'dashboard:home.quick.upload-cert' },
  { to: '/audit', icon: FileText, key: 'dashboard:home.quick.view-audit' },
  {
    to: '/tasks/new',
    icon: ClipboardPlus,
    key: 'dashboard:home.quick.give-task',
    managerOnly: true,
  },
];

export default function QuickActions() {
  const { t } = useTranslation(['dashboard']);
  const acting = useActingEmployee();
  const isDevonxona = acting?.roles.includes('ROLE_DEVONXONA') ?? false;
  const isManager = (acting?.headedUnitUuids.length ?? 0) > 0;

  // Letter registration is a Devonxona action — hide the tile for everyone
  // else (the backend enforces `not-devonxona` regardless; this is the
  // "don't render controls irrelevant to the role" admin pattern).
  // "Topshiriq berish" is a manager action — hide for non-managers.
  const visible = items.filter(
    (it) => (!it.devonxonaOnly || isDevonxona) && (!it.managerOnly || isManager),
  );

  return (
    <Card className="p-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {visible.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="group flex flex-col items-center gap-2 rounded-md p-4 text-center transition-colors hover:bg-cream-warm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cream-deep text-emerald transition-colors group-hover:bg-emerald group-hover:text-cream">
              <it.icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium leading-tight text-ink md:text-sm">
              {t(it.key)}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
