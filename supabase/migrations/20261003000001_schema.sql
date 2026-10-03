-- Simulador de atendimento + observabilidade + auto-melhoria de prompts
create extension if not exists pgcrypto;

-- Agentes ---------------------------------------------------------------
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'recepcao',
  description text not null default '',
  model text not null default 'claude-opus-5-5',
  production_version_id uuid,
  created_at timestamptz not null default now()
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  version int not null,
  system_prompt text not null,
  status text not null default 'draft'
    check (status in ('draft', 'staging', 'production', 'archived', 'rejected')),
  parent_version_id uuid references public.prompt_versions(id),
  change_summary text,
  -- [{ "title", "before", "after", "reason", "feedback_ids": [] }]
  changes jsonb not null default '[]'::jsonb,
  optimization_job_id uuid,
  created_at timestamptz not null default now(),
  promoted_at timestamptz,
  unique (agent_id, version)
);

alter table public.agents
  add constraint agents_production_version_fk
  foreign key (production_version_id) references public.prompt_versions(id) on delete set null;

-- Conversas / mensagens / traces ----------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prompt_version_id uuid not null references public.prompt_versions(id),
  customer_label text not null default 'Cliente simulado',
  source text not null default 'simulation' check (source in ('simulation', 'test')),
  created_at timestamptz not null default now()
);

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  prompt_version_id uuid references public.prompt_versions(id),
  kind text not null default 'chat' check (kind in ('chat', 'optimize', 'test_user', 'test_agent', 'judge')),
  model text not null,
  input jsonb not null,           -- { instructions, messages }
  output text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  finish_reason text,
  error text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  execution_id uuid references public.executions(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Feedback e fila de auto-melhoria --------------------------------------
create table public.optimization_jobs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  base_version_id uuid not null references public.prompt_versions(id),
  candidate_version_id uuid references public.prompt_versions(id) on delete set null,
  feedback_ids uuid[] not null default '{}',
  status text not null default 'queued'
    check (status in ('queued', 'optimizing', 'testing', 'completed', 'failed')),
  analysis jsonb,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.prompt_versions
  add constraint prompt_versions_job_fk
  foreign key (optimization_job_id) references public.optimization_jobs(id) on delete set null;

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  execution_id uuid references public.executions(id) on delete set null,
  prompt_version_id uuid not null references public.prompt_versions(id),
  agent_id uuid not null references public.agents(id) on delete cascade,
  rating text not null check (rating in ('positive', 'negative')),
  comment text not null default '',
  reviewer_name text not null default 'Revisor',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'dismissed')),
  optimization_job_id uuid references public.optimization_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Bateria de testes -----------------------------------------------------
create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  name text not null,
  persona text not null,
  scenario text not null,
  expected_behavior text not null,
  origin text not null default 'generated' check (origin in ('generated', 'feedback', 'manual')),
  max_turns int not null default 4,
  created_at timestamptz not null default now()
);

create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.optimization_jobs(id) on delete cascade,
  prompt_version_id uuid not null references public.prompt_versions(id) on delete cascade,
  test_case_id uuid not null references public.test_cases(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  variant text not null check (variant in ('baseline', 'candidate')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  transcript jsonb not null default '[]'::jsonb,
  score numeric,
  passed boolean,
  judge_reasoning text,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Índices ---------------------------------------------------------------
create index on public.prompt_versions (agent_id, version desc);
create index on public.conversations (agent_id, created_at desc);
create index on public.messages (conversation_id, created_at);
create index on public.executions (conversation_id, created_at);
create index on public.feedbacks (status, agent_id);
create index on public.test_runs (job_id);
create index on public.test_runs (prompt_version_id);

-- RLS: MVP sem login -> acesso liberado para anon/authenticated.
-- TODO(auth): trocar por políticas baseadas em auth.uid() quando houver login.
do $$
declare t text;
begin
  foreach t in array array['agents','prompt_versions','conversations','executions','messages',
                           'optimization_jobs','feedbacks','test_cases','test_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "mvp_open_access" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime para progresso da fila e da bateria de testes
alter publication supabase_realtime add table public.optimization_jobs, public.test_runs, public.feedbacks;
