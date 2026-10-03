'use client'

import { useState } from 'react'
import { Activity, MessageCircle, SlidersHorizontal, ThumbsUp, Timer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { filterExecucoes, tabs, type TabKey } from './data'
import { ExecucoesTable } from './ExecucoesTable'
import { StatCard } from './StatCard'
import { TopBar } from './TopBar'

export function ExecucoesView() {
  const [tab, setTab] = useState<TabKey>('todas')
  const rows = filterExecucoes(tab)

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <TopBar />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[24px] overflow-y-auto px-[32px] pt-[28px] pb-[32px]">
        {/* Page Header */}
        <div className="flex w-full items-end justify-between">
          <div className="flex w-[620px] flex-col gap-[14px]">
            <div className="flex items-center gap-[12px]">
              <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Execuções</h1>
              <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                agente-sdr · v3
              </span>
            </div>
            <p className="w-full text-[14px] leading-[1.5] text-muted-foreground">
              Cada mensagem enviada ao agente vira uma execução. Abra uma para ver o snapshot do que aconteceu e avalie com positivo ou negativo.
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] text-foreground"
            >
              <SlidersHorizontal size={16} />
              <span className="text-[14px] leading-[1.43] font-medium">Filtros</span>
            </button>
            <button
              type="button"
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full bg-primary px-[16px] text-primary-foreground"
            >
              <MessageCircle size={16} />
              <span className="text-[14px] leading-[1.43] font-medium">Testar no chat</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-fit gap-[2px] rounded-full border border-border bg-surface p-[3px]">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex h-[28px] items-center rounded-full px-[12px] text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-surface-raised text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex w-full gap-[16px]">
          <StatCard label="EXECUÇÕES · HOJE" icon={Activity} value="312" delta="+18%" footnote="vs. ontem" />
          <StatCard label="LATÊNCIA P95" icon={Timer} value="2.4s" delta="−0.3s" footnote="média 1.6s" />
          <StatCard label="TAXA DE ERRO" icon={TriangleAlert} value="1.9%" delta="+0.4%" deltaTone="error" footnote="6 execuções com falha" />
          <StatCard label="FEEDBACK POSITIVO" icon={ThumbsUp} value="82%" footnote="58 de 71 avaliadas" />
        </div>

        {/* Execuções Card */}
        <div className="flex min-h-[300px] w-full flex-1 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
          <div className="flex w-full shrink-0 items-center justify-between border-b border-border px-[20px] py-[16px]">
            <div className="flex flex-col gap-[2px]">
              <span className="font-display text-[16px] font-medium tracking-[-0.2px] text-foreground">Execuções recentes</span>
              <span className="text-[13px] text-muted-foreground">Clique numa linha para abrir o snapshot da execução</span>
            </div>
            <button type="button" className="flex h-[36px] items-center justify-center rounded-full px-[16px] text-[14px] leading-[1.43] font-medium text-muted-foreground hover:text-foreground">
              Exportar
            </button>
          </div>
          <ExecucoesTable rows={rows} />
        </div>
      </div>
    </div>
  )
}
