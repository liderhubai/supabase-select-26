'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Activity, Bot, GitCompare, ListChecks, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/agents', label: 'Agentes', icon: Bot },
  { href: '/simulation', label: 'Simulação', icon: MessagesSquare },
  { href: '/observability', label: 'Observabilidade', icon: Activity },
  { href: '/queue', label: 'Fila de melhoria', icon: ListChecks },
  { href: '/versions', label: 'Versões', icon: GitCompare },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } }))

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4">
            <div className="py-3 font-semibold tracking-tight">Agent Studio</div>
            <nav className="-mb-px flex gap-1 overflow-x-auto">
              {tabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm',
                      active ? 'border-zinc-900 font-medium text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800',
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      </div>
    </QueryClientProvider>
  )
}
