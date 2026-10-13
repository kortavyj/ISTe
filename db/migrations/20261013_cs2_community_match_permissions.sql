-- Community organizer permissions for match rooms and CS2 server assignments.
create or replace function public.iste_save_match_room(
 p_match_id uuid,p_server_host text,p_server_port integer,
 p_server_password text,p_map_name text,p_connect_at timestamptz
) returns void language plpgsql security definer set search_path='' as $$
declare m public.tournament_matches%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into m from public.tournament_matches where id=p_match_id for update;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 if m.status <> 'scheduled' then raise exception 'MATCH_NOT_SCHEDULED'; end if;
 if not exists (
  select 1 from public.tournaments t
  where t.id=m.tournament_id and t.owner_user_id=auth.uid()
   and not exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 ) then raise exception 'OWNER_REQUIRED'; end if;
 if p_server_host is null or p_server_host !~ '^[A-Za-z0-9.-]{1,253}$'
   or p_server_port not between 1 and 65535
   or p_server_password is null or char_length(p_server_password)>512
   or (p_server_password <> '' and p_server_password not like 'enc1:%')
   or p_map_name not in ('de_ancient','de_anubis','de_dust2','de_inferno','de_mirage','de_nuke','de_train','de_vertigo','de_overpass')
 then raise exception 'INVALID_ROOM_SETTINGS'; end if;
 insert into public.tournament_match_rooms(match_id,server_host,server_port,server_password,map_name,connect_at)
 values(p_match_id,p_server_host,p_server_port,p_server_password,p_map_name,p_connect_at)
 on conflict(match_id) do update set server_host=excluded.server_host,
 server_port=excluded.server_port,server_password=excluded.server_password,
 map_name=excluded.map_name,connect_at=excluded.connect_at,updated_at=now();
end $$;

create or replace function public.iste_assign_cs2_server(p_match_id uuid,p_server_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
 m public.tournament_matches%rowtype;
 t public.tournaments%rowtype;
 previous_id uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_match_id is null or p_server_id is null then raise exception 'INVALID_ASSIGNMENT'; end if;
 select * into m from public.tournament_matches where id=p_match_id for update;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 select * into t from public.tournaments where id=m.tournament_id;
 if t.owner_user_id <> auth.uid() or exists (
  select 1 from public.user_roles u where u.user_id=auth.uid()
  and u.is_blocked is true
 ) then raise exception 'OWNER_REQUIRED'; end if;
 if t.status <> 'active' or m.status <> 'scheduled' then raise exception 'MATCH_NOT_SCHEDULED'; end if;
 if exists(select 1 from public.tournament_cs2_events e where e.match_id=p_match_id) then
  raise exception 'MATCH_ALREADY_STARTED';
 end if;
 select server_id into previous_id from public.tournament_cs2_assignments where match_id=p_match_id;
 if previous_id is not distinct from p_server_id then return; end if;
 insert into public.tournament_cs2_assignments(match_id,server_id)
 values(p_match_id,p_server_id)
 on conflict(match_id) do update set server_id=excluded.server_id, assigned_at=now();
 insert into public.tournament_cs2_assignment_audit(match_id,actor_user_id,previous_server_id,assigned_server_id)
 values(p_match_id,auth.uid(),previous_id,p_server_id);
end $$;

create or replace function public.iste_list_cs2_assignments(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists (
  select 1 from public.tournaments t
  where t.id=p_tournament_id and t.owner_user_id=auth.uid()
  and not exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 ) then raise exception 'OWNER_REQUIRED'; end if;
 select jsonb_build_object(
  'assignments',coalesce((select jsonb_agg(jsonb_build_object(
   'matchId',a.match_id,'serverId',a.server_id,'assignedAt',a.assigned_at))
   from public.tournament_cs2_assignments a
   join public.tournament_matches m on m.id=a.match_id
   where m.tournament_id=p_tournament_id),'[]'::jsonb),
  'history',coalesce((select jsonb_agg(jsonb_build_object(
   'matchId',h.match_id,'previousServerId',h.previous_server_id,
   'serverId',h.assigned_server_id,'changedAt',h.created_at)
   order by h.created_at desc,h.id desc)
   from public.tournament_cs2_assignment_audit h
   join public.tournament_matches m on m.id=h.match_id
   where m.tournament_id=p_tournament_id),'[]'::jsonb)
 ) into result;
 return result;
end $$;

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
  exists(select 1 from public.tournaments t
   where t.id=m.tournament_id and t.owner_user_id=auth.uid())
  or exists(select 1 from public.tournament_teams tt where tt.id in (m.team_a_id,m.team_b_id)
   and tt.tournament_id=m.tournament_id and tt.captain_user_id=auth.uid())
  or exists(select 1 from public.tournament_team_players p join public.tournament_teams tt on tt.id=p.team_id
   where p.user_id=auth.uid() and tt.id in (m.team_a_id,m.team_b_id)
   and tt.tournament_id=m.tournament_id)
 ) then raise exception 'ROOM_ACCESS_DENIED'; end if;
 if m.status in ('completed','bye') or exists (
  select 1 from public.tournaments t where t.id=m.tournament_id and t.status in ('completed','cancelled')
 ) then
  return jsonb_build_object('available',false,'reason','MATCH_CLOSED');
 end if;
 select * into room from public.tournament_match_rooms where match_id=p_match_id;
 if not found then return null; end if;
 if room.connect_at is not null and room.connect_at > now()
 then return jsonb_build_object('available',false,'connectAt',room.connect_at); end if;
 return jsonb_build_object('host',room.server_host,'port',room.server_port,
  'password',room.server_password,'map',room.map_name,'connectAt',room.connect_at);
end $$;
