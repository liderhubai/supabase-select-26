import { ago, cn } from '@/lib/utils'
import type { FeedbackItem } from './data'

const headCell = 'text-[13px] text-muted-foreground'

/** Markdown reply flattened to one paragraph for the table preview. */
const plainText = (md: string | undefined) =>
  (md ?? '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:[-*•]|#+|>)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'error'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-muted-foreground',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  error: 'bg-error-soft text-error',
}

export const feedbackStatus: Record<FeedbackItem['status'], { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'info' },
  processing: { label: 'Awaiting approval', tone: 'warning' },
  processed: { label: 'Approved', tone: 'success' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
}

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={cn('inline-flex h-[26px] shrink-0 items-center gap-[6px] rounded-full px-[10px] text-[12px] font-medium whitespace-nowrap', toneClass[tone])}>
      <span className="h-[6px] w-[6px] rounded-full bg-current" />
      {label}
    </span>
  )
}

export function FeedbackTable({ items, agentName, onOpen }: { items: FeedbackItem[]; agentName: string; onOpen: (id: string) => void }) {
  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto rounded-[16px] outline outline-1 -outline-offset-1 outline-border-strong">
      <div className="sticky top-0 z-10 flex h-[48px] w-full shrink-0 items-center gap-[24px] border-b border-border-strong bg-background px-[20px]">
        <span className={cn(headCell, 'w-[100px]')}>Feedback</span>
        <span className={cn(headCell, 'w-[300px]')}>Context message</span>
        <span className={cn(headCell, 'flex-1')}>Input sent</span>
        <span className={cn(headCell, 'w-[140px]')}>Agent</span>
        <span className={cn(headCell, 'w-[150px]')}>Status</span>
      </div>
      {items.map((f, i) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onOpen(f.id)}
          className="flex w-full shrink-0 items-start gap-[24px] border-b border-border px-[20px] py-[16px] text-left transition-colors last:border-b-0 hover:bg-surface"
        >
          <div className="flex w-[100px] shrink-0 flex-col gap-[2px] text-[14px] leading-[1.4]">
            <span className="font-medium text-foreground">#{items.length - i}</span>
            <span className="text-muted-foreground">{ago(f.created_at)}</span>
            <span className="truncate text-muted-foreground">{f.origin === 'auto' ? 'auto · low confidence' : `by ${f.reviewer_name}`}</span>
          </div>
          <div className="w-[300px] shrink-0">
            <div className="w-fit max-w-full rounded-[10px] bg-surface-raised px-[12px] py-[8px]" title={f.messages?.content}>
              <p className="line-clamp-3 text-[13px] leading-[1.45] text-foreground">{plainText(f.messages?.content) || '—'}</p>
            </div>
          </div>
          <p className="min-w-0 flex-1 text-[14px] leading-[1.4] whitespace-pre-line text-foreground">
            {f.comment ? `“${f.comment}”` : <span className="text-subtle-foreground">{f.rating === 'positive' ? '👍' : '👎'} No comment</span>}
          </p>
          <span className="w-[140px] shrink-0 truncate text-[14px] leading-[1.4] text-foreground">{agentName}</span>
          <div className="w-[150px] shrink-0">
            <StatusPill {...feedbackStatus[f.status]} />
          </div>
        </button>
      ))}
    </div>
  )
}
