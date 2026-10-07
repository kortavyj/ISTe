import { createServer } from "node:http";

import {
  ActivityType,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} from "discord.js";

import {
  syncDiscordCommands,
  syncDiscordGuildSubscriptionCommands,
} from "./commands.mjs";
import { createMatchAnnouncer } from "./matchAnnouncer.mjs";

const DEFAULT_MATCH_DATA_URL =
  "https://istesport.com/data/faceit-stats.json";

const DEFAULT_SITE_URL = "https://istesport.com";
const DEFAULT_TELEMETRY_URL =
  "https://niwgrrprbcgbdaloijhq.supabase.co/functions/v1/discord-worker-telemetry";
const DEFAULT_RUNTIME_URL =
  "https://niwgrrprbcgbdaloijhq.supabase.co/functions/v1/discord-worker-runtime";
const DEFAULT_IDLE_ACTIVITY = "ISTesport | istesport.com";
const DEFAULT_REFRESH_MS = 60_000;
const MIN_REFRESH_MS = 30_000;
const MAX_REFRESH_MS = 300_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_ACTIVITY_LENGTH = 128;

const AUTO_ROLE_IDS = String(process.env.DISCORD_AUTO_ROLE_IDS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const AUTO_ROLE_GUILD_ID = String(
  process.env.DISCORD_AUTO_ROLE_GUILD_ID || "",
).trim();

const INTERNAL_GUILD_ID = String(
  process.env.ISTE_INTERNAL_GUILD_ID ||
    "1334264628695404556",
).trim();

const SHOP_CHANNEL_NAME = String(
  process.env.ISTE_SHOP_CHANNEL_NAME ||
    "shop",
)
  .trim()
  .toLowerCase();

const SHOP_PANEL_FOOTER =
  "ISTe Shop • Subscription Panel";

const BOT_CONFIG_CACHE_MS = 60_000;
const guildRuntimeConfigCache = new Map();

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

const telemetryUrl = cleanText(
  process.env.ISTE_TELEMETRY_URL,
  DEFAULT_TELEMETRY_URL,
);

const runtimeUrl = cleanText(
  process.env.ISTE_RUNTIME_URL,
  DEFAULT_RUNTIME_URL,
);

const fallbackMatchAnnouncementChannelId = cleanText(
  process.env.DISCORD_MATCH_CHANNEL_ID,
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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.AutoModerationExecution,
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

let welcomeMessagesSent = 0;
let welcomeLastError = null;

let automodEventsProcessed = 0;
let automodLastEventAt = null;
let automodLastError = null;

const securityJoinWindows =
  new Map();
const securityLastBurstAlertAt =
  new Map();
let securityEventsProcessed = 0;
let securityQuarantines = 0;
let securityLastEventAt = null;
let securityLastError = null;

let publicationTimer = null;
let publicationBusy = false;
let publicationRuns = 0;
let publicationGiveawaysEnded = 0;
let publicationMessagesSent = 0;
let publicationLastRunAt = null;
let publicationLastError = null;

let healthSnapshotTimer = null;
let healthSnapshotsSent = 0;
let healthSnapshotLastAt = null;
let healthSnapshotLastError = null;

let commandSyncLastAt = null;
let commandSyncLastError = null;
let commandSyncCount = null;
let commandSyncNames = [];
let guildSubscriptionSyncLastAt = null;
let guildSubscriptionSyncLastError = null;
let guildSubscriptionSyncGuilds = [];

let shopPanelMessageId = null;
let shopPanelChannelId = null;
let shopPanelLastSyncedAt = null;
let shopPanelLastError = null;

function shopPanelLocale(value) {
  const locale =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    locale.startsWith(
      "ru",
    )
  ) {
    return "ru";
  }

  if (
    locale.startsWith(
      "en",
    )
  ) {
    return "en";
  }

  return "uk";
}

function shopSubscriptionPanelPayload(
  locale = "uk",
) {
  const lang =
    shopPanelLocale(
      locale,
    );

  const copy = {
    uk: {
      title:
        "🛒 ISTe SHOP — ISTe Bot Premium",
      intro:
        "**Офіційна підписка ISTe Bot.**\nОбери тариф, створи замовлення та заверши оплату прямо в нашому Discord.",
      starter:
        "**STARTER — $2.99 / 30 днів**\n1 Discord-сервер",
      pro:
        "**PRO — $4.99 / 30 днів**\nДо 3 Discord-серверів",
      max:
        "**MAX — $6.99 / 30 днів**\nДо 10 Discord-серверів",
      how:
        "**Як придбати**\n1️⃣ Натисни **Оформити підписку**.\n2️⃣ Обери Starter, Pro або Max.\n3️⃣ Обери Discord-сервер для ліцензії.\n4️⃣ ISTe Bot створить персональне замовлення в цьому каналі.\n5️⃣ Після оплати адміністрація ISTe підтвердить замовлення.\n6️⃣ Підписка активується автоматично на 30 днів.",
      important:
        "⚠️ **Важливо:** ISTe Bot не списує кошти автоматично. Підписка вмикається лише після підтвердження оплати адміністрацією ISTe.",
      button:
        "Оформити підписку",
    },
    ru: {
      title:
        "🛒 ISTe SHOP — ISTe Bot Premium",
      intro:
        "**Официальная подписка ISTe Bot.**\nВыбери тариф, создай заказ и заверши оплату прямо в нашем Discord.",
      starter:
        "**STARTER — $2.99 / 30 дней**\n1 Discord-сервер",
      pro:
        "**PRO — $4.99 / 30 дней**\nДо 3 Discord-серверов",
      max:
        "**MAX — $6.99 / 30 дней**\nДо 10 Discord-серверов",
      how:
        "**Как купить**\n1️⃣ Нажми **Оформить подписку**.\n2️⃣ Выбери Starter, Pro или Max.\n3️⃣ Выбери Discord-сервер для лицензии.\n4️⃣ ISTe Bot создаст персональный заказ в этом канале.\n5️⃣ После оплаты администрация ISTe подтвердит заказ.\n6️⃣ Подписка активируется автоматически на 30 дней.",
      important:
        "⚠️ **Важно:** ISTe Bot не списывает деньги автоматически. Подписка включается только после подтверждения оплаты администрацией ISTe.",
      button:
        "Оформить подписку",
    },
    en: {
      title:
        "🛒 ISTe SHOP — ISTe Bot Premium",
      intro:
        "**Official ISTe Bot subscription.**\nChoose a plan, create an order and complete payment directly in our Discord.",
      starter:
        "**STARTER — $2.99 / 30 days**\n1 Discord server",
      pro:
        "**PRO — $4.99 / 30 days**\nUp to 3 Discord servers",
      max:
        "**MAX — $6.99 / 30 days**\nUp to 10 Discord servers",
      how:
        "**How to subscribe**\n1️⃣ Press **Get subscription**.\n2️⃣ Choose Starter, Pro or Max.\n3️⃣ Choose the Discord server for the license.\n4️⃣ ISTe Bot creates your personal order in this channel.\n5️⃣ After payment, ISTe administration confirms the order.\n6️⃣ The subscription activates automatically for 30 days.",
      important:
        "⚠️ **Important:** ISTe Bot does not charge you automatically. The subscription activates only after payment is confirmed by ISTe administration.",
      button:
        "Get subscription",
    },
  }[lang];

  return {
    embeds: [
      {
        title:
          copy.title,
        description:
          [
            copy.intro,
            "",
            copy.starter,
            "",
            copy.pro,
            "",
            copy.max,
            "",
            copy.how,
            "",
            copy.important,
          ].join("\n"),
        color: 0xe30613,
        footer: {
          text:
            SHOP_PANEL_FOOTER,
        },
        timestamp:
          new Date()
            .toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            custom_id:
              "iste:subscription-shop-open",
            label:
              copy.button,
            emoji: {
              name: "🛒",
            },
          },
        ],
      },
    ],
    allowedMentions: {
      parse: [],
    },
  };
}

async function ensureShopSubscriptionPanel() {
  if (
    !client.isReady() ||
    !client.user
  ) {
    return;
  }

  try {
    const guild =
      client.guilds.cache.get(
        INTERNAL_GUILD_ID,
      );

    if (!guild) {
      throw new Error(
        "ISTe internal guild is not connected",
      );
    }

    await guild.channels.fetch();

    const channel =
      guild.channels.cache.find(
        (item) =>
          [
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
          ].includes(
            item.type,
          ) &&
          (
            String(
              item.name ||
              "",
            )
              .trim()
              .toLowerCase() ===
              SHOP_CHANNEL_NAME ||
            String(
              item.name ||
              "",
            )
              .normalize("NFKD")
              .toLowerCase()
              .replace(
                /[^a-z0-9а-яіїєґ]+/giu,
                "",
              ) ===
              SHOP_CHANNEL_NAME
          ),
      );

    if (
      !channel ||
      !channel.isTextBased?.() ||
      typeof channel.messages
        ?.fetch !== "function"
    ) {
      throw new Error(
        "ISTe Shop text channel not found",
      );
    }

    const messages =
      await channel.messages.fetch({
        limit: 100,
      });

    const existing =
      messages.find(
        (message) =>
          message.author?.id ===
            client.user.id &&
          message.embeds.some(
            (embed) =>
              embed.footer
                ?.text ===
              SHOP_PANEL_FOOTER,
          ),
      );

    let guildLocale =
      "uk";

    try {
      const runtime =
        await fetchGuildRuntimeConfig(
          guild.id,
          {
            force: true,
          },
        );

      guildLocale =
        runtime?.settings
          ?.locale ||
        "uk";
    } catch {
      guildLocale =
        "uk";
    }

    const payload =
      shopSubscriptionPanelPayload(
        guildLocale,
      );

    const message =
      existing
        ? await existing.edit(
            payload,
          )
        : await channel.send(
            payload,
          );

    shopPanelMessageId =
      message.id;
    shopPanelChannelId =
      channel.id;
    shopPanelLastSyncedAt =
      new Date()
        .toISOString();
    shopPanelLastError =
      null;

    log(
      "shop_subscription_panel_synced",
      {
        guildId:
          guild.id,
        channelId:
          channel.id,
        messageId:
          message.id,
        updated:
          Boolean(
            existing,
          ),
      },
    );
  } catch (error) {
    shopPanelLastSyncedAt =
      new Date()
        .toISOString();
    shopPanelLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "shop_subscription_panel_sync_failed",
      {
        message:
          shopPanelLastError,
      },
    );
  }
}

function log(event, data = {}) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      event,
      ...data,
    }),
  );
}

const matchAnnouncers = new Map();

function matchAnnouncerForGuild(
  guildId,
  channelId,
) {
  const current =
    matchAnnouncers.get(
      guildId,
    );

  if (
    current?.channelId ===
      channelId &&
    current?.announcer
  ) {
    return current.announcer;
  }

  const announcer =
    createMatchAnnouncer({
      client,
      channelId,
      internalGuildId:
        guildId,
      siteUrl,
      log,
    });

  matchAnnouncers.set(
    guildId,
    {
      channelId,
      announcer,
    },
  );

  return announcer;
}

async function syncMatchAnnouncements(
  payload,
) {
  for (
    const guild
    of client.guilds.cache.values()
  ) {
    try {
      const runtime =
        await fetchGuildRuntimeConfig(
          guild.id,
        );

      if (!runtime.active) {
        matchAnnouncers.delete(
          guild.id,
        );
        continue;
      }

      const configuredChannelId =
        cleanText(
          runtime.settings
            ?.matchChannelId,
        );

      const channelId =
        configuredChannelId ||
        (
          guild.id ===
            INTERNAL_GUILD_ID
            ? fallbackMatchAnnouncementChannelId
            : ""
        );

      if (!channelId) {
        matchAnnouncers.delete(
          guild.id,
        );
        continue;
      }

      const announcer =
        matchAnnouncerForGuild(
          guild.id,
          channelId,
        );

      await announcer.sync(
        payload,
      );
    } catch (error) {
      log(
        "match_announcer_guild_failed",
        {
          guildId:
            guild.id,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
    }
  }
}

function matchAnnouncementsHealth() {
  return {
    configuredGuilds:
      matchAnnouncers.size,
    guilds:
      Array.from(
        matchAnnouncers.entries(),
      ).map(
        ([
          guildId,
          entry,
        ]) => ({
          guildId,
          ...entry.announcer
            .health(),
        }),
      ),
  };
}

function defaultGuildRuntimeConfig(guildId) {
  const internal =
    guildId ===
    INTERNAL_GUILD_ID;

  return {
    active: internal,
    plan:
      internal
        ? "internal"
        : "none",
    settings: {
      locale: "uk",
      memberRoleId: "",
      matchChannelId: "",
      welcomeTitle: "",
      welcomeMessage: "",
      welcomeMention: true,
      welcomeShowMemberCount:
        true,
      moderationClearEnabled:
        true,
      moderationTimeoutEnabled:
        true,
      automodEnabled:
        false,
      automodRuleIds: {},
      securityEnabled:
        false,
      securityAlertChannelId:
        "",
      securityQuarantineRoleId:
        "",
      securityJoinBurstThreshold:
        8,
      securityJoinBurstWindowSeconds:
        60,
      securityMinAccountAgeHours:
        24,
      securityAutoQuarantine:
        false,
      securityEmergencyMode:
        false,
      securityIgnoreBots:
        true,
      autoRolesEnabled:
        internal,
      privateVoiceEnabled:
        internal,
      welcomeEnabled: false,
      moderationEnabled: false,
      ticketsEnabled: false,
    },
  };
}

async function workerRuntimeApi(
  action,
  body = {},
) {
  const response =
    await fetch(
      runtimeUrl,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept:
            "application/json",
          "Content-Type":
            "application/json",
          Authorization:
            "Bot " +
            token,
          "User-Agent":
            "ISTesport-Discord-Worker/2.6",
        },
        body:
          JSON.stringify({
            action,
            ...body,
          }),
        signal:
          AbortSignal.timeout(
            FETCH_TIMEOUT_MS,
          ),
      },
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !==
      true
  ) {
    throw new Error(
      result?.error ||
      "Worker runtime " +
      action +
      " returned " +
      String(
        response.status,
      ),
    );
  }

  return result;
}

async function fetchGuildRuntimeConfig(
  guildId,
  {
    force = false,
  } = {},
) {
  const cached =
    guildRuntimeConfigCache.get(
      guildId,
    );

  if (
    !force &&
    cached &&
    Date.now() -
      cached.loadedAt <
      BOT_CONFIG_CACHE_MS
  ) {
    return cached.value;
  }

  const fallback =
    defaultGuildRuntimeConfig(
      guildId,
    );

  try {
    const result =
      await workerRuntimeApi(
        "config",
        {
          guildId,
        },
      );

    const value = {
      active:
        result.active ===
        true,
      plan:
        result.plan ||
        "none",
      settings: {
        ...fallback.settings,
        ...(result.settings ||
          {}),
      },
    };

    guildRuntimeConfigCache.set(
      guildId,
      {
        loadedAt:
          Date.now(),
        value,
      },
    );

    return value;
  } catch (error) {
    log(
      "guild_config_fetch_failed",
      {
        guildId,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    guildRuntimeConfigCache.set(
      guildId,
      {
        loadedAt:
          Date.now(),
        value: fallback,
      },
    );

    return fallback;
  }
}


function securityHealth() {
  return {
    eventsProcessed:
      securityEventsProcessed,
    quarantines:
      securityQuarantines,
    lastEventAt:
      securityLastEventAt,
    lastError:
      securityLastError,
  };
}

function rememberSecurityJoin(
  guildId,
  windowSeconds,
) {
  const now =
    Date.now();
  const windowMs =
    Math.max(
      10,
      Number(
        windowSeconds ||
        60,
      ) ||
      60,
    ) *
    1000;
  const previous =
    securityJoinWindows.get(
      guildId,
    ) ||
    [];
  const recent =
    previous.filter(
      (timestamp) =>
        now -
          timestamp <=
        windowMs,
    );

  recent.push(now);
  securityJoinWindows.set(
    guildId,
    recent,
  );

  return {
    count:
      recent.length,
    windowMs,
  };
}

async function writeSecurityEvent(
  member,
  {
    eventType,
    severity,
    actionTaken,
    details,
  },
) {
  await workerRuntimeApi(
    "security-event",
    {
      guildId:
        member.guild.id,
      userId:
        member.id,
      eventType,
      severity,
      actionTaken,
      details,
    },
  );
}

async function sendSecurityAlert(
  member,
  settings,
  {
    eventType,
    severity,
    actionTaken,
    reasons,
    accountAgeHours,
    joinCount,
  },
) {
  const channelId =
    cleanText(
      settings
        ?.securityAlertChannelId,
    );

  if (!channelId) {
    return;
  }

  const channel =
    member.guild.channels.cache.get(
      channelId,
    ) ||
    (
      await member.guild.channels
        .fetch(
          channelId,
        )
        .catch(
          () => null,
        )
    );

  if (
    !channel ||
    typeof channel.send !==
      "function"
  ) {
    throw new Error(
      "Configured security alert channel is unavailable",
    );
  }

  const critical =
    severity ===
    "critical";

  await channel.send({
    embeds: [
      {
        title:
          critical
            ? "🚨 ISTe Raid Guard"
            : "⚠️ ISTe Security",
        description:
          "<@" +
          member.id +
          "> flagged by Security Center.",
        color:
          critical
            ? 0xe30613
            : 0xf0ad4e,
        fields: [
          {
            name:
              "Event",
            value:
              eventType,
            inline:
              true,
          },
          {
            name:
              "Action",
            value:
              actionTaken ||
              "observed",
            inline:
              true,
          },
          {
            name:
              "Account age",
            value:
              accountAgeHours ==
              null
                ? "unknown"
                : Math.max(
                    0,
                    Math.round(
                      accountAgeHours *
                      10,
                    ) /
                      10,
                  ) +
                  " h",
            inline:
              true,
          },
          {
            name:
              "Join window",
            value:
              String(
                joinCount ||
                1,
              ),
            inline:
              true,
          },
          {
            name:
              "Signals",
            value:
              reasons.join(
                "\n",
              ) ||
              "manual",
          },
        ],
        footer: {
          text:
            "ISTe Security Center",
        },
        timestamp:
          new Date()
            .toISOString(),
      },
    ],
    allowedMentions: {
      parse: [],
    },
  });
}

async function handleSecurityJoin(
  member,
) {
  if (!member) {
    return {
      suspicious:
        false,
      blockOnboarding:
        false,
    };
  }

  const runtime =
    await fetchGuildRuntimeConfig(
      member.guild.id,
    );
  const settings =
    runtime.settings ||
    {};

  if (
    !runtime.active ||
    settings
      .securityEnabled !==
      true
  ) {
    return {
      suspicious:
        false,
      blockOnboarding:
        false,
    };
  }

  if (
    member.user?.bot &&
    settings
      .securityIgnoreBots !==
      false
  ) {
    return {
      suspicious:
        false,
      blockOnboarding:
        false,
    };
  }

  const windowState =
    rememberSecurityJoin(
      member.guild.id,
      settings
        .securityJoinBurstWindowSeconds,
    );

  const threshold =
    Math.max(
      2,
      Number(
        settings
          .securityJoinBurstThreshold ||
        8,
      ) ||
      8,
    );

  const createdAt =
    Number(
      member.user
        ?.createdTimestamp ||
      0,
    );

  const accountAgeHours =
    createdAt
      ? (
          Date.now() -
          createdAt
        ) /
        3600000
      : null;

  const minAgeHours =
    Math.max(
      0,
      Number(
        settings
          .securityMinAccountAgeHours ||
        0,
      ) ||
      0,
    );

  const burst =
    windowState.count >=
    threshold;
  const newAccount =
    minAgeHours > 0 &&
    accountAgeHours != null &&
    accountAgeHours <
      minAgeHours;
  const emergency =
    settings
      .securityEmergencyMode ===
    true;

  if (
    !burst &&
    !newAccount &&
    !emergency
  ) {
    return {
      suspicious:
        false,
      blockOnboarding:
        false,
    };
  }

  const reasons = [];

  if (emergency) {
    reasons.push(
      "Emergency mode is active",
    );
  }

  if (burst) {
    reasons.push(
      "Join burst: " +
      String(
        windowState.count,
      ) +
      " joins / " +
      String(
        Math.round(
          windowState.windowMs /
          1000,
        ),
      ) +
      "s",
    );
  }

  if (newAccount) {
    reasons.push(
      "Account younger than " +
      String(
        minAgeHours,
      ) +
      "h",
    );
  }

  const eventType =
    emergency
      ? "emergency_join"
      : burst
        ? "join_burst"
        : "new_account";
  const severity =
    emergency ||
    burst
      ? "critical"
      : "warning";

  const shouldQuarantine =
    emergency ||
    settings
      .securityAutoQuarantine ===
      true;

  let actionTaken =
    "observed";
  let quarantineError =
    "";

  if (shouldQuarantine) {
    const roleId =
      cleanText(
        settings
          .securityQuarantineRoleId,
      );

    if (!roleId) {
      actionTaken =
        "quarantine_missing_role";
      quarantineError =
        "Quarantine role is not configured";
    } else {
      try {
        await member.guild.roles.fetch();

        const role =
          member.guild.roles.cache.get(
            roleId,
          );

        if (!role) {
          throw new Error(
            "Configured quarantine role was not found",
          );
        }

        if (!role.editable) {
          throw new Error(
            "Bot role must be above quarantine role",
          );
        }

        if (
          !member.roles.cache.has(
            roleId,
          )
        ) {
          await member.roles.add(
            roleId,
            "ISTe Security Center quarantine",
          );
        }

        actionTaken =
          "quarantine";
        securityQuarantines +=
          1;
      } catch (error) {
        actionTaken =
          "quarantine_failed";
        quarantineError =
          error instanceof Error
            ? error.message
            : String(error);
      }
    }
  }

  const details = {
    reasons,
    account_age_hours:
      accountAgeHours,
    minimum_account_age_hours:
      minAgeHours,
    join_count:
      windowState.count,
    join_threshold:
      threshold,
    join_window_seconds:
      Math.round(
        windowState.windowMs /
        1000,
      ),
    emergency_mode:
      emergency,
    quarantine_error:
      quarantineError ||
      null,
  };

  try {
    await writeSecurityEvent(
      member,
      {
        eventType,
        severity,
        actionTaken,
        details,
      },
    );

    securityEventsProcessed +=
      1;
    securityLastEventAt =
      new Date()
        .toISOString();

    let shouldAlert =
      true;

    if (eventType ===
      "join_burst") {
      const last =
        securityLastBurstAlertAt.get(
          member.guild.id,
        ) ||
        0;

      if (
        Date.now() -
          last <
        windowState.windowMs
      ) {
        shouldAlert =
          false;
      } else {
        securityLastBurstAlertAt.set(
          member.guild.id,
          Date.now(),
        );
      }
    }

    if (shouldAlert) {
      await sendSecurityAlert(
        member,
        settings,
        {
          eventType,
          severity,
          actionTaken,
          reasons,
          accountAgeHours,
          joinCount:
            windowState.count,
        },
      );
    }

    securityLastError =
      quarantineError ||
      null;
  } catch (error) {
    securityLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "security_join_failed",
      {
        guildId:
          member.guild.id,
        userId:
          member.id,
        message:
          securityLastError,
      },
    );
  }

  log(
    "security_join_processed",
    {
      guildId:
        member.guild.id,
      userId:
        member.id,
      eventType,
      severity,
      actionTaken,
      joinCount:
        windowState.count,
      accountAgeHours,
    },
  );

  return {
    suspicious: true,
    blockOnboarding:
      shouldQuarantine,
    quarantined:
      actionTaken ===
      "quarantine",
  };
}

async function assignAutoRoles(member) {
  if (!member || member.user?.bot) {
    return;
  }

  const runtime =
    await fetchGuildRuntimeConfig(
      member.guild.id,
    );

  if (!runtime.active) {
    return;
  }

  let roleIds = [];

  if (
    member.guild.id ===
      AUTO_ROLE_GUILD_ID ||
    (
      member.guild.id ===
        INTERNAL_GUILD_ID &&
      AUTO_ROLE_IDS.length
    )
  ) {
    roleIds =
      AUTO_ROLE_IDS;
  } else if (
    runtime.settings
      ?.autoRolesEnabled &&
    runtime.settings
      ?.memberRoleId
  ) {
    roleIds = [
      runtime.settings
        .memberRoleId,
    ];
  }

  if (!roleIds.length) {
    return;
  }

  try {
    await member.guild.roles.fetch();

    const me =
      member.guild.members.me ||
      (await member.guild.members.fetchMe().catch(() => null));

    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      throw new Error("ISTesport Bot needs Manage Roles permission");
    }

    const roles = roleIds.map((roleId) =>
      member.guild.roles.cache.get(roleId),
    );

    const missingRoleIds = roleIds.filter(
      (_, index) => !roles[index],
    );

    if (missingRoleIds.length > 0) {
      throw new Error(
        `Configured auto role(s) not found: ${missingRoleIds.join(", ")}`,
      );
    }

    const unmanageableRoles = roles.filter((role) => !role.editable);

    if (unmanageableRoles.length > 0) {
      throw new Error(
        "Bot role must be above auto-assigned role(s): " +
        unmanageableRoles.map((role) => role.name).join(", "),
      );
    }

    const roleIdsToAdd = roles
      .filter((role) => !member.roles.cache.has(role.id))
      .map((role) => role.id);

    if (roleIdsToAdd.length === 0) {
      return;
    }

    await member.guild.roles.add(
      roleIdsToAdd,
      "ISTesport automatic role for this Discord guild",
    );

    log("auto_roles_assigned", {
      guildId: member.guild.id,
      userId: member.id,
      roleIds: roleIdsToAdd,
      plan: runtime.plan,
    });
  } catch (error) {
    log("auto_roles_failed", {
      guildId: member.guild?.id ?? null,
      userId: member.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function sendWelcomeMessage(member) {
  if (
    !member ||
    member.user?.bot
  ) {
    return;
  }

  const runtime =
    await fetchGuildRuntimeConfig(
      member.guild.id,
    );

  const channelId =
    cleanText(
      runtime.settings
        ?.welcomeChannelId,
    );

  if (
    !runtime.active ||
    !runtime.settings
      ?.welcomeEnabled ||
    !channelId
  ) {
    return;
  }

  try {
    const channel =
      member.guild.channels.cache.get(
        channelId,
      ) ||
      (
        await member.guild.channels
          .fetch(
            channelId,
          )
          .catch(
            () => null,
          )
      );

    if (
      !channel ||
      typeof channel.send !==
        "function" ||
      (
        typeof channel
          .isTextBased ===
          "function" &&
        !channel.isTextBased()
      )
    ) {
      throw new Error(
        "Configured welcome channel is unavailable or is not text based",
      );
    }

    const english =
      runtime.settings
        ?.locale ===
      "en";

    const mentionEnabled =
      runtime.settings
        ?.welcomeMention !==
      false;

    const showMemberCount =
      runtime.settings
        ?.welcomeShowMemberCount !==
      false;

    const displayName =
      cleanText(
        member.displayName ||
          member.user
            ?.globalName ||
          member.user
            ?.username,
        english
          ? "member"
          : "учасник",
      );

    const memberCount =
      Number.isFinite(
        member.guild
          .memberCount,
      )
        ? member.guild
            .memberCount
        : null;

    const avatarUrl =
      member.user
        ?.displayAvatarURL?.({
          size: 256,
        }) ||
      "";

    const renderWelcomeTemplate =
      (
        value,
        fallback,
      ) => {
        const template =
          cleanText(
            value,
            fallback,
          );

        return template
          .replaceAll(
            "{{user}}",
            displayName,
          )
          .replaceAll(
            "{{server}}",
            member.guild.name,
          )
          .replaceAll(
            "{{count}}",
            memberCount == null
              ? "—"
              : String(
                  memberCount,
                ),
          );
      };

    const welcomeTitle =
      renderWelcomeTemplate(
        runtime.settings
          ?.welcomeTitle,
        english
          ? "Welcome to {{server}}!"
          : "Ласкаво просимо до {{server}}!",
      )
        .slice(0, 256);

    const welcomeMessage =
      renderWelcomeTemplate(
        runtime.settings
          ?.welcomeMessage,
        english
          ? "**{{user}}**, welcome to the community. Please read the server rules and make yourself at home."
          : "**{{user}}**, вітаємо у спільноті. Ознайомся з правилами сервера та почувайся як удома.",
      )
        .slice(0, 4096);

    const embed = {
      title:
        welcomeTitle,
      description:
        welcomeMessage,
      color: 0xe30613,
      fields:
        showMemberCount &&
        memberCount
          ? [
              {
                name: english
                  ? "Members"
                  : "Учасників",
                value:
                  String(
                    memberCount,
                  ),
                inline: true,
              },
            ]
          : [],
      footer: {
        text:
          "ISTe Bot • istesport.com",
      },
      timestamp:
        new Date()
          .toISOString(),
      ...(
        avatarUrl
          ? {
              thumbnail: {
                url:
                  avatarUrl,
              },
            }
          : {}
      ),
    };

    await channel.send({
      ...(
        mentionEnabled
          ? {
              content:
                `<@${member.id}>`,
            }
          : {}
      ),
      embeds: [embed],
      allowedMentions: {
        parse: [],
        users:
          mentionEnabled
            ? [
                member.id,
              ]
            : [],
      },
    });

    welcomeMessagesSent += 1;
    welcomeLastError = null;

    log(
      "welcome_message_sent",
      {
        guildId:
          member.guild.id,
        channelId,
        userId:
          member.id,
        locale:
          english
            ? "en"
            : "uk",
      },
    );
  } catch (error) {
    welcomeLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "welcome_message_failed",
      {
        guildId:
          member.guild?.id ??
          null,
        channelId,
        userId:
          member.id,
        message:
          welcomeLastError,
      },
    );
  }
}

function welcomeHealth() {
  return {
    messagesSent:
      welcomeMessagesSent,
    lastError:
      welcomeLastError,
  };
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


function buildPrivateRoomPanelData(channelId, ownerId, {
  locked = true,
  hidden = true,
  userLimit = 0,
  rtcRegion = null,
} = {}) {
  const lockLabel = locked ? "🔓 Открыть" : "🔒 Закрыть";
  const visibilityLabel = hidden ? "👁️ Показать" : "🙈 Скрыть";

  return {
    embeds: [
      {
        title: "🔒 Управление приватной комнатой",
        description:
          `⭐ **Владелец:** <@${ownerId}>\n\n` +
          "Только владелец комнаты может использовать элементы управления ниже.",
        color: 0xe30613,
        fields: [
          {
            name: "👥 Лимит",
            value: userLimit > 0 ? String(userLimit) : "Без лимита",
            inline: true,
          },
          {
            name: "🔐 Вход",
            value: locked ? "Закрыт" : "Открыт",
            inline: true,
          },
          {
            name: "👁️ Видимость",
            value: hidden ? "Скрыта" : "Видна",
            inline: true,
          },
          {
            name: "🌍 Регион",
            value: rtcRegion || "Automatic",
            inline: true,
          },
        ],
        footer: {
          text: "ISTesport Private Voice",
        },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            label: "✏️ Название",
            custom_id: `pv:rename:${channelId}:${ownerId}`,
          },
          {
            type: 2,
            style: 2,
            label: "👥 Лимит",
            custom_id: `pv:limit:${channelId}:${ownerId}`,
          },
          {
            type: 2,
            style: locked ? 3 : 2,
            label: lockLabel,
            custom_id: `pv:lock:${channelId}:${ownerId}`,
          },
          {
            type: 2,
            style: hidden ? 3 : 2,
            label: visibilityLabel,
            custom_id: `pv:hide:${channelId}:${ownerId}`,
          },
          {
            type: 2,
            style: 4,
            label: "🗑️ Удалить",
            custom_id: `pv:delete:${channelId}:${ownerId}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 5,
            custom_id: `pv:invite:${channelId}:${ownerId}`,
            placeholder: "➕ Выдать доступ пользователю",
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 5,
            custom_id: `pv:manage:${channelId}:${ownerId}`,
            placeholder: "👤 Управление участником",
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: `pv:region:${channelId}:${ownerId}`,
            placeholder: "🌍 Выбрать голосовой регион",
            min_values: 1,
            max_values: 1,
            options: [
              {
                label: "Automatic",
                value: "automatic",
                description: "Discord выберет лучший регион автоматически",
              },
              {
                label: "Europe",
                value: "rotterdam",
                description: "Европейский голосовой регион",
              },
              {
                label: "US East",
                value: "us-east",
              },
              {
                label: "US West",
                value: "us-west",
              },
              {
                label: "Singapore",
                value: "singapore",
              },
            ],
          },
        ],
      },
    ],
    allowedMentions: {
      parse: [],
      users: [ownerId],
    },
  };
}

async function ensurePrivateRoomPanel(room, ownerId) {
  if (!room || !ownerId || typeof room.send !== "function") {
    return;
  }

  try {
    let existingPanel = null;

    if (room.messages?.fetch) {
      const recent = await room.messages.fetch({ limit: 20 }).catch(() => null);

      if (recent) {
        existingPanel = recent.find((message) =>
          message.components?.some((row) =>
            row.components?.some((component) =>
              String(component.customId || "").startsWith("pv:"),
            ),
          ),
        );
      }
    }

    if (existingPanel) {
      return;
    }

    const everyone = room.permissionOverwrites.cache.get(
      room.guild.roles.everyone.id,
    );

    const locked = Boolean(
      everyone?.deny?.has(PermissionFlagsBits.Connect),
    );

    const hidden = Boolean(
      everyone?.deny?.has(PermissionFlagsBits.ViewChannel),
    );

    await room.send(
      buildPrivateRoomPanelData(room.id, ownerId, {
        locked,
        hidden,
        userLimit: room.userLimit || 0,
        rtcRegion: room.rtcRegion || null,
      }),
    );

    log("private_voice_panel_created", {
      guildId: room.guild.id,
      channelId: room.id,
      ownerId,
    });
  } catch (error) {
    log("private_voice_panel_failed", {
      guildId: room.guild?.id ?? null,
      channelId: room.id,
      ownerId,
      message:
        error instanceof Error ? error.message : String(error),
    });
  }
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

      await ensurePrivateRoomPanel(existing, member.id);

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
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
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
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
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

    await ensurePrivateRoomPanel(room, member.id);
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
      const runtime =
        await fetchGuildRuntimeConfig(
          guild.id,
          {
            force: true,
          },
        );

      if (
        !runtime.active ||
        !runtime.settings
          ?.privateVoiceEnabled
      ) {
        log(
          "private_voice_skipped",
          {
            guildId:
              guild.id,
            plan:
              runtime.plan,
          },
        );
        continue;
      }

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

  const runtime =
    await fetchGuildRuntimeConfig(
      guild.id,
    );

  if (
    !runtime.active ||
    !runtime.settings
      ?.privateVoiceEnabled
  ) {
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
    await syncMatchAnnouncements(
      payload,
    );
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


async function publicationApi(
  action,
  body = {},
) {
  const mappedAction =
    action ===
      "worker-publications-due"
      ? "publications-due"
      : action ===
          "worker-publication-result"
        ? "publication-result"
        : action;

  return workerRuntimeApi(
    mappedAction,
    body,
  );
}

function scheduledDiscordPayload(
  job,
) {
  const embeds = [];

  if (
    job.embed_title ||
    job.embed_description
  ) {
    embeds.push({
      title:
        cleanText(
          job.embed_title,
        ).slice(
          0,
          256,
        ) ||
        undefined,
      description:
        cleanText(
          job.embed_description,
        ).slice(
          0,
          4096,
        ) ||
        undefined,
      color: 0xe30613,
      footer: {
        text:
          "ISTe Bot • istesport.com",
      },
      timestamp:
        new Date()
          .toISOString(),
    });
  }

  return {
    content:
      cleanText(
        job.content,
      ).slice(
        0,
        2000,
      ) ||
      undefined,
    embeds,
    allowedMentions: {
      parse: [],
    },
  };
}

function endedGiveawayEmbed(
  job,
) {
  const english =
    job.locale ===
    "en";

  const endsAt =
    new Date(
      job.ends_at,
    );

  const unix =
    Math.floor(
      endsAt.getTime() /
      1000,
    );

  const fields = [
    {
      name:
        english
          ? "Winners"
          : "Переможців",
      value:
        String(
          job.winner_count ||
          1,
        ),
      inline: true,
    },
    {
      name:
        english
          ? "Participants"
          : "Учасників",
      value:
        String(
          job.participant_count ||
          0,
        ),
      inline: true,
    },
    {
      name:
        english
          ? "Ended"
          : "Завершено",
      value:
        "<t:" +
        String(unix) +
        ":f>",
      inline: true,
    },
  ];

  if (
    cleanText(
      job.required_role_id,
    )
  ) {
    fields.push({
      name:
        english
          ? "Required role"
          : "Обов'язкова роль",
      value:
        "<@&" +
        String(
          job.required_role_id,
        ) +
        ">",
      inline: false,
    });
  }

  return {
    title:
      "🎁 " +
      cleanText(
        job.prize,
        "ISTe Giveaway",
      ).slice(
        0,
        240,
      ),
    description:
      [
        cleanText(
          job.description,
        ).slice(
          0,
          3000,
        ),
        english
          ? "🏁 Giveaway ended"
          : "🏁 Розіграш завершено",
      ]
        .filter(Boolean)
        .join("\n\n"),
    color: 0xe30613,
    fields,
    footer: {
      text:
        "ISTe Giveaways • istesport.com",
    },
    timestamp:
      new Date()
        .toISOString(),
  };
}

async function processScheduledPublication(
  job,
) {
  try {
    const channel =
      await client.channels.fetch(
        String(
          job.channel_id,
        ),
      );

    if (
      !channel ||
      typeof channel.send !==
        "function"
    ) {
      throw new Error(
        "Scheduled channel is not sendable",
      );
    }

    const message =
      await channel.send(
        scheduledDiscordPayload(
          job,
        ),
      );

    await publicationApi(
      "worker-publication-result",
      {
        kind:
          "scheduled",
        id:
          job.id,
        ok: true,
        messageId:
          message?.id ||
          "",
      },
    );

    publicationMessagesSent +=
      1;
  } catch (error) {
    await publicationApi(
      "worker-publication-result",
      {
        kind:
          "scheduled",
        id:
          job.id,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    ).catch(
      () => null,
    );

    throw error;
  }
}

async function processGiveawayPublication(
  job,
) {
  try {
    const channel =
      await client.channels.fetch(
        String(
          job.channel_id,
        ),
      );

    if (
      !channel ||
      typeof channel.send !==
        "function"
    ) {
      throw new Error(
        "Giveaway channel is not sendable",
      );
    }

    if (
      cleanText(
        job.message_id,
      ) &&
      channel.messages
    ) {
      const message =
        await channel.messages.fetch(
          String(
            job.message_id,
          ),
        );

      await message.edit({
        embeds: [
          endedGiveawayEmbed(
            job,
          ),
        ],
        components: [],
        allowedMentions: {
          parse: [],
        },
      });
    }

    const winners =
      Array.isArray(
        job.winner_user_ids,
      )
        ? job
            .winner_user_ids
            .map(
              (value) =>
                String(value),
            )
            .filter(Boolean)
        : [];

    const english =
      job.locale ===
      "en";

    const winnerText =
      winners.length
        ? winners
            .map(
              (id) =>
                "<@" +
                id +
                ">",
            )
            .join(" ")
        : "";

    const content =
      winners.length
        ? (
            english
              ? "🏆 Giveaway winner"
              : "🏆 Переможець розіграшу"
          ) +
          (
            winners.length > 1
              ? (
                  english
                    ? "s"
                    : "і"
                )
              : ""
          ) +
          ": " +
          winnerText +
          "\n🎁 **" +
          cleanText(
            job.prize,
            "ISTe Giveaway",
          ).slice(
            0,
            180,
          ) +
          "**"
        : (
            english
              ? "🏁 Giveaway **" +
                cleanText(
                  job.prize,
                  "ISTe Giveaway",
                ).slice(
                  0,
                  180,
                ) +
                "** ended without eligible participants."
              : "🏁 Розіграш **" +
                cleanText(
                  job.prize,
                  "ISTe Giveaway",
                ).slice(
                  0,
                  180,
                ) +
                "** завершився без учасників."
          );

    await channel.send({
      content,
      allowedMentions: {
        parse: [],
        users:
          winners,
      },
    });

    await publicationApi(
      "worker-publication-result",
      {
        kind:
          "giveaway",
        id:
          job.id,
        ok: true,
      },
    );

    publicationGiveawaysEnded +=
      1;
  } catch (error) {
    await publicationApi(
      "worker-publication-result",
      {
        kind:
          "giveaway",
        id:
          job.id,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    ).catch(
      () => null,
    );

    throw error;
  }
}

async function refreshPublications() {
  if (
    publicationBusy ||
    !client.isReady()
  ) {
    return;
  }

  publicationBusy = true;
  publicationLastRunAt =
    new Date()
      .toISOString();

  try {
    const due =
      await publicationApi(
        "worker-publications-due",
      );

    for (
      const job
      of (due.scheduled || [])
    ) {
      try {
        await processScheduledPublication(
          job,
        );
      } catch (error) {
        log(
          "scheduled_publication_failed",
          {
            id:
              job.id,
            message:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      }
    }

    for (
      const job
      of (due.giveaways || [])
    ) {
      try {
        await processGiveawayPublication(
          job,
        );
      } catch (error) {
        log(
          "giveaway_publication_failed",
          {
            id:
              job.id,
            message:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      }
    }

    publicationRuns +=
      1;
    publicationLastError =
      null;
  } catch (error) {
    publicationLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "publication_refresh_failed",
      {
        message:
          publicationLastError,
      },
    );
  } finally {
    publicationBusy = false;
  }
}

function schedulePublications() {
  if (publicationTimer) {
    clearInterval(
      publicationTimer,
    );
  }

  publicationTimer =
    setInterval(
      () => {
        void refreshPublications();
      },
      30000,
    );
}

function publicationsHealth() {
  return {
    busy:
      publicationBusy,
    runs:
      publicationRuns,
    giveawaysEnded:
      publicationGiveawaysEnded,
    messagesSent:
      publicationMessagesSent,
    lastRunAt:
      publicationLastRunAt,
    lastError:
      publicationLastError,
  };
}



async function telemetryApi(
  body,
) {
  const response =
    await fetch(
      telemetryUrl,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept:
            "application/json",
          "Content-Type":
            "application/json",
          Authorization:
            "Bot " +
            token,
          "User-Agent":
            "ISTesport-Discord-Worker/2.5",
        },
        body:
          JSON.stringify(
            body,
          ),
        signal:
          AbortSignal.timeout(
            FETCH_TIMEOUT_MS,
          ),
      },
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !==
      true
  ) {
    throw new Error(
      result?.error ||
      "Telemetry endpoint returned " +
      String(
        response.status,
      ),
    );
  }

  return result;
}

async function reportMemberLifecycle(
  member,
  type,
) {
  try {
    await telemetryApi({
      action:
        "member",
      guildId:
        member.guild.id,
      userId:
        member.id,
      type,
      memberCount:
        member.guild
          .memberCount,
      isBot:
        member.user?.bot ===
        true,
      accountCreatedAt:
        member.user
          ?.createdAt
          ?.toISOString?.() ||
        null,
    });

    log(
      "member_lifecycle_reported",
      {
        guildId:
          member.guild.id,
        userId:
          member.id,
        type,
        memberCount:
          member.guild
            .memberCount,
      },
    );
  } catch (error) {
    log(
      "member_lifecycle_report_failed",
      {
        guildId:
          member.guild?.id ??
          null,
        userId:
          member.id,
        type,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

async function reportHealthSnapshot() {
  if (!client.isReady()) {
    return;
  }

  try {
    await telemetryApi({
      action:
        "health",
      workerId:
        "discord-primary",
      ready: true,
      wsPingMs:
        Number(
          client.ws.ping,
        ) ||
        0,
      uptimeSeconds:
        Math.round(
          process.uptime(),
        ),
      guildCount:
        client.guilds.cache
          .size,
      metrics: {
        lastPresence:
          lastPresenceName ||
          null,
        lastRefreshAt,
        lastSuccessfulFetchAt,
        lastError,
        privateVoice:
          privateVoiceHealth(),
        welcome:
          welcomeHealth(),
        automod:
          automodHealth(),
        security:
          securityHealth(),
        publications:
          publicationsHealth(),
        matchAnnouncements:
          matchAnnouncementsHealth(),
        commands: {
          count:
            commandSyncCount,
          names:
            commandSyncNames,
          lastSyncedAt:
            commandSyncLastAt,
          lastError:
            commandSyncLastError,
          guildSubscriptions: {
            guildIds:
              guildSubscriptionSyncGuilds,
            lastSyncedAt:
              guildSubscriptionSyncLastAt,
            lastError:
              guildSubscriptionSyncLastError,
          },
          shopPanel: {
            channelId:
              shopPanelChannelId,
            messageId:
              shopPanelMessageId,
            lastSyncedAt:
              shopPanelLastSyncedAt,
            lastError:
              shopPanelLastError,
          },
        },
      },
    });

    healthSnapshotsSent +=
      1;
    healthSnapshotLastAt =
      new Date()
        .toISOString();
    healthSnapshotLastError =
      null;
  } catch (error) {
    healthSnapshotLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "health_snapshot_failed",
      {
        message:
          healthSnapshotLastError,
      },
    );
  }
}

function scheduleHealthSnapshots() {
  if (healthSnapshotTimer) {
    clearInterval(
      healthSnapshotTimer,
    );
  }

  healthSnapshotTimer =
    setInterval(
      () => {
        void reportHealthSnapshot();
      },
      60000,
    );
}

function telemetryHealth() {
  return {
    healthSnapshotsSent,
    healthSnapshotLastAt,
    healthSnapshotLastError,
  };
}

client.once(Events.ClientReady, async (readyClient) => {
  log("discord_ready", {
    bot: readyClient.user.tag,
    userId: readyClient.user.id,
    guildCount: readyClient.guilds.cache.size,
    refreshMs,
    matchDataUrl,
    autoRolesEnabled: AUTO_ROLE_IDS.length === 2,
    autoRoleIds: AUTO_ROLE_IDS,
    autoRoleGuildId: AUTO_ROLE_GUILD_ID || null,
    matchAnnouncementsFallbackConfigured:
      Boolean(
        fallbackMatchAnnouncementChannelId,
      ),
  });

  try {
    const result = await syncDiscordCommands(
      token,
      readyClient.user.id,
    );

    commandSyncCount =
      Number(
        result?.count,
      ) || 0;
    commandSyncNames =
      Array.isArray(
        result?.commands,
      )
        ? result.commands
            .map(
              (item) =>
                String(
                  item?.name ||
                  "",
                ),
            )
            .filter(Boolean)
        : [];
    commandSyncLastAt =
      new Date()
        .toISOString();
    commandSyncLastError =
      null;

    log("discord_commands_synced", result);

    try {
      const guildIds =
        Array.from(
          readyClient.guilds.cache.keys(),
        );

      const guildResult =
        await syncDiscordGuildSubscriptionCommands(
          token,
          readyClient.user.id,
          guildIds,
        );

      guildSubscriptionSyncGuilds =
        guildIds;
      guildSubscriptionSyncLastAt =
        new Date()
          .toISOString();
      guildSubscriptionSyncLastError =
        null;

      log(
        "discord_subscription_guild_commands_synced",
        guildResult,
      );
    } catch (guildSyncError) {
      guildSubscriptionSyncLastAt =
        new Date()
          .toISOString();
      guildSubscriptionSyncLastError =
        guildSyncError instanceof Error
          ? guildSyncError.message
          : String(
              guildSyncError,
            );

      log(
        "discord_subscription_guild_commands_sync_failed",
        {
          message:
            guildSubscriptionSyncLastError,
        },
      );
    }
  } catch (error) {
    commandSyncLastAt =
      new Date()
        .toISOString();
    commandSyncLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log("discord_commands_sync_failed", {
      message:
        commandSyncLastError,
    });
  }

  await ensureShopSubscriptionPanel();
  await initializePrivateVoice();
  await refreshPresence();
  scheduleRefresh();
  await refreshPublications();
  schedulePublications();
  await reportHealthSnapshot();
  scheduleHealthSnapshots();

  setTimeout(
    () => {
      void reportHealthSnapshot();
    },
    15000,
  ).unref();
});

async function reportAutoModerationExecution(
  execution,
) {
  try {
    const guildId =
      cleanText(
        execution?.guildId,
      );
    const userId =
      cleanText(
        execution?.userId,
      );
    const channelId =
      cleanText(
        execution?.channelId,
      );
    const ruleId =
      cleanText(
        execution?.ruleId,
      );
    const actionType =
      Number(
        execution?.action
          ?.type ||
        0,
      );

    if (
      actionType !== 1 ||
      !guildId ||
      !userId ||
      !ruleId
    ) {
      return;
    }

    const runtime =
      await fetchGuildRuntimeConfig(
        guildId,
      );

    const managedRuleIds =
      Object.values(
        runtime.settings
          ?.automodRuleIds ||
        {},
      ).map(
        (value) =>
          String(value),
      );

    if (
      !runtime.active ||
      runtime.settings
        ?.automodEnabled !==
        true ||
      !managedRuleIds.includes(
        ruleId,
      )
    ) {
      return;
    }

    const result =
      await workerRuntimeApi(
        "automod-event",
        {
          guildId,
          userId,
          channelId,
          ruleId,
          actionType,
          matchedKeyword:
            cleanText(
              execution
                ?.matchedKeyword,
            )
              .slice(
                0,
                120,
              ),
        },
      );

    automodEventsProcessed +=
      1;
    automodLastEventAt =
      new Date()
        .toISOString();
    automodLastError =
      null;

    guildRuntimeConfigCache.delete(
      guildId,
    );

    log(
      "automod_event_processed",
      {
        guildId,
        userId,
        ruleId,
        caseId:
          result?.caseId ||
          null,
        warningCount:
          result
            ?.warningCount ??
          null,
        timedOut:
          result?.timedOut ===
          true,
      },
    );
  } catch (error) {
    automodLastError =
      error instanceof Error
        ? error.message
        : String(error);

    log(
      "automod_event_failed",
      {
        guildId:
          execution?.guildId ??
          null,
        userId:
          execution?.userId ??
          null,
        message:
          automodLastError,
      },
    );
  }
}

function automodHealth() {
  return {
    eventsProcessed:
      automodEventsProcessed,
    lastEventAt:
      automodLastEventAt,
    lastError:
      automodLastError,
  };
}

client.on(
  Events.AutoModerationActionExecution,
  (execution) => {
    void reportAutoModerationExecution(
      execution,
    );
  },
);

client.on(Events.GuildMemberAdd, (member) => {
  void (async () => {
    await reportMemberLifecycle(
      member,
      "join",
    );

    const security =
      await handleSecurityJoin(
        member,
      );

    if (
      security
        ?.blockOnboarding
    ) {
      return;
    }

    await assignAutoRoles(
      member,
    );

    await sendWelcomeMessage(
      member,
    );
  })();
});

client.on(
  Events.GuildMemberRemove,
  (member) => {
    void reportMemberLifecycle(
      member,
      "leave",
    );
  },
);

client.on(
  Events.VoiceStateUpdate,
  (oldState, newState) => {
    void handlePrivateVoiceState(oldState, newState);
  },
);

client.on(Events.GuildCreate, (guild) => {
  void (async () => {
    try {
      if (client.user) {
        await syncDiscordGuildSubscriptionCommands(
          token,
          client.user.id,
          [guild.id],
        );

        guildSubscriptionSyncGuilds =
          [
            ...new Set([
              ...guildSubscriptionSyncGuilds,
              guild.id,
            ]),
          ];
        guildSubscriptionSyncLastAt =
          new Date()
            .toISOString();
        guildSubscriptionSyncLastError =
          null;
      }
    } catch (error) {
      guildSubscriptionSyncLastAt =
        new Date()
          .toISOString();
      guildSubscriptionSyncLastError =
        error instanceof Error
          ? error.message
          : String(error);

      log(
        "discord_subscription_guild_command_sync_failed",
        {
          guildId:
            guild.id,
          message:
            guildSubscriptionSyncLastError,
        },
      );
    }

    try {
      const runtime =
        await fetchGuildRuntimeConfig(
          guild.id,
          {
            force: true,
          },
        );

      if (
        !runtime.active ||
        !runtime.settings
          ?.privateVoiceEnabled
      ) {
        log(
          "guild_connected_without_private_voice",
          {
            guildId:
              guild.id,
            plan:
              runtime.plan,
          },
        );
        return;
      }

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
      welcome:
        welcomeHealth(),
      automod:
        automodHealth(),
      security:
        securityHealth(),
      publications:
        publicationsHealth(),
      commands: {
        count:
          commandSyncCount,
        names:
          commandSyncNames,
        lastSyncedAt:
          commandSyncLastAt,
        lastError:
          commandSyncLastError,
      },
      telemetry:
        telemetryHealth(),
      matchAnnouncements:
        matchAnnouncementsHealth(),
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

  if (publicationTimer) {
    clearInterval(
      publicationTimer,
    );
    publicationTimer = null;
  }

  if (healthSnapshotTimer) {
    clearInterval(
      healthSnapshotTimer,
    );
    healthSnapshotTimer = null;
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
