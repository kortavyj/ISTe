-- Disposable PostgreSQL 17 fixture only.
insert into public.iste_tournaments(id,slug,title,capacity,status) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','read-test','Applications Read Test',4,'registration');
insert into public.iste_tournament_teams(id,tournament_id,name,captain_user_id,status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ISTe Alpha','22222222-2222-4222-8222-222222222222','pending');
insert into public.iste_tournament_members(team_id,user_id,faceit_player_id,is_captain)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001','22222222-2222-4222-8222-222222222222','alpha-captain',true);
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
begin
 begin
  perform public.iste_owner_list_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'NON_OWNER_WAS_ALLOWED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
 begin
  perform public.iste_owner_list_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'MFA_BYPASSED';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
declare payload jsonb;
begin
 select public.iste_owner_list_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') into payload;
 if jsonb_array_length(payload)<>1 or payload->0->>'name'<>'ISTe Alpha'
 or jsonb_array_length(payload->0->'members')<>1
 or payload->0->'members'->0->>'faceitPlayerId'<>'alpha-captain' then
  raise exception 'INCORRECT_TEAM_READ: %',payload;
 end if;
 select public.iste_owner_list_teams('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') into payload;
 raise exception 'NONEXISTENT_TOURNAMENT_ALLOWED';
exception when invalid_parameter_value then null;
end $$;
reset role;
\echo 'PASS: owner-only application roster read'
