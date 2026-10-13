-- Format-aware roster caps. Starter slots include captain; substitutes only in 5v5.
create or replace function public.iste_add_team_player(p_team_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_team_id is null or p_user_id is distinct from auth.uid() then raise exception 'INVALID_PLAYER'; end if;
 if exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id for update;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 if v_team.captain_user_id is null then raise exception 'CAPTAIN_REQUIRED'; end if;
 if v_team.captain_user_id=auth.uid() then raise exception 'ALREADY_CAPTAIN'; end if;
 if not exists(select 1 from public.tournaments t where t.id=v_team.tournament_id and t.status='registration')
 then raise exception 'REGISTRATION_CLOSED'; end if;
 if exists(select 1 from public.tournament_teams t where t.tournament_id=v_team.tournament_id
  and t.captain_user_id=auth.uid())
 then raise exception 'ALREADY_CAPTAIN'; end if;
 if exists(select 1 from public.tournament_team_players p join public.tournament_teams t on t.id=p.team_id
  where t.tournament_id=v_team.tournament_id and p.user_id=auth.uid())
 then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
 if (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='starter') >= (select team_size-1 from public.tournaments where id=v_team.tournament_id)
 then raise exception 'TEAM_FULL'; end if;
 insert into public.tournament_team_applications(team_id,user_id,status,reviewed_at)
 values(p_team_id,auth.uid(),'pending',null)
 on conflict(team_id,user_id) do update set status='pending',reviewed_at=null;
end $$;


-- Prevent concurrent captains admitting a user to multiple teams of one tournament.
create or replace function public.iste_review_team_application(p_team_id uuid,p_user_id uuid,p_accept boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 -- Serialize approvals across every team of the same tournament, not just this team.
 -- Lock before selecting the team FOR UPDATE to keep a consistent lock order.
 select tournament_id into v_team.tournament_id
 from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text, 0));
 select * into v_team from public.tournament_teams where id=p_team_id for update;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 if v_team.captain_user_id is distinct from auth.uid() then raise exception 'CAPTAIN_REQUIRED'; end if;
 if not exists(select 1 from public.tournaments t where t.id=v_team.tournament_id and t.status='registration')
 then raise exception 'REGISTRATION_CLOSED'; end if;
 if not exists(select 1 from public.tournament_team_applications a
  where a.team_id=p_team_id and a.user_id=p_user_id and a.status='pending')
 then raise exception 'APPLICATION_NOT_FOUND'; end if;
 if p_accept then
  if (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='starter') >= (select team_size-1 from public.tournaments where id=v_team.tournament_id)
  then raise exception 'TEAM_FULL'; end if;
  if exists(select 1 from public.user_roles r where r.user_id=p_user_id and r.is_blocked is true)
  then raise exception 'PLAYER_BLOCKED'; end if;
  if exists(select 1 from public.tournament_teams t where t.tournament_id=v_team.tournament_id
   and t.captain_user_id=p_user_id)
  then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
  if exists(select 1 from public.tournament_team_players p join public.tournament_teams t on t.id=p.team_id
   where t.tournament_id=v_team.tournament_id and p.user_id=p_user_id)
  then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
  insert into public.tournament_team_players(team_id,user_id) values(p_team_id,p_user_id)
  on conflict do nothing;
 end if;
 update public.tournament_team_applications set status=case when p_accept then 'accepted' else 'rejected' end,
 reviewed_at=now() where team_id=p_team_id and user_id=p_user_id;
end $$;

create or replace function public.iste_manage_team(p_team_id uuid,p_action text,p_user_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked is true) then raise exception 'ACCOUNT_BLOCKED'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id for update;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text,0));
 if not exists(select 1 from public.tournaments where id=v_team.tournament_id and status='registration') then raise exception 'REGISTRATION_CLOSED'; end if;
 if p_action='leave' then
   if p_user_id is distinct from auth.uid() then raise exception 'FORBIDDEN'; end if;
   if not exists(select 1 from public.tournament_team_players where team_id=p_team_id and user_id=auth.uid()) then raise exception 'NOT_TEAM_MEMBER'; end if;
   delete from public.tournament_team_players where team_id=p_team_id and user_id=auth.uid();
   delete from public.tournament_team_applications where team_id=p_team_id and user_id=auth.uid();
   update public.tournament_teams set is_ready=false where id=p_team_id;
 elsif p_action='remove' then
   if v_team.captain_user_id is distinct from auth.uid() then raise exception 'CAPTAIN_REQUIRED'; end if;
   if p_user_id is null or p_user_id=v_team.captain_user_id then raise exception 'INVALID_PLAYER'; end if;
   delete from public.tournament_team_players where team_id=p_team_id and user_id=p_user_id;
   if not found then raise exception 'NOT_TEAM_MEMBER'; end if;
   delete from public.tournament_team_applications where team_id=p_team_id and user_id=p_user_id;
   update public.tournament_teams set is_ready=false where id=p_team_id;
 elsif p_action in ('ready','unready') then
   if v_team.captain_user_id is distinct from auth.uid() then raise exception 'CAPTAIN_REQUIRED'; end if;
   if p_action='ready' and (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='starter')<>(select team_size-1 from public.tournaments where id=v_team.tournament_id) then raise exception 'ROSTER_INCOMPLETE'; end if;
   update public.tournament_teams set is_ready=(p_action='ready') where id=p_team_id;
 else
   raise exception 'INVALID_ACTION';
 end if;
end $$;

create or replace function public.iste_invite_team_player(p_team_id uuid,p_username text,p_role text default 'starter')
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype; v_player uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_role not in ('starter','substitute') then raise exception 'INVALID_ROLE'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text,0));
 if p_role='substitute' and (select team_size from public.tournaments where id=v_team.tournament_id)<>5 then raise exception 'INVALID_ROLE'; end if;
 if v_team.captain_user_id is distinct from auth.uid() then raise exception 'CAPTAIN_REQUIRED'; end if;
 if not exists(select 1 from public.tournaments where id=v_team.tournament_id and status='registration') then raise exception 'REGISTRATION_CLOSED'; end if;
 if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked is true) then raise exception 'ACCOUNT_BLOCKED'; end if;
 select id into v_player from public.profiles where lower(username)=lower(trim(p_username)) limit 1;
 if v_player is null then raise exception 'USER_NOT_FOUND'; end if;
 if v_player=auth.uid() then raise exception 'INVALID_PLAYER'; end if;
 if exists(select 1 from public.user_roles where user_id=v_player and is_blocked is true) then raise exception 'PLAYER_BLOCKED'; end if;
 if exists(select 1 from public.tournament_teams where tournament_id=v_team.tournament_id and captain_user_id=v_player)
 or exists(select 1 from public.tournament_team_players p join public.tournament_teams t on t.id=p.team_id where t.tournament_id=v_team.tournament_id and p.user_id=v_player)
 then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
 if p_role='starter' and (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='starter') >= (select team_size-1 from public.tournaments where id=v_team.tournament_id) then raise exception 'TEAM_FULL'; end if;
 if p_role='substitute' and (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='substitute')>=2 then raise exception 'TEAM_FULL'; end if;
 insert into public.tournament_team_invitations(team_id,user_id,status,reviewed_at,roster_role)
 values(p_team_id,v_player,'pending',null,p_role)
 on conflict(team_id,user_id) do update set status='pending',reviewed_at=null,roster_role=excluded.roster_role;
end; $$;

create or replace function public.iste_respond_team_invitation(p_team_id uuid,p_accept boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype; v_role text;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text,0));
 select * into v_team from public.tournament_teams where id=p_team_id for update;
 if not exists(select 1 from public.tournaments where id=v_team.tournament_id and status='registration') then raise exception 'REGISTRATION_CLOSED'; end if;
 if not exists(select 1 from public.tournament_team_invitations where team_id=p_team_id and user_id=auth.uid() and status='pending')
 then raise exception 'INVITATION_NOT_FOUND'; end if;
 select roster_role into v_role from public.tournament_team_invitations where team_id=p_team_id and user_id=auth.uid();
 if v_role='substitute' and (select team_size from public.tournaments where id=v_team.tournament_id)<>5 then raise exception 'INVALID_ROLE'; end if;
 if p_accept then
   if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked is true) then raise exception 'ACCOUNT_BLOCKED'; end if;
   if v_team.captain_user_id is null then raise exception 'CAPTAIN_REQUIRED'; end if;
   if v_role='starter' and (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='starter') >= (select team_size-1 from public.tournaments where id=v_team.tournament_id) then raise exception 'TEAM_FULL'; end if;
   if v_role='substitute' and (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role='substitute')>=2 then raise exception 'TEAM_FULL'; end if;
   if exists(select 1 from public.tournament_teams where tournament_id=v_team.tournament_id and captain_user_id=auth.uid())
   or exists(select 1 from public.tournament_team_players p join public.tournament_teams t on t.id=p.team_id where t.tournament_id=v_team.tournament_id and p.user_id=auth.uid())
   then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
   insert into public.tournament_team_players(team_id,user_id,roster_role) values(p_team_id,auth.uid(),v_role);
   update public.tournament_teams set is_ready=false where id=p_team_id;
 end if;
 update public.tournament_team_invitations set status=case when p_accept then 'accepted' else 'declined' end,
 reviewed_at=now() where team_id=p_team_id and user_id=auth.uid();
end; $$;
