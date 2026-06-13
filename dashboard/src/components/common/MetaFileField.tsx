import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatBytes } from '@/lib/format';

/**
 * Metadata-only file attachment — the picked `File` object is dropped at
 * selection time; only its name/size/mime are kept. The mock backend never
 * stores bytes (same convention as ERI certificates). Shared by every
 * "certified document" attachment in the demo: the hiring-order extract
 * ("buyruqdan ko'chirma"), the job instruction ("lavozim yo'riqnomasi"), and
 * the termination-order extract.
 */
export interface FileMetaInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Module-local file constraints (PDF/JPG/PNG, 10 MB). Kept un-exported so this
// file only exports a component + a type — the codebase's fast-refresh rule.
const MAX_META_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const META_FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const META_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;
const META_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png';

interface Props {
  id: string;
  /** Fully-qualified i18n key for the field label. */
  labelKey: string;
  /** Fully-qualified i18n key for the helper text below the control. */
  hintKey: string;
  value: FileMetaInput | null;
  onChange: (meta: FileMetaInput | null) => void;
  /** Receives a fully-qualified i18n key when a pick fails validation. */
  onError: (messageKey: string) => void;
  errorKey?: string;
  /** Renders the `*` marker; defaults to required (every current call site is). */
  required?: boolean;
}

function isAllowed(file: File): boolean {
  if ((META_FILE_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Some browsers/OSes leave File.type empty — fall back to the extension.
  if (file.type === '') {
    const name = file.name.toLowerCase();
    return META_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
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

export default function MetaFileField({
  id,
  labelKey,
  hintKey,
  value,
  onChange,
  onError,
  errorKey,
  required = true,
}: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(file: File | null) {
    if (!file) return;
    if (!isAllowed(file)) {
      onError('common:errors.file-format');
      return;
    }
    if (file.size > MAX_META_FILE_SIZE_BYTES) {
      onError('common:errors.file-too-large');
      return;
    }
    // Metadata only — the File object is dropped here; the mock backend never
    // stores bytes (same convention as ERI certificates).
    onChange({ fileName: file.name, fileSize: file.size, mimeType: mimeFor(file) });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {t(labelKey)}{' '}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={META_FILE_ACCEPT}
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
            {t('common:actions.replace-file')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(null)}
            aria-label={t('common:actions.remove-file')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t('common:actions.choose-file')}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
      {errorKey && <p className="text-xs text-destructive">{t(errorKey)}</p>}
    </div>
  );
}
