import { cn } from '@/lib/utils'

/** Marcador "+" (22x21) usado nos cruzamentos das bordas da landing. */
export function CornerPlus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 21"
      aria-hidden
      className={cn('pointer-events-none absolute h-[21px] w-[22px]', className)}
    >
      <path d="M10.5 0h1v10h10.5v1H11.5v10h-1V11H0.5v-1h10z" fill="#ffffff33" />
    </svg>
  )
}

/** Divisor horizontal de 1280 com "+" nas extremidades (pen: Divider). */
export function SectionDivider() {
  return (
    <div className="relative flex w-full flex-col">
      <div className="h-[1px] w-full bg-[#ffffff33]" />
      <CornerPlus className="top-[-10.5px] left-[-11px]" />
      <CornerPlus className="top-[-10.5px] left-[1269px]" />
    </div>
  )
}
