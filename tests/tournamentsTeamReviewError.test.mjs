import assert from "node:assert/strict";
import test from "node:test";
import { createTeamReviewHandler } from "../server/tournamentRoutes/tournaments-team-review.js";

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function request() {
  return {
    method: "POST",
    headers: {
      origin: "https://www.istesport.com",
      host: "www.istesport.com",
      "content-type": "application/json",
    },
    body: {
      teamId: "30000000-0000-4000-8000-000000000001",
      expectedStatus: "pending",
      decision: "approve",
    },
  };
}
function handler(rpcError) {
  return createTeamReviewHandler({
    authorize: async () => ({
      ok: true,
      supabase: { rpc: async () => ({ data: null, error: rpcError }) },
    }),
    writesEnabled: () => true,
  });
}
test("unconfirmed roster receives safe actionable error", async () => {
  const res = response();
  await handler({ code: "22023", message: "ROSTER_NOT_CONFIRMED" })(request(), res);
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { ok: false, error: "ROSTER_NOT_CONFIRMED" });
});
test("unrelated SQL exceptions do not disclose internals", async () => {
  const res = response();
  await handler({ code: "22023", message: "private internal database details" })(request(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, "TEAM_REVIEW_REJECTED");
  assert.doesNotMatch(JSON.stringify(res.body), /private internal database details/);
});
