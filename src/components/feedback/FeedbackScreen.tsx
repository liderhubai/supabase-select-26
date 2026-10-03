'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { feedbacks, filters, groups, initialSelected } from './data'
import { FeedbackRow, Checkbox } from './FeedbackRow'
import { GroupList } from './GroupList'
import { groupColor, groupIcons } from './icons'
import { PageHeader } from './PageHeader'
import { TopBar } from './TopBar'

// Main (E8hZyY) da tela Feedback — 1192×960 no design.
export function FeedbackScreen() {
  const [group, setGroup] = useState('objecoes')
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const [selected, setSelected] = useState<string[]>(initialSelected)

  const activeGroup = groups.find((g) => g.id === group) ?? groups[2]
  const GroupIcon = groupIcons[activeGroup.icon]
  const visible = feedbacks.filter((f) =>
    filter === '👍 Positivos' ? f.kind === 'positive'
      : filter === '👎 Negativos' ? f.kind === 'negative'
        : filter === 'Pendentes' ? !f.trained
          : true,
  )
  const selectable = feedbacks.filter((f) => !f.trained).map((f) => f.id)
  const total = 14
  const chosen = feedbacks.filter((f) => selected.includes(f.id))
  const neg = chosen.filter((f) => f.kind === 'negative').length
  const pos = chosen.length - neg
  const headerState = selected.length === 0 ? 'unchecked' : selected.length >= selectable.length ? 'checked' : 'mixed'

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] px-[32px] pt-[24px] pb-[28px]">
        <PageHeader />
        <div className="flex min-h-0 w-full flex-1 gap-[20px]">
          <GroupList active={group} onSelect={setGroup} />
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-surface outline outline-1 -outline-offset-1 outline-border">
            {/* Header */}
            <div className="flex w-full items-center gap-[12px] border-b border-border px-[20px] py-[14px]">
              <div className="flex flex-1 flex-col gap-[2px]">
                <div className="flex items-center gap-[8px]">
                  <GroupIcon size={15} className={activeGroup.color ? groupColor[activeGroup.color] : 'text-muted-foreground'} />
                  <span className="font-display text-[16px] font-medium text-foreground">{activeGroup.label}</span>
                </div>
                <span className="text-[13px] text-muted-foreground">
                  14 feedbacks · 9 negativos · 5 positivos · 3 já usados em treino
                </span>
              </div>
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex h-[28px] items-center rounded-full px-[12px] text-[13px] font-medium',
                    filter === f ? 'bg-surface-raised text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Seleção */}
            <div className="flex h-[44px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[20px]">
              <div className="flex flex-1 items-center gap-[10px]">
                <Checkbox
                  state={headerState}
                  onClick={() => setSelected(headerState === 'checked' ? [] : selectable)}
                />
                <span className="text-[13px] text-muted-foreground">Selecionar todos os {total}</span>
              </div>
              <span className="font-mono text-[11px] text-accent-foreground">{selected.length} selecionados</span>
            </div>

            {/* Feedbacks */}
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
              {visible.map((f) => (
                <FeedbackRow key={f.id} item={f} selected={selected.includes(f.id)} onToggle={() => !f.trained && toggle(f.id)} />
              ))}
            </div>

            {/* Barra de treino */}
            <div className="flex w-full shrink-0 items-center gap-[14px] border-t border-border bg-surface-raised px-[20px] py-[12px]">
              <div className="flex flex-1 flex-col gap-[2px]">
                <span className="text-[14px] font-medium text-foreground">Treinar o agente com {selected.length} feedbacks</span>
                <span className="text-[12px] text-muted-foreground">
                  {neg} negativos viram correções, {pos} positivos viram exemplos · gera o prompt v4
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="flex h-[36px] items-center justify-center rounded-full px-[16px] text-[14px] leading-[1.43] font-medium text-muted-foreground hover:text-foreground"
              >
                Limpar seleção
              </button>
              <button
                type="button"
                className="flex h-[36px] items-center justify-center gap-[6px] rounded-full bg-primary px-[16px] text-primary-foreground hover:opacity-90"
              >
                <Sparkles size={16} />
                <span className="text-[14px] leading-[1.43] font-medium">Treinar selecionados</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
