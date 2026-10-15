-- Candidate for isolated staging, not approved for production.
-- Preserve existing owner MFA, concurrent version checks and audit behavior.
CREATE OR REPLACE FUNCTION public.iste_owner_confirm_match(p_match_id uuid, p_expected_version integer, p_result jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := auth.uid();
  v_access record;
  v_match public.iste_tournament_matches%rowtype;
  v_tournament public.iste_tournaments%rowtype;
  v_entry jsonb;
  v_maps jsonb;
  v_map text;
  v_score_a integer;
  v_score_b integer;
  v_wins_a integer := 0;
  v_wins_b integer := 0;
  v_required integer;
  v_index integer := 0;
  v_seen text[] := '{}'::text[];
  v_winner uuid;
  v_parent public.iste_tournament_matches%rowtype;
  v_parent_round integer;
  v_new jsonb;
begin
  if auth.role() is distinct from 'authenticated' or v_actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if auth.jwt()->>'aal' is distinct from 'aal2' then
    raise exception 'MFA_REQUIRED' using errcode = '42501';
  end if;
  select role, is_blocked into v_access
  from public.user_roles where user_id = v_actor;
  if not found or v_access.role is distinct from 'owner'
    or v_access.is_blocked is distinct from false then
    raise exception 'OWNER_REQUIRED' using errcode = '42501';
  end if;
  if p_match_id is null or p_expected_version is null or p_expected_version < 0
    or p_result is null or jsonb_typeof(p_result) <> 'object'
    or p_result->'bestOf' is null or p_result->'maps' is null
    or exists (select 1 from jsonb_object_keys(p_result) k
               where k not in ('bestOf','maps'))
    or jsonb_typeof(p_result->'bestOf') <> 'number'
    or jsonb_typeof(p_result->'maps') <> 'array' then
    raise exception 'INVALID_RESULT' using errcode = '22023';
  end if;
  -- Lock protects concurrent confirmations; a stale caller cannot overwrite.
  select * into v_match from public.iste_tournament_matches
    where id = p_match_id for update;
  if not found then raise exception 'MATCH_NOT_FOUND' using errcode = '22023'; end if;
  select * into v_tournament from public.iste_tournaments where id=v_match.tournament_id;
  if v_tournament.status is distinct from 'live' then
    raise exception 'TOURNAMENT_NOT_LIVE' using errcode = '22023';
  end if;
  if v_match.version <> p_expected_version or v_match.status='finished' or v_match.winner_team_id is not null then
    raise exception 'STALE_OR_FINISHED_MATCH' using errcode = '40001';
  end if;
  if v_match.status not in ('ready','live') or v_match.team_a_id is null
    or v_match.team_b_id is null or v_match.team_a_id = v_match.team_b_id then
    raise exception 'MATCH_NOT_READY' using errcode = '22023';
  end if;
  if (p_result->>'bestOf')::text <> v_match.best_of::text then
    raise exception 'BO_MISMATCH' using errcode = '22023';
  end if;
  if not exists (select 1 from public.iste_tournament_teams
                 where id=v_match.team_a_id and tournament_id=v_match.tournament_id)
    or not exists (select 1 from public.iste_tournament_teams
                   where id=v_match.team_b_id and tournament_id=v_match.tournament_id) then
    raise exception 'FOREIGN_TOURNAMENT_TEAM' using errcode = '22023';
  end if;

  v_maps := p_result->'maps';
  v_required := (v_match.best_of+1)/2;
  if jsonb_array_length(v_maps) < v_required or jsonb_array_length(v_maps)>v_match.best_of then
    raise exception 'INVALID_MAP_COUNT' using errcode = '22023';
  end if;
  for v_entry in select value from jsonb_array_elements(v_maps) loop
    v_index := v_index + 1;
    if jsonb_typeof(v_entry) <> 'object' or
      exists (select 1 from jsonb_object_keys(v_entry) k
              where k not in ('name','scoreA','scoreB')) or
      jsonb_typeof(v_entry->'name') <> 'string' or
      jsonb_typeof(v_entry->'scoreA') <> 'number' or
      jsonb_typeof(v_entry->'scoreB') <> 'number' then
      raise exception 'INVALID_MAP_ENTRY' using errcode = '22023';
    end if;
    v_map := v_entry->>'name';
    if v_map not in ('Ancient','Anubis','Dust2','Inferno','Mirage','Nuke','Overpass','Train','Vertigo')
       or v_map = any(v_seen) then
      raise exception 'INVALID_MAP_NAME' using errcode = '22023';
    end if;
    if (v_entry->>'scoreA') !~ '^(0|[1-9][0-9]?)$'
      or (v_entry->>'scoreB') !~ '^(0|[1-9][0-9]?)$' then
      raise exception 'INVALID_SCORE' using errcode = '22023';
    end if;
    v_score_a := (v_entry->>'scoreA')::integer;
    v_score_b := (v_entry->>'scoreB')::integer;
    -- MR12 regulation: 13 rounds against 0 through 11.
    -- MR3 overtime: 16, 19, 22, ... winning rounds; lead 2 to 4.
    -- Forfeits require a separate audited workflow.
    if not (
      (greatest(v_score_a,v_score_b) = 13
        and least(v_score_a,v_score_b) between 0 and 11)
      or
      (greatest(v_score_a,v_score_b) >= 16
        and (greatest(v_score_a,v_score_b) - 16) % 3 = 0
        and least(v_score_a,v_score_b) between
            greatest(v_score_a,v_score_b) - 4
            and greatest(v_score_a,v_score_b) - 2)
    ) then
      raise exception 'INVALID_CS2_MAP_SCORE' using errcode = '22023';
    end if;
    if v_score_a = v_score_b or v_wins_a >= v_required or v_wins_b >= v_required then
      raise exception 'SERIES_INVALID_OR_DECIDED' using errcode = '22023';
    end if;
    v_seen := array_append(v_seen, v_map);
    if v_score_a > v_score_b then v_wins_a := v_wins_a + 1;
    else v_wins_b := v_wins_b + 1; end if;
  end loop;
  if v_wins_a < v_required and v_wins_b < v_required then
    raise exception 'SERIES_INCOMPLETE' using errcode = '22023';
  end if;
  v_winner := case when v_wins_a>v_wins_b then v_match.team_a_id else v_match.team_b_id end;

  -- A fully seeded single-elimination bracket requires its parent unless this
  -- was the final. Match indices 0..capacity/2^(round+1)-1 are checked here.
  if v_match.round_index < 0 or
     (v_tournament.capacity / power(2::numeric,v_match.round_index+1)) < 1 or
     v_match.match_index >= (v_tournament.capacity / power(2::numeric,v_match.round_index+1)) then
    raise exception 'INVALID_BRACKET_POSITION' using errcode = '22023';
  end if;
  v_parent_round := v_match.round_index + 1;
  if v_tournament.capacity / power(2::numeric,v_parent_round+1) >= 1 then
    select * into v_parent from public.iste_tournament_matches
    where tournament_id=v_match.tournament_id and round_index=v_parent_round
      and match_index=(v_match.match_index / 2) for update;
    if not found then raise exception 'MISSING_NEXT_ROUND_MATCH' using errcode = '22023'; end if;
    if v_parent.status='finished' or v_parent.winner_team_id is not null
      or (v_match.match_index % 2 = 0 and v_parent.team_a_id is not null)
      or (v_match.match_index % 2 = 1 and v_parent.team_b_id is not null) then
      raise exception 'NEXT_SLOT_UNAVAILABLE' using errcode = '40001';
    end if;
  end if;

  for v_entry in select value from jsonb_array_elements(v_maps) loop
    v_index := (select count(*) from public.iste_tournament_maps where match_id=p_match_id)+1;
    insert into public.iste_tournament_maps(match_id,map_index,map_name,score_a,score_b)
    values(p_match_id,v_index,v_entry->>'name',
      (v_entry->>'scoreA')::integer,(v_entry->>'scoreB')::integer);
  end loop;
  update public.iste_tournament_matches set
    score_a=v_wins_a, score_b=v_wins_b, winner_team_id=v_winner,
    status='finished', version=version+1, updated_at=now()
  where id=p_match_id;
  if v_parent.id is not null then
    update public.iste_tournament_matches set
      team_a_id=case when v_match.match_index%2=0 then v_winner else team_a_id end,
      team_b_id=case when v_match.match_index%2=1 then v_winner else team_b_id end,
      version=version+1,updated_at=now()
    where id=v_parent.id;
    -- Once both finalists advance, the next match becomes confirmable.
    -- Keep its version increment from the slot update above.
    update public.iste_tournament_matches set status='ready',updated_at=now()
    where id=v_parent.id and status='scheduled'
      and team_a_id is not null and team_b_id is not null;
  end if;
  v_new := jsonb_build_object('matchId',p_match_id,'winnerTeamId',v_winner,
     'scoreA',v_wins_a,'scoreB',v_wins_b,'maps',v_maps,'version',v_match.version+1);
  insert into public.iste_tournament_audit_log
    (tournament_id,actor_id,entity_type,entity_id,action,previous_data,new_data)
  values(v_match.tournament_id,v_actor,'match',p_match_id,'confirm_result',
    jsonb_build_object('version',v_match.version,'status',v_match.status,
       'scoreA',v_match.score_a,'scoreB',v_match.score_b),v_new);
  return v_new;
end;
$function$;
