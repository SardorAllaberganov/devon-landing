import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusBadge from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/i18n/uz-locale';
import type { DocumentEntity } from '@/types/domain';

interface Props {
  rows: DocumentEntity[];
  /** Template uuid → nameUz; UPLOAD rows fall back to the "type-upload" label. */
  templateNames: Map<string, string>;
  /** Employee uuid → FIO. */
  employeeNames: Map<string, string>;
}

export default function DocumentsTable({ rows, templateNames, employeeNames }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader className="bg-surface-2/40">
          <TableRow>
            <TableHead>{t('dashboard:documents.registry.col-number')}</TableHead>
            <TableHead>{t('dashboard:documents.registry.col-title')}</TableHead>
            <TableHead>{t('dashboard:documents.registry.col-type')}</TableHead>
            <TableHead>{t('dashboard:documents.registry.col-creator')}</TableHead>
            <TableHead>{t('dashboard:documents.registry.col-status')}</TableHead>
            <TableHead>{t('dashboard:documents.registry.col-date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((doc) => (
            <TableRow
              key={doc.uuid}
              className="cursor-pointer hover:bg-surface-2/30"
              onClick={() => navigate(`/documents/${doc.uuid}`)}
            >
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                {doc.number}
              </TableCell>
              <TableCell>
                <span className="block max-w-[36ch] truncate text-sm font-medium text-ink">
                  {doc.title}
                </span>
              </TableCell>
              <TableCell className="text-sm text-body">
                <span className="block max-w-[20ch] truncate">
                  {doc.source === 'TEMPLATE'
                    ? (templateNames.get(doc.templateUuid ?? '') ?? '—')
                    : t('dashboard:documents.registry.type-upload')}
                </span>
              </TableCell>
              <TableCell className="text-sm text-body">
                <span className="block max-w-[24ch] truncate">
                  {employeeNames.get(doc.creatorUuid) ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={doc.status} />
              </TableCell>
              <TableCell className="text-sm tabular-nums text-muted-foreground">
                {formatDate(doc.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
