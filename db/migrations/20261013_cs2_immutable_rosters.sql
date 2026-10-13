-- Immutable participant snapshots for duel and duo tournaments.
-- Names are public gamer tags, not legal names.
alter table public.tournament_teams add column if not exists player_names text[] not null default '{}';

create or replace function public.iste_validate_team_roster()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  slots integer;
  player text;
  cleaned text[] := '{}';
begin
  select team_size into slots from public.tournaments where id = new.tournament_id;
  if slots is null then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if slots in (1, 2) then
    if array_ndims(new.player_names) is distinct from 1
       or cardinality(new.player_names) <> slots then
      raise exception 'ROSTER_SIZE_INVALID';
    end if;
    foreach player in array new.player_names loop
      player := btrim(player);
      if char_length(player) < 2 or char_length(player) > 32 then
        raise exception 'ROSTER_PLAYER_INVALID';
      end if;
      if lower(player) = any(select lower(unnest(cleaned))) then
        raise exception 'ROSTER_DUPLICATE';
      end if;
      cleaned := array_append(cleaned,player);
    end loop;
    new.player_names := cleaned;
    -- The tournament advisory lock also serializes concurrent duplicate checks.
    perform pg_advisory_xact_lock(hashtextextended(new.tournament_id::text, 0));
    if exists (
      select 1 from public.tournament_teams other,
      lateral unnest(other.player_names) as registered(name)
      where other.tournament_id = new.tournament_id
        and exists (select 1 from unnest(cleaned) as incoming(name)
                    where lower(incoming.name) = lower(registered.name))
    ) then
      raise exception 'ROSTER_PLAYER_ALREADY_REGISTERED';
    end if;
  elsif cardinality(new.player_names) <> 0 then
    raise exception 'ROSTER_UNSUPPORTED_FOR_5V5';
  end if;
  return new;
end;
$$;

drop trigger if exists tournament_roster_validation on public.tournament_teams;
create trigger tournament_roster_validation before insert on public.tournament_teams
for each row execute function public.iste_validate_team_roster();

-- Existing policy already revokes UPDATE, preventing post-registration substitutions.
comment on column public.tournament_teams.player_names is 'Immutable public game tags for 1vs1/2vs2. No substitutes; 5vs5 not yet supported by this roster system.';
