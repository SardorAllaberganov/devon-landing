import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatBytes } from '@/lib/format';

import {
  MAX_ORDER_EXTRACT_SIZE_BYTES,
  ORDER_EXTRACT_EXTENSIONS,
  ORDER_EXTRACT_MIME_TYPES,
  type OrderExtractMeta,
} from './employee.schema';

interface Props {
  value: OrderExtractMeta | null;
  errorKey?: string;
  onChange: (meta: OrderExtractMeta | null) => void;
  onError: (messageKey: string) => void;
}

function isAllowed(file: File): boolean {
  if ((ORDER_EXTRACT_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Some browsers/OSes leave File.type empty — fall back to the extension.
  if (file.type === '') {
    const name = file.name.toLowerCase();
    return ORDER_EXTRACT_EXTENSIONS.some((ext) => name.endsWith(ext));
  }
  return false;
}

function mimeFor(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

export default function OrderExtractField({ value, errorKey, onChange, onError }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File | null) {
    if (!file) return;
    if (!isAllowed(file)) {
      onError('dashboard:employees.wizard.errors.order-extract-format');
      return;
    }
    if (file.size > MAX_ORDER_EXTRACT_SIZE_BYTES) {
      onError('dashboard:employees.wizard.errors.order-extract-too-large');
      return;
    }
    // Metadata only — the File object is dropped here; the mock backend never
    // stores bytes (same convention as ERI certificates).
    onChange({ fileName: file.name, fileSize: file.size, mimeType: mimeFor(file) });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="employmentOrderExtract">
        {t('dashboard:employees.wizard.fields.order-extract')}{' '}
        <span className="text-destructive">*</span>
      </Label>
      <input
        ref={inputRef}
        id="employmentOrderExtract"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          // Re-picking the same file must re-fire onChange.
          e.target.value = '';
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          <FileText className="h-4 w-4 shrink-0 text-emerald" />
          <span className="min-w-0 flex-1 truncate text-sm text-ink">
            {value.fileName}{' '}
            <span className="text-muted-foreground">({formatBytes(value.fileSize)})</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {t('dashboard:employees.wizard.actions.replace-file')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            aria-label={t('dashboard:employees.wizard.actions.remove-file')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t('dashboard:employees.wizard.actions.choose-file')}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {t('dashboard:employees.wizard.hints.order-extract')}
      </p>
      {errorKey && <p className="text-xs text-destructive">{t(errorKey)}</p>}
    </div>
  );
}
