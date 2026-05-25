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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[92vh] flex-col rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="-mx-6 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <SheetFooter className="pb-safe sticky bottom-0 -mx-6 border-t border-line bg-background px-6 pt-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
