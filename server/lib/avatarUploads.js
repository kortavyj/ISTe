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

const BANNER_MAX_BYTES = 1_400_000;
export const AVATAR_FRAME_OPTIONS = Object.freeze(["prism", "crimson", "cyan", "violet", "gold", "minimal"]);

export function isValidAvatarFrame(value) {
  return typeof value === "string" && AVATAR_FRAME_OPTIONS.includes(value);
}

export function isOwnBannerPath(userId, path) {
  return typeof userId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) &&
    typeof path === "string" &&
    new RegExp(`^${userId}/banners/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$`, "i").test(path);
}

export async function createBannerUpload(userId, body) {
  const bytes = Number(body?.fileSize);
  if (body?.fileType !== "image/jpeg" ||
      !Number.isInteger(bytes) || bytes < 1 || bytes > BANNER_MAX_BYTES) {
    return { ok: false, status: 400, error: "INVALID_BANNER_FILE" };
  }
  const path = `${userId}/banners/${randomUUID()}.jpg`;
  const { data, error } = await getSupabaseAdminClient().storage
    .from(BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error("Banner upload preparation failed:", error);
    return { ok: false, status: 502, error: "BANNER_UPLOAD_PREPARATION_FAILED" };
  }
  return { ok: true, path, token: data.token };
}

export async function verifyBannerUpload(userId, path) {
  if (!isOwnBannerPath(userId, path)) {
    return { ok: false, status: 400, error: "INVALID_BANNER_PATH" };
  }
  const storage = getSupabaseAdminClient().storage.from(BUCKET);
  const name = path.split("/").at(-1);
  const { data, error } = await storage.list(`${userId}/banners`, {
    limit: 100, search: name,
  });
  if (error) {
    console.error("Banner verification failed:", error);
    return { ok: false, status: 502, error: "BANNER_VERIFICATION_FAILED" };
  }
  const object = data?.find((entry) => entry.name === name);
  const size = Number(object?.metadata?.size || 0);
  if (!object || size < 1 || size > BANNER_MAX_BYTES ||
      (object.metadata?.mimetype && object.metadata.mimetype !== "image/jpeg")) {
    return { ok: false, status: 400, error: "INVALID_BANNER_FILE" };
  }
  const { data: publicData } = storage.getPublicUrl(path);
  if (!publicData?.publicUrl) {
    return { ok: false, status: 502, error: "BANNER_URL_FAILED" };
  }
  return { ok: true, publicUrl: publicData.publicUrl };
}
