-- Team roster for CS2 tournament drafts. No public registration yet.
create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  captain_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tournament_id, name)
);
create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id, created_at);
alter table public.tournament_teams enable row level security;

drop policy if exists "Published teams are visible" on public.tournament_teams;
create policy "Published teams are visible" on public.tournament_teams
  for select to anon, authenticated using (
    exists (select 1 from public.tournaments t where t.id = tournament_id
      and (t.published_at is not null or t.owner_user_id = (select auth.uid())))
  );

drop policy if exists "Tournament owners add teams" on public.tournament_teams;
create policy "Tournament owners add teams" on public.tournament_teams
  for insert to authenticated with check (
    exists (select 1 from public.tournaments t where t.id = tournament_id
      and t.owner_user_id = (select auth.uid()) and t.status in ('draft', 'registration'))
  );

drop policy if exists "Tournament owners remove draft teams" on public.tournament_teams;
create policy "Tournament owners remove draft teams" on public.tournament_teams
  for delete to authenticated using (
    exists (select 1 from public.tournaments t where t.id = tournament_id
      and t.owner_user_id = (select auth.uid()) and t.status in ('draft', 'registration'))
  );

-- An advisory transaction lock ensures simultaneous insert requests cannot
-- exceed the maximum number of teams configured for a tournament.
create or replace function public.enforce_tournament_team_limit()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare limit_value integer;
declare team_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.tournament_id::text, 0));
  select max_teams into limit_value
    from public.tournaments where id = new.tournament_id;
  if limit_value is null then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  select count(*) into team_count from public.tournament_teams
    where tournament_id = new.tournament_id;
  if team_count >= limit_value then raise exception 'TOURNAMENT_FULL'; end if;
  return new;
end;
$$;
drop trigger if exists tournament_team_limit_guard on public.tournament_teams;
create trigger tournament_team_limit_guard before insert on public.tournament_teams
for each row execute function public.enforce_tournament_team_limit();
