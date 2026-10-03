-- Confidence score (0-100) assigned by a scorer agent to each assistant reply.
alter table public.messages
  add column confidence int check (confidence between 0 and 100),
  add column confidence_reason text;

alter table public.executions drop constraint executions_kind_check;
alter table public.executions
  add constraint executions_kind_check
  check (kind in ('chat', 'optimize', 'test_user', 'test_agent', 'judge', 'confidence'));
