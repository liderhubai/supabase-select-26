import Link from 'next/link'
import { History } from 'lucide-react'

export function PageHeader() {
  return (
    <div className="flex w-full items-end justify-between gap-[16px]">
      <div className="flex max-w-[620px] flex-col gap-[10px]">
        <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Feedback</h1>
        <p className="text-[14px] leading-[1.5] text-muted-foreground">
          Every 👍 and 👎 from the executions lands here, along with low-confidence replies flagged automatically. Train the agent with all of them at once or with a single one.
        </p>
      </div>
      <Link
        href="/app/trainings"
        className="flex h-[36px] shrink-0 items-center justify-center gap-[6px] rounded-full bg-background px-[16px] whitespace-nowrap text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface"
      >
        <History size={16} />
        <span className="text-[14px] font-medium">Previous trainings</span>
      </Link>
    </div>
  )
}
