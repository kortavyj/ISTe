// Pure validation for manually entered CS2 tournament match results.
// No database access; scores are tentative until the organizer confirms them.
const ALLOWED_BEST_OF = new Set([1, 3, 5]);
const ALLOWED_MAPS = new Set([
  "Ancient", "Anubis", "Dust2", "Inferno", "Mirage", "Nuke", "Overpass",
  "Train", "Vertigo"
]);

export function validateManualMatchResult(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "INVALID_BODY" };
  }
  const keys = Object.keys(input);
  if (keys.some((key) => !["bestOf", "maps"].includes(key))) {
    return { ok: false, error: "UNKNOWN_FIELD" };
  }
  const { bestOf, maps } = input;
  if (!ALLOWED_BEST_OF.has(bestOf) || !Array.isArray(maps)) {
    return { ok: false, error: "INVALID_SERIES" };
  }
  const requiredWins = (bestOf + 1) / 2;
  if (maps.length < requiredWins || maps.length > bestOf) {
    return { ok: false, error: "INVALID_MAP_COUNT" };
  }

  const seen = new Set();
  const cleanMaps = [];
  let winsA = 0;
  let winsB = 0;
  for (const [index, map] of maps.entries()) {
    if (!map || typeof map !== "object" || Array.isArray(map) ||
        Object.keys(map).some((key) => !["name", "scoreA", "scoreB"].includes(key))) {
      return { ok: false, error: "INVALID_MAP" };
    }
    const { name, scoreA, scoreB } = map;
    if (typeof name !== "string" || !ALLOWED_MAPS.has(name) || seen.has(name)) {
      return { ok: false, error: "INVALID_MAP_NAME" };
    }
    if (!Number.isSafeInteger(scoreA) || !Number.isSafeInteger(scoreB) ||
        scoreA < 0 || scoreB < 0 || scoreA > 99 || scoreB > 99 ||
        scoreA === scoreB) {
      return { ok: false, error: "INVALID_MAP_SCORE" };
    }
    if (winsA >= requiredWins || winsB >= requiredWins) {
      return { ok: false, error: "SERIES_ALREADY_DECIDED" };
    }
    seen.add(name);
    winsA += Number(scoreA > scoreB);
    winsB += Number(scoreB > scoreA);
    cleanMaps.push({ index: index + 1, name, scoreA, scoreB });
  }
  if (winsA < requiredWins && winsB < requiredWins) {
    return { ok: false, error: "SERIES_INCOMPLETE" };
  }

  return {
    ok: true,
    value: {
      bestOf,
      maps: cleanMaps,
      scoreA: winsA,
      scoreB: winsB,
      winner: winsA > winsB ? "A" : "B",
      confirmed: false
    }
  };
}
