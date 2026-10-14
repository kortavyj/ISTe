-- Integration regression: a full BO1 tournament can finish after two semifinals.
-- Disposable PostgreSQL only. Never run against production.
insert into public.iste_tournaments(id,slug,title,capacity,status,best_of)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','final-ready-test','Final Ready Test',4,'live',1);
insert into public.iste_tournament_teams(id,tournament_id,name,status)
values
('00000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team One','approved'),
('00000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team Two','approved'),
('00000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team Three','approved'),
('00000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team Four','approved');
insert into public.iste_tournament_matches(id,tournament_id,round_index,match_index,team_a_id,team_b_id,best_of,status)
values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,0,
'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004',1,'ready'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,1,
'00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003',1,'ready'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,0,
null,null,1,'scheduled');
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select public.iste_owner_confirm_match(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',0,
 '{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":9}]}'::jsonb);
reset role;
do $$
begin
 if (select status from public.iste_tournament_matches where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3')<>'scheduled'
 then raise exception 'FINAL_PREMATURELY_READY'; end if;
end $$;
set role authenticated;
select public.iste_owner_confirm_match(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',0,
 '{"bestOf":1,"maps":[{"name":"Nuke","scoreA":13,"scoreB":11}]}'::jsonb);
reset role;
do $$
declare m public.iste_tournament_matches%rowtype;
begin
 select * into m from public.iste_tournament_matches where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
 if m.status<>'ready' or m.version<>2 or
  m.team_a_id<>'00000000-0000-4000-8000-000000000001' or
  m.team_b_id<>'00000000-0000-4000-8000-000000000002'
 then raise exception 'FINAL_NOT_READY: % % % %',m.status,m.version,m.team_a_id,m.team_b_id; end if;
end $$;
set role authenticated;
select public.iste_owner_confirm_match(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',2,
 '{"bestOf":1,"maps":[{"name":"Inferno","scoreA":13,"scoreB":7}]}'::jsonb);
reset role;
do $$
declare n integer;
begin
 select count(*) into n from public.iste_tournament_matches
 where tournament_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='finished';
 if n<>3 then raise exception 'EXPECTED_ALL_THREE_MATCHES_FINISHED_GOT_%',n; end if;
 select count(*) into n from public.iste_tournament_maps;
 if n<>3 then raise exception 'EXPECTED_THREE_MAPS_GOT_%',n; end if;
 select count(*) into n from public.iste_tournament_audit_log where action='confirm_result';
 if n<>3 then raise exception 'EXPECTED_THREE_AUDITS_GOT_%',n; end if;
end $$;
\echo 'PASS: semifinal winners advance, final becomes ready, champion is confirmed'
