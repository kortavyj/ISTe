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
  if (select count(*) from public.tournament_team_players where team_id=p_team_id)>=4
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
