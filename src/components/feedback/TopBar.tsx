import { Bell, BookOpen, Search } from 'lucide-react'

// Top Bar (X5Uvr6) — 56px, breadcrumb + busca + ajuda.
export function TopBar() {
  return (
    <header className="flex h-[56px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[24px]">
      <div className="flex items-center gap-[8px]">
        <span className="text-[14px] text-muted-foreground">liderhub</span>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <span className="text-[14px] text-muted-foreground">Agente SDR</span>
        <span className="font-mono text-[13px] text-subtle-foreground">/</span>
        <span className="text-[14px] font-medium text-foreground">Feedback</span>
      </div>
      <div className="h-px flex-1" />
      <div className="flex h-[36px] w-[260px] items-center gap-[8px] rounded-full bg-surface pr-[6px] pl-[12px] outline outline-1 -outline-offset-1 outline-border">
        <Search size={15} className="shrink-0 text-subtle-foreground" />
        <span className="flex-1 text-[13px] text-subtle-foreground">Buscar feedbacks…</span>
        <span className="flex h-[22px] items-center rounded-[6px] bg-surface-raised px-[6px] font-mono text-[11px] text-muted-foreground outline outline-1 -outline-offset-1 outline-border">
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-[4px]">
        {[BookOpen, Bell].map((Icon, i) => (
          <button
            key={i}
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-muted-foreground outline outline-1 -outline-offset-1 outline-border hover:bg-surface"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </header>
  )
}
