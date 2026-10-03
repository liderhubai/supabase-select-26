'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Folder } from 'lucide-react'
import { gruposFeedback } from './mock-data'
import { RatingButtons, type Rating } from './RatingButtons'

// Modal "Conte o que não funcionou" — frame "Overlay" (Y1qM5) do untitled.pen.
export function FeedbackModal({
  open,
  initialRating,
  onClose,
  onSave,
}: {
  open: boolean
  initialRating: Rating
  onClose: () => void
  onSave: (rating: Rating) => void
}) {
  const [rating, setRating] = useState<Rating>(initialRating)

  useEffect(() => {
    if (!open) return
    setRating(initialRating)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, initialRating, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05060ab8] backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[520px] flex-col overflow-hidden rounded-[20px] border border-border-strong bg-surface shadow-[0_24px_64px_#000000a0]"
      >
        <div className="flex w-full flex-col gap-[6px] px-[24px] pt-[24px]">
          <h2 id="feedback-modal-title" className="font-display text-[20px] font-medium tracking-[-0.4px] text-foreground">
            Conte o que não funcionou
          </h2>
          <p className="w-full text-[14px] leading-[1.55] text-muted-foreground">
            Seu feedback é salvo no grupo escolhido e usado para ajustar as próximas respostas do agente.
          </p>
        </div>

        <div className="flex w-full flex-col gap-[20px] p-[24px]">
          <div className="flex w-full flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">Avaliação</span>
            <div className="flex gap-[8px]">
              <RatingButtons value={rating} onSelect={setRating} />
            </div>
          </div>

          <label className="flex w-full flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">O que poderia ser melhor?</span>
            <textarea
              autoFocus
              defaultValue="Ofereceu demo cedo demais — devia explicar a importação da planilha primeiro."
              className="h-[104px] w-full resize-none rounded-[12px] border border-border-strong bg-background p-[12px] text-[14px] leading-[1.5] text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="flex w-full flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">Salvar no grupo</span>
            <div className="relative flex h-[40px] w-full items-center gap-[8px] rounded-[12px] border border-border-strong bg-background px-[12px]">
              <Folder size={16} className="shrink-0 text-accent" />
              <span className="flex-1" />
              <ChevronDown size={16} className="shrink-0 text-subtle-foreground" />
              <select
                defaultValue={gruposFeedback[0]}
                className="absolute inset-0 cursor-pointer appearance-none bg-transparent pr-[36px] pl-[36px] text-[14px] text-foreground outline-none"
              >
                {gruposFeedback.map((g) => (
                  <option key={g} value={g} className="bg-surface">
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="flex w-full justify-end gap-[12px] border-t border-border bg-background px-[24px] py-[16px]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] text-[14px] leading-[1.43] font-medium text-foreground hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(rating)}
            className="flex h-[36px] items-center justify-center gap-[6px] rounded-full bg-primary px-[16px] text-[14px] leading-[1.43] font-medium text-primary-foreground hover:opacity-90"
          >
            Salvar feedback
          </button>
        </div>
      </div>
    </div>
  )
}
