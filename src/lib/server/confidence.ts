import 'server-only'
import { z } from 'zod'
import { OPTIMIZER_MODEL, tracedObject } from './ai'

const schema = z.object({
  score: z.number().int().min(0).max(100).describe('Confidence that the reply is correct, grounded in the system prompt and safe to send, from 0 to 100'),
  reason: z.string().describe('One or two sentences explaining the score, naming any claim that is unsupported or risky'),
})

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
}) {
  const transcript = args.history.map((m) => `${m.role === 'user' ? 'CUSTOMER' : 'AGENT'}: ${m.content}`).join('\n\n')
  return tracedObject({
    kind: 'confidence',
    conversationId: args.conversationId,
    promptVersionId: args.promptVersionId,
    model: OPTIMIZER_MODEL,
    effort: 'low',
    maxOutputTokens: 1000,
    schema,
    instructions: `You are a confidence scorer for a customer-service AI agent. Given the agent's system prompt, the conversation and the agent's latest reply, rate how confident a human supervisor should be that the reply is correct and safe to send.
Score 0-100:
- 90-100: fully supported by the system prompt, accurate, on-policy, appropriate tone.
- 60-89: mostly fine but includes minor assumptions or small gaps.
- 30-59: contains unsupported claims, guesses, missing confirmations, or questionable policy handling.
- 0-29: likely wrong, invents facts (prices, policies, availability), violates the instructions, or is unsafe.
Penalize invented details that are not in the system prompt. Do not reward length or politeness alone.`,
    prompt: `<system_prompt>\n${args.instructions}\n</system_prompt>\n\n<conversation>\n${transcript}\n</conversation>\n\n<latest_reply>\n${args.reply}\n</latest_reply>`,
  })
}
