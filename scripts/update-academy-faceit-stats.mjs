import { mkdir, writeFile } from "node:fs/promises";
const key = process.env.FACEIT_API_KEY?.trim();
if (!key) throw new Error("FACEIT_API_KEY missing from GitHub Actions secrets");
const playersToSync = [{ nickname: "ivan1love", faceitNickname: "ivan1love" }, ...["S1Zapooo", "DETT3N", "AGREGAT", "syro_S"].map(nickname => ({ nickname, faceitNickname: nickname }))];
const base = "https://open.faceit.com/data/v4";
const asNumber = (v) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(String(v).replace("%", "").replace(",", "."))) ? Number(String(v).replace("%", "").replace(",", ".")) : null;
async function get(path) {
  const res = await fetch(base + path, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`FACEIT ${res.status} for ${path.split("?")[0]}`);
  return res.json();
}
const players = [];
for (const { nickname, faceitNickname } of playersToSync) {
  try {
    const user = await get(`/players?nickname=${encodeURIComponent(faceitNickname)}&game=cs2`);
    if (!user.player_id || user.nickname?.toLowerCase() !== faceitNickname.toLowerCase()) throw new Error("Player nickname mismatch");
    let lifetime = {};
    try { lifetime = (await get(`/players/${encodeURIComponent(user.player_id)}/stats/cs2`)).lifetime || {}; }
    catch (e) { console.warn("FACEIT lifetime unavailable", nickname, e.message); }
    const game = user.games?.cs2 || {};
    players.push({
      nickname, playerId: user.player_id, country: user.country || null,
      avatar: typeof user.avatar === "string" && user.avatar.startsWith("https://") ? user.avatar : null,
      level: asNumber(game.skill_level), elo: asNumber(game.faceit_elo),
      kd: asNumber(lifetime["Average K/D Ratio"] ?? lifetime["K/D Ratio"]),
      winRate: asNumber(lifetime["Win Rate %"] ?? lifetime["Win Rate"]),
      matches: asNumber(lifetime.Matches),
      faceitUrl: `https://www.faceit.com/ru/players/${encodeURIComponent(faceitNickname)}`,
    });
  } catch (e) {
    console.warn("Academy player unavailable", nickname, e.message);
  }
}
if (!players.length) throw new Error("No academy FACEIT profiles were verified; preserving previous data");
const output = "public/data/academy-faceit-stats.json";
await mkdir("public/data", { recursive: true });
await writeFile(output, JSON.stringify({ players }, null, 2) + "\n");
console.log("Verified Academy profiles", players.map(p=>p.nickname).join(", "));
