-- Repair missing core bracket infrastructure in isolated ISTe beta.
-- Atomic start and result confirmation for Single Elimination.
-- Execute after tournaments, tournament_teams and tournament_matches migrations.
-- SECURITY DEFINER routines have explicit identity, blocked-account and ownership checks.
-- Private audit: write-only by the privileged tournament functions.
create table if not exists public.tournament_audit (
 id bigint generated always as identity primary key,
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 actor_user_id uuid not null references auth.users(id),
 action text not null check(action in ('publish','start','confirm_result')),
 match_id uuid references public.tournament_matches(id),
 created_at timestamptz not null default now()
);
alter table public.tournament_audit enable row level security;
revoke all on public.tournament_audit from anon,authenticated;

-- Transactional distributed rate limit (shared PostgreSQL; not process memory).
create table if not exists public.tournament_rate_limits (
 actor_id uuid not null,
 tournament_id uuid not null,
 action text not null,
 window_start timestamptz not null,
 attempts integer not null default 1,
 primary key(actor_id,tournament_id,action,window_start)
);
alter table public.tournament_rate_limits enable row level security;
revoke all on public.tournament_rate_limits from anon,authenticated;
create or replace function public.iste_enforce_tournament_limit(p_tournament_id uuid,p_action text,p_max integer)
returns void language plpgsql security definer set search_path = '' as $$
declare current_attempts integer;
begin
 if auth.uid() is null or p_action not in ('publish','start','result') or p_max not between 1 and 120 then
  raise exception 'RATE_LIMIT_UNAUTHORIZED';
 end if;
 insert into public.tournament_rate_limits(actor_id,tournament_id,action,window_start,attempts)
 values(auth.uid(),p_tournament_id,p_action,date_trunc('minute',now()),1)
 on conflict (actor_id,tournament_id,action,window_start)
 do update set attempts=public.tournament_rate_limits.attempts+1
 returning attempts into current_attempts;
 if current_attempts>p_max then raise exception 'RATE_LIMIT_EXCEEDED'; end if;
end $$;
revoke all on function public.iste_enforce_tournament_limit(uuid,text,integer) from public,anon,authenticated;

