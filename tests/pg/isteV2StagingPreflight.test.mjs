import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const preflight=readFileSync(new URL("../../db/preflight/iste_v2_staging_readonly.sql",import.meta.url),"utf8");
const fixture=`
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid primary key);
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.user_roles(user_id uuid primary key,is_blocked boolean not null default false);
CREATE TABLE public.iste_tournaments(id uuid primary key);
CREATE TABLE public.iste_tournament_teams(id uuid primary key,tournament_id uuid,status text);
CREATE TABLE public.iste_tournament_members(id uuid primary key,team_id uuid,user_id uuid);
CREATE TABLE public.iste_tournament_matches(id uuid primary key);
CREATE TABLE public.iste_tournament_maps(id uuid primary key);
CREATE TABLE public.iste_tournament_audit_log(id uuid primary key);
INSERT INTO public.iste_tournament_teams VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','pending');
INSERT INTO public.iste_tournament_members VALUES
 ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001');
`;
function sql(input){
 return spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q","-At"],{input,encoding:"utf8"});
}
const baseline=sql(fixture+preflight);
assert.equal(baseline.status,0,baseline.stderr||baseline.stdout);
assert.match(baseline.stdout,/pending\|1\|1\|0\|1\|0/);
assert.match(baseline.stdout,/ROSTER_RECONCILIATION_REQUIRED/,"missing Auth user must block rollout");
assert.match(baseline.stdout,/CONSENT_REVIEW_REQUIRED/,"legacy memberships do not prove consent");
// Valid accounts must clear the data-quality gate; a clean roster is not
// itself authorization to apply a migration.
const clean=sql(`INSERT INTO auth.users(id) VALUES ('10000000-0000-4000-8000-000000000001');\n`+preflight);
assert.equal(clean.status,0,clean.stderr||clean.stdout);
assert.match(clean.stdout,/NO_KNOWN_ROSTER_BLOCKERS/);
assert.doesNotMatch(clean.stdout,/ROSTER_RECONCILIATION_REQUIRED/);
// A real Auth account is still ineligible if the account has been blocked.
const blocked=sql(`INSERT INTO public.user_roles(user_id,is_blocked)
 VALUES ('10000000-0000-4000-8000-000000000001',true);\n`+preflight);
assert.equal(blocked.status,0,blocked.stderr||blocked.stdout);
assert.match(blocked.stdout,/ROSTER_RECONCILIATION_REQUIRED/,"blocked account must stop rollout");
assert.doesNotMatch(blocked.stdout,/NO_KNOWN_ROSTER_BLOCKERS/);
// An active roster with a FACEIT-only slot cannot satisfy Auth consent.
const faceitOnly=sql(`INSERT INTO public.iste_tournament_members(id,team_id,user_id)
 VALUES ('40000000-0000-4000-8000-000000000202',
         '30000000-0000-4000-8000-000000000001',NULL);\n`+preflight);
assert.equal(faceitOnly.status,0,faceitOnly.stderr||faceitOnly.stdout);
assert.match(faceitOnly.stdout,/ROSTER_RECONCILIATION_REQUIRED/,"FACEIT-only member must stop rollout");
// Identity validity does not compensate for an incomplete five-player squad.
assert.match(baseline.stdout,/ROSTER_SIZE_RECONCILIATION_REQUIRED/);
const filled=sql(`INSERT INTO public.iste_tournament_members(id,team_id,user_id)
SELECT ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '30000000-0000-4000-8000-000000000001'::uuid,
 ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
FROM generate_series(2,5) n;\n`+preflight);
assert.equal(filled.status,0,filled.stderr||filled.stdout);
assert.match(filled.stdout,/NO_KNOWN_ROSTER_SIZE_BLOCKERS/);
// Eight roster entries must also prevent staging readiness.
const oversized=sql(`INSERT INTO public.iste_tournament_members(id,team_id,user_id)
SELECT ('40000000-0000-4000-8000-'||lpad((n+100)::text,12,'0'))::uuid,
 '30000000-0000-4000-8000-000000000001'::uuid,
 ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
FROM generate_series(6,8) n;\n`+preflight);
assert.equal(oversized.status,0,oversized.stderr||oversized.stdout);
assert.match(oversized.stdout,/ROSTER_SIZE_RECONCILIATION_REQUIRED/);
const unsafe=preflight.replace(/COMMIT;\s*$/, "UPDATE public.iste_tournament_teams SET status='approved';\nCOMMIT;\n");
assert.notEqual(unsafe,preflight,"preflight COMMIT must be found");
const rejection=sql(unsafe);
assert.notEqual(rejection.status,0,"write unexpectedly succeeded inside read-only transaction");
assert.match(rejection.stderr,/read-only transaction/i);
console.log("V2 staging preflight executes and blocks unexpected writes in PostgreSQL 17");
