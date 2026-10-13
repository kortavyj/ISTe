-- Captain roster management and readiness in isolated CS2 beta.
alter table public.tournament_teams add column if not exists is_ready boolean not null default false;

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
   if p_action='ready' and (select count(*) from public.tournament_team_players where team_id=p_team_id)<>4 then raise exception 'ROSTER_INCOMPLETE'; end if;
   update public.tournament_teams set is_ready=(p_action='ready') where id=p_team_id;
 else
   raise exception 'INVALID_ACTION';
 end if;
end $$;
revoke all on function public.iste_manage_team(uuid,text,uuid) from public,anon;
grant execute on function public.iste_manage_team(uuid,text,uuid) to authenticated;
