import test from "node:test";
import assert from "node:assert/strict";
import { validateTournamentTeamApplication as validate } from "../server/apiLib/tournamentTeamRegistration.js";

const tournamentId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const players=["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222","33333333-3333-4333-8333-333333333333","44444444-4444-4444-8444-444444444444","55555555-5555-4555-8555-555555555555"];
const valid={tournamentId,name:"ISTe Academy",captainUserId:players[0],members:players.map((userId,i)=>({userId,faceitPlayerId:`player_${i+1}`}))};

test("accepts exactly five players and marks one captain",()=>{
 const r=validate(valid);assert.equal(r.ok,true);assert.equal(r.value.status,"pending");
 assert.equal(r.value.members.filter(m=>m.isCaptain).length,1);
});
test("refuses missing captain and duplicate users",()=>{
 assert.equal(validate({...valid,captainUserId:"66666666-6666-4666-8666-666666666666"}).error,"CAPTAIN_NOT_IN_ROSTER");
 assert.equal(validate({...valid,members:[...valid.members.slice(0,4),valid.members[0]]}).error,"DUPLICATE_MEMBER");
});
test("refuses duplicate FACEIT identities",()=>{
 assert.equal(validate({...valid,members:[...valid.members.slice(0,4),{userId:players[4],faceitPlayerId:"player_1"}]}).error,"DUPLICATE_MEMBER");
});
test("refuses invalid size and unexpected status overrides",()=>{
 assert.equal(validate({...valid,members:valid.members.slice(0,4)}).error,"INVALID_ROSTER_SIZE");
 assert.equal(validate({...valid,status:"approved"}).error,"INVALID_BODY");
});
test("refuses bad team name or missing identity",()=>{
 assert.equal(validate({...valid,name:"  "}).error,"INVALID_TEAM_NAME");
 assert.equal(validate({...valid,members:[...valid.members.slice(0,4),{}]}).error,"MISSING_MEMBER_IDENTITY");
});
