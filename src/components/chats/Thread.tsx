'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, ArrowUpRight, PanelRightClose, SendHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { cn, unwrap } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { ConfidenceBadge } from '@/components/app/ConfidenceBadge'
import { FeedbackModal, type FeedbackTarget, type Rating } from '@/components/app/FeedbackModal'
import { Markdown } from '@/components/app/Markdown'
import type { ConversationRow } from './data'

export const gradient = 'bg-[linear-gradient(135deg,#ff6600_14.645%,#7a2e00_85.355%)]'
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')

type AssistantRow = Message & { executions: { latency_ms: number | null } | null; feedbacks: { rating: Rating }[] }

export function Thread({ conversation, onTogglePanel }: { conversation: ConversationRow; onTogglePanel: () => void }) {
  const { agent } = useCurrentAgent()
  const { data: initial } = useQuery({
    queryKey: ['messages', conversation.id],
    // Seeds useChat once per mount; dropped on unmount so reopening the chat refetches.
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async () => unwrap(await supabase.from('messages').select('*').eq('conversation_id', conversation.id).order('created_at')) as Message[],
  })

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex h-[72px] shrink-0 items-center gap-[14px] border-b border-border px-[24px]">
        <div className={cn('flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] font-mono text-[13px] font-semibold text-white', gradient)}>
          {conversation.customer_label.match(/\d+/)?.[0] ?? conversation.customer_label.charAt(0)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate font-display text-[17px] font-semibold text-foreground">{conversation.customer_label}</span>
          <span className="truncate text-[12px] text-muted-foreground">
            {agent?.name} · prompt v{conversation.prompt_versions?.version} · <span className="font-mono">{agent?.model}</span>
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <Link
            href="/app/executions"
            className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] text-[14px] font-medium text-foreground hover:bg-surface"
          >
            <Activity size={16} />
            Executions
          </Link>
          <button
            type="button"
            aria-label="Toggle details"
            title="Toggle details"
            onClick={onTogglePanel}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </header>

      {initial ? (
        <ChatBody conversation={conversation} initial={initial} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-subtle-foreground">Loading…</div>
      )}
    </section>
  )
}

function ChatBody({ conversation, initial }: { conversation: ConversationRow; initial: Message[] }) {
  const qc = useQueryClient()
  const conversationId = conversation.id
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<{ target: FeedbackTarget; rating: Rating } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initial.map((m): UIMessage => ({ id: m.id, role: m.role, parts: [{ type: 'text', text: m.content }] })),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Only the new message is sent; the server loads the history from the database.
      prepareSendMessagesRequest: ({ messages }) => ({ body: { conversationId, message: messages[messages.length - 1] } }),
    }),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ['assistant-rows', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['session-executions', conversationId] })
      qc.invalidateQueries({ queryKey: ['counts'] })
    },
  })

  const busy = status === 'submitted' || status === 'streaming'
  const assistantCount = messages.filter((m) => m.role === 'assistant').length

  // Persisted assistant rows (id, confidence, feedback), matched to the streamed messages by order.
  const { data: rows } = useQuery({
    queryKey: ['assistant-rows', conversationId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('messages')
          .select('*, executions(latency_ms), feedbacks(rating)')
          .eq('conversation_id', conversationId)
          .eq('role', 'assistant')
          .order('created_at'),
      ) as unknown as AssistantRow[],
    // Poll while the reply is being saved and scored.
    refetchInterval: (q) => {
      const d = q.state.data ?? []
      return !busy && assistantCount > 0 && (d.length < assistantCount || d.at(-1)?.confidence == null) ? 1500 : false
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const assistantIdx = new Map(messages.filter((m) => m.role === 'assistant').map((m, i) => [m.id, i]))
  const createdAt = new Map(initial.map((m) => [m.id, m.created_at]))
  const lastId = messages.at(-1)?.id

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput('')
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="mt-auto flex w-full flex-col gap-[20px]">
          <div className="flex w-full items-center gap-[12px]">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] tracking-[1px] text-subtle-foreground">
              {conversation.customer_label.toUpperCase()} · {new Date(conversation.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {!messages.length && (
            <p className="py-[40px] text-center text-[14px] text-muted-foreground">Send the first message as if you were the customer.</p>
          )}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')
            if (m.role === 'user') return <CustomerMessage key={m.id} text={text} time={time(createdAt.get(m.id))} />
            const row = rows?.[assistantIdx.get(m.id) ?? -1]
            const streaming = busy && m.id === lastId
            return (
              <AgentMessage
                key={m.id}
                text={text}
                row={streaming ? undefined : row}
                streaming={streaming}
                onRate={(rating) =>
                  row &&
                  setFeedback({
                    rating,
                    target: {
                      messageId: row.id,
                      conversationId,
                      executionId: row.execution_id,
                      promptVersionId: conversation.prompt_version_id,
                      agentId: conversation.agent_id,
                      reply: row.content,
                    },
                  })
                }
              />
            )
          })}

          {status === 'submitted' && (
            <div className="flex items-center gap-[10px] pl-[38px]">
              <div className="flex h-[28px] items-center gap-[4px] rounded-full border border-border bg-surface-raised px-[12px]">
                <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-accent" />
                <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ff660099] [animation-delay:150ms]" />
                <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ff660055] [animation-delay:300ms]" />
              </div>
              <span className="text-[12px] text-muted-foreground">Agent is replying…</span>
            </div>
          )}
          {error && <p className="text-[13px] text-error">{error.message}</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-[8px] px-[24px] pt-[12px] pb-[20px]">
        <div className="flex w-full flex-col gap-[12px] rounded-[20px] border border-border-strong bg-surface pt-[14px] pr-[14px] pb-[10px] pl-[16px]">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Write as if you were the customer…"
            className="w-full resize-none bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle-foreground"
          />
          <div className="flex items-center gap-[4px]">
            <span className="font-mono text-[11px] text-subtle-foreground">Each message creates an execution · Enter to send</span>
            <span className="h-px flex-1" />
            <button
              type="button"
              onClick={send}
              disabled={busy || !input.trim()}
              className="flex h-[34px] items-center gap-[6px] rounded-full bg-accent px-[14px] text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Send
              <SendHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal target={feedback?.target ?? null} initialRating={feedback?.rating ?? 'negative'} onClose={() => setFeedback(null)} />
    </>
  )
}

function CustomerMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex w-full flex-col items-end gap-[4px] pl-[56px]">
      <div className="rounded-[16px_16px_4px_16px] bg-accent px-[14px] py-[10px] text-[14px] leading-[1.45] whitespace-pre-line text-white">{text}</div>
      {time && <span className="pr-[4px] font-mono text-[11px] text-subtle-foreground">{time}</span>}
    </div>
  )
}

function AgentMessage({ text, row, streaming, onRate }: { text: string; row?: AssistantRow; streaming: boolean; onRate: (r: Rating) => void }) {
  const given = new Set(row?.feedbacks.map((f) => f.rating))
  return (
    <div className="flex w-full gap-[10px] pr-[56px]">
      <div className={cn('flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white', gradient)}>AI</div>
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="w-full rounded-[16px_16px_16px_4px] border border-border bg-surface-raised px-[14px] py-[10px] text-foreground">
          <Markdown>{text}</Markdown>
        </div>
        {!streaming && (
          <div className="flex w-full items-center gap-[8px] pl-[4px]">
            <span className="font-mono text-[11px] text-subtle-foreground">{time(row?.created_at)}</span>
            {row?.execution_id && (
              <Link
                href={`/app/executions/${row.execution_id}`}
                className="flex items-center gap-[6px] rounded-full border border-border px-[8px] py-[3px] hover:bg-surface"
              >
                <Activity size={12} className="text-accent" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.execution_id.slice(0, 8)}
                  {row.executions?.latency_ms != null && ` · ${(row.executions.latency_ms / 1000).toFixed(1)}s`}
                </span>
                <ArrowUpRight size={12} className="text-subtle-foreground" />
              </Link>
            )}
            {row && <ConfidenceBadge score={row.confidence} reason={row.confidence_reason} issues={row.confidence_issues} pending />}
            <span className="h-px flex-1" />
            {row &&
              (['positive', 'negative'] as const).map((r) => {
                const Icon = r === 'positive' ? ThumbsUp : ThumbsDown
                const active = given.has(r)
                return (
                  <button
                    key={r}
                    type="button"
                    aria-label={r === 'positive' ? 'Good reply' : 'Bad reply'}
                    title={active ? 'Already rated' : r === 'positive' ? 'Good reply' : 'Bad reply'}
                    disabled={active}
                    onClick={() => onRate(r)}
                    className={cn(
                      'flex h-[26px] w-[26px] items-center justify-center rounded-full',
                      active ? (r === 'positive' ? 'bg-success-soft text-success' : 'bg-error-soft text-error') : 'text-subtle-foreground hover:bg-surface-raised',
                    )}
                  >
                    <Icon size={14} />
                  </button>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
