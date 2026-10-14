-- Disposable PostgreSQL 17 only: owner MFA and status transitions.
insert into public.iste_tournaments(id,slug,title,capacity,status,best_of)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','status-test','Status Test',2,'draft',1);
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','draft','registration');
  raise exception 'NON_OWNER_ALLOWED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','draft','registration');
  raise exception 'MFA_BYPASSED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','draft','registration');
do $$
begin
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','draft','registration');
  raise exception 'STALE_TRANSITION_ALLOWED';
 exception when serialization_failure then null;
 end;
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','registration','checkin');
  raise exception 'EMPTY_ROSTER_ALLOWED';
 exception when invalid_parameter_value then null;
 end;
end $$;
reset role;
insert into public.iste_tournament_teams(id,tournament_id,name,status)
values
('00000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team A','approved'),
('00000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Team B','approved');
set role authenticated;
select public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','registration','checkin');
do $$
begin
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','checkin','live');
  raise exception 'BRACKETLESS_LIVE_ALLOWED';
 exception when invalid_parameter_value then null;
 end;
end $$;
reset role;
insert into public.iste_tournament_matches(id,tournament_id,round_index,match_index,team_a_id,team_b_id,best_of,status)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,0,
 '00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',1,'ready');
set role authenticated;
select public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','checkin','live');
do $$
begin
 begin
  perform public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','live','finished');
  raise exception 'UNPLAYED_FINISH_ALLOWED';
 exception when invalid_parameter_value then null;
 end;
end $$;
select public.iste_owner_confirm_match('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,
 '{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":8}]}'::jsonb);
select public.iste_owner_transition_tournament('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','live','finished');
reset role;
do $$
declare v integer;
begin
 if (select status from public.iste_tournaments where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 'finished'
 then raise exception 'TOURNAMENT_NOT_FINISHED'; end if;
 select count(*) into v from public.iste_tournament_audit_log where action='status_transition';
 if v<>4 then raise exception 'EXPECTED_FOUR_TRANSITION_AUDITS_%',v; end if;
end $$;
\echo 'PASS: owner/MFA and audited registration→checkin→live→finished'
