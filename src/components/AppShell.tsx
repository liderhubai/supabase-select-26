'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Activity, Bot, ListChecks, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/agents', label: 'Agents & Versions', icon: Bot },
  { href: '/simulation', label: 'Simulation', icon: MessagesSquare },
  { href: '/observability', label: 'Observability', icon: Activity },
  { href: '/queue', label: 'Improvement Queue', icon: ListChecks },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } }))

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-full flex-col md:flex-row">
        <aside className="border-b border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex h-full flex-col">
            <div className="px-4 py-3 font-semibold tracking-tight md:px-5 md:py-5">Agent Studio</div>
            <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-0">
              {tabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`) || (href === '/agents' && pathname.startsWith('/versions'))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm',
                      active ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </QueryClientProvider>
  )
}
