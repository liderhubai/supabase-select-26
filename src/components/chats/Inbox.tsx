'use client'

import { ListFilter, Search, SquarePen, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { conversations, tagToneClass, type Conversation } from './data'

const gradient = 'bg-[linear-gradient(135deg,#ff6600_14.645%,#7a2e00_85.355%)]'

export function Inbox({ selected, onSelect }: { selected: number; onSelect: (id: number) => void }) {
  return (
    <section className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
      <header className="flex h-[72px] shrink-0 items-center gap-[8px] border-b border-border pr-[16px] pl-[20px]">
        <div className="flex flex-1 items-center gap-[8px]">
          <span className="font-display text-[17px] font-semibold text-foreground">Conversas</span>
          <span className="rounded-full bg-muted px-[7px] py-[2px] font-mono text-[11px] text-muted-foreground">24</span>
        </div>
        <button type="button" aria-label="Filtrar" className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-raised">
          <ListFilter size={16} />
        </button>
        <button type="button" aria-label="Nova conversa" className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-accent text-white">
          <SquarePen size={16} />
        </button>
      </header>

      <div className="flex flex-col gap-[10px] px-[16px] pt-[14px] pb-[12px]">
        <label className="flex h-[36px] w-full items-center gap-[8px] rounded-[6px] border border-border bg-background px-[10px]">
          <Search size={15} className="shrink-0 text-subtle-foreground" />
          <input
            placeholder="Buscar mensagem ou sessão…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground"
          />
          <span className="font-mono text-[11px] text-subtle-foreground">⌘K</span>
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {conversations.map((c) => (
          <ConversationItem key={c.id} c={c} active={c.id === selected} onClick={() => onSelect(c.id)} />
        ))}
      </div>
    </section>
  )
}

function ConversationItem({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  const bold = c.processing || !!c.unread
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full shrink-0 gap-[12px] border-b border-border py-[12px] pr-[16px] pl-[20px] text-left transition-colors',
        active ? 'bg-surface-raised' : 'hover:bg-surface-raised/60',
      )}
    >
      {active && <span className="absolute top-0 left-0 h-full w-[3px] bg-accent" />}
      <div
        className={cn(
          'relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[12px] font-mono text-[12px] font-semibold',
          active ? cn(gradient, 'text-white') : 'bg-muted text-muted-foreground',
        )}
      >
        {c.id}
        {c.status && (
          <span
            className={cn(
              'absolute top-[26px] left-[26px] h-[12px] w-[12px] rounded-full border-2',
              c.status === 'success' ? 'bg-success' : 'bg-warning',
              active ? 'border-surface-raised' : 'border-surface',
            )}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className={cn('flex-1 truncate text-[14px] text-foreground', bold ? 'font-semibold' : 'font-medium')}>
            Sessão #{c.id}
          </span>
          <span className={cn('font-mono text-[11px]', c.unread ? 'text-accent' : 'text-subtle-foreground')}>{c.when}</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13px]',
              c.processing ? 'text-accent-foreground italic' : c.unread ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {c.preview}
          </span>
          {c.unread ? (
            <span className="flex h-[18px] items-center justify-center rounded-full bg-accent px-[6px] text-[11px] font-semibold text-white">
              {c.unread}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-[10px] pt-[2px]">
          {c.tag && (
            <span className={cn('rounded-[6px] px-[6px] py-[2px] text-[11px] font-medium', tagToneClass[c.tag.tone])}>{c.tag.label}</span>
          )}
          <span className="h-px flex-1" />
          {c.up ? (
            <span className="flex items-center gap-[3px] text-success">
              <ThumbsUp size={12} />
              <span className="font-mono text-[11px]">{c.up}</span>
            </span>
          ) : null}
          {c.down ? (
            <span className="flex items-center gap-[3px] text-error">
              <ThumbsDown size={12} />
              <span className="font-mono text-[11px]">{c.down}</span>
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
