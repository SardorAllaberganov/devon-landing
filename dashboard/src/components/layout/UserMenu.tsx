import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  LogOut,
  RefreshCcw,
  Settings as SettingsIcon,
  UserCircle2,
  UsersRound,
} from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { listEmployees, PERSONAS, resetAndSeed, type PersonaKey } from '@/lib/mock-backend';
import { useMediaQuery } from '@/lib/use-media-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const PERSONA_ORDER: PersonaKey[] = [
  'HR_ADMIN',
  'RAHBAR',
  'BOLIM_BOSHLIGI',
  'DEVONXONA',
  'XODIM',
];

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
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const user = useAuthStore((s) => s.user);
  const actingAsEmployeeUuid = useAuthStore((s) => s.actingAsEmployeeUuid);
  const logout = useAuthStore((s) => s.logout);
  const switchPov = useAuthStore((s) => s.switchPov);
  const resetPov = useAuthStore((s) => s.resetPov);

  // Persona FIOs for the submenu labels — resolved once from the seed.
  const [personaNames, setPersonaNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    void listEmployees()
      .then((employees) => {
        if (cancelled) return;
        const names: Record<string, string> = {};
        for (const key of PERSONA_ORDER) {
          const emp = employees.find((e) => e.uuid === PERSONAS[key]);
          if (emp) names[key] = emp.fullNameGenerated;
        }
        setPersonaNames(names);
      })
      .catch(() => {
        // Read flake — labels render without FIOs; reopen retries nothing,
        // which is fine for a demo.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  // The session user IS the HR_ADMIN persona, so `null` acting = HR_ADMIN.
  const selectedKey =
    PERSONA_ORDER.find((key) => PERSONAS[key] === actingAsEmployeeUuid) ?? 'HR_ADMIN';

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function onResetDemo() {
    await resetAndSeed();
    // Drop any active POV silently — the audit table was just wiped, so a
    // POV_SWITCHED entry here would be reseed noise, not user action.
    useAuthStore.setState({ actingAsEmployeeUuid: null });
    await useAuthStore.getState().refreshSessionUser();
    toast.success(t('dashboard:user-menu.reset-demo-toast'));
    setTimeout(() => window.location.reload(), 800);
  }

  async function onPovChange(value: string) {
    const key = value as PersonaKey;
    if (key === selectedKey) return;
    try {
      if (key === 'HR_ADMIN') {
        await resetPov();
      } else {
        await switchPov(PERSONAS[key]);
      }
      toast.success(
        t('dashboard:pov.switched', { persona: t(`dashboard:pov.persona.${key}`) }),
      );
    } catch {
      toast.error(t('common:errors.unknown'));
    }
  }

  const personaRadioGroup = (
    <DropdownMenuRadioGroup value={selectedKey} onValueChange={(v) => void onPovChange(v)}>
      {PERSONA_ORDER.map((key) => (
        <DropdownMenuRadioItem key={key} value={key} className="py-2.5">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {t(`dashboard:pov.persona.${key}`)}
            </span>
            {personaNames[key] && (
              <span className="truncate text-xs text-muted-foreground">
                {personaNames[key]}
              </span>
            )}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-xs font-semibold text-canvas">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-ink md:inline">
            {user.fullName.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isDesktop ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UsersRound className="mr-2 h-4 w-4" />
              {t('dashboard:pov.menu-label')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              {personaRadioGroup}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          // The user menu is a plain dropdown on every viewport (no mobile
          // sheet), so below md the personas render inline — a nested
          // submenu is too fiddly for touch at 360px.
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5" />
              {t('dashboard:pov.menu-label')}
            </DropdownMenuLabel>
            {personaRadioGroup}
          </>
        )}
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
