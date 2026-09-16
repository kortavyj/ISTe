import { createServer } from "node:http";

import {
  ActivityType,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} from "discord.js";

import { syncDiscordCommands } from "./commands.mjs";

const DEFAULT_MATCH_DATA_URL =
  "https://istesport.com/data/faceit-stats.json";

const DEFAULT_SITE_URL = "https://istesport.com";
const DEFAULT_IDLE_ACTIVITY = "ISTesport | istesport.com";
const DEFAULT_REFRESH_MS = 60_000;
const MIN_REFRESH_MS = 30_000;
const MAX_REFRESH_MS = 300_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_ACTIVITY_LENGTH = 128;

const PRIVATE_CATEGORY_NAME = "🔒 ПРИВАТНІ КІМНАТИ";
const PRIVATE_LOBBY_NAME = "➕ Створити приватний";
const PRIVATE_ROOM_PREFIX = "🔒・";
const PRIVATE_DELETE_DELAY_MS = 3_000;

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

  const parts = [`ISTesport vs ${opponent}`];

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
    "ISTesport Match",
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let lastPresenceKey = "";
let lastPresenceName = "";
let lastRefreshAt = null;
let lastSuccessfulFetchAt = null;
let lastError = null;
let refreshTimer = null;
let shuttingDown = false;

const privateVoiceState = new Map();
const privateDeleteTimers = new Map();
const privateCreateLocks = new Set();

let privateRoomsCreated = 0;
let privateRoomsDeleted = 0;
let privateVoiceLastError = null;

function log(event, data = {}) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      event,
      ...data,
    }),
  );
}

function sanitizeRoomName(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "кімната";
}

function privateRoomName(member) {
  const displayName =
    member?.displayName ||
    member?.user?.globalName ||
    member?.user?.username ||
    "кімната";

  return `${PRIVATE_ROOM_PREFIX}${sanitizeRoomName(displayName)}`.slice(
    0,
    100,
  );
}

function ownerIdFromRoom(channel) {
  if (!channel?.permissionOverwrites?.cache || !client.user) {
    return "";
  }

  const overwrite = channel.permissionOverwrites.cache.find(
    (item) =>
      item.id !== client.user.id &&
      item.id !== channel.guild.roles.everyone.id &&
      item.allow.has(PermissionFlagsBits.ManageChannels),
  );

  return overwrite?.id || "";
}

function isPrivateManagedRoom(channel, config) {
  return Boolean(
    channel &&
      config &&
      channel.type === ChannelType.GuildVoice &&
      channel.parentId === config.categoryId &&
      channel.id !== config.lobbyId &&
      channel.name.startsWith(PRIVATE_ROOM_PREFIX),
  );
}

async function ensurePrivateVoiceSetup(guild) {
  await guild.channels.fetch();

  let category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === PRIVATE_CATEGORY_NAME,
  );

  if (!category) {
    category = await guild.channels.create({
      name: PRIVATE_CATEGORY_NAME,
      type: ChannelType.GuildCategory,
      reason: "ISTesport private voice system setup",
    });

    log("private_voice_category_created", {
      guildId: guild.id,
      categoryId: category.id,
    });
  }

  let lobby = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildVoice &&
      channel.parentId === category.id &&
      channel.name === PRIVATE_LOBBY_NAME,
  );

  if (!lobby) {
    lobby = await guild.channels.create({
      name: PRIVATE_LOBBY_NAME,
      type: ChannelType.GuildVoice,
      parent: category.id,
      userLimit: 0,
      reason: "ISTesport private voice join to create lobby",
    });

    log("private_voice_lobby_created", {
      guildId: guild.id,
      lobbyId: lobby.id,
    });
  }

  const config = {
    categoryId: category.id,
    lobbyId: lobby.id,
  };

  privateVoiceState.set(guild.id, config);
  return config;
}

function cancelPrivateDelete(channelId) {
  const timer = privateDeleteTimers.get(channelId);

  if (timer) {
    clearTimeout(timer);
    privateDeleteTimers.delete(channelId);
  }
}

async function deletePrivateRoomIfEmpty(guildId, channelId) {
  privateDeleteTimers.delete(channelId);

  try {
    const guild =
      client.guilds.cache.get(guildId) ||
      (await client.guilds.fetch(guildId));

    const config =
      privateVoiceState.get(guildId) ||
      (await ensurePrivateVoiceSetup(guild));

    const channel =
      guild.channels.cache.get(channelId) ||
      (await guild.channels.fetch(channelId).catch(() => null));

    if (!channel || !isPrivateManagedRoom(channel, config)) {
      return;
    }

    if (channel.members.size > 0) {
      return;
    }

    await channel.delete(
      "ISTesport temporary private room became empty",
    );

    privateRoomsDeleted += 1;

    log("private_voice_room_deleted", {
      guildId,
      channelId,
    });
  } catch (error) {
    privateVoiceLastError =
      error instanceof Error ? error.message : String(error);

    log("private_voice_delete_failed", {
      guildId,
      channelId,
      message: privateVoiceLastError,
    });
  }
}

function schedulePrivateDelete(channel) {
  if (!channel?.guild?.id || !channel?.id) {
    return;
  }

  cancelPrivateDelete(channel.id);

  const timer = setTimeout(() => {
    void deletePrivateRoomIfEmpty(
      channel.guild.id,
      channel.id,
    );
  }, PRIVATE_DELETE_DELAY_MS);

  timer.unref?.();
  privateDeleteTimers.set(channel.id, timer);
}

function findOwnedPrivateRoom(guild, config, ownerId) {
  return (
    guild.channels.cache.find(
      (channel) =>
        isPrivateManagedRoom(channel, config) &&
        ownerIdFromRoom(channel) === ownerId,
    ) || null
  );
}

async function createPrivateRoomFor(state, config) {
  const member = state.member;

  if (!member || member.user?.bot || !client.user) {
    return;
  }

  const lockKey = `${state.guild.id}:${member.id}`;

  if (privateCreateLocks.has(lockKey)) {
    return;
  }

  privateCreateLocks.add(lockKey);

  try {
    await state.guild.channels.fetch();

    const existing = findOwnedPrivateRoom(
      state.guild,
      config,
      member.id,
    );

    if (existing) {
      cancelPrivateDelete(existing.id);

      if (member.voice.channelId !== existing.id) {
        await member.voice.setChannel(
          existing,
          "ISTesport private room reuse",
        );
      }

      log("private_voice_room_reused", {
        guildId: state.guild.id,
        channelId: existing.id,
        ownerId: member.id,
      });

      return;
    }

    const me =
      state.guild.members.me ||
      (await state.guild.members.fetchMe().catch(() => null));

    if (
      !me?.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !me?.permissions.has(PermissionFlagsBits.MoveMembers)
    ) {
      throw new Error(
        "ISTesport Bot needs Manage Channels and Move Members",
      );
    }

    const room = await state.guild.channels.create({
      name: privateRoomName(member),
      type: ChannelType.GuildVoice,
      parent: config.categoryId,
      reason: `ISTesport private room for ${member.user.username}`,
      permissionOverwrites: [
        {
          id: state.guild.roles.everyone.id,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
          ],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.UseVAD,
            PermissionFlagsBits.CreateInstantInvite,
            PermissionFlagsBits.ManageChannels,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.UseVAD,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],
    });

    try {
      await member.voice.setChannel(
        room,
        "ISTesport join to create private room",
      );
    } catch (error) {
      await room.delete("Could not move room owner").catch(() => null);
      throw error;
    }

    privateRoomsCreated += 1;
    privateVoiceLastError = null;

    log("private_voice_room_created", {
      guildId: state.guild.id,
      channelId: room.id,
      ownerId: member.id,
    });
  } catch (error) {
    privateVoiceLastError =
      error instanceof Error ? error.message : String(error);

    log("private_voice_create_failed", {
      guildId: state.guild.id,
      ownerId: member.id,
      message: privateVoiceLastError,
    });
  } finally {
    privateCreateLocks.delete(lockKey);
  }
}

async function cleanupEmptyPrivateRooms(guild, config) {
  await guild.channels.fetch();

  const rooms = guild.channels.cache.filter((channel) =>
    isPrivateManagedRoom(channel, config),
  );

  for (const channel of rooms.values()) {
    if (channel.members.size > 0) {
      continue;
    }

    try {
      await channel.delete(
        "ISTesport startup cleanup of empty private room",
      );

      privateRoomsDeleted += 1;

      log("private_voice_room_deleted", {
        guildId: guild.id,
        channelId: channel.id,
        reason: "startup_cleanup",
      });
    } catch (error) {
      privateVoiceLastError =
        error instanceof Error ? error.message : String(error);

      log("private_voice_cleanup_failed", {
        guildId: guild.id,
        channelId: channel.id,
        message: privateVoiceLastError,
      });
    }
  }
}

async function initializePrivateVoice() {
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = await ensurePrivateVoiceSetup(guild);
      await cleanupEmptyPrivateRooms(guild, config);

      log("private_voice_ready", {
        guildId: guild.id,
        categoryId: config.categoryId,
        lobbyId: config.lobbyId,
      });
    } catch (error) {
      privateVoiceLastError =
        error instanceof Error ? error.message : String(error);

      log("private_voice_setup_failed", {
        guildId: guild.id,
        message: privateVoiceLastError,
      });
    }
  }
}

async function handlePrivateVoiceState(oldState, newState) {
  const guild = newState.guild || oldState.guild;

  if (!guild) {
    return;
  }

  let config =
    privateVoiceState.get(guild.id) ||
    (await ensurePrivateVoiceSetup(guild));

  if (
    newState.channelId === config.lobbyId &&
    !newState.member?.user?.bot
  ) {
    await createPrivateRoomFor(newState, config);
  }

  if (
    newState.channelId &&
    newState.channelId !== config.lobbyId &&
    isPrivateManagedRoom(newState.channel, config)
  ) {
    cancelPrivateDelete(newState.channelId);
  }

  if (
    oldState.channelId &&
    oldState.channelId !== newState.channelId &&
    isPrivateManagedRoom(oldState.channel, config) &&
    oldState.channel.members.size === 0
  ) {
    schedulePrivateDelete(oldState.channel);
  }
}

function privateVoiceHealth() {
  let activeRooms = 0;

  for (const [guildId, config] of privateVoiceState.entries()) {
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      continue;
    }

    activeRooms += guild.channels.cache.filter((channel) =>
      isPrivateManagedRoom(channel, config),
    ).size;
  }

  return {
    configuredGuilds: privateVoiceState.size,
    activeRooms,
    pendingDeletes: privateDeleteTimers.size,
    createdRooms: privateRoomsCreated,
    deletedRooms: privateRoomsDeleted,
    lastError: privateVoiceLastError,
  };
}

async function fetchMatchPayload() {
  const url = new URL(matchDataUrl);
  url.searchParams.set("presence", String(Date.now()));

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "ISTesport-Presence-Worker/2.0",
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

  await initializePrivateVoice();
  await refreshPresence();
  scheduleRefresh();
});

client.on(
  Events.VoiceStateUpdate,
  (oldState, newState) => {
    void handlePrivateVoiceState(oldState, newState);
  },
);

client.on(Events.GuildCreate, (guild) => {
  void (async () => {
    try {
      const config = await ensurePrivateVoiceSetup(guild);
      await cleanupEmptyPrivateRooms(guild, config);
    } catch (error) {
      log("private_voice_guild_create_failed", {
        guildId: guild.id,
        message:
          error instanceof Error ? error.message : String(error),
      });
    }
  })();
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
      privateVoice: privateVoiceHealth(),
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

  for (const timer of privateDeleteTimers.values()) {
    clearTimeout(timer);
  }

  privateDeleteTimers.clear();

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
