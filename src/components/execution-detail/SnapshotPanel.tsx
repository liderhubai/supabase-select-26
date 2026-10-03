import Link from 'next/link'
import { ArrowUpRight, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/app/Markdown'
import { RatingButtons, type Rating } from '@/components/app/FeedbackModal'
import type { ExecutionDetailRow } from './ExecutionDetail'

function Separator({ label }: { label: string }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[10px]">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10.5px] tracking-[0.6px] text-subtle-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function CustomerBubble({ text }: { text: string }) {
  return <div className="max-w-[80%] rounded-[16px_16px_4px_16px] bg-accent px-[14px] py-[10px] text-[14px] leading-[1.45] whitespace-pre-line text-white">{text}</div>
}

function AgentBubble({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div className={cn('max-w-[85%] rounded-[16px_16px_16px_4px] bg-surface-raised px-[14px] py-[10px] text-foreground', highlight ? 'border-[1.5px] border-accent' : 'border border-border')}>
      <Markdown>{text}</Markdown>
    </div>
  )
}

function Label({ dot, text, className }: { dot: string; text: string; className: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className={cn('h-[6px] w-[6px] rounded-full', dot)} />
      <span className={cn('font-mono text-[10.5px] tracking-[0.8px]', className)}>{text}</span>
    </div>
  )
}

const asText = (c: unknown) => (typeof c === 'string' ? c : JSON.stringify(c))

export function SnapshotPanel({ ex, rated, canRate, onRate }: { ex: ExecutionDetailRow; rated: Rating | null; canRate: boolean; onRate: (r: Rating) => void }) {
  const history = ex.input?.messages ?? []
  const received = history.at(-1)
  const context = history.slice(0, -1)
  const turn = history.filter((m) => m.role === 'user').length
  const at = new Date(ex.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const autoFlag = ex.feedbacks.find((f) => f.origin === 'auto')
  const human = ex.feedbacks.filter((f) => f.origin === 'human')

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="flex w-full shrink-0 items-center justify-between gap-[16px] border-b border-border px-[20px] py-[14px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h2 className="font-display text-[16px] font-medium text-foreground">Conversation snapshot</h2>
          <p className="text-[13px] text-muted-foreground">Exact state of the chat at {at}, when the message arrived</p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">turn {turn}</span>
          <Link
            href={`/app/chats?c=${ex.conversations.id}`}
            className="flex h-[28px] items-center gap-[6px] rounded-full border border-border px-[10px] hover:bg-surface-raised"
          >
            <MessagesSquare size={13} className="text-accent" />
            <span className="text-[12px] font-medium text-foreground">{ex.conversations.customer_label}</span>
            <ArrowUpRight size={12} className="text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-[14px] overflow-y-auto px-[24px] py-[20px]">
        {context.length > 0 && <Separator label="PREVIOUS CONTEXT" />}
        {context.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex w-full flex-col items-end opacity-45">
              <CustomerBubble text={asText(m.content)} />
            </div>
          ) : (
            <div key={i} className="flex w-full flex-col opacity-45">
              <AgentBubble text={asText(m.content)} />
            </div>
          ),
        )}
        <Separator label="THIS EXECUTION" />
        {received && (
          <div className="flex w-full flex-col items-end gap-[6px]">
            <Label dot="bg-accent-foreground" text={`MESSAGE RECEIVED · ${at}`} className="text-accent-foreground" />
            <CustomerBubble text={asText(received.content)} />
          </div>
        )}
        <div className="flex w-full flex-col gap-[6px]">
          {ex.error ? (
            <>
              <Label dot="bg-error" text="EXECUTION FAILED" className="text-error" />
              <div className="rounded-[12px] border border-error bg-error-soft px-[14px] py-[10px] font-mono text-[12px] text-error">{ex.error}</div>
            </>
          ) : (
            <>
              <Label dot="bg-success" text={`REPLY RETURNED · +${((ex.latency_ms ?? 0) / 1000).toFixed(1)}s`} className="text-success" />
              <AgentBubble text={ex.output ?? ''} highlight />
            </>
          )}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-[10px] border-t border-border bg-surface-raised px-[20px] py-[16px]">
        {autoFlag && (
          <p className="text-[12px] text-warning">Flagged by the confidence scorer and sent to the Feedback queue automatically.</p>
        )}
        {human.map((f) => (
          <p key={f.id} className="text-[13px] text-muted-foreground">
            <span className={f.rating === 'positive' ? 'text-success' : 'text-error'}>{f.rating === 'positive' ? 'Rated good' : 'Rated bad'}</span> by {f.reviewer_name}
            {f.comment && <>: “{f.comment}”</>}
          </p>
        ))}
        {!ex.error && (
          <div className="flex w-full items-center gap-[10px]">
            <span className="min-w-0 flex-1 text-[14px] font-medium text-foreground">{rated ? 'You rated this reply.' : 'Was this reply good?'}</span>
            <div className={cn('flex gap-[8px]', !canRate && 'pointer-events-none opacity-60')}>
              <RatingButtons value={rated} onSelect={onRate} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
