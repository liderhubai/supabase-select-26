import 'server-only'
import { z } from 'zod';
import type { ModelMessage } from 'ai';
import { ROLE_MODELS, tracedObject, tracedText } from './ai';
import { db, must } from './db';
// Runs a test case: a simulated customer (LLM) talks to the agent using
// the run's prompt version; then a judge (LLM) evaluates the conversation against the criteria.

const END_TOKEN = '[FIM]';

const judgeSchema = z.object({
  score: z.number().min(0).max(10).describe('Score from 0 to 10.'),
  passed: z.boolean().describe('true if all essential criteria were met.'),
  reasoning: z.string().describe('Short justification citing excerpts from the conversation.'),
});

type Turn = { role: 'user' | 'assistant'; content: string };

async function runTest(testRunId: string) {
  const run = must(
    await db
      .from('test_runs')
      .select('*, test_cases(*), prompt_versions(id, version, system_prompt, agent_id, agents!prompt_versions_agent_id_fkey(name, model))')
      .eq('id', testRunId)
      .single(),
    'test run',
  );
  const tc = run.test_cases;
  const version = run.prompt_versions;
  const agentModel: string = version.agents.model;

  await db.from('test_runs').update({ status: 'running' }).eq('id', testRunId);

  const conversation = must(
    await db
      .from('conversations')
      .insert({
        agent_id: version.agent_id,
        prompt_version_id: version.id,
        customer_label: `Test: ${tc.name} (${run.variant})`,
        source: 'test',
      })
      .select('id')
      .single(),
    'test conversation',
  );
  await db.from('test_runs').update({ conversation_id: conversation.id }).eq('id', testRunId);

  const transcript: Turn[] = [];
  const userInstructions = `You are playing a CUSTOMER in a customer service simulation. Never say you are an AI.
Persona: ${tc.persona}
Scenario: ${tc.scenario}
Write only the customer's next message, short and natural like in a WhatsApp conversation.
When your goal has been resolved or the conversation has nowhere left to go, reply only ${END_TOKEN}.`;

  for (let turn = 0; turn < tc.max_turns; turn++) {
    // From the simulated customer's point of view, the roles are inverted.
    const userView: ModelMessage[] = transcript.length
      ? transcript.map((t) => ({ role: t.role === 'user' ? 'assistant' : 'user', content: t.content }))
      : [{ role: 'user', content: '(the conversation has started; send the first customer message)' }];
    if (userView[userView.length - 1].role === 'assistant') break;

    const customer = await tracedText({
      kind: 'test_user',
      conversationId: conversation.id,
      promptVersionId: version.id,
      model: ROLE_MODELS.simulatedUser,
      effort: 'low',
      instructions: userInstructions,
      messages: userView,
      maxOutputTokens: 4000,
    });
    const customerText = customer.text.trim();
    if (!customerText || customerText.includes(END_TOKEN)) break;

    transcript.push({ role: 'user', content: customerText });
    await db.from('messages').insert({ conversation_id: conversation.id, role: 'user', content: customerText });

    const agentReply = await tracedText({
      kind: 'test_agent',
      conversationId: conversation.id,
      promptVersionId: version.id,
      model: agentModel,
      effort: 'low',
      instructions: version.system_prompt,
      messages: transcript.map((t) => ({ role: t.role, content: t.content })),
      maxOutputTokens: 8000,
    });
    transcript.push({ role: 'assistant', content: agentReply.text });
    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: agentReply.text,
      execution_id: agentReply.executionId,
    });
  }

  const verdict = await tracedObject({
    kind: 'judge',
    conversationId: conversation.id,
    promptVersionId: version.id,
    model: ROLE_MODELS.judge,
    effort: 'medium',
    schema: judgeSchema,
    instructions: 'You are a rigorous customer service quality evaluator. Evaluate only the AGENT, based on the criteria provided.',
    prompt: `<scenario>${tc.scenario}</scenario>
<criteria>${tc.expected_behavior}</criteria>
<conversation>
${transcript.map((t) => `[${t.role === 'user' ? 'CUSTOMER' : 'AGENT'}] ${t.content}`).join('\n')}
</conversation>`,
  });

  await db
    .from('test_runs')
    .update({
      status: 'completed',
      transcript,
      score: verdict.score,
      passed: verdict.passed,
      judge_reasoning: verdict.reasoning,
      finished_at: new Date().toISOString(),
    })
    .eq('id', testRunId);
}

async function finishJobIfDone(jobId: string | null) {
  if (!jobId) return;
  const { count } = await db
    .from('test_runs')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .in('status', ['queued', 'running']);
  if (count === 0) {
    await db
      .from('optimization_jobs')
      .update({ status: 'completed', finished_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('status', 'testing');
  }
}

/** Runs several test runs in parallel in the same invocation and closes the job when they all finish. */
export async function runTests(testRunIds: string[], jobId: string | null) {
  await Promise.allSettled(
    testRunIds.map((id) =>
      runTest(id).catch(async (e) => {
        console.error(e);
        await db
          .from('test_runs')
          .update({ status: 'failed', error: String(e), finished_at: new Date().toISOString() })
          .eq('id', id);
      }),
    ),
  );
  await finishJobIfDone(jobId);
}
