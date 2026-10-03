import 'server-only'
import { z } from 'zod';
import { OPTIMIZER_MODEL, tracedObject } from './ai';
import { db, must } from './db';
import { runTests } from './run-test';
// Auto-melhoria (reflexão estilo GEPA): consolida feedbacks anotados sobre conversas reais,
// pede ao otimizador um novo prompt com justificativa por mudança, gera a bateria de testes
// e dispara os test runs (baseline = produção x candidate = staging).

const MAX_TEST_CASES = 6;

const reflectionSchema = z.object({
  diagnosis: z.string().describe('Diagnóstico geral: o que o agente faz bem e onde falha, com base nos feedbacks.'),
  patterns: z
    .array(
      z.object({
        kind: z.enum(['failure', 'success']),
        description: z.string(),
        feedback_ids: z.array(z.string()),
      }),
    )
    .describe('Padrões recorrentes encontrados nos feedbacks.'),
  new_system_prompt: z.string().describe('O prompt de sistema completo e melhorado.'),
  change_summary: z.string().describe('Resumo curto (1-2 frases) da nova versão.'),
  changes: z
    .array(
      z.object({
        title: z.string().describe('Nome curto da mudança.'),
        before: z.string().describe('Trecho do prompt antigo afetado (vazio se for adição).'),
        after: z.string().describe('Trecho novo (vazio se for remoção).'),
        reason: z.string().describe('Por que a mudança foi feita, citando o comportamento observado.'),
        feedback_ids: z.array(z.string()).describe('IDs dos feedbacks que justificam a mudança.'),
      }),
    )
    .describe('Lista de mudanças, cada uma justificada por feedbacks.'),
});

const testCasesSchema = z.object({
  test_cases: z.array(
    z.object({
      name: z.string(),
      persona: z.string().describe('Quem é o cliente simulado, tom e contexto.'),
      scenario: z.string().describe('O que o cliente quer e como a conversa deve se desenrolar.'),
      expected_behavior: z.string().describe('Critérios objetivos que o agente deve cumprir para passar.'),
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
    'mensagens',
  );

  return feedbacks
    .map((f) => {
      const conv = msgs.filter((m) => m.conversation_id === f.conversation_id);
      const idx = conv.findIndex((m) => m.id === f.message_id);
      // Contexto: até 6 mensagens antes da mensagem avaliada.
      const window = conv.slice(Math.max(0, idx - 6), idx + 1);
      const transcript = window
        .map((m) => `${m.id === f.message_id ? '>>> ' : ''}[${m.role === 'user' ? 'CLIENTE' : 'AGENTE'}] ${m.content}`)
        .join('\n');
      return `<feedback id="${f.id}" rating="${f.rating}" prompt_version="v${f.prompt_versions.version}" reviewer="${f.reviewer_name}">
<conversa>
${transcript}
</conversa>
<mensagem_avaliada>a linha marcada com >>></mensagem_avaliada>
<comentario_do_revisor>${f.comment || '(sem comentário)'}</comentario_do_revisor>
</feedback>`;
    })
    .join('\n\n');
}

export async function runOptimization(jobId: string) {
  const job = must(await db.from('optimization_jobs').select('*').eq('id', jobId).single(), 'job');
  const agent = must(await db.from('agents').select('*').eq('id', job.agent_id).single(), 'agente');
  const base = must(await db.from('prompt_versions').select('*').eq('id', job.base_version_id).single(), 'versão base');
  const feedbacks = must(
    await db
      .from('feedbacks')
      .select('id, rating, comment, reviewer_name, message_id, conversation_id, prompt_version_id, prompt_versions(version)')
      .in('id', job.feedback_ids),
    'feedbacks',
  ) as unknown as FeedbackRow[];

  await db.from('optimization_jobs').update({ status: 'optimizing' }).eq('id', jobId);
  const traces = await annotatedTraces(feedbacks);

  // 1) Reflexão: diagnostica e propõe novo prompt com justificativas.
  const reflection = await tracedObject({
    kind: 'optimize',
    promptVersionId: base.id,
    model: OPTIMIZER_MODEL,
    effort: 'high',
    schema: reflectionSchema,
    instructions: `Você é um engenheiro de prompts especialista em agentes de atendimento.
Você recebe o prompt de sistema atual de um agente e feedbacks humanos (positivos e negativos) sobre mensagens reais que ele enviou.
Seu trabalho é reflexivo, no estilo GEPA: leia cada conversa, entenda por que a mensagem foi bem ou mal avaliada, encontre padrões, e reescreva o prompt para corrigir as falhas sem perder o que funciona.

Regras:
- Preserve fatos do negócio (preços, horários, políticas) a menos que um feedback diga explicitamente que estão errados.
- Prefira instruções gerais que corrijam a classe de erro, não remendos para uma única conversa.
- Feedbacks positivos indicam comportamentos que devem ser mantidos ou reforçados.
- Cada mudança deve citar os IDs dos feedbacks que a motivaram.
- Escreva o prompt novo no mesmo idioma do original.`,
    prompt: `<agente nome="${agent.name}" tipo="${agent.kind}">${agent.description}</agente>

<prompt_atual versao="v${base.version}">
${base.system_prompt}
</prompt_atual>

<feedbacks>
${traces}
</feedbacks>

Produza o diagnóstico, os padrões, o novo prompt completo e a lista de mudanças justificadas.`,
  });

  // 2) Nova versão em staging.
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
    'versão candidata',
  );

  await db
    .from('optimization_jobs')
    .update({
      status: 'testing',
      candidate_version_id: candidate.id,
      analysis: { diagnosis: reflection.diagnosis, patterns: reflection.patterns },
    })
    .eq('id', jobId);

  // 3) Bateria de testes: casos derivados dos feedbacks + casos genéricos do tipo de agente.
  const existing = must(
    await db.from('test_cases').select('id, name, origin').eq('agent_id', agent.id).order('created_at'),
    'casos de teste',
  );
  const generated = await tracedObject({
    kind: 'optimize',
    promptVersionId: candidate.id,
    model: OPTIMIZER_MODEL,
    effort: 'medium',
    schema: testCasesSchema,
    instructions: `Você cria casos de teste para simular atendimentos e avaliar um agente.
Cada caso descreve um cliente simulado (persona), o cenário da conversa e critérios objetivos de sucesso.`,
    prompt: `<agente nome="${agent.name}" tipo="${agent.kind}">${agent.description}</agente>
<prompt_do_agente>
${reflection.new_system_prompt}
</prompt_do_agente>
<feedbacks>
${traces}
</feedbacks>
<casos_existentes>${existing.map((t) => t.name).join('; ') || '(nenhum)'}</casos_existentes>

Crie um caso de teste (origin="feedback") para cada situação problemática nos feedbacks negativos que ainda não esteja coberta pelos casos existentes.
${existing.length < 3 ? `Crie também ${3 - existing.length} casos genéricos (origin="generated") cobrindo o fluxo principal do agente.` : ''}
No máximo ${MAX_TEST_CASES} casos novos. Não repita casos existentes.`,
  });

  if (generated.test_cases.length) {
    must(
      await db
        .from('test_cases')
        .insert(generated.test_cases.slice(0, MAX_TEST_CASES).map((t) => ({ ...t, agent_id: agent.id })))
        .select('id'),
      'inserir casos de teste',
    );
  }

  // Casos mais recentes primeiro (os vindos destes feedbacks), limitado para caber no orçamento.
  const cases = must(
    await db.from('test_cases').select('id').eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(MAX_TEST_CASES),
    'casos de teste',
  );

  // 4) Test runs: mesma bateria na produção atual (baseline) e na candidata.
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
