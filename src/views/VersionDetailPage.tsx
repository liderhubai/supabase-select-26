'use client'

import { useState } from 'react'
import { Markdown } from '@/components/Markdown'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, FlaskConical, MessagesSquare, Rocket, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { callApi, useAgents, useRealtime, useVersions } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ago, cn, unwrap } from '@/lib/utils'
import type { Feedback, OptimizationJob, PromptVersion, TestCase, TestRun } from '@/lib/types'
import { PromptDiff } from '@/components/PromptDiff'
import { Badge, Button, Card, Empty, Select, StatusBadge } from '@/components/ui'

export default function VersionDetailPage() {
  const { versionId } = useParams<{ versionId: string }>()
  const id = versionId!
  const qc = useQueryClient()
  const router = useRouter()
  const { data: agents } = useAgents()

  const { data: version } = useQuery({
    queryKey: ['version', id],
    queryFn: async () => unwrap(await supabase.from('prompt_versions').select('*').eq('id', id).single()) as PromptVersion,
  })
  const agent = agents?.find((a) => a.id === version?.agent_id)
  const { data: siblings } = useVersions(version?.agent_id)

  const { data: job } = useQuery({
    queryKey: ['job', version?.optimization_job_id],
    enabled: !!version?.optimization_job_id,
    queryFn: async () => unwrap(await supabase.from('optimization_jobs').select('*').eq('id', version!.optimization_job_id!).single()) as OptimizationJob,
  })

  // Base de comparação: a versão de produção (ou a versão-pai, se esta já for a produção).
  const defaultBaseId = version?.status === 'production' || !agent?.production_version_id ? version?.parent_version_id : agent.production_version_id
  const [compareId, setCompareId] = useState<string | null>(null)
  const baseId = compareId ?? defaultBaseId ?? null
  const base = siblings?.find((v) => v.id === baseId)

  const promote = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('promote_version', { p_version_id: id })),
    onSuccess: () => qc.invalidateQueries(),
  })
  const reject = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('reject_version', { p_version_id: id })),
    onSuccess: () => qc.invalidateQueries(),
  })

  if (!version) return null
  const canDecide = version.status === 'staging' || version.status === 'draft'

  return (
    <>
      <Link href="/versions" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={14} /> Versões
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {agent?.name} · v{version.version}
            </h1>
            <StatusBadge status={version.status} />
          </div>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">{version.change_summary}</p>
          <p className="mt-1 text-xs text-zinc-400">
            criada {ago(version.created_at)}
            {version.promoted_at && <> · promovida {ago(version.promoted_at)}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.push(`/simulation?agent=${version.agent_id}&v=${version.id}`)}>
            <MessagesSquare size={15} /> Testar no simulador
          </Button>
          {canDecide && (
            <>
              <Button variant="secondary" onClick={() => reject.mutate()} disabled={reject.isPending}>
                <X size={15} /> Rejeitar
              </Button>
              <Button variant="success" onClick={() => promote.mutate()} disabled={promote.isPending}>
                <Rocket size={15} /> Promover para produção
              </Button>
            </>
          )}
        </div>
      </div>
      {(promote.error || reject.error) && <p className="mb-4 text-sm text-red-600">{(promote.error ?? reject.error)?.message}</p>}

      <div className="space-y-8">
        {(version.changes.length > 0 || job?.analysis) && <ChangesSection version={version} job={job ?? null} />}

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Diff do prompt</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">comparar com</span>
              <Select value={baseId ?? ''} onChange={(e) => setCompareId(e.target.value)} className="w-48">
                {siblings
                  ?.filter((v) => v.id !== version.id)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} ({v.status})
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          {base ? (
            <PromptDiff oldText={base.system_prompt} newText={version.system_prompt} oldLabel={`v${base.version} · ${base.status}`} newLabel={`v${version.version} · ${version.status}`} />
          ) : (
            <Card className="p-4">
              <pre className="whitespace-pre-wrap text-xs">{version.system_prompt}</pre>
            </Card>
          )}
        </section>

        <TestBattery version={version} baseline={base ?? null} jobId={version.optimization_job_id} />
      </div>
    </>
  )
}

function ChangesSection({ version, job }: { version: PromptVersion; job: OptimizationJob | null }) {
  const allIds = [...new Set(version.changes.flatMap((c) => c.feedback_ids))]
  const { data: feedbacks } = useQuery({
    queryKey: ['feedbacks', 'byIds', allIds],
    enabled: allIds.length > 0,
    queryFn: async () => unwrap(await supabase.from('feedbacks').select('*, messages(content)').in('id', allIds)) as (Feedback & { messages: { content: string } })[],
  })
  const fbById = new Map(feedbacks?.map((f) => [f.id, f]))

  return (
    <section>
      <h2 className="mb-3 font-semibold">Por que esta versão existe</h2>
      {job?.analysis && (
        <Card className="mb-4 p-4">
          <div className="mb-1 text-xs font-medium text-zinc-500">Diagnóstico da IA ({job.feedback_ids.length} feedbacks)</div>
          <p className="text-sm text-zinc-700">{job.analysis.diagnosis}</p>
          {job.analysis.patterns.length > 0 && (
            <ul className="mt-3 space-y-1">
              {job.analysis.patterns.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Badge tone={p.kind === 'failure' ? 'red' : 'green'}>{p.kind === 'failure' ? 'falha' : 'acerto'}</Badge>
                  <span className="text-zinc-700">{p.description}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {version.changes.map((c, i) => (
          <Card key={i} className="p-4">
            <div className="font-medium">{c.title}</div>
            <p className="mt-1 text-sm text-zinc-600">{c.reason}</p>
            {(c.before || c.after) && (
              <div className="mt-2 space-y-1 font-mono text-xs">
                {c.before && <div className="whitespace-pre-wrap rounded bg-red-50 px-2 py-1 text-red-900 line-through decoration-red-300">{c.before}</div>}
                {c.after && <div className="whitespace-pre-wrap rounded bg-emerald-50 px-2 py-1 text-emerald-900">{c.after}</div>}
              </div>
            )}
            {c.feedback_ids.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-xs font-medium text-zinc-500">Feedbacks que motivaram</div>
                {c.feedback_ids.map((fid) => {
                  const f = fbById.get(fid)
                  if (!f) return null
                  return (
                    <Link
                      key={fid} href={`/observability/${f.conversation_id}`}
                      className={cn('flex gap-1.5 rounded border px-2 py-1 text-xs hover:bg-zinc-50', f.rating === 'positive' ? 'border-emerald-200' : 'border-red-200')}
                    >
                      {f.rating === 'positive' ? <ThumbsUp size={12} className="mt-0.5 shrink-0 text-emerald-600" /> : <ThumbsDown size={12} className="mt-0.5 shrink-0 text-red-600" />}
                      <span className="line-clamp-2 text-zinc-700">{f.comment || f.messages.content}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}

type RunRow = TestRun & { test_cases: TestCase }

function TestBattery({ version, baseline, jobId }: { version: PromptVersion; baseline: PromptVersion | null; jobId: string | null }) {
  const qc = useQueryClient()
  const versionIds = [version.id, baseline?.id].filter(Boolean) as string[]
  const key = ['test_runs', ...versionIds]
  const [open, setOpen] = useState<string | null>(null)

  const { data: runs } = useQuery({
    queryKey: key,
    queryFn: async () =>
      unwrap(await supabase.from('test_runs').select('*, test_cases(*)').in('prompt_version_id', versionIds).order('created_at', { ascending: false })) as RunRow[],
  })
  useRealtime('test_runs', [['test_runs']])

  const rerun = useMutation({
    mutationFn: () => callApi('test-runs', { versionId: version.id, baselineId: baseline?.id ?? null, jobId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test_runs'] }),
  })

  // Último run de cada (caso, versão).
  const latest = new Map<string, RunRow>()
  for (const r of runs ?? []) {
    const k = `${r.test_case_id}:${r.prompt_version_id}`
    if (!latest.has(k)) latest.set(k, r)
  }
  const cases = [...new Map((runs ?? []).map((r) => [r.test_case_id, r.test_cases])).values()]
  const candRuns = cases.map((c) => latest.get(`${c.id}:${version.id}`)).filter(Boolean) as RunRow[]
  const baseRuns = baseline ? (cases.map((c) => latest.get(`${c.id}:${baseline.id}`)).filter(Boolean) as RunRow[]) : []

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Bateria de testes simulados</h2>
        <Button variant="secondary" onClick={() => rerun.mutate()} disabled={rerun.isPending}>
          <FlaskConical size={15} /> {rerun.isPending ? 'Disparando…' : 'Rodar bateria'}
        </Button>
      </div>
      {rerun.error && <p className="mb-3 text-sm text-red-600">{rerun.error.message}</p>}

      {!cases.length ? (
        <Empty>Nenhum teste rodado para esta versão ainda.</Empty>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Summary title={`Candidata · v${version.version}`} runs={candRuns} highlight />
            {baseline && <Summary title={`Baseline · v${baseline.version} (${baseline.status})`} runs={baseRuns} />}
          </div>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_120px] border-b border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-500">
              <span>Caso</span>
              <span className="text-center">v{version.version}</span>
              <span className="text-center">{baseline ? `v${baseline.version}` : ''}</span>
            </div>
            {cases.map((c) => {
              const cand = latest.get(`${c.id}:${version.id}`)
              const bas = baseline ? latest.get(`${c.id}:${baseline.id}`) : undefined
              const isOpen = open === c.id
              return (
                <div key={c.id} className="border-b border-zinc-100 last:border-0">
                  <button onClick={() => setOpen(isOpen ? null : c.id)} className="grid w-full grid-cols-[1fr_120px_120px] items-center px-4 py-2.5 text-left text-sm hover:bg-zinc-50">
                    <span className="flex items-center gap-2">
                      {c.name}
                      <Badge tone={c.origin === 'feedback' ? 'amber' : 'zinc'}>{c.origin}</Badge>
                    </span>
                    <ScoreCell run={cand} />
                    <ScoreCell run={bas} />
                  </button>
                  {isOpen && (
                    <div className="grid gap-4 bg-zinc-50 px-4 py-4 lg:grid-cols-2">
                      <div className="text-xs text-zinc-600 lg:col-span-2">
                        <b>Cenário:</b> {c.scenario} <br />
                        <b>Esperado:</b> {c.expected_behavior}
                      </div>
                      <RunTranscript title={`v${version.version}`} run={cand} />
                      {baseline && <RunTranscript title={`v${baseline.version}`} run={bas} />}
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </>
      )}
    </section>
  )
}

function Summary({ title, runs, highlight }: { title: string; runs: RunRow[]; highlight?: boolean }) {
  const done = runs.filter((r) => r.status === 'completed')
  const avg = done.length ? done.reduce((s, r) => s + Number(r.score ?? 0), 0) / done.length : null
  const passed = done.filter((r) => r.passed).length
  const pending = runs.filter((r) => r.status === 'queued' || r.status === 'running').length
  return (
    <Card className={cn('p-4', highlight && 'border-zinc-900')}>
      <div className="text-xs font-medium text-zinc-500">{title}</div>
      <div className="mt-2 flex items-end gap-6">
        <div>
          <div className="text-2xl font-semibold tabular-nums">{avg !== null ? avg.toFixed(1) : '—'}</div>
          <div className="text-xs text-zinc-500">nota média</div>
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">
            {passed}/{done.length}
          </div>
          <div className="text-xs text-zinc-500">aprovados</div>
        </div>
        {pending > 0 && <div className="text-xs text-sky-700">{pending} rodando…</div>}
      </div>
    </Card>
  )
}

function ScoreCell({ run }: { run?: TestRun }) {
  if (!run) return <span className="text-center text-zinc-300">—</span>
  if (run.status !== 'completed')
    return (
      <span className="text-center">
        <StatusBadge status={run.status} />
      </span>
    )
  return (
    <span className={cn('flex items-center justify-center gap-1 font-medium tabular-nums', run.passed ? 'text-emerald-700' : 'text-red-700')}>
      {run.passed ? <Check size={14} /> : <X size={14} />}
      {Number(run.score).toFixed(1)}
    </span>
  )
}

function RunTranscript({ title, run }: { title: string; run?: TestRun }) {
  if (!run) return <div />
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>{title}</span>
        {run.conversation_id && (
          <Link href={`/observability/${run.conversation_id}`} className="underline">
            traces
          </Link>
        )}
      </div>
      {run.error && <p className="mb-2 text-xs text-red-600">{run.error}</p>}
      <div className="space-y-1.5">
        {run.transcript.map((t, i) => (
          <div key={i} className={cn('rounded-lg px-2.5 py-1.5', t.role === 'user' ? 'ml-8 bg-zinc-800 text-white' : 'mr-8 border border-zinc-200 bg-white')}>
            <Markdown invert={t.role === 'user'} className="text-xs [&_*]:text-xs">
              {t.content}
            </Markdown>
          </div>
        ))}
      </div>
      {run.judge_reasoning && (
        <div className="mt-2 rounded-md border border-violet-200 bg-violet-50 p-2 text-xs text-violet-900">
          <b>Juiz:</b> {run.judge_reasoning}
        </div>
      )}
    </div>
  )
}
