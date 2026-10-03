import { cn } from '@/lib/utils'
import { views, type FeedbackItem, type ViewId } from './data'

/** Left column: feedback sources (reviewers vs. the confidence scorer). */
export function GroupList({ items, active, onSelect }: { items: FeedbackItem[]; active: ViewId; onSelect: (id: ViewId) => void }) {
  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col gap-[2px]">
      <span className="font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">SOURCE</span>
      <div className="h-[8px] w-full" />
      {views.map((v) => {
        const Icon = v.icon
        const isActive = v.id === active
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              'flex h-[36px] w-full items-center gap-[10px] rounded-[12px] px-[12px] text-left transition-colors',
              isActive ? 'bg-surface-raised outline outline-1 -outline-offset-1 outline-border' : 'hover:bg-surface',
            )}
          >
            <Icon size={15} className={cn('shrink-0', v.className)} />
            <span className={cn('flex-1 text-[14px] font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{v.label}</span>
            <span className="font-mono text-[11px] text-subtle-foreground">{items.filter(v.match).length}</span>
          </button>
        )
      })}
    </div>
  )
}
