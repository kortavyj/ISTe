import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "./supabaseAdmin.js";
import { enforceShowcaseMutationRateLimit } from "./authSecurity.js";

const BUCKET = "member-showcase";
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_TITLE = 100;
const MAX_BODY = 3000;
const MAX_COMMENT = 600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failure(status, error, message) {
  return { status, payload: { ok: false, error, message } };
}

function success(result) {
  return { status: 200, payload: { ok: true, ...result } };
}

export function validateShowcaseInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "INVALID_SHOWCASE" };
  }
  if (typeof input.title !== "string" || typeof input.body !== "string") {
    return { ok: false, error: "INVALID_SHOWCASE" };
  }
  const title = input.title.trim();
  const body = input.body.trim();
  const imagePath = input.imagePath === null || input.imagePath === ""
    ? null : input.imagePath;
  if (title.length > MAX_TITLE || body.length > MAX_BODY
      || (imagePath !== null && typeof imagePath !== "string")
      || (!body && !imagePath)) {
    return { ok: false, error: "INVALID_SHOWCASE" };
  }
  return { ok: true, title, body, imagePath };
}

export function validateCommentInput(text) {
  if (typeof text !== "string") return { ok: false };
  const body = text.trim();
  return { ok: body.length >= 2 && body.length <= MAX_COMMENT, body };
}

export function isOwnShowcaseImagePath(userId, path) {
  if (typeof userId !== "string" || !UUID.test(userId) || typeof path !== "string") return false;
  return new RegExp(`^${userId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$`, "i").test(path);
}

async function checkMutationQuota(userId, action) {
  const rate = await enforceShowcaseMutationRateLimit(userId, action);
  return rate.allowed ? null : failure(
    429, "SHOWCASE_RATE_LIMITED", `Забагато дій. Спробуйте через ${rate.retryAfterSeconds} с.`,
  );
}

async function targetProfile(account, body) {
  const raw = body?.accountNumber;
  if (raw === undefined || raw === null || raw === "") {
    return { id: account.user.id };
  }
  const number = String(raw);
  if (!/^\d{1,18}$/.test(number)) return null;
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("profiles")
    .select("id, account_number").eq("account_number", number).maybeSingle();
  if (error || !data) return null;
  const { data: roles, error: accessError } = await admin.from("user_roles")
    .select("is_blocked").eq("user_id", data.id).maybeSingle();
  if (accessError || !roles || roles.is_blocked === true) return null;
  return data;
}

async function verifyImage(userId, path) {
  if (!isOwnShowcaseImagePath(userId, path)) {
    return failure(400, "INVALID_SHOWCASE_IMAGE", "Недопустиме зображення вітрини.");
  }
  const storage = getSupabaseAdminClient().storage.from(BUCKET);
  const name = path.split("/").at(-1);
  const { data, error } = await storage.list(userId, { limit: 100, search: name });
  if (error) return failure(502, "SHOWCASE_IMAGE_UNAVAILABLE", "Не вдалося перевірити фото.");
  const object = (data || []).find((item) => item.name === name);
  const bytes = Number(object?.metadata?.size || 0);
  const mime = object?.metadata?.mimetype;
  if (!object || !(bytes > 0 && bytes <= MAX_IMAGE_BYTES) || mime !== "image/jpeg") {
    return failure(400, "INVALID_SHOWCASE_IMAGE", "Фото не знайдено або воно має неправильний формат.");
  }
  return null;
}

function publicImageUrl(path) {
  if (!path) return null;
  return getSupabaseAdminClient().storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || null;
}

async function getShowcase(account, body) {
  const target = await targetProfile(account, body);
  if (!target) return failure(404, "PROFILE_NOT_FOUND", "Профіль не знайдено.");
  const { data: showcase, error } = await account.supabase.from("member_showcases")
    .select("owner_id,title,body,image_path,updated_at")
    .eq("owner_id", target.id).maybeSingle();
  if (error) throw error;

  let comments = [];
  {
    const { data, error: commentsError } = await account.supabase
      .from("member_showcase_comments")
      .select("id,author_id,body,created_at")
      .eq("profile_id", target.id)
      .order("created_at", { ascending: false })
      .limit(40);
    if (commentsError) throw commentsError;
    const authors = [...new Set((data || []).map((c) => c.author_id))];
    const admin = getSupabaseAdminClient();
    let authorMap = new Map();
    if (authors.length > 0) {
      const { data: profiles, error: authorError } = await admin.from("profiles")
        .select("id,display_name,username,avatar_url,is_verified")
        .in("id", authors);
      if (authorError) throw authorError;
      authorMap = new Map((profiles || []).map((p) => [p.id, p]));
    }
    comments = (data || []).reverse().map((comment) => {
      const author = authorMap.get(comment.author_id);
      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        authorName: author?.display_name || author?.username || "ISTe",
        authorAvatar: author?.avatar_url || null,
        authorVerified: author?.is_verified === true,
        canDelete: comment.author_id === account.user.id
          || target.id === account.user.id
          || account.access?.role === "owner",
      };
    });
  }
  return success({
    isOwner: target.id === account.user.id,
    showcase: showcase ? {
      title: showcase.title,
      body: showcase.body,
      imagePath: target.id === account.user.id ? showcase.image_path : null,
      imageUrl: publicImageUrl(showcase.image_path),
      updatedAt: showcase.updated_at,
    } : null,
    comments,
  });
}

async function saveShowcase(account, body) {
  const input = validateShowcaseInput(body);
  if (!input.ok) return failure(400, input.error, "Текст до 3000 символів або фото є обов'язковими.");
  const rateError = await checkMutationQuota(account.user.id, "showcase-save");
  if (rateError) return rateError;
  if (input.imagePath) {
    const imageError = await verifyImage(account.user.id, input.imagePath);
    if (imageError) return imageError;
  }
  const { data, error } = await account.supabase.from("member_showcases")
    .upsert({
      owner_id: account.user.id,
      title: input.title,
      body: input.body,
      image_path: input.imagePath,
    }, { onConflict: "owner_id" })
    .select("owner_id").maybeSingle();
  if (error || !data) {
    console.error("Showcase save:", error);
    return failure(502, "SHOWCASE_SAVE_FAILED", "Не вдалося зберегти вітрину.");
  }
  return success({ saved: true });
}

async function uploadShowcaseImage(account, body) {
  const bytes = Number(body?.fileSize);
  if (body?.fileType !== "image/jpeg" || !Number.isInteger(bytes) || bytes < 1 || bytes > MAX_IMAGE_BYTES) {
    return failure(400, "INVALID_SHOWCASE_IMAGE", "Завантажте JPEG до 1,5 МБ.");
  }
  const rateError = await checkMutationQuota(account.user.id, "showcase-image-upload");
  if (rateError) return rateError;
  const path = `${account.user.id}/${randomUUID()}.jpg`;
  const { data, error } = await getSupabaseAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error("Showcase upload prepare:", error);
    return failure(502, "SHOWCASE_UPLOAD_FAILED", "Не вдалося підготувати фото.");
  }
  return success({ path, token: data.token });
}

async function addComment(account, body) {
  const target = await targetProfile(account, body);
  if (!target) return failure(404, "PROFILE_NOT_FOUND", "Профіль не знайдено.");
  const text = validateCommentInput(body?.text);
  if (!text.ok) return failure(400, "INVALID_COMMENT", "Коментар має містити від 2 до 600 символів.");
  const rateError = await checkMutationQuota(account.user.id, "showcase-comment-add");
  if (rateError) return rateError;
  const { data, error } = await account.supabase.from("member_showcase_comments")
    .insert({ profile_id: target.id, author_id: account.user.id, body: text.body })
    .select("id").maybeSingle();
  if (error) {
    if (error.code === "P0001") return failure(429, "COMMENT_COOLDOWN", "Зачекайте 15 секунд перед наступним коментарем.");
    if (error.code === "23503") return failure(404, "PROFILE_NOT_FOUND", "Профіль не знайдено.");
    console.error("Showcase comment insert:", error);
    return failure(502, "COMMENT_SAVE_FAILED", "Не вдалося додати коментар.");
  }
  return success({ commentId: data?.id });
}

async function deleteComment(account, body) {
  const id = body?.commentId;
  if (typeof id !== "string" || !UUID.test(id)) {
    return failure(400, "INVALID_COMMENT_ID", "Недопустимий коментар.");
  }
  const { data, error } = await account.supabase.from("member_showcase_comments")
    .delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Showcase comment delete:", error);
    return failure(502, "COMMENT_DELETE_FAILED", "Не вдалося видалити коментар.");
  }
  if (!data) return failure(403, "COMMENT_DELETE_FORBIDDEN", "Немає доступу до коментаря.");
  return success({ deleted: true });
}

async function deleteShowcase(account) {
  const { error } = await account.supabase.from("member_showcases")
    .delete().eq("owner_id", account.user.id);
  if (error) {
    console.error("Showcase delete:", error);
    return failure(502, "SHOWCASE_DELETE_FAILED", "Не вдалося видалити вітрину.");
  }
  return success({ deleted: true });
}

export async function handleMemberShowcase(account, action, body) {
  try {
    switch (action) {
      case "showcase-get": return await getShowcase(account, body);
      case "showcase-save": return await saveShowcase(account, body);
      case "showcase-delete": return await deleteShowcase(account);
      case "showcase-image-upload": return await uploadShowcaseImage(account, body);
      case "showcase-comment-add": return await addComment(account, body);
      case "showcase-comment-delete": return await deleteComment(account, body);
      default: return failure(400, "INVALID_SHOWCASE_ACTION", "Недопустима дія.");
    }
  } catch (error) {
    console.error("Member showcase action failed:", error);
    return failure(503, "SHOWCASE_UNAVAILABLE", "Сервіс вітрини тимчасово недоступний.");
  }
}
