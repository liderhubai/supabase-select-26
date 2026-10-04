'use client'

import { Download } from 'lucide-react'
import { lastUserMessage, useCurrentAgent } from '@/lib/queries'
import { TopBar } from '@/components/app/TopBar'
import { feedbackOf, useExecutions, type ExecutionRow } from './data'
import { ExecutionsTable } from './ExecutionsTable'

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
  const { data, isLoading } = useExecutions(agent?.id)
  const rows = data ?? []

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <TopBar crumbs={[{ label: 'Executions' }]} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[24px] overflow-y-auto px-[32px] pt-[28px] pb-[32px]">
        <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Executions</h1>

        <div className="flex min-h-[300px] w-full flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
          <div className="flex w-full shrink-0 items-center justify-between border-b border-border px-[20px] py-[16px]">
            <div className="flex flex-col gap-[2px]">
              <span className="font-display text-[16px] font-medium tracking-[-0.2px] text-foreground">Recent executions</span>
              <span className="text-[13px] text-muted-foreground">{isLoading ? 'Loading…' : 'Click a row to open the message in the chat'}</span>
            </div>
            <button
              type="button"
              onClick={() => exportCsv(rows)}
              disabled={!rows.length}
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full px-[16px] text-[14px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
          <ExecutionsTable rows={rows} />
        </div>
      </div>
    </div>
  )
}
