'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { unwrap } from './utils'
import type { Agent, PromptVersion } from './types'

/** POST para uma API route do próprio app (`/api/<name>`). */
export async function callApi<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status} em ${name}`)
  return data as T
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => unwrap(await supabase.from('agents').select('*').order('created_at')) as Agent[],
  })
}

export function useVersions(agentId?: string) {
  return useQuery({
    queryKey: ['versions', agentId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('prompt_versions').select('*').order('version', { ascending: false })
      if (agentId) q = q.eq('agent_id', agentId)
      return unwrap(await q) as PromptVersion[]
    },
  })
}

/** Invalida queries quando uma tabela muda (Supabase Realtime). */
export function useRealtime(table: string, queryKeys: unknown[][]) {
  const qc = useQueryClient()
  const keys = JSON.stringify(queryKeys)
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${keys}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        for (const k of JSON.parse(keys) as unknown[][]) qc.invalidateQueries({ queryKey: k })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, keys, qc])
}
