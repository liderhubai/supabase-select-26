'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callApi } from '@/lib/queries'
import { cn, unwrap } from '@/lib/utils'
import type { Message, OptimizationJob, PromptVersion } from '@/lib/types'
import { Markdown } from '@/components/app/Markdown'
import { PromptDiff } from '@/components/app/PromptDiff'
import { gradient } from '@/components/chats/Thread'
import { feedbackStatus, StatusPill, type Tone } from './FeedbackTable'
import type { FeedbackItem } from './data'

type Job = OptimizationJob & {
  base: Pick<PromptVersion, 'version' | 'system_prompt'> | null
  candidate: Pick<PromptVersion, 'id' | 'version' | 'system_prompt' | 'status'> | null
}

const ACTIVE = ['queued', 'optimizing', 'testing']

const versionStatus: Record<PromptVersion['status'], { label: string; tone: Tone }> = {
  staging: { label: 'Awaiting approval', tone: 'warning' },
  production: { label: 'Published', tone: 'success' },
  archived: { label: 'Published', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  draft: { label: 'Draft', tone: 'neutral' },
}
const CONTEXT_SIZE = 6

export function FeedbackDrawer({ item, number, agentId, agentName, onClose }: { item: FeedbackItem; number: number; agentId: string; agentName: string; onClose: () => void }) {
  const qc = useQueryClient()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data: messages } = useQuery({
    queryKey: ['conversation-messages', item.conversation_id],
    queryFn: async () =>
      unwrap(
        await supabase.from('messages').select('id, role, content').eq('conversation_id', item.conversation_id).order('created_at'),
      ) as Pick<Message, 'id' | 'role' | 'content'>[],
  })
  const idx = messages?.findIndex((m) => m.id === item.message_id) ?? -1
  const context = messages && idx >= 0 ? messages.slice(Math.max(0, idx - CONTEXT_SIZE + 1), idx + 1) : []

  const jobId = item.optimization_job_id
  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    enabled: !!jobId,
    refetchInterval: (q) => (q.state.data && (ACTIVE.includes(q.state.data.status) && !q.state.data.candidate) ? 2500 : false),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('optimization_jobs')
          .select(
            '*, base:prompt_versions!optimization_jobs_base_version_id_fkey(version, system_prompt), candidate:prompt_versions!optimization_jobs_candidate_version_id_fkey(id, version, system_prompt, status)',
          )
          .eq('id', jobId!)
          .single(),
      ) as unknown as Job,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['job', jobId] })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['agents'] })
    qc.invalidateQueries({ queryKey: ['feedbacks'] })
    qc.invalidateQueries({ queryKey: ['counts'] })
  }
  const generate = useMutation({
    mutationFn: () => callApi<{ jobId: string }>('optimize', { agentId, feedbackIds: [item.id] }),
    onSuccess: invalidate,
  })
  const promote = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('promote_version', { p_version_id: job!.candidate!.id })),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('reject_version', { p_version_id: job!.candidate!.id })),
    onSuccess: invalidate,
  })

  const candidate = job?.candidate
  const canDecide = candidate?.status === 'staging'
  const busy = promote.isPending || reject.isPending
  const error = generate.error ?? promote.error ?? reject.error

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <aside className="relative flex h-full w-[min(1400px,72vw)] flex-col border-l border-border-strong bg-background">
        <header className="flex h-[64px] shrink-0 items-center gap-[12px] border-b border-border-strong px-[24px]">
          <h2 className="flex-1 truncate font-display text-[22px] font-medium tracking-[-0.4px] text-foreground">
            Feedback #{number} · {agentName}
          </h2>
          <StatusPill {...(candidate ? versionStatus[candidate.status] : feedbackStatus[item.status])} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-[390px] shrink-0 flex-col overflow-y-auto border-r border-border-strong">
            <section className="flex flex-col gap-[10px] border-b border-dashed border-border-strong px-[24px] py-[20px]">
              <h3 className="text-[15px] font-medium text-foreground">Conversation context</h3>
              {!messages && <span className="text-[13px] text-subtle-foreground">Loading…</span>}
              {context.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex w-full justify-end pl-[40px]">
                    <div className="rounded-[16px_16px_4px_16px] bg-accent px-[14px] py-[10px] text-[14px] leading-[1.45] whitespace-pre-line text-white">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex w-full gap-[8px] pr-[24px]">
                    <div className={cn('flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white', gradient)}>AI</div>
                    <div
                      className={cn(
                        'min-w-0 flex-1 rounded-[16px_16px_16px_4px] border bg-surface-raised px-[14px] py-[10px] text-foreground',
                        m.id === item.message_id ? 'border-accent ring-1 ring-accent' : 'border-border',
                      )}
                    >
                      <Markdown>{m.content}</Markdown>
                    </div>
                  </div>
                ),
              )}
            </section>
            <section className="flex flex-col gap-[10px] border-b border-dashed border-border-strong px-[24px] py-[20px]">
              <h3 className="text-[15px] font-medium text-foreground">
                {item.origin === 'auto' ? 'Flagged by the confidence check' : `Input sent by ${item.reviewer_name}`}
              </h3>
              <p className="text-[15px] leading-[1.55] whitespace-pre-line text-foreground">
                {item.comment ? `“${item.comment}”` : <span className="text-subtle-foreground">{item.rating === 'positive' ? '👍' : '👎'} No comment</span>}
              </p>
            </section>
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <h3 className="border-b border-dashed border-border-strong px-[24px] py-[20px] text-[15px] font-medium text-foreground">Prompt before and after</h3>
            {job?.base && candidate ? (
              <PromptDiff before={job.base.system_prompt} after={candidate.system_prompt} beforeLabel={`Before (v${job.base.version})`} afterLabel={`After (v${candidate.version})`} />
            ) : (
              <div className="flex flex-col items-start gap-[12px] px-[24px] py-[20px] text-[14px] text-muted-foreground">
                {job?.status === 'failed' ? (
                  <span className="text-error">{job.error ?? 'Training failed.'}</span>
                ) : jobId ? (
                  <span className="animate-pulse">Rewriting the prompt…</span>
                ) : (
                  <span>No proposal yet. Generate one from this feedback to see the prompt change.</span>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="flex h-[72px] shrink-0 items-center gap-[12px] border-t border-border-strong px-[24px]">
          <span className={cn('flex-1 truncate text-[14px]', error ? 'text-error' : 'text-muted-foreground')}>
            {error
              ? error.message
              : canDecide
                ? 'Review the change before publishing'
                : candidate
                  ? `v${candidate.version} · ${versionStatus[candidate.status].label}`
                  : jobId
                    ? 'The proposal appears here as soon as it is ready'
                    : 'Turn this feedback into a prompt change'}
          </span>
          {canDecide && (
            <>
              <button
                type="button"
                onClick={() => reject.mutate()}
                disabled={busy}
                className="flex h-[44px] items-center rounded-[10px] px-[20px] text-[15px] font-medium text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => promote.mutate()}
                disabled={busy}
                className="flex h-[44px] items-center rounded-[10px] bg-primary px-[20px] text-[15px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Approve and publish v{candidate.version}
              </button>
            </>
          )}
          {item.status === 'pending' && (
            <button
              type="button"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="flex h-[44px] items-center gap-[8px] rounded-[10px] bg-primary px-[20px] text-[15px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {generate.isPending ? 'Starting…' : 'Generate proposal'}
            </button>
          )}
        </footer>
      </aside>
    </div>
  )
}
