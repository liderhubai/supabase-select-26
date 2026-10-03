'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAgents, useVersions } from '@/lib/api'
import { ago } from '@/lib/utils'
import { Card, Empty, Select, StatusBadge } from '@/components/ui'

export function VersionsSection() {
  const { data: agents } = useAgents()
  const [agentId, setAgentId] = useState('')
  const { data: versions } = useVersions(agentId || undefined)
  const agentName = (id: string) => agents?.find((a) => a.id === id)?.name ?? ''

  const staging = versions?.filter((v) => v.status === 'staging' || v.status === 'draft') ?? []
  const others = versions?.filter((v) => v.status !== 'staging' && v.status !== 'draft') ?? []

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-t border-zinc-200 pt-8">
        <div>
          <h2 className="text-lg font-semibold">Prompt versions</h2>
          <p className="text-sm text-zinc-500">Staging versions are awaiting review: check the diff, the reason for each change, and the test suite before promoting.</p>
        </div>
        <Select value={agentId} onValueChange={setAgentId} className="w-56" options={[{ value: '', label: 'All agents' }, ...(agents ?? []).map((a) => ({ value: a.id, label: a.name }))]} />
      </div>

      <h3 className="mb-2 text-sm font-medium text-zinc-500">Awaiting review</h3>
      {!staging.length ? (
        <Empty>No versions in staging.</Empty>
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
                  {v.changes.length} justified changes · {ago(v.created_at)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h3 className="mb-2 mt-8 text-sm font-medium text-zinc-500">History</h3>
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
