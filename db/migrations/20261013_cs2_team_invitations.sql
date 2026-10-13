-- Five starters (including captain) plus two substitutes.
alter table public.tournament_team_players add column if not exists roster_role text not null default 'starter' check(roster_role in ('starter','substitute'));
alter table public.tournament_team_invitations add column if not exists roster_role text not null default 'starter' check(roster_role in ('starter','substitute'));

-- Captain-initiated, player-accepted invitations (no automatic roster insertion).
create table if not exists public.tournament_team_invitations (
 team_id uuid not null references public.tournament_teams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 primary key(team_id,user_id)
);
alter table public.tournament_team_invitations enable row level security;
revoke all on public.tournament_team_invitations from public,anon,authenticated;

create or replace function public.iste_invite_team_player(p_team_id uuid,p_username text,p_role text default 'starter')
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype; v_player uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_role not in ('starter','substitute') then raise exception 'INVALID_ROLE'; end if;
 select * into v_team from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_team.tournament_id::text,0));
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
 if (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role=p_role)>=case when p_role='starter' then 4 else 2 end then raise exception 'TEAM_FULL'; end if;
 insert into public.tournament_team_invitations(team_id,user_id,status,reviewed_at,roster_role)
 values(p_team_id,v_player,'pending',null,p_role)
 on conflict(team_id,user_id) do update set status='pending',reviewed_at=null,roster_role=excluded.roster_role;
end $$;

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
 if p_accept then
   if exists(select 1 from public.user_roles where user_id=auth.uid() and is_blocked is true) then raise exception 'ACCOUNT_BLOCKED'; end if;
   if v_team.captain_user_id is null then raise exception 'CAPTAIN_REQUIRED'; end if;
   if (select count(*) from public.tournament_team_players where team_id=p_team_id and roster_role=v_role)>=case when v_role='starter' then 4 else 2 end then raise exception 'TEAM_FULL'; end if;
   if exists(select 1 from public.tournament_teams where tournament_id=v_team.tournament_id and captain_user_id=auth.uid())
   or exists(select 1 from public.tournament_team_players p join public.tournament_teams t on t.id=p.team_id where t.tournament_id=v_team.tournament_id and p.user_id=auth.uid())
   then raise exception 'PLAYER_ALREADY_IN_TOURNAMENT'; end if;
   insert into public.tournament_team_players(team_id,user_id,roster_role) values(p_team_id,auth.uid(),v_role);
   update public.tournament_teams set is_ready=false where id=p_team_id;
 end if;
 update public.tournament_team_invitations set status=case when p_accept then 'accepted' else 'declined' end,
 reviewed_at=now() where team_id=p_team_id and user_id=auth.uid();
end $$;
revoke all on function public.iste_invite_team_player(uuid,text,text) from public,anon;
revoke all on function public.iste_respond_team_invitation(uuid,boolean) from public,anon;
grant execute on function public.iste_invite_team_player(uuid,text) to authenticated;
grant execute on function public.iste_respond_team_invitation(uuid,boolean) to authenticated;

-- The roster RPC already validates tournament visibility. Extend only the response,
-- preserving captain-only applications and self-only application status.
