'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/utils'
import type { Execution } from '@/lib/types'

export type ExecutionRow = Pick<
  Execution,
  'id' | 'created_at' | 'latency_ms' | 'error' | 'model' | 'input' | 'output_tokens' | 'input_tokens' | 'prompt_version_id'
> & {
  conversations: { id: string; customer_label: string; agent_id: string }
  messages: { id: string; confidence: number | null }[]
  feedbacks: { rating: 'positive' | 'negative' }[]
}

/** Agent replies (kind = chat) for the agent, newest first. */
export function useExecutions(agentId: string | undefined) {
  return useQuery({
    queryKey: ['executions', agentId],
    enabled: !!agentId,
    refetchInterval: 10_000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('executions')
          .select(
            'id, created_at, latency_ms, error, model, input, input_tokens, output_tokens, prompt_version_id, conversations!inner(id, customer_label, agent_id), messages(id, confidence), feedbacks(rating)',
          )
          .eq('kind', 'chat')
          .eq('conversations.agent_id', agentId!)
          .order('created_at', { ascending: false })
          .limit(500),
      ) as unknown as ExecutionRow[],
  })
}

export const feedbackOf = (r: ExecutionRow) =>
  r.feedbacks.some((f) => f.rating === 'negative') ? 'negative' : r.feedbacks.length ? 'positive' : null
