function playerId(player) {
  return player?.player_id ?? player?.user_id ?? player?.id ?? null;
}

function teamCandidates(teamEntry) {
  return [
    teamEntry?.team_id,
    teamEntry?.faction_id,
    teamEntry?.id,
    teamEntry?.team?.team_id,
    teamEntry?.team?.id,
  ]
    .filter(Boolean)
    .map(String);
}

function teamPlayers(teamEntry) {
  if (Array.isArray(teamEntry?.players)) {
    return teamEntry.players;
  }

  if (Array.isArray(teamEntry?.roster)) {
    return teamEntry.roster;
  }

  return [];
}

export function getTeamMemberIds(team) {
  return new Set(
    (Array.isArray(team?.members) ? team.members : [])
      .map(playerId)
      .filter(Boolean)
      .map(String),
  );
}

export function isVerifiedTeamHistoryMatch(rawMatch, teamId, memberIds) {
  const entries = Object.values(rawMatch?.teams ?? {}).filter(Boolean);
  const normalizedTeamId = String(teamId);

  for (const teamEntry of entries) {
    if (teamCandidates(teamEntry).includes(normalizedTeamId)) {
      return true;
    }
  }

  const requiredOverlap = Math.min(5, memberIds.size);
  if (requiredOverlap < 2) {
    return false;
  }

  return entries.some((teamEntry) => {
    const overlap = teamPlayers(teamEntry)
      .map(playerId)
      .filter(Boolean)
      .map(String)
      .filter((id) => memberIds.has(id)).length;

    return overlap >= requiredOverlap;
  });
}

export function historyCompetition(rawMatch) {
  const competitionId =
    rawMatch?.competition_id ?? rawMatch?.championship_id ?? rawMatch?.organizer_id ?? null;

  return {
    tournament_id: competitionId,
    competition_id: competitionId,
    id: competitionId,
    name: rawMatch?.competition_name ?? "FACEIT",
    nickname: rawMatch?.competition_name ?? "FACEIT",
    match_type:
      rawMatch?.competition_type ?? rawMatch?.match_type ?? "matchmaking",
    started_at: rawMatch?.started_at ?? rawMatch?.finished_at ?? null,
  };
}
