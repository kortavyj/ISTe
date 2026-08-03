import { guardRequest } from "../lib/requestGuard.js";
import {
  mapOwnerRpcError,
  requireOwner,
} from "../lib/ownerRequest.js";

export default async function handler(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
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
