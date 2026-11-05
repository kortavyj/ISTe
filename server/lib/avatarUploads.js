import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "./supabaseAdmin.js";

const BUCKET = "iste-roster";
const MAX_AVATAR_BYTES = 650000;
const AVATAR_MIME = "image/jpeg";

export function validateAvatarUploadRequest(body) {
  const size = Number(body?.fileSize);
  if (body?.fileType !== AVATAR_MIME || !Number.isInteger(size) || size < 1 || size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "INVALID_AVATAR_FILE" };
  }
  return { ok: true };
}

export function isOwnAvatarPath(userId, path) {
  return typeof userId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) &&
    typeof path === "string" &&
    new RegExp(`^${userId}/avatars/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$`, "i").test(path);
}

export async function createAvatarUpload(userId, body) {
  if (!validateAvatarUploadRequest(body).ok) {
    return { ok: false, status: 400, error: "INVALID_AVATAR_FILE" };
  }

  const path = `${userId}/avatars/${randomUUID()}.jpg`;
  const storage = getSupabaseAdminClient().storage.from(BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(path);

  if (error || !data?.token) {
    console.error("Avatar signed upload failed:", error);
    return { ok: false, status: 502, error: "AVATAR_UPLOAD_PREPARATION_FAILED" };
  }
  return { ok: true, path, token: data.token };
}

export async function verifyAvatarUpload(userId, path) {
  if (!isOwnAvatarPath(userId, path)) {
    return { ok: false, status: 400, error: "INVALID_AVATAR_PATH" };
  }
  const name = path.split("/").at(-1);
  const folder = `${userId}/avatars`;
  const storage = getSupabaseAdminClient().storage.from(BUCKET);
  const { data, error } = await storage.list(folder, { limit: 100, search: name });
  if (error) {
    console.error("Avatar verification failed:", error);
    return { ok: false, status: 502, error: "AVATAR_VERIFICATION_FAILED" };
  }

  const object = data?.find((item) => item.name === name);
  if (!object) {
    return { ok: false, status: 404, error: "AVATAR_NOT_UPLOADED" };
  }
  const meta = object.metadata || {};
  const bytes = Number(meta.size ?? 0);
  if (!(bytes > 0 && bytes <= MAX_AVATAR_BYTES) || (meta.mimetype && meta.mimetype !== AVATAR_MIME)) {
    return { ok: false, status: 400, error: "INVALID_AVATAR_FILE" };
  }
  const { data: urlData } = storage.getPublicUrl(path);
  if (!urlData?.publicUrl) {
    return { ok: false, status: 502, error: "AVATAR_URL_FAILED" };
  }
  return { ok: true, publicUrl: urlData.publicUrl };
}
