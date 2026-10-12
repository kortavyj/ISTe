-- Registered tournament participants; players enroll themselves in a captain-led team.
create table if not exists public.tournament_team_players (
 team_id uuid not null references public.tournament_teams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(team_id,user_id)
);
create index if not exists tournament_team_players_user_idx on public.tournament_team_players(user_id);
alter table public.tournament_team_players enable row level security;
revoke all on public.tournament_team_players from anon,authenticated;
grant select on public.tournament_team_players to authenticated;

-- Enrollment requires the player's own identity and an open tournament.
create or replace function public.iste_add_team_player(p_team_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare team public.tournament_teams%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_team_id is null or p_user_id is null or p_user_id<>auth.uid() then raise exception 'INVALID_PLAYER'; end if;
 if exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 select * into team from public.tournament_teams where id=p_team_id for update;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 if team.captain_user_id is null then raise exception 'CAPTAIN_REQUIRED'; end if;
 if team.captain_user_id=p_user_id then raise exception 'ALREADY_CAPTAIN'; end if;
 if not exists(select 1 from public.tournaments t where t.id=team.tournament_id and t.status='registration')
 then raise exception 'REGISTRATION_CLOSED'; end if;
 if not exists(select 1 from auth.users u where u.id=p_user_id) then raise exception 'PLAYER_NOT_FOUND'; end if;
 if exists(select 1 from public.user_roles r where r.user_id=p_user_id and r.is_blocked is true)
 then raise exception 'PLAYER_BLOCKED'; end if;
 if exists(select 1 from public.tournament_teams other_team
   left join public.tournament_team_players p on p.team_id=other_team.id
   where other_team.tournament_id=team.tournament_id
   and (other_team.captain_user_id=p_user_id or p.user_id=p_user_id)
   and other_team.id<>p_team_id)
 then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
 if (select count(*) from public.tournament_team_players where team_id=p_team_id)>=4
 then raise exception 'TEAM_FULL'; end if;
 insert into public.tournament_team_players(team_id,user_id) values(p_team_id,p_user_id)
 on conflict do nothing;
end $$;
revoke all on function public.iste_add_team_player(uuid,uuid) from public,anon;
grant execute on function public.iste_add_team_player(uuid,uuid) to authenticated;

drop policy if exists "Members see own team players" on public.tournament_team_players;
create policy "Members see own team players" on public.tournament_team_players
for select to authenticated using (
 user_id=auth.uid() or exists (
  select 1 from public.tournament_teams t where t.id=team_id and t.captain_user_id=auth.uid()
 )
);
-- Include registered players in match-room access; no public credentials.
create or replace function public.iste_get_match_room(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.tournament_matches%rowtype;
declare room public.tournament_match_rooms%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 select * into m from public.tournament_matches where id=p_match_id;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 if not (
  exists(select 1 from public.tournaments t join public.user_roles r on r.user_id=auth.uid()
   where t.id=m.tournament_id and t.owner_user_id=auth.uid() and r.role='owner'
   and r.is_blocked is not true and coalesce(auth.jwt()->>'aal','')='aal2')
  or exists(select 1 from public.tournament_teams tt where tt.id in (m.team_a_id,m.team_b_id)
   and tt.tournament_id=m.tournament_id and tt.captain_user_id=auth.uid())
  or exists(select 1 from public.tournament_team_players p join public.tournament_teams tt on tt.id=p.team_id
   where p.user_id=auth.uid() and tt.id in (m.team_a_id,m.team_b_id)
   and tt.tournament_id=m.tournament_id)
 ) then raise exception 'ROOM_ACCESS_DENIED'; end if;
 if m.status in ('completed','cancelled') then
  return jsonb_build_object('available',false,'reason','MATCH_CLOSED');
 end if;
 select * into room from public.tournament_match_rooms where match_id=p_match_id;
 if not found then return null; end if;
 if room.connect_at is not null and room.connect_at > now()
 then return jsonb_build_object('available',false,'connectAt',room.connect_at); end if;
 return jsonb_build_object('host',room.server_host,'port',room.server_port,
  'password',room.server_password,'map',room.map_name,'connectAt',room.connect_at);
end $$;
revoke all on function public.iste_get_match_room(uuid) from public,anon;
grant execute on function public.iste_get_match_room(uuid) to authenticated;
