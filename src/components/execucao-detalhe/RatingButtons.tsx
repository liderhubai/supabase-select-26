import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Rating = 'boa' | 'ruim' | null

// Par de pills "Boa" / "Ruim" — frames "Positivo" / "Negativo" do untitled.pen.
export function RatingButtons({ value, onSelect }: { value: Rating; onSelect: (r: 'boa' | 'ruim') => void }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect('boa')}
        aria-pressed={value === 'boa'}
        className={cn(
          'flex h-[32px] shrink-0 items-center gap-[6px] rounded-full border px-[12px] transition-colors',
          value === 'boa'
            ? 'border-success bg-success-soft text-success'
            : 'border-border-strong text-muted-foreground hover:bg-surface',
        )}
      >
        <ThumbsUp size={14} />
        <span className="text-[13px] font-medium">Boa</span>
      </button>
      <button
        type="button"
        onClick={() => onSelect('ruim')}
        aria-pressed={value === 'ruim'}
        className={cn(
          'flex h-[32px] shrink-0 items-center gap-[6px] rounded-full border px-[12px] transition-colors',
          value === 'ruim'
            ? 'border-error bg-error-soft text-error'
            : 'border-border-strong text-muted-foreground hover:bg-surface',
        )}
      >
        <ThumbsDown size={14} />
        <span className="text-[13px] font-medium">Ruim</span>
      </button>
    </>
  )
}
