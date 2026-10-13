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
    if (method === "GET") {
      const { data, error } = await supabase.from("tournament_teams")
        .select("id,tournament_id,name,player_names,player_steam_ids,created_at").eq("tournament_id", tournamentId)
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
      .from("tournaments").select("id,owner_user_id,status,team_size")
      .eq("id", tournamentId).maybeSingle();
    if (tournamentError) throw tournamentError;
    const ownerAdding = !join && user.isOwner && tournament?.owner_user_id === user.id
      && ["draft", "registration"].includes(tournament.status);
    const captainJoining = join && tournament?.status === "registration";
    if (!ownerAdding && !captainJoining) {
      return send(response, 403, "FORBIDDEN", "Регистрация закрыта или нет прав на добавление команды.");
    }
    const roster = body?.players;
    const steamIds = body?.steamIds;
    const teamSize = tournament.team_size ?? 5;
    if (teamSize === 1 || teamSize === 2) {
      if (!Array.isArray(roster) || roster.length !== teamSize
        || !roster.every(player => typeof player === "string"
          && player.trim().length >= 2 && player.trim().length <= 32)
        || new Set(roster.map(player => player.trim().toLocaleLowerCase("en"))).size !== teamSize) {
        return send(response, 400, "INVALID_ROSTER",
          "Для этого режима требуется точный состав без запасных и повторяющихся игроков.");
      }
      if (!Array.isArray(steamIds) || steamIds.length !== teamSize
        || !steamIds.every(id => typeof id === "string" && /^7656119[0-9]{10}$/.test(id))
        || new Set(steamIds).size !== teamSize) {
        return send(response, 400, "INVALID_STEAM_ROSTER",
          "Для каждого участника укажите уникальный SteamID64 из 17 цифр.");
      }
    } else if (roster !== undefined && (!Array.isArray(roster) || roster.length > 0)) {
      return send(response, 400, "ROSTER_UNSUPPORTED", "Состав 5vs5 пока не поддерживается.");
    }
    if (teamSize === 5 && steamIds !== undefined) {
      return send(response, 400, "ROSTER_UNSUPPORTED", "Привязка состава 5vs5 пока не поддерживается.");
    }
    const { data, error } = await supabase.from("tournament_teams")
      .insert({ tournament_id: tournamentId, name, player_steam_ids: teamSize < 5 ? steamIds : [], player_names: teamSize < 5 ? roster.map(player => player.trim()) : [], ...(join ? { captain_user_id: user.id } : {}) })
      .select("id,tournament_id,name,player_names,player_steam_ids,created_at").single();
    if (error?.message?.includes("ROSTER_") || error?.message?.includes("STEAM_ID_") || error?.message?.includes("STEAM_ROSTER_")) {
      return send(response, 409, "ROSTER_REJECTED",
        "Состав не соответствует правилам турнира или игрок уже зарегистрирован.");
    }
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
