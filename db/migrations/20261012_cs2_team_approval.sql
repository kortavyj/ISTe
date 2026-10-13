-- Application/approval boundary. Only accepted players appear in the match-room roster.
create table if not exists public.tournament_team_applications (
 team_id uuid not null references public.tournament_teams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 primary key(team_id,user_id)
);
alter table public.tournament_team_applications enable row level security;
revoke all on public.tournament_team_applications from public,anon,authenticated;

-- Replace previous direct enrollment RPC: requesting access does not grant room credentials.
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
 if (select count(*) from public.tournament_team_players where team_id=p_team_id)>=4
 then raise exception 'TEAM_FULL'; end if;
 insert into public.tournament_team_applications(team_id,user_id,status,reviewed_at)
 values(p_team_id,auth.uid(),'pending',null)
 on conflict(team_id,user_id) do update set status='pending',reviewed_at=null;
end $$;

create or replace function public.iste_review_team_application(p_team_id uuid,p_user_id uuid,p_accept boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_team public.tournament_teams%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
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
revoke all on function public.iste_review_team_application(uuid,uuid,boolean) from public,anon;
grant execute on function public.iste_review_team_application(uuid,uuid,boolean) to authenticated;

create or replace function public.iste_team_roster(p_team_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.tournament_teams%rowtype;
begin
 select * into t from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 if not exists(select 1 from public.tournaments cup where cup.id=t.tournament_id
   and (cup.published_at is not null or (cup.owner_user_id=auth.uid() and auth.uid() is not null)))
 then raise exception 'FORBIDDEN'; end if;
 return jsonb_build_object('players',coalesce((
  select jsonb_agg(jsonb_build_object('userId',p.user_id,'captain',p.user_id=t.captain_user_id) order by p.is_captain desc,p.user_id)
  from (
   select t.captain_user_id as user_id,true as is_captain where t.captain_user_id is not null
   union all select a.user_id,false from public.tournament_team_players a where a.team_id=t.id
  ) p
 ),'[]'::jsonb),
 'applications', case when auth.uid()=t.captain_user_id then coalesce((
  select jsonb_agg(jsonb_build_object('userId',a.user_id,'status',a.status))
  from public.tournament_team_applications a where a.team_id=t.id and a.status='pending'
 ),'[]'::jsonb) else '[]'::jsonb end);
end $$;
revoke all on function public.iste_team_roster(uuid) from public,anon;
grant execute on function public.iste_team_roster(uuid) to authenticated;
