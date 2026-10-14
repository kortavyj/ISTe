-- Disposable PostgreSQL 17 only; run after auth fixture, foundation and match RPC.
insert into public.iste_tournaments(id,slug,title,capacity,status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','confirm-test','Confirmation Test',4,'live');
insert into public.iste_tournament_teams(id,tournament_id,name) values
('00000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team One'),
('00000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team Two');
insert into public.iste_tournament_matches(id,tournament_id,round_index,match_index,team_a_id,team_b_id,status,best_of)
values ('11111111-1111-4111-8111-111111111110','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,0,
'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','ready',3);
insert into public.iste_tournament_matches(id,tournament_id,round_index,match_index,status,best_of)
values ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,0,'scheduled',3);

set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  begin
    perform public.iste_owner_confirm_match(
      '11111111-1111-4111-8111-111111111110',0,
      '{"bestOf":3,"maps":[{"name":"Mirage","scoreA":13,"scoreB":8},{"name":"Inferno","scoreA":13,"scoreB":9}]}'::jsonb);
    raise exception 'TEST_FAIL_USER_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
  begin
    perform public.iste_owner_confirm_match('11111111-1111-4111-8111-111111111110',0,'{}'::jsonb);
    raise exception 'TEST_FAIL_AAL1_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select public.iste_owner_confirm_match(
'11111111-1111-4111-8111-111111111110',0,
'{"bestOf":3,"maps":[{"name":"Mirage","scoreA":13,"scoreB":8},{"name":"Inferno","scoreA":13,"scoreB":9}]}'::jsonb);
do $$
begin
  begin
    perform public.iste_owner_confirm_match(
      '11111111-1111-4111-8111-111111111110',0,
      '{"bestOf":3,"maps":[{"name":"Mirage","scoreA":13,"scoreB":8},{"name":"Inferno","scoreA":13,"scoreB":9}]}'::jsonb);
    raise exception 'TEST_FAIL_DUPLICATE_ALLOWED';
  exception when serialization_failure then null;
  end;
end $$;
reset role;

do $$
declare n integer;
begin
  select count(*) into n from public.iste_tournament_maps;
  if n <> 2 then raise exception 'Expected 2 map rows, got %', n; end if;
  select count(*) into n from public.iste_tournament_audit_log where action='confirm_result';
  if n <> 1 then raise exception 'Expected 1 audit row, got %', n; end if;
  select count(*) into n from public.iste_tournament_matches
    where round_index=0 and match_index=0 and score_a=2 and score_b=0 and status='finished' and version=1;
  if n <> 1 then raise exception 'Expected confirmed BO3 result'; end if;
  select count(*) into n from public.iste_tournament_matches
    where round_index=1 and match_index=0
    and team_a_id='00000000-0000-4000-8000-000000000001' and version=1;
  if n <> 1 then raise exception 'Winner not advanced'; end if;
end $$;
\echo 'PASS: owner MFA, manual result confirmation, bracket advance and audit'
