const TWITCH_STATE_KEY = "twitch_live_snapshot_v1";
const RETRY_MS = 5 * 60 * 1000;

const COPY = {
  uk: {
    liveTitle: "🔴 ISTesport у прямому ефірі",
    offlineTitle: "⚫ Twitch зараз офлайн",
    channel: "Канал",
    game: "Гра",
    viewers: "Глядачів",
    started: "Початок",
    watch: "Дивитися Twitch",
    statusTitle: "Twitch LIVE моніторинг",
    active: "Стан: активний",
    interval: "Інтервал",
    current: "Поточний стан",
    live: "LIVE",
    offline: "OFFLINE",
    sent: "Надіслано LIVE",
    failed: "Помилки",
    preview: "Тестовий перегляд. У канал нічого не опубліковано.",
    testTitle: "Тест LIVE сповіщення ISTesport",
  },
  ru: {
    liveTitle: "🔴 ISTesport в прямом эфире",
    offlineTitle: "⚫ Twitch сейчас офлайн",
    channel: "Канал",
    game: "Игра",
    viewers: "Зрителей",
    started: "Начало",
    watch: "Смотреть Twitch",
    statusTitle: "Twitch LIVE мониторинг",
    active: "Состояние: активно",
    interval: "Интервал",
    current: "Текущее состояние",
    live: "LIVE",
    offline: "OFFLINE",
    sent: "Отправлено LIVE",
    failed: "Ошибки",
    preview: "Тестовый просмотр. В канал ничего не опубликовано.",
    testTitle: "Тест LIVE уведомления ISTesport",
  },
  en: {
    liveTitle: "🔴 ISTesport is live",
    offlineTitle: "⚫ Twitch is currently offline",
    channel: "Channel",
    game: "Game",
    viewers: "Viewers",
    started: "Started",
    watch: "Watch on Twitch",
    statusTitle: "Twitch LIVE monitoring",
    active: "Status: active",
    interval: "Interval",
    current: "Current status",
    live: "LIVE",
    offline: "OFFLINE",
    sent: "LIVE posts sent",
    failed: "Failed",
    preview: "Test preview. Nothing was posted to the channel.",
    testTitle: "ISTesport LIVE notification test",
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

function formatDate(value, lang) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale =
    lang === "uk" ? "uk-UA" :
    lang === "ru" ? "ru-RU" :
    "en-US";

  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function streamThumbnail(stream) {
  const template = cleanText(stream?.thumbnail_url);
  if (!template) return "";

  return template
    .replace("{width}", "1280")
    .replace("{height}", "720");
}

function buildLiveMessage(stream, user, lang, preview = false) {
  const copy = COPY[lang];
  const lines = [];

  if (preview) {
    lines.push(`🧪 <b>${escapeHtml(copy.preview)}</b>`, "");
  }

  lines.push(
    `<b>${escapeHtml(preview ? copy.testTitle : copy.liveTitle)}</b>`,
    "",
  );

  const title = cleanText(stream?.title);
  if (title) {
    lines.push(`<b>${escapeHtml(clip(title, 240))}</b>`);
  }

  const displayName =
    cleanText(stream?.user_name) ||
    cleanText(user?.display_name) ||
    cleanText(user?.login);

  if (displayName) {
    lines.push(`${copy.channel}: <b>${escapeHtml(displayName)}</b>`);
  }

  const game = cleanText(stream?.game_name);
  if (game) {
    lines.push(`${copy.game}: <b>${escapeHtml(game)}</b>`);
  }

  if (stream?.viewer_count !== null && stream?.viewer_count !== undefined) {
    lines.push(
      `${copy.viewers}: <b>${escapeHtml(Number(stream.viewer_count) || 0)}</b>`,
    );
  }

  const started = formatDate(stream?.started_at, lang);
  if (started) {
    lines.push(`${copy.started}: <b>${escapeHtml(started)}</b>`);
  }

  return lines.join("\n");
}

export function createTwitchAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  channel,
  ownerId,
  hasRole,
}) {
  const clientId = String(process.env.TWITCH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.TWITCH_CLIENT_SECRET || "").trim();
  const twitchLogin = String(
    process.env.TWITCH_CHANNEL_LOGIN || "kortavyj",
  ).trim().replace(/^@/, "").toLowerCase();

  const twitchUrl = `https://www.twitch.tv/${encodeURIComponent(twitchLogin)}`;

  const pollSeconds = Math.min(
    300,
    Math.max(30, Number(process.env.TELEGRAM_LIVE_POLL_SECONDS || 60)),
  );

  const channelLanguage = localeKey(
    process.env.TELEGRAM_CHANNEL_LANGUAGE || "uk",
  );

  let appToken = null;
  let appTokenExpiresAt = 0;
  let broadcaster = null;
  let timer = null;
  let running = false;
  let initialized = false;
  let lastFetchAt = null;
  let lastError = null;
  let lastLive = null;

  function validateConfig() {
    if (!clientId) {
      throw new Error("TWITCH_CLIENT_ID is required");
    }

    if (!clientSecret) {
      throw new Error("TWITCH_CLIENT_SECRET is required");
    }

    if (!twitchLogin) {
      throw new Error("TWITCH_CHANNEL_LOGIN is required");
    }
  }

  async function requestAppToken() {
    validateConfig();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const response = await fetch(
      "https://id.twitch.tv/oauth2/token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.access_token) {
      throw new Error(
        `Twitch OAuth ${response.status}: ${payload?.message || "token request failed"}`,
      );
    }

    appToken = payload.access_token;

    const expiresIn = Math.max(60, Number(payload.expires_in || 3600));
    appTokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

    return appToken;
  }

  async function accessToken(force = false) {
    if (
      !force &&
      appToken &&
      Date.now() < appTokenExpiresAt
    ) {
      return appToken;
    }

    return requestAppToken();
  }

  async function helix(path, retry = true) {
    const token = await accessToken();

    const response = await fetch(
      `https://api.twitch.tv/helix${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": clientId,
        },
      },
    );

    if (response.status === 401 && retry) {
      await accessToken(true);
      return helix(path, false);
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `Twitch Helix ${response.status}: ${payload?.message || "request failed"}`,
      );
    }

    return payload;
  }

  async function getBroadcaster() {
    if (broadcaster) return broadcaster;

    const payload = await helix(
      `/users?login=${encodeURIComponent(twitchLogin)}`,
    );

    const user = Array.isArray(payload?.data) ? payload.data[0] : null;

    if (!user) {
      throw new Error(`Twitch user not found: ${twitchLogin}`);
    }

    broadcaster = user;
    return user;
  }

  async function fetchLive() {
    const user = await getBroadcaster();

    const payload = await helix(
      `/streams?user_id=${encodeURIComponent(user.id)}`,
    );

    const stream = Array.isArray(payload?.data) ? payload.data[0] : null;

    lastFetchAt = new Date().toISOString();
    lastLive = stream || null;
    lastError = null;

    return { user, stream };
  }

  async function getState() {
    const { data, error } = await supabase
      .from("telegram_bot_state")
      .select("value")
      .eq("key", TWITCH_STATE_KEY)
      .maybeSingle();

    if (error) throw error;
    return data?.value || null;
  }

  async function saveState(stream) {
    const value = {
      updatedAt: new Date().toISOString(),
      live: Boolean(stream),
      activeStreamId: cleanText(stream?.id) || null,
      startedAt: stream?.started_at || null,
    };

    const { error } = await supabase
      .from("telegram_bot_state")
      .upsert(
        {
          key: TWITCH_STATE_KEY,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

    if (error) throw error;
    return value;
  }

  async function ensureBaseline() {
    validateConfig();

    const state = await getState();

    if (state) {
      initialized = true;
      return;
    }

    const { stream } = await fetchLive();
    const snapshot = await saveState(stream);

    initialized = true;

    console.log("telegram_twitch_baseline_initialized", {
      live: snapshot.live,
      activeStreamId: snapshot.activeStreamId,
      channel: twitchLogin,
    });
  }

  async function claimStream(stream) {
    const streamId = cleanText(stream?.id);
    if (!streamId) return false;

    const { data: existing, error: readError } = await supabase
      .from("telegram_live_publications")
      .select("status, attempt_count, updated_at")
      .eq("platform", "twitch")
      .eq("stream_id", streamId)
      .maybeSingle();

    if (readError) throw readError;

    if (existing) {
      if (["processing", "sent"].includes(existing.status)) {
        return false;
      }

      if (existing.status === "failed") {
        const updatedAt = new Date(existing.updated_at || 0).getTime();

        if (
          Number.isFinite(updatedAt) &&
          Date.now() - updatedAt < RETRY_MS
        ) {
          return false;
        }

        const { error } = await supabase
          .from("telegram_live_publications")
          .update({
            status: "processing",
            attempt_count: Number(existing.attempt_count || 0) + 1,
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("platform", "twitch")
          .eq("stream_id", streamId)
          .eq("status", "failed");

        if (error) throw error;
        return true;
      }
    }

    const { error } = await supabase
      .from("telegram_live_publications")
      .insert({
        platform: "twitch",
        stream_id: streamId,
        status: "processing",
        attempt_count: 1,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      if (error.code === "23505") return false;
      throw error;
    }

    return true;
  }

  function buttons(lang) {
    const copy = COPY[lang];

    return {
      inline_keyboard: [[
        {
          text: `🟣 ${copy.watch}`,
          url: twitchUrl,
        },
      ]],
    };
  }

  async function sendLive(chatId, stream, user, lang, preview = false) {
    const text = buildLiveMessage(stream, user, lang, preview);
    const photo =
      streamThumbnail(stream) ||
      cleanText(user?.profile_image_url);

    if (photo) {
      try {
        return await telegram("sendPhoto", {
          chat_id: chatId,
          photo,
          caption: text,
          parse_mode: "HTML",
          reply_markup: buttons(lang),
        });
      } catch (error) {
        console.error("telegram_twitch_photo_failed", errorDetails(error));
      }
    }

    return sendMessage(chatId, text, {
      reply_markup: buttons(lang),
    });
  }

  async function publishLive(stream, user) {
    const streamId = cleanText(stream?.id);
    const claimed = await claimStream(stream);

    if (!claimed) return;

    let telegramSent = false;
    let message = null;

    try {
      message = await sendLive(
        channel,
        stream,
        user,
        channelLanguage,
        false,
      );
      telegramSent = true;

      const { error } = await supabase
        .from("telegram_live_publications")
        .update({
          status: "sent",
          telegram_chat_id: String(message?.chat?.id || channel),
          telegram_message_id: Number(message?.message_id || 0) || null,
          sent_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("platform", "twitch")
        .eq("stream_id", streamId)
        .eq("status", "processing");

      if (error) throw error;

      await audit(Number(ownerId), "twitch_live_autopublished", {
        streamId,
        twitchLogin,
        telegramMessageId: message?.message_id || null,
      });

      console.log("telegram_twitch_live_published", {
        streamId,
        twitchLogin,
        telegramMessageId: message?.message_id || null,
      });
    } catch (error) {
      const details = errorDetails(error);

      if (!telegramSent) {
        const { error: updateError } = await supabase
          .from("telegram_live_publications")
          .update({
            status: "failed",
            last_error: clip(details.message, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("platform", "twitch")
          .eq("stream_id", streamId)
          .eq("status", "processing");

        if (updateError) {
          console.error(
            "telegram_twitch_failure_state_failed",
            errorDetails(updateError),
          );
        }
      } else {
        console.error("telegram_twitch_ack_failed", {
          streamId,
          note: "Telegram post succeeded; state remains processing to avoid duplicate publishing.",
          ...details,
        });
        return;
      }

      console.error("telegram_twitch_publish_failed", {
        streamId,
        ...details,
      });
    }
  }

  async function processLive() {
    const { user, stream } = await fetchLive();
    const state = await getState();

    if (!stream) {
      if (state?.live || state?.activeStreamId) {
        await saveState(null);

        console.log("telegram_twitch_offline", {
          channel: twitchLogin,
        });
      }
      return;
    }

    const streamId = cleanText(stream.id);

    if (state?.activeStreamId === streamId) {
      return;
    }

    await publishLive(stream, user);
    await saveState(stream);
  }

  async function poll() {
    if (running) return;
    running = true;

    try {
      if (!initialized) {
        await ensureBaseline();
      }

      await processLive();
      lastError = null;
    } catch (error) {
      lastError = errorDetails(error);
      console.error("telegram_twitch_poll_failed", lastError);
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

  async function publicationStats() {
    const result = { sent: 0, failed: 0 };

    for (const status of Object.keys(result)) {
      const { count, error } = await supabase
        .from("telegram_live_publications")
        .select("*", { count: "exact", head: true })
        .eq("platform", "twitch")
        .eq("status", status);

      if (error) throw error;
      result[status] = count || 0;
    }

    return result;
  }

  async function liveCommand(message, userRecord) {
    const lang = localeKey(userRecord.language);
    const copy = COPY[lang];
    const { user, stream } = await fetchLive();

    if (stream) {
      await sendLive(message.chat.id, stream, user, lang, false);
      return;
    }

    await sendMessage(
      message.chat.id,
      [
        `<b>${escapeHtml(copy.offlineTitle)}</b>`,
        "",
        `${copy.channel}: <b>${escapeHtml(user.display_name || twitchLogin)}</b>`,
      ].join("\n"),
      {
        reply_markup: buttons(lang),
      },
    );
  }

  async function statusCommand(message, userRecord) {
    const lang = localeKey(userRecord.language);
    const copy = COPY[lang];

    if (!hasRole(userRecord, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const stats = await publicationStats();
    const { stream } = await fetchLive();

    await sendMessage(
      message.chat.id,
      [
        `🟣 <b>${copy.statusTitle}</b>`,
        "",
        `✅ ${copy.active}`,
        `${copy.interval}: <code>${pollSeconds}s</code>`,
        `${copy.channel}: <code>${escapeHtml(twitchLogin)}</code>`,
        `${copy.current}: <b>${stream ? copy.live : copy.offline}</b>`,
        "",
        `${copy.sent}: <b>${stats.sent}</b>`,
        `${copy.failed}: <b>${stats.failed}</b>`,
        lastFetchAt ? `Last fetch: <code>${escapeHtml(lastFetchAt)}</code>` : "",
        lastError ? `Error: <code>${escapeHtml(lastError.message)}</code>` : "",
      ].filter(Boolean).join("\n"),
      {
        reply_markup: buttons(lang),
      },
    );
  }

  async function testCommand(message, userRecord) {
    const lang = localeKey(userRecord.language);

    if (!hasRole(userRecord, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const { user, stream } = await fetchLive();

    const previewStream = stream || {
      id: "preview",
      user_name: user.display_name || twitchLogin,
      title: COPY[lang].testTitle,
      game_name: "Counter-Strike 2",
      viewer_count: 0,
      started_at: new Date().toISOString(),
      thumbnail_url: "",
    };

    await sendLive(
      message.chat.id,
      previewStream,
      user,
      lang,
      true,
    );

    await audit(message.from.id, "twitch_live_preview_opened", {
      twitchLogin,
      actualLive: Boolean(stream),
    });
  }

  async function handleCommand(command, message, userRecord) {
    if (command === "/live") {
      await liveCommand(message, userRecord);
      return true;
    }

    if (command === "/livestatus") {
      await statusCommand(message, userRecord);
      return true;
    }

    if (command === "/livetest") {
      await testCommand(message, userRecord);
      return true;
    }

    return false;
  }

  async function handleCallback(data, query, userRecord) {
    if (data === "admin:livestatus") {
      if (!hasRole(userRecord, "editor")) {
        await answerCallback(query.id, "Access denied");
        return true;
      }

      await answerCallback(query.id);
      await statusCommand(
        { chat: query.message.chat, from: query.from },
        userRecord,
      );
      return true;
    }

    if (data === "admin:livetest") {
      if (!hasRole(userRecord, "editor")) {
        await answerCallback(query.id, "Access denied");
        return true;
      }

      await answerCallback(query.id);
      await testCommand(
        { chat: query.message.chat, from: query.from },
        userRecord,
      );
      return true;
    }

    return false;
  }

  function adminRows(lang) {
    const copy = COPY[localeKey(lang)];

    return [[
      {
        text: `🟣 ${copy.statusTitle}`,
        callback_data: "admin:livestatus",
      },
      {
        text: "🧪 LIVE test",
        callback_data: "admin:livetest",
      },
    ]];
  }

  async function initialize() {
    try {
      await ensureBaseline();
      return true;
    } catch (error) {
      lastError = errorDetails(error);
      console.error("telegram_twitch_init_failed", lastError);
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
      twitchLogin,
      twitchUrl,
      pollSeconds,
      channelLanguage,
    },
  };
}
