import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({ value, onChange, placeholder, debounceMs = 300 }: Props) {
  const { t } = useTranslation(['common']);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const id = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(id);
  }, [local, value, debounceMs, onChange]);

  const resolvedPlaceholder = placeholder ?? t('common:labels.search-placeholder');

  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
        className="bg-surface pl-9 pr-9"
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          aria-label={t('common:actions.reset')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
