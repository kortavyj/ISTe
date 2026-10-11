import { guardRequest } from "./lib/requestGuard.js";
import { readAuthCookies, setAuthCookies } from "./lib/authCookies.js";
import { readJsonBody, isUuid } from "./lib/requestBody.js";
import { getSupabaseServerClient } from "./lib/supabaseServer.js";

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
      .select("is_blocked").eq("user_id", session.user.id).maybeSingle();
    if (roleError || role?.is_blocked) return fail(response, 403, "FORBIDDEN", "Нет доступа.");
    const { data: tournament, error: findError } = await supabase.from("tournaments")
      .select("id,owner_user_id,status").eq("id", body.tournamentId).maybeSingle();
    if (findError) throw findError;
    if (!tournament || tournament.owner_user_id !== session.user.id) {
      return fail(response, 403, "FORBIDDEN", "Только организатор может публиковать турнир.");
    }
    if (tournament.status !== "draft") {
      return fail(response, 409, "ALREADY_PUBLISHED", "Турнир уже опубликован.");
    }
    const { data, error } = await supabase.from("tournaments")
      .update({ status: "registration", published_at: new Date().toISOString() })
      .eq("id", tournament.id).eq("status", "draft").eq("owner_user_id", session.user.id)
      .select("id,slug,title,status,published_at").maybeSingle();
    if (error) throw error;
    if (!data) return fail(response, 409, "STATUS_CHANGED", "Состояние турнира изменилось. Обновите страницу.");
    return response.status(200).json({ok:true,tournament:data});
  } catch (error) {
    console.error("Tournament action failed:", error?.code || error?.message);
    return fail(response, 503, "ACTION_UNAVAILABLE", "Не удалось опубликовать турнир.");
  }
}