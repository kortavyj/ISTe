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

const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-q"], {
  input: setup + migration + "\n" + seed + assertions,
  encoding: "utf8",
  env: process.env,
});
assert.equal(result.status, 0, result.stderr || result.stdout || "psql failed");
console.log("Passed actual match RPC: unfinished score, final result and replay rejection");
