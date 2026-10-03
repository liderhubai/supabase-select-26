import type { ReactNode } from 'react'
import { Sidebar } from '@/components/app/Sidebar'

// Shell do app itera.ai: sidebar fixa de 248px + área da tela (1440×960 no design, fluida aqui).
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
