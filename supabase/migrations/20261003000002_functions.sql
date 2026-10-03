-- Promove uma versão para produção (arquiva a anterior) de forma atômica.
create or replace function public.promote_version(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent uuid;
begin
  select agent_id into v_agent from prompt_versions where id = p_version_id for update;
  if v_agent is null then
    raise exception 'Versão % não encontrada', p_version_id;
  end if;

  update prompt_versions set status = 'archived'
   where agent_id = v_agent and status = 'production' and id <> p_version_id;

  update prompt_versions set status = 'production', promoted_at = now()
   where id = p_version_id;

  update agents set production_version_id = p_version_id where id = v_agent;

  update feedbacks set status = 'processed'
   where optimization_job_id = (select optimization_job_id from prompt_versions where id = p_version_id)
     and status = 'processing';
end $$;

-- Rejeita uma versão em staging e devolve os feedbacks para a fila.
create or replace function public.reject_version(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update prompt_versions set status = 'rejected' where id = p_version_id and status in ('staging', 'draft');

  update feedbacks set status = 'pending', optimization_job_id = null
   where optimization_job_id = (select optimization_job_id from prompt_versions where id = p_version_id)
     and status = 'processing';
end $$;

-- Cria uma nova versão (draft) a partir de uma edição manual do prompt.
create or replace function public.create_prompt_version(p_agent_id uuid, p_system_prompt text, p_summary text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
  v_parent uuid;
  v_id uuid;
begin
  select coalesce(max(version), 0) + 1 into v_next from prompt_versions where agent_id = p_agent_id;
  select production_version_id into v_parent from agents where id = p_agent_id;

  insert into prompt_versions (agent_id, version, system_prompt, status, parent_version_id, change_summary)
  values (p_agent_id, v_next, p_system_prompt, 'draft', v_parent, coalesce(p_summary, 'Edição manual'))
  returning id into v_id;
  return v_id;
end $$;

-- Cria agente + v1 em produção.
create or replace function public.create_agent(p_name text, p_kind text, p_description text, p_model text, p_system_prompt text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent uuid;
  v_version uuid;
begin
  insert into agents (name, kind, description, model)
  values (p_name, p_kind, p_description, p_model)
  returning id into v_agent;

  insert into prompt_versions (agent_id, version, system_prompt, status, change_summary, promoted_at)
  values (v_agent, 1, p_system_prompt, 'production', 'Versão inicial', now())
  returning id into v_version;

  update agents set production_version_id = v_version where id = v_agent;
  return v_agent;
end $$;

grant execute on function public.promote_version(uuid), public.reject_version(uuid),
  public.create_prompt_version(uuid, text, text), public.create_agent(text, text, text, text, text)
  to anon, authenticated;
