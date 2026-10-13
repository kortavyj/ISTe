-- Isolated ISTe beta authentication protection. Server-only: never grant to anon/authenticated.
create table if not exists public.auth_rate_limits (
 bucket text primary key,
 attempts integer not null default 0,
 window_start timestamptz not null default now(),
 blocked_until timestamptz
);
create table if not exists public.auth_security_events (
 id bigint generated always as identity primary key,
 event_type text not null,
 user_id uuid references auth.users(id) on delete set null,
 identity_hash text,
 client_hash text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists auth_security_events_created_idx on public.auth_security_events (created_at desc);
alter table public.auth_rate_limits enable row level security;
alter table public.auth_security_events enable row level security;
revoke all on public.auth_rate_limits from public, anon, authenticated;
revoke all on public.auth_security_events from public, anon, authenticated;
revoke all on sequence public.auth_security_events_id_seq from public, anon, authenticated;

create or replace function public.auth_consume_rate_limit(
 p_bucket text, p_limit integer, p_window_seconds integer, p_block_seconds integer
) returns jsonb language plpgsql security definer set search_path = '' as $auth$
declare current_record public.auth_rate_limits%rowtype;
declare now_at timestamptz := clock_timestamp();
declare wait_seconds integer := 0;
begin
 if p_bucket is null or length(p_bucket) not between 1 and 256
 or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400
 or p_block_seconds not between 1 and 86400 then
  raise exception 'INVALID_RATE_LIMIT_ARGUMENTS';
 end if;
 insert into public.auth_rate_limits(bucket) values (p_bucket) on conflict do nothing;
 select * into current_record from public.auth_rate_limits where bucket=p_bucket for update;
 if current_record.blocked_until > now_at then
  wait_seconds := greatest(1,ceil(extract(epoch from (current_record.blocked_until-now_at)))::integer);
  return jsonb_build_object('allowed',false,'retry_after_seconds',wait_seconds);
 end if;
 if current_record.window_start + make_interval(secs => p_window_seconds) <= now_at then
  current_record.attempts := 0;
  current_record.window_start := now_at;
 end if;
 current_record.attempts := current_record.attempts + 1;
 if current_record.attempts > p_limit then
  current_record.blocked_until := now_at + make_interval(secs => p_block_seconds);
  wait_seconds := p_block_seconds;
 else
  current_record.blocked_until := null;
 end if;
 update public.auth_rate_limits
 set attempts=current_record.attempts,window_start=current_record.window_start,blocked_until=current_record.blocked_until
 where bucket=p_bucket;
 return jsonb_build_object('allowed',wait_seconds=0,'retry_after_seconds',wait_seconds);
end $auth$;
create or replace function public.auth_reset_rate_limit(p_bucket text)
returns boolean language plpgsql security definer set search_path = '' as $auth$
begin
 if p_bucket is null or length(p_bucket) not between 1 and 256 then return false; end if;
 delete from public.auth_rate_limits where bucket=p_bucket;
 return true;
end $auth$;
create or replace function public.auth_record_security_event(
 p_event_type text,p_user_id uuid,p_identity_hash text,p_client_hash text,p_metadata jsonb
) returns boolean language plpgsql security definer set search_path = '' as $auth$
begin
 if p_event_type is null or length(trim(p_event_type)) not between 1 and 64 then return false; end if;
 insert into public.auth_security_events(event_type,user_id,identity_hash,client_hash,metadata)
 values(p_event_type,p_user_id,left(p_identity_hash,128),left(p_client_hash,128),coalesce(p_metadata,'{}'::jsonb));
 return true;
end $auth$;
revoke all on function public.auth_consume_rate_limit(text,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.auth_reset_rate_limit(text) from public,anon,authenticated;
revoke all on function public.auth_record_security_event(text,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.auth_consume_rate_limit(text,integer,integer,integer) to service_role;
grant execute on function public.auth_reset_rate_limit(text) to service_role;
grant execute on function public.auth_record_security_event(text,uuid,text,text,jsonb) to service_role;
