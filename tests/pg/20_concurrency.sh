#!/usr/bin/env bash
set -euo pipefail
# Isolated CI database only. The fixture uses synthetic users and IDs.
psql -X -v ON_ERROR_STOP=1 <<'SQL'
insert into public.tournaments(id,owner_user_id,slug,title,max_teams,status,published_at)
values ('123e4567-e89b-12d3-a456-426614174050','123e4567-e89b-12d3-a456-426614174000','ci-concurrency-result','CI Concurrency Result',2,'active',now());
insert into public.tournament_teams(id,tournament_id,name) values
('123e4567-e89b-12d3-a456-426614174051','123e4567-e89b-12d3-a456-426614174050','Alpha'),
('123e4567-e89b-12d3-a456-426614174052','123e4567-e89b-12d3-a456-426614174050','Beta');
insert into public.tournament_matches(id,tournament_id,round_number,match_number,team_a_id,team_b_id,status)
values ('123e4567-e89b-12d3-a456-426614174053','123e4567-e89b-12d3-a456-426614174050',1,1,
'123e4567-e89b-12d3-a456-426614174051','123e4567-e89b-12d3-a456-426614174052','scheduled');
SQL

run_result() {
 psql -X -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<'SQL'
begin;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
set local request.jwt.claim.aal = 'aal2';
select public.iste_confirm_tournament_match('123e4567-e89b-12d3-a456-426614174053',13,7);
commit;
SQL
}
run_result & first=$!
run_result & second=$!
ok=0
if wait "$first"; then ok=$((ok+1)); fi
if wait "$second"; then ok=$((ok+1)); fi
if [[ "$ok" != "1" ]]; then echo "Expected precisely one successful concurrent confirmation; got $ok"; exit 1; fi
psql -X -v ON_ERROR_STOP=1 -At <<'SQL' | grep -Fx '1|completed|completed'
select (select count(*) from public.tournament_audit where action='confirm_result' and match_id='123e4567-e89b-12d3-a456-426614174053'),
(select status from public.tournament_matches where id='123e4567-e89b-12d3-a456-426614174053'),
(select status from public.tournaments where id='123e4567-e89b-12d3-a456-426614174050');
SQL
