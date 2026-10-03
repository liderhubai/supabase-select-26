import { cn } from '@/lib/utils'

const jobStyles: Record<string, { label: string; className: string; pulse?: boolean }> = {
  queued: { label: 'Queued', className: 'bg-surface-raised text-muted-foreground', pulse: true },
  optimizing: { label: 'Rewriting prompt', className: 'bg-accent-soft text-accent-foreground', pulse: true },
  testing: { label: 'Running tests', className: 'bg-info-soft text-info', pulse: true },
  completed: { label: 'Completed', className: 'bg-success-soft text-success' },
  failed: { label: 'Failed', className: 'bg-error-soft text-error' },
}

const versionStyles: Record<string, { label: string; className: string }> = {
  staging: { label: 'Awaiting review', className: 'border-warning text-warning' },
  production: { label: 'In production', className: 'border-success text-success' },
  rejected: { label: 'Rejected', className: 'border-error text-error' },
  archived: { label: 'Archived', className: 'border-border text-muted-foreground' },
  draft: { label: 'Draft', className: 'border-border text-muted-foreground' },
}

export function JobStatus({ status }: { status: string }) {
  const s = jobStyles[status] ?? { label: status, className: 'bg-surface-raised text-muted-foreground' }
  return (
    <span className={cn('flex h-[22px] items-center gap-[6px] rounded-full px-[10px] text-[12px] font-medium', s.className)}>
      <span className={cn('h-[6px] w-[6px] rounded-full bg-current', s.pulse && 'animate-pulse')} />
      {s.label}
    </span>
  )
}

export function VersionStatus({ status }: { status: string }) {
  const s = versionStyles[status] ?? { label: status, className: 'border-border text-muted-foreground' }
  return <span className={cn('flex h-[22px] items-center rounded-full border px-[10px] text-[12px] font-medium', s.className)}>{s.label}</span>
}
