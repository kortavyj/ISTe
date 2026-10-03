import { randomBytes } from "node:crypto";

import { guardRequest } from "../api/lib/requestGuard.js";
import { readJsonBody, readQueryString } from "../api/lib/requestBody.js";
import { requireRosterAccess } from "./lib/rosterRequest.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const STATUS_VALUES = new Set([
  "main",
  "substitute",
  "trial",
  "benched",
  "inactive",
  "left",
]);

const ROLE_VALUES = new Set([
  "IGL",
  "AWP",
  "RIFLER",
  "ENTRY",
  "SUPPORT",
  "LURKER",
  "COACH",
]);

const ROSTER_COLUMNS = [
  "id",
  "faceit_player_id",
  "nickname",
  "display_name",
  "real_name",
  "real_name_uk",
  "real_name_en",
  "roster_status",
  "player_role",
  "is_captain",
  "sort_order",
  "country",
  "faceit_url",
  "portrait_url",
  "socials",
  "faceit_level_override",
  "faceit_elo_override",
  "faceit_win_rate_override",
  "faceit_kd_override",
  "notes",
  "strengths",
  "public_visible",
  "created_at",
  "updated_at",
].join(", ");

function sendError(response, status, error, message, extra = {}) {
  return response.status(status).json({
    ok: false,
    error,
    message,
    ...extra,
  });
}

function sendGuardError(response, guard) {
  if (guard.allow) {
    response.setHeader("Allow", guard.allow);
  }

  return sendError(
    response,
    guard.status,
    guard.error,
    "Запрос отклонён сервером.",
  );
}

function isMissingRosterTable(error) {
  const source = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    source.includes("42p01") ||
    source.includes("pgrst205") ||
    source.includes("iste_roster") &&
      source.includes("not found")
  );
}

function normalizePlayer(row) {
  return {
    id: row.id,
    faceitPlayerId: row.faceit_player_id || "",
    nickname: row.nickname || "",
    displayName: row.display_name || row.nickname || "",
    realName: row.real_name || "",
    realNameUk: row.real_name_uk || "",
    realNameEn: row.real_name_en || "",
    status: row.roster_status || "trial",
    role: row.player_role || "RIFLER",
    isCaptain: row.is_captain === true,
    sortOrder: Number(row.sort_order) || 0,
    country: row.country || "",
    faceitUrl: row.faceit_url || "",
    portraitUrl: row.portrait_url || "",
    socials: Array.isArray(row.socials) ? row.socials : [],
    faceitLevelOverride:
      Number.isFinite(row.faceit_level_override)
        ? Number(row.faceit_level_override)
        : null,
    faceitEloOverride:
      Number.isFinite(row.faceit_elo_override)
        ? Number(row.faceit_elo_override)
        : null,
    faceitWinRateOverride:
      Number.isFinite(row.faceit_win_rate_override)
        ? Number(row.faceit_win_rate_override)
        : null,
    faceitKdOverride:
      Number.isFinite(row.faceit_kd_override)
        ? Number(row.faceit_kd_override)
        : null,
    notes: row.notes || "",
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    publicVisible: row.public_visible !== false,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function optionalNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : null;
}

function isValidHttpsUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSocials(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set([
    "twitch",
    "telegram",
    "instagram",
    "steam",
    "tiktok",
  ]);

  return value
    .map((item) => ({
      type:
        typeof item?.type === "string"
          ? item.type.trim().toLowerCase()
          : "",
      url:
        typeof item?.url === "string"
          ? item.url.trim()
          : "",
    }))
    .filter(
      (item) =>
        allowed.has(item.type) &&
        item.url &&
        isValidHttpsUrl(item.url),
    )
    .slice(0, 5);
}

function readPlayerInput(body) {
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const faceitPlayerId =
    typeof body?.faceitPlayerId === "string"
      ? body.faceitPlayerId.trim()
      : "";
  const nickname =
    typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const displayName =
    typeof body?.displayName === "string"
      ? body.displayName.trim()
      : "";
  const realName =
    typeof body?.realName === "string" ? body.realName.trim() : "";
  const realNameUk =
    typeof body?.realNameUk === "string" ? body.realNameUk.trim() : "";
  const realNameEn =
    typeof body?.realNameEn === "string" ? body.realNameEn.trim() : "";
  const status =
    typeof body?.status === "string"
      ? body.status.trim().toLowerCase()
      : "";
  const role =
    typeof body?.role === "string"
      ? body.role.trim().toUpperCase()
      : "";
  const country =
    typeof body?.country === "string"
      ? body.country.trim().toLowerCase()
      : "";
  const faceitUrl =
    typeof body?.faceitUrl === "string"
      ? body.faceitUrl.trim()
      : "";
  const portraitUrl =
    typeof body?.portraitUrl === "string"
      ? body.portraitUrl.trim()
      : "";
  const socials =
    normalizeSocials(body?.socials);
  const faceitLevelOverride =
    optionalNumber(
      body?.faceitLevelOverride,
    );
  const faceitEloOverride =
    optionalNumber(
      body?.faceitEloOverride,
    );
  const faceitWinRateOverride =
    optionalNumber(
      body?.faceitWinRateOverride,
    );
  const faceitKdOverride =
    optionalNumber(
      body?.faceitKdOverride,
    );
  const notes =
    typeof body?.notes === "string" ? body.notes.trim() : "";
  const sortOrder = Number(body?.sortOrder ?? 100);
  const isCaptain = body?.isCaptain === true;
  const publicVisible = body?.publicVisible !== false;

  const strengths = Array.isArray(body?.strengths)
    ? body.strengths
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  if (!nickname || nickname.length > 64) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NICKNAME",
      message: "Укажи корректный ник игрока.",
    };
  }

  if (!displayName || displayName.length > 64) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_DISPLAY_NAME",
      message: "Укажи отображаемое имя.",
    };
  }

  if (!STATUS_VALUES.has(status)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_ROSTER_STATUS",
      message: "Выбран недопустимый статус игрока.",
    };
  }

  if (!ROLE_VALUES.has(role)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_PLAYER_ROLE",
      message: "Выбрана недопустимая игровая роль.",
    };
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < -1000 ||
    sortOrder > 10000
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_SORT_ORDER",
      message: "Некорректный порядок игрока.",
    };
  }

  if (
    realName.length > 100 ||
    realNameUk.length > 100 ||
    realNameEn.length > 100 ||
    notes.length > 2500
  ) {
    return {
      ok: false,
      status: 400,
      error: "ROSTER_TEXT_TOO_LONG",
      message: "Имя или заметка слишком длинные.",
    };
  }

  if (country && !/^[a-z]{2}$/.test(country)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_COUNTRY",
      message: "Код страны должен содержать две латинские буквы.",
    };
  }

  if (faceitUrl) {
    try {
      const url = new URL(faceitUrl);
      if (url.protocol !== "https:" || !url.hostname.endsWith("faceit.com")) {
        throw new Error("invalid");
      }
    } catch {
      return {
        ok: false,
        status: 400,
        error: "INVALID_FACEIT_URL",
        message: "Укажи корректную ссылку FACEIT.",
      };
    }
  }

  if (
    portraitUrl &&
    !isValidHttpsUrl(portraitUrl)
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_PORTRAIT_URL",
      message: "Укажи корректную HTTPS-ссылку на фото.",
    };
  }

  if (
    faceitLevelOverride !== null &&
    (
      !Number.isInteger(faceitLevelOverride) ||
      faceitLevelOverride < 1 ||
      faceitLevelOverride > 10
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_FACEIT_LEVEL",
      message: "FACEIT level должен быть от 1 до 10.",
    };
  }

  if (
    faceitEloOverride !== null &&
    (
      !Number.isInteger(faceitEloOverride) ||
      faceitEloOverride < 0 ||
      faceitEloOverride > 10000
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_FACEIT_ELO",
      message: "Некорректный FACEIT ELO.",
    };
  }

  if (
    faceitWinRateOverride !== null &&
    (
      faceitWinRateOverride < 0 ||
      faceitWinRateOverride > 100
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_FACEIT_WIN_RATE",
      message: "Winrate должен быть от 0 до 100.",
    };
  }

  if (
    faceitKdOverride !== null &&
    (
      faceitKdOverride < 0 ||
      faceitKdOverride > 10
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_FACEIT_KD",
      message: "Некорректный K/D.",
    };
  }

  return {
    ok: true,
    player: {
      id,
      faceit_player_id: faceitPlayerId || null,
      nickname,
      display_name: displayName,
      real_name: realName,
      real_name_uk: realNameUk,
      real_name_en: realNameEn,
      roster_status: status,
      player_role: role,
      is_captain: isCaptain,
      sort_order: sortOrder,
      country,
      faceit_url: faceitUrl,
      portrait_url: portraitUrl,
      socials,
      faceit_level_override:
        faceitLevelOverride,
      faceit_elo_override:
        faceitEloOverride,
      faceit_win_rate_override:
        faceitWinRateOverride,
      faceit_kd_override:
        faceitKdOverride,
      notes,
      strengths,
      public_visible: publicVisible,
    },
  };
}

async function getRosterAccess(request, response) {
  const access = await requireRosterAccess(request, response);

  if (!access.ok) {
    sendError(response, access.status, access.error, access.message);
    return null;
  }

  return access;
}

async function handleList(request, response) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const access = await getRosterAccess(request, response);
  if (!access) return;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("iste_roster")
      .select(ROSTER_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("nickname", { ascending: true });

    if (error) {
      if (isMissingRosterTable(error)) {
        return response.status(200).json({
          ok: true,
          setupRequired: true,
          players: [],
          migration: "supabase/20261003_roster_manager_v1.sql",
        });
      }

      throw error;
    }

    return response.status(200).json({
      ok: true,
      setupRequired: false,
      players: Array.isArray(data) ? data.map(normalizePlayer) : [],
    });
  } catch (error) {
    console.error("Roster list error:", error);

    return sendError(
      response,
      500,
      "ROSTER_LOAD_FAILED",
      "Не удалось загрузить Roster Manager.",
    );
  }
}

async function clearOtherCaptains(supabase, currentId) {
  let query = supabase
    .from("iste_roster")
    .update({ is_captain: false })
    .eq("roster_status", "main")
    .eq("is_captain", true);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { error } = await query;
  if (error) throw error;
}

async function handleSave(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 24 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const access = await getRosterAccess(request, response);
  if (!access) return;

  const input = readPlayerInput(readJsonBody(request));
  if (!input?.ok) {
    return sendError(
      response,
      input?.status || 400,
      input?.error || "INVALID_ROSTER_PLAYER",
      input?.message || "Некорректные данные игрока.",
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const player = input.player;

    if (
      player.is_captain &&
      player.roster_status === "main"
    ) {
      await clearOtherCaptains(supabase, player.id || "");
    }

    let query;

    if (player.id) {
      const { id, ...changes } = player;
      query = supabase
        .from("iste_roster")
        .update(changes)
        .eq("id", id)
        .select(ROSTER_COLUMNS)
        .single();
    } else {
      const { id, ...insert } = player;
      query = supabase
        .from("iste_roster")
        .insert(insert)
        .select(ROSTER_COLUMNS)
        .single();
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingRosterTable(error)) {
        return sendError(
          response,
          409,
          "ROSTER_SETUP_REQUIRED",
          "Сначала примени миграцию Roster Manager в Supabase.",
          {
            migration: "supabase/20261003_roster_manager_v1.sql",
          },
        );
      }

      throw error;
    }

    return response.status(200).json({
      ok: true,
      player: normalizePlayer(data),
    });
  } catch (error) {
    console.error("Roster save error:", error);

    return sendError(
      response,
      500,
      "ROSTER_SAVE_FAILED",
      "Не удалось сохранить изменения игрока.",
    );
  }
}

async function handleImportFaceit(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 48 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const access = await getRosterAccess(request, response);
  if (!access) return;

  const body = readJsonBody(request);
  const players = Array.isArray(body?.players) ? body.players : [];

  if (players.length < 1 || players.length > 30) {
    return sendError(
      response,
      400,
      "INVALID_FACEIT_IMPORT",
      "Нет данных FACEIT для импорта.",
    );
  }

  const rows = players
    .map((player, index) => {
      const nickname = String(player?.nickname || "").trim();
      if (!nickname) return null;

      return {
        faceit_player_id: String(player?.playerId || "").trim() || null,
        nickname,
        display_name: nickname,
        real_name: "",
        real_name_uk: "",
        real_name_en: "",
        roster_status: "trial",
        player_role: String(player?.role || "RIFLER")
          .trim()
          .toUpperCase(),
        is_captain: false,
        sort_order: 200 + index * 10,
        country: String(player?.country || "").trim().toLowerCase(),
        faceit_url: String(player?.faceitUrl || "").trim(),
        portrait_url: String(player?.avatar || "").trim(),
        socials: [],
        faceit_level_override:
          Number.isFinite(player?.level)
            ? Number(player.level)
            : null,
        faceit_elo_override:
          Number.isFinite(player?.elo)
            ? Number(player.elo)
            : null,
        faceit_win_rate_override:
          Number.isFinite(player?.winRate)
            ? Number(player.winRate)
            : null,
        faceit_kd_override:
          Number.isFinite(player?.kd)
            ? Number(player.kd)
            : null,
        notes: "Импортировано из текущих данных FACEIT.",
        strengths: [],
        public_visible: false,
      };
    })
    .filter(Boolean)
    .map((row) => ({
      ...row,
      player_role: ROLE_VALUES.has(row.player_role)
        ? row.player_role
        : "RIFLER",
    }));

  try {
    const supabase = getSupabaseAdminClient();

    const withFaceitId = rows.filter((row) => row.faceit_player_id);
    const withoutFaceitId = rows.filter((row) => !row.faceit_player_id);

    if (withFaceitId.length) {
      const { error } = await supabase
        .from("iste_roster")
        .upsert(withFaceitId, {
          onConflict: "faceit_player_id",
          ignoreDuplicates: true,
        });

      if (error) throw error;
    }

    if (withoutFaceitId.length) {
      const { error } = await supabase
        .from("iste_roster")
        .insert(withoutFaceitId);

      if (error) throw error;
    }

    return response.status(200).json({
      ok: true,
      imported: rows.length,
    });
  } catch (error) {
    console.error("Roster FACEIT import error:", error);

    if (isMissingRosterTable(error)) {
      return sendError(
        response,
        409,
        "ROSTER_SETUP_REQUIRED",
        "Сначала примени миграцию Roster Manager в Supabase.",
        {
          migration: "supabase/20261003_roster_manager_v1.sql",
        },
      );
    }

    return sendError(
      response,
      500,
      "ROSTER_IMPORT_FAILED",
      "Не удалось импортировать игроков FACEIT.",
    );
  }
}

async function handleUploadPhoto(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 2_200_000,
  });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const access =
    await getRosterAccess(
      request,
      response,
    );

  if (!access) return;

  const body =
    readJsonBody(request);

  const mimeType =
    typeof body?.mimeType === "string"
      ? body.mimeType.trim().toLowerCase()
      : "";

  const data =
    typeof body?.data === "string"
      ? body.data.trim()
      : "";

  const fileName =
    typeof body?.fileName === "string"
      ? body.fileName.trim()
      : "player";

  const allowedMimeTypes =
    new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

  if (
    !allowedMimeTypes.has(
      mimeType,
    ) ||
    !data
  ) {
    return sendError(
      response,
      400,
      "INVALID_ROSTER_IMAGE",
      "Поддерживаются JPG, PNG и WEBP.",
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
      1_572_864
  ) {
    return sendError(
      response,
      413,
      "ROSTER_IMAGE_TOO_LARGE",
      "Фото должно быть не больше 1.5 MB.",
    );
  }

  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";

  const safeBase =
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
      .slice(0, 48) ||
    "player";

  const path =
    `players/${Date.now()}-${randomBytes(6).toString("hex")}-${safeBase}.${extension}`;

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      error,
    } = await supabase
      .storage
      .from("iste-roster")
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
      .from("iste-roster")
      .getPublicUrl(path);

    const publicUrl =
      publicData?.publicUrl ||
      "";

    if (!publicUrl) {
      throw new Error(
        "PUBLIC_URL_MISSING",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        portraitUrl:
          publicUrl,
      });
  } catch (error) {
    console.error(
      "Roster photo upload error:",
      error,
    );

    return sendError(
      response,
      500,
      "ROSTER_IMAGE_UPLOAD_FAILED",
      "Не удалось загрузить фото игрока.",
    );
  }
}

export default async function rosterHandler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");

  const rawAction = Array.isArray(request.query?.action)
    ? request.query.action[0]
    : request.query?.action;

  const action =
    typeof rawAction === "string"
      ? rawAction.trim().toLowerCase()
      : "list";

  if (action === "list") {
    return handleList(request, response);
  }

  if (action === "save") {
    return handleSave(request, response);
  }

  if (action === "import-faceit") {
    return handleImportFaceit(request, response);
  }

  if (action === "upload-photo") {
    return handleUploadPhoto(
      request,
      response,
    );
  }

  return sendError(
    response,
    404,
    "ROSTER_ACTION_NOT_FOUND",
    "Операция Roster Manager не найдена.",
  );
}
