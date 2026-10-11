import test from "node:test";
import assert from "node:assert/strict";
import { hasVerifiedAal2 } from "../server/tournaments/mfa.js";
for(const [label,assurance,error,expected] of [
 ["owner with verified MFA",{currentLevel:"aal2"},null,true],
 ["owner without MFA",{currentLevel:"aal1"},null,false],
 ["missing assurance",null,null,false],
 ["MFA provider error",{currentLevel:"aal2"},new Error("unavailable"),false],
 ["unknown assurance",{currentLevel:"aal3"},null,false]
]) test("MFA access decision: "+label,()=>assert.equal(hasVerifiedAal2(assurance,error),expected));
