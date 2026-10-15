-- Candidate for isolated V2 staging. Existing roster rows need a
-- controlled invitation/confirmation backfill; never auto-consent.
alter table public.iste_tournament_members
  add column if not exists accepted_at timestamptz;

-- Each account holder may confirm only their own roster membership.
-- Captains cannot confirm on another account's behalf.
create or replace function public.iste_v2_respond_roster_membership(
  p_member_id uuid, p_accept boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_member public.iste_tournament_members%rowtype;
  v_team public.iste_tournament_teams%rowtype;
  v_tournament public.iste_tournaments%rowtype;
begin
  if auth.role() is distinct from 'authenticated' or v_actor is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;
  if p_member_id is null or p_accept is null then
    raise exception 'INVALID_REQUEST' using errcode='22023';
  end if;
  select * into v_member from public.iste_tournament_members
    where id=p_member_id;
  if not found or v_member.user_id is distinct from v_actor then
    raise exception 'MEMBER_NOT_FOUND' using errcode='42501';
  end if;
  select * into v_team from public.iste_tournament_teams
    where id=v_member.team_id;
  select * into v_tournament from public.iste_tournaments
    where id=v_team.tournament_id for update;
  select * into v_member from public.iste_tournament_members
    where id=p_member_id for update;
  if v_member.user_id is distinct from v_actor then
    raise exception 'MEMBER_NOT_FOUND' using errcode='42501';
  end if;
  if v_tournament.status <> 'registration' or v_team.status <> 'pending' then
    raise exception 'ROSTER_CLOSED' using errcode='22023';
  end if;
  if p_accept then
    if exists(select 1 from public.user_roles
       where user_id=v_actor and is_blocked is true) then
      raise exception 'ACCOUNT_BLOCKED' using errcode='42501';
    end if;
    update public.iste_tournament_members
      set accepted_at=now() where id=p_member_id;
  else
    if v_member.is_captain then
      raise exception 'CAPTAIN_CANNOT_DECLINE' using errcode='22023';
    end if;
    delete from public.iste_tournament_members where id=p_member_id;
  end if;
  return jsonb_build_object('memberId',p_member_id,'accepted',p_accept);
end;
$function$;
revoke all on function public.iste_v2_respond_roster_membership(uuid,boolean) from public,anon;
grant execute on function public.iste_v2_respond_roster_membership(uuid,boolean) to authenticated;

CREATE OR REPLACE FUNCTION public.iste_owner_review_team(p_team_id uuid, p_expected_status text, p_decision text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   -- An account holder must explicitly consent to tournament participation.
   -- FACEIT-only records have no authenticated account to consent and
   -- must be verified via a separate identity-proof workflow.
   if exists (
     select 1 from public.iste_tournament_members m
     where m.team_id=p_team_id and
       (m.user_id is null or m.accepted_at is null or m.accepted_at < m.created_at)
   ) then
     raise exception 'ROSTER_NOT_CONFIRMED' using errcode='22023';
   end if;
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
$function$;
