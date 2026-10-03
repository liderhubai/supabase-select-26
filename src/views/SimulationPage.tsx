'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, Plus } from 'lucide-react'
import { useAgents, useVersions } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { ago, cn, unwrap } from '@/lib/utils'
import type { Conversation, Message } from '@/lib/types'
import { ChatPanel } from '@/components/ChatPanel'
import { Button, Card, Empty, Label, PageHeader, Select, StatusBadge } from '@/components/ui'

export default function SimulationPage() {
  const qc = useQueryClient()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { data: agents } = useAgents()
  const agentId = params.get('agent') ?? agents?.[0]?.id ?? ''
  const conversationId = params.get('c')
  const agent = agents?.find((a) => a.id === agentId)
  const { data: versions } = useVersions(agentId || undefined)
  const versionId = params.get('v') ?? agent?.production_version_id ?? ''

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k))
    router.replace(`${pathname}?${next}`)
  }

  useEffect(() => {
    if (!params.get('agent') && agents?.[0]) update({ agent: agents[0].id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents])

  const convKey = ['conversations', 'simulation', agentId]
  const { data: conversations } = useQuery({
    queryKey: convKey,
    enabled: !!agentId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('conversations')
          .select('*, prompt_versions(version)')
          .eq('agent_id', agentId)
          .eq('source', 'simulation')
          .order('created_at', { ascending: false })
          .limit(30),
      ) as (Conversation & { prompt_versions: { version: number } })[],
  })

  const { data: messages, isFetched } = useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    staleTime: Infinity,
    queryFn: async () =>
      unwrap(await supabase.from('messages').select('*').eq('conversation_id', conversationId!).order('created_at')) as Message[],
  })

  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await supabase
          .from('conversations')
          .insert({ agent_id: agentId, prompt_version_id: versionId, source: 'simulation', customer_label: `Customer #${Math.floor(Math.random() * 9000 + 1000)}` })
          .select('id')
          .single(),
      ),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: convKey })
      update({ c: c.id })
    },
  })

  const selectedVersion = versions?.find((v) => v.id === versionId)

  return (
    <>
      <PageHeader title="Customer service simulation" description="Chat with the agent as if you were the customer. Each turn creates a message and a trace in the database." />
      {!agents?.length ? (
        <Empty>
          Create an agent first in <Link href="/agents" className="underline">Agents</Link>.
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <Card className="space-y-3 p-3">
              <div>
                <Label>Agent</Label>
                <Select value={agentId} onValueChange={(v) => update({ agent: v, v: null, c: null })} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
              </div>
              <div>
                <Label hint="default: production">Prompt version</Label>
                <Select
                  value={versionId}
                  onValueChange={(v) => update({ v, c: null })}
                  options={(versions ?? [])
                    .filter((v) => v.status !== 'archived' && v.status !== 'rejected')
                    .map((v) => ({ value: v.id, label: `v${v.version} — ${v.status}` }))}
                />
              </div>
              <Button className="w-full" onClick={() => create.mutate()} disabled={!versionId || create.isPending}>
                <Plus size={15} /> New conversation
              </Button>
            </Card>

            <Card className="max-h-[50vh] overflow-y-auto">
              <div className="border-b border-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500">Recent conversations</div>
              {conversations?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update({ c: c.id })}
                  className={cn('block w-full border-b border-zinc-50 px-3 py-2 text-left text-sm hover:bg-zinc-50', c.id === conversationId && 'bg-zinc-100')}
                >
                  <div className="font-medium">{c.customer_label}</div>
                  <div className="text-xs text-zinc-500">
                    v{c.prompt_versions.version} · {ago(c.created_at)}
                  </div>
                </button>
              ))}
              {conversations && !conversations.length && <p className="p-3 text-sm text-zinc-400">None yet.</p>}
            </Card>
          </div>

          <Card className="flex h-[calc(100vh-180px)] min-h-[480px] flex-col overflow-hidden">
            {conversationId && isFetched && messages ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent?.name}</span>
                    {selectedVersion && <StatusBadge status={selectedVersion.status} />}
                  </div>
                  <Link href={`/observability/${conversationId}`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
                    <Activity size={13} /> view in observability
                  </Link>
                </div>
                <div className="min-h-0 flex-1">
                  <ChatPanel
                    key={conversationId}
                    conversation={conversations?.find((c) => c.id === conversationId) ?? { id: conversationId, agent_id: agentId, prompt_version_id: versionId }}
                    initialMessages={messages}
                    onTurnEnd={() => qc.invalidateQueries({ queryKey: ['observability'] })}
                  />
                </div>
              </>
            ) : (
              <div className="m-auto text-sm text-zinc-400">Select or create a conversation.</div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
