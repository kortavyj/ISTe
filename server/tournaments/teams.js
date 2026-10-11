import { guardRequest } from "../../api/lib/requestGuard.js";
import { readAuthCookies, setAuthCookies } from "../../api/lib/authCookies.js";
import { readJsonBody, isUuid } from "../../api/lib/requestBody.js";
import { getSupabaseServerClient } from "../../api/lib/supabaseServer.js";

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
    .select("role,is_blocked").eq("user_id", data.user.id).maybeSingle();
  if (roleError || role?.is_blocked === true) return null;
  return { ...data.user, isOwner: role?.role === "owner" };
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
    if (method === "POST" && body?.action === "join-team") {
      const user = await currentUser(request, response, supabase);
      if (!user) return send(response,401,"AUTH_REQUIRED","Войдите в аккаунт.");
      if (!isUuid(body?.teamId)) return send(response,400,"INVALID_TEAM","Неверная команда.");
      const {data:team,error:teamError}=await supabase.from("tournament_teams")
        .select("id").eq("id",body.teamId).eq("tournament_id",tournamentId).maybeSingle();
      if(teamError)throw teamError;
      if(!team)return send(response,404,"TEAM_NOT_FOUND","Команда не найдена.");
      const {error}=await supabase.rpc("iste_add_team_player",{p_team_id:body.teamId,p_user_id:user.id});
      if(error){
        if(/TEAM_FULL|PLAYER_ALREADY_IN_TOURNAMENT|REGISTRATION_CLOSED|ALREADY_CAPTAIN/.test(error.message||""))
          return send(response,409,"JOIN_UNAVAILABLE","Невозможно вступить в эту команду.");
        if(/ACCOUNT_BLOCKED|INVALID_PLAYER|CAPTAIN_REQUIRED/.test(error.message||""))
          return send(response,403,"FORBIDDEN","Регистрация отклонена.");
        throw error;
      }
      return response.status(200).json({ok:true});
    }
    if (method === "GET") {
      const { data, error } = await supabase.from("tournament_teams")
        .select("id,tournament_id,name,created_at").eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true }).limit(64);
      if (error) throw error;
      return response.status(200).json({ ok: true, teams: data });
    }
    const user = await currentUser(request, response, supabase);
    if (!user) return send(response, 401, "AUTH_REQUIRED", "Необходимо войти в аккаунт.");
    const join = body?.join === true;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 60) {
      return send(response, 400, "INVALID_TEAM", "Название команды должно содержать от 2 до 60 символов.");
    }
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments").select("id,owner_user_id,status")
      .eq("id", tournamentId).maybeSingle();
    if (tournamentError) throw tournamentError;
    const ownerAdding = !join && user.isOwner && tournament?.owner_user_id === user.id
      && ["draft", "registration"].includes(tournament.status);
    const captainJoining = join && tournament?.status === "registration";
    if (!ownerAdding && !captainJoining) {
      return send(response, 403, "FORBIDDEN", "Регистрация закрыта или нет прав на добавление команды.");
    }
    const { data, error } = await supabase.from("tournament_teams")
      .insert({ tournament_id: tournamentId, name, ...(join ? { captain_user_id: user.id } : {}) })
      .select("id,tournament_id,name,created_at").single();
    if (error?.code === "23505") return send(response, 409, "TEAM_EXISTS", "Название занято или вы уже капитан команды в этом турнире.");
    if (error?.code === "42501") return send(response, 403, "FORBIDDEN", "У вас нет прав на регистрацию.");
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
