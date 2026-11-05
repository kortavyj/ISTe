import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isOwnAvatarPath,
  validateAvatarUploadRequest,
} from "../server/lib/avatarUploads.js";

const owner = "975a9331-f531-4773-9fb4-3dc4b174be52";
const other = "968b9b40-ea86-48fa-92b1-b19de01216bb";
const file = "ced69e08-0309-4cc4-b8d2-b11154e978eb.jpg";

test("accepts only tightly constrained JPEG avatar upload metadata", () => {
  assert.equal(validateAvatarUploadRequest({ fileType: "image/jpeg", fileSize: 650000 }).ok, true);
  for (const metadata of [
    { fileType: "image/png", fileSize: 200 },
    { fileType: "image/jpeg", fileSize: 650001 },
    { fileType: "image/jpeg", fileSize: -1 },
    { fileType: "image/jpeg", fileSize: 0 },
    { fileType: "image/jpeg", fileSize: "NaN" },
    { fileType: "image/jpeg", fileSize: 12.5 },
  ]) assert.equal(validateAvatarUploadRequest(metadata).ok, false);
});

test("avatar confirmation cannot reference another account or bucket path", () => {
  const allowed = `${owner}/avatars/${file}`;
  assert.equal(isOwnAvatarPath(owner, allowed), true);
  for (const path of [
    `${other}/avatars/${file}`,
    `${owner}/../${other}/avatars/${file}`,
    `${owner}/avatars/${file}/extra`,
    `${owner}/avatars/test.jpg`,
    `${owner}/avatars/${file.replace(".jpg", ".png")}`,
    `${owner}/${file}`,
    "news-images/" + allowed,
  ]) assert.equal(isOwnAvatarPath(owner, path), false);
});
