-- CI-only: never enroll more than four approved players plus captain.
begin;
set local role postgres;
insert into auth.users(id) values
('123e4567-e89b-12d3-a456-426614175001'),
('123e4567-e89b-12d3-a456-426614175002'),
('123e4567-e89b-12d3-a456-426614175003'),
('123e4567-e89b-12d3-a456-426614175004'),
('123e4567-e89b-12d3-a456-426614175005'),
('123e4567-e89b-12d3-a456-426614175006');
insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
values('123e4567-e89b-12d3-a456-426614174000','ci-roster-cap','CI Roster Cap',2,'registration',now());
insert into public.tournament_teams(tournament_id,name,captain_user_id)
select id,'Capped Team','123e4567-e89b-12d3-a456-426614175001'
from public.tournaments where slug='ci-roster-cap';
select set_config('iste.cap.team',(select id::text from public.tournament_teams where name='Capped Team'),true);
set local role authenticated;
do $apply$
declare candidate uuid; captain uuid:='123e4567-e89b-12d3-a456-426614175001';
begin
 for candidate in select unnest(array[
 '123e4567-e89b-12d3-a456-426614175002'::uuid,
 '123e4567-e89b-12d3-a456-426614175003'::uuid,
 '123e4567-e89b-12d3-a456-426614175004'::uuid,
 '123e4567-e89b-12d3-a456-426614175005'::uuid,
 '123e4567-e89b-12d3-a456-426614175006'::uuid
 ]) loop
  perform set_config('request.jwt.claim.sub',candidate::text,true);
  perform public.iste_add_team_player(current_setting('iste.cap.team')::uuid,candidate);
 end loop;
 perform set_config('request.jwt.claim.sub',captain::text,true);
 for candidate in select unnest(array[
 '123e4567-e89b-12d3-a456-426614175002'::uuid,
 '123e4567-e89b-12d3-a456-426614175003'::uuid,
 '123e4567-e89b-12d3-a456-426614175004'::uuid,
 '123e4567-e89b-12d3-a456-426614175005'::uuid
 ]) loop
  perform public.iste_review_team_application(current_setting('iste.cap.team')::uuid,candidate,true);
 end loop;
 if (select count(*) from public.tournament_team_players
  where team_id=current_setting('iste.cap.team')::uuid)<>4
 then raise exception 'ROSTER_COUNT_INCORRECT'; end if;
 begin
  perform public.iste_review_team_application(current_setting('iste.cap.team')::uuid,
   '123e4567-e89b-12d3-a456-426614175006'::uuid,true);
  raise exception 'OVER_CAP_APPLICATION_ACCEPTED';
 exception when others then
  if sqlerrm<>'TEAM_FULL' then raise; end if;
 end;
 perform public.iste_review_team_application(current_setting('iste.cap.team')::uuid,
  '123e4567-e89b-12d3-a456-426614175006'::uuid,false);
 if (select status from public.tournament_team_applications
  where team_id=current_setting('iste.cap.team')::uuid
   and user_id='123e4567-e89b-12d3-a456-426614175006'::uuid)<>'rejected'
 then raise exception 'REJECTION_NOT_SAVED'; end if;
end $apply$;
reset role;
rollback;
