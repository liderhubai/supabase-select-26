import 'server-only'
import { createAnthropic, type AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';
import { generateText, Output, type ModelMessage } from 'ai';
import type { z } from 'zod';
import { db } from './db';

// User keys (sk-ant-usr…) not tied to a workspace require the anthropic-workspace-id header.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
});

/** Model used by the optimizer (reflection), the judge and the simulated user. */
export const OPTIMIZER_MODEL = 'claude-sonnet-5-5';

type Effort = NonNullable<AnthropicLanguageModelOptions['effort']>;

export function anthropicOptions(effort: Effort) {
  return {
    anthropic: {
      effort,
      // If a safety classifier refuses the turn, the API retries on the recommended fallback model.
      fallbacks: 'default',
    } satisfies AnthropicLanguageModelOptions,
  };
}

export type ExecutionKind = 'chat' | 'optimize' | 'test_user' | 'test_agent' | 'judge' | 'confidence';

export interface TraceContext {
  kind: ExecutionKind;
  conversationId?: string | null;
  promptVersionId?: string | null;
}

/** Records a trace (execution) with input, output, tokens and latency. Returns the id. */
export async function recordExecution(args: TraceContext & {
  model: string;
  input: unknown;
  output?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  finishReason?: string;
  error?: string;
}): Promise<string | null> {
  const { data, error } = await db
    .from('executions')
    .insert({
      kind: args.kind,
      conversation_id: args.conversationId ?? null,
      prompt_version_id: args.promptVersionId ?? null,
      model: args.model,
      input: args.input,
      output: args.output ?? null,
      input_tokens: args.inputTokens ?? null,
      output_tokens: args.outputTokens ?? null,
      latency_ms: args.latencyMs,
      finish_reason: args.finishReason ?? null,
      error: args.error ?? null,
    })
    .select('id')
    .single();
  if (error) console.error('recordExecution', error.message);
  return data?.id ?? null;
}

/** generateText with automatic tracing into `executions`. */
export async function tracedText(opts: TraceContext & {
  model: string;
  instructions: string;
  messages: ModelMessage[];
  effort: Effort;
  maxOutputTokens?: number;
}) {
  const started = Date.now();
  const input = { instructions: opts.instructions, messages: opts.messages };
  try {
    const result = await generateText({
      model: anthropic(opts.model),
      instructions: opts.instructions,
      messages: opts.messages,
      maxOutputTokens: opts.maxOutputTokens ?? 16000,
      providerOptions: anthropicOptions(opts.effort),
    });
    const executionId = await recordExecution({
      ...opts,
      input,
      output: result.text,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs: Date.now() - started,
      finishReason: result.finishReason,
    });
    return { text: result.text, executionId };
  } catch (e) {
    await recordExecution({ ...opts, input, latencyMs: Date.now() - started, error: String(e) });
    throw e;
  }
}

/** generateText + Output.object with automatic tracing. */
export async function tracedObject<S extends z.ZodType>(opts: TraceContext & {
  model: string;
  instructions: string;
  prompt: string;
  schema: S;
  effort: Effort;
  maxOutputTokens?: number;
}): Promise<z.infer<S>> {
  const started = Date.now();
  const input = { instructions: opts.instructions, messages: [{ role: 'user', content: opts.prompt }] };
  try {
    const result = await generateText({
      model: anthropic(opts.model),
      instructions: opts.instructions,
      prompt: opts.prompt,
      output: Output.object({ schema: opts.schema }),
      maxOutputTokens: opts.maxOutputTokens ?? 32000,
      providerOptions: anthropicOptions(opts.effort),
    });
    await recordExecution({
      ...opts,
      input,
      output: JSON.stringify(result.output),
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs: Date.now() - started,
      finishReason: result.finishReason,
    });
    return result.output as z.infer<S>;
  } catch (e) {
    await recordExecution({ ...opts, input, latencyMs: Date.now() - started, error: String(e) });
    throw e;
  }
}
