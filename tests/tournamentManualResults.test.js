import test from "node:test";
import assert from "node:assert/strict";
import { validateManualMatchResult as check } from "../api/lib/tournamentManualResults.js";

const mirage = { name: "Mirage", scoreA: 13, scoreB: 9 };
const nuke = { name: "Nuke", scoreA: 11, scoreB: 13 };
const inferno = { name: "Inferno", scoreA: 13, scoreB: 7 };
const ancient = { name: "Ancient", scoreA: 13, scoreB: 3 };

test("BO1 returns tentative winning score", () => {
  assert.deepEqual(check({ bestOf: 1, maps: [mirage] }).value,
    { bestOf: 1, maps: [{ index:1,...mirage }], scoreA:1, scoreB:0, winner:"A", confirmed:false });
});
test("BO3 allows full three-map series", () => {
  const r=check({ bestOf:3, maps:[mirage,nuke,inferno] });
  assert.equal(r.ok,true);
  assert.equal(r.value.scoreA,2);
  assert.equal(r.value.scoreB,1);
});
test("BO5 accepts winner after three maps", () => {
  assert.equal(check({ bestOf:5, maps:[mirage,inferno,ancient] }).value.winner,"A");
});
test("series may not continue after being decided", () => {
  assert.equal(check({ bestOf:3, maps:[mirage,inferno,nuke] }).error,"SERIES_ALREADY_DECIDED");
});
test("rejects incomplete, tied and duplicate maps", () => {
  assert.equal(check({ bestOf:3, maps:[mirage] }).error,"INVALID_MAP_COUNT");
  assert.equal(check({ bestOf:3, maps:[mirage,nuke] }).error,"SERIES_INCOMPLETE");
  assert.equal(check({ bestOf:1, maps:[{...mirage,scoreB:13}] }).error,"INVALID_MAP_SCORE");
  assert.equal(check({ bestOf:3, maps:[mirage,mirage] }).error,"INVALID_MAP_NAME");
});
test("rejects fractional, string and negative scores", () => {
  for (const scoreA of [-1,12.5,"13"]) {
    assert.equal(check({ bestOf:1, maps:[{...mirage,scoreA}] }).error,"INVALID_MAP_SCORE");
  }
});
test("never permits caller-supplied confirmation or winner", () => {
  assert.equal(check({ bestOf:1,maps:[mirage],confirmed:true }).error,"UNKNOWN_FIELD");
  assert.equal(check({ bestOf:1,maps:[mirage],winner:"B" }).error,"UNKNOWN_FIELD");
});
