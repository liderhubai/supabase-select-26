'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowUpRight, PanelRightClose, Plus, SendHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messages, type Message } from './data'

const gradient = 'bg-[linear-gradient(135deg,#ff6600_14.645%,#7a2e00_85.355%)]'

export function Thread({ sessionId, onTogglePanel }: { sessionId: number; onTogglePanel: () => void }) {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex h-[72px] shrink-0 items-center gap-[14px] border-b border-border px-[24px]">
        <div className={cn('flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] font-mono text-[13px] font-semibold text-white', gradient)}>
          {sessionId}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="font-display text-[17px] font-semibold text-foreground">Sessão #{sessionId}</span>
          <div className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            <span className="text-[12px] text-muted-foreground">Ativa · Agente SDR v3 · gpt-4.1</span>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <Link
            href="/app/execucoes"
            className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] text-[14px] leading-[1.43] font-medium text-foreground hover:bg-surface"
          >
            <Activity size={16} />
            Execuções
          </Link>
          <button
            type="button"
            aria-label="Prompt do agente"
            onClick={onTogglePanel}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-end gap-[18px] overflow-y-auto p-[24px]">
        <div className="flex w-full flex-col gap-[20px]">
          <div className="flex w-full items-center gap-[12px]">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] tracking-[1px] text-subtle-foreground">SESSÃO #{sessionId} · HOJE 14:02</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          {messages.map((m, i) => (m.from === 'cliente' ? <ClientMessage key={i} m={m} /> : <AgentMessage key={i} m={m} />))}
          <div className="flex items-center gap-[10px] pl-[38px]">
            <div className="flex h-[28px] items-center gap-[4px] rounded-full border border-border bg-surface-raised px-[12px]">
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-accent" />
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ff660099] [animation-delay:150ms]" />
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ff660055] [animation-delay:300ms]" />
            </div>
            <span className="text-[12px] text-muted-foreground">Processando · chamando </span>
            <span className="font-mono text-[11px] text-accent-foreground">calendar.find_slots</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-[8px] px-[24px] pt-[12px] pb-[20px]">
        <div className="flex w-full flex-col gap-[12px] rounded-[20px] border border-border-strong bg-surface pt-[14px] pr-[14px] pb-[10px] pl-[16px]">
          <textarea
            rows={1}
            placeholder="Escreva como se fosse o cliente…"
            className="w-full resize-none bg-transparent text-[14px] text-foreground outline-none placeholder:text-subtle-foreground"
          />
          <div className="flex items-center gap-[4px]">
            <button type="button" aria-label="Anexar" className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised">
              <Plus size={18} />
            </button>
            <span className="h-px flex-1" />
            <span className="font-mono text-[11px] text-subtle-foreground">Cada mensagem gera uma execução</span>
            <button type="button" className="ml-[4px] flex h-[34px] items-center gap-[6px] rounded-full bg-accent px-[14px] text-[13px] font-semibold text-white">
              Enviar
              <SendHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ClientMessage({ m }: { m: Extract<Message, { from: 'cliente' }> }) {
  return (
    <div className="flex w-full flex-col items-end gap-[4px]">
      <div className="rounded-[16px_16px_4px_16px] bg-accent px-[14px] py-[10px] text-[14px] leading-[1.45] text-white">{m.text}</div>
      <div className="pt-[2px] pr-[4px]">
        <span className="font-mono text-[11px] text-subtle-foreground">{m.time}</span>
      </div>
    </div>
  )
}

function AgentMessage({ m }: { m: Extract<Message, { from: 'agente' }> }) {
  const [vote, setVote] = useState<'up' | 'down' | undefined>(m.vote)
  return (
    <div className="flex w-full gap-[10px] pr-[56px]">
      <div className={cn('flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white', gradient)}>S</div>
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="w-full rounded-[16px_16px_16px_4px] border border-border bg-surface-raised px-[14px] py-[10px] text-[14px] leading-[1.45] text-foreground">
          {m.text}
        </div>
        <div className="flex w-full items-center gap-[8px] pl-[4px]">
          <span className="font-mono text-[11px] text-subtle-foreground">{m.time}</span>
          <Link href="/app/execucoes" className="flex items-center gap-[6px] rounded-full border border-border px-[8px] py-[3px] hover:bg-surface">
            <Activity size={12} className="text-accent" />
            <span className="font-mono text-[11px] text-muted-foreground">{m.exec}</span>
            <ArrowUpRight size={12} className="text-subtle-foreground" />
          </Link>
          <span className="h-px flex-1" />
          <button
            type="button"
            aria-label="Thumbs up"
            onClick={() => setVote(vote === 'up' ? undefined : 'up')}
            className={cn('flex h-[26px] w-[26px] items-center justify-center rounded-full', vote === 'up' ? 'bg-success-soft text-success' : 'text-subtle-foreground hover:bg-surface-raised')}
          >
            <ThumbsUp size={14} />
          </button>
          <button
            type="button"
            aria-label="Thumbs down"
            onClick={() => setVote(vote === 'down' ? undefined : 'down')}
            className={cn('flex h-[26px] w-[26px] items-center justify-center rounded-full', vote === 'down' ? 'bg-error-soft text-error' : 'text-subtle-foreground hover:bg-surface-raised')}
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
