import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label, icon: Icon, value, delta, deltaTone = 'success', footnote,
}: {
  label: string
  icon: LucideIcon
  value: string
  delta?: string
  deltaTone?: 'success' | 'error'
  footnote: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-[16px] rounded-[20px] border border-border bg-surface p-[20px]">
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.8px] text-muted-foreground">{label}</span>
        <Icon size={15} className="text-subtle-foreground" />
      </div>
      <div className="flex items-end gap-[10px]">
        <span className="font-display text-[32px] leading-none font-medium tracking-[-0.8px] text-foreground">{value}</span>
        {delta && (
          <span className={cn('font-mono text-[12px]', deltaTone === 'success' ? 'text-success' : 'text-error')}>{delta}</span>
        )}
      </div>
      <span className="text-[12px] text-subtle-foreground">{footnote}</span>
    </div>
  )
}
