import { createHash } from "node:crypto";

const ROSTER_STATE_KEY = "faceit_roster_snapshot_v1";
const RETRY_MS = 5 * 60 * 1000;

const COPY = {
  uk: {
    teamTitle: "FACEIT ISTesport",
    rosterTitle: "Склад ISTesport",
    rosterUpdateTitle: "👥 Оновлення складу ISTesport",
    joined: "Приєднався",
    left: "Залишив склад",
    captain: "Капітан",
    players: "Гравців",
    matches: "Матчів",
    wins: "Перемог",
    winRate: "Вінрейт",
    tournaments: "Турнірів",
    level: "Рівень",
    elo: "ELO",
    role: "Роль",
    faceit: "Відкрити FACEIT",
    site: "Команда на сайті",
    statusTitle: "Контроль складу FACEIT",
    active: "Стан: активний",
    interval: "Інтервал",
    snapshotPlayers: "Гравців у знімку",
    sent: "Надіслано змін",
    failed: "Помилки",
    preview: "Тестовий перегляд. У канал нічого не опубліковано.",
    noRoster: "У джерелі FACEIT склад поки відсутній.",
  },
  ru: {
    teamTitle: "FACEIT ISTesport",
    rosterTitle: "Состав ISTesport",
    rosterUpdateTitle: "👥 Обновление состава ISTesport",
    joined: "Присоединился",
    left: "Покинул состав",
    captain: "Капитан",
    players: "Игроков",
    matches: "Матчей",
    wins: "Побед",
    winRate: "Винрейт",
    tournaments: "Турниров",
    level: "Уровень",
    elo: "ELO",
    role: "Роль",
    faceit: "Открыть FACEIT",
    site: "Команда на сайте",
    statusTitle: "Контроль состава FACEIT",
    active: "Состояние: активно",
    interval: "Интервал",
    snapshotPlayers: "Игроков в снимке",
    sent: "Отправлено изменений",
    failed: "Ошибки",
    preview: "Тестовый просмотр. В канал ничего не опубликовано.",
    noRoster: "В источнике FACEIT состав пока отсутствует.",
  },
  en: {
    teamTitle: "ISTesport FACEIT",
    rosterTitle: "ISTesport roster",
    rosterUpdateTitle: "👥 ISTesport roster update",
    joined: "Joined",
    left: "Left the roster",
    captain: "Captain",
    players: "Players",
    matches: "Matches",
    wins: "Wins",
    winRate: "Win rate",
    tournaments: "Tournaments",
    level: "Level",
    elo: "ELO",
    role: "Role",
    faceit: "Open FACEIT",
    site: "Team on website",
    statusTitle: "FACEIT roster watch",
    active: "Status: active",
    interval: "Interval",
    snapshotPlayers: "Players in snapshot",
    sent: "Changes sent",
    failed: "Failed",
    preview: "Test preview. Nothing was posted to the channel.",
    noRoster: "The FACEIT roster source is currently empty.",
  },
};

function localeKey(value) {
  const lang = String(value || "").toLowerCase();
  return ["uk", "ru", "en"].includes(lang) ? lang : "uk";
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clip(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function errorDetails(error) {
  if (!error) return { message: "Unknown error" };

  if (error instanceof Error) {
    return {
      name: error.name || null,
      message: error.message || String(error),
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
      status: error.status || null,
    };
  }

  if (typeof error === "object") {
    return {
      message:
        typeof error.message === "string"
          ? error.message
          : JSON.stringify(error),
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
      status: error.status || null,
    };
  }

  return { message: String(error) };
}

function playerKey(player) {
  return cleanText(player?.playerId) || cleanText(player?.nickname);
}

function normalizePlayer(player) {
  return {
    playerId: cleanText(player?.playerId),
    nickname: cleanText(player?.nickname),
    avatar: cleanText(player?.avatar),
    country: cleanText(player?.country),
    captain: Boolean(player?.captain),
    faceitUrl: cleanText(player?.faceitUrl),
    level: Number.isFinite(Number(player?.level)) ? Number(player.level) : null,
    elo: Number.isFinite(Number(player?.elo)) ? Number(player.elo) : null,
    role: cleanText(player?.role),
  };
}

function normalizeRoster(roster) {
  return (Array.isArray(roster) ? roster : [])
    .map(normalizePlayer)
    .filter((player) => playerKey(player))
    .sort((a, b) =>
      playerKey(a).localeCompare(playerKey(b), "en"),
    );
}

function compareRoster(previous, current) {
  const prevMap = new Map(
    normalizeRoster(previous).map((player) => [playerKey(player), player]),
  );
  const currMap = new Map(
    normalizeRoster(current).map((player) => [playerKey(player), player]),
  );

  const joined = [];
  const left = [];

  for (const [key, player] of currMap) {
    if (!prevMap.has(key)) joined.push(player);
  }

  for (const [key, player] of prevMap) {
    if (!currMap.has(key)) left.push(player);
  }

  return { joined, left };
}

function fingerprintChanges(changes) {
  const canonical = JSON.stringify({
    joined: changes.joined.map((player) => playerKey(player)).sort(),
    left: changes.left.map((player) => playerKey(player)).sort(),
  });

  return createHash("sha256").update(canonical).digest("hex");
}

function buildRosterUpdateMessage(changes, lang, preview = false) {
  const copy = COPY[lang];
  const lines = [];

  if (preview) {
    lines.push(`🧪 <b>${escapeHtml(copy.preview)}</b>`, "");
  }

  lines.push(`<b>${escapeHtml(copy.rosterUpdateTitle)}</b>`, "");

  for (const player of changes.joined) {
    lines.push(
      `➕ <b>${escapeHtml(copy.joined)}:</b> ${escapeHtml(player.nickname || player.playerId)}`,
    );
  }

  for (const player of changes.left) {
    lines.push(
      `➖ <b>${escapeHtml(copy.left)}:</b> ${escapeHtml(player.nickname || player.playerId)}`,
    );
  }

  return lines.join("\n");
}

function teamButtons(payload, copy, siteUrl) {
  const row = [];

  if (payload?.sourceUrl) {
    row.push({
      text: `🎯 ${copy.faceit}`,
      url: String(payload.sourceUrl),
    });
  }

  row.push({
    text: `🌐 ${copy.site}`,
    url: `${siteUrl}/team`,
  });

  return { inline_keyboard: [row] };
}

function rosterLines(payload, lang) {
  const copy = COPY[lang];
  const roster = normalizeRoster(payload?.roster);

  if (!roster.length) {
    return [
      `<b>${escapeHtml(copy.rosterTitle)}</b>`,
      "",
      escapeHtml(copy.noRoster),
    ];
  }

  const lines = [
    `<b>${escapeHtml(copy.rosterTitle)}</b>`,
    "",
  ];

  for (const player of roster) {
    const parts = [
      player.captain ? `👑 ${copy.captain}` : null,
      player.role ? `${copy.role}: ${player.role}` : null,
      player.level !== null ? `${copy.level}: ${player.level}` : null,
      player.elo !== null ? `${copy.elo}: ${player.elo}` : null,
    ].filter(Boolean);

    lines.push(
      `• <b>${escapeHtml(player.nickname || player.playerId)}</b>`,
      parts.length ? `  ${escapeHtml(parts.join(" · "))}` : "",
    );
  }

  return lines.filter(Boolean);
}

function faceitStatsLines(payload, lang) {
  const copy = COPY[lang];
  const teamName = cleanText(payload?.teamName) || "ISTesport";

  const fields = [
    [copy.players, payload?.players],
    [copy.matches, payload?.matches],
    [copy.wins, payload?.wins],
    [copy.winRate, payload?.winRate !== undefined ? `${payload.winRate}%` : null],
    [copy.tournaments, payload?.tournaments],
  ];

  const lines = [
    `🎯 <b>${escapeHtml(copy.teamTitle)}</b>`,
    "",
    `<b>${escapeHtml(teamName)}</b>`,
  ];

  for (const [label, value] of fields) {
    if (value === null || value === undefined || value === "") continue;
    lines.push(`${escapeHtml(label)}: <b>${escapeHtml(value)}</b>`);
  }

  return lines;
}

export function createFaceitAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  channel,
  siteUrl,
  ownerId,
  hasRole,
}) {
  const dataUrl = String(
    process.env.ISTE_FACEIT_DATA_URL ||
      process.env.ISTE_MATCH_DATA_URL ||
      `${siteUrl}/data/faceit-stats.json`,
  ).trim();

  const pollSeconds = Math.min(
    900,
    Math.max(60, Number(process.env.TELEGRAM_FACEIT_POLL_SECONDS || 120)),
  );

  const channelLanguage = localeKey(
    process.env.TELEGRAM_CHANNEL_LANGUAGE || "uk",
  );

  let timer = null;
  let running = false;
  let initialized = false;
  let lastFetchAt = null;
  let lastError = null;

  async function fetchData() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(dataUrl, {
        headers: {
          accept: "application/json",
          "cache-control": "no-cache",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FACEIT data HTTP ${response.status}`);
      }

      const payload = await response.json();

      lastFetchAt = new Date().toISOString();
      lastError = null;

      return {
        ...payload,
        roster: normalizeRoster(payload?.roster),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getSnapshot() {
    const { data, error } = await supabase
      .from("telegram_bot_state")
      .select("value")
      .eq("key", ROSTER_STATE_KEY)
      .maybeSingle();

    if (error) throw error;
    return data?.value || null;
  }

  async function saveSnapshot(payload) {
    const value = {
      updatedAt: new Date().toISOString(),
      sourceUpdatedAt: payload?.updatedAt || null,
      players: normalizeRoster(payload?.roster),
    };

    const { error } = await supabase
      .from("telegram_bot_state")
      .upsert(
        {
          key: ROSTER_STATE_KEY,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

    if (error) throw error;
    return value;
  }

  async function ensureBaseline() {
    const existing = await getSnapshot();

    if (existing?.players && Array.isArray(existing.players)) {
      initialized = true;
      return;
    }

    const payload = await fetchData();
    const snapshot = await saveSnapshot(payload);

    initialized = true;

    console.log("telegram_roster_baseline_initialized", {
      players: snapshot.players.length,
    });
  }

  async function loadPublication(eventKey) {
    const { data, error } = await supabase
      .from("telegram_roster_publications")
      .select("event_key, status, attempt_count, updated_at")
      .eq("event_key", eventKey)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function claimEvent(eventKey, changes) {
    const existing = await loadPublication(eventKey);
    const now = new Date().toISOString();

    if (existing) {
      if (["processing", "sent"].includes(existing.status)) {
        return { claimed: false, status: existing.status };
      }

      if (existing.status === "failed") {
        const previous = new Date(existing.updated_at || 0).getTime();

        if (
          Number.isFinite(previous) &&
          Date.now() - previous < RETRY_MS
        ) {
          return { claimed: false, status: "failed" };
        }

        const { error } = await supabase
          .from("telegram_roster_publications")
          .update({
            status: "processing",
            attempt_count: Number(existing.attempt_count || 0) + 1,
            last_error: null,
            updated_at: now,
          })
          .eq("event_key", eventKey)
          .eq("status", "failed");

        if (error) throw error;
        return { claimed: true, status: "processing" };
      }
    }

    const { error } = await supabase
      .from("telegram_roster_publications")
      .insert({
        event_key: eventKey,
        status: "processing",
        change_summary: changes,
        attempt_count: 1,
        updated_at: now,
      });

    if (error) {
      if (error.code === "23505") {
        return { claimed: false, status: "processing" };
      }
      throw error;
    }

    return { claimed: true, status: "processing" };
  }

  async function sendRosterChange(changes, preview = false, chatId = channel, lang = channelLanguage) {
    const text = buildRosterUpdateMessage(changes, lang, preview);

    return sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: `🌐 ${COPY[lang].site}`,
            url: `${siteUrl}/team`,
          },
        ]],
      },
    });
  }

  async function processRoster() {
    const payload = await fetchData();
    const snapshot = await getSnapshot();

    if (!snapshot?.players) {
      await saveSnapshot(payload);
      return;
    }

    const changes = compareRoster(snapshot.players, payload.roster);

    if (!changes.joined.length && !changes.left.length) {
      return;
    }

    const eventKey = fingerprintChanges(changes);
    const claim = await claimEvent(eventKey, changes);

    if (!claim.claimed) {
      if (claim.status === "sent") {
        await saveSnapshot(payload);
      }
      return;
    }

    let telegramSent = false;
    let message = null;

    try {
      message = await sendRosterChange(changes);
      telegramSent = true;

      const { error } = await supabase
        .from("telegram_roster_publications")
        .update({
          status: "sent",
          telegram_chat_id: String(message?.chat?.id || channel),
          telegram_message_id: Number(message?.message_id || 0) || null,
          sent_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("event_key", eventKey)
        .eq("status", "processing");

      if (error) throw error;

      await saveSnapshot(payload);

      await audit(Number(ownerId), "roster_change_autopublished", {
        eventKey,
        joined: changes.joined.map((player) => player.nickname || player.playerId),
        left: changes.left.map((player) => player.nickname || player.playerId),
        telegramMessageId: message?.message_id || null,
      });

      console.log("telegram_roster_change_published", {
        eventKey,
        joined: changes.joined.length,
        left: changes.left.length,
      });
    } catch (error) {
      const details = errorDetails(error);

      if (!telegramSent) {
        const { error: updateError } = await supabase
          .from("telegram_roster_publications")
          .update({
            status: "failed",
            last_error: clip(details.message, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("event_key", eventKey)
          .eq("status", "processing");

        if (updateError) {
          console.error(
            "telegram_roster_failure_state_failed",
            errorDetails(updateError),
          );
        }
      } else {
        console.error(
          "telegram_roster_ack_failed",
          {
            eventKey,
            note: "Telegram post succeeded; state remains processing to avoid duplicate publishing.",
            ...details,
          },
        );
        return;
      }

      console.error("telegram_roster_publish_failed", {
        eventKey,
        ...details,
      });
    }
  }

  async function poll() {
    if (running) return;
    running = true;

    try {
      if (!initialized) {
        await ensureBaseline();
      }

      await processRoster();
      lastError = null;
    } catch (error) {
      lastError = errorDetails(error);
      console.error("telegram_faceit_poll_failed", lastError);
    } finally {
      running = false;
    }
  }

  function schedulePoll() {
    clearTimeout(timer);

    timer = setTimeout(async () => {
      await poll();
      schedulePoll();
    }, pollSeconds * 1000);

    timer.unref?.();
  }

  async function stats() {
    const result = {
      sent: 0,
      failed: 0,
    };

    for (const status of Object.keys(result)) {
      const { count, error } = await supabase
        .from("telegram_roster_publications")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (error) throw error;
      result[status] = count || 0;
    }

    const snapshot = await getSnapshot();
    result.snapshotPlayers = Array.isArray(snapshot?.players)
      ? snapshot.players.length
      : 0;

    return result;
  }

  async function faceitCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const payload = await fetchData();

    await sendMessage(
      message.chat.id,
      faceitStatsLines(payload, lang).join("\n"),
      {
        reply_markup: teamButtons(payload, copy, siteUrl),
      },
    );
  }

  async function rosterCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const payload = await fetchData();

    await sendMessage(
      message.chat.id,
      rosterLines(payload, lang).join("\n"),
      {
        reply_markup: teamButtons(payload, copy, siteUrl),
      },
    );
  }

  async function statusCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const current = await stats();

    await sendMessage(
      message.chat.id,
      [
        `👥 <b>${copy.statusTitle}</b>`,
        "",
        `✅ ${copy.active}`,
        `${copy.interval}: <code>${pollSeconds}s</code>`,
        `Source: <code>${escapeHtml(dataUrl)}</code>`,
        "",
        `${copy.snapshotPlayers}: <b>${current.snapshotPlayers}</b>`,
        `${copy.sent}: <b>${current.sent}</b>`,
        `${copy.failed}: <b>${current.failed}</b>`,
        lastFetchAt ? `Last fetch: <code>${escapeHtml(lastFetchAt)}</code>` : "",
        lastError ? `Error: <code>${escapeHtml(lastError.message)}</code>` : "",
      ].filter(Boolean).join("\n"),
    );
  }

  async function testCommand(message, user) {
    const lang = localeKey(user.language);

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const payload = await fetchData();
    const roster = normalizeRoster(payload.roster);

    if (!roster.length) {
      await sendMessage(message.chat.id, COPY[lang].noRoster);
      return;
    }

    const fakeChanges = {
      joined: [roster[0]],
      left: roster.length > 1 ? [roster[roster.length - 1]] : [],
    };

    await sendRosterChange(
      fakeChanges,
      true,
      message.chat.id,
      lang,
    );

    await audit(message.from.id, "roster_preview_opened", {
      joinedPreview: fakeChanges.joined.map((player) => player.nickname),
      leftPreview: fakeChanges.left.map((player) => player.nickname),
    });
  }

  async function handleCommand(command, message, user) {
    if (command === "/faceit") {
      await faceitCommand(message, user);
      return true;
    }

    if (command === "/roster") {
      await rosterCommand(message, user);
      return true;
    }

    if (command === "/rosterstatus") {
      await statusCommand(message, user);
      return true;
    }

    if (command === "/rostertest") {
      await testCommand(message, user);
      return true;
    }

    return false;
  }

  async function handleCallback(data, query, user) {
    if (data === "admin:rosterstatus") {
      if (!hasRole(user, "editor")) {
        await answerCallback(query.id, "Access denied");
        return true;
      }

      await answerCallback(query.id);
      await statusCommand(
        { chat: query.message.chat, from: query.from },
        user,
      );
      return true;
    }

    if (data === "admin:rostertest") {
      if (!hasRole(user, "editor")) {
        await answerCallback(query.id, "Access denied");
        return true;
      }

      await answerCallback(query.id);
      await testCommand(
        { chat: query.message.chat, from: query.from },
        user,
      );
      return true;
    }

    return false;
  }

  function adminRows(lang) {
    const copy = COPY[localeKey(lang)];

    return [[
      {
        text: `👥 ${copy.statusTitle}`,
        callback_data: "admin:rosterstatus",
      },
      {
        text: "🧪 Roster test",
        callback_data: "admin:rostertest",
      },
    ]];
  }

  async function initialize() {
    try {
      await ensureBaseline();
      return true;
    } catch (error) {
      lastError = errorDetails(error);
      console.error("telegram_faceit_init_failed", lastError);
      return false;
    }
  }

  async function start() {
    await poll();
    schedulePoll();
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    initialize,
    start,
    stop,
    handleCommand,
    handleCallback,
    adminRows,
    config: {
      dataUrl,
      pollSeconds,
      channelLanguage,
    },
  };
}
