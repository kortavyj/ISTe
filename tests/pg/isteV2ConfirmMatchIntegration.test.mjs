import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const migration = readFileSync(
  new URL("../../db/migrations/20261015_iste_v2_validate_map_scores.sql", import.meta.url),
  "utf8",
);
const owner = "11111111-1111-4111-8111-111111111111";
const tournament = "22222222-2222-4222-8222-222222222222";
const firstTeam = "33333333-3333-4333-8333-333333333333";
const secondTeam = "44444444-4444-4444-8444-444444444444";
const match = "55555555-5555-4555-8555-555555555555";

const setup = `
BEGIN;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
AS 'SELECT ''${owner}''::uuid';
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE
AS 'SELECT ''authenticated''::text';
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
AS 'SELECT ''{"aal":"aal2"}''::jsonb';
CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY, role text, is_blocked boolean NOT NULL DEFAULT false
);
CREATE TABLE public.iste_tournaments (
  id uuid PRIMARY KEY, capacity integer NOT NULL, status text NOT NULL
);
CREATE TABLE public.iste_tournament_teams (
  id uuid PRIMARY KEY, tournament_id uuid NOT NULL
);
CREATE TABLE public.iste_tournament_matches (
  id uuid PRIMARY KEY, tournament_id uuid NOT NULL,
  round_index integer NOT NULL, match_index integer NOT NULL,
  team_a_id uuid, team_b_id uuid, best_of integer NOT NULL,
  version integer NOT NULL DEFAULT 0, status text NOT NULL,
  winner_team_id uuid, score_a integer, score_b integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.iste_tournament_maps (
  match_id uuid, map_index integer, map_name text,
  score_a integer, score_b integer
);
CREATE TABLE public.iste_tournament_audit_log (
  tournament_id uuid, actor_id uuid, entity_type text, entity_id uuid,
  action text, previous_data jsonb, new_data jsonb
);
`;

const seed = `
INSERT INTO public.user_roles (user_id,role,is_blocked) VALUES ('${owner}','owner',false);
INSERT INTO public.iste_tournaments (id,capacity,status) VALUES ('${tournament}',2,'live');
INSERT INTO public.iste_tournament_teams (id,tournament_id) VALUES
('${firstTeam}','${tournament}'),('${secondTeam}','${tournament}');
INSERT INTO public.iste_tournament_matches
(id,tournament_id,round_index,match_index,team_a_id,team_b_id,best_of,status)
VALUES ('${match}','${tournament}',0,0,'${firstTeam}','${secondTeam}',1,'ready');
`;

const assertions = `
DO $test$
DECLARE v_result jsonb;
BEGIN
  BEGIN
    PERFORM public.iste_owner_confirm_match(
      '${match}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Mirage","scoreA":1,"scoreB":0}]}'::jsonb
    );
    RAISE EXCEPTION 'unfinished map was accepted';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM <> 'INVALID_CS2_MAP_SCORE' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.iste_tournament_maps) THEN
    RAISE EXCEPTION 'invalid result persisted map rows';
  END IF;
  IF EXISTS(SELECT 1 FROM public.iste_tournament_matches WHERE version<>0 OR winner_team_id IS NOT NULL) THEN
    RAISE EXCEPTION 'invalid result changed match';
  END IF;

  v_result := public.iste_owner_confirm_match(
    '${match}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":11}]}'::jsonb
  );
  IF v_result->>'winnerTeamId' <> '${firstTeam}' THEN
    RAISE EXCEPTION 'wrong winner';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.iste_tournament_matches
    WHERE id='${match}' AND status='finished' AND version=1
      AND winner_team_id='${firstTeam}' AND score_a=1 AND score_b=0
  ) THEN RAISE EXCEPTION 'final match not committed'; END IF;
  IF (SELECT count(*) FROM public.iste_tournament_maps)<>1
    OR (SELECT count(*) FROM public.iste_tournament_audit_log WHERE action='confirm_result')<>1
  THEN RAISE EXCEPTION 'map or audit count mismatch'; END IF;

  BEGIN
    PERFORM public.iste_owner_confirm_match(
      '${match}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":11}]}'::jsonb
    );
    RAISE EXCEPTION 'replay succeeded';
  EXCEPTION WHEN sqlstate '40001' THEN
    IF SQLERRM <> 'STALE_OR_FINISHED_MATCH' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.iste_tournament_audit_log WHERE action='confirm_result')<>1 THEN
    RAISE EXCEPTION 'replay wrote duplicate audit';
  END IF;
END
$test$;
ROLLBACK;
`;


// Four-team bracket: semifinal winners advance to a versioned final.
const four = {
  tournament: "66666666-6666-4666-8666-666666666666",
  a: "77777777-7777-4777-8777-777777777771",
  b: "77777777-7777-4777-8777-777777777772",
  c: "77777777-7777-4777-8777-777777777773",
  d: "77777777-7777-4777-8777-777777777774",
  semiA: "88888888-8888-4888-8888-888888888881",
  semiB: "88888888-8888-4888-8888-888888888882",
  final: "88888888-8888-4888-8888-888888888883",
};
const bracket = `
INSERT INTO public.iste_tournaments (id,capacity,status)
VALUES ('${four.tournament}',4,'live');
INSERT INTO public.iste_tournament_teams (id,tournament_id) VALUES
('${four.a}','${four.tournament}'),
('${four.b}','${four.tournament}'),
('${four.c}','${four.tournament}'),
('${four.d}','${four.tournament}');
INSERT INTO public.iste_tournament_matches
(id,tournament_id,round_index,match_index,team_a_id,team_b_id,best_of,status)
VALUES
('${four.semiA}','${four.tournament}',0,0,'${four.a}','${four.b}',1,'ready'),
('${four.semiB}','${four.tournament}',0,1,'${four.c}','${four.d}',1,'ready');
INSERT INTO public.iste_tournament_matches
(id,tournament_id,round_index,match_index,best_of,status)
VALUES ('${four.final}','${four.tournament}',1,0,1,'scheduled');

DO $bracket$
DECLARE v_result jsonb;
BEGIN
  v_result := public.iste_owner_confirm_match(
    '${four.semiA}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":8}]}'::jsonb
  );
  IF v_result->>'winnerTeamId' <> '${four.a}' THEN RAISE EXCEPTION 'first semifinal winner incorrect'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.iste_tournament_matches
    WHERE id='${four.final}' AND team_a_id='${four.a}'
      AND team_b_id IS NULL AND status='scheduled' AND version=1
  ) THEN RAISE EXCEPTION 'first semifinal advancement failed'; END IF;

  v_result := public.iste_owner_confirm_match(
    '${four.semiB}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Nuke","scoreA":6,"scoreB":13}]}'::jsonb
  );
  IF v_result->>'winnerTeamId' <> '${four.d}' THEN RAISE EXCEPTION 'second semifinal winner incorrect'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.iste_tournament_matches
    WHERE id='${four.final}' AND team_a_id='${four.a}'
      AND team_b_id='${four.d}' AND status='ready' AND version=2
  ) THEN RAISE EXCEPTION 'final readiness failed'; END IF;

  BEGIN
    PERFORM public.iste_owner_confirm_match(
      '${four.final}'::uuid,0,'{"bestOf":1,"maps":[{"name":"Ancient","scoreA":13,"scoreB":7}]}'::jsonb
    );
    RAISE EXCEPTION 'stale final version accepted';
  EXCEPTION WHEN sqlstate '40001' THEN
    IF SQLERRM <> 'STALE_OR_FINISHED_MATCH' THEN RAISE; END IF;
  END;

  v_result := public.iste_owner_confirm_match(
    '${four.final}'::uuid,2,'{"bestOf":1,"maps":[{"name":"Ancient","scoreA":13,"scoreB":7}]}'::jsonb
  );
  IF v_result->>'winnerTeamId' <> '${four.a}' THEN RAISE EXCEPTION 'wrong champion'; END IF;
  IF (SELECT count(*) FROM public.iste_tournament_matches
      WHERE tournament_id='${four.tournament}' AND status='finished' AND winner_team_id IS NOT NULL) <> 3
    OR (SELECT count(*) FROM public.iste_tournament_audit_log
      WHERE tournament_id='${four.tournament}' AND action='confirm_result') <> 3
  THEN RAISE EXCEPTION 'four-team bracket not fully finalized'; END IF;
END
$bracket$;
`;


const series = `
-- BO3: two wins, including an overtime map, must end the series.
INSERT INTO public.iste_tournaments (id,capacity,status)
VALUES ('99999999-9999-4999-8999-999999999993',2,'live'),
       ('99999999-9999-4999-8999-999999999995',2,'live');
INSERT INTO public.iste_tournament_teams (id,tournament_id)
VALUES ('99999999-9999-4999-8999-999999999931','99999999-9999-4999-8999-999999999993'),
       ('99999999-9999-4999-8999-999999999932','99999999-9999-4999-8999-999999999993'),
       ('99999999-9999-4999-8999-999999999951','99999999-9999-4999-8999-999999999995'),
       ('99999999-9999-4999-8999-999999999952','99999999-9999-4999-8999-999999999995');
INSERT INTO public.iste_tournament_matches
(id,tournament_id,round_index,match_index,team_a_id,team_b_id,best_of,status)
VALUES
('99999999-9999-4999-8999-999999999930','99999999-9999-4999-8999-999999999993',0,0,
 '99999999-9999-4999-8999-999999999931','99999999-9999-4999-8999-999999999932',3,'ready'),
('99999999-9999-4999-8999-999999999950','99999999-9999-4999-8999-999999999995',0,0,
 '99999999-9999-4999-8999-999999999951','99999999-9999-4999-8999-999999999952',5,'ready');

DO $series$
DECLARE r jsonb;
BEGIN
  r := public.iste_owner_confirm_match(
    '99999999-9999-4999-8999-999999999930',0,
    '{"bestOf":3,"maps":[{"name":"Mirage","scoreA":13,"scoreB":9},{"name":"Nuke","scoreA":16,"scoreB":14}]}'::jsonb);
  IF r->>'winnerTeamId' <> '99999999-9999-4999-8999-999999999931' THEN
    RAISE EXCEPTION 'BO3 winner mismatch';
  END IF;
  IF (SELECT count(*) FROM public.iste_tournament_maps WHERE match_id='99999999-9999-4999-8999-999999999930')<>2 THEN
    RAISE EXCEPTION 'BO3 map count mismatch';
  END IF;

  -- BO5 has to survive a full five-map series with a comeback.
  r := public.iste_owner_confirm_match(
    '99999999-9999-4999-8999-999999999950',0,
    '{"bestOf":5,"maps":[{"name":"Ancient","scoreA":13,"scoreB":7},{"name":"Inferno","scoreA":13,"scoreB":11},{"name":"Mirage","scoreA":8,"scoreB":13},{"name":"Nuke","scoreA":10,"scoreB":13},{"name":"Train","scoreA":13,"scoreB":11}]}'::jsonb);
  IF r->>'winnerTeamId' <> '99999999-9999-4999-8999-999999999951' THEN
    RAISE EXCEPTION 'BO5 winner mismatch';
  END IF;
  IF (SELECT count(*) FROM public.iste_tournament_maps WHERE match_id='99999999-9999-4999-8999-999999999950')<>5 THEN
    RAISE EXCEPTION 'BO5 map count mismatch';
  END IF;

  -- A decided BO3 cannot contain additional maps.
  BEGIN
    PERFORM public.iste_owner_confirm_match(
      '99999999-9999-4999-8999-999999999930',0,
      '{"bestOf":3,"maps":[{"name":"Mirage","scoreA":13,"scoreB":9},{"name":"Nuke","scoreA":13,"scoreB":9},{"name":"Inferno","scoreA":13,"scoreB":9}]}'::jsonb);
    RAISE EXCEPTION 'BO3 replay was accepted';
  EXCEPTION WHEN sqlstate '40001' THEN
    IF SQLERRM <> 'STALE_OR_FINISHED_MATCH' THEN RAISE; END IF;
  END;
END
$series$;
`;

const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-q"], {
  input: setup + migration + "\n" + seed + assertions.replace("ROLLBACK;", "") + bracket + series + "ROLLBACK;\n",
  encoding: "utf8",
  env: process.env,
});
assert.equal(result.status, 0, result.stderr || result.stdout || "psql failed");
console.log("Passed actual match RPC: unfinished score, final result and replay rejection");
