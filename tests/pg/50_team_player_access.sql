-- Disposable database only: roster self-enrollment and match-room authorization.
begin;
set local role postgres;
insert into auth.users(id) values
 ('123e4567-e89b-12d3-a456-426614174077'),
 ('123e4567-e89b-12d3-a456-426614174088'),
 ('123e4567-e89b-12d3-a456-426614174099');
insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
values ('123e4567-e89b-12d3-a456-426614174000','ci-roster-room','CI Roster Access',4,'registration',now());
insert into public.tournament_teams(tournament_id,name,captain_user_id)
select id,'Alpha Test','123e4567-e89b-12d3-a456-426614174077'
from public.tournaments where slug='ci-roster-room';
insert into public.tournament_teams(tournament_id,name,captain_user_id)
select id,'Bravo Test','123e4567-e89b-12d3-a456-426614174099'
from public.tournaments where slug='ci-roster-room';
insert into public.tournament_matches(tournament_id,round_number,match_number,team_a_id,team_b_id,status)
select t.id,1,1,a.id,b.id,'scheduled'
from public.tournaments t
join public.tournament_teams a on a.tournament_id=t.id and a.name='Alpha Test'
join public.tournament_teams b on b.tournament_id=t.id and b.name='Bravo Test'
where t.slug='ci-roster-room';
insert into public.tournament_match_rooms(match_id,server_host,server_port,server_password,map_name)
select id,'test.example.invalid',27015,'test-secret','de_mirage'
from public.tournament_matches
where tournament_id=(select id from public.tournaments where slug='ci-roster-room');
select set_config('iste.test.team',
 (select id::text from public.tournament_teams where name='Alpha Test'),true);
select set_config('iste.test.match',
 (select m.id::text from public.tournament_matches m
  join public.tournaments t on t.id=m.tournament_id where t.slug='ci-roster-room'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174088',true);
do $$
begin
 begin
  perform public.iste_add_team_player(current_setting('iste.test.team')::uuid,
   '123e4567-e89b-12d3-a456-426614174099');
  raise exception 'ARBITRARY_PLAYER_ENROLLMENT_ACCEPTED';
 exception when others then
  if sqlerrm <> 'INVALID_PLAYER' then raise; end if;
 end;
 perform public.iste_add_team_player(current_setting('iste.test.team')::uuid,auth.uid());
 begin
  perform public.iste_get_match_room(current_setting('iste.test.match')::uuid);
  raise exception 'PENDING_APPLICANT_GRANTED_ROOM_ACCESS';
 exception when others then
  if sqlerrm <> 'ROOM_ACCESS_DENIED' then raise; end if;
 end;
end $$;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174077',true);
select public.iste_review_team_application(current_setting('iste.test.team')::uuid,'123e4567-e89b-12d3-a456-426614174088',true);
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174088',true);
do $$
begin
 if (select public.iste_get_match_room(current_setting('iste.test.match')::uuid)->>'host')
    <> 'test.example.invalid' then raise exception 'APPROVED_PLAYER_CANNOT_READ_ROOM'; end if;
end $$;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174099',true);
do $$
declare result jsonb;
begin
 select public.iste_get_match_room(current_setting('iste.test.match')::uuid) into result;
 if result->>'port' <> '27015' then raise exception 'OPPONENT_CAPTAIN_CANNOT_READ_MATCH'; end if;
end $$;
reset role;
rollback;
