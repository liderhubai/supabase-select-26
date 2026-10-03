'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, unwrap } from '@/lib/utils'

export type Rating = 'positive' | 'negative'

export type FeedbackTarget = {
  messageId: string
  conversationId: string
  executionId: string | null
  promptVersionId: string
  agentId: string
  reply: string
}

const REVIEWER_KEY = 'itera.reviewerName'

export function RatingButtons({ value, onSelect }: { value: Rating | null; onSelect: (r: Rating) => void }) {
  return (
    <>
      {(['positive', 'negative'] as const).map((r) => {
        const Icon = r === 'positive' ? ThumbsUp : ThumbsDown
        const active = value === r
        return (
          <button
            key={r}
            type="button"
            onClick={() => onSelect(r)}
            aria-pressed={active}
            className={cn(
              'flex h-[32px] shrink-0 items-center gap-[6px] rounded-full border px-[12px] whitespace-nowrap transition-colors',
              active
                ? r === 'positive'
                  ? 'border-success bg-success-soft text-success'
                  : 'border-error bg-error-soft text-error'
                : 'border-border-strong text-muted-foreground hover:bg-surface',
            )}
          >
            <Icon size={14} />
            <span className="text-[13px] font-medium">{r === 'positive' ? 'Good' : 'Bad'}</span>
          </button>
        )
      })}
    </>
  )
}

/** Saves a reviewer rating on an agent reply; it lands in the Feedback queue as pending. */
export function FeedbackModal({ target, initialRating, onClose }: { target: FeedbackTarget | null; initialRating: Rating; onClose: () => void }) {
  const qc = useQueryClient()
  const [rating, setRating] = useState<Rating>(initialRating)
  const [comment, setComment] = useState('')
  const [reviewer, setReviewer] = useState('')

  useEffect(() => {
    if (!target) return
    setRating(initialRating)
    setComment('')
    try {
      setReviewer(localStorage.getItem(REVIEWER_KEY) ?? '')
    } catch {
      /* no storage */
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, initialRating, onClose])

  const save = useMutation({
    mutationFn: async () => {
      if (!target) return
      try {
        localStorage.setItem(REVIEWER_KEY, reviewer)
      } catch {
        /* no storage */
      }
      unwrap(
        await supabase.from('feedbacks').insert({
          message_id: target.messageId,
          conversation_id: target.conversationId,
          execution_id: target.executionId,
          prompt_version_id: target.promptVersionId,
          agent_id: target.agentId,
          rating,
          comment: comment.trim(),
          reviewer_name: reviewer.trim() || 'Reviewer',
        }),
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['executions'] })
      qc.invalidateQueries({ queryKey: ['execution'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['counts'] })
      onClose()
    },
  })

  if (!target) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060ab8] backdrop-blur-[4px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[520px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[20px] border border-border-strong bg-surface shadow-[0_24px_64px_#000000a0]"
      >
        <div className="flex flex-col gap-[6px] px-[24px] pt-[24px]">
          <h2 id="feedback-modal-title" className="font-display text-[20px] font-medium tracking-[-0.4px] text-foreground">
            {rating === 'negative' ? "Tell us what didn't work" : 'Tell us what worked'}
          </h2>
          <p className="text-[14px] leading-[1.55] text-muted-foreground">
            Your feedback goes to the Feedback queue and is used to train the next prompt version.
          </p>
        </div>

        <div className="flex flex-col gap-[20px] p-[24px]">
          <blockquote className="max-h-[120px] overflow-y-auto rounded-[12px] border border-border bg-background p-[12px] text-[13px] leading-[1.5] whitespace-pre-line text-muted-foreground">
            {target.reply}
          </blockquote>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">Rating</span>
            <div className="flex gap-[8px]">
              <RatingButtons value={rating} onSelect={setRating} />
            </div>
          </div>

          <label className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">{rating === 'negative' ? 'What should have happened?' : 'What should the agent keep doing?'}</span>
            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={rating === 'negative' ? 'E.g.: offered a demo too early, should have asked about team size first.' : 'E.g.: great way to handle the price objection.'}
              className="h-[104px] w-full resize-none rounded-[12px] border border-border-strong bg-background p-[12px] text-[14px] leading-[1.5] text-foreground outline-none placeholder:text-subtle-foreground focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-medium text-foreground">Reviewer</span>
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="Your name"
              className="h-[40px] w-full rounded-[12px] border border-border-strong bg-background px-[12px] text-[14px] text-foreground outline-none placeholder:text-subtle-foreground focus:border-accent"
            />
          </label>
          {save.error && <p className="text-[13px] text-error">{save.error.message}</p>}
        </div>

        <div className="flex justify-end gap-[12px] border-t border-border bg-background px-[24px] py-[16px]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[36px] items-center rounded-full border border-border-strong px-[16px] text-[14px] font-medium text-foreground hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex h-[36px] items-center rounded-full bg-primary px-[16px] text-[14px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
