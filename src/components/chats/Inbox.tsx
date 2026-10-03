'use client'

import { useState } from 'react'
import { Search, SquarePen, ThumbsDown, ThumbsUp } from 'lucide-react'
import { ago, cn } from '@/lib/utils'
import { lastActivity, minConfidence, type ConversationRow } from './data'

const gradient = 'bg-[linear-gradient(135deg,#ff6600_14.645%,#7a2e00_85.355%)]'

export function Inbox({
  conversations,
  loading,
  selected,
  onSelect,
  onCreate,
  creating,
  createError,
}: {
  conversations: ConversationRow[]
  loading: boolean
  selected?: string
  onSelect: (id: string) => void
  onCreate: () => void
  creating: boolean
  createError?: string
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible = q
    ? conversations.filter((c) => c.customer_label.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)))
    : conversations

  return (
    <section className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
      <header className="flex h-[72px] shrink-0 items-center gap-[8px] border-b border-border pr-[16px] pl-[20px]">
        <div className="flex flex-1 items-center gap-[8px]">
          <span className="font-display text-[17px] font-semibold text-foreground">Conversations</span>
          <span className="rounded-full bg-muted px-[7px] py-[2px] font-mono text-[11px] text-muted-foreground">{conversations.length}</span>
        </div>
        <button
          type="button"
          aria-label="New conversation"
          title="New conversation"
          onClick={onCreate}
          disabled={creating}
          className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-accent text-white disabled:opacity-50"
        >
          <SquarePen size={16} />
        </button>
      </header>

      <div className="flex flex-col gap-[10px] px-[16px] pt-[14px] pb-[12px]">
        <label className="flex h-[36px] w-full items-center gap-[8px] rounded-[6px] border border-border bg-background px-[10px]">
          <Search size={15} className="shrink-0 text-subtle-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages or sessions…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground"
          />
        </label>
        {createError && <span className="text-[12px] text-error">{createError}</span>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading && <span className="px-[20px] py-[12px] text-[13px] text-subtle-foreground">Loading…</span>}
        {!loading && !visible.length && (
          <span className="px-[20px] py-[12px] text-[13px] text-subtle-foreground">{q ? 'No matches.' : 'No conversations yet.'}</span>
        )}
        {visible.map((c) => (
          <ConversationItem key={c.id} c={c} active={c.id === selected} onClick={() => onSelect(c.id)} />
        ))}
      </div>
    </section>
  )
}

function ConversationItem({ c, active, onClick }: { c: ConversationRow; active: boolean; onClick: () => void }) {
  const last = c.messages.at(-1)
  const preview = last ? `${last.role === 'user' ? 'Customer' : 'Agent'}: ${last.content}` : 'No messages yet'
  const up = c.feedbacks.filter((f) => f.rating === 'positive').length
  const down = c.feedbacks.length - up
  const min = minConfidence(c)
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
        {c.customer_label.match(/\d+/)?.[0] ?? c.customer_label.charAt(0)}
        {min != null && (
          <span
            title={`Lowest reply confidence: ${min}%`}
            className={cn(
              'absolute top-[26px] left-[26px] h-[12px] w-[12px] rounded-full border-2',
              min >= 60 ? 'bg-success' : 'bg-warning',
              active ? 'border-surface-raised' : 'border-surface',
            )}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="flex-1 truncate text-[14px] font-medium text-foreground">{c.customer_label}</span>
          <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">{ago(lastActivity(c))}</span>
        </div>
        <span className="truncate text-[13px] text-muted-foreground">{preview}</span>
        <div className="flex items-center gap-[10px] pt-[2px]">
          {c.prompt_versions && (
            <span className="rounded-[6px] border border-border px-[6px] py-[1px] font-mono text-[11px] text-muted-foreground">v{c.prompt_versions.version}</span>
          )}
          <span className="h-px flex-1" />
          {up > 0 && (
            <span className="flex items-center gap-[3px] text-success">
              <ThumbsUp size={12} />
              <span className="font-mono text-[11px]">{up}</span>
            </span>
          )}
          {down > 0 && (
            <span className="flex items-center gap-[3px] text-error">
              <ThumbsDown size={12} />
              <span className="font-mono text-[11px]">{down}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
