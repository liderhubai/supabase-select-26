import { cn } from '@/lib/utils'

/** Cruz 21x21 usada nos cantos dos divisores. */
export function PlusMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 21"
      aria-hidden
      className={cn('pointer-events-none absolute h-[21px] w-[22px] text-[#ffffff33]', className)}
    >
      <rect x="10.5" y="0" width="1" height="21" fill="currentColor" />
      <rect x="0.5" y="10" width="21" height="1" fill="currentColor" />
    </svg>
  )
}

/** Divider entre seções (MLnYH) — 1px com cruzes nas pontas. */
export function SectionDivider() {
  return (
    <div className="relative w-full">
      <div className="h-px w-full bg-[#ffffff33]" />
      <PlusMark className="left-[-11px] top-[-10.5px]" />
      <PlusMark className="right-[-11px] top-[-10.5px]" />
    </div>
  )
}
