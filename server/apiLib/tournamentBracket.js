// Pure single-elimination bracket logic: deterministic seeded pairing,
// optional byes, immutable rounds, and explicit confirmation before advancing.
// No database writes. This is a foundation for an audited owner RPC.
export function createSingleEliminationBracket(teams, capacity) {
  if (!Array.isArray(teams) || !Number.isInteger(capacity) ||
      capacity < 2 || capacity > 128 || (capacity & (capacity - 1)) !== 0 ||
      teams.length < 2 || teams.length > capacity) {
    throw new Error("INVALID_BRACKET_INPUT");
  }
  const ids = teams.map(t => t?.id);
  if (ids.some(id => typeof id !== "string" || !id.trim()) ||
      new Set(ids).size !== ids.length) throw new Error("INVALID_TEAM_IDS");
  const seeded = teams.map((team, index) => ({
    id: team.id, seed: team.seed ?? index + 1
  }));
  if (seeded.some(t => !Number.isInteger(t.seed) || t.seed < 1 || t.seed > capacity) ||
      new Set(seeded.map(t => t.seed)).size !== seeded.length) {
    throw new Error("INVALID_SEEDS");
  }
  const bySeed = new Map(seeded.map(t => [t.seed, t.id]));
  let order = [1, 2];
  for (let size = 4; size <= capacity; size *= 2) {
    order = order.flatMap(seed => [seed, size + 1 - seed]);
  }
  const first = order.map(seed => bySeed.get(seed) ?? null);
  const rounds = [];
  for (let size = capacity, round = 0; size >= 2; size /= 2, round++) {
    rounds.push(Array.from({ length: size / 2 }, (_, slot) => ({
      id: `r${round}-m${slot}`, round, slot,
      teamA: round === 0 ? first[slot * 2] : null,
      teamB: round === 0 ? first[slot * 2 + 1] : null,
      winner: null, confirmed: false
    })));
  }
  // An empty seed slot is a bye only in round one. Advance it without
  // claiming a played/confirmed result; do not auto-play later rounds.
  const next = rounds[1];
  if (next) {
    rounds[0].forEach((m, i) => {
      if (Boolean(m.teamA) !== Boolean(m.teamB)) {
        const winner = m.teamA || m.teamB;
        m.winner = winner;
        const target = next[Math.floor(i / 2)];
        if (i % 2 === 0) target.teamA = winner;
        else target.teamB = winner;
      }
    });
  }
  return rounds;
}

export function confirmBracketWinner(rounds, matchId, winnerId) {
  if (!Array.isArray(rounds) || typeof matchId !== "string" ||
      typeof winnerId !== "string") throw new Error("INVALID_CONFIRMATION");
  const targetRound = rounds.findIndex(round => Array.isArray(round) && round.some(m => m.id === matchId));
  if (targetRound < 0) throw new Error("MATCH_NOT_FOUND");
  const matchIndex = rounds[targetRound].findIndex(m => m.id === matchId);
  const match = rounds[targetRound][matchIndex];
  if (match.confirmed || match.winner) throw new Error("MATCH_ALREADY_DECIDED");
  if (!match.teamA || !match.teamB || ![match.teamA, match.teamB].includes(winnerId)) {
    throw new Error("INVALID_WINNER");
  }
  // Never mutate the caller's bracket, including nested match objects.
  const updated = rounds.map(round => round.map(m => ({ ...m })));
  updated[targetRound][matchIndex].winner = winnerId;
  updated[targetRound][matchIndex].confirmed = true;
  if (targetRound + 1 < updated.length) {
    const nextMatch = updated[targetRound + 1][Math.floor(matchIndex / 2)];
    const side = matchIndex % 2 === 0 ? "teamA" : "teamB";
    if (nextMatch[side] !== null) throw new Error("TARGET_SLOT_OCCUPIED");
    nextMatch[side] = winnerId;
  }
  return updated;
}
