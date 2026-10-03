import type { ReactNode } from 'react'
import { Providers } from '@/components/app/Providers'
import { Sidebar } from '@/components/app/Sidebar'

// App shell: fixed 248px sidebar + the screen area.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </Providers>
  )
}
