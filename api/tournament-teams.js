import { guardRequest } from "./lib/requestGuard.js";
import { readAuthCookies, setAuthCookies } from "./lib/authCookies.js";
import { readJsonBody, isUuid } from "./lib/requestBody.js";
import { getSupabaseServerClient } from "./lib/supabaseServer.js";

function send(response, status, error, message) {
  return response.status(status).json({ ok: false, error, message });
}
async function currentUser(request, response, supabase) {
  const { accessToken, refreshToken } = readAuthCookies(request);
  if (!refreshToken) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken, refresh_token: refreshToken,
  });
  if (error || !data?.user || !data?.session) return null;
  setAuthCookies(response, data.session);
  const { data: role, error: roleError } = await supabase.from("user_roles")
    .select("is_blocked").eq("user_id", data.user.id).maybeSingle();
  if (roleError || role?.is_blocked === true) return null;
  return data.user;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  const method = request.method;
  const guard = guardRequest(request, {
    methods: ["GET", "POST"],
    requireJson: method === "POST",
    requireOrigin: method === "POST",
    maxBodyBytes: 4096,
  });
  if (!guard.ok) return send(response, guard.status, guard.error, "Запрос отклонён.");
  const body = method === "POST" ? readJsonBody(request) : null;
  const tournamentId = method === "POST" ? body?.tournamentId : request.query?.tournamentId;
  if (!isUuid(tournamentId)) return send(response, 400, "INVALID_TOURNAMENT", "Неверный идентификатор турнира.");
  try {
    const supabase = getSupabaseServerClient();
    const user = await currentUser(request, response, supabase);
    if (method === "GET") {
      const { data, error } = await supabase.from("tournament_teams")
        .select("id,tournament_id,name,created_at").eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true }).limit(64);
      if (error) throw error;
      return response.status(200).json({ ok: true, teams: data });
    }
    if (!user) return send(response, 401, "AUTH_REQUIRED", "Необходимо войти в аккаунт.");
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 60) {
      return send(response, 400, "INVALID_TEAM", "Название команды должно содержать от 2 до 60 символов.");
    }
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments").select("id,owner_user_id,status")
      .eq("id", tournamentId).maybeSingle();
    if (tournamentError) throw tournamentError;
    if (!tournament || tournament.owner_user_id !== user.id || tournament.status !== "draft") {
      return send(response, 403, "FORBIDDEN", "Добавлять команды может только организатор черновика.");
    }
    const { data, error } = await supabase.from("tournament_teams")
      .insert({ tournament_id: tournamentId, name })
      .select("id,tournament_id,name,created_at").single();
    if (error?.code === "23505") return send(response, 409, "TEAM_EXISTS", "Команда с таким названием уже есть.");
    if (error?.message?.includes("TOURNAMENT_FULL")) {
      return send(response, 409, "TOURNAMENT_FULL", "Достигнут лимит команд.");
    }
    if (error) throw error;
    return response.status(201).json({ ok: true, team: data });
  } catch (error) {
    console.error("Tournament teams request:", error?.code || error?.message);
    return send(response, 503, "TEAMS_UNAVAILABLE", "Сервис команд временно недоступен.");
  }
}
