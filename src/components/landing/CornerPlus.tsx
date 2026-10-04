import { cn } from '@/lib/utils'

/** Largura da coluna da landing. As linhas laterais ficam em x=0 e x=1279 (1px cada). */
export const COLUMN_WIDTH = 1280

/** Cor das linhas estruturais (token border-strong). */
export const LINE_COLOR = '#ffffff33'

/** Linhas laterais da coluna de 1280 (x=0 e x=1279), cobrindo toda a altura do pai. */
export function ColumnSideLines({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-y-0 left-1/2 w-[1280px] -translate-x-1/2', className)}>
      <div className="absolute inset-y-0 left-0 w-[1px]" style={{ background: LINE_COLOR }} />
      <div className="absolute inset-y-0 right-0 w-[1px]" style={{ background: LINE_COLOR }} />
    </div>
  )
}

/**
 * Divisor horizontal entre seções: 1px exatamente da largura da coluna (1280),
 * colado nas linhas laterais, sem nada sobrando para fora.
 */
export function SectionDivider() {
  return <div className="h-[1px] w-full" style={{ background: LINE_COLOR }} />
}
