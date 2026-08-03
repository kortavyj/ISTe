import { guardRequest } from "../lib/requestGuard.js";
import {
  mapOwnerRpcError,
  requireOwner,
} from "../lib/ownerRequest.js";
import {
  isUuid,
  readJsonBody,
  readQueryString,
} from "../lib/requestBody.js";

const ALLOWED_ROLES = new Set([
  "user",
  "editor",
  "admin",
]);

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

  return response.status(guard.status).json({
    ok: false,
    error: guard.error,
    message:
      "Запрос отклонён сервером.",
  });
}

async function getOwner(
  request,
  response,
) {
  const owner = await requireOwner(
    request,
    response,
  );

  if (!owner.ok) {
    response.status(owner.status).json({
      ok: false,
      error: owner.error,
      message: owner.message,
    });

    return null;
  }

  return owner;
}

async function handleUsers(
  request,
  response,
) {
  const guard = guardRequest(request, {
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

  const owner = await getOwner(
    request,
    response,
  );

  if (!owner) {
    return;
  }

  const search = readQueryString(
    request.query?.search,
    100,
  );

  try {
    const {
      data,
      error,
    } = await owner.supabase.rpc(
      "owner_list_users",
      {
        p_search: search,
        p_limit: 100,
        p_offset: 0,
      },
    );

    if (error) {
      console.error(
        "Owner list users error:",
        error,
      );

      const mapped = mapOwnerRpcError(
        error,
        "Не удалось загрузить пользователей.",
      );

      return response
        .status(mapped.status)
        .json({
          ok: false,
          error: mapped.error,
          message: mapped.message,
        });
    }

    return response.status(200).json({
      ok: true,
      users: Array.isArray(data)
        ? data
        : [],
    });
  } catch (error) {
    console.error(
      "Unexpected owner users error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось загрузить пользователей.",
    });
  }
}

async function handleAudit(
  request,
  response,
) {
  const guard = guardRequest(request, {
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

  const owner = await getOwner(
    request,
    response,
  );

  if (!owner) {
    return;
  }

  try {
    const {
      data,
      error,
    } = await owner.supabase.rpc(
      "owner_list_audit_log",
      {
        p_limit: 100,
        p_offset: 0,
      },
    );

    if (error) {
      console.error(
        "Owner audit log error:",
        error,
      );

      const mapped = mapOwnerRpcError(
        error,
        "Не удалось загрузить журнал действий.",
      );

      return response
        .status(mapped.status)
        .json({
          ok: false,
          error: mapped.error,
          message: mapped.message,
        });
    }

    return response.status(200).json({
      ok: true,
      audit: Array.isArray(data)
        ? data
        : [],
    });
  } catch (error) {
    console.error(
      "Unexpected owner audit error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось загрузить журнал действий.",
    });
  }
}

async function handleUpdateRole(
  request,
  response,
) {
  const guard = guardRequest(request, {
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

  const body = readJsonBody(request);

  if (!body) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      message:
        "Некорректный формат запроса.",
    });
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
    return response.status(400).json({
      ok: false,
      error: "TARGET_REQUIRED",
      message:
        "Пользователь не выбран.",
    });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_ROLE",
      message:
        "Выбрана недопустимая роль.",
    });
  }

  const owner = await getOwner(
    request,
    response,
  );

  if (!owner) {
    return;
  }

  try {
    const {
      data,
      error,
    } = await owner.supabase.rpc(
      "owner_update_user_role",
      {
        p_user_id: userId,
        p_role: role,
      },
    );

    if (error) {
      console.error(
        "Owner update role error:",
        error,
      );

      const mapped = mapOwnerRpcError(
        error,
        "Не удалось изменить роль пользователя.",
      );

      return response
        .status(mapped.status)
        .json({
          ok: false,
          error: mapped.error,
          message: mapped.message,
        });
    }

    return response.status(200).json({
      ok: true,
      result: data ?? null,
    });
  } catch (error) {
    console.error(
      "Unexpected owner role error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось изменить роль пользователя.",
    });
  }
}

async function handleSetBlocked(
  request,
  response,
) {
  const guard = guardRequest(request, {
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

  const body = readJsonBody(request);

  if (!body) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      message:
        "Некорректный формат запроса.",
    });
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
    return response.status(400).json({
      ok: false,
      error: "TARGET_REQUIRED",
      message:
        "Пользователь не выбран.",
    });
  }

  if (typeof isBlocked !== "boolean") {
    return response.status(400).json({
      ok: false,
      error: "INVALID_BLOCK_STATE",
      message:
        "Некорректное состояние блокировки.",
    });
  }

  if (reason.length > 500) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_REASON",
      message:
        "Причина блокировки слишком длинная.",
    });
  }

  const owner = await getOwner(
    request,
    response,
  );

  if (!owner) {
    return;
  }

  try {
    const {
      data,
      error,
    } = await owner.supabase.rpc(
      "owner_set_user_blocked",
      {
        p_user_id: userId,
        p_is_blocked: isBlocked,
        p_reason: isBlocked
          ? reason
          : "",
      },
    );

    if (error) {
      console.error(
        "Owner set blocked error:",
        error,
      );

      const mapped = mapOwnerRpcError(
        error,
        isBlocked
          ? "Не удалось заблокировать пользователя."
          : "Не удалось разблокировать пользователя.",
      );

      return response
        .status(mapped.status)
        .json({
          ok: false,
          error: mapped.error,
          message: mapped.message,
        });
    }

    return response.status(200).json({
      ok: true,
      result: data ?? null,
    });
  } catch (error) {
    console.error(
      "Unexpected owner block error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось изменить блокировку пользователя.",
    });
  }
}

export default async function handler(
  request,
  response,
) {
  const rawAction =
    Array.isArray(request.query?.action)
      ? request.query.action[0]
      : request.query?.action;

  const action =
    typeof rawAction === "string"
      ? rawAction.trim().toLowerCase()
      : "";

  if (action === "users") {
    return handleUsers(
      request,
      response,
    );
  }

  if (action === "audit") {
    return handleAudit(
      request,
      response,
    );
  }

  if (action === "update-role") {
    return handleUpdateRole(
      request,
      response,
    );
  }

  if (action === "set-blocked") {
    return handleSetBlocked(
      request,
      response,
    );
  }

  return response.status(404).json({
    ok: false,
    error: "OWNER_ROUTE_NOT_FOUND",
    message:
      "Маршрут панели владельца не найден.",
  });
}
