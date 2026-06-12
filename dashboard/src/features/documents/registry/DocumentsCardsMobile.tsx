import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/i18n/uz-locale';
import type { DocumentEntity } from '@/types/domain';

interface Props {
  rows: DocumentEntity[];
  /** Template uuid → nameUz; UPLOAD rows fall back to the "type-upload" label. */
  templateNames: Map<string, string>;
  /** Employee uuid → FIO. */
  employeeNames: Map<string, string>;
}

export default function DocumentsCardsMobile({ rows, templateNames, employeeNames }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);

  return (
    <ul className="space-y-2">
      {rows.map((doc) => (
        <li key={doc.uuid}>
          <button
            type="button"
            onClick={() => navigate(`/documents/${doc.uuid}`)}
            aria-label={doc.title}
            className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:bg-cream-warm/30"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {doc.number}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {doc.source === 'TEMPLATE'
                    ? (templateNames.get(doc.templateUuid ?? '') ?? '—')
                    : t('dashboard:documents.registry.type-upload')}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink">{doc.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {employeeNames.get(doc.creatorUuid) ?? '—'} · {formatDate(doc.createdAt)}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={doc.status} />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}
