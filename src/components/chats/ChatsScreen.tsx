'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { unwrap } from '@/lib/utils'
import { lastActivity, type ConversationRow } from './data'
import { Inbox } from './Inbox'
import { Thread } from './Thread'
import { DetailsPanel } from './DetailsPanel'

export function ChatsScreen({ initialId }: { initialId?: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { agent } = useCurrentAgent()
  const [selected, setSelected] = useState<string | undefined>(initialId)
  const [panelOpen, setPanelOpen] = useState(true)

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', agent?.id],
    enabled: !!agent,
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('conversations')
          .select('id, agent_id, prompt_version_id, customer_label, created_at, prompt_versions(version), messages(role, content, created_at, confidence), feedbacks(rating)')
          .eq('agent_id', agent!.id)
          .eq('source', 'simulation')
          .order('created_at', { referencedTable: 'messages' }),
      ) as unknown as ConversationRow[]
      return rows.sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)))
    },
  })

  const current = conversations?.find((c) => c.id === selected) ?? conversations?.[0]

  const select = (id: string) => {
    setSelected(id)
    router.replace(`/app/chats?c=${id}`, { scroll: false })
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!agent?.production_version_id) throw new Error('This agent has no production version.')
      const row = unwrap(
        await supabase
          .from('conversations')
          .insert({
            agent_id: agent.id,
            prompt_version_id: agent.production_version_id,
            customer_label: `Session #${(conversations?.length ?? 0) + 1}`,
            source: 'simulation',
          })
          .select('id')
          .single(),
      )
      return row.id as string
    },
    onSuccess: async (id) => {
      await qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['counts'] })
      select(id)
    },
  })

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Inbox
        conversations={conversations ?? []}
        loading={isLoading}
        selected={current?.id}
        onSelect={select}
        onCreate={() => create.mutate()}
        creating={create.isPending}
        createError={create.error?.message}
      />
      {current ? (
        <>
          <Thread key={current.id} conversation={current} onTogglePanel={() => setPanelOpen((o) => !o)} />
          {panelOpen && <DetailsPanel conversation={current} onClose={() => setPanelOpen(false)} />}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-[12px] text-center">
          <span className="font-display text-[18px] font-medium text-foreground">{isLoading ? 'Loading…' : 'No conversations yet'}</span>
          {!isLoading && (
            <>
              <span className="text-[14px] text-muted-foreground">Start a session and talk to the agent as if you were the customer.</span>
              <button
                type="button"
                onClick={() => create.mutate()}
                disabled={create.isPending}
                className="flex h-[36px] items-center rounded-full bg-primary px-[16px] text-[14px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                New conversation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
