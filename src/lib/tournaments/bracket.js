// Deterministic first-round pairing for a single-elimination bracket.
// Byes advance automatically. Later rounds are materialized only when outcomes are confirmed.
export function nextPowerOfTwo(value) {
  if (!Number.isInteger(value) || value < 2 || value > 64) {
    throw new RangeError("Tournament must contain 2 to 64 teams.");
  }
  let n = 2;
  while (n < value) n *= 2;
  return n;
}
export function seedOrder(size) {
  if (!Number.isInteger(size) || size < 2 || size > 64 || (size & (size - 1)) !== 0) {
    throw new RangeError("Bracket size must be a power of two between 2 and 64.");
  }
  let order = [1, 2];
  while (order.length < size) {
    const limit = order.length * 2 + 1;
    order = order.flatMap(seed => [seed, limit - seed]);
  }
  return order;
}
export function createOpeningRound(teams) {
  if (!Array.isArray(teams)) throw new TypeError("Teams must be an array.");
  const size = nextPowerOfTwo(teams.length);
  const ids = teams.map(team => team?.id);
  if (ids.some(id => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    throw new TypeError("Teams require distinct, nonempty string IDs.");
  }
  const slots = seedOrder(size).map(seed => teams[seed - 1] ?? null);
  const matches = [];
  for (let index = 0; index < slots.length; index += 2) {
    const a = slots[index];
    const b = slots[index + 1];
    matches.push({
      round: 1, position: index / 2 + 1,
      teamA: a?.id ?? null, teamB: b?.id ?? null,
      status: a && b ? "scheduled" : "bye",
      winner: a && !b ? a.id : b && !a ? b.id : null,
    });
  }
  return { size, matches };
}
