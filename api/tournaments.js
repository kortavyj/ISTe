import { randomBytes } from "node:crypto";
import { guardRequest } from "./lib/requestGuard.js";
import { readAuthCookies, setAuthCookies } from "./lib/authCookies.js";
import { readJsonBody } from "./lib/requestBody.js";
import { getSupabaseServerClient } from "./lib/supabaseServer.js";

const SELECT = "id,slug,title,description,format,best_of,max_teams,status,starts_at,published_at,created_at";
const allowedBo = new Set([1, 3]);
function fail(response, status, error, message) {
  return response.status(status).json({ ok: false, error, message });
}
function slugify(value) {
  const normalized = value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 55);
  return (normalized.length >= 3 ? normalized : "cs2-tournament")
    + "-" + randomBytes(4).toString("hex");
}
async function sessionForRequest(request, response, supabase) {
  const { accessToken, refreshToken } = readAuthCookies(request);
  if (!refreshToken) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
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
    maxBodyBytes: 8192,
  });
  if (!guard.ok) return fail(response, guard.status, guard.error, "Запрос отклонён.");
  try {
    const supabase = getSupabaseServerClient();
    if (method === "GET") {
      const { data, error } = await supabase.from("tournaments")
        .select(SELECT).not("published_at", "is", null)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return response.status(200).json({ok:true, tournaments:data});
    }
    const user = await sessionForRequest(request, response, supabase);
    if (!user) return fail(response, 401, "AUTH_REQUIRED", "Для создания турнира войдите в аккаунт.");
    const body = readJsonBody(request);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const bestOf = Number(body?.bestOf);
    const maxTeams = Number(body?.maxTeams);
    if (title.length < 4 || title.length > 120 || description.length > 3000
        || !allowedBo.has(bestOf) || !Number.isInteger(maxTeams)
        || maxTeams < 2 || maxTeams > 64) {
      return fail(response, 400, "VALIDATION", "Проверьте название, описание и параметры турнира.");
    }
    const { data, error } = await supabase.from("tournaments")
      .insert({
        owner_user_id: user.id,
        slug: slugify(title),
        title, description,
        format: "single_elimination",
        best_of: bestOf,
        max_teams: maxTeams,
        status: "draft",
      }).select(SELECT).single();
    if (error) throw error;
    return response.status(201).json({ok:true, tournament:data});
  } catch (error) {
    console.error("Tournament request error:", error?.code || error?.message);
    return fail(response, 503, "TOURNAMENTS_UNAVAILABLE",
      "Турнирный сервис пока недоступен. Повторите попытку позже.");
  }
}