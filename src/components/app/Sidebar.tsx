'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Activity, Bot, FlaskConical, MessagesSquare, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Logo } from './Logo'

type CountKey = 'chats' | 'executions' | 'feedback' | 'trainings'

const nav: { section: string; items: { href: string; label: string; count?: CountKey; icon: typeof Activity }[] }[] = [
  {
    section: 'AGENT',
    items: [
      { href: '/app/agents', label: 'Agents', icon: Bot },
      { href: '/app/chats', label: 'Chats', count: 'chats', icon: MessagesSquare },
      { href: '/app/executions', label: 'Executions', count: 'executions', icon: Activity },
    ],
  },
  {
    section: 'TRAINING',
    items: [
      { href: '/app/feedback', label: 'Feedback', count: 'feedback', icon: ThumbsUp },
      { href: '/app/trainings', label: 'Trainings', count: 'trainings', icon: FlaskConical },
    ],
  },
]

function useCounts(agentId: string | undefined) {
  return useQuery({
    queryKey: ['counts', agentId],
    enabled: !!agentId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<Record<CountKey, number>> => {
      const id = agentId!
      const [chats, executions, feedback, trainings] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', id).eq('source', 'simulation'),
        supabase
          .from('executions')
          .select('id, conversations!inner(agent_id)', { count: 'exact', head: true })
          .eq('kind', 'chat')
          .eq('conversations.agent_id', id),
        supabase.from('feedbacks').select('id', { count: 'exact', head: true }).eq('agent_id', id).eq('status', 'pending'),
        supabase.from('optimization_jobs').select('id', { count: 'exact', head: true }).eq('agent_id', id),
      ])
      return { chats: chats.count ?? 0, executions: executions.count ?? 0, feedback: feedback.count ?? 0, trainings: trainings.count ?? 0 }
    },
  })
}

export function Sidebar() {
  const pathname = usePathname()
  const { agent, agents, setAgentId } = useCurrentAgent()
  const { data: counts } = useCounts(agent?.id)

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-background">
      <div className="flex flex-col gap-[16px] px-[16px] pt-[18px] pb-[12px]">
        <Link href="/" aria-label="itera.ai home">
          <Logo />
        </Link>
        <div className="flex flex-col gap-[6px]">
          <span className="px-[2px] font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">AGENT</span>
          <Select value={agent?.id ?? ''} onValueChange={setAgentId}>
            <SelectTrigger
              aria-label="Select agent"
              className="h-[40px]! w-full gap-[10px] rounded-[12px] border-border bg-surface! px-[10px] shadow-none hover:bg-surface-raised!"
            >
              <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] bg-primary text-[11px] font-semibold text-white">
                {agent?.name.charAt(0).toUpperCase() ?? '·'}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-[14px] font-medium text-foreground">
                {agent ? `${agent.name}${agent.production ? ` · v${agent.production.version}` : ''}` : 'Loading…'}
              </span>
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-[12px] border-border">
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id} className="rounded-[8px] py-[8px] focus:bg-surface focus:text-foreground">
                  <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] bg-primary text-[11px] font-semibold text-white">
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-[14px]">{a.name}</span>
                  {a.production && <span className="font-mono text-[11px] text-subtle-foreground">v{a.production.version}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                  <span className="font-mono text-[11px] text-subtle-foreground">{count ? (counts?.[count] ?? '') : ''}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-[4px] border-t border-border p-[16px]">
        <span className="text-[12px] text-muted-foreground">Pending feedback for next training</span>
        <Link href="/app/feedback" className="font-display text-[18px] font-medium text-foreground hover:text-accent">
          {counts?.feedback ?? '—'}
        </Link>
      </div>
    </aside>
  )
}
