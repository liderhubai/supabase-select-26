'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { execucao } from './mock-data'
import { TopBar } from './TopBar'
import { SnapshotPanel } from './SnapshotPanel'
import { ProcessPanel } from './ProcessPanel'
import { FeedbackModal } from './FeedbackModal'
import type { Rating } from './RatingButtons'

// Tela "itera.ai App – Execução (Detalhe)" — frame "Main" (qQju4) do untitled.pen.
export function ExecucaoDetalhe() {
  const [rating, setRating] = useState<Rating>('ruim')
  const [modalOpen, setModalOpen] = useState(false)
  const closeModal = useCallback(() => setModalOpen(false), [])

  const onRate = (r: 'boa' | 'ruim') => {
    if (r === 'ruim') setModalOpen(true)
    else setRating('boa')
  }

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar current={execucao.id} />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-[20px] px-[32px] pt-[24px] pb-[28px]">
        <div className="flex w-full shrink-0 items-end justify-between">
          <div className="flex flex-col gap-[10px]">
            <Link href="/app/execucoes" className="flex w-fit items-center gap-[6px] text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
              <span className="text-[13px]">Execuções</span>
            </Link>
            <div className="flex items-center gap-[12px]">
              <h1 className="font-display text-[30px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">
                {execucao.id}
              </h1>
              <span className="flex h-[24px] items-center gap-[6px] rounded-full bg-success-soft px-[10px]">
                <span className="h-[6px] w-[6px] rounded-full bg-success" />
                <span className="text-[12px] leading-[1.33] font-medium text-success">{execucao.status}</span>
              </span>
              <span className="flex h-[22px] items-center rounded-[6px] border border-border px-[8px] font-mono text-[11px] text-muted-foreground">
                {execucao.sessao}
              </span>
            </div>
            <div className="flex items-center gap-[18px]">
              {execucao.meta.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-[6px]">
                  <Icon size={13} className="text-subtle-foreground" />
                  <span className="font-mono text-[12px] text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              aria-label="Anterior"
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border hover:bg-surface"
            >
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              aria-label="Próxima"
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border hover:bg-surface"
            >
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex h-[36px] items-center justify-center gap-[6px] rounded-full border border-border-strong bg-background px-[16px] hover:bg-surface"
            >
              <MessageCircle size={16} className="text-foreground" />
              <span className="text-[14px] leading-[1.43] font-medium text-foreground">Abrir no chat</span>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 gap-[20px]">
          <SnapshotPanel rating={rating} onRate={onRate} />
          <ProcessPanel />
        </div>
      </div>

      <FeedbackModal
        open={modalOpen}
        initialRating={rating}
        onClose={closeModal}
        onSave={(r) => {
          setRating(r)
          setModalOpen(false)
        }}
      />
    </div>
  )
}
