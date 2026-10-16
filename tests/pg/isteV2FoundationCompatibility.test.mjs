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
const bracket=migration("../../supabase/migrations/20261014_iste_tournament_generate_bracket_rpc.sql");
const matchResult=migration("../../supabase/migrations/20261014_iste_tournament_confirm_match_rpc.sql");
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
${bracket}
${matchResult}
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
  'public.iste_v2_my_pending_captain_teams()',
  'public.iste_owner_generate_bracket(uuid)',
  'public.iste_owner_confirm_match(uuid,integer,jsonb)'
 ] LOOP
  IF has_function_privilege('anon',signature,'EXECUTE') THEN
   RAISE EXCEPTION 'anonymous EXECUTE permission remains on %',signature;
  END IF;
  IF NOT has_function_privilege('authenticated',signature,'EXECUTE') THEN
   RAISE EXCEPTION 'authenticated EXECUTE permission missing on %',signature;
  END IF;
 END LOOP;
END $grants$;
-- Check execution as the actual anon database role, not only ACL metadata.
SET ROLE anon;
DO $anonymous_execution$
BEGIN
 BEGIN
  PERFORM public.iste_v2_invite_replacement(NULL::uuid,NULL::uuid);
  RAISE EXCEPTION 'anonymous user executed replacement RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM public.iste_apply_tournament_team('{}'::jsonb);
  RAISE EXCEPTION 'anonymous user executed application RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $anonymous_execution$;
RESET ROLE;
-- An authenticated SQL role without a JWT subject must not gain mutation rights.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $no_subject$
BEGIN
 BEGIN
  PERFORM public.iste_v2_invite_replacement(NULL::uuid,NULL::uuid);
  RAISE EXCEPTION 'authenticated SQL role without identity invited a player';
 EXCEPTION WHEN SQLSTATE '42501' THEN
  IF SQLERRM <> 'AUTH_REQUIRED' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.iste_apply_tournament_team('{}'::jsonb);
  RAISE EXCEPTION 'authenticated SQL role without identity created a team';
 EXCEPTION WHEN SQLSTATE '42501' THEN
  IF SQLERRM <> 'AUTH_REQUIRED' THEN RAISE; END IF;
 END;
END $no_subject$;
RESET ROLE;
-- On the real foundation, private roster and audit tables must retain RLS.
DO $rls_boundary$
DECLARE relation_name text;
BEGIN
 FOREACH relation_name IN ARRAY ARRAY[
   'iste_tournament_members','iste_tournament_teams','iste_tournament_audit_log'
 ] LOOP
   IF NOT EXISTS (
     SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname=relation_name
       AND c.relrowsecurity
   ) THEN
     RAISE EXCEPTION 'RLS disabled on private V2 table: %', relation_name;
   END IF;
   IF EXISTS (
     SELECT 1 FROM pg_policies
     WHERE schemaname='public' AND tablename=relation_name
       AND ('anon'=ANY(roles) OR 'public'=ANY(roles))
   ) THEN
     RAISE EXCEPTION 'anonymous table policy on private V2 table: %',relation_name;
   END IF;
 END LOOP;
END $rls_boundary$;
-- Direct client table privileges remain forbidden even if future RLS policies change.
DO $private_grants$
DECLARE tab text; role_name text; operation text;
BEGIN
 FOREACH tab IN ARRAY ARRAY['iste_tournament_members','iste_tournament_teams','iste_tournament_audit_log'] LOOP
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   FOREACH operation IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
    IF has_table_privilege(role_name,format('public.%I',tab),operation) THEN
     RAISE EXCEPTION 'direct % grant for % on %',operation,role_name,tab;
    END IF;
   END LOOP;
  END LOOP;
 END LOOP;
END $private_grants$;
-- Published tournament objects keep readable SELECT policies, but client writes
-- must be rejected independent of any future policy change.
DO $public_read_only$
DECLARE tab text; role_name text; operation text;
BEGIN
 FOREACH tab IN ARRAY ARRAY['iste_tournaments','iste_tournament_matches','iste_tournament_maps'] LOOP
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   FOREACH operation IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
    IF has_table_privilege(role_name,format('public.%I',tab),operation) THEN
     RAISE EXCEPTION 'direct % grant for % on published V2 table %',operation,role_name,tab;
    END IF;
   END LOOP;
  END LOOP;
 END LOOP;
END $public_read_only$;
-- Published V2 resources must preserve intentional anonymous SELECT grants and
-- SELECT-only RLS policies after client write permissions are removed.
DO $public_read_boundary$
DECLARE tab text; op text;
BEGIN
 FOREACH tab IN ARRAY ARRAY['iste_tournaments','iste_tournament_matches','iste_tournament_maps'] LOOP
   IF NOT has_table_privilege('anon',format('public.%I',tab),'SELECT') THEN
     RAISE EXCEPTION 'published V2 table lost anon SELECT grant: %',tab;
   END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=tab AND cmd='SELECT'
        AND ('anon'=ANY(roles) OR 'public'=ANY(roles))) THEN
     RAISE EXCEPTION 'published V2 table lacks anonymous SELECT policy: %',tab;
   END IF;
 END LOOP;
END $public_read_boundary$;
-- Match lifecycle RPCs must never admit unidentified callers.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $match_identity$
BEGIN
 BEGIN
  PERFORM public.iste_owner_generate_bracket(NULL::uuid);
  RAISE EXCEPTION 'bracket RPC admitted unidentified caller';
 EXCEPTION WHEN SQLSTATE '42501' THEN
  IF SQLERRM <> 'AUTH_REQUIRED' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.iste_owner_confirm_match(NULL::uuid,0,'{}'::jsonb);
  RAISE EXCEPTION 'result RPC admitted unidentified caller';
 EXCEPTION WHEN SQLSTATE '42501' THEN
  IF SQLERRM <> 'AUTH_REQUIRED' THEN RAISE; END IF;
 END;
END $match_identity$;
RESET ROLE;
-- End-to-end tournament lifecycle on the real V2 foundation: two approved
-- teams -> seeded bracket -> live final -> completed BO1 result and audit.
INSERT INTO public.user_roles(user_id,role,is_blocked) VALUES
 ('10000000-0000-4000-8000-000000000001','owner',false);
INSERT INTO public.iste_tournaments(id,slug,title,capacity,best_of,status,published_at)
VALUES ('20000000-0000-4000-8000-000000000001','ci-two-team-cup',
 'CI Two Team Cup',2,1,'checkin',now());
INSERT INTO public.iste_tournament_teams(id,tournament_id,name,status) VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Alpha','approved'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Bravo','approved');
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"aal":"aal2"}',true);
DO $full_bracket_flow$
DECLARE v_match_id uuid; v_result jsonb;
BEGIN
 PERFORM public.iste_owner_generate_bracket('20000000-0000-4000-8000-000000000001');
 IF (SELECT count(*) FROM public.iste_tournament_matches
     WHERE tournament_id='20000000-0000-4000-8000-000000000001')<>1 THEN
  RAISE EXCEPTION 'two-team bracket did not generate exactly one final';
 END IF;
 SELECT id INTO STRICT v_match_id FROM public.iste_tournament_matches
  WHERE tournament_id='20000000-0000-4000-8000-000000000001'
    AND round_index=0 AND match_index=0 AND status='ready'
    AND team_a_id IS NOT NULL AND team_b_id IS NOT NULL;
 UPDATE public.iste_tournaments SET status='live'
  WHERE id='20000000-0000-4000-8000-000000000001';
 v_result:=public.iste_owner_confirm_match(v_match_id,0,
   '{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":9}]}'::jsonb);
 IF (v_result->>'winnerTeamId') IS NULL
    OR (SELECT status FROM public.iste_tournament_matches WHERE id=v_match_id)<>'finished'
    OR (SELECT count(*) FROM public.iste_tournament_maps WHERE match_id=v_match_id)<>1
    OR (SELECT count(*) FROM public.iste_tournament_audit_log
        WHERE tournament_id='20000000-0000-4000-8000-000000000001'
         AND action='confirm_result')<>1 THEN
  RAISE EXCEPTION 'final result/map/audit not persisted';
 END IF;
 BEGIN
  PERFORM public.iste_owner_confirm_match(v_match_id,0,
    '{"bestOf":1,"maps":[{"name":"Mirage","scoreA":13,"scoreB":9}]}'::jsonb);
  RAISE EXCEPTION 'stale duplicate confirmation accepted';
 EXCEPTION WHEN SQLSTATE '40001' THEN
  IF SQLERRM <> 'STALE_OR_FINISHED_MATCH' THEN RAISE; END IF;
 END;
END $full_bracket_flow$;
ROLLBACK;
`;
const result=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q"],{input:sql,encoding:"utf8"});
assert.equal(result.status,0,result.stderr||result.stdout||"psql failed");
console.log("PASS: V2 foundation + captain apply + consent migrations installed in one transaction");
