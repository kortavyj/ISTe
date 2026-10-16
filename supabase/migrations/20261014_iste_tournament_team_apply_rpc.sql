-- REVIEW ONLY. Requires V2 foundation; do not apply to DEV/production without verified backup.
-- Serializes team registrations for each tournament by locking its parent row.
begin;
create or replace function public.iste_apply_tournament_team(p_application jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare
 v_actor uuid := auth.uid();
 v_blocked boolean;
 v_tournament public.iste_tournaments%rowtype;
 v_team uuid;
 v_name text;
 v_member jsonb;
 v_uid uuid;
 v_faceit text;
 v_count integer := 0;
 v_captains integer := 0;
 v_user_ids uuid[] := '{}';
 v_faceit_ids text[] := '{}';
 v_existing integer;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501';
 end if;
 select is_blocked into v_blocked from public.user_roles where user_id=v_actor;
 if v_blocked is true then raise exception 'ACCOUNT_BLOCKED' using errcode='42501'; end if;
 if p_application is null or jsonb_typeof(p_application)<>'object'
   or exists(select 1 from jsonb_object_keys(p_application) k where k not in ('tournamentId','name','members'))
   or jsonb_typeof(p_application->'tournamentId')<>'string'
   or jsonb_typeof(p_application->'name')<>'string'
   or jsonb_typeof(p_application->'members')<>'array'
 then raise exception 'INVALID_APPLICATION' using errcode='22023'; end if;
 if (p_application->>'tournamentId') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then
  raise exception 'INVALID_TOURNAMENT_ID' using errcode='22023';
 end if;
 v_name := regexp_replace(btrim(p_application->>'name'),'[[:space:]]+',' ','g');
 if length(v_name) not between 2 and 80 or v_name ~ '[[:cntrl:]]' then
  raise exception 'INVALID_TEAM_NAME' using errcode='22023'; end if;
 if jsonb_array_length(p_application->'members') not between 5 and 7 then
  raise exception 'INVALID_ROSTER_SIZE' using errcode='22023'; end if;

 -- The tournament lock orders simultaneous applications and capacity checks.
 select * into v_tournament from public.iste_tournaments
 where id=(p_application->>'tournamentId')::uuid for update;
 if not found then raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023'; end if;
 if v_tournament.status <> 'registration' or
    (v_tournament.registration_start is not null and now()<v_tournament.registration_start) or
    (v_tournament.registration_end is not null and now()>=v_tournament.registration_end) then
  raise exception 'REGISTRATION_CLOSED' using errcode='22023'; end if;
 select count(*) into v_existing from public.iste_tournament_teams
 where tournament_id=v_tournament.id and status in ('pending','approved','checked_in');
 if v_existing>=v_tournament.capacity then
  raise exception 'TOURNAMENT_FULL' using errcode='22023'; end if;
 if exists(select 1 from public.iste_tournament_teams
           where tournament_id=v_tournament.id and lower(btrim(name))=lower(v_name)) then
  raise exception 'TEAM_NAME_TAKEN' using errcode='23505'; end if;

 for v_member in select value from jsonb_array_elements(p_application->'members') loop
  if jsonb_typeof(v_member)<>'object'
   or exists(select 1 from jsonb_object_keys(v_member) k where k not in ('userId','faceitPlayerId')) then
    raise exception 'INVALID_MEMBER' using errcode='22023'; end if;
  v_uid := null;
  v_faceit := null;
  if v_member->'userId' is not null and v_member->'userId'<>'null'::jsonb then
   if jsonb_typeof(v_member->'userId')<>'string'
     or (v_member->>'userId') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then
     raise exception 'INVALID_MEMBER_ID' using errcode='22023'; end if;
   v_uid := (v_member->>'userId')::uuid;
   if not exists (select 1 from auth.users where id=v_uid) then
    raise exception 'PLAYER_ACCOUNT_NOT_FOUND' using errcode='22023';
   end if;
  end if;
  if v_member->'faceitPlayerId' is not null and v_member->'faceitPlayerId'<>'null'::jsonb then
   if jsonb_typeof(v_member->'faceitPlayerId')<>'string'
     or (v_member->>'faceitPlayerId') !~ '^[A-Za-z0-9_-]{3,64}$' then
     raise exception 'INVALID_FACEIT_ID' using errcode='22023'; end if;
   v_faceit := lower(v_member->>'faceitPlayerId');
  end if;
  if v_uid is null and v_faceit is null then
   raise exception 'MISSING_MEMBER_IDENTITY' using errcode='22023'; end if;
  if v_uid is not null then
    if v_uid=any(v_user_ids) then raise exception 'DUPLICATE_MEMBER' using errcode='22023'; end if;
    v_user_ids := array_append(v_user_ids,v_uid);
    if v_uid=v_actor then v_captains:=v_captains+1; end if;
  end if;
  if v_faceit is not null then
    if v_faceit=any(v_faceit_ids) then raise exception 'DUPLICATE_FACEIT' using errcode='22023'; end if;
    v_faceit_ids:=array_append(v_faceit_ids,v_faceit);
  end if;
  v_count:=v_count+1;
 end loop;
 if v_count not between 5 and 7 or v_captains<>1 then
  raise exception 'CAPTAIN_NOT_IN_ROSTER' using errcode='22023'; end if;

 -- Reject overlapping active players in existing tournament applications.
 if exists(
  select 1 from public.iste_tournament_members m
   join public.iste_tournament_teams t on t.id=m.team_id
  where t.tournament_id=v_tournament.id and t.status in ('pending','approved','checked_in')
    and ((m.user_id is not null and m.user_id=any(v_user_ids))
      or (m.faceit_player_id is not null and lower(m.faceit_player_id)=any(v_faceit_ids)))
 ) then raise exception 'PLAYER_ALREADY_REGISTERED' using errcode='23505'; end if;

 insert into public.iste_tournament_teams(tournament_id,name,captain_user_id,status)
 values(v_tournament.id,v_name,v_actor,'pending') returning id into v_team;
 for v_member in select value from jsonb_array_elements(p_application->'members') loop
  insert into public.iste_tournament_members(team_id,user_id,faceit_player_id,is_captain)
  values(v_team,nullif(v_member->>'userId','')::uuid,
    nullif(lower(v_member->>'faceitPlayerId'),''),
    coalesce((v_member->>'userId')::uuid=v_actor,false));
 end loop;
 insert into public.iste_tournament_audit_log(tournament_id,actor_id,entity_type,entity_id,action,new_data)
 values(v_tournament.id,v_actor,'team',v_team,'team_application',
   jsonb_build_object('teamName',v_name,'status','pending','members',v_count));
 return jsonb_build_object('teamId',v_team,'tournamentId',v_tournament.id,'status','pending');
end;
$fn$;
revoke all on function public.iste_apply_tournament_team(jsonb) from public,anon;
grant execute on function public.iste_apply_tournament_team(jsonb) to authenticated;
commit;
