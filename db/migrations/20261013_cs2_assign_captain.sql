-- Assign an existing account as captain of an organizer-created team.
create or replace function public.iste_assign_team_captain(p_team_id uuid,p_username text)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype; v_owner uuid; v_candidate uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text,0));
 select owner_user_id into v_owner from public.tournaments
 where id=v_team.tournament_id and status in ('draft','registration');
 if not found then raise exception 'REGISTRATION_CLOSED'; end if;
 if v_owner is distinct from auth.uid() then raise exception 'OWNER_REQUIRED'; end if;
 if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 select id into v_candidate from public.profiles
 where lower(username)=lower(trim(p_username)) limit 1;
 if v_candidate is null then raise exception 'USER_NOT_FOUND'; end if;
 if exists(select 1 from public.user_roles where user_id=v_candidate and is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 if exists(select 1 from public.tournament_teams where tournament_id=v_team.tournament_id
   and captain_user_id=v_candidate and id<>p_team_id)
 or exists(select 1 from public.tournament_team_players p
   join public.tournament_teams t on t.id=p.team_id
   where t.tournament_id=v_team.tournament_id and p.user_id=v_candidate and t.id<>p_team_id)
 then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
 if v_team.captain_user_id is not null and v_team.captain_user_id<>v_candidate
 then raise exception 'CAPTAIN_ALREADY_ASSIGNED'; end if;
 delete from public.tournament_team_players where team_id=p_team_id and user_id=v_candidate;
 update public.tournament_teams set captain_user_id=v_candidate,is_ready=false where id=p_team_id;
end $$;
revoke all on function public.iste_assign_team_captain(uuid,text) from public,anon;
grant execute on function public.iste_assign_team_captain(uuid,text) to authenticated;
