import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  KeySquare,
  LayoutDashboard,
  Network,
  ScrollText,
  UserCircle2,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
}

const managementNav: NavItem[] = [
  { to: '/', labelKey: 'dashboard:sidebar.nav-home', icon: LayoutDashboard },
  { to: '/units', labelKey: 'dashboard:sidebar.nav-units', icon: Network },
  { to: '/employees', labelKey: 'dashboard:sidebar.nav-employees', icon: Users },
  { to: '/certificates', labelKey: 'dashboard:sidebar.nav-certificates', icon: KeySquare },
  { to: '/audit', labelKey: 'dashboard:sidebar.nav-audit', icon: ScrollText },
];

const personalNav: NavItem[] = [
  { to: '/profile', labelKey: 'dashboard:sidebar.nav-profile', icon: UserCircle2 },
];

interface Props {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: Props) {
  const { t } = useTranslation(['dashboard']);

  return (
    <nav className="flex h-full flex-col bg-cream-deep border-r border-line">
      <div className="flex h-16 items-center gap-3 border-b border-line/60 px-6">
        <span aria-hidden className="block h-3 w-3 rotate-45 bg-emerald" />
        <span className="font-black text-lg tracking-[0.16em] text-ink">DEVON</span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavSection
          title={t('dashboard:sidebar.section-management')}
          items={managementNav}
          onNavigate={onNavigate}
        />
        <NavSection
          title={t('dashboard:sidebar.section-personal')}
          items={personalNav}
          onNavigate={onNavigate}
        />
      </div>

      <div className="border-t border-line/60 px-6 py-4">
        <p className="font-serif italic text-sm text-cinnamon">
          {t('dashboard:sidebar.footer-slogan')}
        </p>
      </div>
    </nav>
  );
}

interface SectionProps {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
}

function NavSection({ title, items, onNavigate }: SectionProps) {
  const { t } = useTranslation(['dashboard']);
  return (
    <div>
      <p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald text-cream'
                    : 'text-body hover:bg-cream/60 hover:text-ink',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
