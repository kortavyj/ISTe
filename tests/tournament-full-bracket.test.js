import test from "node:test";
import assert from "node:assert/strict";
import { createOpeningRound, nextPowerOfTwo } from "../src/lib/tournaments/bracket.js";

function playTournament(count) {
  const entrants = Array.from({ length: count }, (_, index) => ({ id: `team-${index + 1}` }));
  const { size, matches } = createOpeningRound(entrants);
  const round = matches.map(m => ({
    a: m.teamA, b: m.teamB,
    winner: m.winner ?? (Number(m.teamA.slice(5)) < Number(m.teamB.slice(5)) ? m.teamA : m.teamB),
  }));
  const rounds = [round];
  let current = round;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i].winner;
      const b = current[i + 1].winner;
      assert.ok(a && b);
      next.push({ a, b, winner: Number(a.slice(5)) < Number(b.slice(5)) ? a : b });
    }
    rounds.push(next);
    current = next;
  }
  assert.equal(current[0].winner, "team-1");
  assert.equal(rounds.reduce((sum, row) => sum + row.length, 0), size - 1);
  assert.equal(matches.filter(m => m.status === "bye").length, size - count);
  assert.equal(matches.filter(m => m.status === "scheduled").length, count - (size - count));
}
for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 16, 17, 31, 32, 33, 63, 64]) {
  test(`complete deterministic bracket simulation for ${count} teams`, () => playTournament(count));
}

test("no ghost participant in first round", () => {
  for(let n=2;n<=64;n++) {
    const matches=createOpeningRound(Array.from({length:n},(_,i)=>({id:`team-${i}`}))).matches;
    assert.equal(matches.length,nextPowerOfTwo(n)/2);
    for(const match of matches) {
      assert.ok(match.teamA);
      assert.equal(match.teamB === null,match.status === "bye");
    }
  }
});
