import { guardRequest } from "../server/apiLib/requestGuard.js";
import { requireOwner } from "../server/apiLib/ownerRequest.js";
import { readJsonBody } from "../server/apiLib/requestBody.js";
import { validateTournamentDraft } from "../server/apiLib/tournamentValidation.js";

// Owner-only API. Mutations fail closed until a separately audited, protected
// database RPC is deployed and the explicit server-side rollout flag is enabled.
// Uses the existing HttpOnly session, verified owner role and MFA AAL2.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const isCreate = request.method === "POST";
  const guard = guardRequest(request, {
    methods: ["GET", "POST"],
    requireJson: isCreate,
    requireOrigin: isCreate,
    maxBodyBytes: 8192,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({
      ok: false,
      error: guard.error,
    });
  }

  const owner = await requireOwner(request, response);
  if (!owner.ok) {
    return response.status(owner.status).json({
      ok: false,
      error: owner.error,
      message: owner.message,
    });
  }

  if (isCreate) {
    if (process.env.ISTE_TOURNAMENT_WRITES_ENABLED !== "true") {
      return response.status(503).json({
        ok: false,
        error: "TOURNAMENT_WRITES_DISABLED",
        message: "Создание турниров пока не включено.",
      });
    }

    const body = readJsonBody(request);
    const validation = validateTournamentDraft(body);
    if (!validation.ok) {
      return response.status(400).json({
        ok: false,
        error: validation.error,
        message: "Проверьте данные турнира.",
      });
    }

    try {
      // A separate SECURITY DEFINER RPC must re-check owner + AAL2 in SQL.
      // Never fall back to direct table INSERT or service-role on RPC errors.
      const { data, error } = await owner.supabase.rpc(
        "iste_owner_create_tournament",
        { p_draft: validation.value },
      );
      if (error) {
        if (error.code === "PGRST202" || error.code === "42883") {
          return response.status(503).json({
            ok: false,
            error: "TOURNAMENT_WRITE_RPC_NOT_INSTALLED",
            message: "Серверное создание турниров ещё не настроено.",
          });
        }
        return response.status(502).json({
          ok: false,
          error: "TOURNAMENT_CREATE_FAILED",
          message: "Создать турнир не удалось.",
        });
      }
      return response.status(201).json({ ok: true, tournament: data });
    } catch {
      return response.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Временная ошибка сервера турниров.",
      });
    }
  }

  try {
    const { data, error } = await owner.supabase
      .from("iste_tournaments")
      .select("id,slug,title,game,format,best_of,capacity,timezone,registration_start,registration_end,starts_at,status,published_at,created_at,updated_at")
      // This user-scoped client can only read published rows under current RLS.
      .not("published_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // The SQL migration is deliberately not applied to production yet.
      if (error.code === "42P01" || error.code === "PGRST205") {
        return response.status(503).json({
          ok: false,
          error: "TOURNAMENT_SCHEMA_NOT_INSTALLED",
          message: "Турнирная база ещё не подключена. Записи не изменены.",
        });
      }
      return response.status(502).json({
        ok: false,
        error: "TOURNAMENT_READ_FAILED",
        message: "Не удалось прочитать список турниров.",
      });
    }

    return response.status(200).json({
      ok: true,
      tournaments: Array.isArray(data) ? data : [],
      readOnly: true,
      scope: "published_only",
    });
  } catch {
    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Временная ошибка сервера турниров.",
    });
  }
}
