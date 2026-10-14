-- REVIEW ONLY. Requires V2 foundation. Do not deploy without verified backup.
begin;
create or replace function public.iste_owner_transition_tournament(
 p_tournament_id uuid, p_expected_status text, p_next_status text
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
 v_actor uuid:=auth.uid();
 v_access record;
 v_t public.iste_tournaments%rowtype;
 v_approved integer;
 v_matches integer;
 v_finished integer;
 v_final integer;
 v_final_winner uuid;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
   raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
   raise exception 'MFA_REQUIRED' using errcode='42501'; end if;
 select role,is_blocked into v_access from public.user_roles where user_id=v_actor;
 if not found or v_access.role is distinct from 'owner' or v_access.is_blocked is distinct from false then
   raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
 if p_tournament_id is null or p_expected_status is null or p_next_status is null or
   not ((p_expected_status='draft' and p_next_status='registration')
     or (p_expected_status='registration' and p_next_status='checkin')
     or (p_expected_status='checkin' and p_next_status='live')
     or (p_expected_status='live' and p_next_status='finished')) then
   raise exception 'INVALID_STATUS_TRANSITION' using errcode='22023'; end if;
 select * into v_t from public.iste_tournaments where id=p_tournament_id for update;
 if not found then raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023'; end if;
 if v_t.status is distinct from p_expected_status then
   raise exception 'STALE_TOURNAMENT_STATUS' using errcode='40001'; end if;
 if p_next_status='registration' then
   if v_t.capacity not between 2 and 128 or v_t.game<>'CS2' then
     raise exception 'TOURNAMENT_INVALID' using errcode='22023'; end if;
 elsif p_next_status='checkin' then
   select count(*) into v_approved from public.iste_tournament_teams
    where tournament_id=p_tournament_id and status in ('approved','checked_in');
   if v_approved<>v_t.capacity then
     raise exception 'CAPACITY_NOT_READY' using errcode='22023'; end if;
 elsif p_next_status='live' then
   select count(*) into v_approved from public.iste_tournament_teams
    where tournament_id=p_tournament_id and status in ('approved','checked_in');
   select count(*) into v_matches from public.iste_tournament_matches where tournament_id=p_tournament_id;
   if v_approved<>v_t.capacity or v_matches<>v_t.capacity-1 or
      exists(select 1 from public.iste_tournament_matches
      where tournament_id=p_tournament_id and round_index=0
        and (team_a_id is null or team_b_id is null or status<>'ready')) then
     raise exception 'BRACKET_NOT_READY' using errcode='22023'; end if;
 elsif p_next_status='finished' then
   select count(*),count(*) filter(where status='finished' and winner_team_id is not null)
     into v_matches,v_finished from public.iste_tournament_matches where tournament_id=p_tournament_id;
   select count(*) into v_final
   from public.iste_tournament_matches where tournament_id=p_tournament_id
    and round_index=(select max(round_index) from public.iste_tournament_matches where tournament_id=p_tournament_id)
    and status='finished';
   select winner_team_id into v_final_winner
   from public.iste_tournament_matches where tournament_id=p_tournament_id
    and round_index=(select max(round_index) from public.iste_tournament_matches where tournament_id=p_tournament_id)
    and status='finished' limit 1;
   if v_matches<>v_t.capacity-1 or v_finished<>v_matches or v_final<>1 or v_final_winner is null then
     raise exception 'TOURNAMENT_NOT_COMPLETE' using errcode='22023'; end if;
 end if;
 update public.iste_tournaments set status=p_next_status,
   published_at=case when p_next_status='registration' then coalesce(published_at,now()) else published_at end,
   updated_at=now()
 where id=p_tournament_id;
 insert into public.iste_tournament_audit_log(tournament_id,actor_id,entity_type,entity_id,action,previous_data,new_data)
 values(p_tournament_id,v_actor,'tournament',p_tournament_id,'status_transition',
  jsonb_build_object('status',v_t.status),jsonb_build_object('status',p_next_status));
 return jsonb_build_object('tournamentId',p_tournament_id,'previousStatus',v_t.status,'status',p_next_status,
   'championTeamId',case when p_next_status='finished' then v_final_winner else null end);
end;
$fn$;
revoke all on function public.iste_owner_transition_tournament(uuid,text,text) from public,anon;
grant execute on function public.iste_owner_transition_tournament(uuid,text,text) to authenticated;
commit;
