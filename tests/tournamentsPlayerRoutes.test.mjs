import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = readFileSync(new URL("../server/tournamentRoutes/tournaments-my-invitations.js", import.meta.url), "utf8");
const apply = readFileSync(new URL("../server/tournamentRoutes/tournaments-team-apply.js", import.meta.url), "utf8");
const respond = readFileSync(new URL("../server/tournamentRoutes/tournaments-roster-response.js", import.meta.url), "utf8");
const router = readFileSync(new URL("../api/tournaments.js", import.meta.url), "utf8");
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("invitation read uses an authenticated user-bound RPC, not direct unrestricted table access", () => {
  assert.match(read, /readAuthCookies\(request\)/);
  assert.match(read, /supabase\.auth\.setSession\(/);
  assert.match(read, /supabase\.rpc\("iste_v2_my_roster_invitations"\)/);
  assert.doesNotMatch(read, /supabase\.from\("iste_tournament_members"\)/);
});
test("decision route validates identity, input and global write gate", () => {
  assert.match(respond, /requireOrigin:\s*true/);
  assert.match(respond, /isUuid\(input\.memberId\)/);
  assert.match(respond, /typeof input\.accept\s*!==\s*"boolean"/);
  assert.match(respond, /supabase\.auth\.setSession\(/);
  assert.match(respond, /ISTE_TOURNAMENT_WRITES_ENABLED/);
  assert.match(respond, /iste_v2_respond_roster_membership/);
});
test("both player endpoints use the single serverless entrypoint", () => {
  for (const [name, path] of [
    ["my-invitations", "/api/tournaments-my-invitations"],
    ["roster-response", "/api/tournaments-roster-response"],
  ]) {
    assert.match(router, new RegExp('"'+name+'"'));
    assert.ok(vercel.rewrites.some(rule =>
      rule.source === path && rule.destination === '/api/tournaments?route='+name
    ));
  }
});

test("captain applications cannot enter an unconfirmable FACEIT-only roster", () => {
  assert.match(apply, /validated\.value\.members\.some\(member => !member\.userId\)/);
  assert.match(apply, /ROSTER_ACCOUNT_REQUIRED/);
});
