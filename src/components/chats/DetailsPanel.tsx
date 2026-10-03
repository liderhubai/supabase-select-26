'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { cn, costUsd, formatMs, unwrap } from '@/lib/utils'
import type { Execution } from '@/lib/types'
import type { ConversationRow } from './data'

function SectionLabel({ children }: { children: string }) {
  return <span className="font-mono text-[11px] tracking-[1px] text-subtle-foreground">{children}</span>
}

const kindLabel: Record<Execution['kind'], string> = {
  chat: 'agent reply',
  confidence: 'confidence score',
  optimize: 'optimizer',
  test_user: 'simulated customer',
  test_agent: 'agent (test)',
  judge: 'judge',
}

export function DetailsPanel({ conversation, onClose }: { conversation: ConversationRow; onClose: () => void }) {
  const { agent } = useCurrentAgent()
  const { data: executions } = useQuery({
    queryKey: ['session-executions', conversation.id],
    refetchInterval: 5_000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('executions')
          .select('id, kind, model, latency_ms, input_tokens, output_tokens, error, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false }),
      ) as Pick<Execution, 'id' | 'kind' | 'model' | 'latency_ms' | 'input_tokens' | 'output_tokens' | 'error' | 'created_at'>[],
  })

  const chatRuns = executions?.filter((e) => e.kind === 'chat').length ?? 0
  const tokens = executions?.reduce((s, e) => s + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0) ?? 0
  const cost = executions?.reduce((s, e) => s + costUsd(e.model, e.input_tokens, e.output_tokens), 0) ?? 0
  const up = conversation.feedbacks.filter((f) => f.rating === 'positive').length
  const down = conversation.feedbacks.length - up
  const scores = conversation.messages.filter((m) => m.role === 'assistant' && m.confidence != null).map((m) => m.confidence!)
  const avgConfidence = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const stats = [
    { value: String(conversation.messages.length), label: 'Messages' },
    { value: String(chatRuns), label: 'Executions' },
    { value: `${up} / ${down}`, label: '👍 / 👎' },
  ]
  const rows: { key: string; value: string; className?: string }[] = [
    { key: 'Agent', value: agent?.name ?? '—' },
    { key: 'Prompt version', value: `v${conversation.prompt_versions?.version ?? '—'}` },
    { key: 'Model', value: agent?.model ?? '—', className: 'font-mono' },
    { key: 'Started', value: new Date(conversation.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
    { key: 'Avg. confidence', value: avgConfidence == null ? '—' : `${avgConfidence}%`, className: 'font-mono' },
    { key: 'Tokens', value: tokens.toLocaleString('en-US'), className: 'font-mono' },
    { key: 'Cost (incl. scoring)', value: `$${cost.toFixed(4)}`, className: 'font-mono' },
  ]

  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface">
      <header className="flex h-[72px] shrink-0 items-center border-b border-border px-[20px]">
        <span className="flex-1 font-display text-[15px] font-semibold text-foreground">Details</span>
        <button type="button" aria-label="Close" onClick={onClose} className="text-subtle-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto p-[20px]">
        <div className="flex w-full gap-[8px]">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-1 flex-col gap-[4px] rounded-[12px] border border-border bg-background px-[12px] py-[10px]">
              <span className="font-display text-[18px] font-semibold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>SESSION</SectionLabel>
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-[8px]">
              <span className="flex-1 text-[13px] text-muted-foreground">{r.key}</span>
              <span className={cn('truncate text-[13px] text-foreground', r.className)}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>SESSION EXECUTIONS</SectionLabel>
          {!executions?.length && <span className="text-[13px] text-subtle-foreground">None yet.</span>}
          {executions?.map((e) => {
            const content = (
              <>
                <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', e.error ? 'bg-error' : 'bg-success')} />
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="font-mono text-[12px] text-foreground">{kindLabel[e.kind]}</span>
                  <span className="truncate font-mono text-[11px] text-subtle-foreground">{e.model}</span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{formatMs(e.latency_ms)}</span>
              </>
            )
            const className = 'flex items-center gap-[10px] rounded-[12px] border border-border px-[12px] py-[10px]'
            return e.kind === 'chat' ? (
              <Link key={e.id} href={`/app/executions/${e.id}`} className={cn(className, 'hover:bg-surface-raised')}>
                {content}
              </Link>
            ) : (
              <div key={e.id} className={className}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
