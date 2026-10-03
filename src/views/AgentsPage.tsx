'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessagesSquare, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAgents, useVersions } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/utils'
import type { Agent, TestCase } from '@/lib/types'
import { Badge, Button, Card, Empty, Input, Label, Modal, PageHeader, Select, StatusBadge, Textarea } from '@/components/ui'

const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
]

const KINDS = [
  { id: 'recepcao', label: 'Recepção' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'suporte', label: 'Suporte' },
  { id: 'outro', label: 'Outro' },
]

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Agentes"
        description="Crie agentes de atendimento e gerencie o prompt em produção e a bateria de testes de cada um."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={15} /> Novo agente
          </Button>
        }
      />
      {isLoading ? null : !agents?.length ? (
        <Empty>Nenhum agente ainda. Crie o primeiro.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      )}
      <CreateAgentModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const { data: versions } = useVersions(agent.id)
  const production = versions?.find((v) => v.id === agent.production_version_id)
  const [editing, setEditing] = useState(false)
  const [showTests, setShowTests] = useState(false)

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{agent.name}</h2>
            <Badge>{KINDS.find((k) => k.id === agent.kind)?.label ?? agent.kind}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{agent.description}</p>
        </div>
        <Link href={`/simulation?agent=${agent.id}`}>
          <Button variant="secondary">
            <MessagesSquare size={15} /> Simular
          </Button>
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>{MODELS.find((m) => m.id === agent.model)?.label ?? agent.model}</span>·
        {production && <span>v{production.version} em produção</span>}·
        <span>{versions?.length ?? 0} versões</span>
      </div>

      {production && (
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700">
          {production.system_prompt}
        </pre>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil size={14} /> Editar prompt
        </Button>
        <Button variant="ghost" onClick={() => setShowTests(true)}>
          Bateria de testes
        </Button>
        {versions
          ?.filter((v) => v.status === 'staging' || v.status === 'draft')
          .map((v) => (
            <Link key={v.id} href={`/versions/${v.id}`}>
              <Button variant="ghost">
                v{v.version} <StatusBadge status={v.status} />
              </Button>
            </Link>
          ))}
      </div>

      {production && (
        <EditPromptModal open={editing} onClose={() => setEditing(false)} agentId={agent.id} initial={production.system_prompt} />
      )}
      <TestCasesModal open={showTests} onClose={() => setShowTests(false)} agentId={agent.id} />
    </Card>
  )
}

function CreateAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', kind: 'recepcao', description: '', model: MODELS[0].id, prompt: '' })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const create = useMutation({
    mutationFn: async () =>
      unwrap(
        await supabase.rpc('create_agent', {
          p_name: form.name,
          p_kind: form.kind,
          p_description: form.description,
          p_model: form.model,
          p_system_prompt: form.prompt,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      qc.invalidateQueries({ queryKey: ['versions'] })
      setForm({ name: '', kind: 'recepcao', description: '', model: MODELS[0].id, prompt: '' })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Novo agente" wide>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label>Nome</Label>
          <Input value={form.name} onChange={set('name')} placeholder="Recepção — Clínica X" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.kind} onChange={set('kind')}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Modelo</Label>
          <Select value={form.model} onChange={set('model')}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-3">
          <Label>Descrição</Label>
          <Input value={form.description} onChange={set('description')} placeholder="O que esse agente faz" />
        </div>
        <div className="sm:col-span-3">
          <Label hint="vira a v1 em produção">Prompt de sistema</Label>
          <Textarea rows={12} value={form.prompt} onChange={set('prompt')} className="font-mono text-xs" />
        </div>
      </div>
      {create.error && <p className="mt-3 text-sm text-red-600">{create.error.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={!form.name || !form.prompt || create.isPending} onClick={() => create.mutate()}>
          Criar agente
        </Button>
      </div>
    </Modal>
  )
}

function EditPromptModal({ open, onClose, agentId, initial }: { open: boolean; onClose: () => void; agentId: string; initial: string }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [prompt, setPrompt] = useState(initial)
  const [summary, setSummary] = useState('')

  const save = useMutation({
    mutationFn: async () =>
      unwrap(await supabase.rpc('create_prompt_version', { p_agent_id: agentId, p_system_prompt: prompt, p_summary: summary || null })) as string,
    onSuccess: (versionId) => {
      qc.invalidateQueries({ queryKey: ['versions'] })
      onClose()
      router.push(`/versions/${versionId}`)
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Editar prompt (nova versão em rascunho)" wide>
      <Label>Prompt de sistema</Label>
      <Textarea rows={16} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="font-mono text-xs" />
      <div className="mt-3">
        <Label>Resumo da mudança</Label>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Ex.: reforça confirmação de dados antes de agendar" />
      </div>
      <p className="mt-2 text-xs text-zinc-500">A nova versão não vai direto para produção: você verá o diff e poderá rodar a bateria de testes antes de promover.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={prompt === initial || save.isPending} onClick={() => save.mutate()}>
          Criar versão
        </Button>
      </div>
    </Modal>
  )
}

function TestCasesModal({ open, onClose, agentId }: { open: boolean; onClose: () => void; agentId: string }) {
  const qc = useQueryClient()
  const key = ['test_cases', agentId]
  const { data: cases } = useQuery({
    queryKey: key,
    enabled: open,
    queryFn: async () => unwrap(await supabase.from('test_cases').select('*').eq('agent_id', agentId).order('created_at')) as TestCase[],
  })
  const empty = { name: '', persona: '', scenario: '', expected_behavior: '' }
  const [form, setForm] = useState(empty)

  const add = useMutation({
    mutationFn: async () => unwrap(await supabase.from('test_cases').insert({ ...form, agent_id: agentId, origin: 'manual' })),
    onSuccess: () => {
      setForm(empty)
      qc.invalidateQueries({ queryKey: key })
    },
  })
  const remove = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('test_cases').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return (
    <Modal open={open} onClose={onClose} title="Bateria de testes" wide>
      <p className="mb-3 text-sm text-zinc-500">
        Casos simulados por um cliente-IA e avaliados por um juiz-IA. A fila de melhoria também gera casos novos a partir dos feedbacks.
      </p>
      <div className="space-y-2">
        {cases?.map((c) => (
          <div key={c.id} className="rounded-md border border-zinc-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                {c.name} <Badge tone={c.origin === 'feedback' ? 'amber' : 'zinc'}>{c.origin}</Badge>
              </div>
              <button className="text-zinc-400 hover:text-red-600" onClick={() => remove.mutate(c.id)} aria-label="Remover">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="mt-1 text-zinc-600">
              <b>Persona:</b> {c.persona}
            </p>
            <p className="text-zinc-600">
              <b>Cenário:</b> {c.scenario}
            </p>
            <p className="text-zinc-600">
              <b>Esperado:</b> {c.expected_behavior}
            </p>
          </div>
        ))}
        {cases && !cases.length && <Empty>Nenhum caso ainda.</Empty>}
      </div>
      <div className="mt-4 grid gap-2 border-t border-zinc-100 pt-4">
        <Input placeholder="Nome do caso" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Persona do cliente" value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })} />
        <Textarea rows={2} placeholder="Cenário" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
        <Textarea
          rows={2}
          placeholder="Comportamento esperado (critérios)"
          value={form.expected_behavior}
          onChange={(e) => setForm({ ...form, expected_behavior: e.target.value })}
        />
        <div className="flex justify-end">
          <Button disabled={!form.name || !form.scenario || !form.expected_behavior || add.isPending} onClick={() => add.mutate()}>
            <Plus size={14} /> Adicionar caso
          </Button>
        </div>
      </div>
    </Modal>
  )
}
