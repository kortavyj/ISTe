import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const migration = readFileSync(new URL("../../db/migrations/20261015_iste_v2_roster_consent.sql", import.meta.url), "utf8");
const sql = `
BEGIN;
CREATE SCHEMA auth;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.user_roles(user_id uuid primary key,role text,is_blocked boolean not null default false);
CREATE TABLE public.iste_tournaments(id uuid primary key,status text,capacity integer,title text);
CREATE TABLE public.iste_tournament_teams(id uuid primary key,tournament_id uuid,name text,status text,captain_user_id uuid,updated_at timestamptz default now());
CREATE TABLE public.iste_tournament_members(id uuid primary key,team_id uuid,user_id uuid,is_captain boolean,created_at timestamptz default now());
CREATE TABLE public.iste_tournament_audit_log(tournament_id uuid,actor_id uuid,entity_type text,entity_id uuid,action text,previous_data jsonb,new_data jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS 'select coalesce(nullif(current_setting(''request.jwt.claim.role'',true),''''),''anon'')';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS 'select coalesce(nullif(current_setting(''request.jwt.claims'',true),''''),''{}'')::jsonb';
${migration}
INSERT INTO public.user_roles VALUES
 ('10000000-0000-4000-8000-000000000001','owner',false),
 ('10000000-0000-4000-8000-000000000002','user',false),
 ('10000000-0000-4000-8000-000000000003','user',false);
INSERT INTO public.iste_tournaments(id,status,capacity,title) VALUES ('20000000-0000-4000-8000-000000000001','registration',2,'Test Cup');
INSERT INTO public.iste_tournament_teams(id,tournament_id,name,status,captain_user_id) VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Alpha','pending','10000000-0000-4000-8000-000000000002');
INSERT INTO public.iste_tournament_members (id,team_id,user_id,is_captain) VALUES
 ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',true),
 ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',false),
 ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004',false),
 ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005',false),
 ('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000006',false);

SET LOCAL request.jwt.claim.role='authenticated';
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
DO $test$
BEGIN
  BEGIN
    PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000002',true);
    RAISE EXCEPTION 'cross-user consent allowed';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    IF SQLERRM <> 'MEMBER_NOT_FOUND' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.iste_tournament_members WHERE id='40000000-0000-4000-8000-000000000002' AND accepted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'cross-user membership mutated';
  END IF;
  PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000001',true);
  IF NOT EXISTS(SELECT 1 FROM public.iste_tournament_members WHERE id='40000000-0000-4000-8000-000000000001' AND accepted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'self-confirmation not saved';
  END IF;
  BEGIN
    PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000001',true);
    RAISE EXCEPTION 'duplicate acceptance allowed';
  EXCEPTION WHEN SQLSTATE '40001' THEN
    IF SQLERRM <> 'MEMBERSHIP_ALREADY_CONFIRMED' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.iste_tournament_audit_log WHERE action='member_accepted') <> 1 THEN
    RAISE EXCEPTION 'duplicate consent created extra audit events';
  END IF;
END
$test$;
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
SET LOCAL request.jwt.claims='{"aal":"aal2"}';
DO $test$
BEGIN
  BEGIN
    PERFORM public.iste_owner_review_team('30000000-0000-4000-8000-000000000001','pending','approve');
    RAISE EXCEPTION 'unconfirmed roster approved';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF SQLERRM <> 'ROSTER_NOT_CONFIRMED' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.iste_tournament_teams WHERE id='30000000-0000-4000-8000-000000000001') <> 'pending' THEN
    RAISE EXCEPTION 'review changed status unexpectedly';
  END IF;
END
$test$;
-- Only the caller's outstanding invitation must be visible.
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
DO $mine$
BEGIN
 IF (SELECT count(*) FROM public.iste_v2_my_roster_invitations())<>1 THEN
   RAISE EXCEPTION 'own pending invitations not filtered';
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM public.iste_v2_my_roster_invitations()
   WHERE member_id='40000000-0000-4000-8000-000000000002'
     AND team_name='Alpha' AND tournament_title='Test Cup'
 ) THEN RAISE EXCEPTION 'expected invitation missing'; END IF;
END
$mine$;
-- A different player can refuse their own invitation, which removes their slot.
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
DO $test$
BEGIN
  PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000002',false);
  IF EXISTS(SELECT 1 FROM public.iste_tournament_members WHERE id='40000000-0000-4000-8000-000000000002') THEN
    RAISE EXCEPTION 'declined invitation still present';
  END IF;
END
$test$;
DO $audit$
BEGIN
  IF (SELECT count(*) FROM public.iste_tournament_audit_log
      WHERE action='member_accepted' AND actor_id='10000000-0000-4000-8000-000000000002')<>1
    OR (SELECT count(*) FROM public.iste_tournament_audit_log
      WHERE action='member_declined' AND actor_id='10000000-0000-4000-8000-000000000003')<>1
  THEN RAISE EXCEPTION 'consent audit events missing'; END IF;
END
$audit$;
-- A blocked member must not be able to accept another pending membership.
UPDATE public.user_roles SET is_blocked=true WHERE user_id='10000000-0000-4000-8000-000000000003';
INSERT INTO public.iste_tournament_members (id,team_id,user_id,is_captain)
VALUES ('40000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001',
'10000000-0000-4000-8000-000000000003',false);
DO $test$
BEGIN
  BEGIN
    PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000006',true);
    RAISE EXCEPTION 'blocked player accepted';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    IF SQLERRM <> 'ACCOUNT_BLOCKED' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.iste_tournament_members WHERE id='40000000-0000-4000-8000-000000000006' AND accepted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'blocked player mutated acceptance';
  END IF;
END
$test$;
-- A captain cannot decline their own required position.
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
DO $test$
BEGIN
  BEGIN
    PERFORM public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000001',false);
    RAISE EXCEPTION 'captain declined their own position';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF SQLERRM <> 'CAPTAIN_CANNOT_DECLINE' THEN RAISE; END IF;
  END;
END
$test$;
-- End-to-end SQL path: captain and four players confirm, then owner approves.
DELETE FROM public.iste_tournament_members
 WHERE id='40000000-0000-4000-8000-000000000006';
UPDATE public.user_roles SET is_blocked=false
 WHERE user_id='10000000-0000-4000-8000-000000000003';
INSERT INTO public.iste_tournament_members(id,team_id,user_id,is_captain)
VALUES ('40000000-0000-4000-8000-000000000007',
 '30000000-0000-4000-8000-000000000001',
 '10000000-0000-4000-8000-000000000003',false);
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
SELECT public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000007',true);
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000004';
SELECT public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000003',true);
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000005';
SELECT public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000004',true);
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000006';
SELECT public.iste_v2_respond_roster_membership('40000000-0000-4000-8000-000000000005',true);
SET LOCAL request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
DO $full_team$
DECLARE outcome jsonb;
BEGIN
 IF (SELECT count(*) FROM public.iste_tournament_members
    WHERE team_id='30000000-0000-4000-8000-000000000001'
      AND accepted_at IS NOT NULL)<>5 THEN
   RAISE EXCEPTION 'five explicit confirmations missing';
 END IF;
 outcome:=public.iste_owner_review_team(
  '30000000-0000-4000-8000-000000000001','pending','approve');
 IF outcome->>'status'<>'approved' OR
    (SELECT status FROM public.iste_tournament_teams
      WHERE id='30000000-0000-4000-8000-000000000001')<>'approved' THEN
   RAISE EXCEPTION 'confirmed roster was not approved';
 END IF;
 IF (SELECT count(*) FROM public.iste_tournament_audit_log
     WHERE action='team_approved')<>1 THEN
   RAISE EXCEPTION 'approval audit event missing';
 END IF;
END
$full_team$;
ROLLBACK;
`;
const result=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q"],{input:sql,encoding:"utf8"});
assert.equal(result.status,0,result.stderr||result.stdout||"psql failed");
console.log("V2 roster consent RPC and approval guard passed in isolated PostgreSQL");
