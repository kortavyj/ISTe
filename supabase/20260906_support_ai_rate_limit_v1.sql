begin;

create table if not exists public.support_ai_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.support_ai_rate_limits enable row level security;

revoke all on table public.support_ai_rate_limits from public;
revoke all on table public.support_ai_rate_limits from anon;
revoke all on table public.support_ai_rate_limits from authenticated;

create or replace function public.support_consume_ai_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_cutoff timestamptz;
  v_count integer;
begin
  if p_key is null or length(p_key) < 32 then
    raise exception 'INVALID_RATE_LIMIT_KEY';
  end if;

  if p_limit < 1 or p_limit > 1000 then
    raise exception 'INVALID_RATE_LIMIT_LIMIT';
  end if;

  if p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'INVALID_RATE_LIMIT_WINDOW';
  end if;

  v_window_cutoff := v_now - make_interval(secs => p_window_seconds);

  insert into public.support_ai_rate_limits (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_key,
    v_now,
    1,
    v_now
  )
  on conflict (key_hash) do update
  set
    window_started_at = case
      when public.support_ai_rate_limits.window_started_at <= v_window_cutoff
        then v_now
      else public.support_ai_rate_limits.window_started_at
    end,
    request_count = case
      when public.support_ai_rate_limits.window_started_at <= v_window_cutoff
        then 1
      else public.support_ai_rate_limits.request_count + 1
    end,
    updated_at = v_now
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.support_consume_ai_rate_limit(text, integer, integer) from public;
revoke all on function public.support_consume_ai_rate_limit(text, integer, integer) from anon;
revoke all on function public.support_consume_ai_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.support_consume_ai_rate_limit(text, integer, integer) to service_role;

commit;
