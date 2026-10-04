'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const STORAGE_KEY = 'itera.agentId'

const AgentSelection = createContext<{ agentId: string | null; setAgentId: (id: string) => void }>({
  agentId: null,
  setAgentId: () => {},
})

export const useAgentSelection = () => useContext(AgentSelection)

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } } }),
  )
  const [agentId, setAgentIdState] = useState<string | null>(null)

  useEffect(() => {
    try {
      setAgentIdState(localStorage.getItem(STORAGE_KEY))
    } catch {
      /* no storage */
    }
  }, [])

  const setAgentId = (id: string) => {
    setAgentIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* no storage */
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AgentSelection.Provider value={{ agentId, setAgentId }}>{children}</AgentSelection.Provider>
      <Toaster theme="dark" position="bottom-right" richColors />
    </QueryClientProvider>
  )
}
