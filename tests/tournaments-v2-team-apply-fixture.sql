-- Isolated PostgreSQL 17 fixture, not a production migration.
insert into public.iste_tournaments(id,slug,title,capacity,status) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','apply-test','Application Test',2,'registration');
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select public.iste_apply_tournament_team(
'{"tournamentId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","name":"ISTe Academy","members":[
{"userId":"22222222-2222-4222-8222-222222222222","faceitPlayerId":"captainOne"},
{"faceitPlayerId":"memberTwo"},{"faceitPlayerId":"memberThree"},
{"faceitPlayerId":"memberFour"},{"faceitPlayerId":"memberFive"}]}'::jsonb);
do $$
begin
 begin
  perform public.iste_apply_tournament_team(
 '{"tournamentId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","name":"Second Club","members":[
 {"userId":"22222222-2222-4222-8222-222222222222","faceitPlayerId":"captainAgain"},
 {"faceitPlayerId":"memberSix"},{"faceitPlayerId":"memberSeven"},
 {"faceitPlayerId":"memberEight"},{"faceitPlayerId":"memberNine"}]}'::jsonb);
  raise exception 'DUPLICATE_CAPTAIN_ACCEPTED';
 exception when unique_violation then null;
 end;
end $$;
reset role;
do $$
begin
 if (select count(*) from public.iste_tournament_teams) <> 1 then
   raise exception 'EXPECTED_ONE_TEAM'; end if;
 if (select count(*) from public.iste_tournament_members) <> 5 then
   raise exception 'EXPECTED_FIVE_MEMBERS'; end if;
 if (select count(*) from public.iste_tournament_members where is_captain) <> 1 then
   raise exception 'EXPECTED_ONE_CAPTAIN'; end if;
 if (select count(*) from public.iste_tournament_audit_log where action='team_application') <> 1 then
   raise exception 'EXPECTED_AUDIT_RECORD'; end if;
end $$;
\echo 'PASS: application roster, duplicate prevention, audit'
