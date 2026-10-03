import 'server-only'
import { z } from 'zod'
import { ROLE_MODELS, tracedObject } from './ai'
import { db } from './db'

/** Replies scored below this go to the improvement queue as automatic negative feedback. */
export const LOW_CONFIDENCE_THRESHOLD = 60

const ISSUE_TYPES = ['invented_fact', 'policy_violation', 'missing_confirmation', 'wrong_answer', 'off_topic', 'tone', 'unsafe'] as const

const schema = z.object({
  issues: z
    .array(
      z.object({
        type: z.enum(ISSUE_TYPES),
        excerpt: z.string().describe('The exact excerpt of the reply with the problem'),
        explanation: z.string().describe('Why it is a problem, citing the system prompt when relevant'),
      }),
    )
    .describe('Every problem found in the reply; empty if there are none. List them before deciding the score.'),
  score: z.number().int().min(0).max(100).describe('Confidence that the reply is correct, grounded in the system prompt and safe to send, from 0 to 100'),
  reason: z.string().describe('One or two sentences explaining the score'),
})

export type ConfidenceResult = z.infer<typeof schema>

/**
 * Confidence scorer agent: rates how confident we should be in an assistant reply,
 * given the agent's instructions and the conversation so far.
 */
export async function scoreConfidence(args: {
  conversationId: string
  promptVersionId: string
  instructions: string
  history: { role: string; content: string }[]
  reply: string
}): Promise<ConfidenceResult> {
  const transcript = args.history.map((m) => `${m.role === 'user' ? 'CUSTOMER' : 'AGENT'}: ${m.content}`).join('\n\n')
  return tracedObject({
    kind: 'confidence',
    conversationId: args.conversationId,
    promptVersionId: args.promptVersionId,
    model: ROLE_MODELS.confidence,
    effort: 'low',
    maxOutputTokens: 2000,
    schema,
    instructions: `You are a confidence scorer for a customer-service AI agent. Given the agent's system prompt, the conversation and the agent's latest reply, rate how confident a human supervisor should be that the reply is correct and safe to send.

First audit the reply:
- Check every factual claim (prices, hours, plans, policies, availability, names) against the system prompt. A claim the system prompt does not support is an invented_fact, even if it sounds plausible.
- Check that the reply follows the instructions in the system prompt (required questions, steps, limits) and answers what the customer actually asked.
- Flag actions the agent says it took or promises it made that it cannot actually perform (e.g. "your appointment is confirmed" without the required data).
Record each problem in issues, quoting the excerpt.

Then score 0-100:
- 90-100: no issues; fully supported by the system prompt, on-policy, appropriate tone.
- 60-89: only minor issues (small assumptions, slightly off tone) that would not mislead the customer.
- 30-59: at least one unsupported claim, missing confirmation or questionable policy handling.
- 0-29: invents facts the customer would act on, violates the instructions, or is unsafe.
Do not reward length or politeness alone.`,
    prompt: `<system_prompt>\n${args.instructions}\n</system_prompt>\n\n<conversation>\n${transcript}\n</conversation>\n\n<latest_reply>\n${args.reply}\n</latest_reply>`,
  })
}

/**
 * Stores the score on the message. A low score also files an automatic negative feedback,
 * so the reply shows up in the improvement queue for a human to process or dismiss.
 */
export async function applyConfidence(args: {
  messageId: string
  conversationId: string
  executionId: string | null
  promptVersionId: string
  result: ConfidenceResult
}) {
  const { result } = args
  await db
    .from('messages')
    .update({ confidence: result.score, confidence_reason: result.reason, confidence_issues: result.issues })
    .eq('id', args.messageId)

  if (result.score >= LOW_CONFIDENCE_THRESHOLD) return

  const { data: conv } = await db.from('conversations').select('agent_id').eq('id', args.conversationId).single()
  if (!conv) return
  const issues = result.issues.map((i) => `- [${i.type}] "${i.excerpt}": ${i.explanation}`).join('\n')
  const { error } = await db.from('feedbacks').insert({
    message_id: args.messageId,
    conversation_id: args.conversationId,
    execution_id: args.executionId,
    prompt_version_id: args.promptVersionId,
    agent_id: conv.agent_id,
    rating: 'negative',
    comment: `Low confidence (${result.score}%): ${result.reason}${issues ? `\n${issues}` : ''}`,
    reviewer_name: 'Confidence scorer',
    origin: 'auto',
  })
  if (error) console.error('auto feedback', error.message)
}
