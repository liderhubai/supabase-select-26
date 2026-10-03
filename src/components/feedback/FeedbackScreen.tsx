'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { callApi, useCurrentAgent } from '@/lib/queries'
import { cn, unwrap } from '@/lib/utils'
import { TopBar } from '@/components/app/TopBar'
import { filters, views, type FeedbackItem, type FilterId, type ViewId } from './data'
import { Checkbox, FeedbackRow } from './FeedbackRow'
import { GroupList } from './GroupList'
import { PageHeader } from './PageHeader'

export function FeedbackScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { agent } = useCurrentAgent()
  const [view, setView] = useState<ViewId>('all')
  const [filter, setFilter] = useState<FilterId>('all')
  // null = default selection (every pending reviewer feedback); auto-flagged items are opt-in.
  const [picked, setPicked] = useState<string[] | null>(null)

  const { data: items, isLoading } = useQuery({
    queryKey: ['feedbacks', agent?.id],
    enabled: !!agent,
    refetchInterval: 10_000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('feedbacks')
          .select('*, messages(content), executions(input), prompt_versions(version), conversations(customer_label)')
          .eq('agent_id', agent!.id)
          .neq('status', 'dismissed')
          .order('created_at', { ascending: false }),
      ) as unknown as FeedbackItem[],
  })

  const all = items ?? []
  const activeView = views.find((v) => v.id === view)!
  const inView = all.filter(activeView.match)
  const visible = inView.filter(filters.find((f) => f.id === filter)!.match)
  const pendingIds = new Set(all.filter((f) => f.status === 'pending').map((f) => f.id))
  const selected = (picked ?? all.filter((f) => f.status === 'pending' && f.origin === 'human').map((f) => f.id)).filter((id) => pendingIds.has(id))
  const selectableVisible = visible.filter((f) => f.status === 'pending').map((f) => f.id)
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((id) => selected.includes(id))
  const headerState = !selected.length ? 'unchecked' : allVisibleSelected ? 'checked' : 'mixed'
  const chosen = all.filter((f) => selected.includes(f.id))
  const neg = chosen.filter((f) => f.rating === 'negative').length

  const toggle = (id: string) => setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const train = useMutation({
    mutationFn: (feedbackIds: string[]) => callApi<{ jobId: string }>('optimize', { agentId: agent!.id, feedbackIds }),
    onSuccess: ({ jobId }) => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['counts'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      router.push(`/app/trainings/${jobId}`)
    },
  })

  const dismiss = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('feedbacks').update({ status: 'dismissed' }).eq('id', id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['counts'] })
    },
  })

  const counts = {
    neg: inView.filter((f) => f.rating === 'negative').length,
    pos: inView.filter((f) => f.rating === 'positive').length,
    trained: inView.filter((f) => f.status === 'processed').length,
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={[{ label: 'Feedback' }]} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] px-[32px] pt-[24px] pb-[28px]">
        <PageHeader />
        <div className="flex min-h-0 w-full flex-1 gap-[20px]">
          <GroupList items={all} active={view} onSelect={setView} />
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-surface outline outline-1 -outline-offset-1 outline-border">
            <div className="flex w-full flex-wrap items-center gap-[12px] border-b border-border px-[20px] py-[14px]">
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="font-display text-[16px] font-medium text-foreground">{activeView.label}</span>
                <span className="text-[13px] text-muted-foreground">
                  {inView.length} feedbacks · {counts.neg} negative · {counts.pos} positive · {counts.trained} already used in training
                </span>
              </div>
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'flex h-[28px] shrink-0 items-center rounded-full px-[12px] text-[13px] font-medium whitespace-nowrap',
                    filter === f.id ? 'bg-surface-raised text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex h-[44px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[20px]">
              <div className="flex flex-1 items-center gap-[10px]">
                <Checkbox
                  state={headerState}
                  disabled={!selectableVisible.length}
                  onClick={() =>
                    setPicked(allVisibleSelected ? selected.filter((id) => !selectableVisible.includes(id)) : [...new Set([...selected, ...selectableVisible])])
                  }
                />
                <span className="text-[13px] text-muted-foreground">Select all {selectableVisible.length} pending</span>
              </div>
              <span className="font-mono text-[11px] text-accent-foreground">{selected.length} selected</span>
            </div>

            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
              {isLoading && <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">Loading…</span>}
              {!isLoading && !visible.length && (
                <span className="px-[20px] py-[16px] text-[13px] text-subtle-foreground">No feedback here. Rate replies in Chats or Executions.</span>
              )}
              {visible.map((f) => (
                <FeedbackRow
                  key={f.id}
                  item={f}
                  selected={selected.includes(f.id)}
                  onToggle={() => toggle(f.id)}
                  onTrain={() => train.mutate([f.id])}
                  onDismiss={() => dismiss.mutate(f.id)}
                  busy={train.isPending}
                />
              ))}
            </div>

            <div className="flex w-full shrink-0 items-center gap-[14px] border-t border-border bg-surface-raised px-[20px] py-[12px]">
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="text-[14px] font-medium text-foreground">Train the agent with {selected.length} feedbacks</span>
                <span className="text-[12px] text-muted-foreground">
                  {train.error ? (
                    <span className="text-error">{train.error.message}</span>
                  ) : (
                    `${neg} negative become fixes, ${selected.length - neg} positive become examples · creates a new prompt version, tested before you promote it`
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPicked([])}
                disabled={!selected.length}
                className="flex h-[36px] items-center justify-center rounded-full px-[16px] text-[14px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={() => train.mutate(selected)}
                disabled={!selected.length || train.isPending}
                className="flex h-[36px] items-center justify-center gap-[6px] rounded-full bg-primary px-[16px] text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span className="text-[14px] font-medium">{train.isPending ? 'Starting…' : 'Train selected'}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
