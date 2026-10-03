'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAgents, useVersions } from '@/lib/api'
import { ago } from '@/lib/utils'
import { Card, Empty, PageHeader, Select, StatusBadge } from '@/components/ui'

export default function VersionsPage() {
  const { data: agents } = useAgents()
  const [agentId, setAgentId] = useState('')
  const { data: versions } = useVersions(agentId || undefined)
  const agentName = (id: string) => agents?.find((a) => a.id === id)?.name ?? ''

  const staging = versions?.filter((v) => v.status === 'staging' || v.status === 'draft') ?? []
  const others = versions?.filter((v) => v.status !== 'staging' && v.status !== 'draft') ?? []

  return (
    <>
      <PageHeader
        title="Versões de prompt"
        description="Versões em staging aguardam revisão: veja o diff, o motivo de cada mudança e a bateria de testes antes de promover."
        actions={
          <Select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-56">
            <option value="">Todos os agentes</option>
            {agents?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        }
      />

      <h2 className="mb-2 text-sm font-medium text-zinc-500">Aguardando revisão</h2>
      {!staging.length ? (
        <Empty>Nenhuma versão em staging.</Empty>
      ) : (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {staging.map((v) => (
            <Link key={v.id} href={`/versions/${v.id}`}>
              <Card className="h-full p-4 transition hover:border-zinc-400">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {agentName(v.agent_id)} · v{v.version}
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-600">{v.change_summary}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {v.changes.length} mudanças justificadas · {ago(v.created_at)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-8 text-sm font-medium text-zinc-500">Histórico</h2>
      <Card>
        {others.map((v) => (
          <Link key={v.id} href={`/versions/${v.id}`} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2.5 text-sm last:border-0 hover:bg-zinc-50">
            <div className="min-w-0">
              <span className="font-medium">
                {agentName(v.agent_id)} · v{v.version}
              </span>
              <span className="ml-2 truncate text-zinc-500">{v.change_summary}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-zinc-400">{ago(v.created_at)}</span>
              <StatusBadge status={v.status} />
            </div>
          </Link>
        ))}
      </Card>
    </>
  )
}
