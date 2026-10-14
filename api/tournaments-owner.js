import { guardRequest } from "./lib/requestGuard.js";
import { requireOwner } from "./lib/ownerRequest.js";

// Stage 2: owner-only read endpoint. No writes until approved migrations and
// transaction-safe write RPCs are tested. Uses the verified HttpOnly-cookie
// session, owner role and Supabase MFA AAL2 check already used by ISTe.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
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

  try {
    const { data, error } = await owner.supabase
      .from("iste_tournaments")
      .select("id,slug,title,game,format,best_of,capacity,timezone,registration_start,registration_end,starts_at,status,published_at,created_at,updated_at")
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
    });
  } catch {
    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Временная ошибка сервера турниров.",
    });
  }
}
