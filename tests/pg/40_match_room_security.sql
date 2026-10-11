-- Isolated CI: credentials are never disclosed to anonymous users or ahead of connect_at.
begin;
set local role postgres;
insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
values('123e4567-e89b-12d3-a456-426614174000','ci-private-room','CI Room',2,'active',now());
insert into public.tournament_matches(tournament_id,round_number,match_number,status)
select id,1,1,'scheduled' from public.tournaments where slug='ci-private-room';
insert into public.tournament_match_rooms(match_id,server_host,server_port,server_password,map_name,connect_at)
select m.id,'test.example.invalid',27015,'ci-private-pass','de_mirage',now()+interval '1 hour'
from public.tournament_matches m join public.tournaments t on t.id=m.tournament_id
where t.slug='ci-private-room';
select set_config('iste.room.match',(select m.id::text from public.tournament_matches m join public.tournaments t on t.id=m.tournament_id where t.slug='ci-private-room'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
select set_config('request.jwt.claim.aal','aal2',true);
do $$
declare result jsonb;
begin
 select public.iste_get_match_room(current_setting('iste.room.match')::uuid) into result;
 if result->>'available' is distinct from 'false' or result ? 'password' or result ? 'host'
 then raise exception 'FUTURE_ROOM_CREDENTIALS_EXPOSED'; end if;
end $$;
reset role;
update public.tournament_match_rooms set connect_at=now()-interval '1 minute'
where match_id=current_setting('iste.room.match')::uuid;
set local role authenticated;
do $$
declare result jsonb;
begin
 select public.iste_get_match_room(current_setting('iste.room.match')::uuid) into result;
 if result->>'host' <> 'test.example.invalid' or result->>'password' <> 'ci-private-pass'
 then raise exception 'AUTHORIZED_ROOM_READ_FAILED'; end if;
end $$;
reset role;
rollback;
