import Link from 'next/link'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { lastUserMessage } from '@/lib/queries'
import { ago, cn, formatMs } from '@/lib/utils'
import { ConfidenceBadge } from '@/components/app/ConfidenceBadge'
import { feedbackOf, type ExecutionRow } from './data'

const headCell = 'font-mono text-[11px] tracking-[0.6px] text-subtle-foreground'

export function ExecutionsTable({ rows }: { rows: ExecutionRow[] }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 flex h-[36px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[20px]">
        <span className={cn(headCell, 'flex-1')}>MESSAGE</span>
        <span className={cn(headCell, 'w-[120px]')}>CHAT</span>
        <span className={cn(headCell, 'w-[96px]')}>STATUS</span>
        <span className={cn(headCell, 'w-[88px]')}>CONFIDENCE</span>
        <span className={cn(headCell, 'w-[72px]')}>DURATION</span>
        <span className={cn(headCell, 'w-[110px]')}>WHEN</span>
        <span className={cn(headCell, 'w-[64px]')}>FEEDBACK</span>
      </div>
      {!rows.length && <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">No executions here yet.</span>}
      {rows.map((r) => {
        const feedback = feedbackOf(r)
        const confidence = r.messages[0]?.confidence ?? null
        return (
          <Link
            key={r.id}
            href={`/app/executions/${r.id}`}
            className={cn(
              'flex h-[54px] w-full shrink-0 items-center gap-[16px] border-b border-border px-[20px] transition-colors hover:bg-surface-raised',
              r.error && 'bg-surface-raised',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[14px] leading-[1.2] font-medium text-foreground">{lastUserMessage(r.input) || '—'}</span>
              <span className="font-mono text-[11px] leading-[1.2] text-subtle-foreground">{r.id.slice(0, 8)} · Customer (simulation)</span>
            </div>
            <div className="flex w-[120px] min-w-0">
              <span className="flex h-[22px] items-center truncate rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                {r.conversations.customer_label}
              </span>
            </div>
            <div className="flex w-[96px]">
              <span className={cn('flex h-[24px] items-center gap-[6px] rounded-full px-[10px]', r.error ? 'bg-error-soft' : 'bg-success-soft')}>
                <span className={cn('h-[6px] w-[6px] rounded-full', r.error ? 'bg-error' : 'bg-success')} />
                <span className={cn('text-[12px] font-medium', r.error ? 'text-error' : 'text-success')}>{r.error ? 'Error' : 'Success'}</span>
              </span>
            </div>
            <div className="flex w-[88px]">
              <ConfidenceBadge score={confidence} />
            </div>
            <span className={cn('w-[72px] font-mono text-[12px]', r.error ? 'text-error' : 'text-muted-foreground')}>{formatMs(r.latency_ms)}</span>
            <span className="w-[110px] truncate text-[13px] text-muted-foreground">{ago(r.created_at)}</span>
            <div className="flex w-[64px] items-center gap-[6px]">
              <span
                className={cn(
                  'flex h-[28px] w-[28px] items-center justify-center rounded-full',
                  feedback === 'positive' ? 'bg-success-soft text-success' : 'border border-border text-subtle-foreground',
                )}
              >
                <ThumbsUp size={13} />
              </span>
              <span
                className={cn(
                  'flex h-[28px] w-[28px] items-center justify-center rounded-full',
                  feedback === 'negative' ? 'bg-error-soft text-error' : 'border border-border text-subtle-foreground',
                )}
              >
                <ThumbsDown size={13} />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
