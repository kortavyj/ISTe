-- REVIEW ONLY — never run against existing Supabase without verified backup.
-- Requires V2 foundation and pre-existing public.user_roles table.
begin;
create or replace function public.iste_owner_review_team(
  p_team_id uuid, p_expected_status text, p_decision text
) returns jsonb
language plpgsql security definer set search_path=''
as $body$
declare
 v_actor uuid := auth.uid();
 v_role record;
 v_team public.iste_tournament_teams%rowtype;
 v_tournament public.iste_tournaments%rowtype;
 v_approved bigint;
 v_members bigint;
 v_captains bigint;
 v_next text;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
   raise exception 'AUTH_REQUIRED' using errcode='42501';
 end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
   raise exception 'MFA_REQUIRED' using errcode='42501';
 end if;
 select role,is_blocked into v_role from public.user_roles where user_id=v_actor;
 if not found or v_role.role is distinct from 'owner'
    or v_role.is_blocked is distinct from false then
   raise exception 'OWNER_REQUIRED' using errcode='42501';
 end if;
 if p_team_id is null or p_expected_status is distinct from 'pending'
   or p_decision not in ('approve','reject') or p_decision is null then
   raise exception 'INVALID_REVIEW_REQUEST' using errcode='22023';
 end if;

 -- Lock tournament before team consistently with registration RPC to
 -- serialize approvals against applications and status transitions.
 select tournament_id into v_team.tournament_id
 from public.iste_tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND' using errcode='22023'; end if;
 select * into v_tournament from public.iste_tournaments
   where id=v_team.tournament_id for update;
 if not found then raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023'; end if;
 select * into v_team from public.iste_tournament_teams
   where id=p_team_id for update;
 if v_team.tournament_id<>v_tournament.id or v_team.status<>'pending' then
   raise exception 'TEAM_ALREADY_REVIEWED' using errcode='40001'; end if;
 if v_tournament.status not in ('registration','checkin') then
   raise exception 'TOURNAMENT_REVIEW_CLOSED' using errcode='22023'; end if;

 if p_decision='approve' then
   select count(*),count(*) filter (where is_captain)
   into v_members,v_captains from public.iste_tournament_members
   where team_id=p_team_id;
   if v_members not between 5 and 7 or v_captains<>1 or
      not exists (select 1 from public.iste_tournament_members
      where team_id=p_team_id and is_captain and user_id=v_team.captain_user_id) then
     raise exception 'ROSTER_INCOMPLETE' using errcode='22023';
   end if;
   select count(*) into v_approved from public.iste_tournament_teams
      where tournament_id=v_tournament.id and status in ('approved','checked_in');
   if v_approved >= v_tournament.capacity then
     raise exception 'TOURNAMENT_FULL' using errcode='22023'; end if;
   v_next := 'approved';
 else
   v_next := 'rejected';
 end if;
 update public.iste_tournament_teams set status=v_next,updated_at=now()
   where id=p_team_id;
 insert into public.iste_tournament_audit_log
 (tournament_id,actor_id,entity_type,entity_id,action,previous_data,new_data)
 values(v_tournament.id,v_actor,'team',p_team_id,
   case when v_next='approved' then 'team_approved' else 'team_rejected' end,
   jsonb_build_object('status',v_team.status),
   jsonb_build_object('status',v_next));
 return jsonb_build_object('teamId',p_team_id,'tournamentId',v_tournament.id,
   'status',v_next);
end;
$body$;
revoke all on function public.iste_owner_review_team(uuid,text,text) from public,anon;
grant execute on function public.iste_owner_review_team(uuid,text,text) to authenticated;
commit;
