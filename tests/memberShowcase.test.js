import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateCommentInput,
  validateShowcaseInput,
  isOwnShowcaseImagePath,
} from "../server/lib/memberShowcase.js";

const alice = "f85bb962-f58c-4c37-845e-41f9cb1cfb03";
const bob = "0ee2a990-08ac-4c17-9132-2f43b36eac8f";
const file = "3c0e719a-33a5-43d7-999b-035e14c72341.jpg";

test("showcase accepts text-only and image-only submissions", () => {
  assert.deepEqual(validateShowcaseInput({ title: " Test ", body: " Hello ", imagePath: null }), {
    ok: true, title: "Test", body: "Hello", imagePath: null,
  });
  assert.equal(validateShowcaseInput({ title: "", body: "", imagePath: alice + "/" + file }).ok, true);
  assert.equal(validateShowcaseInput({ title: "", body: "", imagePath: null }).ok, false);
  assert.equal(validateShowcaseInput({ title: "", body: "a".repeat(3001), imagePath: null }).ok, false);
  assert.equal(validateShowcaseInput({ title: "a".repeat(101), body: "x", imagePath: null }).ok, false);
  assert.equal(validateShowcaseInput({ title: "", body: "x", imagePath: { path: "unsafe" } }).ok, false);
});

test("comment limits prevent empty and oversized submissions", () => {
  assert.equal(validateCommentInput("  hello  ").body, "hello");
  assert.equal(validateCommentInput(" a ").ok, false);
  assert.equal(validateCommentInput("a".repeat(600)).ok, true);
  assert.equal(validateCommentInput("a".repeat(601)).ok, false);
  assert.equal(validateCommentInput({ message: "hi" }).ok, false);
});

test("only account-scoped randomized jpg images are accepted", () => {
  assert.equal(isOwnShowcaseImagePath(alice, alice + "/" + file), true);
  for (const invalid of [
    bob + "/" + file,
    alice + "/../" + bob + "/" + file,
    alice + "/" + file + "/test",
    alice + "/other.png",
    alice + "/test.jpg",
    alice + "/" + file + "?x=1",
  ]) assert.equal(isOwnShowcaseImagePath(alice, invalid), false);
});
