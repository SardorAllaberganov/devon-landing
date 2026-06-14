import { Loader2 } from 'lucide-react';

import LoadingState from '@/components/common/LoadingState';

/**
 * Suspense fallbacks for lazy-loaded route chunks.
 *
 * `RouteFallback` is for in-shell routes (wrapped in AppShell): the sidebar +
 * topbar stay mounted and only the content area shows a skeleton while the
 * page chunk is fetched.
 *
 * `FullPageFallback` is for routes that render their own chrome (the wizards,
 * transfer, upload, and the public login page) — a centered spinner.
 */
export function RouteFallback() {
  return <LoadingState rows={6} />;
}

export function FullPageFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="size-8 animate-spin text-muted-foreground motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  );
}
