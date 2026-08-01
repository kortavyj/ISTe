import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  createTeamMatchContext,
  mergeTeamMatches,
  normalizeTournamentMatch,
} from "./faceit-match-utils.mjs";
import {
  getTeamMemberIds,
  historyCompetition,
  isVerifiedTeamHistoryMatch,
} from "./faceit-history-utils.mjs";

const API_BASE = "https://open.faceit.com/data/v4";
const TEAM_ID = "fe19e71d-c974-404c-a038-beb9a578fb61";
const GAME_ID = "cs2";
const TEAM_URL = `https://www.faceit.com/ru/teams/${TEAM_ID}`;
const OUTPUT_FILE = resolve("public/data/faceit-stats.json");
const API_KEY = process.env.FACEIT_API_KEY?.trim();

if (!API_KEY) {
  throw new Error("FACEIT_API_KEY is not configured in GitHub Actions secrets.");
}

const METRIC_ALIASES = Object.freeze({
  matches: ["Matches", "Total Matches", "Matches Played"],
  wins: ["Wins", "Total Wins", "Matches Won"],
  winRate: ["Win Rate %", "Win Rate", "Winrate", "Win Percentage"],
  kills: ["Average Kills", "Avg Kills", "Kills Average", "Kills"],
  kd: ["Average K/D Ratio", "K/D Ratio", "Average KD", "KD Ratio", "K/D"],
  headshots: [
    "Average Headshots %",
    "Average Headshots",
    "Headshots %",
    "Headshot Percentage",
    "Headshots",
  ],
  assists: ["Average Assists", "Avg Assists", "Assists Average", "Assists"],
  awp: [
    "Average Sniper Kills",
    "Sniper Kills",
    "Sniper Kill Rate",
    "Average AWP Kills",
    "AWP Kills",
    "Sniper Rifle Kills",
  ],
  entry: [
    "Entry Success Rate",
    "Entry Rate",
    "Average Entry Kills",
    "Entry Kills",
    "Opening Kills",
    "First Kills",
  ],
  utility: [
    "Average Utility Damage",
    "Utility Damage",
    "Flash Assists",
    "Average Flash Assists",
    "Enemies Flashed",
    "Utility Success Rate",
  ],
});

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(",", ".").replace(/[^0-9.-]/g, "");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function findNumericValue(source, aliases) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const normalizedAliases = new Set(aliases.map(normalizeKey));
  const queue = [source];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const [key, value] of Object.entries(current)) {
      if (normalizedAliases.has(normalizeKey(key))) {
        const numericValue = toFiniteNumber(value);
        if (numericValue !== null) {
          return numericValue;
        }
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

function averageMetric(items, aliases) {
  if (!Array.isArray(items)) {
    return null;
  }

  const values = items
    .map((item) => findNumericValue(item?.stats ?? item, aliases))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function fetchFaceit(path, { optional404 = false } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
  });

  if (optional404 && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`FACEIT request failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  return response.json();
}

async function fetchFaceitOptional(path) {
  try {
    return await fetchFaceit(path, { optional404: true });
  } catch (error) {
    console.warn(`Optional FACEIT request failed for ${path}:`, error.message);
    return null;
  }
}

async function fetchAllTournaments() {
  const tournamentsById = new Map();
  const limit = 100;

  for (let offset = 0; offset < 5000; offset += limit) {
    const page = await fetchFaceit(`/teams/${TEAM_ID}/tournaments?offset=${offset}&limit=${limit}`, {
      optional404: true,
    });

    if (!page) {
      break;
    }

    const items = Array.isArray(page.items) ? page.items : [];

    items.forEach((item, index) => {
      const id = item.tournament_id ?? item.competition_id ?? item.id ?? `${offset}:${index}`;
      tournamentsById.set(String(id), item);
    });

    if (items.length < limit) {
      break;
    }
  }

  return [...tournamentsById.values()];
}

function tournamentId(tournament) {
  return tournament?.tournament_id ?? tournament?.competition_id ?? tournament?.id ?? null;
}

function tournamentTime(tournament) {
  const value = Number(
    tournament?.started_at ?? tournament?.championship_start ?? tournament?.subscription_start ?? 0,
  );
  return Number.isFinite(value) ? value : 0;
}

function isActiveTournament(tournament) {
  const status = String(tournament?.status ?? "").toLowerCase();
  return !["finished", "cancelled", "canceled", "past"].includes(status);
}

function chooseTournamentsToRefresh(tournaments, previousPayload, fullSync) {
  if (fullSync) {
    return tournaments;
  }

  const active = tournaments.filter(isActiveTournament);
  const recent = [...tournaments]
    .sort((left, right) => tournamentTime(right) - tournamentTime(left))
    .slice(0, 8);
  const previousActiveIds = new Set(
    (Array.isArray(previousPayload?.teamMatches) ? previousPayload.teamMatches : [])
      .filter((match) => match?.status !== "finished" && match?.status !== "cancelled")
      .map((match) => String(match?.tournamentId ?? ""))
      .filter(Boolean),
  );
  const carried = tournaments.filter((tournament) =>
    previousActiveIds.has(String(tournamentId(tournament) ?? "")),
  );
  const selected = new Map();

  [...active, ...recent, ...carried].forEach((tournament) => {
    const id = tournamentId(tournament);
    if (id) {
      selected.set(String(id), tournament);
    }
  });

  return [...selected.values()];
}

async function fetchTournamentMatches(tournament) {
  const id = tournamentId(tournament);
  if (!id) {
    return { items: [], success: false };
  }

  const matches = [];
  const limit = 100;
  let matchEndpointSucceeded = false;

  for (let offset = 0; offset < 5000; offset += limit) {
    const page = await fetchFaceitOptional(
      `/tournaments/${id}/matches?offset=${offset}&limit=${limit}`,
    );

    if (!page) {
      break;
    }

    matchEndpointSucceeded = true;
    const items = Array.isArray(page.items) ? page.items : [];
    matches.push(...items);

    if (items.length < limit) {
      break;
    }
  }

  if (matches.length > 0) {
    return { items: matches, success: true };
  }

  const brackets = await fetchFaceitOptional(`/tournaments/${id}/brackets`);
  if (brackets) {
    return {
      items: Array.isArray(brackets.matches) ? brackets.matches : [],
      success: true,
    };
  }

  return { items: [], success: matchEndpointSucceeded };
}

async function fetchVerifiedTeamHistory(team, fullSync, expectedMatchCount) {
  const memberIds = getTeamMemberIds(team);
  const playerIds = [...memberIds];
  const limit = 100;
  const maximumItemsPerPlayer = fullSync ? 1000 : 100;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = fullSync ? 0 : nowSeconds - 90 * 24 * 60 * 60;
  const uniqueMatches = new Map();
  let playersScanned = 0;
  let successfulPlayers = 0;

  for (const playerId of playerIds) {
    playersScanned += 1;
    let playerSucceeded = false;

    for (let offset = 0; offset < maximumItemsPerPlayer; offset += limit) {
      const page = await fetchFaceitOptional(
        `/players/${playerId}/history?game=${GAME_ID}&from=${fromSeconds}&to=${nowSeconds}&offset=${offset}&limit=${limit}`,
      );

      if (!page) {
        break;
      }

      playerSucceeded = true;
      const items = Array.isArray(page.items) ? page.items : [];

      for (const rawMatch of items) {
        if (!isVerifiedTeamHistoryMatch(rawMatch, TEAM_ID, memberIds)) {
          continue;
        }

        const matchId = rawMatch?.match_id ?? rawMatch?.id ?? null;
        if (matchId) {
          uniqueMatches.set(String(matchId), rawMatch);
        }
      }

      if (
        fullSync &&
        Number.isFinite(expectedMatchCount) &&
        expectedMatchCount > 0 &&
        uniqueMatches.size >= expectedMatchCount
      ) {
        break;
      }

      if (items.length < limit) {
        break;
      }
    }

    if (playerSucceeded) {
      successfulPlayers += 1;
    }

    if (
      fullSync &&
      Number.isFinite(expectedMatchCount) &&
      expectedMatchCount > 0 &&
      uniqueMatches.size >= expectedMatchCount
    ) {
      break;
    }
  }

  return {
    matches: [...uniqueMatches.values()],
    playersScanned,
    successfulPlayers,
  };
}

async function buildTeamMatches(
  team,
  tournaments,
  previousPayload,
  expectedMatchCount,
) {
  const previousMatches = Array.isArray(previousPayload?.teamMatches)
    ? previousPayload.teamMatches
    : [];
  const fullSync =
    process.env.FACEIT_FULL_SYNC === "1" ||
    process.env.GITHUB_EVENT_NAME === "workflow_dispatch" ||
    previousMatches.length === 0;
  const selectedTournaments = chooseTournamentsToRefresh(tournaments, previousPayload, fullSync);
  const context = createTeamMatchContext(team, TEAM_ID);
  const refreshedMatches = [];
  const refreshedTournamentIds = [];
  let failedTournaments = 0;

  for (const tournament of selectedTournaments) {
    const id = tournamentId(tournament);
    if (!id) {
      continue;
    }

    const result = await fetchTournamentMatches(tournament);
    if (!result.success) {
      failedTournaments += 1;
      continue;
    }

    refreshedTournamentIds.push(String(id));

    for (const rawMatch of result.items) {
      const normalized = normalizeTournamentMatch(rawMatch, tournament, context);
      if (normalized) {
        refreshedMatches.push(normalized);
      }
    }
  }

  const historyData = await fetchVerifiedTeamHistory(
    team,
    fullSync,
    expectedMatchCount,
  );

  for (const rawMatch of historyData.matches) {
    const normalized = normalizeTournamentMatch(
      rawMatch,
      historyCompetition(rawMatch),
      context,
    );

    if (normalized) {
      refreshedMatches.push(normalized);
    }
  }

  const historySucceeded =
    historyData.playersScanned === 0 || historyData.successfulPlayers > 0;
  const completedFullSync =
    fullSync && failedTournaments === 0 && historySucceeded;

  return {
    matches: mergeTeamMatches(
      previousMatches,
      refreshedMatches,
      refreshedTournamentIds,
      completedFullSync,
    ),
    fullSync: completedFullSync,
    tournamentsScanned: selectedTournaments.length,
    failedTournaments,
    historyPlayersScanned: historyData.playersScanned,
    historyMatchesFound: historyData.matches.length,
  };
}

function normalizeFaceitUrl(url, playerId) {
  if (typeof url === "string" && url.trim()) {
    return url.replace("{lang}", "ru");
  }

  return playerId ? `https://www.faceit.com/ru/players/${playerId}` : TEAM_URL;
}

function normalizeAvatar(...candidates) {
  const avatar = candidates.find(
    (candidate) => typeof candidate === "string" && /^https?:\/\//i.test(candidate),
  );

  return avatar ?? null;
}

function readPlayerMetrics(lifetimeStats, matchStats) {
  const recentItems = Array.isArray(matchStats?.items) ? matchStats.items : [];
  const readMetric = (name) => {
    const recentValue = averageMetric(recentItems, METRIC_ALIASES[name]);
    return recentValue ?? findNumericValue(lifetimeStats, METRIC_ALIASES[name]);
  };

  return {
    matches: findNumericValue(lifetimeStats, METRIC_ALIASES.matches),
    winRate: findNumericValue(lifetimeStats, METRIC_ALIASES.winRate),
    kills: readMetric("kills"),
    kd: readMetric("kd"),
    headshots: readMetric("headshots"),
    assists: readMetric("assists"),
    awp: readMetric("awp"),
    entry: readMetric("entry"),
    utility: readMetric("utility"),
  };
}

function normalizedMetric(players, metric, playerIndex, { invert = false } = {}) {
  const values = players
    .map((player) => player.metrics[metric])
    .filter((value) => Number.isFinite(value));
  const value = players[playerIndex].metrics[metric];

  if (!Number.isFinite(value) || values.length === 0) {
    return 0.5;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  let normalized = maximum === minimum ? 0.5 : (value - minimum) / (maximum - minimum);

  if (invert) {
    normalized = 1 - normalized;
  }

  return normalized;
}

function choosePlayer(players, availableIndexes, scorer) {
  let selectedIndex = null;
  let selectedScore = Number.NEGATIVE_INFINITY;

  for (const playerIndex of availableIndexes) {
    const score = scorer(playerIndex);
    if (score > selectedScore) {
      selectedIndex = playerIndex;
      selectedScore = score;
    }
  }

  return selectedIndex;
}

function inferPlayerRoles(players) {
  if (players.length === 0) {
    return players;
  }

  const roles = new Map();
  const availableIndexes = new Set(players.map((_, index) => index));
  const assign = (playerIndex, role, reason, confidence) => {
    if (playerIndex === null || playerIndex === undefined) {
      return;
    }

    roles.set(playerIndex, { role, reason, confidence });
    availableIndexes.delete(playerIndex);
  };

  const captainIndex = players.findIndex((player) => player.captain);
  const iglIndex =
    captainIndex >= 0
      ? captainIndex
      : choosePlayer(players, availableIndexes, (index) => {
          return (
            normalizedMetric(players, "assists", index) * 0.45 +
            normalizedMetric(players, "matches", index) * 0.35 +
            normalizedMetric(players, "winRate", index) * 0.2
          );
        });

  assign(
    iglIndex,
    "IGL",
    captainIndex >= 0
      ? "Капитан команды на FACEIT"
      : "Предполагаемый координатор по опыту и командной статистике",
    captainIndex >= 0 ? 95 : 52,
  );

  if (availableIndexes.size > 0) {
    const hasDirectAwpData = players.some((player) => Number.isFinite(player.metrics.awp));
    const awpIndex = choosePlayer(players, availableIndexes, (index) => {
      if (hasDirectAwpData) {
        return (
          normalizedMetric(players, "awp", index) * 0.55 +
          normalizedMetric(players, "kd", index) * 0.2 +
          normalizedMetric(players, "kills", index) * 0.15 +
          normalizedMetric(players, "headshots", index, { invert: true }) * 0.1
        );
      }

      return (
        normalizedMetric(players, "headshots", index, { invert: true }) * 0.45 +
        normalizedMetric(players, "kd", index) * 0.35 +
        normalizedMetric(players, "kills", index) * 0.2
      );
    });

    assign(
      awpIndex,
      "AWP",
      hasDirectAwpData
        ? "Лучшие снайперские показатели в доступной статистике"
        : "Вероятная снайперская роль по стилю стрельбы и эффективности",
      hasDirectAwpData ? 82 : 58,
    );
  }

  if (availableIndexes.size > 0) {
    const hasDirectEntryData = players.some((player) => Number.isFinite(player.metrics.entry));
    const entryIndex = choosePlayer(players, availableIndexes, (index) => {
      return (
        normalizedMetric(players, "entry", index) * (hasDirectEntryData ? 0.45 : 0.15) +
        normalizedMetric(players, "kills", index) * 0.35 +
        normalizedMetric(players, "headshots", index) * 0.2 +
        normalizedMetric(players, "kd", index) * 0.15
      );
    });

    assign(
      entryIndex,
      "ENTRY",
      hasDirectEntryData
        ? "Сильнейшие показатели первых контактов"
        : "Предполагаемый энтри по темпу фрагов и доле хедшотов",
      hasDirectEntryData ? 80 : 57,
    );
  }

  if (availableIndexes.size > 0) {
    const hasDirectUtilityData = players.some((player) => Number.isFinite(player.metrics.utility));
    const supportIndex = choosePlayer(players, availableIndexes, (index) => {
      return (
        normalizedMetric(players, "utility", index) * (hasDirectUtilityData ? 0.5 : 0.2) +
        normalizedMetric(players, "assists", index) * 0.45 +
        normalizedMetric(players, "winRate", index) * 0.15 +
        normalizedMetric(players, "kills", index, { invert: true }) * 0.1
      );
    });

    assign(
      supportIndex,
      "SUPPORT",
      hasDirectUtilityData
        ? "Лучший вклад гранатами и ассистами"
        : "Предполагаемый саппорт по ассистам и командной эффективности",
      hasDirectUtilityData ? 78 : 55,
    );
  }

  for (const playerIndex of availableIndexes) {
    assign(
      playerIndex,
      "RIFLER",
      "Универсальная стрелковая роль по сбалансированной статистике",
      62,
    );
  }

  return players.map((player, index) => ({
    ...player,
    ...roles.get(index),
    roleSource: "FACEIT statistical inference",
  }));
}

async function enrichRosterMember(member, teamLeader) {
  const playerId = member.player_id ?? member.user_id ?? member.id ?? null;
  const nickname = member.nickname ?? member.name ?? "Unknown";
  const captain = Boolean(
    member.captain ||
      member.leader ||
      (teamLeader && (teamLeader === playerId || teamLeader === nickname)),
  );

  if (!playerId) {
    return {
      playerId: null,
      nickname,
      avatar: normalizeAvatar(member.avatar),
      country: member.country ?? null,
      captain,
      faceitUrl: TEAM_URL,
      level: toFiniteNumber(member.skill_level),
      elo: null,
      metrics: {},
    };
  }

  const [details, stats, recentStats] = await Promise.all([
    fetchFaceitOptional(`/players/${playerId}`),
    fetchFaceitOptional(`/players/${playerId}/stats/${GAME_ID}`),
    fetchFaceitOptional(`/players/${playerId}/games/${GAME_ID}/stats?offset=0&limit=100`),
  ]);

  const gameDetails = details?.games?.[GAME_ID] ?? {};

  return {
    playerId,
    nickname: details?.nickname ?? nickname,
    avatar: normalizeAvatar(details?.avatar, member.avatar),
    country: details?.country ?? member.country ?? null,
    captain,
    faceitUrl: normalizeFaceitUrl(details?.faceit_url ?? member.faceit_url, playerId),
    level:
      toFiniteNumber(gameDetails.skill_level) ??
      toFiniteNumber(member.skill_level) ??
      toFiniteNumber(member.game_skill_level),
    elo: toFiniteNumber(gameDetails.faceit_elo),
    metrics: readPlayerMetrics(stats?.lifetime, recentStats),
  };
}

async function buildRoster(team) {
  if (!Array.isArray(team.members)) {
    return [];
  }

  const members = await Promise.all(
    team.members.map((member) => enrichRosterMember(member, team.leader)),
  );

  const sortedMembers = members.sort((left, right) => {
    if (left.captain !== right.captain) {
      return Number(right.captain) - Number(left.captain);
    }

    return (right.elo ?? 0) - (left.elo ?? 0);
  });

  const roleOrder = { IGL: 0, AWP: 1, ENTRY: 2, RIFLER: 3, SUPPORT: 4 };

  return inferPlayerRoles(sortedMembers)
    .sort((left, right) => {
      const leftOrder = roleOrder[left.role] ?? 99;
      const rightOrder = roleOrder[right.role] ?? 99;
      return leftOrder - rightOrder || (right.elo ?? 0) - (left.elo ?? 0);
    })
    .map(({ metrics, ...publicPlayer }) => publicPlayer);
}

function comparablePayload(payload) {
  const { updatedAt, ...stableData } = payload;
  return stableData;
}

async function readPreviousPayload() {
  try {
    return JSON.parse(await readFile(OUTPUT_FILE, "utf8"));
  } catch {
    return null;
  }
}

const previousPayload = await readPreviousPayload();
const [team, teamStats, tournaments] = await Promise.all([
  fetchFaceit(`/teams/${TEAM_ID}`),
  fetchFaceit(`/teams/${TEAM_ID}/stats/${GAME_ID}`, { optional404: true }),
  fetchAllTournaments(),
]);

const matches = findNumericValue(teamStats?.lifetime, METRIC_ALIASES.matches);
const expectedMatchCount = matches === null ? null : Math.round(matches);
const [roster, matchData] = await Promise.all([
  buildRoster(team),
  buildTeamMatches(team, tournaments, previousPayload, expectedMatchCount),
]);
const reportedWins = findNumericValue(teamStats?.lifetime, METRIC_ALIASES.wins);
const reportedWinRate = findNumericValue(teamStats?.lifetime, METRIC_ALIASES.winRate);
const calculatedWins =
  reportedWins === null && matches && reportedWinRate !== null
    ? (matches * reportedWinRate) / 100
    : null;
const wins = reportedWins ?? calculatedWins;
const calculatedWinRate = matches && wins !== null ? (wins / matches) * 100 : null;
const winRate = reportedWinRate ?? calculatedWinRate;
const tournamentKeys = new Set();

for (const tournament of tournaments) {
  const id = tournamentId(tournament);

  if (id) {
    tournamentKeys.add(`id:${id}`);
  }
}

for (const match of matchData.matches) {
  const id = match?.tournamentId;

  if (id) {
    tournamentKeys.add(`id:${id}`);
    continue;
  }

  const competitionName = String(
    match?.competitionName ?? "",
  )
    .trim()
    .toLowerCase();

  if (competitionName) {
    tournamentKeys.add(`name:${competitionName}`);
  }
}

const tournamentCount = tournamentKeys.size;
const now = new Date().toISOString();

const nextPayload = {
  source: "FACEIT",
  sourceUrl: TEAM_URL,
  teamId: TEAM_ID,
  teamName: team.name ?? team.nickname ?? "ISTe",
  teamAvatar: normalizeAvatar(team.avatar),
  gameId: GAME_ID,
  tournaments: tournamentCount,
  matches: matches === null ? null : Math.round(matches),
  wins: wins === null ? null : Math.round(wins),
  winRate: winRate === null ? null : Math.round(winRate * 10) / 10,
  players: roster.length,
  roster,
  teamMatches: matchData.matches,
  teamMatchCount: matchData.matches.length,
  matchSync: {
    source: "FACEIT tournaments and verified team roster history",
    fullSync: matchData.fullSync,
    tournamentsScanned: matchData.tournamentsScanned,
    failedTournaments: matchData.failedTournaments,
    historyPlayersScanned: matchData.historyPlayersScanned,
    historyMatchesFound: matchData.historyMatchesFound,
    lastFullSyncAt: matchData.fullSync
      ? now
      : previousPayload?.matchSync?.lastFullSyncAt ?? null,
  },
  roleModel: {
    name: "ISTe statistical role inference",
    version: 1,
    disclaimer: "Roles are estimates based on available FACEIT statistics and team captain status.",
  },
  updatedAt: now,
};

const hasChanged =
  !previousPayload ||
  JSON.stringify(comparablePayload(previousPayload)) !==
    JSON.stringify(comparablePayload(nextPayload));

if (!hasChanged) {
  console.log("FACEIT data has not changed. The JSON file was left untouched.");
  process.exit(0);
}

await mkdir(dirname(OUTPUT_FILE), { recursive: true });
await writeFile(OUTPUT_FILE, `${JSON.stringify(nextPayload, null, 2)}\n`, "utf8");
console.log(
  `FACEIT data updated for ${nextPayload.teamName}: ${nextPayload.teamMatchCount} team matches.`,
);
