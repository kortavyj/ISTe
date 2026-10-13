-- SteamID64 roster identity for 1vs1 and 2vs2.
-- Self-reported IDs are not ownership verification; Steam OpenID must be added before a public prize tournament.
alter table public.tournament_teams add column if not exists player_steam_ids text[] not null default '{}';

create or replace function public.iste_validate_steam_roster()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  slots integer;
  steam_id text;
begin
  select team_size into slots from public.tournaments where id=new.tournament_id;
  if slots is null then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if slots in (1,2) then
    if coalesce(array_ndims(new.player_steam_ids),0) <> 1
       or cardinality(new.player_steam_ids) <> slots then
      raise exception 'STEAM_ROSTER_SIZE_INVALID';
    end if;
    foreach steam_id in array new.player_steam_ids loop
      if steam_id !~ '^7656119[0-9]{10}$' then
        raise exception 'STEAM_ID_INVALID';
      end if;
    end loop;
    if (select count(distinct x) from unnest(new.player_steam_ids) x) <> slots then
      raise exception 'STEAM_ID_DUPLICATE';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(new.tournament_id::text,0));
    if exists (
      select 1 from public.tournament_teams old_team
      where old_team.tournament_id=new.tournament_id
        and old_team.player_steam_ids && new.player_steam_ids
    ) then
      raise exception 'STEAM_ID_ALREADY_REGISTERED';
    end if;
  elsif cardinality(new.player_steam_ids)>0 then
    raise exception 'STEAM_ROSTER_UNSUPPORTED';
  end if;
  return new;
end $$;

drop trigger if exists tournament_steam_roster_guard on public.tournament_teams;
create trigger tournament_steam_roster_guard before insert on public.tournament_teams
for each row execute function public.iste_validate_steam_roster();

create or replace function public.iste_protect_locked_roster()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  t public.tournaments%rowtype;
begin
  select * into t from public.tournaments where id=old.tournament_id for update;
  if t.team_size in (1,2) and t.status <> 'draft' then
    raise exception 'ROSTER_LOCKED_NO_REENTRY';
  end if;
  return old;
end $$;

drop trigger if exists tournament_locked_roster_guard on public.tournament_teams;
create trigger tournament_locked_roster_guard before delete on public.tournament_teams
for each row execute function public.iste_protect_locked_roster();

comment on column public.tournament_teams.player_steam_ids is
  'User supplied SteamID64 values. Format and uniqueness checked; ownership not yet verified.';
