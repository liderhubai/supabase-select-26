import 'server-only'
import { z } from 'zod';
import { OPTIMIZER_MODEL, tracedObject } from './ai';
import { db, must } from './db';
import { runTests } from './run-test';
// Self-improvement (GEPA-style reflection): consolidates annotated feedback on real conversations,
// asks the optimizer for a new prompt with a justification per change, generates the test suite
// and triggers the test runs (baseline = production vs. candidate = staging).

const MAX_TEST_CASES = 6;

const reflectionSchema = z.object({
  diagnosis: z.string().describe('Overall diagnosis: what the agent does well and where it fails, based on the feedback.'),
  patterns: z
    .array(
      z.object({
        kind: z.enum(['failure', 'success']),
        description: z.string(),
        feedback_ids: z.array(z.string()),
      }),
    )
    .describe('Recurring patterns found in the feedback.'),
  new_system_prompt: z.string().describe('The complete, improved system prompt.'),
  change_summary: z.string().describe('Short summary (1-2 sentences) of the new version.'),
  changes: z
    .array(
      z.object({
        title: z.string().describe('Short name of the change.'),
        before: z.string().describe('Affected excerpt of the old prompt (empty if it is an addition).'),
        after: z.string().describe('New excerpt (empty if it is a removal).'),
        reason: z.string().describe('Why the change was made, citing the observed behavior.'),
        feedback_ids: z.array(z.string()).describe('IDs of the feedback items that justify the change.'),
      }),
    )
    .describe('List of changes, each justified by feedback.'),
});

const testCasesSchema = z.object({
  test_cases: z.array(
    z.object({
      name: z.string(),
      persona: z.string().describe('Who the simulated customer is, tone and context.'),
      scenario: z.string().describe('What the customer wants and how the conversation should unfold.'),
      expected_behavior: z.string().describe('Objective criteria the agent must meet to pass.'),
      origin: z.enum(['feedback', 'generated']),
      max_turns: z.number().int().min(2).max(6),
    }),
  ),
});

type FeedbackRow = {
  id: string;
  rating: 'positive' | 'negative';
  comment: string;
  reviewer_name: string;
  message_id: string;
  conversation_id: string;
  prompt_version_id: string;
  prompt_versions: { version: number };
};

async function annotatedTraces(feedbacks: FeedbackRow[]) {
  const convIds = [...new Set(feedbacks.map((f) => f.conversation_id))];
  const msgs = must(
    await db
      .from('messages')
      .select('id, conversation_id, role, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at'),
    'messages',
  );

  return feedbacks
    .map((f) => {
      const conv = msgs.filter((m) => m.conversation_id === f.conversation_id);
      const idx = conv.findIndex((m) => m.id === f.message_id);
      // Context: up to 6 messages before the evaluated message.
      const window = conv.slice(Math.max(0, idx - 6), idx + 1);
      const transcript = window
        .map((m) => `${m.id === f.message_id ? '>>> ' : ''}[${m.role === 'user' ? 'CUSTOMER' : 'AGENT'}] ${m.content}`)
        .join('\n');
      return `<feedback id="${f.id}" rating="${f.rating}" prompt_version="v${f.prompt_versions.version}" reviewer="${f.reviewer_name}">
<conversation>
${transcript}
</conversation>
<evaluated_message>the line marked with >>></evaluated_message>
<reviewer_comment>${f.comment || '(no comment)'}</reviewer_comment>
</feedback>`;
    })
    .join('\n\n');
}

export async function runOptimization(jobId: string) {
  const job = must(await db.from('optimization_jobs').select('*').eq('id', jobId).single(), 'job');
  const agent = must(await db.from('agents').select('*').eq('id', job.agent_id).single(), 'agent');
  const base = must(await db.from('prompt_versions').select('*').eq('id', job.base_version_id).single(), 'base version');
  const feedbacks = must(
    await db
      .from('feedbacks')
      .select('id, rating, comment, reviewer_name, message_id, conversation_id, prompt_version_id, prompt_versions(version)')
      .in('id', job.feedback_ids),
    'feedbacks',
  ) as unknown as FeedbackRow[];

  await db.from('optimization_jobs').update({ status: 'optimizing' }).eq('id', jobId);
  const traces = await annotatedTraces(feedbacks);

  // 1) Reflection: diagnoses and proposes a new prompt with justifications.
  const reflection = await tracedObject({
    kind: 'optimize',
    promptVersionId: base.id,
    model: OPTIMIZER_MODEL,
    effort: 'high',
    schema: reflectionSchema,
    instructions: `You are a prompt engineer specialized in customer service agents.
You receive an agent's current system prompt and human feedback (positive and negative) on real messages it sent.
Your work is reflective, GEPA-style: read each conversation, understand why the message was rated well or poorly, find patterns, and rewrite the prompt to fix the failures without losing what works.

Rules:
- Preserve business facts (prices, hours, policies) unless a feedback item explicitly says they are wrong.
- Prefer general instructions that fix the class of error, not patches for a single conversation.
- Positive feedback indicates behaviors that should be kept or reinforced.
- Each change must cite the IDs of the feedback items that motivated it.
- Write the new prompt in the same language as the original.`,
    prompt: `<agent name="${agent.name}" type="${agent.kind}">${agent.description}</agent>

<current_prompt version="v${base.version}">
${base.system_prompt}
</current_prompt>

<feedbacks>
${traces}
</feedbacks>

Produce the diagnosis, the patterns, the complete new prompt and the list of justified changes.`,
  });

  // 2) New version in staging.
  const { data: last } = await db
    .from('prompt_versions')
    .select('version')
    .eq('agent_id', agent.id)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  const candidate = must(
    await db
      .from('prompt_versions')
      .insert({
        agent_id: agent.id,
        version: (last?.version ?? 0) + 1,
        system_prompt: reflection.new_system_prompt,
        status: 'staging',
        parent_version_id: base.id,
        change_summary: reflection.change_summary,
        changes: reflection.changes,
        optimization_job_id: jobId,
      })
      .select('*')
      .single(),
    'candidate version',
  );

  await db
    .from('optimization_jobs')
    .update({
      status: 'testing',
      candidate_version_id: candidate.id,
      analysis: { diagnosis: reflection.diagnosis, patterns: reflection.patterns },
    })
    .eq('id', jobId);

  // 3) Test suite: cases derived from the feedback + generic cases for this type of agent.
  const existing = must(
    await db.from('test_cases').select('id, name, origin').eq('agent_id', agent.id).order('created_at'),
    'test cases',
  );
  const generated = await tracedObject({
    kind: 'optimize',
    promptVersionId: candidate.id,
    model: OPTIMIZER_MODEL,
    effort: 'medium',
    schema: testCasesSchema,
    instructions: `You create test cases to simulate customer conversations and evaluate an agent.
Each case describes a simulated customer (persona), the conversation scenario and objective success criteria.`,
    prompt: `<agent name="${agent.name}" type="${agent.kind}">${agent.description}</agent>
<agent_prompt>
${reflection.new_system_prompt}
</agent_prompt>
<feedbacks>
${traces}
</feedbacks>
<existing_cases>${existing.map((t) => t.name).join('; ') || '(none)'}</existing_cases>

Create a test case (origin="feedback") for each problematic situation in the negative feedback that is not yet covered by the existing cases.
${existing.length < 3 ? `Also create ${3 - existing.length} generic cases (origin="generated") covering the agent's main flow.` : ''}
At most ${MAX_TEST_CASES} new cases. Do not repeat existing cases.`,
  });

  if (generated.test_cases.length) {
    must(
      await db
        .from('test_cases')
        .insert(generated.test_cases.slice(0, MAX_TEST_CASES).map((t) => ({ ...t, agent_id: agent.id })))
        .select('id'),
      'insert test cases',
    );
  }

  // Most recent cases first (the ones coming from this feedback), limited to fit the budget.
  const cases = must(
    await db.from('test_cases').select('id').eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(MAX_TEST_CASES),
    'test cases',
  );

  // 4) Test runs: the same suite on current production (baseline) and on the candidate.
  const runs = must(
    await db
      .from('test_runs')
      .insert(
        cases.flatMap((c) => [
          { job_id: jobId, test_case_id: c.id, prompt_version_id: base.id, variant: 'baseline' },
          { job_id: jobId, test_case_id: c.id, prompt_version_id: candidate.id, variant: 'candidate' },
        ]),
      )
      .select('id'),
    'test runs',
  );

  await runTests(runs.map((r) => r.id), jobId);
}
