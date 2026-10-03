'use client'

import { useState } from 'react'
import { Markdown } from '@/components/Markdown'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Code2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ago, cn, unwrap } from '@/lib/utils'
import type { Conversation, Execution, Feedback, Message, PromptVersion } from '@/lib/types'
import { Badge, Button, Card, Input, Label, Modal, StatusBadge, Textarea } from '@/components/ui'

type Detail = Conversation & { agents: { name: string; model: string }; prompt_versions: PromptVersion }

const kindLabel: Record<Execution['kind'], string> = {
  chat: 'agente',
  test_agent: 'agente (teste)',
  test_user: 'cliente simulado',
  judge: 'juiz',
  optimize: 'otimizador',
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const id = conversationId!
  const [trace, setTrace] = useState<Execution | null>(null)
  const [feedbackFor, setFeedbackFor] = useState<{ message: Message; rating: 'positive' | 'negative' } | null>(null)

  const { data: conv } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => unwrap(await supabase.from('conversations').select('*, agents(name, model), prompt_versions(*)').eq('id', id).single()) as Detail,
  })
  const { data: messages } = useQuery({
    queryKey: ['messages', id, 'review'],
    queryFn: async () => unwrap(await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at')) as Message[],
  })
  const { data: executions } = useQuery({
    queryKey: ['executions', id],
    queryFn: async () => unwrap(await supabase.from('executions').select('*').eq('conversation_id', id).order('created_at')) as Execution[],
  })
  const { data: feedbacks } = useQuery({
    queryKey: ['feedbacks', id],
    queryFn: async () => unwrap(await supabase.from('feedbacks').select('*').eq('conversation_id', id).order('created_at')) as Feedback[],
  })

  if (!conv) return null
  const execById = new Map(executions?.map((e) => [e.id, e]))

  return (
    <>
      <Link href="/observability" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={14} /> Observabilidade
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{conv.customer_label}</h1>
        <Badge>{conv.agents.name}</Badge>
        <Link href={`/versions/${conv.prompt_version_id}`}>
          <Badge tone="violet">prompt v{conv.prompt_versions.version}</Badge>
        </Link>
        <StatusBadge status={conv.prompt_versions.status} />
        {conv.source === 'test' && <Badge tone="blue">teste automático</Badge>}
        <span className="text-sm text-zinc-500">{ago(conv.created_at)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="space-y-4 p-4">
          <p className="text-xs text-zinc-500">Revise o diálogo e marque as respostas do agente com 👍 ou 👎. O feedback entra na fila de auto-melhoria.</p>
          {messages?.map((m) => {
            const fbs = feedbacks?.filter((f) => f.message_id === m.id) ?? []
            const exec = m.execution_id ? execById.get(m.execution_id) : undefined
            return (
              <div key={m.id} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">{m.role === 'user' ? 'cliente' : 'agente'}</div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    m.role === 'user' ? 'rounded-br-sm bg-zinc-900 text-white' : 'rounded-bl-sm bg-zinc-100',
                    fbs.some((f) => f.rating === 'negative') && 'ring-2 ring-red-300',
                    fbs.some((f) => f.rating === 'positive') && !fbs.some((f) => f.rating === 'negative') && 'ring-2 ring-emerald-300',
                  )}
                >
                  <Markdown invert={m.role === 'user'}>{m.content}</Markdown>
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-1 flex items-center gap-1 text-zinc-400">
                    <button className="rounded p-1 hover:bg-emerald-50 hover:text-emerald-700" title="Feedback positivo" onClick={() => setFeedbackFor({ message: m, rating: 'positive' })}>
                      <ThumbsUp size={14} />
                    </button>
                    <button className="rounded p-1 hover:bg-red-50 hover:text-red-700" title="Feedback negativo" onClick={() => setFeedbackFor({ message: m, rating: 'negative' })}>
                      <ThumbsDown size={14} />
                    </button>
                    {exec && (
                      <button className="flex items-center gap-1 rounded p-1 text-xs hover:bg-zinc-100 hover:text-zinc-700" onClick={() => setTrace(exec)}>
                        <Code2 size={14} /> trace · {exec.latency_ms} ms · {(exec.input_tokens ?? 0) + (exec.output_tokens ?? 0)} tok
                      </button>
                    )}
                  </div>
                )}
                {fbs.map((f) => (
                  <div key={f.id} className={cn('mt-1 max-w-[85%] rounded-md border px-2.5 py-1.5 text-xs', f.rating === 'positive' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                    <div className="flex items-center gap-2">
                      {f.rating === 'positive' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                      <b>{f.reviewer_name}</b>
                      <StatusBadge status={f.status} />
                    </div>
                    {f.comment && <p className="mt-1 text-zinc-700">{f.comment}</p>}
                  </div>
                ))}
              </div>
            )
          })}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="border-b border-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500">Traces (executions)</div>
            {executions?.map((e) => (
              <button key={e.id} onClick={() => setTrace(e)} className="flex w-full items-center justify-between border-b border-zinc-50 px-3 py-2 text-left text-xs hover:bg-zinc-50">
                <span className="flex items-center gap-1.5">
                  <Badge tone={e.error ? 'red' : e.kind === 'judge' ? 'violet' : e.kind === 'test_user' ? 'blue' : 'zinc'}>{kindLabel[e.kind]}</Badge>
                  <span className="text-zinc-500">{e.model}</span>
                </span>
                <span className="tabular-nums text-zinc-500">
                  {e.latency_ms} ms · {(e.input_tokens ?? 0) + (e.output_tokens ?? 0)} tok
                </span>
              </button>
            ))}
            {executions && !executions.length && <p className="p-3 text-xs text-zinc-400">Sem traces.</p>}
          </Card>
          <Card className="p-3">
            <div className="mb-2 text-xs font-medium text-zinc-500">Prompt usado (v{conv.prompt_versions.version})</div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs text-zinc-700">{conv.prompt_versions.system_prompt}</pre>
          </Card>
        </div>
      </div>

      <TraceModal execution={trace} onClose={() => setTrace(null)} />
      {feedbackFor && <FeedbackModal conv={conv} target={feedbackFor} onClose={() => setFeedbackFor(null)} />}
    </>
  )
}

function TraceModal({ execution, onClose }: { execution: Execution | null; onClose: () => void }) {
  if (!execution) return null
  return (
    <Modal open onClose={onClose} title={`Trace · ${kindLabel[execution.kind]}`} wide>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <Badge>{execution.model}</Badge>
        <Badge>{execution.latency_ms} ms</Badge>
        <Badge>in {execution.input_tokens ?? '—'} tok</Badge>
        <Badge>out {execution.output_tokens ?? '—'} tok</Badge>
        {execution.finish_reason && <Badge>finish: {execution.finish_reason}</Badge>}
        {execution.error && <Badge tone="red">erro</Badge>}
      </div>
      {execution.error && <pre className="mb-3 whitespace-pre-wrap rounded bg-red-50 p-2 text-xs text-red-700">{execution.error}</pre>}
      <Label>Input · instructions</Label>
      <pre className="mb-3 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{execution.input.instructions}</pre>
      <Label>Input · messages</Label>
      <pre className="mb-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{JSON.stringify(execution.input.messages, null, 2)}</pre>
      <Label>Output</Label>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{execution.output}</pre>
    </Modal>
  )
}

function FeedbackModal({ conv, target, onClose }: { conv: Detail; target: { message: Message; rating: 'positive' | 'negative' }; onClose: () => void }) {
  const qc = useQueryClient()
  const [rating, setRating] = useState(target.rating)
  const [comment, setComment] = useState('')
  const [reviewer, setReviewer] = useState(() => {
    try {
      return localStorage.getItem('reviewer_name') ?? ''
    } catch {
      return ''
    }
  })

  const save = useMutation({
    mutationFn: async () => {
      try {
        localStorage.setItem('reviewer_name', reviewer)
      } catch {
        /* sem storage */
      }
      return unwrap(
        await supabase.from('feedbacks').insert({
          message_id: target.message.id,
          conversation_id: conv.id,
          execution_id: target.message.execution_id,
          prompt_version_id: conv.prompt_version_id,
          agent_id: conv.agent_id,
          rating,
          comment,
          reviewer_name: reviewer || 'Revisor',
        }),
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedbacks'] })
      qc.invalidateQueries({ queryKey: ['observability'] })
      onClose()
    },
  })

  return (
    <Modal open onClose={onClose} title="Feedback da mensagem">
      <blockquote className="mb-3 max-h-40 overflow-auto rounded-md border-l-2 border-zinc-300 bg-zinc-50 p-2">
        <Markdown>{target.message.content}</Markdown>
      </blockquote>
      <div className="mb-3 flex gap-2">
        <Button variant={rating === 'positive' ? 'success' : 'secondary'} onClick={() => setRating('positive')}>
          <ThumbsUp size={14} /> Positivo
        </Button>
        <Button variant={rating === 'negative' ? 'danger' : 'secondary'} onClick={() => setRating('negative')}>
          <ThumbsDown size={14} /> Negativo
        </Button>
      </div>
      <Label hint="o que deveria ter acontecido?">Contexto extra</Label>
      <Textarea
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={rating === 'negative' ? 'Ex.: deveria ter confirmado o convênio antes de oferecer horário.' : 'Ex.: ótima forma de contornar a objeção de preço.'}
      />
      <div className="mt-3">
        <Label>Revisor</Label>
        <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Seu nome" />
      </div>
      {save.error && <p className="mt-2 text-sm text-red-600">{save.error.message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Enviar para a fila
        </Button>
      </div>
    </Modal>
  )
}
