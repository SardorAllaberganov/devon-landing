import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const from = params.get('from') ?? '/';

  const [email, setEmail] = useState('admin@devon.uz');
  const [password, setPassword] = useState('Demo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(t(`dashboard:login.errors.${result.reason}`));
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Brand pane — hidden on mobile, visible md+ */}
      <aside className="hidden md:flex md:w-3/5 lg:w-2/3 bg-cream-deep relative overflow-hidden">
        {/* Decorative compass-radial backdrop */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-32 h-[640px] w-[640px] text-emerald/[0.07]"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="200" cy="200" r="180" strokeWidth="0.8" />
          <circle cx="200" cy="200" r="140" strokeWidth="0.8" />
          <circle cx="200" cy="200" r="100" strokeWidth="0.8" />
          <circle cx="200" cy="200" r="60" strokeWidth="0.8" />
          <line x1="20" y1="200" x2="380" y2="200" strokeWidth="0.5" />
          <line x1="200" y1="20" x2="200" y2="380" strokeWidth="0.5" />
          <line x1="73" y1="73" x2="327" y2="327" strokeWidth="0.4" />
          <line x1="327" y1="73" x2="73" y2="327" strokeWidth="0.4" />
          <rect
            x="194"
            y="194"
            width="12"
            height="12"
            transform="rotate(45 200 200)"
            fill="currentColor"
            stroke="none"
            opacity="0.6"
          />
        </svg>

        {/* Top-right tiny corner mark */}
        <div className="pointer-events-none absolute top-10 right-10 flex items-center gap-2 text-cinnamon/80">
          <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-current" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
            {t('dashboard:login.brand-eyebrow')}
          </span>
        </div>

        {/* Centred content stack */}
        <div className="relative m-auto w-full max-w-xl px-12 py-16">
          <div className="mb-14 flex items-center gap-3">
            <span aria-hidden className="block h-3 w-3 rotate-45 bg-emerald" />
            <span className="font-black text-xl tracking-[0.16em] text-ink">DEVON</span>
          </div>

          <h2 className="mb-8 text-5xl font-extrabold tracking-tight leading-[1.05] text-ink">
            {t('dashboard:login.brand-headline-line-1')}
            <br />
            <span className="font-serif font-medium text-emerald">
              {t('dashboard:login.brand-headline-accent')}
            </span>{' '}
            {t('dashboard:login.brand-headline-line-2')}
          </h2>
          <p className="max-w-md text-body text-lg leading-relaxed">
            {t('dashboard:login.brand-subtitle')}
          </p>
        </div>

        {/* Slogan at bottom */}
        <div className="absolute bottom-10 left-12 flex items-center gap-3">
          <span aria-hidden className="block h-2 w-2 rotate-45 bg-emerald" />
          <span className="font-serif text-xl font-medium text-cinnamon">
            {t('dashboard:sidebar.footer-slogan')}
          </span>
        </div>
      </aside>

      {/* Form pane */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile-only header */}
          <div className="md:hidden mb-8 flex items-center gap-3 justify-center">
            <span className="block w-3 h-3 rotate-45 bg-emerald"></span>
            <span className="font-black text-xl tracking-[0.16em] text-ink">DEVON</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
            {t('dashboard:login.title')}
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {t('dashboard:login.subtitle')}
          </p>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t('dashboard:login.email-label')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder={t('dashboard:login.email-placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('dashboard:login.password-label')}</Label>
                <Link to="#" className="text-xs text-emerald hover:text-emerald-deep">
                  {t('dashboard:login.forgot-password')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('dashboard:login.password-placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                  className="h-12 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={busy}
                  aria-label={t(
                    showPassword ? 'dashboard:login.hide-password' : 'dashboard:login.show-password',
                  )}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                {t('dashboard:login.remember-me')}
              </Label>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={busy} className="w-full h-12 text-base">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t('dashboard:login.ctaLoading')}
                </>
              ) : (
                t('dashboard:login.cta')
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-cream-warm border border-line">
            <p className="text-xs font-semibold tracking-wider uppercase text-cinnamon mb-1">
              {t('dashboard:login.demo-hint-title')}
            </p>
            <p className="text-sm text-body font-mono">{t('dashboard:login.demo-hint-body')}</p>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            {t('dashboard:login.footer')}
          </p>
        </div>
      </section>
    </div>
  );
}
