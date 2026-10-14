-- Disposable PostgreSQL 17 fixture after setup, foundation and review RPC.
insert into public.iste_tournaments(id,slug,title,capacity,status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','review-test','Team Review Test',2,'registration');
insert into public.iste_tournament_teams(id,tournament_id,name,captain_user_id,status)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ISTe Alpha','22222222-2222-4222-8222-222222222222','pending'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ISTe Beta','22222222-2222-4222-8222-222222222222','pending');
insert into public.iste_tournament_members(team_id,user_id,faceit_player_id,is_captain)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','22222222-2222-4222-8222-222222222222','review-captain',true),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',null,'review-2',false),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',null,'review-3',false),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',null,'review-4',false),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',null,'review-5',false);
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
begin
  begin
    perform public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','pending','approve');
    raise exception 'TEST_FAIL_NON_OWNER_APPROVED';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
  begin
    perform public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','pending','approve');
    raise exception 'TEST_FAIL_NO_MFA_APPROVED';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','pending','approve');
do $$
begin
  begin
    perform public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','pending','approve');
    raise exception 'TEST_FAIL_DUPLICATE_APPROVAL';
  exception when serialization_failure then null;
  end;
  begin
    perform public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002','pending','approve');
    raise exception 'TEST_FAIL_INCOMPLETE_APPROVAL';
  exception when invalid_parameter_value then null;
  end;
end $$;
select public.iste_owner_review_team('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002','pending','reject');
reset role;
do $$
declare n integer;
begin
  select count(*) into n from public.iste_tournament_teams where status='approved';
  if n<>1 then raise exception 'EXPECTED_ONE_APPROVED_TEAM'; end if;
  select count(*) into n from public.iste_tournament_teams where status='rejected';
  if n<>1 then raise exception 'EXPECTED_ONE_REJECTED_TEAM'; end if;
  select count(*) into n from public.iste_tournament_audit_log
   where action in ('team_approved','team_rejected');
  if n<>2 then raise exception 'EXPECTED_TWO_AUDIT_ROWS'; end if;
end $$;
\echo 'PASS: team review authorization, MFA, roster, idempotency and audit'
