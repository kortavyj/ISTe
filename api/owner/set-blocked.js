import { guardRequest } from "../lib/requestGuard.js";
import {
  mapOwnerRpcError,
  requireOwner,
} from "../lib/ownerRequest.js";
import {
  isUuid,
  readJsonBody,
} from "../lib/requestBody.js";

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
