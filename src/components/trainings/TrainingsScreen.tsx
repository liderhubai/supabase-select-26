'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { ago, cn, unwrap } from '@/lib/utils'
import type { OptimizationJob, TestRun } from '@/lib/types'
import { TopBar } from '@/components/app/TopBar'
import { JobStatus, VersionStatus } from './status'

type JobRow = OptimizationJob & {
  base: { version: number } | null
  candidate: { id: string; version: number; status: string } | null
  test_runs: Pick<TestRun, 'status' | 'variant' | 'score' | 'passed'>[]
}

const ACTIVE = ['queued', 'optimizing', 'testing']

const avg = (runs: JobRow['test_runs'], variant: 'baseline' | 'candidate') => {
  const done = runs.filter((r) => r.variant === variant && r.status === 'completed')
  return done.length ? done.reduce((s, r) => s + Number(r.score ?? 0), 0) / done.length : null
}

export function TrainingsScreen() {
  const { agent } = useCurrentAgent()
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', agent?.id],
    enabled: !!agent,
    refetchInterval: (q) => (q.state.data?.some((j) => ACTIVE.includes(j.status)) ? 3000 : 15_000),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('optimization_jobs')
          .select(
            '*, base:prompt_versions!optimization_jobs_base_version_id_fkey(version), candidate:prompt_versions!optimization_jobs_candidate_version_id_fkey(id, version, status), test_runs(status, variant, score, passed)',
          )
          .eq('agent_id', agent!.id)
          .order('created_at', { ascending: false }),
      ) as unknown as JobRow[],
  })

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={[{ label: 'Trainings' }]} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] overflow-y-auto px-[32px] pt-[24px] pb-[28px]">
        <div className="flex max-w-[620px] flex-col gap-[10px]">
          <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Trainings</h1>
          <p className="text-[14px] leading-[1.5] text-muted-foreground">
            Each training turns feedback into a new prompt version, runs the test suite against production and the candidate, and waits for you to promote or reject it.
          </p>
        </div>

        <div className="flex w-full flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
          {isLoading && <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">Loading…</span>}
          {!isLoading && !jobs?.length && (
            <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">
              No trainings yet. Select feedback in{' '}
              <Link href="/app/feedback" className="text-foreground underline">
                Feedback
              </Link>{' '}
              and click Train.
            </span>
          )}
          {jobs?.map((j) => {
            const done = j.test_runs.filter((r) => r.status === 'completed' || r.status === 'failed').length
            const base = avg(j.test_runs, 'baseline')
            const cand = avg(j.test_runs, 'candidate')
            return (
              <Link key={j.id} href={`/app/trainings/${j.id}`} className="flex w-full items-center gap-[16px] border-b border-border px-[20px] py-[14px] last:border-0 hover:bg-surface-raised">
                <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[14px] font-medium text-foreground">
                      v{j.base?.version} → {j.candidate ? `v${j.candidate.version}` : '…'}
                    </span>
                    <JobStatus status={j.status} />
                    {j.candidate && <VersionStatus status={j.candidate.status} />}
                  </div>
                  <span className="truncate text-[13px] text-muted-foreground">{j.error ?? j.analysis?.diagnosis ?? 'Waiting for the optimizer…'}</span>
                </div>
                <div className="flex w-[160px] flex-col gap-[2px] text-right">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {j.feedback_ids.length} feedbacks · tests {done}/{j.test_runs.length}
                  </span>
                  {base != null && cand != null && (
                    <span className={cn('font-mono text-[12px]', cand >= base ? 'text-success' : 'text-error')}>
                      score {base.toFixed(1)} → {cand.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="w-[110px] text-right text-[13px] text-muted-foreground">{ago(j.created_at)}</span>
                <ArrowUpRight size={14} className="text-subtle-foreground" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
