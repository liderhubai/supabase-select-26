import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { executions, sessionRows } from './data'

function SectionLabel({ children }: { children: string }) {
  return <span className="font-mono text-[11px] tracking-[1px] text-subtle-foreground">{children}</span>
}

export function DetailsPanel({ onClose }: { onClose: () => void }) {
  const stats = [
    { value: '6', label: 'Mensagens' },
    { value: '3', label: 'Execuções' },
    { value: '1 / 1', label: '👍 / 👎' },
  ]
  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface">
      <header className="flex h-[72px] shrink-0 items-center border-b border-border px-[20px]">
        <span className="flex-1 font-display text-[15px] font-semibold text-foreground">Detalhes</span>
        <button type="button" aria-label="Fechar" onClick={onClose} className="text-subtle-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto p-[20px]">
        <div className="flex w-full gap-[8px]">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-1 flex-col gap-[4px] rounded-[12px] border border-border bg-background px-[12px] py-[10px]">
              <span className="font-display text-[18px] font-semibold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>SESSÃO</SectionLabel>
          {sessionRows.map((r) => (
            <div key={r.key} className="flex items-center">
              <span className="flex-1 text-[13px] text-muted-foreground">{r.key}</span>
              <span className={cn('text-[13px] text-foreground', r.className)}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>ETIQUETAS</SectionLabel>
          <div className="flex gap-[6px]">
            <span className="rounded-[6px] bg-success-soft px-[8px] py-[3px] text-[12px] font-medium text-success">Demo</span>
            <span className="rounded-[6px] bg-info-soft px-[8px] py-[3px] text-[12px] font-medium text-info">Preço</span>
            <button type="button" className="flex items-center gap-[4px] rounded-[6px] border border-border px-[8px] py-[3px] text-[12px] text-muted-foreground hover:bg-surface-raised">
              <Plus size={12} />
              Adicionar
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>EXECUÇÕES DA SESSÃO</SectionLabel>
          {executions.map((e) => (
            <div key={e.id} className="flex items-center gap-[10px] rounded-[12px] border border-border px-[12px] py-[10px]">
              <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', e.status === 'success' ? 'bg-success' : 'bg-warning')} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="font-mono text-[12px] text-foreground">{e.tool}</span>
                <span className="font-mono text-[11px] text-subtle-foreground">{e.id}</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{e.time}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-[12px]">
          <SectionLabel>NOTA INTERNA</SectionLabel>
          <div className="rounded-[12px] bg-warning-soft px-[12px] py-[10px] text-[13px] leading-[1.45] text-foreground">
            Preço correto, mas o agente deveria perguntar o tamanho do time antes de agendar a demo.
          </div>
        </div>
      </div>
    </aside>
  )
}
