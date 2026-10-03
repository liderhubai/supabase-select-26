'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/utils'
import type { Agent } from '@/lib/types'
import { useAgentSelection } from '@/components/app/Providers'

export type AgentWithVersion = Agent & { production: { version: number } | null }

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('agents')
          .select('*, production:prompt_versions!agents_production_version_fk(version)')
          .order('created_at'),
      ) as AgentWithVersion[],
  })
}

/** The agent picked in the sidebar (falls back to the first agent). */
export function useCurrentAgent() {
  const { agentId, setAgentId } = useAgentSelection()
  const { data: agents, isLoading } = useAgents()
  const agent = agents?.find((a) => a.id === agentId) ?? agents?.[0] ?? null
  return { agent, agents: agents ?? [], setAgentId, isLoading }
}

export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json as T
}

/** Last customer message sent to the model in a chat execution. */
export function lastUserMessage(input: { messages?: { role: string; content: unknown }[] } | null | undefined) {
  const msg = [...(input?.messages ?? [])].reverse().find((m) => m.role === 'user')
  return typeof msg?.content === 'string' ? msg.content : ''
}
