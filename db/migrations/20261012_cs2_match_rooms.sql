-- Private match room settings. Do not add this table to public fixture selects.
create table if not exists public.tournament_match_rooms (
 match_id uuid primary key references public.tournament_matches(id) on delete cascade,
 server_host text not null check (server_host ~ '^[A-Za-z0-9.-]{1,253}$'),
 server_port integer not null check (server_port between 1 and 65535),
 server_password text not null default '' check (char_length(server_password) <= 128),
 map_name text not null check (map_name in ('de_ancient','de_anubis','de_dust2','de_inferno','de_mirage','de_nuke','de_train','de_vertigo','de_overpass')),
 connect_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.tournament_match_rooms enable row level security;
revoke all on public.tournament_match_rooms from public,anon,authenticated;

create or replace function public.iste_save_match_room(
 p_match_id uuid,p_server_host text,p_server_port integer,
 p_server_password text,p_map_name text,p_connect_at timestamptz
) returns void language plpgsql security definer set search_path='' as $$
declare m public.tournament_matches%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
 select * into m from public.tournament_matches where id=p_match_id for update;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 if m.status <> 'scheduled' then raise exception 'MATCH_NOT_SCHEDULED'; end if;
 if not exists (
  select 1 from public.tournaments t join public.user_roles r on r.user_id=t.owner_user_id
  where t.id=m.tournament_id and t.owner_user_id=auth.uid()
   and r.role='owner' and r.is_blocked is not true
 ) then raise exception 'OWNER_REQUIRED'; end if;
 if p_server_host is null or p_server_host !~ '^[A-Za-z0-9.-]{1,253}$'
   or p_server_port not between 1 and 65535
   or p_server_password is null or char_length(p_server_password)>128
   or p_map_name not in ('de_ancient','de_anubis','de_dust2','de_inferno','de_mirage','de_nuke','de_train','de_vertigo','de_overpass')
 then raise exception 'INVALID_ROOM_SETTINGS'; end if;
 insert into public.tournament_match_rooms(match_id,server_host,server_port,server_password,map_name,connect_at)
 values(p_match_id,p_server_host,p_server_port,p_server_password,p_map_name,p_connect_at)
 on conflict(match_id) do update set server_host=excluded.server_host,
 server_port=excluded.server_port,server_password=excluded.server_password,
 map_name=excluded.map_name,connect_at=excluded.connect_at,updated_at=now();
end $$;
revoke all on function public.iste_save_match_room(uuid,text,integer,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.iste_save_match_room(uuid,text,integer,text,text,timestamptz) to authenticated;

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
   exists(select 1 from public.tournaments t join public.user_roles r
     on r.user_id=auth.uid() where t.id=m.tournament_id and t.owner_user_id=auth.uid()
     and r.role='owner' and r.is_blocked is not true
     and coalesce(auth.jwt()->>'aal','')='aal2')
   or exists(select 1 from public.tournament_teams tt where tt.id in (m.team_a_id,m.team_b_id)
     and tt.tournament_id=m.tournament_id and tt.captain_user_id=auth.uid())
 ) then raise exception 'ROOM_ACCESS_DENIED'; end if;
 select * into room from public.tournament_match_rooms where match_id=p_match_id;
 if not found then return null; end if;
 return jsonb_build_object('host',room.server_host,'port',room.server_port,
  'password',room.server_password,'map',room.map_name,'connectAt',room.connect_at);
end $$;
revoke all on function public.iste_get_match_room(uuid) from public,anon;
grant execute on function public.iste_get_match_room(uuid) to authenticated;
