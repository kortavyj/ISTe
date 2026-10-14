import test from "node:test";
import assert from "node:assert/strict";
import { createSingleEliminationBracket as create, confirmBracketWinner as confirm } from "../server/apiLib/tournamentBracket.js";

const teams = (n) => Array.from({length:n},(_,i)=>({id:`team-${i+1}`,seed:i+1}));

test("eight seeds pair 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6",()=>{
  const rounds=create(teams(8),8);
  assert.deepEqual(rounds.map(r=>r.length),[4,2,1]);
  assert.deepEqual(rounds[0].map(m=>[m.teamA,m.teamB]),[
    ["team-1","team-8"],["team-4","team-5"],["team-2","team-7"],["team-3","team-6"]
  ]);
});
test("five teams get exactly three first-round byes",()=>{
  const rounds=create(teams(5),8);
  assert.equal(rounds[0].filter(m=>m.winner && !m.confirmed).length,3);
  assert.deepEqual(rounds[1].map(m=>[m.teamA,m.teamB]),[
    ["team-1",null],["team-2","team-3"]
  ]);
});
test("winner advances only after explicit confirmation",()=>{
  const rounds=create(teams(8),8);
  assert.equal(rounds[1][0].teamA,null);
  const next=confirm(rounds,"r0-m0","team-8");
  assert.equal(next[0][0].confirmed,true);
  assert.equal(next[1][0].teamA,"team-8");
  assert.equal(rounds[1][0].teamA,null);
  assert.throws(()=>confirm(next,"r0-m0","team-1"),/MATCH_ALREADY_DECIDED/);
});
test("cannot confirm missing team, invalid winner or duplicate seeds",()=>{
  const rounds=create(teams(4),4);
  assert.throws(()=>confirm(rounds,"r0-m0","unlisted"),/INVALID_WINNER/);
  assert.throws(()=>confirm(rounds,"missing","team-1"),/MATCH_NOT_FOUND/);
  assert.throws(()=>create([{id:"a",seed:1},{id:"b",seed:1}],4),/INVALID_SEEDS/);
  assert.throws(()=>create([{id:"a"},{id:"a"}],4),/INVALID_TEAM_IDS/);
});
test("winner can reach final and bracket is not mutated",()=>{
  let rounds=create(teams(4),4);
  rounds=confirm(rounds,"r0-m0","team-1");
  rounds=confirm(rounds,"r0-m1","team-2");
  assert.deepEqual([rounds[1][0].teamA,rounds[1][0].teamB],["team-1","team-2"]);
  rounds=confirm(rounds,"r1-m0","team-2");
  assert.equal(rounds[1][0].winner,"team-2");
  assert.equal(rounds[1][0].confirmed,true);
});
