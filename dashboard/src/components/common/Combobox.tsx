import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerClassName?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Single-select searchable combobox. Renders as a Popover on desktop (≥md)
 * and as a bottom-Sheet on mobile so the on-screen keyboard doesn't crash
 * into the listbox. List itself is a shadcn Command — built-in fuzzy match.
 */
export default function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  triggerClassName,
  disabled,
  id,
}: Props) {
  const { t } = useTranslation(['common']);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const trigger = (
    <Button
      type="button"
      id={id}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        'w-full justify-between font-normal',
        !selected && 'text-muted-foreground',
        triggerClassName,
      )}
    >
      <span className="truncate">
        {selected?.label ?? placeholder ?? t('common:labels.select')}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const list = (
    <Command>
      <CommandInput
        placeholder={searchPlaceholder ?? t('common:labels.search-placeholder')}
      />
      <CommandList>
        <CommandEmpty>{emptyMessage ?? t('common:labels.none')}</CommandEmpty>
        <CommandGroup>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              value={`${opt.label} ${opt.sublabel ?? ''}`}
              onSelect={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  value === opt.value ? 'opacity-100' : 'opacity-0',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate">{opt.label}</p>
                {opt.sublabel && (
                  <p className="truncate text-xs text-muted-foreground">
                    {opt.sublabel}
                  </p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
        >
          {list}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/*
        SheetTrigger asChild merges its trigger behavior (click handler, ref,
        aria attributes) into the Button instead of rendering its own
        wrapper <button>. The previous version used a manual
        `<button className="contents">` wrapper around the Button —
        <button> inside <button> is a hydration error per HTML spec.
      */}
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex h-[80vh] flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-line p-4 text-left">
          <SheetTitle className="pr-10 text-base">
            {placeholder ?? t('common:labels.select')}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">{list}</div>
      </SheetContent>
    </Sheet>
  );
}
