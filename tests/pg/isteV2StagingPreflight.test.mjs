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
const unsafe=preflight.replace(/COMMIT;\s*$/, "UPDATE public.iste_tournament_teams SET status='approved';\nCOMMIT;\n");
assert.notEqual(unsafe,preflight,"preflight COMMIT must be found");
const rejection=sql(unsafe);
assert.notEqual(rejection.status,0,"write unexpectedly succeeded inside read-only transaction");
assert.match(rejection.stderr,/read-only transaction/i);
console.log("V2 staging preflight executes and blocks unexpected writes in PostgreSQL 17");
