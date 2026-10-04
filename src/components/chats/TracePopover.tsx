'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Popover } from 'radix-ui'
import { Bug } from 'lucide-react'
import { executionQuery } from '@/components/execution-detail/ExecutionDetail'
import { ProcessPanel } from '@/components/execution-detail/ProcessPanel'

/** Bug chip under an agent reply; opens the execution trace in place. */
export function TracePopover({ executionId, latencyMs }: { executionId: string; latencyMs: number | null }) {
  const [open, setOpen] = useState(false)
  const { data: ex, error } = useQuery({ ...executionQuery(executionId), enabled: open })

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Debug trace"
          title="Debug trace"
          className="flex items-center gap-[6px] rounded-full border border-border px-[8px] py-[3px] hover:bg-surface data-[state=open]:border-accent data-[state=open]:bg-surface"
        >
          <Bug size={12} className="text-accent" />
          <span className="font-mono text-[11px] text-muted-foreground">
            {executionId.slice(0, 8)}
            {latencyMs != null && ` · ${(latencyMs / 1000).toFixed(1)}s`}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 h-[min(560px,var(--radix-popover-content-available-height))] w-[min(460px,calc(100vw-32px))] rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] outline-none"
        >
          {ex ? (
            <ProcessPanel ex={ex} className="w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-border bg-surface text-[13px] text-muted-foreground">
              {error ? error.message : 'Loading trace…'}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
