# Agent Studio

Built for the **Supabase Select 26 hackathon**.

Create AI customer-service agents, chat with them, review conversations, and let Claude improve their prompts from your feedback. Every new prompt version gets a simulated test run and a diff before you promote it.

**Stack:** Next.js · Supabase (Postgres + Realtime) · Vercel AI SDK · Claude

## Requirements

- Node.js 22+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project
- An Anthropic API key

## Run locally

**1. Install dependencies**

```bash
npm install
```

**2. Set up the database**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push --include-seed
```

**3. Set environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (anon / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys (service_role / secret) |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys |
| `ANTHROPIC_WORKSPACE_ID` | Optional. Only needed if your key is not scoped to a workspace (`wrkspc_...`) |

**4. Start the app**

```bash
npm run dev
```

Open http://localhost:3000.

## How to use

1. **Agents**: create an agent or use one of the two seeded ones.
2. **Simulation**: chat with the agent as a customer.
3. **Observability**: open a conversation and rate the agent's replies 👍 / 👎.
4. **Improvement queue**: select feedback and click *Process with AI*.
5. **Versions**: review the diff, the reasons and the test scores, then promote or reject.

## Deploy

Import the repository into Vercel and add the same environment variables.

> No login in this MVP. The database is open to the anon key, so don't expose it publicly as is.
