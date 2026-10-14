import { guardRequest } from "../server/apiLib/requestGuard.js";
import { requireOwner } from "../server/apiLib/ownerRequest.js";
import { readJsonBody, isUuid } from "../server/apiLib/requestBody.js";
import { validateManualMatchResult } from "../server/apiLib/tournamentManualResults.js";

// Deliberately fail closed until a separately audited transactional Supabase
// RPC has been installed and tested on a nonproduction project.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8192,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({ ok: false, error: guard.error });
  }
  const owner = await requireOwner(request, response);
  if (!owner.ok) {
    return response.status(owner.status).json({
      ok: false, error: owner.error, message: owner.message,
    });
  }
  if (process.env.ISTE_TOURNAMENT_WRITES_ENABLED !== "true") {
    return response.status(503).json({
      ok: false, error: "TOURNAMENT_WRITES_DISABLED",
      message: "Подтверждение результатов отключено до проверки базы.",
    });
  }

  const input = readJsonBody(request);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some(key => !["matchId","expectedVersion","result"].includes(key)) ||
      !isUuid(input.matchId) ||
      !Number.isSafeInteger(input.expectedVersion) ||
      input.expectedVersion < 0) {
    return response.status(400).json({
      ok: false, error: "INVALID_CONFIRMATION_REQUEST",
    });
  }
  const check = validateManualMatchResult(input.result);
  if (!check.ok) {
    return response.status(400).json({ ok: false, error: check.error });
  }

  try {
    // Database RPC must lock the match, validate team/map/score invariants,
    // reject stale expectedVersion, atomically advance winner and audit.
    // The client-supplied result never decides winner without DB validation.
    const { data, error } = await owner.supabase.rpc(
      "iste_owner_confirm_match",
      { p_match_id: input.matchId, p_expected_version: input.expectedVersion,
        p_result: { bestOf: check.value.bestOf, maps: check.value.maps } },
    );
    if (error) {
      if (["PGRST202","42883"].includes(error.code)) {
        return response.status(503).json({
          ok: false, error: "MATCH_CONFIRM_RPC_NOT_INSTALLED",
          message: "Подтверждение матчей на сервере ещё не подключено.",
        });
      }
      return response.status(409).json({
        ok: false, error: "MATCH_CONFIRM_REJECTED",
        message: "Матч изменён либо результат недопустим. Обновите данные.",
      });
    }
    return response.status(200).json({ ok: true, match: data });
  } catch {
    return response.status(500).json({
      ok: false, error: "INTERNAL_SERVER_ERROR",
      message: "Не удалось подтвердить матч.",
    });
  }
}
