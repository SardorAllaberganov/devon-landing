import { useTranslation } from 'react-i18next';
import { FileText, Printer, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/i18n/uz-locale';
import { formatBytes } from '@/lib/format';
import type { DocumentEntity } from '@/types/domain';

export interface SignatureStamp {
  signerName: string;
  signedAt: string;
  serialNumber: string;
}

interface Props {
  document: DocumentEntity;
  /** Rendered as the primary stamp block once the document is SIGNED. */
  stamp: SignatureStamp | null;
}

/**
 * The document body as a printable A4 sheet (TEMPLATE source) or a
 * metadata-only file card (UPLOAD source — no bytes stored, per master §17).
 * The `.print-area` class pairs with the `@media print` rules in index.css:
 * window.print() isolates this card — the demo's §2.2 "download as PDF"
 * substitute.
 */
export default function A4Preview({ document: doc, stamp }: Props) {
  const { t } = useTranslation(['dashboard']);

  if (doc.source === 'UPLOAD') {
    return (
      <section className="rounded-xl border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
            <FileText className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {doc.fileMeta?.fileName ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {doc.fileMeta ? formatBytes(doc.fileMeta.fileSize) : ''}
              {doc.fileMeta?.uploadedAt
                ? ` · ${formatDateTime(doc.fileMeta.uploadedAt)}`
                : ''}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t('dashboard:documents.detail.preview.upload-no-preview')}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          {t('dashboard:documents.detail.preview.print')}
        </Button>
      </div>

      {/* A4-proportioned sheet; content may stretch it taller than 210/297. */}
      <div className="print-area mx-auto flex w-full max-w-2xl flex-col rounded-lg border border-line bg-white p-6 shadow-sm aspect-[210/297] sm:p-10">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{doc.number}</span>
          <span>{formatDate(doc.createdAt)}</span>
        </div>

        <h2 className="mt-6 text-center font-display text-base font-semibold text-ink md:text-lg">
          {doc.title}
        </h2>

        <p className="mt-6 flex-1 text-sm leading-relaxed whitespace-pre-wrap text-ink">
          {doc.renderedBody ?? ''}
        </p>

        {stamp && (
          <div className="mt-8 rounded-md border-2 border-primary p-3 text-primary-deep">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              {t('dashboard:documents.detail.preview.stamp-line')}
            </p>
            <p className="mt-1.5 text-sm font-medium">{stamp.signerName}</p>
            <p className="mt-0.5 text-xs">
              {formatDateTime(stamp.signedAt)} ·{' '}
              <span className="font-mono break-all">{stamp.serialNumber}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
