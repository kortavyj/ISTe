import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ownerRouter = readFileSync(new URL("../api/owner.js", import.meta.url), "utf8");
const rootHandler = readFileSync(new URL("../server/tournaments/root.js", import.meta.url), "utf8");
const teamsHandler = readFileSync(new URL("../server/tournaments/teams.js", import.meta.url), "utf8");
const matchesHandler = readFileSync(new URL("../server/tournaments/matches.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("tournament API delegates without an owner-only global gate", () => {
  const block = ownerRouter.match(/if \(moduleName === "tournaments"\) \{([\s\S]*?)\n  \}/);
  assert.ok(block, "tournament module handler must exist");
  assert.match(block[1], /return tournamentHandler\(request, response\)/);
  assert.doesNotMatch(block[1], /requireOwner|requireAdminOrOwner/);
});

test("tournament pages are public and authenticated accounts can create and manage", () => {
  assert.match(app, /path="\/tournaments" element=\{<Tournaments \/>\}/);
  assert.match(app, /path="\/tournaments\/:slug" element=\{<TournamentPublic \/>\}/);
  assert.match(app, /path="\/tournaments\/create" element=\{<ProtectedRoute>/);
  assert.match(app, /path="\/account\/tournaments" element=\{<ProtectedRoute>/);
});

test("public reads and guarded mutations remain separate", () => {
  assert.match(rootHandler, /if \(method === "GET"\)/);
  assert.match(rootHandler, /const user = await sessionForRequest\(request, response, supabase\)/);
  assert.match(teamsHandler, /if \(method === "GET"\)/);
  assert.match(teamsHandler, /const user = await currentUser\(request, response, supabase\)/);
  assert.match(teamsHandler, /captain_user_id: user\.id/);
  assert.match(matchesHandler, /const user=await authenticatedUser\(request,response,supabase\)/);
});
