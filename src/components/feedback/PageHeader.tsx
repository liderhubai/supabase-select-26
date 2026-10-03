import { FolderPlus, History } from 'lucide-react'

// Page Header (AzM46) — título + descrição + ações.
export function PageHeader() {
  return (
    <div className="flex w-full items-end justify-between">
      <div className="flex w-[620px] flex-col gap-[10px]">
        <h1 className="font-display text-[32px] leading-[1.15] font-medium tracking-[-0.8px] text-foreground">Feedback</h1>
        <p className="text-[14px] leading-[1.5] text-muted-foreground">
          Os 👍 e 👎 das execuções caem aqui. Organize por grupo e treine o agente com todos de uma vez ou com um feedback específico.
        </p>
      </div>
      <div className="flex items-center gap-[10px]">
        <OutlineButton icon={FolderPlus} label="Novo grupo" />
        <OutlineButton icon={History} label="Treinos anteriores" />
      </div>
    </div>
  )
}

function OutlineButton({ icon: Icon, label }: { icon: typeof FolderPlus; label: string }) {
  return (
    <button
      type="button"
      className="flex h-[36px] items-center justify-center gap-[6px] rounded-full bg-background px-[16px] text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface"
    >
      <Icon size={16} />
      <span className="text-[14px] leading-[1.43] font-medium">{label}</span>
    </button>
  )
}
