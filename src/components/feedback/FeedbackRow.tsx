import Link from 'next/link'
import { Check, MessageSquareQuote, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { lastUserMessage } from '@/lib/queries'
import { ago, cn } from '@/lib/utils'
import type { FeedbackItem } from './data'

export function Checkbox({ state, onClick, disabled }: { state: 'checked' | 'mixed' | 'unchecked'; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : state === 'checked'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] disabled:opacity-30',
        state === 'unchecked' ? 'bg-surface outline outline-1 -outline-offset-1 outline-border-strong' : 'bg-primary text-primary-foreground',
      )}
    >
      {state === 'checked' && <Check size={12} strokeWidth={2.5} />}
      {state === 'mixed' && <span className="h-[1.5px] w-[8px] rounded-full bg-primary-foreground" />}
    </button>
  )
}

export function FeedbackRow({
  item,
  selected,
  onToggle,
  onTrain,
  onDismiss,
  busy,
}: {
  item: FeedbackItem
  selected: boolean
  onToggle: () => void
  onTrain: () => void
  onDismiss: () => void
  busy: boolean
}) {
  const negative = item.rating === 'negative'
  const pending = item.status === 'pending'
  const customer = lastUserMessage(item.executions?.input)
  return (
    <div className={cn('flex w-full gap-[14px] border-b border-border px-[20px] py-[14px]', item.status === 'processed' && 'opacity-60')}>
      <div className="pt-[2px]">
        <Checkbox state={selected ? 'checked' : 'unchecked'} onClick={onToggle} disabled={!pending} />
      </div>
      <div className={cn('flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full', negative ? 'bg-error-soft text-error' : 'bg-success-soft text-success')}>
        {negative ? <ThumbsDown size={13} /> : <ThumbsUp size={13} />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex w-full flex-wrap items-center gap-[8px]">
          <span className="min-w-0 text-[14px] font-medium text-foreground">{customer || item.conversations?.customer_label || 'Customer message'}</span>
          {item.execution_id ? (
            <Link href={`/app/executions/${item.execution_id}`} className="font-mono text-[11px] text-subtle-foreground hover:text-foreground">
              {item.execution_id.slice(0, 8)}
            </Link>
          ) : null}
          <span className="font-mono text-[11px] text-subtle-foreground">
            v{item.prompt_versions?.version} · {item.reviewer_name} · {ago(item.created_at)}
          </span>
          {item.origin === 'auto' && <span className="rounded-full bg-warning-soft px-[8px] py-[1px] text-[11px] font-medium text-warning">auto · low confidence</span>}
        </div>
        <p className="line-clamp-2 text-[13px] text-muted-foreground">Agent: {item.messages?.content}</p>
        {item.comment && (
          <div className="flex items-start gap-[6px] pt-[2px]">
            <MessageSquareQuote size={12} className={cn('mt-[3px] shrink-0', negative ? 'text-error' : 'text-success')} />
            <span className="text-[13px] whitespace-pre-line text-foreground">{item.comment}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[8px] self-start">
        {item.status === 'processed' && <StatusPill label="Trained" />}
        {item.status === 'processing' && <StatusPill label="Training…" accent />}
        {pending && (
          <>
            <button
              type="button"
              onClick={onTrain}
              disabled={busy}
              className="flex h-[30px] shrink-0 items-center justify-center gap-[6px] rounded-full px-[12px] whitespace-nowrap outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface-raised disabled:opacity-50"
            >
              <Sparkles size={14} className="text-accent" />
              <span className="text-[13px] font-medium text-foreground">Train this one</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              title="Dismiss"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-subtle-foreground hover:bg-surface-raised hover:text-foreground"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StatusPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span className={cn('flex h-[24px] items-center gap-[6px] rounded-full px-[10px]', accent ? 'bg-accent-soft' : 'bg-surface-raised')}>
      <span className={cn('h-[6px] w-[6px] rounded-full', accent ? 'animate-pulse bg-accent' : 'bg-muted-foreground')} />
      <span className={cn('text-[12px] font-medium', accent ? 'text-accent-foreground' : 'text-muted-foreground')}>{label}</span>
    </span>
  )
}
