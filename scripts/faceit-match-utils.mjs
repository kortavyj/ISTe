function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]/gi, "");
}

function toTimestamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
}

function toIso(value) {
  const timestamp = toTimestamp(value);
  if (timestamp === null) {
    return null;
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeFaceitUrl(url, matchId) {
  if (typeof url === "string" && url.trim()) {
    return url.replace("{lang}", "ru");
  }

  return matchId ? `https://www.faceit.com/ru/cs2/room/${matchId}` : null;
}

function normalizeAvatar(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

function getTeamCandidates(teamEntry) {
  if (!teamEntry || typeof teamEntry !== "object") {
    return [];
  }

  return [
    teamEntry.team_id,
    teamEntry.faction_id,
    teamEntry.id,
    teamEntry.team?.team_id,
    teamEntry.team?.id,
  ].filter(Boolean);
}

function getRosterIds(teamEntry) {
  if (!teamEntry || typeof teamEntry !== "object") {
    return [];
  }

  const roster = Array.isArray(teamEntry.roster)
    ? teamEntry.roster
    : Array.isArray(teamEntry.players)
      ? teamEntry.players
      : [];

  return roster
    .flatMap((player) => [player?.player_id, player?.user_id, player?.id])
    .filter(Boolean);
}

function getTeamName(teamEntry, fallback = "Команда") {
  return (
    teamEntry?.name ??
    teamEntry?.nickname ??
    teamEntry?.team?.name ??
    teamEntry?.team?.nickname ??
    fallback
  );
}

function getTeamAvatar(teamEntry) {
  return normalizeAvatar(
    teamEntry?.avatar ?? teamEntry?.team?.avatar ?? teamEntry?.logo ?? teamEntry?.image,
  );
}

function isOwnTeam(teamEntry, context) {
  const candidates = getTeamCandidates(teamEntry);
  if (candidates.some((candidate) => String(candidate) === context.teamId)) {
    return true;
  }

  const entryName = normalizeText(getTeamName(teamEntry, ""));
  if (entryName && context.teamNames.has(entryName)) {
    return true;
  }

  const rosterIds = getRosterIds(teamEntry);
  const overlap = rosterIds.filter((playerId) => context.playerIds.has(String(playerId))).length;
  const requiredOverlap = rosterIds.length <= 2 ? 1 : 2;
  return overlap >= requiredOverlap;
}

function readScore(scoreSource, sideKey, teamEntry, context) {
  if (!scoreSource || typeof scoreSource !== "object") {
    return null;
  }

  const keys = [
    sideKey,
    teamEntry?.faction_id,
    teamEntry?.team_id,
    teamEntry?.id,
    context.teamId,
    getTeamName(teamEntry, ""),
  ].filter(Boolean);

  for (const key of keys) {
    const numeric = Number(scoreSource[key]);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function winnerMatchesTeam(winner, sideKey, teamEntry, context) {
  if (winner === null || winner === undefined || winner === "") {
    return false;
  }

  const normalizedWinner = normalizeText(winner);
  const candidates = [
    sideKey,
    teamEntry?.faction_id,
    teamEntry?.team_id,
    teamEntry?.id,
    context.teamId,
    getTeamName(teamEntry, ""),
  ]
    .filter(Boolean)
    .map(normalizeText);

  return candidates.includes(normalizedWinner);
}

function normalizeStatus(rawStatus) {
  const status = normalizeText(rawStatus);

  if (["finished", "completed", "past"].includes(status)) {
    return "finished";
  }

  if (["started", "ongoing", "live", "ready", "configuring"].includes(status)) {
    return "ongoing";
  }

  if (["cancelled", "canceled", "aborted"].includes(status)) {
    return "cancelled";
  }

  return "upcoming";
}

function pickMatchDate(rawMatch) {
  return (
    toIso(rawMatch?.scheduled_at) ??
    toIso(rawMatch?.started_at) ??
    toIso(rawMatch?.configured_at) ??
    toIso(rawMatch?.broadcast_start_time) ??
    toIso(rawMatch?.finished_at)
  );
}

function normalizeResult({ status, winner, ownKey, ownTeam, opponentKey, opponent, context, ownScore, opponentScore }) {
  if (status !== "finished") {
    return status === "cancelled" ? "cancelled" : "pending";
  }

  if (winnerMatchesTeam(winner, ownKey, ownTeam, context)) {
    return "win";
  }

  if (winnerMatchesTeam(winner, opponentKey, opponent, { ...context, teamId: "" })) {
    return "loss";
  }

  if (Number.isFinite(ownScore) && Number.isFinite(opponentScore)) {
    if (ownScore > opponentScore) {
      return "win";
    }

    if (ownScore < opponentScore) {
      return "loss";
    }

    return "draw";
  }

  return "unknown";
}

export function createTeamMatchContext(team, teamId) {
  const playerIds = new Set(
    (Array.isArray(team?.members) ? team.members : [])
      .flatMap((member) => [member?.player_id, member?.user_id, member?.id])
      .filter(Boolean)
      .map(String),
  );

  const teamNames = new Set(
    [team?.name, team?.nickname, "ISTe"]
      .filter(Boolean)
      .map(normalizeText)
      .filter(Boolean),
  );

  return {
    teamId: String(teamId),
    teamNames,
    playerIds,
    teamName: team?.name ?? team?.nickname ?? "ISTe",
    teamAvatar: normalizeAvatar(team?.avatar),
  };
}

export function normalizeTournamentMatch(rawMatch, tournament, context) {
  const teamEntries = Object.entries(rawMatch?.teams ?? {}).filter(([, teamEntry]) => teamEntry);
  if (teamEntries.length < 1) {
    return null;
  }

  const ownEntry = teamEntries.find(([, teamEntry]) => isOwnTeam(teamEntry, context));
  if (!ownEntry) {
    return null;
  }

  const [ownKey, ownTeam] = ownEntry;
  const opponentEntry = teamEntries.find(([key]) => key !== ownKey) ?? ["opponent", null];
  const [opponentKey, opponent] = opponentEntry;
  const scoreSource = rawMatch?.results?.score ?? rawMatch?.detailed_results?.at?.(-1)?.factions;
  const ownScore = readScore(scoreSource, ownKey, ownTeam, context);
  const opponentScore = readScore(scoreSource, opponentKey, opponent, {
    ...context,
    teamId: "",
  });
  const status = normalizeStatus(rawMatch?.status ?? rawMatch?.state);
  const winner = rawMatch?.results?.winner ?? rawMatch?.detailed_results?.at?.(-1)?.winner;
  const matchId = rawMatch?.match_id ?? rawMatch?.id ?? null;
  const result = normalizeResult({
    status,
    winner,
    ownKey,
    ownTeam,
    opponentKey,
    opponent,
    context,
    ownScore,
    opponentScore,
  });

  return {
    matchId,
    faceitUrl: normalizeFaceitUrl(rawMatch?.faceit_url, matchId),
    tournamentId: tournament?.tournament_id ?? tournament?.competition_id ?? tournament?.id ?? null,
    competitionName:
      rawMatch?.competition_name ?? tournament?.name ?? tournament?.nickname ?? "FACEIT",
    competitionType: rawMatch?.competition_type ?? tournament?.match_type ?? "tournament",
    bestOf: Number.isFinite(Number(rawMatch?.best_of)) ? Number(rawMatch.best_of) : null,
    round: Number.isFinite(Number(rawMatch?.round)) ? Number(rawMatch.round) : null,
    status,
    result,
    scheduledAt: pickMatchDate(rawMatch) ?? toIso(tournament?.started_at),
    startedAt: toIso(rawMatch?.started_at),
    finishedAt: toIso(rawMatch?.finished_at),
    ownTeam: {
      name: getTeamName(ownTeam, context.teamName),
      avatar: getTeamAvatar(ownTeam) ?? context.teamAvatar,
      score: ownScore,
    },
    opponent: {
      name: getTeamName(opponent, "Соперник не определён"),
      avatar: getTeamAvatar(opponent),
      score: opponentScore,
    },
  };
}

export function mergeTeamMatches(previousMatches, refreshedMatches, refreshedTournamentIds, fullSync) {
  const refreshedIds = new Set(refreshedTournamentIds.filter(Boolean).map(String));
  const base = fullSync
    ? []
    : (Array.isArray(previousMatches) ? previousMatches : []).filter(
        (match) => !refreshedIds.has(String(match?.tournamentId ?? "")),
      );

  const byId = new Map();
  for (const match of [...base, ...refreshedMatches]) {
    const key = match?.matchId ?? `${match?.tournamentId}:${match?.scheduledAt}:${match?.opponent?.name}`;
    if (key) {
      byId.set(String(key), match);
    }
  }

  return [...byId.values()].sort((left, right) => {
    const leftTime = new Date(left?.scheduledAt ?? left?.finishedAt ?? 0).getTime() || 0;
    const rightTime = new Date(right?.scheduledAt ?? right?.finishedAt ?? 0).getTime() || 0;
    return rightTime - leftTime;
  });
}
