import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidAvatarFrame, isOwnBannerPath, createBannerUpload } from "../server/lib/avatarUploads.js";

const owner = "d116da45-4fd6-4a02-8f25-1fb9151796ab";
const other = "61666f51-6d74-4617-a6c9-89ebec08f2dd";
const file = "a94f5ab6-c30f-4a47-a836-61fc6e0b2da4.jpg";

test("only supported avatar frame designs can be selected", () => {
  for (const frame of ["prism","crimson","cyan","violet","gold","minimal"]) {
    assert.equal(isValidAvatarFrame(frame), true);
  }
  for (const frame of ["", "custom", "<style>", null, 0, {}]) {
    assert.equal(isValidAvatarFrame(frame), false);
  }
});

test("member banner paths must belong to the authenticated user", () => {
  assert.equal(isOwnBannerPath(owner, owner + "/banners/" + file), true);
  for (const path of [
    other + "/banners/" + file,
    owner + "/avatars/" + file,
    owner + "/banners/../" + file,
    owner + "/banners/" + file + "?url=1",
    owner + "/banners/test.png",
    owner + "/banners/a.jpg",
  ]) assert.equal(isOwnBannerPath(owner, path), false);
});

test("invalid banner file types and sizes are rejected before storage access", async () => {
  const invalid = [
    { fileType:"image/png", fileSize:3200 },
    { fileType:"image/jpeg", fileSize:1400001 },
    { fileType:"image/jpeg", fileSize:0 },
    { fileType:"image/jpeg", fileSize:12.5 },
  ];
  for (const body of invalid) {
    const result = await createBannerUpload(owner, body);
    assert.equal(result.ok, false);
    assert.equal(result.error,"INVALID_BANNER_FILE");
  }
});
