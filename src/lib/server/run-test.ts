import 'server-only'
import { z } from 'zod';
import type { ModelMessage } from 'ai';
import { OPTIMIZER_MODEL, tracedObject, tracedText } from './ai';
import { db, must } from './db';
// Executa um caso de teste: um cliente simulado (LLM) conversa com o agente usando
// a versão de prompt do run; depois um juiz (LLM) avalia a conversa contra os critérios.

const END_TOKEN = '[FIM]';

const judgeSchema = z.object({
  score: z.number().min(0).max(10).describe('Nota de 0 a 10.'),
  passed: z.boolean().describe('true se todos os critérios essenciais foram cumpridos.'),
  reasoning: z.string().describe('Justificativa curta citando trechos da conversa.'),
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
        customer_label: `Teste: ${tc.name} (${run.variant})`,
        source: 'test',
      })
      .select('id')
      .single(),
    'conversa de teste',
  );
  await db.from('test_runs').update({ conversation_id: conversation.id }).eq('id', testRunId);

  const transcript: Turn[] = [];
  const userInstructions = `Você está interpretando um CLIENTE em uma simulação de atendimento. Nunca diga que é uma IA.
Persona: ${tc.persona}
Cenário: ${tc.scenario}
Escreva apenas a próxima mensagem do cliente, curta e natural como numa conversa de WhatsApp.
Quando seu objetivo estiver resolvido ou a conversa não tiver mais para onde ir, responda apenas ${END_TOKEN}.`;

  for (let turn = 0; turn < tc.max_turns; turn++) {
    // Do ponto de vista do cliente simulado, os papéis são invertidos.
    const userView: ModelMessage[] = transcript.length
      ? transcript.map((t) => ({ role: t.role === 'user' ? 'assistant' : 'user', content: t.content }))
      : [{ role: 'user', content: '(o atendimento começou; envie a primeira mensagem do cliente)' }];
    if (userView[userView.length - 1].role === 'assistant') break;

    const customer = await tracedText({
      kind: 'test_user',
      conversationId: conversation.id,
      promptVersionId: version.id,
      model: OPTIMIZER_MODEL,
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
    model: OPTIMIZER_MODEL,
    effort: 'medium',
    schema: judgeSchema,
    instructions: 'Você é um avaliador rigoroso de qualidade de atendimento. Avalie apenas o AGENTE, com base nos critérios fornecidos.',
    prompt: `<cenario>${tc.scenario}</cenario>
<criterios>${tc.expected_behavior}</criterios>
<conversa>
${transcript.map((t) => `[${t.role === 'user' ? 'CLIENTE' : 'AGENTE'}] ${t.content}`).join('\n')}
</conversa>`,
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

/** Executa vários test runs em paralelo na mesma invocação e fecha o job quando todos terminam. */
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
