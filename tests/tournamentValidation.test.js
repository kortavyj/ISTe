import test from "node:test";
import assert from "node:assert/strict";
import { validateTournamentDraft } from "../server/apiLib/tournamentValidation.js";

const valid = { slug:"iste-fall-cup",title:"ISTe Fall Cup",capacity:8,best_of:3,
  registration_start:"2026-11-01T12:00:00Z",
  registration_end:"2026-11-03T12:00:00Z",
  starts_at:"2026-11-04T12:00:00Z" };

test("accepts a clean tournament draft with safe defaults", () => {
  const result=validateTournamentDraft(valid);
  assert.equal(result.ok,true);
  assert.equal(result.value.status,"draft");
  assert.equal(result.value.timezone,"Europe/Kyiv");
});
test("rejects arbitrary fields including status", () => {
  assert.equal(validateTournamentDraft({...valid,status:"live"}).error,"UNKNOWN_FIELD");
});
test("rejects unsafe slugs and incorrect bracket sizes", () => {
  assert.equal(validateTournamentDraft({...valid,slug:"BAD SLUG"}).error,"INVALID_SLUG");
  assert.equal(validateTournamentDraft({...valid,capacity:7}).error,"INVALID_BRACKET");
});
test("rejects bad date order", () => {
  assert.equal(validateTournamentDraft({...valid,registration_end:"2026-10-01T12:00:00Z"}).error,"INVALID_REGISTRATION_WINDOW");
  assert.equal(validateTournamentDraft({...valid,starts_at:"2026-11-02T12:00:00Z"}).error,"REGISTRATION_AFTER_START");
});
test("rejects unknown game/format and implicit type coercion", () => {
  assert.equal(validateTournamentDraft({...valid,game:"DOTA2"}).error,"INVALID_FORMAT");
  assert.equal(validateTournamentDraft({...valid,best_of:"3"}).error,"INVALID_BRACKET");
});
test("rejects arrays and invalid timestamp formats", () => {
  assert.equal(validateTournamentDraft([]).error,"INVALID_BODY");
  assert.equal(validateTournamentDraft({...valid,starts_at:"2026-11-04"}).error,"INVALID_DATE");
});
