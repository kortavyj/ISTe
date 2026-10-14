import { guardRequest } from "../apiLib/requestGuard.js";
import { readJsonBody } from "../apiLib/requestBody.js";
import { readAuthCookies, setAuthCookies, clearAuthCookies } from "../apiLib/authCookies.js";
import { getSupabaseServerClient } from "../apiLib/supabaseServer.js";
import { validateTournamentTeamApplication } from "../apiLib/tournamentTeamRegistration.js";

// Team applications use the authenticated account as captain, not an owner
// session. Server remains fail-closed until an audited DB RPC is deployed.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["POST"], requireJson: true, requireOrigin: true, maxBodyBytes: 8192,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({ ok: false, error: guard.error });
  }

  const { accessToken, refreshToken } = readAuthCookies(request);
  if (!refreshToken) {
    clearAuthCookies(response);
    return response.status(401).json({ ok:false, error:"AUTH_REQUIRED" });
  }
  let supabase;
  let userId;
  try {
    supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken, refresh_token: refreshToken,
    });
    if (error || !data?.session || !data?.user) {
      clearAuthCookies(response);
      return response.status(401).json({ ok:false, error:"AUTH_REQUIRED" });
    }
    userId = data.user.id;
    setAuthCookies(response, data.session);
    const accessResult = await supabase.from("user_roles")
      .select("is_blocked").eq("user_id",userId).maybeSingle();
    if (accessResult.error) {
      return response.status(502).json({ ok:false,error:"ACCOUNT_CHECK_FAILED" });
    }
    if (accessResult.data?.is_blocked) {
      return response.status(403).json({ ok:false,error:"ACCOUNT_BLOCKED" });
    }
  } catch {
    return response.status(500).json({ ok:false,error:"AUTH_CHECK_FAILED" });
  }

  // Even the valid applicant has no write access before migration review.
  if (process.env.ISTE_TOURNAMENT_WRITES_ENABLED !== "true") {
    return response.status(503).json({ ok:false,error:"TOURNAMENT_WRITES_DISABLED",
      message:"Заявки команд пока не принимаются." });
  }

  const input = readJsonBody(request);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some(key=>!["tournamentId","name","members"].includes(key))) {
    return response.status(400).json({ ok:false,error:"INVALID_APPLICATION" });
  }
  const validated = validateTournamentTeamApplication({
    ...input, captainUserId: userId,
  });
  if (!validated.ok) return response.status(400).json({ ok:false,error:validated.error });

  try {
    // RPC must independently require auth.uid() as captain and validate
    // registration window, capacity and duplicate membership atomically.
    const { data, error } = await supabase.rpc("iste_apply_tournament_team",{
      p_application: {
        tournamentId: validated.value.tournamentId,
        name: validated.value.name,
        members: validated.value.members.map(({userId,faceitPlayerId})=>({userId,faceitPlayerId})),
      },
    });
    if (error) {
      if (["PGRST202","42883"].includes(error.code))
        return response.status(503).json({ok:false,error:"TEAM_APPLICATION_RPC_NOT_INSTALLED"});
      return response.status(409).json({ok:false,error:"TEAM_APPLICATION_REJECTED",
        message:"Заявку не удалось принять. Проверьте турнир и состав."});
    }
    return response.status(201).json({ok:true,application:data});
  } catch {
    return response.status(500).json({ok:false,error:"TEAM_APPLICATION_FAILED"});
  }
}
