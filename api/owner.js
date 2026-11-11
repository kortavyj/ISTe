import { guardRequest } from "../server/apiLib/requestGuard.js";
import { requireAccount } from "./auth/session.js";
import { handleMemberShowcase } from "../server/lib/memberShowcase.js";
import {
  mapOwnerRpcError,
  requireAdminOrOwner,
} from "../server/apiLib/ownerRequest.js";
import {
  isUuid,
  readJsonBody,
  readQueryString,
} from "../server/apiLib/requestBody.js";
import shopHandler from "../server/shopHandler.js";
import discordHandler from "../server/discordHandler.js";
import botPortalHandler from "../server/botPortalHandler.js";
import highlightsHandler from "../server/highlightsHandler.js";
import rosterHandler from "../server/rosterHandler.js";
import publicRosterHandler from "../server/publicRosterHandler.js";
import publicTacticShareHandler from "../server/publicTacticShareHandler.js";
import tacticsHandler from "../server/tacticsHandler.js";

const ALLOWED_ROLES = new Set([
  "user",
  "player",
  "editor",
  "game_manager",
  "admin",
]);

function sendGuardError(response, guard) {
  if (guard.allow) {
    response.setHeader("Allow", guard.allow);
  }

  return response.status(guard.status).json({
    ok: false,
    error: guard.error,
    message: "Запрос отклонён сервером.",
  });
}

function sendError(response, status, error, message) {
  return response.status(status).json({
    ok: false,
    error,
    message,
  });
}

async function getOwner(request, response) {
  const owner = await requireAdminOrOwner(request, response);

  if (!owner.ok) {
    sendError(
      response,
      owner.status,
      owner.error,
      owner.message,
    );
    return null;
  }

  return owner;
}

async function handleUsers(request, response) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const owner = await getOwner(request, response);
  if (!owner) return;

  const search = readQueryString(request.query?.search, 100);

  try {
    const { data, error } = await owner.supabase.rpc(
      "owner_list_users",
      {
        p_search: search,
        p_limit: 100,
        p_offset: 0,
      },
    );

    if (error) {
      const mapped = mapOwnerRpcError(
        error,
        "Не удалось загрузить пользователей.",
      );

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    const users = Array.isArray(data) ? data : [];
    if (users.length === 0) {
      return response.status(200).json({ ok: true, users: [] });
    }
    const ids = users.map((entry) => entry.user_id);
    const { data: verificationRows, error: verificationError } =
      await owner.supabase.from("profiles")
        .select("id, is_verified, verification_type").in("id", ids);
    if (verificationError) {
      console.error("Owner verification list failed:", verificationError);
      return sendError(response, 502, "VERIFICATION_LIST_FAILED", "Не вдалося перевірити статуси профілів.");
    }
    const verifiedMap = new Map((verificationRows || []).map((row) => [row.id, { verified: row.is_verified === true, type: row.is_verified ? row.verification_type || "silver" : null }]));
    return response.status(200).json({
      ok: true,
      users: users.map((entry) => ({
        ...entry,
        is_verified: verifiedMap.get(entry.user_id)?.verified === true,
        verification_type: verifiedMap.get(entry.user_id)?.type || null,
      })),
    });
  } catch {
    return sendError(
      response,
      500,
      "INTERNAL_SERVER_ERROR",
      "Не удалось загрузить пользователей.",
    );
  }
}

async function handleAudit(request, response) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const owner = await getOwner(request, response);
  if (!owner) return;

  try {
    const { data, error } = await owner.supabase.rpc(
      "owner_list_audit_log",
      {
        p_limit: 100,
        p_offset: 0,
      },
    );

    if (error) {
      const mapped = mapOwnerRpcError(
        error,
        "Не удалось загрузить журнал действий.",
      );

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    return response.status(200).json({
      ok: true,
      audit: Array.isArray(data) ? data : [],
    });
  } catch {
    return sendError(
      response,
      500,
      "INTERNAL_SERVER_ERROR",
      "Не удалось загрузить журнал действий.",
    );
  }
}

async function handleUpdateRole(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const body = readJsonBody(request);
  if (!body) {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Некорректный формат запроса.",
    );
  }

  const userId =
    typeof body.userId === "string"
      ? body.userId.trim()
      : "";

  const role =
    typeof body.role === "string"
      ? body.role.trim().toLowerCase()
      : "";

  if (!isUuid(userId)) {
    return sendError(
      response,
      400,
      "TARGET_REQUIRED",
      "Пользователь не выбран.",
    );
  }

  if (!ALLOWED_ROLES.has(role)) {
    return sendError(
      response,
      400,
      "INVALID_ROLE",
      "Выбрана недопустимая роль.",
    );
  }

  const owner = await getOwner(request, response);
  if (!owner) return;

  try {
    const { data, error } = await owner.supabase.rpc(
      "owner_update_user_role",
      {
        p_user_id: userId,
        p_role: role,
      },
    );

    if (error) {
      const mapped = mapOwnerRpcError(
        error,
        "Не удалось изменить роль пользователя.",
      );

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    return response.status(200).json({
      ok: true,
      result: data ?? null,
    });
  } catch {
    return sendError(
      response,
      500,
      "INTERNAL_SERVER_ERROR",
      "Не удалось изменить роль пользователя.",
    );
  }
}

async function handleVerificationStatus(request, response) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });
  if (!guard.ok) return sendGuardError(response, guard);

  const accountNumber = Number(request.query?.accountNumber);
  if (!Number.isSafeInteger(accountNumber) || accountNumber <= 0) {
    return sendError(response, 400, "INVALID_ACCOUNT_NUMBER", "Невірний ID учасника.");
  }

  const actor = await getOwner(request, response);
  if (!actor) return;

  const { data, error } = await actor.supabase
    .from("profiles")
    .select("id, is_verified, verification_type")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (error) {
    return sendError(response, 502, "VERIFICATION_LOOKUP_FAILED", "Не вдалося отримати статус верифікації.");
  }
  if (!data) {
    return sendError(response, 404, "PROFILE_NOT_FOUND", "Профіль не знайдено.");
  }

  return response.status(200).json({
    ok: true,
    verified: data.is_verified === true,
    verificationType: data.is_verified ? data.verification_type || "silver" : null,
  });
}

async function handleSetVerified(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });
  if (!guard.ok) return sendGuardError(response, guard);

  const body = readJsonBody(request);
  const byUuid = typeof body?.userId === "string" && isUuid(body.userId);
  const accountNumber = Number(body?.accountNumber);
  const byAccountNumber = body?.accountNumber !== undefined
    && Number.isSafeInteger(accountNumber)
    && accountNumber > 0;
  if (!body || (!byUuid && !byAccountNumber) || typeof body.verified !== "boolean" || (body.verificationType !== undefined && !["red", "silver", "gold"].includes(body.verificationType))) {
    return sendError(response, 400, "INVALID_VERIFICATION_REQUEST", "Невірні дані підтвердження.");
  }

  const owner = await getOwner(request, response);
  if (!owner) return;
  if (!["owner", "admin"].includes(owner.role)) {
    return sendError(response, 403, "ADMIN_OR_OWNER_REQUIRED", "Підтверджувати профілі можуть лише власник або адміністратор ISTe.");
  }

  try {
    let userId = byUuid ? body.userId : null;
    if (!userId) {
      const { data: target, error: lookupError } = await owner.supabase
        .from("profiles")
        .select("id")
        .eq("account_number", accountNumber)
        .maybeSingle();
      if (lookupError) {
        return sendError(response, 502, "VERIFICATION_LOOKUP_FAILED", "Не вдалося знайти профіль.");
      }
      if (!target) {
        return sendError(response, 404, "PROFILE_NOT_FOUND", "Профіль не знайдено.");
      }
      userId = target.id;
    }
    const requestedType = body.verified ? (body.verificationType || "silver") : null;
    if (owner.role === "admin" && requestedType && requestedType !== "silver") {
      return sendError(response, 403, "OWNER_REQUIRED", "Червону та золоту верифікацію може видавати лише власник ISTe.");
    }
    const { data, error } = await owner.supabase.rpc("owner_set_profile_verification_type", {
      p_user_id: userId,
      p_type: requestedType,
    });
    if (error) {
      if (String(error.message || "").includes("Cannot change owner verification")) {
        return sendError(
          response,
          403,
          "OWNER_VERIFICATION_PROTECTED",
          "Адміністратор не може змінювати верифікацію власника ISTe. Це може зробити лише власник.",
        );
      }
      if (String(error.message || "").includes("Two-factor verification required")) {
        return sendError(
          response,
          403,
          "MFA_REQUIRED",
          "Потрібно підтвердити двофакторну автентифікацію.",
        );
      }
      console.error("Owner verification update failed:", error);
      const mapped = mapOwnerRpcError(error, "Не вдалося змінити підтвердження профілю.");
      return sendError(response, mapped.status, mapped.error, mapped.message);
    }
    return response.status(200).json({ ok: true, result: data });
  } catch (error) {
    console.error("Unexpected verification update error:", error);
    return sendError(response, 500, "VERIFICATION_UPDATE_FAILED", "Не вдалося змінити підтвердження профілю.");
  }
}

async function handleSetBlocked(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const body = readJsonBody(request);
  if (!body) {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Некорректный формат запроса.",
    );
  }

  const userId =
    typeof body.userId === "string"
      ? body.userId.trim()
      : "";

  const isBlocked = body.isBlocked;

  const reason =
    typeof body.reason === "string"
      ? body.reason.trim()
      : "";

  if (!isUuid(userId)) {
    return sendError(
      response,
      400,
      "TARGET_REQUIRED",
      "Пользователь не выбран.",
    );
  }

  if (typeof isBlocked !== "boolean") {
    return sendError(
      response,
      400,
      "INVALID_BLOCK_STATE",
      "Некорректное состояние блокировки.",
    );
  }

  if (reason.length > 500) {
    return sendError(
      response,
      400,
      "INVALID_REASON",
      "Причина блокировки слишком длинная.",
    );
  }

  const owner = await getOwner(request, response);
  if (!owner) return;

  try {
    const { data, error } = await owner.supabase.rpc(
      "owner_set_user_blocked",
      {
        p_user_id: userId,
        p_is_blocked: isBlocked,
        p_reason: isBlocked ? reason : "",
      },
    );

    if (error) {
      const mapped = mapOwnerRpcError(
        error,
        isBlocked
          ? "Не удалось заблокировать пользователя."
          : "Не удалось разблокировать пользователя.",
      );

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    return response.status(200).json({
      ok: true,
      result: data ?? null,
    });
  } catch {
    return sendError(
      response,
      500,
      "INTERNAL_SERVER_ERROR",
      "Не удалось изменить блокировку пользователя.",
    );
  }
}

export default async function handler(request, response) {
  const rawModule =
    Array.isArray(request.query?.module)
      ? request.query.module[0]
      : request.query?.module;

  const moduleName =
    typeof rawModule === "string"
      ? rawModule.trim().toLowerCase()
      : "";

  if (moduleName === "showcase") {
    response.setHeader("Cache-Control", "private, no-store");
    const guard = guardRequest(request, {
      methods: ["POST"], requireJson: true, requireOrigin: true, maxBodyBytes: 20 * 1024,
    });
    if (!guard.ok) return sendGuardError(response, guard);
    const body = readJsonBody(request);
    if (!body || typeof body.action !== "string") {
      return sendError(response, 400, "INVALID_SHOWCASE_REQUEST", "Недопустимі дані.");
    }
    const account = await requireAccount(request, response);
    if (!account.ok) return sendError(response, account.status, account.error, account.message);
    const result = await handleMemberShowcase(account, body.action, body);
    return response.status(result.status).json(result.payload);
  }

  if (moduleName === "shop") {
    return shopHandler(request, response);
  }

  if (moduleName === "discord") {
    return discordHandler(request, response);
  }

  if (moduleName === "bot-portal") {
    return botPortalHandler(request, response);
  }

  if (moduleName === "highlights") {
    return highlightsHandler(request, response);
  }

  if (moduleName === "roster") {
    return rosterHandler(request, response);
  }

  if (moduleName === "public-roster") {
    return publicRosterHandler(request, response);
  }

  if (moduleName === "tactics") {
    return tacticsHandler(request, response);
  }

  if (moduleName === "tactic-share") {
    return publicTacticShareHandler(request, response);
  }

  const rawAction =
    Array.isArray(request.query?.action)
      ? request.query.action[0]
      : request.query?.action;

  const action =
    typeof rawAction === "string"
      ? rawAction.trim().toLowerCase()
      : "";

  if (action === "users") {
    return handleUsers(request, response);
  }

  if (action === "audit") {
    return handleAudit(request, response);
  }

  if (action === "update-role") {
    return handleUpdateRole(request, response);
  }

  if (action === "verification-status") {
    return handleVerificationStatus(request, response);
  }

  if (action === "set-verified") {
    return handleSetVerified(request, response);
  }

  if (action === "set-blocked") {
    return handleSetBlocked(request, response);
  }

  return sendError(
    response,
    404,
    "OWNER_ROUTE_NOT_FOUND",
    "Маршрут панели владельца не найден.",
  );
}
