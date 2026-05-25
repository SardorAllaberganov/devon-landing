import { format as fnsFormat, formatDistanceToNow as fnsDistance } from 'date-fns';
import type { Locale } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import i18n from './index';

const localeMap: Record<string, Locale> = { uz, ru, en: enUS };

function resolveLocale(): Locale {
  return localeMap[i18n.language] ?? uz;
}

export function formatDate(date: Date | string, pattern = 'dd.MM.yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const effectivePattern = i18n.language === 'en' ? 'MMM d, yyyy' : pattern;
  return fnsFormat(d, effectivePattern, { locale: resolveLocale() });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pattern = i18n.language === 'en' ? "MMM d, yyyy 'at' h:mm a" : 'dd.MM.yyyy HH:mm';
  return fnsFormat(d, pattern, { locale: resolveLocale() });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return fnsDistance(d, { addSuffix: true, locale: resolveLocale() });
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  const localeCode = i18n.language === 'en' ? 'en-US' : `${i18n.language}-UZ`;
  return new Intl.NumberFormat(localeCode, options).format(n);
}
