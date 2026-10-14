-- Disposable PostgreSQL 17, after auth stub + foundation + bracket RPC.
insert into public.iste_tournaments(id,slug,title,capacity,status,best_of)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bracket-test','Bracket Test',4,'checkin',3);
insert into public.iste_tournament_teams(id,tournament_id,name,status)
values
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team 1','approved'),
('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team 2','approved'),
('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team 3','approved'),
('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team 4','approved');
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
begin
 begin
  perform public.iste_owner_generate_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'TEST_NON_OWNER_PASSED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
 begin
  perform public.iste_owner_generate_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'TEST_MFA_BYPASSED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select public.iste_owner_generate_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
do $$
begin
 begin
  perform public.iste_owner_generate_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'TEST_DUPLICATE_BRACKET';
 exception when unique_violation then null;
 end;
end $$;
reset role;
do $$
declare v integer; a uuid; b uuid;
begin
 select count(*) into v from public.iste_tournament_matches where tournament_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 if v<>3 then raise exception 'EXPECTED_THREE_MATCHES_GOT_%',v; end if;
 select team_a_id,team_b_id into a,b from public.iste_tournament_matches
 where tournament_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and round_index=0 and match_index=0;
 if a<>'11111111-1111-4111-8111-111111111111' or b<>'44444444-4444-4444-8444-444444444444'
 then raise exception 'BAD_SEED_PAIRING'; end if;
 select count(*) into v from public.iste_tournament_matches where round_index=1 and team_a_id is null and team_b_id is null;
 if v<>1 then raise exception 'FINAL_MUST_BE_EMPTY'; end if;
 select count(*) into v from public.iste_tournament_audit_log where action='bracket_generated';
 if v<>1 then raise exception 'BRACKET_AUDIT_MISSING'; end if;
end $$;
\echo 'PASS: full 4-team bracket with owner/MFA/duplicate restrictions'
