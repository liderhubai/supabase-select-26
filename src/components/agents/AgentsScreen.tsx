'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Rocket, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentAgent } from '@/lib/queries'
import { ago, cn, unwrap } from '@/lib/utils'
import type { PromptVersion } from '@/lib/types'
import { TopBar } from '@/components/app/TopBar'
import { VersionStatus } from '@/components/trainings/status'

type VersionRow = Pick<PromptVersion, 'id' | 'version' | 'system_prompt' | 'status' | 'change_summary' | 'created_at'>

export function AgentsScreen() {
  const qc = useQueryClient()
  const { agent, agents, setAgentId } = useCurrentAgent()
  // Version being viewed (null = production) and the unsaved editor text (null = untouched).
  const [viewing, setViewing] = useState<string | null>(null)
  const [draft, setDraft] = useState<string | null>(null)

  const { data: versions } = useQuery({
    queryKey: ['versions', agent?.id],
    enabled: !!agent,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('prompt_versions')
          .select('id, version, system_prompt, status, change_summary, created_at')
          .eq('agent_id', agent!.id)
          .order('version', { ascending: false }),
      ) as VersionRow[],
  })

  const production = versions?.find((v) => v.id === agent?.production_version_id)
  const current = versions?.find((v) => v.id === viewing) ?? production
  const text = draft ?? current?.system_prompt ?? ''
  const dirty = draft != null && draft !== current?.system_prompt

  const select = (id: string) => {
    setAgentId(id)
    setViewing(null)
    setDraft(null)
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['versions'] })
    qc.invalidateQueries({ queryKey: ['agents'] })
    setViewing(null)
    setDraft(null)
  }

  const save = useMutation({
    mutationFn: async () => {
      const id = unwrap(await supabase.rpc('create_prompt_version', { p_agent_id: agent!.id, p_system_prompt: text, p_summary: 'Manual edit' })) as string
      unwrap(await supabase.rpc('promote_version', { p_version_id: id }))
    },
    onSuccess: refresh,
  })

  const publish = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.rpc('promote_version', { p_version_id: id })),
    onSuccess: refresh,
  })

  const error = save.error ?? publish.error

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar crumbs={[{ label: 'Agents' }]} />
      <div className="flex min-h-0 w-full flex-1">
        <nav className="flex w-[260px] shrink-0 flex-col gap-[4px] overflow-y-auto border-r border-border p-[16px]">
          <span className="px-[8px] pb-[8px] font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">AGENTS</span>
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => select(a.id)}
              className={cn(
                'flex flex-col gap-[2px] rounded-[12px] px-[12px] py-[10px] text-left transition-colors',
                a.id === agent?.id ? 'bg-surface-raised outline outline-1 -outline-offset-1 outline-border' : 'hover:bg-surface',
              )}
            >
              <span className="truncate text-[14px] font-medium text-foreground">{a.name}</span>
              <span className="truncate font-mono text-[11px] text-subtle-foreground">
                {a.production ? `v${a.production.version}` : 'no version'} · {a.model}
              </span>
            </button>
          ))}
        </nav>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[64px] shrink-0 items-center gap-[12px] border-b border-border px-[24px]">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-display text-[18px] font-medium text-foreground">{agent?.name ?? '…'}</span>
              <span className="truncate text-[13px] text-muted-foreground">
                {current ? `Viewing v${current.version}${current.id === production?.id ? ' · in production' : ''}` : agent?.description}
                {dirty && ' · unsaved changes'}
              </span>
            </div>
            {error && <span className="truncate text-[13px] text-error">{error.message}</span>}
            {dirty && (
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex h-[36px] items-center gap-[6px] rounded-full px-[14px] text-[14px] font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={14} /> Discard
              </button>
            )}
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={!dirty || !text.trim() || save.isPending}
              className="flex h-[36px] items-center gap-[6px] rounded-full bg-primary px-[16px] text-[14px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Rocket size={15} /> {save.isPending ? 'Publishing…' : 'Save & publish'}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="min-h-0 w-full flex-1 resize-none bg-background px-[24px] py-[20px] font-mono text-[13px] leading-[1.65] text-foreground outline-none"
          />
        </section>

        <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-border">
          <span className="px-[20px] pt-[18px] pb-[10px] font-mono text-[10.5px] tracking-[0.8px] text-subtle-foreground">VERSION HISTORY</span>
          {versions?.map((v) => (
            <div
              key={v.id}
              className={cn('flex flex-col gap-[6px] border-b border-border px-[20px] py-[12px]', v.id === current?.id && 'bg-surface-raised')}
            >
              <button
                type="button"
                onClick={() => {
                  setViewing(v.id)
                  setDraft(null)
                }}
                className="flex flex-col gap-[4px] text-left"
              >
                <div className="flex items-center gap-[8px]">
                  <span className="text-[14px] font-medium text-foreground">v{v.version}</span>
                  <VersionStatus status={v.id === production?.id ? 'production' : v.status} />
                  <span className="ml-auto text-[12px] text-subtle-foreground">{ago(v.created_at)}</span>
                </div>
                {v.change_summary && <span className="line-clamp-2 text-[13px] text-muted-foreground">{v.change_summary}</span>}
              </button>
              {v.id === current?.id && v.id !== production?.id && v.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => publish.mutate(v.id)}
                  disabled={publish.isPending}
                  className="flex h-[28px] w-fit items-center gap-[6px] rounded-full px-[12px] text-[12px] font-medium text-foreground outline outline-1 -outline-offset-1 outline-border-strong hover:bg-surface disabled:opacity-50"
                >
                  <Rocket size={12} /> Publish v{v.version}
                </button>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
