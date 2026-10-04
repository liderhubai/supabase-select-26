'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, ChevronDown, ChevronRight, Rocket, X } from 'lucide-react'
import { PromptDiff } from '@/components/app/PromptDiff'
import { supabase } from '@/lib/supabase'
import { ago, cn, unwrap } from '@/lib/utils'
import type { OptimizationJob, PromptVersion, TestRun } from '@/lib/types'
import { TopBar } from '@/components/app/TopBar'
import { JobStatus, VersionStatus } from './status'

type JobDetail = OptimizationJob & {
  base: Pick<PromptVersion, 'id' | 'version' | 'system_prompt'> | null
  candidate: PromptVersion | null
}

type RunRow = TestRun & { test_cases: { name: string; expected_behavior: string } | null }

const ACTIVE = ['queued', 'optimizing', 'testing']

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-border bg-surface', className)}>
      <div className="flex flex-col gap-[2px] border-b border-border px-[20px] py-[14px]">
        <h2 className="font-display text-[16px] font-medium text-foreground">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export function TrainingDetail({ id }: { id: string }) {
  const qc = useQueryClient()
  const [openRun, setOpenRun] = useState<string | null>(null)

  const { data: job, error } = useQuery({
    queryKey: ['job', id],
    refetchInterval: (q) => (q.state.data && ACTIVE.includes(q.state.data.status) ? 2500 : false),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('optimization_jobs')
          .select(
            '*, base:prompt_versions!optimization_jobs_base_version_id_fkey(id, version, system_prompt), candidate:prompt_versions!optimization_jobs_candidate_version_id_fkey(*)',
          )
          .eq('id', id)
          .single(),
      ) as unknown as JobDetail,
  })

  const { data: runs } = useQuery({
    queryKey: ['job-runs', id],
    refetchInterval: () => (job && ACTIVE.includes(job.status) ? 2500 : false),
    queryFn: async () =>
      unwrap(await supabase.from('test_runs').select('*, test_cases(name, expected_behavior)').eq('job_id', id).order('created_at')) as unknown as RunRow[],
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['job', id] })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['agents'] })
    qc.invalidateQueries({ queryKey: ['feedbacks'] })
    qc.invalidateQueries({ queryKey: ['counts'] })
  }
  const promote = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('promote_version', { p_version_id: job!.candidate!.id })),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('reject_version', { p_version_id: job!.candidate!.id })),
    onSuccess: invalidate,
  })

  const crumbs = [{ label: 'Trainings', href: '/app/trainings' }, { label: job ? `v${job.base?.version} → ${job.candidate ? `v${job.candidate.version}` : '…'}` : id.slice(0, 8) }]

  if (!job) {
    return (
      <div className="flex h-full w-full flex-col">
        <TopBar crumbs={crumbs} />
        <div className="flex flex-1 items-center justify-center text-[14px] text-muted-foreground">{error ? error.message : 'Loading…'}</div>
      </div>
    )
  }

  // Pair baseline and candidate runs by test case.
  const cases = new Map<string, { name: string; criteria: string; baseline?: RunRow; candidate?: RunRow }>()
  for (const r of runs ?? []) {
    const c = cases.get(r.test_case_id) ?? { name: r.test_cases?.name ?? 'Test case', criteria: r.test_cases?.expected_behavior ?? '' }
    c[r.variant] = r
    cases.set(r.test_case_id, c)
  }
  const summary = (variant: 'baseline' | 'candidate') => {
    const done = (runs ?? []).filter((r) => r.variant === variant && r.status === 'completed')
    return {
      avg: done.length ? done.reduce((s, r) => s + Number(r.score ?? 0), 0) / done.length : null,
      passed: done.filter((r) => r.passed).length,
      total: (runs ?? []).filter((r) => r.variant === variant).length,
    }
  }
  const base = summary('baseline')
  const cand = summary('candidate')
  const canDecide = job.candidate?.status === 'staging'
  const testsRunning = job.status === 'testing'

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={crumbs} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] overflow-y-auto px-[32px] pt-[24px] pb-[28px]">
        <div className="flex w-full shrink-0 items-end justify-between gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <Link href="/app/trainings" className="flex w-fit items-center gap-[6px] text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              <span className="text-[13px]">Trainings</span>
            </Link>
            <div className="flex flex-wrap items-center gap-[12px]">
              <h1 className="font-display text-[30px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">
                Prompt v{job.base?.version} → {job.candidate ? `v${job.candidate.version}` : '…'}
              </h1>
              <JobStatus status={job.status} />
              {job.candidate && <VersionStatus status={job.candidate.status} />}
            </div>
            <span className="text-[13px] text-muted-foreground">
              {job.feedback_ids.length} feedbacks · started {ago(job.created_at)}
              {base.avg != null && cand.avg != null && (
                <>
                  {' · score '}
                  <span className={cn('font-medium', cand.avg >= base.avg ? 'text-success' : 'text-error')}>
                    {base.avg.toFixed(1)} → {cand.avg.toFixed(1)}
                  </span>
                  {` · ${cand.passed}/${cand.total} tests passed`}
                </>
              )}
            </span>
          </div>
          {canDecide && (
            <div className="flex shrink-0 items-center gap-[10px]">
              <button
                type="button"
                onClick={() => reject.mutate()}
                disabled={reject.isPending || promote.isPending}
                className="flex h-[36px] items-center gap-[6px] rounded-full border border-border-strong px-[16px] text-[14px] font-medium text-foreground hover:bg-surface disabled:opacity-50"
              >
                <X size={15} /> Reject
              </button>
              <button
                type="button"
                onClick={() => promote.mutate()}
                disabled={reject.isPending || promote.isPending}
                title={testsRunning ? 'Tests are still running' : undefined}
                className="flex h-[36px] items-center gap-[6px] rounded-full bg-primary px-[16px] text-[14px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Rocket size={15} /> Promote to production
              </button>
            </div>
          )}
        </div>
        {(promote.error || reject.error) && <p className="shrink-0 text-[13px] text-error">{(promote.error ?? reject.error)!.message}</p>}
        {job.error && <p className="shrink-0 rounded-[12px] border border-error bg-error-soft px-[14px] py-[10px] text-[13px] text-error">{job.error}</p>}
        {job.analysis && <p className="max-w-[900px] shrink-0 text-[14px] leading-[1.6] text-muted-foreground">{job.analysis.diagnosis}</p>}

        {job.base && job.candidate && (
          <Card title="What changed">
            <PromptDiff before={job.base.system_prompt} after={job.candidate.system_prompt} beforeLabel={`Before (v${job.base.version})`} afterLabel={`After (v${job.candidate.version})`} />
          </Card>
        )}

        <Card title="Tests" subtitle="A judge scores each simulated conversation from 0 to 10">
          {!cases.size && <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">{ACTIVE.includes(job.status) ? 'Preparing tests…' : 'No test runs.'}</span>}
          {[...cases.entries()].map(([caseId, c]) => (
            <div key={caseId} className="border-b border-border last:border-0">
              <button
                type="button"
                onClick={() => setOpenRun(openRun === caseId ? null : caseId)}
                className="flex w-full items-center gap-[16px] px-[20px] py-[12px] text-left hover:bg-surface-raised"
              >
                {openRun === caseId ? <ChevronDown size={14} className="text-subtle-foreground" /> : <ChevronRight size={14} className="text-subtle-foreground" />}
                <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">{c.name}</span>
                <ScoreCell label="prod" run={c.baseline} />
                <ScoreCell label="new" run={c.candidate} />
              </button>
              {openRun === caseId && (
                <div className="flex flex-col gap-[10px] px-[50px] pb-[16px]">
                  <p className="text-[12px] text-subtle-foreground">Criteria: {c.criteria}</p>
                  {(['baseline', 'candidate'] as const).map((v) =>
                    c[v]?.judge_reasoning || c[v]?.error ? (
                      <p key={v} className="text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">{v === 'baseline' ? 'Production' : 'Candidate'}:</span> {c[v]!.error ?? c[v]!.judge_reasoning}
                      </p>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function ScoreCell({ label, run }: { label: string; run?: RunRow }) {
  const content = !run ? (
    '—'
  ) : run.status === 'completed' ? (
    <span className={cn('flex items-center gap-[4px]', run.passed ? 'text-success' : 'text-error')}>
      {run.passed ? <Check size={13} /> : <X size={13} />}
      {Number(run.score).toFixed(1)}
    </span>
  ) : run.status === 'failed' ? (
    <span className="text-error">error</span>
  ) : (
    <span className="animate-pulse text-subtle-foreground">{run.status}</span>
  )
  return (
    <span className="flex w-[96px] items-center justify-end gap-[6px] font-mono text-[12px]">
      <span className="text-subtle-foreground">{label}</span>
      {content}
    </span>
  )
}
