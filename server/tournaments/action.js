import { guardRequest } from "../../api/lib/requestGuard.js";
import { readAuthCookies, setAuthCookies } from "../../api/lib/authCookies.js";
import { readJsonBody, isUuid } from "../../api/lib/requestBody.js";
import { getSupabaseServerClient } from "../../api/lib/supabaseServer.js";

function fail(response, status, error, message) {
  return response.status(status).json({ ok: false, error, message });
}
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  const guard = guardRequest(request, {
    methods: ["POST"], requireJson: true, requireOrigin: true, maxBodyBytes: 4096,
  });
  if (!guard.ok) return fail(response, guard.status, guard.error, "Запрос отклонён.");
  const body = readJsonBody(request);
  if (!isUuid(body?.tournamentId) || body?.action !== "publish") {
    return fail(response, 400, "INVALID_REQUEST", "Некорректный турнир или операция.");
  }
  try {
    const supabase = getSupabaseServerClient();
    const { accessToken, refreshToken } = readAuthCookies(request);
    if (!refreshToken) return fail(response, 401, "AUTH_REQUIRED", "Войдите в аккаунт.");
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken, refresh_token: refreshToken,
    });
    if (sessionError || !session?.user || !session?.session) {
      return fail(response, 401, "AUTH_REQUIRED", "Войдите в аккаунт.");
    }
    setAuthCookies(response, session.session);
    const { data: role, error: roleError } = await supabase.from("user_roles")
      .select("role,is_blocked").eq("user_id", session.user.id).maybeSingle();
    if (roleError || (role?.is_blocked || role?.role !== "owner")) return fail(response, 403, "FORBIDDEN", "Нет доступа.");
    const {data:assurance,error:assuranceError}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.session.access_token);
    if(assuranceError || assurance?.currentLevel!=="aal2") return fail(response,403,"MFA_REQUIRED","Необходимо подтвердить двухфакторную аутентификацию.");
    const { data: tournament, error: findError } = await supabase.from("tournaments")
      .select("id,owner_user_id,status").eq("id", body.tournamentId).maybeSingle();
    if (findError) throw findError;
    if (!tournament || tournament.owner_user_id !== session.user.id) {
      return fail(response, 403, "FORBIDDEN", "Только организатор может публиковать турнир.");
    }
    if (tournament.status !== "draft") {
      return fail(response, 409, "ALREADY_PUBLISHED", "Турнир уже опубликован.");
    }
    const { error } = await supabase.rpc("iste_publish_tournament", {
      p_tournament_id: tournament.id,
    });
    if (error) {
      const code = String(error.message || "");
      if (/MFA_REQUIRED|OWNER_REQUIRED|ACCOUNT_BLOCKED|AUTH_REQUIRED/.test(code))
        return fail(response, 403, "FORBIDDEN", "Недостаточно прав или требуется MFA.");
      if (/NOT_IN_DRAFT/.test(code))
        return fail(response, 409, "STATUS_CHANGED", "Турнир уже изменён.");
      throw error;
    }
    const { data, error: readError } = await supabase.from("tournaments")
      .select("id,slug,title,status,published_at").eq("id", tournament.id).single();
    if (readError) throw readError;
    return response.status(200).json({ok:true,tournament:data});
  } catch (error) {
    console.error("Tournament action failed:", error?.code || error?.message);
    return fail(response, 503, "ACTION_UNAVAILABLE", "Не удалось опубликовать турнир.");
  }
}