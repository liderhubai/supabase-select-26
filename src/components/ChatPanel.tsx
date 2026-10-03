'use client'

import { useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Send } from 'lucide-react'
import type { Message } from '@/lib/types'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const toUIMessages = (rows: Message[]): UIMessage[] =>
  rows.map((m) => ({ id: m.id, role: m.role, parts: [{ type: 'text', text: m.content }] }))

/** Chat com streaming via API route `/api/chat`. O banco é a fonte da verdade do histórico. */
export function ChatPanel({ conversationId, initialMessages, onTurnEnd }: { conversationId: string; initialMessages: Message[]; onTurnEnd?: () => void }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: toUIMessages(initialMessages),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Envia só a mensagem nova; o servidor carrega o histórico do banco.
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { conversationId, message: messages[messages.length - 1] },
      }),
    }),
    onFinish: () => onTurnEnd?.(),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const busy = status === 'submitted' || status === 'streaming'

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages.length && <p className="mt-10 text-center text-sm text-zinc-400">Envie a primeira mensagem como se fosse o cliente.</p>}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                m.role === 'user' ? 'rounded-br-sm bg-zinc-900 text-white' : 'rounded-bl-sm bg-zinc-100 text-zinc-900',
              )}
            >
              <Markdown invert={m.role === 'user'}>{m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}</Markdown>
            </div>
          </div>
        ))}
        {status === 'submitted' && <div className="text-xs text-zinc-400">Agente digitando…</div>}
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
          placeholder="Escreva como cliente…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Enviar">
          <Send size={15} />
        </Button>
      </form>
    </div>
  )
}
