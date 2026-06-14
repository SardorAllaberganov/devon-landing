import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/i18n/uz-locale';
import { cn } from '@/lib/utils';
import type { TaskComment } from '@/types/domain';

type CommentKind = TaskComment['kind'];

/** Badge colour per comment kind. */
const KIND_CLS: Record<CommentKind, string> = {
  CLARIFICATION_REQUEST: 'bg-warning-soft text-warning border-transparent',
  CLARIFICATION_REPLY: 'bg-brand-soft text-primary-deep border-transparent',
  RETURN_FEEDBACK: 'bg-warning-soft text-warning border-transparent',
  REJECT_REASON: 'bg-destructive/10 text-destructive border-transparent',
  NOTE: 'bg-muted text-muted-foreground border-transparent',
};

interface Props {
  comments: TaskComment[];
  authors: Record<string, string>;
}

/**
 * Vertical-rail comment thread (AssignmentTimeline / ApprovalSheetCard
 * vocabulary). Renders comments chronologically with kind badges.
 */
export default function TaskCommentThread({ comments, authors }: Props) {
  const { t } = useTranslation(['dashboard']);

  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('dashboard:tasks.detail.comments-empty')}
      </p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-line pl-5">
      {comments.map((c) => {
        const authorName = authors[c.authorUuid] ?? c.authorUuid;
        return (
          <li key={c.uuid} className="relative">
            {/* Rail dot */}
            <span
              className={cn(
                'absolute top-2 -left-[27px] h-3 w-3 rounded-full',
                c.kind === 'CLARIFICATION_REPLY'
                  ? 'bg-primary'
                  : c.kind === 'REJECT_REASON'
                    ? 'bg-destructive'
                    : 'border-2 border-line bg-surface',
              )}
              aria-hidden
            />

            <div className="rounded-lg border border-line bg-background/60 p-3">
              {/* Author + timestamp row */}
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium text-ink">{authorName}</span>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatRelative(c.createdAt)}
                </span>
              </div>

              {/* Kind badge */}
              <Badge
                variant="outline"
                className={cn('mb-2 text-xs font-medium', KIND_CLS[c.kind])}
              >
                {t(`dashboard:tasks.detail.comment-kind.${c.kind}`)}
              </Badge>

              {/* Body */}
              <p className="whitespace-pre-wrap text-sm text-body">{c.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
