# Agent Studio

Simulador de atendimento com agentes de IA (Claude via Vercel AI SDK), observabilidade completa
(conversas, mensagens e traces de cada chamada), feedback de revisores e uma fila de **auto-melhoria**
que reescreve o prompt com justificativas, roda uma bateria de testes simulados e só promove para
produção depois da sua revisão (diff + motivos + notas baseline × candidata).

```
src/app/            Next.js App Router (páginas + API routes)
  api/chat          streaming do atendimento + grava mensagens/traces
  api/optimize      reflexão estilo GEPA sobre os feedbacks → versão em staging + bateria
  api/test-runs     roda a bateria de testes de uma versão sob demanda
src/lib/server/     lógica de IA e acesso ao banco com service role (só servidor)
src/views/          telas (client components)
supabase/           migrations e seed (Supabase é usado só como Postgres + Realtime)
```

## Fluxo

1. **Agentes** — crie o agente; o prompt vira a v1 em produção.
2. **Simulação** — converse como cliente. Cada turno grava `messages` e um trace em `executions`
   (input completo, output, tokens, latência).
3. **Observabilidade** — abra uma conversa, marque respostas com 👍/👎 e contexto extra.
4. **Fila de melhoria** — selecione feedbacks e clique *Processar com IA*: o otimizador diagnostica
   padrões, reescreve o prompt (cada mudança cita os feedbacks que a motivaram), gera casos de teste
   a partir dos feedbacks e roda a bateria na produção atual e na candidata.
5. **Versões** — na versão em staging veja o diff, os motivos e as notas; *Promover* ou *Rejeitar*
   (rejeitar devolve os feedbacks para a fila).

## Setup

```bash
supabase link --project-ref <ref>
supabase db push --include-seed
cp .env.example .env.local   # URL, anon key, service role key e ANTHROPIC_API_KEY
npm install
npm run dev
```

Deploy: importe o repositório na Vercel e cadastre as mesmas 4 variáveis de ambiente.

## Notas

- MVP **sem login**: RLS está habilitado, mas com política aberta para `anon`. Antes de expor
  publicamente, adicione Supabase Auth e troque as políticas `mvp_open_access`.
- Modelos: o agente usa o modelo escolhido no cadastro (Opus 5.5 ou Sonnet 5.5); otimizador, juiz
  e cliente simulado usam `claude-opus-5-5`. Os requests usam `fallbacks: 'default'` para recusas
  de classificador.
- Otimização e bateria de testes rodam em background com `after()` do Next, com os test runs em
  paralelo. As rotas `api/optimize` e `api/test-runs` usam `maxDuration = 800` (Vercel Pro com Fluid
  Compute); no plano Hobby o limite é 300 s — reduza o valor nessas rotas.
