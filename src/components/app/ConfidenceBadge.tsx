import { cn } from '@/lib/utils'
import type { ConfidenceIssue } from '@/lib/types'

export const confidenceTone = (score: number) =>
  score >= 80 ? 'bg-success-soft text-success' : score >= 60 ? 'bg-warning-soft text-warning' : 'bg-error-soft text-error'

/** Score from the confidence scorer; the tooltip lists the issues it found. */
export function ConfidenceBadge({ score, reason, issues, pending }: { score: number | null; reason?: string | null; issues?: ConfidenceIssue[] | null; pending?: boolean }) {
  if (score == null) {
    return pending ? <span className="font-mono text-[11px] text-subtle-foreground">scoring…</span> : null
  }
  const title = [reason, ...(issues ?? []).map((i) => `• [${i.type}] ${i.explanation}`)].filter(Boolean).join('\n')
  return (
    <span title={title || undefined} className={cn('flex h-[20px] items-center rounded-full px-[8px] font-mono text-[11px] font-medium', confidenceTone(score))}>
      {score}%
    </span>
  )
}
