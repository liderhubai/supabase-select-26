'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { Markdown } from '@/components/Markdown'
import { Button, Input, Label, Modal, Textarea } from '@/components/ui'

export function FeedbackModal({ conv, target, onClose }: { conv: { id: string; prompt_version_id: string; agent_id: string }; target: { message: Message; rating: 'positive' | 'negative' }; onClose: () => void }) {
  const qc = useQueryClient()
  const [rating, setRating] = useState(target.rating)
  const [comment, setComment] = useState('')
  const [reviewer, setReviewer] = useState(() => {
    try {
      return localStorage.getItem('reviewer_name') ?? ''
    } catch {
      return ''
    }
  })

  const save = useMutation({
    mutationFn: async () => {
      try {
        localStorage.setItem('reviewer_name', reviewer)
      } catch {
        /* no storage */
      }
      return unwrap(
        await supabase.from('feedbacks').insert({
          message_id: target.message.id,
          conversation_id: conv.id,
          execution_id: target.message.execution_id,
          prompt_version_id: conv.prompt_version_id,
          agent_id: conv.agent_id,
          rating,
          comment,
          reviewer_name: reviewer || 'Reviewer',
        }),
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['observability'] })
      onClose()
    },
  })

  return (
    <Modal open onClose={onClose} title="Message feedback">
      <blockquote className="mb-3 max-h-40 overflow-auto rounded-md border-l-2 border-zinc-300 bg-zinc-50 p-2">
        <Markdown>{target.message.content}</Markdown>
      </blockquote>
      <div className="mb-3 flex gap-2">
        <Button variant={rating === 'positive' ? 'success' : 'secondary'} onClick={() => setRating('positive')}>
          <ThumbsUp size={14} /> Positive
        </Button>
        <Button variant={rating === 'negative' ? 'danger' : 'secondary'} onClick={() => setRating('negative')}>
          <ThumbsDown size={14} /> Negative
        </Button>
      </div>
      <Label hint="what should have happened?">Extra context</Label>
      <Textarea
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={rating === 'negative' ? 'E.g.: should have confirmed insurance coverage before offering a time slot.' : 'E.g.: great way to handle the price objection.'}
      />
      <div className="mt-3">
        <Label>Reviewer</Label>
        <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Your name" />
      </div>
      {save.error && <p className="mt-2 text-sm text-red-600">{save.error.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Send to queue
        </Button>
      </div>
    </Modal>
  )
}
