import { diffLines } from 'diff'
import { cn } from '@/lib/utils'

type Side = { text: string; changed: boolean } | null

/** Side-by-side line diff: removed lines on the left, added on the right, hatched filler where one side has nothing. */
export function PromptDiff({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  const rows: [Side, Side][] = []
  const parts = diffLines(before, after)
  const lines = (v: string) => v.replace(/\n$/, '').split('\n')
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (!p.added && !p.removed) {
      for (const l of lines(p.value)) rows.push([{ text: l, changed: false }, { text: l, changed: false }])
      continue
    }
    const removed = p.removed ? lines(p.value) : []
    const added = p.removed && parts[i + 1]?.added ? lines(parts[++i].value) : p.added ? lines(p.value) : []
    for (let j = 0; j < Math.max(removed.length, added.length); j++) {
      rows.push([j < removed.length ? { text: removed[j], changed: true } : null, j < added.length ? { text: added[j], changed: true } : null])
    }
  }

  return (
    <div className="grid grid-cols-2 font-mono text-[13px] leading-[1.6]">
      <span className="border-r border-b border-border-strong px-[20px] py-[12px] font-sans text-[13px] text-muted-foreground">{beforeLabel}</span>
      <span className="border-b border-border-strong px-[20px] py-[12px] font-sans text-[13px] text-muted-foreground">{afterLabel}</span>
      {rows.map(([l, r], i) => (
        <DiffRow key={i} left={l} right={r} />
      ))}
    </div>
  )
}

function DiffRow({ left, right }: { left: Side; right: Side }) {
  return (
    <>
      <DiffCell side={left} sign="−" className="border-r border-border-strong" />
      <DiffCell side={right} sign="+" />
    </>
  )
}

function DiffCell({ side, sign, className }: { side: Side; sign: string; className?: string }) {
  if (!side) return <div className={cn('bg-[repeating-linear-gradient(135deg,var(--border)_0_1px,transparent_1px_8px)]', className)} />
  const removed = side.changed && sign === '−'
  const added = side.changed && sign === '+'
  return (
    <div className={cn('flex gap-[8px] px-[20px] py-[2px]', removed && 'bg-error-soft', added && 'bg-success-soft', className)}>
      <span className={cn('w-[10px] shrink-0 select-none', removed ? 'text-error' : added ? 'text-success' : 'text-subtle-foreground')}>
        {side.changed ? sign : ''}
      </span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground">{side.text || '\u00a0'}</span>
    </div>
  )
}
