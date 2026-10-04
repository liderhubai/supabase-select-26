import { Sparkles } from 'lucide-react'

export function PageHeader({ pending, training, onTrain }: { pending: number; training: boolean; onTrain: () => void }) {
  return (
    <div className="flex w-full items-end justify-between gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Feedback</h1>
        <p className="text-[14px] leading-[1.5] text-muted-foreground">Every feedback becomes a proposed change to the prompt</p>
      </div>
      <button
        type="button"
        onClick={onTrain}
        disabled={!pending || training}
        className="flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-full px-[14px] whitespace-nowrap text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface disabled:opacity-50"
      >
        <Sparkles size={14} className="text-accent" />
        <span className="text-[13px] font-medium">{training ? 'Starting…' : `Train with ${pending} pending`}</span>
      </button>
    </div>
  )
}
