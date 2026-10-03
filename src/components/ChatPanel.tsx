'use client'

import { useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Feedback, Message } from '@/lib/types'
import { Button } from '@/components/ui'
import { FeedbackModal } from '@/components/FeedbackModal'
import { cn, unwrap } from '@/lib/utils'

type Conv = { id: string; agent_id: string; prompt_version_id: string }

export function ConfidenceBadge({ score, reason }: { score: number | null; reason?: string | null }) {
  if (score == null) return <span className="text-xs text-zinc-400">scoring confidence…</span>
  const tone = score >= 80 ? 'bg-emerald-50 text-emerald-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
  return (
    <span title={reason ?? undefined} className={cn('rounded px-1.5 py-0.5 text-xs font-medium tabular-nums', tone)}>
      confidence {score}%
    </span>
  )
}

const toUIMessages = (rows: Message[]): UIMessage[] =>
  rows.map((m) => ({ id: m.id, role: m.role, parts: [{ type: 'text', text: m.content }] }))

/** Streaming chat via the `/api/chat` API route. The database is the source of truth for history. */
export function ChatPanel({ conversation, initialMessages, onTurnEnd }: { conversation: Conv; initialMessages: Message[]; onTurnEnd?: () => void }) {
  const conversationId = conversation.id
  const [input, setInput] = useState('')
  const [feedbackFor, setFeedbackFor] = useState<{ message: Message; rating: 'positive' | 'negative' } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const qc = useQueryClient()
  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: toUIMessages(initialMessages),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Send only the new message; the server loads history from the database.
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { conversationId, message: messages[messages.length - 1] },
      }),
    }),
    onFinish: () => {
      onTurnEnd?.()
      setTimeout(() => qc.invalidateQueries({ queryKey: ['chat-meta', conversationId] }), 800)
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const busy = status === 'submitted' || status === 'streaming'

  const assistantCount = messages.filter((m) => m.role === 'assistant').length

  // Persisted assistant rows (ids, confidence) matched to the streamed UI messages by order.
  const { data: rows } = useQuery({
    queryKey: ['chat-meta', conversationId],
    queryFn: async () =>
      (unwrap(await supabase.from('messages').select('*').eq('conversation_id', conversationId).eq('role', 'assistant').order('created_at')) as Message[]),
    // Poll while the scorer is still working on the latest reply.
    refetchInterval: (q) => {
      const d = q.state.data ?? []
      return !busy && assistantCount > 0 && (d.length < assistantCount || d.at(-1)?.confidence == null) ? 1500 : false
    },
  })
  const { data: feedbacks } = useQuery({
    queryKey: ['feedbacks', conversationId],
    queryFn: async () => unwrap(await supabase.from('feedbacks').select('*').eq('conversation_id', conversationId)) as Feedback[],
  })
  const assistantIdx = new Map(messages.filter((m) => m.role === 'assistant').map((m, i) => [m.id, i]))
  const lastId = messages.at(-1)?.id

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages.length && <p className="mt-10 text-center text-sm text-zinc-400">Send the first message as if you were the customer.</p>}
        {messages.map((m) => {
          const row = m.role === 'assistant' ? rows?.[assistantIdx.get(m.id) ?? -1] : undefined
          const fbs = row ? (feedbacks?.filter((f) => f.message_id === row.id) ?? []) : []
          const streaming = busy && m.id === lastId
          return (
            <div key={m.id} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  m.role === 'user' ? 'rounded-br-sm bg-zinc-900 text-white' : 'rounded-bl-sm bg-zinc-100 text-zinc-900',
                )}
              >
                <Markdown invert={m.role === 'user'}>{m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}</Markdown>
              </div>
              {m.role === 'assistant' && !streaming && (
                <div className="mt-1 flex items-center gap-1 text-zinc-400">
                  {row ? (
                    <>
                      {(['positive', 'negative'] as const).map((rating) => {
                        const given = fbs.some((f) => f.rating === rating)
                        const Icon = rating === 'positive' ? ThumbsUp : ThumbsDown
                        return (
                          <button
                            key={rating}
                            title={rating === 'positive' ? 'Positive feedback' : 'Negative feedback'}
                            className={cn(
                              'rounded p-1',
                              rating === 'positive' ? 'hover:bg-emerald-50 hover:text-emerald-700' : 'hover:bg-red-50 hover:text-red-700',
                              given && (rating === 'positive' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'),
                            )}
                            onClick={() => setFeedbackFor({ message: row, rating })}
                          >
                            <Icon size={14} />
                          </button>
                        )
                      })}
                      <ConfidenceBadge score={row.confidence} reason={row.confidence_reason} />
                    </>
                  ) : (
                    <span className="text-xs">saving…</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {status === 'submitted' && <div className="text-xs text-zinc-400">Agent is typing…</div>}
        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error.message}</div>}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex gap-2 border-t border-zinc-200 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim() || busy) return
          sendMessage({ text: input })
          setInput('')
        }}
      >
        <input
          className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          placeholder="Write as the customer…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
          <Send size={15} />
        </Button>
      </form>
      {feedbackFor && (
        <FeedbackModal
          conv={{ id: conversationId, prompt_version_id: conversation.prompt_version_id, agent_id: conversation.agent_id }}
          target={feedbackFor}
          onClose={() => setFeedbackFor(null)}
        />
      )}
    </div>
  )
}
