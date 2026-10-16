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
  -- Refresh and lock the team after the tournament lock: a concurrent owner
  -- review may have changed its status while this request was waiting.
  select * into v_team from public.iste_tournament_teams
    where id=v_member.team_id for update;
  if not found or v_team.tournament_id is distinct from v_tournament.id then
    raise exception 'ROSTER_CLOSED' using errcode='22023';
  end if;
  select * into v_member from public.iste_tournament_members
    where id=p_member_id for update;
  if v_member.user_id is distinct from v_actor then
    raise exception 'MEMBER_NOT_FOUND' using errcode='42501';
  end if;
  if v_tournament.status <> 'registration' or v_team.status <> 'pending'
    or (v_tournament.registration_start is not null and now()<v_tournament.registration_start)
    or (v_tournament.registration_end is not null and now()>=v_tournament.registration_end) then
    raise exception 'ROSTER_CLOSED' using errcode='22023';
  end if;
  if p_accept and v_member.accepted_at is not null then
    raise exception 'MEMBERSHIP_ALREADY_CONFIRMED' using errcode='40001';
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
  insert into public.iste_tournament_audit_log
    (tournament_id,actor_id,entity_type,entity_id,action,previous_data,new_data)
  values
    (v_tournament.id,v_actor,'member',p_member_id,
     case when p_accept then 'member_accepted' else 'member_declined' end,
     jsonb_build_object('acceptedAt',v_member.accepted_at),
     jsonb_build_object('accepted',p_accept));
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
   where team_id=p_team_id and role in ('player','substitute');
   -- Coaches cannot satisfy the required 5–7 playing roster slots.
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
      where team_id=p_team_id and role in ('player','substitute') and is_captain and user_id=v_team.captain_user_id) then
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


-- A user may list only their own outstanding V2 roster invitations.
-- The RPC returns no other players' identifiers.
create or replace function public.iste_v2_my_roster_invitations()
returns table (
  member_id uuid, team_id uuid, team_name text,
  tournament_id uuid, tournament_title text, is_captain boolean
)
language plpgsql security definer set search_path=''
as $function$
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;
  if exists (select 1 from public.user_roles
      where user_id=auth.uid() and is_blocked is true) then
    raise exception 'ACCOUNT_BLOCKED' using errcode='42501';
  end if;
  return query
    select m.id,t.id,t.name,t.tournament_id,ev.title,m.is_captain
    from public.iste_tournament_members m
    join public.iste_tournament_teams t on t.id=m.team_id
    join public.iste_tournaments ev on ev.id=t.tournament_id
    where m.user_id=auth.uid() and m.accepted_at is null
      and t.status='pending' and ev.status='registration'
      and (ev.registration_start is null or now()>=ev.registration_start)
      and (ev.registration_end is null or now()<ev.registration_end)
    order by m.created_at, m.id;
end;
$function$;
revoke all on function public.iste_v2_my_roster_invitations() from public,anon;
grant execute on function public.iste_v2_my_roster_invitations() to authenticated;


-- Captain may replace a declined (deleted) member while application is pending.
-- Total roster may never exceed seven and cannot be edited after review.
create or replace function public.iste_v2_invite_replacement(
 p_team_id uuid, p_user_id uuid
) returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
 v_actor uuid := auth.uid();
 v_team public.iste_tournament_teams%rowtype;
 v_tournament public.iste_tournaments%rowtype;
 v_count integer;
 v_member_id uuid;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_team_id is null or p_user_id is null then
  raise exception 'INVALID_REQUEST' using errcode='22023'; end if;
 select * into v_team from public.iste_tournament_teams where id=p_team_id;
 if not found or v_team.captain_user_id is distinct from v_actor then
  raise exception 'TEAM_NOT_FOUND' using errcode='42501'; end if;
 select * into v_tournament from public.iste_tournaments
 where id=v_team.tournament_id for update;
 select * into v_team from public.iste_tournament_teams
 where id=p_team_id for update;
 if v_team.captain_user_id is distinct from v_actor
   or v_team.status<>'pending' or v_tournament.status<>'registration'
   or (v_tournament.registration_end is not null and now()>=v_tournament.registration_end)
   or (v_tournament.registration_start is not null and now()<v_tournament.registration_start) then
  raise exception 'ROSTER_CLOSED' using errcode='22023'; end if;
 if exists(select 1 from public.user_roles where user_id=v_actor and is_blocked)
    or exists(select 1 from public.user_roles where user_id=p_user_id and is_blocked) then
  raise exception 'ACCOUNT_BLOCKED' using errcode='42501'; end if;
 if p_user_id=v_actor then raise exception 'DUPLICATE_MEMBER' using errcode='23505'; end if;
 select count(*) into v_count from public.iste_tournament_members
 where team_id=p_team_id;
 if v_count>=7 then raise exception 'ROSTER_FULL' using errcode='22023'; end if;
 if exists (
  select 1 from public.iste_tournament_members m
   join public.iste_tournament_teams t on t.id=m.team_id
  where t.tournament_id=v_tournament.id and t.status in ('pending','approved','checked_in')
    and m.user_id=p_user_id
 ) then raise exception 'PLAYER_ALREADY_REGISTERED' using errcode='23505'; end if;
 insert into public.iste_tournament_members(team_id,user_id,is_captain)
 values(p_team_id,p_user_id,false) returning id into v_member_id;
 insert into public.iste_tournament_audit_log
  (tournament_id,actor_id,entity_type,entity_id,action,new_data)
 values(v_tournament.id,v_actor,'member',v_member_id,'member_invited',
  jsonb_build_object('teamId',p_team_id));
 return jsonb_build_object('memberId',v_member_id,'teamId',p_team_id);
end;
$function$;
revoke all on function public.iste_v2_invite_replacement(uuid,uuid) from public,anon;
grant execute on function public.iste_v2_invite_replacement(uuid,uuid) to authenticated;


-- Only the captain may discover the ID of their own pending team.
create or replace function public.iste_v2_my_pending_captain_teams()
returns table(team_id uuid,team_name text,tournament_title text,member_count bigint)
language plpgsql security definer set search_path=''
as $function$
begin
 if auth.role() is distinct from 'authenticated' or auth.uid() is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked) then
  raise exception 'ACCOUNT_BLOCKED' using errcode='42501'; end if;
 return query
 select t.id,t.name,ev.title,count(m.id)
 from public.iste_tournament_teams t
 join public.iste_tournaments ev on ev.id=t.tournament_id
 left join public.iste_tournament_members m on m.team_id=t.id
 where t.captain_user_id=auth.uid() and t.status='pending'
   and ev.status='registration'
   and (ev.registration_start is null or now()>=ev.registration_start)
   and (ev.registration_end is null or now()<ev.registration_end)
 group by t.id,t.name,ev.title
 order by t.name,t.id;
end;
$function$;
revoke all on function public.iste_v2_my_pending_captain_teams() from public,anon;
grant execute on function public.iste_v2_my_pending_captain_teams() to authenticated;

-- Private V2 roster and audit tables are writable only through identity-scoped
-- SECURITY DEFINER RPCs, never directly through Supabase client roles.
-- Explicit table-level REVOKE is defense in depth alongside deny-by-default RLS.
revoke all on table public.iste_tournament_teams,
 public.iste_tournament_members,
 public.iste_tournament_audit_log from anon, authenticated;

-- Public tournament, match and map read policies remain available. Direct client
-- writes are forbidden; privileged, identity-checked RPCs own all mutations.
revoke insert, update, delete, truncate, references, trigger on table
 public.iste_tournaments,
 public.iste_tournament_matches,
 public.iste_tournament_maps from anon, authenticated;

-- RLS already limits these tables to published tournament data. Explicit
-- SELECT grants are required on clean foundation installs; existing staging
-- might have inherited broader default grants instead.
grant select on table public.iste_tournaments,
 public.iste_tournament_matches,
 public.iste_tournament_maps to anon, authenticated;
