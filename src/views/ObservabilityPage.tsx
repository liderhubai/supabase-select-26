'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAgents, useRealtime } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ago, unwrap } from '@/lib/utils'
import type { Conversation, PromptVersion } from '@/lib/types'
import { Badge, Card, Empty, PageHeader, Select, StatusBadge } from '@/components/ui'

type Row = Conversation & {
  agents: { name: string }
  prompt_versions: Pick<PromptVersion, 'version' | 'status'>
  executions: { input_tokens: number | null; output_tokens: number | null; latency_ms: number | null; error: string | null; kind: string }[]
  messages: { count: number }[]
  feedbacks: { rating: 'positive' | 'negative' }[]
}

const fmt = (n: number) => n.toLocaleString('en-US')

export default function ObservabilityPage() {
  const router = useRouter()
  const { data: agents } = useAgents()
  const [agentId, setAgentId] = useState('')
  const [source, setSource] = useState<'all' | 'simulation' | 'test'>('simulation')

  const { data: rows, isLoading } = useQuery({
    queryKey: ['observability', agentId, source],
    queryFn: async () => {
      let q = supabase
        .from('conversations')
        .select(
          '*, agents(name), prompt_versions(version, status), executions(input_tokens, output_tokens, latency_ms, error, kind), messages(count), feedbacks(rating)',
        )
        .order('created_at', { ascending: false })
        .limit(200)
      if (agentId) q = q.eq('agent_id', agentId)
      if (source !== 'all') q = q.eq('source', source)
      return unwrap(await q) as Row[]
    },
  })
  useRealtime('feedbacks', [['observability']])

  const stats = (rows ?? []).reduce(
    (acc, r) => {
      for (const e of r.executions) {
        acc.tokens += (e.input_tokens ?? 0) + (e.output_tokens ?? 0)
        if (e.kind === 'chat' || e.kind === 'test_agent') {
          acc.latency += e.latency_ms ?? 0
          acc.calls += 1
        }
        if (e.error) acc.errors += 1
      }
      acc.pos += r.feedbacks.filter((f) => f.rating === 'positive').length
      acc.neg += r.feedbacks.filter((f) => f.rating === 'negative').length
      return acc
    },
    { tokens: 0, latency: 0, calls: 0, errors: 0, pos: 0, neg: 0 },
  )

  return (
    <>
      <PageHeader
        title="Observability"
        description="All conversations, with traces for every AI call. Click to review and leave feedback on messages."
        actions={
          <>
            <Select value={agentId} onValueChange={setAgentId} className="w-56" options={[{ value: '', label: 'All agents' }, ...(agents ?? []).map((a) => ({ value: a.id, label: a.name }))]} />
            <Select
              value={source}
              onValueChange={(v) => setSource(v as typeof source)}
              className="w-40"
              options={[
                { value: 'simulation', label: 'Simulations' },
                { value: 'test', label: 'Automated tests' },
                { value: 'all', label: 'All' },
              ]}
            />
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Conversations" value={fmt(rows?.length ?? 0)} />
        <Kpi label="Tokens" value={fmt(stats.tokens)} />
        <Kpi label="Average latency" value={stats.calls ? `${fmt(Math.round(stats.latency / stats.calls))} ms` : '—'} />
        <Kpi label="Errors" value={fmt(stats.errors)} />
        <Kpi label="Feedbacks" value={`${stats.pos} 👍 · ${stats.neg} 👎`} />
      </div>

      {isLoading ? null : !rows?.length ? (
        <Empty>No conversations yet. Run a simulation.</Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Conversation</th>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Version</th>
                <th className="px-3 py-2 text-right font-medium">Msgs</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 text-right font-medium">Average latency</th>
                <th className="px-3 py-2 font-medium">Feedback</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tokens = r.executions.reduce((s, e) => s + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0)
                const agentCalls = r.executions.filter((e) => e.kind === 'chat' || e.kind === 'test_agent')
                const lat = agentCalls.length ? Math.round(agentCalls.reduce((s, e) => s + (e.latency_ms ?? 0), 0) / agentCalls.length) : null
                const pos = r.feedbacks.filter((f) => f.rating === 'positive').length
                const neg = r.feedbacks.length - pos
                const hasError = r.executions.some((e) => e.error)
                return (
                  <tr key={r.id} onClick={() => router.push(`/observability/${r.id}`)} className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 font-medium">
                        {r.customer_label}
                        {r.source === 'test' && <Badge tone="blue">test</Badge>}
                        {hasError && <Badge tone="red">error</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{r.agents.name}</td>
                    <td className="px-3 py-2">
                      <span className="mr-1.5">v{r.prompt_versions.version}</span>
                      <StatusBadge status={r.prompt_versions.status} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.messages[0]?.count ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(tokens)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{lat !== null ? `${fmt(lat)} ms` : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 text-xs">
                        {pos > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-700">
                            <ThumbsUp size={12} /> {pos}
                          </span>
                        )}
                        {neg > 0 && (
                          <span className="flex items-center gap-0.5 text-red-700">
                            <ThumbsDown size={12} /> {neg}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{ago(r.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </Card>
  )
}
