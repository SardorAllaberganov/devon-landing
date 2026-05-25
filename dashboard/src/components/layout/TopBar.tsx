import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MobileNavTrigger from './MobileNavTrigger';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopBar() {
  const { t } = useTranslation(['dashboard']);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <MobileNavTrigger />

        {/* Compact logo on mobile/tablet (sidebar wordmark is hidden there) */}
        <div className="flex items-center gap-2 lg:hidden">
          <span aria-hidden className="block h-2.5 w-2.5 rotate-45 bg-emerald" />
          <span className="font-black text-sm tracking-[0.16em] text-ink">DEVON</span>
        </div>

        {/* Search — hidden on mobile portrait, visible from sm+ */}
        <div className="hidden flex-1 sm:flex sm:max-w-md">
          <div className="relative w-full">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={t('dashboard:topbar.search-placeholder')}
              className="h-10 bg-surface pl-9"
              aria-label={t('dashboard:topbar.search-placeholder')}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('dashboard:topbar.notifications')}
              >
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{t('dashboard:topbar.notifications')}</DropdownMenuLabel>
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('dashboard:topbar.no-notifications')}
              </p>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
