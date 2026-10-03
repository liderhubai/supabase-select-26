export type ConversationRow = {
  id: string
  agent_id: string
  prompt_version_id: string
  customer_label: string
  created_at: string
  prompt_versions: { version: number } | null
  messages: { role: 'user' | 'assistant'; content: string; created_at: string; confidence: number | null }[]
  feedbacks: { rating: 'positive' | 'negative' }[]
}

export const lastActivity = (c: ConversationRow) => c.messages.at(-1)?.created_at ?? c.created_at

/** Lowest reply confidence in the conversation (null while unscored). */
export const minConfidence = (c: ConversationRow) => {
  const scores = c.messages.filter((m) => m.role === 'assistant' && m.confidence != null).map((m) => m.confidence!)
  return scores.length ? Math.min(...scores) : null
}
