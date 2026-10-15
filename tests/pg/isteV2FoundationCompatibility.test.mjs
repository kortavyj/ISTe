import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

function migration(path) {
 return readFileSync(new URL(path,import.meta.url),"utf8")
  .replace(/^\s*begin;\s*/im,"").replace(/\s*commit;\s*$/im,"");
}
const foundation=migration("../../supabase/migrations/20261014_iste_tournaments_v2_foundation.sql");
const apply=migration("../../supabase/migrations/20261014_iste_tournament_team_apply_rpc.sql");
const consent=migration("../../db/migrations/20261015_iste_v2_roster_consent.sql");
const sql=`
BEGIN;
CREATE SCHEMA auth;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.user_roles(user_id uuid primary key,role text,is_blocked boolean not null default false);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS 'select coalesce(nullif(current_setting(''request.jwt.claim.role'',true),''''),''anon'')';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS 'select coalesce(nullif(current_setting(''request.jwt.claims'',true),''''),''{}'')::jsonb';
${foundation}
${apply}
${consent}
DO $verify$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns
   WHERE table_schema='public' AND table_name='iste_tournament_members'
   AND column_name='accepted_at') THEN
  RAISE EXCEPTION 'consent column missing on actual V2 foundation';
 END IF;
 IF to_regprocedure('public.iste_v2_invite_replacement(uuid,uuid)') IS NULL
 OR to_regprocedure('public.iste_v2_respond_roster_membership(uuid,boolean)') IS NULL
 OR to_regprocedure('public.iste_v2_my_pending_captain_teams()') IS NULL THEN
  RAISE EXCEPTION 'a V2 consent function failed to install';
 END IF;
END $verify$;
-- Verify SQL grants on the real foundation (not only function existence).
DO $grants$
DECLARE signature text;
BEGIN
 FOREACH signature IN ARRAY ARRAY[
  'public.iste_apply_tournament_team(jsonb)',
  'public.iste_v2_respond_roster_membership(uuid,boolean)',
  'public.iste_v2_invite_replacement(uuid,uuid)',
  'public.iste_v2_my_roster_invitations()',
  'public.iste_v2_my_pending_captain_teams()'
 ] LOOP
  IF has_function_privilege('anon',signature,'EXECUTE') THEN
   RAISE EXCEPTION 'anonymous EXECUTE permission remains on %',signature;
  END IF;
  IF NOT has_function_privilege('authenticated',signature,'EXECUTE') THEN
   RAISE EXCEPTION 'authenticated EXECUTE permission missing on %',signature;
  END IF;
 END LOOP;
END $grants$;
ROLLBACK;
`;
const result=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q"],{input:sql,encoding:"utf8"});
assert.equal(result.status,0,result.stderr||result.stdout||"psql failed");
console.log("PASS: V2 foundation + captain apply + consent migrations installed in one transaction");
