import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/use-media-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Desktop dialog width — falls through to `Dialog`'s `sm:max-w-lg` default if omitted. */
  size?: string;
}

export default function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
}: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={size ?? 'sm:max-w-lg'}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile sheet pattern (matches UnitDetailsSheet's right-side variant):
  // strip SheetContent's default gap+padding, then own each band's padding
  // explicitly with borders between them. The prior `-mx-6 px-6` "bleed-edge"
  // trick assumed SheetContent had px-6 baked in — it doesn't, so the body
  // extended 24px outside the visible panel and read as paddingless on mobile.
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92vh] flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-line p-6 text-left">
          <SheetTitle className="pr-10">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <SheetFooter className="pb-safe border-t border-line bg-background px-6 pt-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
