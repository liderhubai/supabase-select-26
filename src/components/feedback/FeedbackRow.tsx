import { Check, MessageSquareQuote, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Feedback } from './data'

export function Checkbox({ state, onClick }: { state: 'checked' | 'mixed' | 'unchecked'; onClick?: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : state === 'checked'}
      onClick={onClick}
      className={cn(
        'flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px]',
        state === 'unchecked' ? 'bg-surface outline outline-1 -outline-offset-1 outline-border-strong' : 'bg-primary text-primary-foreground',
      )}
    >
      {state === 'checked' && <Check size={12} strokeWidth={2.5} />}
      {state === 'mixed' && <span className="h-[1.5px] w-[8px] rounded-full bg-primary-foreground" />}
    </button>
  )
}

// Linha de feedback (ex.: OdBhl).
export function FeedbackRow({ item, selected, onToggle }: { item: Feedback; selected: boolean; onToggle: () => void }) {
  const negative = item.kind === 'negative'
  return (
    <div className={cn('flex w-full gap-[14px] border-b border-border px-[20px] py-[14px]', item.trained && 'opacity-60')}>
      <div className="pt-[2px]">
        <Checkbox state={selected ? 'checked' : 'unchecked'} onClick={onToggle} />
      </div>
      <div
        className={cn(
          'flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full',
          negative ? 'bg-error-soft text-error' : 'bg-success-soft text-success',
        )}
      >
        {negative ? <ThumbsDown size={13} /> : <ThumbsUp size={13} />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex w-full items-center gap-[8px]">
          <span className="shrink-0 text-[14px] font-medium text-foreground">{item.message}</span>
          <span className="font-mono text-[11px] text-subtle-foreground">{item.id}</span>
        </div>
        <p className="text-[13px] text-muted-foreground">{item.reply}</p>
        {item.comment && (
          <div className="flex items-center gap-[6px] pt-[2px]">
            <MessageSquareQuote size={12} className={cn('shrink-0', negative ? 'text-error' : 'text-success')} />
            <span className="text-[13px] text-foreground">{item.comment}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[8px] self-start">
        {item.trained ? (
          <span className="flex h-[24px] items-center gap-[6px] rounded-full bg-surface-raised px-[10px]">
            <span className="h-[6px] w-[6px] rounded-full bg-muted-foreground" />
            <span className="text-[12px] font-medium text-muted-foreground">Treinado</span>
          </span>
        ) : (
          <button
            type="button"
            className="flex h-[30px] shrink-0 items-center whitespace-nowrap justify-center gap-[6px] rounded-full px-[12px] outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface-raised"
          >
            <Sparkles size={14} className="text-accent" />
            <span className="text-[13px] leading-[1.43] font-medium text-foreground">Treinar só este</span>
          </button>
        )}
      </div>
    </div>
  )
}
