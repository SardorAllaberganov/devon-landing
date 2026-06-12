import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FilePlus2,
  FileText,
  KeySquare,
  Network,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

interface Item {
  to: string;
  icon: LucideIcon;
  key: string;
}

const items: Item[] = [
  { to: '/employees/new', icon: UserPlus, key: 'dashboard:home.quick.new-employee' },
  { to: '/documents/new', icon: FilePlus2, key: 'dashboard:home.quick.new-document' },
  { to: '/units', icon: Network, key: 'dashboard:home.quick.manage-units' },
  { to: '/certificates', icon: KeySquare, key: 'dashboard:home.quick.upload-cert' },
  { to: '/audit', icon: FileText, key: 'dashboard:home.quick.view-audit' },
];

export default function QuickActions() {
  const { t } = useTranslation(['dashboard']);
  return (
    <Card className="p-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
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
