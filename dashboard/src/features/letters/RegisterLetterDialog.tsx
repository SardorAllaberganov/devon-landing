import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatBytes } from '@/lib/format';
import {
  LetterValidationError,
  MockNetworkError,
  registerIncomingLetter,
} from '@/lib/mock-backend';
import type { LetterChannel } from '@/types/domain';

import {
  MAX_SCAN_SIZE_BYTES,
  SCAN_EXTENSIONS,
  SCAN_MIME_TYPES,
  makeRegisterLetterDefaults,
  registerLetterSchema,
  todayIso,
  type RegisterLetterFormValues,
  type ScanMeta,
} from './letter.schema';

const FORM_ID = 'register-letter-form';

const CHANNELS: LetterChannel[] = ['POCHTA', 'EMAIL', 'KURYER', 'QOGOZ'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Acting employee uuid (the Devonxona persona) — policy re-validates. */
  actorUuid: string;
  onDone: () => void;
}

function scanAllowed(file: File): boolean {
  if ((SCAN_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Some browsers/OSes leave File.type empty — fall back to the extension.
  if (file.type === '') {
    const name = file.name.toLowerCase();
    return SCAN_EXTENSIONS.some((ext) => name.endsWith(ext));
  }
  return false;
}

function scanMime(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

export default function RegisterLetterDialog({ open, onOpenChange, actorUuid, onDone }: Props) {
  const { t } = useTranslation(['dashboard', 'common']);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scan, setScan] = useState<ScanMeta | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterLetterFormValues>({
    resolver: zodResolver(registerLetterSchema),
    defaultValues: makeRegisterLetterDefaults(),
  });

  // Fresh form per open — receivedAt defaults to *today's* today, discarded
  // drafts don't leak.
  useEffect(() => {
    if (open) {
      reset(makeRegisterLetterDefaults());
      setScan(null);
      setScanError(null);
      setBusy(false);
    }
  }, [open, reset]);

  const channel = watch('channel');
  const requiresSignature = watch('requiresSignature');

  function onPickScan(file: File | null) {
    if (!file) return;
    if (!scanAllowed(file)) {
      setScanError(t('dashboard:letters.register.scan-format'));
      return;
    }
    if (file.size > MAX_SCAN_SIZE_BYTES) {
      setScanError(t('dashboard:letters.register.scan-too-large'));
      return;
    }
    setScanError(null);
    // Metadata only — the File object is dropped here; the mock backend never
    // stores bytes (employee order-extract convention).
    setScan({ fileName: file.name, fileSize: file.size, mimeType: scanMime(file) });
  }

  async function onValid(values: RegisterLetterFormValues) {
    try {
      setBusy(true);
      const letter = await registerIncomingLetter(
        {
          externalOrg: values.externalOrg.trim(),
          subject: values.subject.trim(),
          channel: values.channel,
          receivedAt: values.receivedAt,
          deadline: values.deadline || undefined,
          requiresSignature: values.requiresSignature,
          fileMeta: scan ?? undefined,
        },
        actorUuid,
      );
      toast.success(t('dashboard:letters.register.success', { number: letter.number }));
      onOpenChange(false);
      onDone();
    } catch (err) {
      if (err instanceof LetterValidationError) {
        toast.error(t(`dashboard:letters.errors.${err.code}`));
      } else if (err instanceof MockNetworkError) {
        toast.error(t('common:errors.network'));
      } else {
        toast.error(t('common:errors.unknown'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('dashboard:letters.register.title')}
      description={t('dashboard:letters.register.description')}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy}>
            {t('dashboard:letters.register.submit')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="letter-org">
            {t('dashboard:letters.register.field-org')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="letter-org"
            {...register('externalOrg')}
            placeholder={t('dashboard:letters.register.org-placeholder')}
          />
          {errors.externalOrg?.message && (
            <p className="text-xs text-destructive">{t(errors.externalOrg.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter-subject">
            {t('dashboard:letters.register.field-subject')}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="letter-subject"
            {...register('subject')}
            placeholder={t('dashboard:letters.register.subject-placeholder')}
          />
          {errors.subject?.message && (
            <p className="text-xs text-destructive">{t(errors.subject.message)}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('dashboard:letters.register.field-channel')}</Label>
            <Select
              value={channel}
              onValueChange={(v) =>
                setValue('channel', v as LetterChannel, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`dashboard:letters.channels.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="letter-received-at">
              {t('dashboard:letters.register.field-received-at')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="letter-received-at"
              type="date"
              max={todayIso()}
              {...register('receivedAt')}
            />
            {errors.receivedAt?.message && (
              <p className="text-xs text-destructive">{t(errors.receivedAt.message)}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter-deadline">
            {t('dashboard:letters.register.field-deadline')}
          </Label>
          <Input id="letter-deadline" type="date" min={todayIso()} {...register('deadline')} />
          <p className="text-xs text-muted-foreground">
            {t('dashboard:letters.register.deadline-hint')}
          </p>
          {errors.deadline?.message && (
            <p className="text-xs text-destructive">{t(errors.deadline.message)}</p>
          )}
        </div>

        <label className="flex items-center gap-3">
          <Checkbox
            checked={requiresSignature}
            onCheckedChange={(v) => setValue('requiresSignature', v === true)}
          />
          <span className="text-sm text-ink">
            {t('dashboard:letters.register.field-requires-signature')}
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="letter-scan">{t('dashboard:letters.register.field-scan')}</Label>
          <input
            ref={fileRef}
            id="letter-scan"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              onPickScan(e.target.files?.[0] ?? null);
              // Re-picking the same file must re-fire onChange.
              e.target.value = '';
            }}
          />
          {scan ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-emerald" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {scan.fileName}{' '}
                <span className="text-muted-foreground">({formatBytes(scan.fileSize)})</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                {t('dashboard:letters.register.replace-file')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setScan(null)}
                aria-label={t('dashboard:letters.register.remove-file')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {t('dashboard:letters.register.choose-file')}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {t('dashboard:letters.register.scan-hint')}
          </p>
          {scanError && <p className="text-xs text-destructive">{scanError}</p>}
        </div>
      </form>
    </ResponsiveDialog>
  );
}
