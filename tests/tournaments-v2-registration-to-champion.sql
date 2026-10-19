-- Mirror four real Auth captains in this disposable test database.
CREATE TABLE IF NOT EXISTS auth.users(id uuid primary key);
INSERT INTO auth.users(id)
SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
FROM generate_series(1,4) n ON CONFLICT DO NOTHING;
-- Disposable PostgreSQL 17 E2E. Status changes here are privileged test setup:
-- no tournament-status transition RPC exists yet.
insert into public.iste_tournaments(id,slug,title,capacity,status,best_of)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','e2e-tournament','E2E CS2 Tournament',4,'registration',1);

set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);

-- Four authenticated captains submit independent five-player rosters.
do $$
declare i int; captain uuid; roster jsonb; j int; team_name text; r jsonb;
begin
 for i in 1..4 loop
   captain := ('00000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid;
   perform set_config('request.jwt.claim.sub',captain::text,false);
   roster := jsonb_build_array(jsonb_build_object('userId',captain,'faceitPlayerId','e2e-captain-'||i));
   for j in 1..4 loop
     roster := roster || jsonb_build_array(jsonb_build_object('faceitPlayerId','e2e-'||i||'-player-'||j));
   end loop;
   team_name := 'Team '||i;
   r := public.iste_apply_tournament_team(jsonb_build_object(
     'tournamentId','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
     'name',team_name,'members',roster));
   if r->>'status'<>'pending' then raise exception 'APPLICATION_FAILED: %',r; end if;
 end loop;
end $$;

-- Review as MFA-verified owner, through the same RPC as the API uses.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
declare applications jsonb; item jsonb; response jsonb;
begin
 applications := public.iste_owner_list_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if jsonb_array_length(applications)<>4 then raise exception 'EXPECTED_FOUR_APPLICATIONS'; end if;
 for item in select value from jsonb_array_elements(applications) loop
   if jsonb_array_length(item->'members')<>5 then raise exception 'BAD_ROSTER'; end if;
   response := public.iste_owner_review_team((item->>'id')::uuid,'pending','approve');
   if response->>'status'<>'approved' then raise exception 'APPROVAL_FAILED: %',response; end if;
 end loop;
end $$;
reset role;

-- Privileged fixture-only transition: production must use a vetted RPC.
update public.iste_tournaments set status='checkin' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$
declare r jsonb;
begin
 r := public.iste_owner_generate_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if (r->>'matches')::integer<>3 then raise exception 'EXPECTED_3_MATCHES: %',r; end if;
end $$;
reset role;
update public.iste_tournaments set status='live' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set role authenticated;

-- Resolve actual match IDs and optimistic versions through owner read RPC.
do $$
declare match_data jsonb; item jsonb; winner jsonb; i int; final_data jsonb;
begin
 match_data := public.iste_owner_get_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if jsonb_array_length(match_data)<>3 then raise exception 'INVALID_BRACKET'; end if;
 for i in 0..1 loop
   select value into item from jsonb_array_elements(match_data)
     where (value->>'roundIndex')::int=0 and (value->>'matchIndex')::int=i;
   if item is null or item->>'status'<>'ready' then raise exception 'SEMIFINAL_NOT_READY_%',i; end if;
   winner := public.iste_owner_confirm_match((item->>'id')::uuid,
     (item->>'version')::integer,jsonb_build_object('bestOf',1,
     'maps',jsonb_build_array(jsonb_build_object('name','Mirage','scoreA',13,'scoreB',8))));
   if winner->>'winnerTeamId' is null then raise exception 'SEMIFINAL_WINNER_MISSING'; end if;
 end loop;
 match_data := public.iste_owner_get_bracket('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 select value into final_data from jsonb_array_elements(match_data) where (value->>'roundIndex')::int=1;
 if final_data->>'status'<>'ready' or final_data->>'teamAId' is null or final_data->>'teamBId' is null
 then raise exception 'FINAL_NOT_READY: %', final_data; end if;
 winner := public.iste_owner_confirm_match((final_data->>'id')::uuid,
    (final_data->>'version')::integer,
    '{"bestOf":1,"maps":[{"name":"Inferno","scoreA":13,"scoreB":7}]}'::jsonb);
 if winner->>'winnerTeamId' is distinct from final_data->>'teamAId' then
   raise exception 'WRONG_CHAMPION: %',winner; end if;
end $$;
reset role;
do $$
declare n int;
begin
 select count(*) into n from public.iste_tournament_teams
   where tournament_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='approved';
 if n<>4 then raise exception 'EXPECTED_4_APPROVED_TEAMS: %',n; end if;
 select count(*) into n from public.iste_tournament_members;
 if n<>20 then raise exception 'EXPECTED_20_MEMBERS: %',n; end if;
 select count(*) into n from public.iste_tournament_matches
   where tournament_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='finished';
 if n<>3 then raise exception 'EXPECTED_3_FINISHED_MATCHES: %',n; end if;
 select count(*) into n from public.iste_tournament_maps;
 if n<>3 then raise exception 'EXPECTED_3_MAPS: %',n; end if;
 select count(*) into n from public.iste_tournament_audit_log;
 if n<>12 then raise exception 'EXPECTED_12_AUDIT_RECORDS: %',n; end if;
end $$;
\echo 'PASS: 4 captains registered, owner approved, bracket seeded, semifinals and final confirmed'
