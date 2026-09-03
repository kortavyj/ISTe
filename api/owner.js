import { guardRequest } from "./lib/requestGuard.js";
import {
  mapOwnerRpcError,
  requireOwner,
} from "./lib/ownerRequest.js";
import {
  isUuid,
  readJsonBody,
  readQueryString,
} from "./lib/requestBody.js";
import shopHandler from "../server/shopHandler.js";
import discordHandler from "../server/discordHandler.js";

const ALLOWED_ROLES = new Set([
  "user",
  "editor",
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
  const owner = await requireOwner(request, response);

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

    return response.status(200).json({
      ok: true,
      users: Array.isArray(data) ? data : [],
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

  if (moduleName === "shop") {
    return shopHandler(request, response);
  }

  if (moduleName === "discord") {
    return discordHandler(request, response);
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
