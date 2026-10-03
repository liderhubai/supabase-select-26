'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { callApi, useAgents, useRealtime } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ago, cn, unwrap } from '@/lib/utils'
import type { Agent, Feedback, OptimizationJob } from '@/lib/types'
import { Badge, Button, Card, Empty, PageHeader, StatusBadge } from '@/components/ui'

type FeedbackRow = Feedback & {
  messages: { content: string }
  prompt_versions: { version: number }
  conversations: { customer_label: string }
}

type JobRow = OptimizationJob & {
  agents: { name: string }
  base: { version: number } | null
  candidate: { version: number; status: string } | null
  test_runs: { status: string }[]
}

export default function QueuePage() {
  const { data: agents } = useAgents()

  const { data: feedbacks } = useQuery({
    queryKey: ['feedbacks', 'pending'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('feedbacks')
          .select('*, messages(content), prompt_versions(version), conversations(customer_label)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ) as FeedbackRow[],
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('optimization_jobs')
          .select(
            '*, agents(name), base:prompt_versions!optimization_jobs_base_version_id_fkey(version), candidate:prompt_versions!optimization_jobs_candidate_version_id_fkey(version, status), test_runs(status)',
          )
          .order('created_at', { ascending: false })
          .limit(30),
      ) as JobRow[],
  })

  useRealtime('feedbacks', [['feedbacks']])
  useRealtime('optimization_jobs', [['jobs']])
  useRealtime('test_runs', [['jobs']])

  const byAgent = (agents ?? []).map((a) => ({ agent: a, items: feedbacks?.filter((f) => f.agent_id === a.id) ?? [] })).filter((g) => g.items.length)

  return (
    <>
      <PageHeader
        title="Self-improvement queue"
        description="Reviewer feedback awaiting processing. The AI consolidates the feedback, rewrites the prompt with justifications, and runs the test suite."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-500">Pending ({feedbacks?.length ?? 0})</h2>
          {!byAgent.length && <Empty>No pending feedback. Leave feedback on conversations in the Observability tab.</Empty>}
          {byAgent.map(({ agent, items }) => (
            <AgentQueue key={agent.id} agent={agent} items={items} />
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium text-zinc-500">Processing runs</h2>
          <div className="space-y-3">
            {!jobs?.length && <Empty>No processing runs yet.</Empty>}
            {jobs?.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function AgentQueue({ agent, items }: { agent: Agent; items: FeedbackRow[] }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)))
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const ids = items.filter((i) => selected.has(i.id)).map((i) => i.id)

  const optimize = useMutation({
    mutationFn: () => callApi<{ jobId: string }>('optimize', { agentId: agent.id, feedbackIds: ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
  const dismiss = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('feedbacks').update({ status: 'dismissed' }).eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedbacks'] }),
  })

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div className="font-medium">{agent.name}</div>
        <Button onClick={() => optimize.mutate()} disabled={!ids.length || optimize.isPending}>
          <Sparkles size={15} /> {optimize.isPending ? 'Sending…' : `Process ${ids.length} with AI`}
        </Button>
      </div>
      {optimize.error && <p className="px-4 pt-2 text-sm text-red-600">{optimize.error.message}</p>}
      <ul>
        {items.map((f) => (
          <li key={f.id} className="flex gap-3 border-b border-zinc-50 px-4 py-3 last:border-0">
            <input type="checkbox" className="mt-1" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('flex items-center gap-1 font-medium', f.rating === 'positive' ? 'text-emerald-700' : 'text-red-700')}>
                  {f.rating === 'positive' ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                  {f.rating === 'positive' ? 'Positive' : 'Negative'}
                </span>
                <Badge tone="violet">v{f.prompt_versions.version}</Badge>
                <span className="text-xs text-zinc-500">
                  {f.reviewer_name} · {ago(f.created_at)} ·{' '}
                  <Link href={`/observability/${f.conversation_id}`} className="underline">
                    {f.conversations.customer_label}
                  </Link>
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-zinc-500">“{f.messages.content}”</p>
              {f.comment && <p className="mt-1 text-zinc-800">{f.comment}</p>}
            </div>
            <button className="self-start text-zinc-300 hover:text-zinc-600" title="Dismiss" onClick={() => dismiss.mutate(f.id)}>
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function JobCard({ job }: { job: JobRow }) {
  const done = job.test_runs.filter((r) => r.status === 'completed' || r.status === 'failed').length
  const total = job.test_runs.length
  return (
    <Card className="p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{job.agents.name}</div>
        <StatusBadge status={job.status} />
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {job.feedback_ids.length} feedbacks · base v{job.base?.version} {job.candidate && <>→ candidate v{job.candidate.version}</>} · {ago(job.created_at)}
      </div>
      {(job.status === 'testing' || job.status === 'completed') && total > 0 && (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded bg-zinc-100">
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Test suite: {done}/{total}
          </div>
        </div>
      )}
      {job.analysis?.diagnosis && <p className="mt-2 line-clamp-3 text-xs text-zinc-600">{job.analysis.diagnosis}</p>}
      {job.error && <p className="mt-2 text-xs text-red-600">{job.error}</p>}
      {job.candidate_version_id && (
        <Link href={`/versions/${job.candidate_version_id}`}>
          <Button variant="secondary" className="mt-3 w-full">
            View new version, diff and tests
          </Button>
        </Link>
      )}
    </Card>
  )
}
