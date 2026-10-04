import type { Feedback } from '@/lib/types'

export type FeedbackItem = Feedback & {
  messages: { content: string } | null
}
