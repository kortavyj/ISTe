import { guardRequest } from "../apiLib/requestGuard.js";
import { readAuthCookies, clearAuthCookies, setAuthCookies } from "../apiLib/authCookies.js";
import { getSupabaseServerClient } from "../apiLib/supabaseServer.js";

function fail(response, status, code, message) {
  return response.status(status).json({ ok: false, error: code, message });
}

async function signedInClient(request, response) {
  const { accessToken, refreshToken } = readAuthCookies(request);
  if (!refreshToken) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken || refreshToken,
    refresh_token: refreshToken,
  });
  if (error || !data?.user || !data?.session) {
    clearAuthCookies(response);
    return null;
  }
  setAuthCookies(response, data.session);
  const { data: role, error: roleError } = await supabase.from("user_roles")
    .select("is_blocked").eq("user_id", data.user.id).maybeSingle();
  if (roleError || role?.is_blocked) return null;
  return { supabase, userId: data.user.id };
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");
  const guard = guardRequest(request, {
    methods: ["GET", "POST", "DELETE"],
    requireJson: request.method === "POST",
    requireOrigin: request.method !== "GET",
    maxBodyBytes: 1024,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return fail(response, guard.status, guard.error, "Запрос отклонён сервером.");
  }

  try {
    const session = await signedInClient(request, response);
    if (!session) return fail(response, 401, "AUTH_REQUIRED", "Увійдіть в акаунт ISTe.");
    const { supabase, userId } = session;
    const table = "iste_tournament_alert_subscriptions";

    if (request.method === "DELETE") {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) return fail(response, 502, "SUBSCRIPTION_UPDATE_FAILED", "Не вдалося відписатися.");
      return response.status(200).json({ ok: true, subscribed: false });
    }

    if (request.method === "POST") {
      const action = request.body?.action;
      if (action === "subscribe") {
        const { error } = await supabase.from(table).insert({ user_id: userId });
        if (error && error.code !== "23505") {
          return fail(response, 502, "SUBSCRIPTION_UPDATE_FAILED", "Не вдалося зберегти підписку.");
        }
        return response.status(200).json({ ok: true, subscribed: true });
      }
      if (action === "mark_seen") {
        const { error } = await supabase.from(table)
          .update({ last_seen_at: new Date().toISOString() }).eq("user_id", userId);
        if (error) return fail(response, 502, "NOTIFICATION_UPDATE_FAILED", "Не вдалося оновити сповіщення.");
        return response.status(200).json({ ok: true });
      }
      return fail(response, 400, "INVALID_ACTION", "Невідома дія.");
    }

    const { data: subscription, error: subscriptionError } = await supabase.from(table)
      .select("subscribed_at,last_seen_at").eq("user_id", userId).maybeSingle();
    if (subscriptionError) return fail(response, 502, "SUBSCRIPTION_READ_FAILED", "Не вдалося завантажити підписку.");
    if (!subscription) return response.status(200).json({ ok: true, subscribed: false, notifications: [], unread: 0 });

    const { data: tournaments, error } = await supabase.from("iste_tournaments")
      .select("id,title,slug,published_at,starts_at,status")
      .not("published_at", "is", null)
      .gte("published_at", subscription.subscribed_at)
      .not("status", "in", '("draft","cancelled")')
      .order("published_at", { ascending: false })
      .limit(20);
    if (error) return fail(response, 502, "ANNOUNCEMENTS_READ_FAILED", "Не вдалося завантажити анонси.");

    const notifications = (tournaments || []).map((event) => ({
      id: event.id,
      title: event.title,
      publishedAt: event.published_at,
      startsAt: event.starts_at,
      url: "/tournaments#published-tournaments",
    }));
    const unread = notifications.filter((item) => item.publishedAt > subscription.last_seen_at).length;
    return response.status(200).json({ ok: true, subscribed: true, unread, notifications });
  } catch {
    return fail(response, 500, "INTERNAL_SERVER_ERROR", "Тимчасова помилка сповіщень.");
  }
}
