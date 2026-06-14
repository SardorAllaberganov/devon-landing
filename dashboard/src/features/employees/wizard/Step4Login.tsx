import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { passwordStrength, step4Schema, type Step4Values } from './employee.schema';
import { useWizardStore } from './wizard-store';

const FORM_ID = 'wizard-step-4';

// Lookalike-safe pools: drop I/O/0/1/l so users typing the password from a
// printed handout don't confuse glyphs.
const POOL_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const POOL_LOWER = 'abcdefghjkmnpqrstuvwxyz';
const POOL_DIGIT = '23456789';
const POOL_SPECIAL = '!@#$%^&*';
const POOL_ALL = POOL_UPPER + POOL_LOWER + POOL_DIGIT + POOL_SPECIAL;

function secureRandomChar(pool: string): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return pool[buf[0]! % pool.length]!;
}

function generatePassword(length = 12): string {
  const required = [
    secureRandomChar(POOL_UPPER),
    secureRandomChar(POOL_LOWER),
    secureRandomChar(POOL_DIGIT),
    secureRandomChar(POOL_SPECIAL),
  ];
  const rest: string[] = [];
  for (let i = 0; i < length - required.length; i++) {
    rest.push(secureRandomChar(POOL_ALL));
  }
  const all = [...required, ...rest];
  // Fisher–Yates with crypto-random — Math.random would bias the shuffle.
  for (let i = all.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0]! % (i + 1);
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all.join('');
}

export default function Step4Login() {
  const { t } = useTranslation(['dashboard', 'common']);
  const data = useWizardStore((s) => s.data.step4);
  const corporateEmail = useWizardStore((s) => s.data.step2.corporateEmail);
  const setStep4 = useWizardStore((s) => s.setStep4);
  const next = useWizardStore((s) => s.next);

  // Derive a default login from the corporate email's local-part on first
  // mount. The user can edit it via the "rename" toggle below.
  const derivedLogin = useMemo(
    () => corporateEmail.split('@')[0] ?? '',
    [corporateEmail],
  );
  const initialLogin = data.login || derivedLogin;
  const initialPassword = data.password || generatePassword();

  const form = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      ...data,
      login: initialLogin,
      password: initialPassword,
    },
    mode: 'onTouched',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [editLogin, setEditLogin] = useState(false);

  // If the corporate email changes (user goes back to step 2), refresh the
  // derived login when the user hasn't manually edited it.
  useEffect(() => {
    if (!editLogin) {
      form.setValue('login', derivedLogin, { shouldDirty: true });
    }
  }, [derivedLogin, editLogin, form]);

  const password = form.watch('password');
  const strength = passwordStrength(password);
  const strengthPct = (strength / 4) * 100;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t('dashboard:employees.wizard.actions.copied'));
    } catch {
      toast.error(t('common:errors.unknown'));
    }
  }

  function onRegenerate() {
    form.setValue('password', generatePassword(), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function onSubmit(values: Step4Values) {
    setStep4(values);
    next();
  }

  const { errors } = form.formState;
  const notifySms = form.watch('notifySms');
  const notifyEmail = form.watch('notifyEmail');

  return (
    <form
      id={FORM_ID}
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login">
            {t('dashboard:employees.wizard.fields.login')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditLogin((v) => !v)}
          >
            {editLogin
              ? t('dashboard:employees.wizard.actions.use-derived-login')
              : t('common:actions.edit')}
          </Button>
        </div>
        <Input
          id="login"
          readOnly={!editLogin}
          className={cn(!editLogin && 'bg-surface-2/40')}
          {...form.register('login')}
        />
        {errors.login?.message && (
          <p className="text-xs text-destructive">
            {t(errors.login.message as string, { count: 3 })}
          </p>
        )}
        {!editLogin && (
          <p className="text-xs text-muted-foreground">
            {t('dashboard:employees.wizard.hints.derived-login')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {t('dashboard:employees.wizard.fields.password')}{' '}
          <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="pr-10 font-mono tabular-nums"
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? t('dashboard:employees.wizard.actions.hide-password')
                  : t('dashboard:employees.wizard.actions.show-password')
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCopy}
            aria-label={t('dashboard:employees.wizard.actions.copy-password')}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRegenerate}
            aria-label={t('dashboard:employees.wizard.actions.regenerate-password')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <Progress
            value={strengthPct}
            className={cn(
              'h-1.5',
              strength <= 1 && '[&>div]:bg-destructive',
              strength === 2 && '[&>div]:bg-warning',
              strength >= 3 && '[&>div]:bg-primary',
            )}
          />
          <p className="text-xs text-muted-foreground">
            {t(`dashboard:employees.wizard.password-strength.${strength}`)}
          </p>
        </div>

        {errors.password?.message && (
          <p className="text-xs text-destructive">
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      <fieldset className="space-y-3 rounded-lg border border-line bg-surface-2/30 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('dashboard:employees.wizard.notify.title')}
        </legend>
        <label
          htmlFor="notifySms"
          className="flex cursor-pointer items-center gap-3 text-sm"
        >
          <Checkbox
            id="notifySms"
            checked={notifySms}
            onCheckedChange={(c) =>
              form.setValue('notifySms', c === true, { shouldDirty: true })
            }
          />
          <span>{t('dashboard:employees.wizard.fields.notify-sms')}</span>
        </label>
        <label
          htmlFor="notifyEmail"
          className="flex cursor-pointer items-center gap-3 text-sm"
        >
          <Checkbox
            id="notifyEmail"
            checked={notifyEmail}
            onCheckedChange={(c) =>
              form.setValue('notifyEmail', c === true, { shouldDirty: true })
            }
          />
          <span>{t('dashboard:employees.wizard.fields.notify-email')}</span>
        </label>
      </fieldset>
    </form>
  );
}

export { FORM_ID as STEP4_FORM_ID };
