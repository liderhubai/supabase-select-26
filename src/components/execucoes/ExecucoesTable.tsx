import Link from 'next/link'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Execucao, ExecStatus } from './data'

const statusStyles: Record<ExecStatus, { label: string; pill: string; dot: string; text: string }> = {
  processando: { label: 'Processando', pill: 'bg-info-soft', dot: 'bg-info', text: 'text-info' },
  sucesso: { label: 'Sucesso', pill: 'bg-success-soft', dot: 'bg-success', text: 'text-success' },
  erro: { label: 'Erro', pill: 'bg-error-soft', dot: 'bg-error', text: 'text-error' },
}

const headCell = 'font-mono text-[11px] tracking-[0.6px] text-subtle-foreground'

export function ExecucoesTable({ rows }: { rows: Execucao[] }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 flex h-[36px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[20px]">
        <span className={cn(headCell, 'flex-1')}>MENSAGEM</span>
        <span className={cn(headCell, 'w-[110px]')}>CHAT</span>
        <span className={cn(headCell, 'w-[116px]')}>STATUS</span>
        <span className={cn(headCell, 'w-[56px]')}>TOOLS</span>
        <span className={cn(headCell, 'w-[72px]')}>DURAÇÃO</span>
        <span className={cn(headCell, 'w-[80px]')}>QUANDO</span>
        <span className={cn(headCell, 'w-[76px]')}>FEEDBACK</span>
      </div>
      {rows.map((r) => {
        const s = statusStyles[r.status]
        return (
          <Link
            key={r.id}
            href={`/app/execucoes/${r.id}`}
            className={cn(
              'flex h-[54px] w-full shrink-0 items-center gap-[16px] border-b border-border px-[20px] transition-colors hover:bg-surface-raised',
              r.status === 'erro' && 'bg-surface-raised',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[14px] font-medium text-foreground">{r.mensagem}</span>
              <span className="font-mono text-[11px] text-subtle-foreground">{r.id} · {r.autor}</span>
            </div>
            <div className="flex w-[110px]">
              <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                {r.chat}
              </span>
            </div>
            <div className="flex w-[116px]">
              <span className={cn('flex h-[24px] items-center gap-[6px] rounded-full px-[10px]', s.pill)}>
                <span className={cn('h-[6px] w-[6px] rounded-full', s.dot)} />
                <span className={cn('text-[12px] leading-[1.33] font-medium', s.text)}>{s.label}</span>
              </span>
            </div>
            <span className="w-[56px] font-mono text-[12px] text-muted-foreground">{r.tools}</span>
            <span className={cn('w-[72px] font-mono text-[12px]', r.status === 'erro' ? 'text-error' : 'text-muted-foreground')}>
              {r.duracao}
            </span>
            <span className="w-[80px] text-[13px] text-muted-foreground">{r.quando}</span>
            <div className="flex w-[76px] items-center gap-[6px]">
              <span
                className={cn(
                  'flex h-[28px] w-[28px] items-center justify-center rounded-full',
                  r.feedback === 'positivo' ? 'bg-success-soft text-success' : 'border border-border text-subtle-foreground',
                )}
              >
                <ThumbsUp size={13} />
              </span>
              <span
                className={cn(
                  'flex h-[28px] w-[28px] items-center justify-center rounded-full',
                  r.feedback === 'negativo' ? 'bg-error-soft text-error' : 'border border-border text-subtle-foreground',
                )}
              >
                <ThumbsDown size={13} />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
