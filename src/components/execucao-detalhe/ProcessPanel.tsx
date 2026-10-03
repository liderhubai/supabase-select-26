import { Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { execucao, steps } from './mock-data'

// Painel "O que o agente fez" — frame "Processamento" (H3NB5R) do untitled.pen.
export function ProcessPanel() {
  return (
    <section className="flex h-full w-[500px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="flex w-full shrink-0 items-center justify-between border-b border-border px-[20px] py-[14px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="font-display text-[16px] font-medium text-foreground">{execucao.processamento.title}</h2>
          <p className="text-[13px] text-muted-foreground">{execucao.processamento.subtitle}</p>
        </div>
        <button
          type="button"
          className="flex h-[36px] items-center justify-center gap-[6px] rounded-full px-[16px] hover:bg-surface-raised"
        >
          <Braces size={16} className="text-muted-foreground" />
          <span className="text-[14px] leading-[1.43] font-medium text-muted-foreground">JSON</span>
        </button>
      </div>
      <ol className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-[20px] py-[18px]">
        {steps.map((step, i) => {
          const last = i === steps.length - 1
          const Icon = step.icon
          return (
            <li key={step.title} className="relative flex w-full shrink-0 gap-[14px] overflow-hidden">
              <div className="flex h-[28px] w-[28px] shrink-0 flex-col items-center">
                <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full border border-border-strong bg-surface-raised">
                  <Icon size={13} className={step.iconClass} />
                </div>
              </div>
              <div className={cn('flex min-w-0 flex-1 flex-col gap-[6px] pt-[4px]', !last && 'pb-[20px]')}>
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      'flex-1 font-medium text-foreground',
                      step.mono ? 'font-mono text-[13px]' : 'text-[14px]',
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="font-mono text-[11px] text-subtle-foreground">{step.time}</span>
                </div>
                <p className="w-full text-[13px] leading-[1.5] text-muted-foreground">{step.desc}</p>
                {step.code && (
                  <div className="flex w-full flex-col gap-[4px] rounded-[6px] border border-border bg-[#050506] px-[12px] py-[10px] font-mono text-[11.5px]">
                    <span className="text-accent-foreground">{step.code.in}</span>
                    <span className="text-success">{step.code.out}</span>
                  </div>
                )}
              </div>
              {!last && <span className="absolute top-[32px] left-[13.5px] h-[800px] w-px bg-border-strong" />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
