const API = "https://open.faceit.com/data/v4";
const ACADEMY_NICKS = ["E34-M50B25", "S1Zapooo", "DETT3N", "SaDaMXynBceM", "syro_S"];
const TIMEOUT_MS = 8000;

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace("%", "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

async function faceit(path, key) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(API + path, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`FACEIT HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getPlayer(nickname, key) {
  const player = await faceit(`/players?nickname=${encodeURIComponent(nickname)}&game=cs2`, key);
  if (player.nickname?.toLowerCase() !== nickname.toLowerCase() || !player.player_id) {
    throw new Error("FACEIT identity mismatch");
  }
  const game = player.games?.cs2 || {};
  let lifetime = {};
  try {
    const stats = await faceit(`/players/${encodeURIComponent(player.player_id)}/stats/cs2`, key);
    lifetime = stats.lifetime || {};
  } catch (error) {
    console.warn("Academy FACEIT lifetime stats unavailable:", nickname, error.message);
  }
  return {
    nickname, playerId: player.player_id,
    avatar: typeof player.avatar === "string" && player.avatar.startsWith("https://") ? player.avatar : null,
    country: player.country || null,
    level: numeric(game.skill_level),
    elo: numeric(game.faceit_elo),
    kd: numeric(lifetime["Average K/D Ratio"] ?? lifetime["K/D Ratio"]),
    winRate: numeric(lifetime["Win Rate %"] ?? lifetime["Win Rate"]),
    matches: numeric(lifetime.Matches),
    faceitUrl: `https://www.faceit.com/ru/players/${encodeURIComponent(nickname)}`,
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }
  const key = process.env.FACEIT_API_KEY?.trim();
  if (!key) return response.status(503).json({ ok: false, error: "FACEIT_NOT_CONFIGURED" });
  const results = await Promise.allSettled(ACADEMY_NICKS.map((nickname) => getPlayer(nickname, key)));
  const players = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!players.length) {
    console.error("Academy FACEIT profiles unavailable:", results.map((r) => r.status === "rejected" ? String(r.reason?.message || r.reason) : "ok"));
    return response.status(502).json({ ok: false, error: "FACEIT_UNAVAILABLE" });
  }
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
  return response.status(200).json({ ok: true, players });
}
