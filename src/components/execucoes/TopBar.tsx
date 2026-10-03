import { Bell, BookOpen, Search } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-[56px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[24px]">
      <div className="flex items-center gap-[8px]">
        <span className="text-[14px] text-muted-foreground">liderhub</span>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <span className="text-[14px] text-muted-foreground">Agente SDR</span>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <span className="text-[14px] font-medium text-foreground">Execuções</span>
      </div>
      <div className="flex-1" />
      <div className="flex h-[36px] w-[260px] items-center gap-[8px] rounded-full border border-border bg-surface pr-[6px] pl-[12px]">
        <Search size={15} className="shrink-0 text-subtle-foreground" />
        <span className="flex-1 overflow-hidden whitespace-nowrap text-[13px] text-subtle-foreground">Buscar mensagens, execuções…</span>
        <span className="flex h-[22px] items-center rounded-[6px] border border-border bg-surface-raised px-[6px] font-mono text-[11px] text-muted-foreground">
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-[4px]">
        <button type="button" className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-muted-foreground hover:bg-surface">
          <BookOpen size={16} />
        </button>
        <button type="button" className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-muted-foreground hover:bg-surface">
          <Bell size={16} />
        </button>
      </div>
    </header>
  )
}
