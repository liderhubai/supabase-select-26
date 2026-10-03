import { CircleUser, Gauge, Inbox, type LucideIcon } from 'lucide-react'
import type { Feedback } from '@/lib/types'

export type FeedbackItem = Feedback & {
  messages: { content: string } | null
  executions: { input: { messages?: { role: string; content: unknown }[] } | null } | null
  prompt_versions: { version: number } | null
  conversations: { customer_label: string } | null
}

export const views: { id: 'all' | 'human' | 'auto'; label: string; icon: LucideIcon; className: string; match: (f: FeedbackItem) => boolean }[] = [
  { id: 'all', label: 'All', icon: Inbox, className: 'text-muted-foreground', match: () => true },
  { id: 'human', label: 'Reviewer feedback', icon: CircleUser, className: 'text-info', match: (f) => f.origin === 'human' },
  { id: 'auto', label: 'Low confidence (auto)', icon: Gauge, className: 'text-warning', match: (f) => f.origin === 'auto' },
]

export type ViewId = (typeof views)[number]['id']

export const filters = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'positive', label: '👍 Positive', match: (f: FeedbackItem) => f.rating === 'positive' },
  { id: 'negative', label: '👎 Negative', match: (f: FeedbackItem) => f.rating === 'negative' },
  { id: 'pending', label: 'Pending', match: (f: FeedbackItem) => f.status === 'pending' },
] as const

export type FilterId = (typeof filters)[number]['id']
