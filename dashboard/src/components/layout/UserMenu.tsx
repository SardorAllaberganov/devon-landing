import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  LogOut,
  RefreshCcw,
  Settings as SettingsIcon,
  UserCircle2,
} from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function UserMenu() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function onResetDemo() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('devon.dashboard.'))
      .forEach((k) => localStorage.removeItem(k));
    toast.success(t('dashboard:user-menu.reset-demo-toast'));
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-emerald text-xs font-semibold text-cream">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-ink md:inline">
            {user.fullName.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <UserCircle2 className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onResetDemo}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t('dashboard:user-menu.reset-demo')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('common:actions.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
