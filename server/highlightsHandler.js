import { randomBytes } from "node:crypto";

import { requireAdminOrOwner } from "../api/lib/ownerRequest.js";
import { guardRequest } from "../api/lib/requestGuard.js";
import {
  isUuid,
  readJsonBody,
  readQueryString,
} from "../api/lib/requestBody.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const COLUMNS = [
  "id",
  "title_uk",
  "title_en",
  "description_uk",
  "description_en",
  "video_url",
  "thumbnail_url",
  "highlight_type",
  "player_faceit_id",
  "player_name",
  "match_label",
  "match_date",
  "featured",
  "published",
  "sort_order",
  "created_by",
  "created_at",
  "updated_at",
].join(", ");

const TYPES = new Set([
  "highlight",
  "clutch",
  "ace",
  "mvp",
  "best_moments",
]);

function sendError(
  response,
  status,
  error,
  message,
) {
  return response
    .status(status)
    .json({
      ok: false,
      error,
      message,
    });
}

function sendGuardError(
  response,
  guard,
) {
  if (guard.allow) {
    response.setHeader(
      "Allow",
      guard.allow,
    );
  }

  return sendError(
    response,
    guard.status,
    guard.error,
    "Запит відхилено сервером.",
  );
}

function normalize(row) {
  return {
    id: row.id,
    titleUk:
      row.title_uk || "",
    titleEn:
      row.title_en || "",
    descriptionUk:
      row.description_uk || "",
    descriptionEn:
      row.description_en || "",
    videoUrl:
      row.video_url || "",
    thumbnailUrl:
      row.thumbnail_url || "",
    highlightType:
      row.highlight_type ||
      "highlight",
    playerFaceitId:
      row.player_faceit_id ||
      "",
    playerName:
      row.player_name || "",
    matchLabel:
      row.match_label || "",
    matchDate:
      row.match_date || null,
    featured:
      row.featured === true,
    published:
      row.published === true,
    sortOrder:
      Number(row.sort_order) ||
      0,
    createdBy:
      row.created_by || null,
    createdAt:
      row.created_at || null,
    updatedAt:
      row.updated_at || null,
  };
}

function isHttpsUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:" &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function cleanText(
  value,
  maxLength,
) {
  return typeof value === "string"
    ? value
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength)
    : "";
}

function readHighlightInput(
  body,
) {
  const id =
    typeof body?.id === "string"
      ? body.id.trim()
      : "";

  const titleUk =
    cleanText(
      body?.titleUk,
      120,
    );

  const titleEn =
    cleanText(
      body?.titleEn,
      120,
    );

  const descriptionUk =
    typeof body?.descriptionUk ===
      "string"
      ? body.descriptionUk
          .trim()
          .slice(0, 500)
      : "";

  const descriptionEn =
    typeof body?.descriptionEn ===
      "string"
      ? body.descriptionEn
          .trim()
          .slice(0, 500)
      : "";

  const videoUrl =
    typeof body?.videoUrl ===
      "string"
      ? body.videoUrl.trim()
      : "";

  const thumbnailUrl =
    typeof body?.thumbnailUrl ===
      "string"
      ? body.thumbnailUrl.trim()
      : "";

  const highlightType =
    typeof body?.highlightType ===
      "string"
      ? body.highlightType
          .trim()
          .toLowerCase()
      : "highlight";

  const playerFaceitId =
    cleanText(
      body?.playerFaceitId,
      100,
    );

  const playerName =
    cleanText(
      body?.playerName,
      80,
    );

  const matchLabel =
    cleanText(
      body?.matchLabel,
      140,
    );

  const rawMatchDate =
    typeof body?.matchDate ===
      "string"
      ? body.matchDate.trim()
      : "";

  const featured =
    body?.featured === true;

  const published =
    body?.published === true;

  const sortOrder =
    Number(
      body?.sortOrder ?? 0,
    );

  if (
    id &&
    !isUuid(id)
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_HIGHLIGHT_ID",
      message:
        "Некоректний ID хайлайту.",
    };
  }

  if (
    titleUk.length < 2 ||
    titleEn.length < 2
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "HIGHLIGHT_TITLE_REQUIRED",
      message:
        "Заповніть назву українською та англійською.",
    };
  }

  if (
    !isHttpsUrl(
      videoUrl,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_HIGHLIGHT_VIDEO_URL",
      message:
        "Вкажіть коректне HTTPS-посилання на відео.",
    };
  }

  if (
    thumbnailUrl &&
    !isHttpsUrl(
      thumbnailUrl,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_HIGHLIGHT_THUMBNAIL_URL",
      message:
        "Вкажіть коректне HTTPS-посилання на прев'ю.",
    };
  }

  if (
    !TYPES.has(
      highlightType,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_HIGHLIGHT_TYPE",
      message:
        "Обрано некоректний тип хайлайту.",
    };
  }

  if (
    !Number.isInteger(
      sortOrder,
    ) ||
    sortOrder < -1000 ||
    sortOrder > 1000
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "INVALID_HIGHLIGHT_SORT_ORDER",
      message:
        "Порядок має бути від -1000 до 1000.",
    };
  }

  let matchDate = null;

  if (rawMatchDate) {
    const parsed =
      new Date(
        rawMatchDate,
      );

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return {
        ok: false,
        status: 400,
        error:
          "INVALID_HIGHLIGHT_MATCH_DATE",
        message:
          "Некоректна дата матчу.",
      };
    }

    matchDate =
      parsed.toISOString();
  }

  return {
    ok: true,
    id,
    titleUk,
    titleEn,
    descriptionUk,
    descriptionEn,
    videoUrl,
    thumbnailUrl,
    highlightType,
    playerFaceitId,
    playerName,
    matchLabel,
    matchDate,
    featured,
    published,
    sortOrder,
  };
}

async function requireManager(
  request,
  response,
) {
  const access =
    await requireAdminOrOwner(
      request,
      response,
    );

  if (!access.ok) {
    sendError(
      response,
      access.status,
      access.error,
      access.message,
    );

    return null;
  }

  return access;
}

async function handlePublic(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["GET"],
      requireJson: false,
      requireOrigin: false,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const limitValue =
    Number(
      readQueryString(
        request.query?.limit,
        3,
      ) || 0,
    );

  const limit =
    Number.isInteger(
      limitValue,
    ) &&
    limitValue > 0
      ? Math.min(
          limitValue,
          50,
        )
      : 50;

  response.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=120",
  );

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("iste_highlights")
      .select(COLUMNS)
      .eq(
        "published",
        true,
      )
      .order(
        "featured",
        {
          ascending: false,
        },
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(limit);

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        highlights:
          Array.isArray(data)
            ? data.map(
                normalize,
              )
            : [],
      });
  } catch (error) {
    console.error(
      "Public highlights error:",
      error,
    );

    return sendError(
      response,
      500,
      "HIGHLIGHTS_LOAD_FAILED",
      "Не вдалося завантажити хайлайти.",
    );
  }
}

async function handleList(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["GET"],
      requireJson: false,
      requireOrigin: false,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const access =
    await requireManager(
      request,
      response,
    );

  if (!access) return;

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("iste_highlights")
      .select(COLUMNS)
      .order(
        "updated_at",
        {
          ascending: false,
        },
      )
      .limit(300);

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        highlights:
          Array.isArray(data)
            ? data.map(
                normalize,
              )
            : [],
      });
  } catch (error) {
    console.error(
      "Highlights manager list error:",
      error,
    );

    return sendError(
      response,
      500,
      "HIGHLIGHTS_ADMIN_LOAD_FAILED",
      "Не вдалося завантажити хайлайти.",
    );
  }
}

async function handleSave(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["POST"],
      requireJson: true,
      requireOrigin: true,
      maxBodyBytes: 32 * 1024,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const access =
    await requireManager(
      request,
      response,
    );

  if (!access) return;

  const input =
    readHighlightInput(
      readJsonBody(request),
    );

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  const payload = {
    title_uk:
      input.titleUk,
    title_en:
      input.titleEn,
    description_uk:
      input.descriptionUk,
    description_en:
      input.descriptionEn,
    video_url:
      input.videoUrl,
    thumbnail_url:
      input.thumbnailUrl,
    highlight_type:
      input.highlightType,
    player_faceit_id:
      input.playerFaceitId,
    player_name:
      input.playerName,
    match_label:
      input.matchLabel,
    match_date:
      input.matchDate,
    featured:
      input.featured,
    published:
      input.published,
    sort_order:
      input.sortOrder,
    updated_at:
      new Date()
        .toISOString(),
  };

  try {
    const supabase =
      getSupabaseAdminClient();

    let query;

    if (input.id) {
      query =
        supabase
          .from(
            "iste_highlights",
          )
          .update(payload)
          .eq(
            "id",
            input.id,
          );
    } else {
      query =
        supabase
          .from(
            "iste_highlights",
          )
          .insert({
            ...payload,
            created_by:
              access.user.id,
          });
    }

    const {
      data,
      error,
    } = await query
      .select(COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        highlight:
          normalize(data),
      });
  } catch (error) {
    console.error(
      "Highlights save error:",
      error,
    );

    return sendError(
      response,
      500,
      "HIGHLIGHT_SAVE_FAILED",
      "Не вдалося зберегти хайлайт.",
    );
  }
}

async function handleDelete(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["POST"],
      requireJson: true,
      requireOrigin: true,
      maxBodyBytes: 8 * 1024,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const access =
    await requireManager(
      request,
      response,
    );

  if (!access) return;

  const body =
    readJsonBody(request);

  const id =
    typeof body?.id ===
      "string"
      ? body.id.trim()
      : "";

  if (!isUuid(id)) {
    return sendError(
      response,
      400,
      "INVALID_HIGHLIGHT_ID",
      "Некоректний ID хайлайту.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const { error } =
      await supabase
        .from(
          "iste_highlights",
        )
        .delete()
        .eq(
          "id",
          id,
        );

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Highlights delete error:",
      error,
    );

    return sendError(
      response,
      500,
      "HIGHLIGHT_DELETE_FAILED",
      "Не вдалося видалити хайлайт.",
    );
  }
}

async function handleUploadThumbnail(
  request,
  response,
) {
  const guard =
    guardRequest(request, {
      methods: ["POST"],
      requireJson: true,
      requireOrigin: true,
      maxBodyBytes:
        3 * 1024 * 1024,
    });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const access =
    await requireManager(
      request,
      response,
    );

  if (!access) return;

  const body =
    readJsonBody(request);

  const mimeType =
    typeof body?.mimeType ===
      "string"
      ? body.mimeType
          .trim()
          .toLowerCase()
      : "";

  const data =
    typeof body?.data ===
      "string"
      ? body.data.trim()
      : "";

  const fileName =
    cleanText(
      body?.fileName,
      80,
    ) ||
    "highlight";

  const allowed =
    new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

  if (
    !allowed.has(
      mimeType,
    ) ||
    !data
  ) {
    return sendError(
      response,
      400,
      "INVALID_HIGHLIGHT_IMAGE",
      "Підтримуються JPG, PNG та WEBP.",
    );
  }

  let bytes;

  try {
    bytes =
      Buffer.from(
        data,
        "base64",
      );
  } catch {
    bytes = null;
  }

  if (
    !bytes?.length ||
    bytes.length >
      2_097_152
  ) {
    return sendError(
      response,
      413,
      "HIGHLIGHT_IMAGE_TOO_LARGE",
      "Прев'ю має бути не більше 2 MB.",
    );
  }

  const extension =
    mimeType ===
    "image/png"
      ? "png"
      : mimeType ===
          "image/webp"
        ? "webp"
        : "jpg";

  const base =
    fileName
      .replace(
        /\.[^.]+$/,
        "",
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        48,
      ) ||
    "highlight";

  const path =
    `thumbnails/${Date.now()}-${randomBytes(6).toString("hex")}-${base}.${extension}`;

  try {
    const supabase =
      getSupabaseAdminClient();

    const { error } =
      await supabase
        .storage
        .from(
          "iste-highlights",
        )
        .upload(
          path,
          bytes,
          {
            contentType:
              mimeType,
            cacheControl:
              "31536000",
            upsert: false,
          },
        );

    if (error) {
      throw error;
    }

    const {
      data: publicData,
    } = supabase
      .storage
      .from(
        "iste-highlights",
      )
      .getPublicUrl(path);

    const thumbnailUrl =
      publicData?.publicUrl ||
      "";

    if (!thumbnailUrl) {
      throw new Error(
        "HIGHLIGHT_PUBLIC_URL_MISSING",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        thumbnailUrl,
      });
  } catch (error) {
    console.error(
      "Highlight thumbnail upload error:",
      error,
    );

    return sendError(
      response,
      500,
      "HIGHLIGHT_IMAGE_UPLOAD_FAILED",
      "Не вдалося завантажити прев'ю.",
    );
  }
}

export default async function highlightsHandler(
  request,
  response,
) {
  const rawAction =
    Array.isArray(
      request.query?.action,
    )
      ? request.query.action[0]
      : request.query?.action;

  const action =
    typeof rawAction ===
      "string"
      ? rawAction
          .trim()
          .toLowerCase()
      : "public";

  if (
    action === "public"
  ) {
    return handlePublic(
      request,
      response,
    );
  }

  if (
    action === "list"
  ) {
    return handleList(
      request,
      response,
    );
  }

  if (
    action === "save"
  ) {
    return handleSave(
      request,
      response,
    );
  }

  if (
    action === "delete"
  ) {
    return handleDelete(
      request,
      response,
    );
  }

  if (
    action ===
    "upload-thumbnail"
  ) {
    return handleUploadThumbnail(
      request,
      response,
    );
  }

  return sendError(
    response,
    404,
    "HIGHLIGHTS_ACTION_NOT_FOUND",
    "Дію для хайлайтів не знайдено.",
  );
}
