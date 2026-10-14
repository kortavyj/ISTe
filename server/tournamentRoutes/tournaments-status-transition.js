import { guardRequest } from "../apiLib/requestGuard.js";
import { requireOwner } from "../apiLib/ownerRequest.js";
import { readJsonBody, isUuid } from "../apiLib/requestBody.js";

const NEXT = Object.freeze({
  draft: "registration",
  registration: "checkin",
  checkin: "live",
  live: "finished",
});

// All status mutations require owner MFA, an explicit expected state,
// and a DB-side transaction. Never update tournaments directly.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");
  const guard = guardRequest(request, {
    methods: ["POST"], requireJson: true, requireOrigin: true, maxBodyBytes: 1024,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({ ok: false, error: guard.error });
  }
  const owner = await requireOwner(request, response);
  if (!owner.ok) return response.status(owner.status).json({
    ok: false, error: owner.error, message: owner.message,
  });
  if (process.env.ISTE_TOURNAMENT_WRITES_ENABLED !== "true")
    return response.status(503).json({ ok: false, error: "TOURNAMENT_WRITES_DISABLED" });

  const body = readJsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some(key => !["tournamentId", "expectedStatus", "nextStatus"].includes(key)) ||
      !isUuid(body.tournamentId) || NEXT[body.expectedStatus] !== body.nextStatus) {
    return response.status(400).json({ ok: false, error: "INVALID_STATUS_TRANSITION" });
  }
  try {
    const { data, error } = await owner.supabase.rpc("iste_owner_transition_tournament", {
      p_tournament_id: body.tournamentId,
      p_expected_status: body.expectedStatus,
      p_next_status: body.nextStatus,
    });
    if (error) {
      if (["PGRST202", "42883"].includes(error.code))
        return response.status(503).json({ ok: false, error: "STATUS_RPC_NOT_INSTALLED" });
      return response.status(409).json({
        ok: false, error: "STATUS_TRANSITION_REJECTED",
        message: "Проверьте текущий статус, состав команд и готовность матчей.",
      });
    }
    return response.status(200).json({ ok: true, tournament: data });
  } catch {
    return response.status(500).json({ ok: false, error: "STATUS_TRANSITION_FAILED" });
  }
}
