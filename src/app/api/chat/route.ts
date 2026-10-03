// Simulação de atendimento: recebe a nova mensagem do usuário, carrega o histórico do banco,
// faz streaming da resposta do agente e grava mensagem + trace (execution).
import { createUIMessageStreamResponse, streamText, toUIMessageStream, type ModelMessage, type UIMessage } from 'ai'
import { anthropic, anthropicOptions, recordExecution } from '@/lib/server/ai'
import { db, must } from '@/lib/server/db'

export const maxDuration = 120

function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
    .trim()
}

export async function POST(req: Request) {
  const { conversationId, message } = (await req.json()) as { conversationId: string; message: UIMessage }
  const userText = textOf(message)
  if (!conversationId || !userText) return Response.json({ error: 'conversationId e mensagem são obrigatórios' }, { status: 400 })

  const conversation = must(
    await db.from('conversations').select('id, prompt_version_id, agents(model), prompt_versions(system_prompt)').eq('id', conversationId).single(),
    'conversa',
  ) as unknown as { id: string; prompt_version_id: string; agents: { model: string }; prompt_versions: { system_prompt: string } }

  must(await db.from('messages').insert({ conversation_id: conversationId, role: 'user', content: userText }).select('id').single(), 'mensagem do usuário')

  const history = must(await db.from('messages').select('role, content').eq('conversation_id', conversationId).order('created_at'), 'histórico')

  const model = conversation.agents.model
  const instructions = conversation.prompt_versions.system_prompt
  const messages: ModelMessage[] = history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  const started = Date.now()

  const persist = async (
    output: string,
    extra: { inputTokens?: number; outputTokens?: number; finishReason?: string; error?: string },
  ) => {
    const executionId = await recordExecution({
      kind: 'chat',
      conversationId,
      promptVersionId: conversation.prompt_version_id,
      model,
      input: { instructions, messages },
      output,
      latencyMs: Date.now() - started,
      ...extra,
    })
    if (output) {
      await db.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: output, execution_id: executionId })
    }
  }

  const result = streamText({
    model: anthropic(model),
    instructions,
    messages,
    maxOutputTokens: 8000,
    // Atendimento conversacional: effort baixo mantém latência e custo baixos.
    providerOptions: anthropicOptions('low'),
    // Os callbacks rodam enquanto o stream ainda está aberto, então a invocação segue viva até gravar.
    onEnd: (event) =>
      persist(event.text, {
        inputTokens: event.usage.inputTokens,
        outputTokens: event.usage.outputTokens,
        finishReason: event.finishReason,
      }),
    onError: ({ error }) => persist('', { error: String(error) }),
  })

  return createUIMessageStreamResponse({
    // App interno: mostra o erro real no chat (o padrão do SDK mascara como "An error occurred").
    stream: toUIMessageStream({ stream: result.stream, onError: (error) => (error instanceof Error ? error.message : String(error)) }),
  })
}
