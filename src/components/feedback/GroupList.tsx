import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groups } from './data'
import { groupColor, groupIcons } from './icons'

// Coluna "Grupos" (fvFei) — 240px.
export function GroupList({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col gap-[2px]">
      <span className="font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">GRUPOS</span>
      <div className="h-[8px] w-full" />
      {groups.map((g) => {
        const Icon = groupIcons[g.icon]
        const isActive = g.id === active
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className={cn(
              'flex h-[36px] w-full items-center gap-[10px] rounded-[12px] px-[12px] text-left transition-colors',
              isActive
                ? 'bg-surface-raised outline outline-1 -outline-offset-1 outline-border'
                : 'hover:bg-surface',
            )}
          >
            <Icon size={15} className={cn('shrink-0', g.color ? groupColor[g.color] : 'text-muted-foreground')} />
            <span className={cn('flex-1 text-[14px] font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {g.label}
            </span>
            <span className="font-mono text-[11px] text-subtle-foreground">{g.count}</span>
          </button>
        )
      })}
      <button type="button" className="flex h-[36px] w-full items-center gap-[10px] px-[12px] text-subtle-foreground hover:text-muted-foreground">
        <Plus size={15} />
        <span className="text-[14px]">Novo grupo</span>
      </button>
    </div>
  )
}
