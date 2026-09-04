import { createServer } from "node:http";

import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";

import { syncDiscordCommands } from "./commands.mjs";

const DEFAULT_MATCH_DATA_URL =
  "https://istesport.com/data/faceit-stats.json";

const DEFAULT_SITE_URL = "https://istesport.com";
const DEFAULT_IDLE_ACTIVITY = "ISTe Esports | istesport.com";
const DEFAULT_REFRESH_MS = 60_000;
const MIN_REFRESH_MS = 30_000;
const MAX_REFRESH_MS = 300_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_ACTIVITY_LENGTH = 128;

function requiredEnv(name) {
  const value = String(process.env[name] ?? "").trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function clampNumber(value, fallback, min, max) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function clipActivity(value) {
  const text = cleanText(value);

  if (text.length <= MAX_ACTIVITY_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_ACTIVITY_LENGTH - 1).trimEnd()}…`;
}

function finiteScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareLiveMatches(left, right) {
  const leftTime =
    toTimestamp(left?.startedAt) ||
    toTimestamp(left?.scheduledAt);

  const rightTime =
    toTimestamp(right?.startedAt) ||
    toTimestamp(right?.scheduledAt);

  return rightTime - leftTime;
}

function selectLiveMatch(payload) {
  const matches = Array.isArray(payload?.teamMatches)
    ? payload.teamMatches
    : [];

  return (
    matches
      .filter((match) => match?.status === "ongoing")
      .sort(compareLiveMatches)[0] ?? null
  );
}

function buildLiveActivity(match) {
  const opponent = cleanText(
    match?.opponent?.name,
    "Opponent",
  );

  const ownScore = finiteScore(match?.ownTeam?.score);
  const opponentScore = finiteScore(match?.opponent?.score);
  const bestOf = finiteScore(match?.bestOf);

  const parts = [`ISTe vs ${opponent}`];

  if (ownScore !== null && opponentScore !== null) {
    parts.push(`${ownScore}:${opponentScore}`);
  }

  if (bestOf !== null && bestOf > 0) {
    parts.push(`BO${bestOf}`);
  }

  parts.push("LIVE");

  return clipActivity(parts.join(" | "));
}

function buildTournamentActivity(match) {
  const competitionName = cleanText(
    match?.competitionName,
    "ISTe Match",
  );

  return clipActivity(`Турнир ${competitionName}`);
}

function buildPresence(payload) {
  const liveMatch = selectLiveMatch(payload);

  if (liveMatch) {
    const tournamentActivity = buildTournamentActivity(liveMatch);
    const matchActivity = buildLiveActivity(liveMatch);

    return {
      key: `live:${tournamentActivity}:${matchActivity}`,
      status: "online",
      activity: {
        name: tournamentActivity,
        state: matchActivity,
        type: ActivityType.Competing,
      },
      liveMatch,
    };
  }

  const idleActivity = clipActivity(
    process.env.ISTE_IDLE_ACTIVITY || DEFAULT_IDLE_ACTIVITY,
  );

  return {
    key: `idle:${idleActivity}`,
    status: "online",
    activity: {
      name: idleActivity,
      type: ActivityType.Watching,
    },
    liveMatch: null,
  };
}

const token = requiredEnv("DISCORD_BOT_TOKEN");

const matchDataUrl = cleanText(
  process.env.ISTE_MATCH_DATA_URL,
  DEFAULT_MATCH_DATA_URL,
);

const siteUrl = cleanText(
  process.env.ISTE_SITE_URL,
  DEFAULT_SITE_URL,
);

const refreshMs = clampNumber(
  process.env.PRESENCE_REFRESH_MS,
  DEFAULT_REFRESH_MS,
  MIN_REFRESH_MS,
  MAX_REFRESH_MS,
);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let lastPresenceKey = "";
let lastPresenceName = "";
let lastRefreshAt = null;
let lastSuccessfulFetchAt = null;
let lastError = null;
let refreshTimer = null;
let shuttingDown = false;

function log(event, data = {}) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      event,
      ...data,
    }),
  );
}

async function fetchMatchPayload() {
  const url = new URL(matchDataUrl);
  url.searchParams.set("presence", String(Date.now()));

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "ISTe-Presence-Worker/1.0",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Match data request failed with HTTP ${response.status}`,
    );
  }

  return response.json();
}

async function applyPresence(payload) {
  if (!client.user) {
    return;
  }

  const nextPresence = buildPresence(payload);

  if (nextPresence.key === lastPresenceKey) {
    return;
  }

  client.user.setPresence({
    status: nextPresence.status,
    activities: [nextPresence.activity],
  });

  lastPresenceKey = nextPresence.key;
  lastPresenceName = nextPresence.activity.name;

  log("presence_updated", {
    mode: nextPresence.liveMatch ? "live" : "idle",
    activity: nextPresence.activity.name,
    matchId: nextPresence.liveMatch?.matchId ?? null,
    siteUrl,
  });
}

async function refreshPresence() {
  lastRefreshAt = new Date().toISOString();

  try {
    const payload = await fetchMatchPayload();
    lastSuccessfulFetchAt = new Date().toISOString();
    lastError = null;
    await applyPresence(payload);
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : String(error);

    log("presence_refresh_failed", {
      message: lastError,
    });
  }
}

function scheduleRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    void refreshPresence();
  }, refreshMs);
}

client.once(Events.ClientReady, async (readyClient) => {
  log("discord_ready", {
    bot: readyClient.user.tag,
    userId: readyClient.user.id,
    guildCount: readyClient.guilds.cache.size,
    refreshMs,
    matchDataUrl,
  });

  try {
    const result = await syncDiscordCommands(
      token,
      readyClient.user.id,
    );

    log("discord_commands_synced", result);
  } catch (error) {
    log("discord_commands_sync_failed", {
      message:
        error instanceof Error ? error.message : String(error),
    });
  }

  await refreshPresence();
  scheduleRefresh();
});

client.on(Events.Error, (error) => {
  log("discord_client_error", {
    message: error?.message ?? String(error),
  });
});

client.on(Events.ShardError, (error, shardId) => {
  log("discord_shard_error", {
    shardId,
    message: error?.message ?? String(error),
  });
});

const port = clampNumber(
  process.env.PORT,
  3000,
  1,
  65535,
);

const healthServer = createServer((request, response) => {
  if (request.url !== "/health") {
    response.writeHead(404, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ ok: false }));
    return;
  }

  const ready = client.isReady();

  response.writeHead(ready ? 200 : 503, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });

  response.end(
    JSON.stringify({
      ok: ready,
      discordReady: ready,
      lastPresence: lastPresenceName || null,
      lastRefreshAt,
      lastSuccessfulFetchAt,
      lastError,
      uptimeSeconds: Math.round(process.uptime()),
    }),
  );
});

healthServer.listen(port, "0.0.0.0", () => {
  log("health_server_ready", { port });
});

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  log("shutdown_started", { signal });

  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  client.destroy();

  healthServer.close(() => {
    log("shutdown_complete", { signal });
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  log("unhandled_rejection", {
    message:
      reason instanceof Error ? reason.message : String(reason),
  });
});

process.on("uncaughtException", (error) => {
  log("uncaught_exception", {
    message: error?.message ?? String(error),
  });

  process.exit(1);
});

client.login(token).catch((error) => {
  log("discord_login_failed", {
    message: error?.message ?? String(error),
  });

  process.exit(1);
});
