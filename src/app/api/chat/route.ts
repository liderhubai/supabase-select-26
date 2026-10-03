// Conversation simulation: receives the user's new message, loads the history from the database,
// streams the agent's reply and records the message + trace (execution).
import { createUIMessageStreamResponse, streamText, toUIMessageStream, type ModelMessage, type UIMessage } from 'ai'
import { anthropic, anthropicOptions, recordExecution } from '@/lib/server/ai'
import { db, must } from '@/lib/server/db'
import { applyConfidence, scoreConfidence } from '@/lib/server/confidence'

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
  if (!conversationId || !userText) return Response.json({ error: 'conversationId and message are required' }, { status: 400 })

  const conversation = must(
    await db.from('conversations').select('id, prompt_version_id, agents(model), prompt_versions(system_prompt)').eq('id', conversationId).single(),
    'conversation',
  ) as unknown as { id: string; prompt_version_id: string; agents: { model: string }; prompt_versions: { system_prompt: string } }

  must(await db.from('messages').insert({ conversation_id: conversationId, role: 'user', content: userText }).select('id').single(), 'user message')

  const history = must(await db.from('messages').select('role, content').eq('conversation_id', conversationId).order('created_at'), 'history')

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
      const { data: saved } = await db
        .from('messages')
        .insert({ conversation_id: conversationId, role: 'assistant', content: output, execution_id: executionId })
        .select('id')
        .single()
      // Confidence scorer agent; a failure here must not lose the reply.
      try {
        const result = await scoreConfidence({ conversationId, promptVersionId: conversation.prompt_version_id, instructions, history, reply: output })
        if (saved) {
          await applyConfidence({ messageId: saved.id, conversationId, executionId, promptVersionId: conversation.prompt_version_id, result })
        }
      } catch (e) {
        console.error('scoreConfidence', e)
      }
    }
  }

  const result = streamText({
    model: anthropic(model),
    instructions,
    messages,
    maxOutputTokens: 8000,
    // Conversational support: low effort keeps latency and cost down.
    providerOptions: anthropicOptions(model, 'low'),
    // The callbacks run while the stream is still open, so the invocation stays alive until the write completes.
    onEnd: (event) =>
      persist(event.text, {
        inputTokens: event.usage.inputTokens,
        outputTokens: event.usage.outputTokens,
        finishReason: event.finishReason,
      }),
    onError: ({ error }) => persist('', { error: String(error) }),
  })

  return createUIMessageStreamResponse({
    // Internal app: shows the real error in the chat (the SDK default masks it as "An error occurred").
    stream: toUIMessageStream({ stream: result.stream, onError: (error) => (error instanceof Error ? error.message : String(error)) }),
  })
}
