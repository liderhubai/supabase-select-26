'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, ChevronsUpDown, MessagesSquare, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

// Sidebar fixa do app itera.ai — medidas e cores exatas do untitled.pen (frame "Sidebar", 248px).
const nav = [
  { section: 'AGENTE', items: [
    { href: '/app/chats', label: 'Chats', count: '24', icon: MessagesSquare },
    { href: '/app/execucoes', label: 'Execuções', count: '312', icon: Activity },
  ] },
  { section: 'TREINO', items: [
    { href: '/app/feedback', label: 'Feedback', count: '18', icon: ThumbsUp },
  ] },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-background">
      <div className="flex flex-col gap-[16px] px-[16px] pt-[18px] pb-[12px]">
        <Logo />
        <button
          type="button"
          className="flex h-[40px] w-full items-center gap-[10px] rounded-[12px] bg-surface px-[10px] outline outline-1 -outline-offset-[0.5px] outline-border"
        >
          <span className="flex h-[20px] w-[20px] items-center justify-center rounded-[5px] bg-primary text-[11px] font-semibold text-white">S</span>
          <span className="flex-1 text-left text-[14px] font-medium text-foreground">Agente SDR · v3</span>
          <ChevronsUpDown size={14} className="text-subtle-foreground" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-[2px] px-[12px]">
        {nav.map(({ section, items }) => (
          <div key={section} className="contents">
            <div className="px-[12px] pt-[16px] pb-[6px]">
              <span className="font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">{section}</span>
            </div>
            {items.map(({ href, label, count, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex h-[34px] w-full items-center gap-[10px] rounded-[12px] px-[10px] transition-colors',
                    active
                      ? 'bg-surface-raised text-foreground outline outline-1 -outline-offset-[0.5px] outline-border'
                      : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                  )}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-[14px] font-medium">{label}</span>
                  <span className="font-mono text-[11px] text-subtle-foreground">{count}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-[12px] border-t border-border p-[16px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-start justify-between">
            <span className="text-[12px] text-muted-foreground">Feedbacks p/ próximo treino</span>
            <span className="font-mono text-[11px] text-muted-foreground">18 / 30</span>
          </div>
          <div className="h-[4px] w-full rounded-[2px] bg-muted">
            <div className="h-[4px] rounded-[2px] bg-primary" style={{ width: '60%' }} />
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6600_14.645%,#7a2e00_85.355%)] text-[11px] font-semibold text-white">
            GB
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-[13px] font-medium text-foreground">Gabriel Barbosa</span>
            <span className="text-[12px] text-subtle-foreground">gabriel@liderhub.ai</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
