'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { callApi, useCurrentAgent } from '@/lib/queries'
import { unwrap } from '@/lib/utils'
import { TopBar } from '@/components/app/TopBar'
import type { FeedbackItem } from './data'
import { FeedbackDrawer } from './FeedbackDrawer'
import { FeedbackTable } from './FeedbackTable'
import { PageHeader } from './PageHeader'

export function FeedbackScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { agent } = useCurrentAgent()
  const [openId, setOpenId] = useState<string | null>(null)

  const { data: items, isLoading } = useQuery({
    queryKey: ['feedbacks', agent?.id],
    enabled: !!agent,
    refetchInterval: 10_000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('feedbacks')
          .select('*, messages(content)')
          .eq('agent_id', agent!.id)
          .neq('status', 'dismissed')
          .order('created_at', { ascending: false }),
      ) as unknown as FeedbackItem[],
  })

  const all = items ?? []
  const openIdx = all.findIndex((f) => f.id === openId)
  const pending = all.filter((f) => f.status === 'pending').map((f) => f.id)

  const train = useMutation({
    mutationFn: (feedbackIds: string[]) => callApi<{ jobId: string }>('optimize', { agentId: agent!.id, feedbackIds }),
    onSuccess: ({ jobId }) => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['counts'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      router.push(`/app/trainings/${jobId}`)
    },
  })

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={[{ label: 'Feedback' }]} />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[24px] px-[32px] pt-[24px] pb-[28px]">
        <PageHeader pending={pending.length} training={train.isPending} onTrain={() => train.mutate(pending)} />
        {train.error && <span className="text-[13px] text-error">{train.error.message}</span>}
        {isLoading && <span className="text-[13px] text-subtle-foreground">Loading…</span>}
        {!isLoading && !all.length && <span className="text-[13px] text-subtle-foreground">No feedback yet. Rate replies in Chats or Executions.</span>}
        {!!all.length && <FeedbackTable items={all} agentName={agent?.name ?? ''} onOpen={setOpenId} />}
        {agent && openIdx >= 0 && (
          <FeedbackDrawer item={all[openIdx]} number={all.length - openIdx} agentId={agent.id} agentName={agent.name} onClose={() => setOpenId(null)} />
        )}
      </div>
    </div>
  )
}
