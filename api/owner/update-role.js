import { guardRequest } from "../lib/requestGuard.js";
import {
  mapOwnerRpcError,
  requireOwner,
} from "../lib/ownerRequest.js";
import {
  isUuid,
  readJsonBody,
} from "../lib/requestBody.js";

const ALLOWED_ROLES = new Set([
  "user",
  "editor",
  "admin",
]);

export default async function handler(
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

  const owner = await requireOwner(
    request,
    response,
  );

  if (!owner.ok) {
    return response.status(owner.status).json({
      ok: false,
      error: owner.error,
      message: owner.message,
    });
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
