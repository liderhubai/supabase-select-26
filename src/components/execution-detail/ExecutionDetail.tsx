'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, ChevronUp, Coins, Cpu, History, MessageCircle, Timer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, costUsd, formatMs, unwrap } from '@/lib/utils'
import type { ConfidenceIssue, Execution } from '@/lib/types'
import { TopBar } from '@/components/app/TopBar'
import { FeedbackModal, type Rating } from '@/components/app/FeedbackModal'
import { SnapshotPanel } from './SnapshotPanel'
import { ProcessPanel } from './ProcessPanel'

export type ExecutionDetailRow = Execution & {
  conversations: { id: string; customer_label: string; agent_id: string; prompt_version_id: string }
  prompt_versions: { version: number } | null
  messages: { id: string; content: string; confidence: number | null; confidence_reason: string | null; confidence_issues: ConfidenceIssue[] }[]
  feedbacks: { id: string; rating: Rating; comment: string; reviewer_name: string; origin: 'human' | 'auto'; status: string }[]
}

export function ExecutionDetail({ id }: { id: string }) {
  const [rateAs, setRateAs] = useState<Rating | null>(null)

  const { data: ex, isLoading, error } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('executions')
          .select(
            '*, conversations(id, customer_label, agent_id, prompt_version_id), prompt_versions(version), messages(id, content, confidence, confidence_reason, confidence_issues), feedbacks(id, rating, comment, reviewer_name, origin, status)',
          )
          .eq('id', id)
          .single(),
      ) as unknown as ExecutionDetailRow,
    // The confidence score lands a few seconds after the reply.
    refetchInterval: (q) => (q.state.data && q.state.data.messages[0] && q.state.data.messages[0].confidence == null ? 2000 : false),
  })

  const agentId = ex?.conversations.agent_id
  const { data: neighbours } = useQuery({
    queryKey: ['execution-ids', agentId],
    enabled: !!agentId,
    queryFn: async () =>
      (
        unwrap(
          await supabase
            .from('executions')
            .select('id, conversations!inner(agent_id)')
            .eq('kind', 'chat')
            .eq('conversations.agent_id', agentId!)
            .order('created_at', { ascending: false })
            .limit(500),
        ) as { id: string }[]
      ).map((r) => r.id),
  })
  const idx = neighbours?.indexOf(id) ?? -1
  const newer = idx > 0 ? neighbours![idx - 1] : null
  const older = idx >= 0 && idx < (neighbours?.length ?? 0) - 1 ? neighbours![idx + 1] : null

  if (isLoading || !ex) {
    return (
      <div className="flex h-full w-full flex-col">
        <TopBar crumbs={[{ label: 'Executions', href: '/app/executions' }, { label: id.slice(0, 8) }]} />
        <div className="flex flex-1 items-center justify-center text-[14px] text-muted-foreground">{error ? error.message : 'Loading…'}</div>
      </div>
    )
  }

  const message = ex.messages[0]
  const humanFeedback = ex.feedbacks.filter((f) => f.origin === 'human')
  const rated: Rating | null = humanFeedback.some((f) => f.rating === 'negative') ? 'negative' : humanFeedback.length ? 'positive' : null
  const meta = [
    { icon: History, text: new Date(ex.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }) },
    { icon: Timer, text: formatMs(ex.latency_ms) },
    { icon: Coins, text: `${((ex.input_tokens ?? 0) + (ex.output_tokens ?? 0)).toLocaleString('en-US')} tokens · $${costUsd(ex.model, ex.input_tokens, ex.output_tokens).toFixed(4)}` },
    { icon: Cpu, text: `${ex.model} · prompt v${ex.prompt_versions?.version ?? '—'}` },
  ]
  const navButton = 'flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border hover:bg-surface'

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={[{ label: 'Executions', href: '/app/executions' }, { label: ex.id.slice(0, 8) }]} />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] px-[32px] pt-[24px] pb-[28px]">
        <div className="flex w-full shrink-0 items-end justify-between gap-[16px]">
          <div className="flex min-w-0 flex-col gap-[10px]">
            <Link href="/app/executions" className="flex w-fit items-center gap-[6px] text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              <span className="text-[13px]">Executions</span>
            </Link>
            <div className="flex items-center gap-[12px]">
              <h1 className="font-mono text-[26px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">{ex.id.slice(0, 8)}</h1>
              <span className={cn('flex h-[24px] items-center gap-[6px] rounded-full px-[10px]', ex.error ? 'bg-error-soft' : 'bg-success-soft')}>
                <span className={cn('h-[6px] w-[6px] rounded-full', ex.error ? 'bg-error' : 'bg-success')} />
                <span className={cn('text-[12px] font-medium', ex.error ? 'text-error' : 'text-success')}>{ex.error ? 'Error' : 'Success'}</span>
              </span>
              <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                {ex.conversations.customer_label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[18px]">
              {meta.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-[6px]">
                  <Icon size={13} className="text-subtle-foreground" />
                  <span className="font-mono text-[12px] whitespace-nowrap text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[10px]">
            {newer ? (
              <Link href={`/app/executions/${newer}`} aria-label="Newer execution" title="Newer execution" className={navButton}>
                <ChevronUp size={16} className="text-muted-foreground" />
              </Link>
            ) : (
              <span className={cn(navButton, 'opacity-40')}>
                <ChevronUp size={16} className="text-muted-foreground" />
              </span>
            )}
            {older ? (
              <Link href={`/app/executions/${older}`} aria-label="Older execution" title="Older execution" className={navButton}>
                <ChevronDown size={16} className="text-muted-foreground" />
              </Link>
            ) : (
              <span className={cn(navButton, 'opacity-40')}>
                <ChevronDown size={16} className="text-muted-foreground" />
              </span>
            )}
            <Link
              href={`/app/chats?c=${ex.conversations.id}`}
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] hover:bg-surface"
            >
              <MessageCircle size={16} className="text-foreground" />
              <span className="text-[14px] font-medium whitespace-nowrap text-foreground">Open in chat</span>
            </Link>
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 gap-[20px]">
          <SnapshotPanel ex={ex} rated={rated} canRate={!!message && !rated} onRate={setRateAs} />
          <ProcessPanel ex={ex} />
        </div>
      </div>

      <FeedbackModal
        target={
          rateAs && message
            ? {
                messageId: message.id,
                conversationId: ex.conversations.id,
                executionId: ex.id,
                promptVersionId: ex.prompt_version_id ?? ex.conversations.prompt_version_id,
                agentId: ex.conversations.agent_id,
                reply: message.content,
              }
            : null
        }
        initialRating={rateAs ?? 'negative'}
        onClose={() => setRateAs(null)}
      />
    </div>
  )
}
