import Link from 'next/link'
import { Bell, BookOpen, Search } from 'lucide-react'

// Top bar da tela Execução (Detalhe) — frame "Top Bar" (CnERd) do untitled.pen.
export function TopBar({ current }: { current: string }) {
  return (
    <header className="flex h-[56px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[24px]">
      <nav className="flex items-center gap-[8px]">
        <span className="text-[14px] text-muted-foreground">Agente SDR</span>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <Link href="/app/execucoes" className="text-[14px] text-muted-foreground hover:text-foreground">
          Execuções
        </Link>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <span className="text-[14px] font-medium text-foreground">{current}</span>
      </nav>
      <div className="h-px flex-1" />
      <label className="flex h-[36px] w-[260px] items-center gap-[8px] rounded-full border border-border bg-surface pr-[6px] pl-[12px]">
        <Search size={15} className="shrink-0 text-subtle-foreground" />
        <input
          placeholder="Buscar mensagens, execuções…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground"
        />
        <span className="flex h-[22px] items-center rounded-[6px] border border-border bg-surface-raised px-[6px] font-mono text-[11px] text-muted-foreground">
          ⌘K
        </span>
      </label>
      <div className="flex items-center gap-[4px]">
        <button type="button" className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border hover:bg-surface">
          <BookOpen size={16} className="text-muted-foreground" />
        </button>
        <button type="button" className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border hover:bg-surface">
          <Bell size={16} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
