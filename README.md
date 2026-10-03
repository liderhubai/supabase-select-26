# Agent Studio

Customer service simulator for AI agents (Claude via the Vercel AI SDK), with full observability
(conversations, messages and traces of every call), reviewer feedback and a **self-improvement** queue
that rewrites the prompt with justifications, runs a suite of simulated tests and only promotes to
production after your review (diff + reasons + baseline vs. candidate scores).

```
src/app/            Next.js App Router (pages + API routes)
  api/chat          streams the conversation + records messages/traces
  api/optimize      GEPA-style reflection over the feedback → staging version + test suite
  api/test-runs     runs a version's test suite on demand
src/lib/server/     AI logic and database access with the service role (server only)
src/views/          screens (client components)
supabase/           migrations and seed (Supabase is used only as Postgres + Realtime)
```

## Flow

1. **Agents** — create the agent; the prompt becomes v1 in production.
2. **Simulation** — chat as a customer. Each turn records `messages` and a trace in `executions`
   (full input, output, tokens, latency).
3. **Observability** — open a conversation and mark replies with 👍/👎 and extra context.
4. **Improvement queue** — select feedback and click *Process with AI*: the optimizer diagnoses
   patterns, rewrites the prompt (each change cites the feedback that motivated it), generates test
   cases from the feedback and runs the suite on current production and on the candidate.
5. **Versions** — on the staging version see the diff, the reasons and the scores; *Promote* or *Reject*
   (rejecting returns the feedback to the queue).

## Setup

```bash
supabase link --project-ref <ref>
supabase db push --include-seed
cp .env.example .env.local   # URL, anon key, service role key and ANTHROPIC_API_KEY
npm install
npm run dev
```

Deploy: import the repository into Vercel and set the same 4 environment variables.

## Notes

- MVP **without login**: RLS is enabled, but with an open policy for `anon`. Before exposing it
  publicly, add Supabase Auth and replace the `mvp_open_access` policies.
- Models: the agent uses the model chosen at creation (Opus 5.5 or Sonnet 5.5); the optimizer, judge
  and simulated customer use `claude-sonnet-5-5`. Requests use `fallbacks: 'default'` for classifier
  refusals.
- Optimization and the test suite run in the background with Next's `after()`, with test runs in
  parallel. The `api/optimize` and `api/test-runs` routes use `maxDuration = 800` (Vercel Pro with Fluid
  Compute); on the Hobby plan the limit is 300 s — lower the value in those routes.
