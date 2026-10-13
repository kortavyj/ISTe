import test from "node:test";
import assert from "node:assert/strict";
import { nextPowerOfTwo, seedOrder, createOpeningRound } from "../src/lib/tournaments/bracket.js";

test("bracket size is rounded up", () => {
  assert.equal(nextPowerOfTwo(3), 4);
  assert.equal(nextPowerOfTwo(16), 16);
  assert.equal(nextPowerOfTwo(33), 64);
  assert.throws(() => nextPowerOfTwo(1), RangeError);
  assert.throws(() => nextPowerOfTwo(65), RangeError);
});
test("seed slots are complete and deterministic", () => {
  for (const size of [2, 4, 8, 16, 32, 64]) {
    const order = seedOrder(size);
    assert.equal(order.length, size);
    assert.deepEqual([...order].sort((a,b) => a-b), Array.from({length:size},(_,i)=>i+1));
    for(let i=0;i<size;i+=2) assert.equal(order[i]+order[i+1],size+1);
  }
});
test("three teams produce one bye and one scheduled game", () => {
  const result = createOpeningRound(["a","b","c"].map(id=>({id})));
  assert.equal(result.size,4);
  assert.equal(result.matches.length,2);
  assert.equal(result.matches.filter(m=>m.status==="bye").length,1);
  assert.equal(result.matches.filter(m=>m.status==="scheduled").length,1);
});
test("no duplicate IDs and no empty brackets", () => {
  assert.throws(() => createOpeningRound([{id:"x"},{id:"x"}]),TypeError);
  assert.throws(() => createOpeningRound([]),RangeError);
});
