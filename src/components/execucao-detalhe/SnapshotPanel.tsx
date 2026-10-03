import { ArrowUpRight, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { execucao } from './mock-data'
import { RatingButtons, type Rating } from './RatingButtons'

// Painel "Snapshot da conversa" — frame "Snapshot" (sIHJd) do untitled.pen.
function Separador({ label }: { label: string }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-[10px]">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10.5px] tracking-[0.6px] text-subtle-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function ClienteBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[428px] rounded-[16px_16px_4px_16px] bg-accent px-[14px] py-[10px] text-[14px] leading-[1.45] text-white">
      {text}
    </div>
  )
}

function AgenteBubble({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'w-fit rounded-[16px_16px_16px_4px] bg-surface-raised px-[14px] py-[10px]',
        highlight ? 'border-[1.5px] border-accent' : 'border border-border',
      )}
    >
      <p className="w-[400px] text-[14px] leading-[1.45] text-foreground">{text}</p>
    </div>
  )
}

function Label({ dot, text, className }: { dot: string; text: string; className: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className={cn('h-[6px] w-[6px] rounded-full', dot)} />
      <span className={cn('font-mono text-[10.5px] tracking-[0.8px]', className)}>{text}</span>
    </div>
  )
}

export function SnapshotPanel({ rating, onRate }: { rating: Rating; onRate: (r: 'boa' | 'ruim') => void }) {
  const s = execucao.snapshot
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="flex w-full shrink-0 items-center justify-between gap-[16px] border-b border-border px-[20px] py-[14px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h2 className="font-display text-[16px] font-medium text-foreground">{s.title}</h2>
          <p className="w-full text-[13px] text-muted-foreground">{s.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
            {s.turno}
          </span>
          <button
            type="button"
            className="flex h-[28px] items-center gap-[6px] rounded-full border border-border px-[10px] hover:bg-surface-raised"
          >
            <MessagesSquare size={13} className="text-accent" />
            <span className="text-[12px] font-medium text-foreground">{execucao.sessao}</span>
            <ArrowUpRight size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-[14px] overflow-y-auto px-[24px] py-[20px]">
        <Separador label="CONTEXTO ANTERIOR" />
        {s.contexto.map((m) =>
          m.from === 'cliente' ? (
            <div key={m.text} className="flex w-full flex-col items-end gap-[6px] opacity-45">
              <ClienteBubble text={m.text} />
            </div>
          ) : (
            <div key={m.text} className="flex w-full flex-col gap-[6px] opacity-45">
              <AgenteBubble text={m.text} />
            </div>
          ),
        )}
        <Separador label="ESTA EXECUÇÃO" />
        <div className="flex w-full flex-col items-end gap-[6px]">
          <Label dot="bg-accent-foreground" text={s.recebida.label} className="text-accent-foreground" />
          <ClienteBubble text={s.recebida.text} />
        </div>
        <div className="flex w-full flex-col gap-[6px]">
          <Label dot="bg-success" text={s.resposta.label} className="text-success" />
          <AgenteBubble text={s.resposta.text} highlight />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-[12px] border-t border-border bg-surface-raised px-[20px] py-[16px]">
        <div className="flex w-full items-center gap-[10px]">
          <span className="flex-1 text-[14px] font-medium text-foreground">Essa resposta foi boa?</span>
          <RatingButtons value={rating} onSelect={onRate} />
        </div>
      </div>
    </section>
  )
}
