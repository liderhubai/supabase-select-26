'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, Download, MessageCircle, ThumbsUp, Timer, TriangleAlert } from 'lucide-react'
import { lastUserMessage, useCurrentAgent } from '@/lib/queries'
import { cn, formatMs } from '@/lib/utils'
import { TopBar } from '@/components/app/TopBar'
import { feedbackOf, tabs, useExecutions, type ExecutionRow, type TabKey } from './data'
import { ExecutionsTable } from './ExecutionsTable'
import { StatCard } from './StatCard'

const DAY = 86_400_000

function stats(rows: ExecutionRow[]) {
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const today = rows.filter((r) => Date.parse(r.created_at) >= startOfToday).length
  const yesterday = rows.filter((r) => {
    const t = Date.parse(r.created_at)
    return t >= startOfToday - DAY && t < startOfToday
  }).length
  const latencies = rows.filter((r) => !r.error && r.latency_ms != null).map((r) => r.latency_ms!).sort((a, b) => a - b)
  const p95 = latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)] : null
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null
  const errors = rows.filter((r) => r.error).length
  const rated = rows.filter((r) => r.feedbacks.length)
  const positive = rated.filter((r) => feedbackOf(r) === 'positive').length
  return { today, yesterday, p95, avg, errors, rated: rated.length, positive }
}

function exportCsv(rows: ExecutionRow[]) {
  const escape = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const header = ['id', 'created_at', 'chat', 'message', 'status', 'latency_ms', 'confidence', 'feedback', 'model', 'input_tokens', 'output_tokens']
  const lines = rows.map((r) =>
    [
      r.id,
      r.created_at,
      r.conversations.customer_label,
      lastUserMessage(r.input),
      r.error ? 'error' : 'success',
      r.latency_ms,
      r.messages[0]?.confidence,
      feedbackOf(r),
      r.model,
      r.input_tokens,
      r.output_tokens,
    ]
      .map(escape)
      .join(','),
  )
  const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `executions-${new Date().toISOString().slice(0, 10)}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export function ExecutionsView() {
  const { agent } = useCurrentAgent()
  const [tab, setTab] = useState<TabKey>('all')
  const { data: all, isLoading } = useExecutions(agent?.id)
  const rows = all ?? []
  const current = tabs.find((t) => t.key === tab)!
  const visible = rows.filter(current.match)
  const s = stats(rows)
  const delta = s.yesterday ? Math.round(((s.today - s.yesterday) / s.yesterday) * 100) : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <TopBar crumbs={[{ label: 'Executions' }]} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[24px] overflow-y-auto px-[32px] pt-[28px] pb-[32px]">
        <div className="flex w-full items-end justify-between gap-[16px]">
          <div className="flex max-w-[620px] flex-col gap-[14px]">
            <div className="flex items-center gap-[12px]">
              <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Executions</h1>
              {agent && (
                <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                  {agent.name} · v{agent.production?.version}
                </span>
              )}
            </div>
            <p className="text-[14px] leading-[1.5] text-muted-foreground">
              Every message sent to the agent becomes an execution. Open one to see a snapshot of what happened and rate it as good or bad.
            </p>
          </div>
          <Link
            href="/app/chats"
            className="flex h-[36px] shrink-0 items-center justify-center gap-[6px] rounded-full bg-primary px-[16px] text-primary-foreground hover:opacity-90"
          >
            <MessageCircle size={16} />
            <span className="text-[14px] font-medium">Test in chat</span>
          </Link>
        </div>

        <div className="flex w-fit flex-wrap gap-[2px] rounded-full border border-border bg-surface p-[3px]">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex h-[28px] items-center rounded-full px-[12px] text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-surface-raised text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label} · {rows.filter(t.match).length}
            </button>
          ))}
        </div>

        <div className="flex w-full gap-[16px]">
          <StatCard
            label="EXECUTIONS · TODAY"
            icon={Activity}
            value={String(s.today)}
            delta={delta == null ? undefined : `${delta >= 0 ? '+' : ''}${delta}%`}
            deltaTone={delta != null && delta < 0 ? 'error' : 'success'}
            footnote={`${s.yesterday} yesterday`}
          />
          <StatCard label="LATENCY P95" icon={Timer} value={formatMs(s.p95)} footnote={`average ${formatMs(s.avg)}`} />
          <StatCard
            label="ERROR RATE"
            icon={TriangleAlert}
            value={rows.length ? `${((s.errors / rows.length) * 100).toFixed(1)}%` : '—'}
            footnote={`${s.errors} failed executions`}
          />
          <StatCard
            label="POSITIVE FEEDBACK"
            icon={ThumbsUp}
            value={s.rated ? `${Math.round((s.positive / s.rated) * 100)}%` : '—'}
            footnote={`${s.positive} of ${s.rated} rated`}
          />
        </div>

        <div className="flex min-h-[300px] w-full flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
          <div className="flex w-full shrink-0 items-center justify-between border-b border-border px-[20px] py-[16px]">
            <div className="flex flex-col gap-[2px]">
              <span className="font-display text-[16px] font-medium tracking-[-0.2px] text-foreground">Recent executions</span>
              <span className="text-[13px] text-muted-foreground">{isLoading ? 'Loading…' : 'Click a row to open the execution snapshot'}</span>
            </div>
            <button
              type="button"
              onClick={() => exportCsv(visible)}
              disabled={!visible.length}
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full px-[16px] text-[14px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
          <ExecutionsTable rows={visible} />
        </div>
      </div>
    </div>
  )
}
