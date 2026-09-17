const MATCH_STATE_KEY = "match_autopost_initialized";
const MATCH_RETRY_MS = 5 * 60 * 1000;
const KYIV_TIMEZONE = "Europe/Kyiv";

const COPY = {
  uk: {
    scheduleTitle: "Розклад ISTesport",
    matchesTitle: "Матчі ISTesport",
    noUpcoming: "Найближчих запланованих матчів поки немає.",
    noMatches: "Матчів поки немає.",
    live: "LIVE",
    upcoming: "Майбутній матч",
    finished: "Завершений матч",
    tournament: "Турнір",
    time: "Початок",
    score: "Рахунок",
    faceit: "Відкрити FACEIT",
    site: "Матчі на сайті",
    announcementTitle: "🎮 Новий матч ISTesport",
    reminderTitle: "⏰ Матч ISTesport скоро почнеться",
    liveTitle: "🔴 ISTesport грає зараз",
    resultWin: "🏆 Перемога ISTesport",
    resultLoss: "📉 Матч завершено",
    resultDraw: "🤝 Матч завершено",
    statusTitle: "Автопублікація матчів",
    active: "Стан: активна",
    interval: "Інтервал",
    reminder: "Нагадування",
    sent: "Надіслано",
    failed: "Помилки",
    baseline: "Базових записів",
    preview: "Тестовий перегляд. У канал нічого не опубліковано.",
    noPreview: "Немає матчу для тестового перегляду.",
    minutes: "хв",
  },
  ru: {
    scheduleTitle: "Расписание ISTesport",
    matchesTitle: "Матчи ISTesport",
    noUpcoming: "Ближайших запланированных матчей пока нет.",
    noMatches: "Матчей пока нет.",
    live: "LIVE",
    upcoming: "Будущий матч",
    finished: "Завершённый матч",
    tournament: "Турнир",
    time: "Начало",
    score: "Счёт",
    faceit: "Открыть FACEIT",
    site: "Матчи на сайте",
    announcementTitle: "🎮 Новый матч ISTesport",
    reminderTitle: "⏰ Матч ISTesport скоро начнётся",
    liveTitle: "🔴 ISTesport играет сейчас",
    resultWin: "🏆 Победа ISTesport",
    resultLoss: "📉 Матч завершён",
    resultDraw: "🤝 Матч завершён",
    statusTitle: "Автопубликация матчей",
    active: "Состояние: активна",
    interval: "Интервал",
    reminder: "Напоминание",
    sent: "Отправлено",
    failed: "Ошибки",
    baseline: "Базовых записей",
    preview: "Тестовый просмотр. В канал ничего не опубликовано.",
    noPreview: "Нет матча для тестового просмотра.",
    minutes: "мин",
  },
  en: {
    scheduleTitle: "ISTesport schedule",
    matchesTitle: "ISTesport matches",
    noUpcoming: "There are no upcoming scheduled matches yet.",
    noMatches: "There are no matches yet.",
    live: "LIVE",
    upcoming: "Upcoming match",
    finished: "Finished match",
    tournament: "Tournament",
    time: "Start",
    score: "Score",
    faceit: "Open FACEIT",
    site: "Matches on website",
    announcementTitle: "🎮 New ISTesport match",
    reminderTitle: "⏰ ISTesport match starts soon",
    liveTitle: "🔴 ISTesport is live",
    resultWin: "🏆 ISTesport victory",
    resultLoss: "📉 Match finished",
    resultDraw: "🤝 Match finished",
    statusTitle: "Match autopublishing",
    active: "Status: active",
    interval: "Interval",
    reminder: "Reminder",
    sent: "Sent",
    failed: "Failed",
    baseline: "Baseline records",
    preview: "Test preview. Nothing was posted to the channel.",
    noPreview: "There is no match available for preview.",
    minutes: "min",
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

function timestamp(value) {
  if (!value) return 0;
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : 0;
}

function scoreValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatDate(value, lang) {
  const time = timestamp(value);
  if (!time) return "";

  const locale =
    lang === "uk" ? "uk-UA" :
    lang === "ru" ? "ru-RU" :
    "en-US";

  return new Intl.DateTimeFormat(locale, {
    timeZone: KYIV_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
}

function eventTypeForPreview(match) {
  if (match?.status === "ongoing") return "live";
  if (match?.status === "finished") return "result";
  return "announcement";
}

function resultTitle(match, copy) {
  if (match?.result === "win") return copy.resultWin;
  if (match?.result === "loss") return copy.resultLoss;
  return copy.resultDraw;
}

function eventTitle(match, eventType, copy) {
  if (eventType === "reminder") return copy.reminderTitle;
  if (eventType === "live") return copy.liveTitle;
  if (eventType === "result") return resultTitle(match, copy);
  return copy.announcementTitle;
}

function matchLine(match) {
  const own = cleanText(match?.ownTeam?.name) || "ISTesport";
  const opponent = cleanText(match?.opponent?.name) || "TBD";
  return `${own} vs ${opponent}`;
}

function scoreLine(match) {
  const own = scoreValue(match?.ownTeam?.score);
  const opponent = scoreValue(match?.opponent?.score);

  if (own === null || opponent === null) return "";
  return `${own}:${opponent}`;
}

function matchButtons(match, copy, siteUrl) {
  const row = [];

  if (match?.faceitUrl) {
    row.push({
      text: `🎯 ${copy.faceit}`,
      url: String(match.faceitUrl),
    });
  }

  row.push({
    text: `🌐 ${copy.site}`,
    url: `${siteUrl}/matches`,
  });

  return { inline_keyboard: [row] };
}

function buildMatchMessage(
  match,
  eventType,
  lang,
  siteUrl,
  reminderMinutes,
  preview = false,
) {
  const copy = COPY[lang];
  const lines = [];

  if (preview) {
    lines.push(`🧪 <b>${escapeHtml(copy.preview)}</b>`, "");
  }

  lines.push(
    `<b>${escapeHtml(eventTitle(match, eventType, copy))}</b>`,
    "",
    `🎮 <b>${escapeHtml(matchLine(match))}</b>`,
  );

  const competition = cleanText(match?.competitionName);
  if (competition) {
    lines.push(
      `${copy.tournament}: <b>${escapeHtml(clip(competition, 160))}</b>`,
    );
  }

  const startTime = formatDate(
    match?.scheduledAt || match?.startedAt,
    lang,
  );

  if (startTime) {
    lines.push(`${copy.time}: <b>${escapeHtml(startTime)}</b>`);
  }

  if (eventType === "reminder" && match?.scheduledAt) {
    const minutes = Math.max(
      0,
      Math.round((timestamp(match.scheduledAt) - Date.now()) / 60000),
    );
    lines.push(
      `⏱️ ~<b>${minutes} ${copy.minutes}</b>`,
    );
  }

  const score = scoreLine(match);
  if (score && ["live", "result"].includes(eventType)) {
    lines.push(`${copy.score}: <b>${escapeHtml(score)}</b>`);
  }

  if (match?.bestOf) {
    lines.push(`BO${escapeHtml(match.bestOf)}`);
  }

  return {
    text: lines.join("\n"),
    replyMarkup: matchButtons(match, copy, siteUrl),
    photo:
      cleanText(match?.ownTeam?.avatar) ||
      cleanText(match?.opponent?.avatar),
  };
}

export function createMatchAutomation({
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
  const matchDataUrl = String(
    process.env.ISTE_MATCH_DATA_URL ||
      `${siteUrl}/data/faceit-stats.json`,
  ).trim();

  const pollSeconds = Math.min(
    300,
    Math.max(30, Number(process.env.TELEGRAM_MATCH_POLL_SECONDS || 60)),
  );

  const reminderMinutes = Math.min(
    360,
    Math.max(15, Number(process.env.TELEGRAM_MATCH_REMINDER_MINUTES || 60)),
  );

  const channelLanguage = localeKey(
    process.env.TELEGRAM_CHANNEL_LANGUAGE || "uk",
  );

  let timer = null;
  let running = false;
  let initialized = false;
  let lastFetchAt = null;
  let lastError = null;

  async function fetchMatchData() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(matchDataUrl, {
        headers: {
          accept: "application/json",
          "cache-control": "no-cache",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Match data HTTP ${response.status}`);
      }

      const payload = await response.json();

      lastFetchAt = new Date().toISOString();
      lastError = null;

      return {
        ...payload,
        teamMatches: Array.isArray(payload?.teamMatches)
          ? payload.teamMatches
          : [],
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function sendMatch(chatId, match, eventType, lang, preview = false) {
    const built = buildMatchMessage(
      match,
      eventType,
      lang,
      siteUrl,
      reminderMinutes,
      preview,
    );

    if (built.photo) {
      try {
        return await telegram("sendPhoto", {
          chat_id: chatId,
          photo: built.photo,
          caption: clip(built.text, 1000),
          parse_mode: "HTML",
          reply_markup: built.replyMarkup,
        });
      } catch (error) {
        console.error("telegram_match_photo_failed", {
          matchId: String(match?.matchId || ""),
          ...errorDetails(error),
        });
      }
    }

    return sendMessage(chatId, built.text, {
      reply_markup: built.replyMarkup,
    });
  }

  function baselineEvents(match) {
    if (match?.status === "upcoming") {
      return ["announcement"];
    }

    if (match?.status === "ongoing") {
      return ["announcement", "reminder", "live"];
    }

    if (match?.status === "finished") {
      return ["announcement", "reminder", "live", "result"];
    }

    return [];
  }

  async function ensureBaseline() {
    const { data: state, error: stateError } = await supabase
      .from("telegram_bot_state")
      .select("key")
      .eq("key", MATCH_STATE_KEY)
      .maybeSingle();

    if (stateError) throw stateError;
    if (state) {
      initialized = true;
      return;
    }

    const payload = await fetchMatchData();
    const rows = [];

    for (const match of payload.teamMatches) {
      const matchId = cleanText(match?.matchId);
      if (!matchId) continue;

      for (const eventType of baselineEvents(match)) {
        rows.push({
          match_id: matchId,
          event_type: eventType,
          status: "baseline",
          attempt_count: 0,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length) {
      const { error } = await supabase
        .from("telegram_match_publications")
        .upsert(rows, {
          onConflict: "match_id,event_type",
          ignoreDuplicates: true,
        });

      if (error) throw error;
    }

    const { error: insertError } = await supabase
      .from("telegram_bot_state")
      .insert({
        key: MATCH_STATE_KEY,
        value: {
          initializedAt: new Date().toISOString(),
          baselineEvents: rows.length,
        },
      });

    if (insertError) throw insertError;

    initialized = true;

    console.log("telegram_match_baseline_initialized", {
      eventCount: rows.length,
      matches: payload.teamMatches.length,
    });
  }

  function publicationKey(matchId, eventType) {
    return `${matchId}:${eventType}`;
  }

  async function loadPublicationMap(matches) {
    const ids = [...new Set(
      matches.map((match) => cleanText(match?.matchId)).filter(Boolean),
    )];

    if (!ids.length) return new Map();

    const { data, error } = await supabase
      .from("telegram_match_publications")
      .select(
        "match_id, event_type, status, attempt_count, updated_at",
      )
      .in("match_id", ids);

    if (error) throw error;

    return new Map(
      (data || []).map((row) => [
        publicationKey(String(row.match_id), row.event_type),
        row,
      ]),
    );
  }

  async function claimEvent(matchId, eventType, map) {
    const key = publicationKey(matchId, eventType);
    const existing = map.get(key) || null;

    if (
      existing &&
      ["baseline", "processing", "sent", "skipped"].includes(existing.status)
    ) {
      return false;
    }

    const now = new Date().toISOString();

    if (existing?.status === "failed") {
      const previous = timestamp(existing.updated_at);

      if (previous && Date.now() - previous < MATCH_RETRY_MS) {
        return false;
      }

      const { error } = await supabase
        .from("telegram_match_publications")
        .update({
          status: "processing",
          attempt_count: Number(existing.attempt_count || 0) + 1,
          last_error: null,
          updated_at: now,
        })
        .eq("match_id", matchId)
        .eq("event_type", eventType)
        .eq("status", "failed");

      if (error) throw error;

      map.set(key, {
        ...existing,
        status: "processing",
        updated_at: now,
      });

      return true;
    }

    const row = {
      match_id: matchId,
      event_type: eventType,
      status: "processing",
      attempt_count: 1,
      updated_at: now,
    };

    const { error } = await supabase
      .from("telegram_match_publications")
      .insert(row);

    if (error) {
      if (error.code === "23505") return false;
      throw error;
    }

    map.set(key, row);
    return true;
  }

  async function markSkipped(matchId, eventType, map) {
    const key = publicationKey(matchId, eventType);

    if (map.has(key)) return;

    const row = {
      match_id: matchId,
      event_type: eventType,
      status: "skipped",
      attempt_count: 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("telegram_match_publications")
      .upsert(row, {
        onConflict: "match_id,event_type",
        ignoreDuplicates: true,
      });

    if (error) throw error;
    map.set(key, row);
  }

  async function publishEvent(match, eventType, map) {
    const matchId = cleanText(match?.matchId);
    if (!matchId) return;

    const claimed = await claimEvent(matchId, eventType, map);
    if (!claimed) return;

    try {
      const message = await sendMatch(
        channel,
        match,
        eventType,
        channelLanguage,
        false,
      );

      const { error } = await supabase
        .from("telegram_match_publications")
        .update({
          status: "sent",
          telegram_chat_id: String(message?.chat?.id || channel),
          telegram_message_id: Number(message?.message_id || 0) || null,
          sent_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("match_id", matchId)
        .eq("event_type", eventType);

      if (error) throw error;

      map.set(publicationKey(matchId, eventType), {
        status: "sent",
        updated_at: new Date().toISOString(),
      });

      await audit(Number(ownerId), `match_${eventType}_autopublished`, {
        matchId,
        telegramMessageId: message?.message_id || null,
        channel,
      });

      console.log("telegram_match_published", {
        matchId,
        eventType,
        telegramMessageId: message?.message_id || null,
      });
    } catch (error) {
      const details = errorDetails(error);

      const { error: updateError } = await supabase
        .from("telegram_match_publications")
        .update({
          status: "failed",
          last_error: clip(details.message, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq("match_id", matchId)
        .eq("event_type", eventType)
        .eq("status", "processing");

      if (updateError) {
        console.error(
          "telegram_match_failure_state_failed",
          errorDetails(updateError),
        );
      }

      console.error("telegram_match_publish_failed", {
        matchId,
        eventType,
        ...details,
      });
    }
  }

  async function processMatch(match, map) {
    const matchId = cleanText(match?.matchId);
    if (!matchId) return;

    if (match?.status === "upcoming") {
      const start = timestamp(match?.scheduledAt);
      const remaining = start ? start - Date.now() : null;
      const reminderWindow = reminderMinutes * 60 * 1000;

      if (
        remaining !== null &&
        remaining > 0 &&
        remaining <= reminderWindow
      ) {
        await markSkipped(matchId, "announcement", map);
        await publishEvent(match, "reminder", map);
        return;
      }

      await publishEvent(match, "announcement", map);
      return;
    }

    if (match?.status === "ongoing") {
      await markSkipped(matchId, "announcement", map);
      await markSkipped(matchId, "reminder", map);
      await publishEvent(match, "live", map);
      return;
    }

    if (match?.status === "finished") {
      await publishEvent(match, "result", map);
    }
  }

  async function poll() {
    if (running) return;
    running = true;

    try {
      if (!initialized) {
        await ensureBaseline();
      }

      const payload = await fetchMatchData();

      const ongoing = payload.teamMatches.filter(
        (match) => match?.status === "ongoing",
      );

      const upcoming = payload.teamMatches
        .filter((match) => match?.status === "upcoming")
        .sort(
          (a, b) =>
            timestamp(a?.scheduledAt) - timestamp(b?.scheduledAt),
        );

      const finished = payload.teamMatches
        .filter((match) => match?.status === "finished")
        .sort(
          (a, b) =>
            timestamp(b?.finishedAt || b?.scheduledAt) -
            timestamp(a?.finishedAt || a?.scheduledAt),
        )
        .slice(0, 10);

      const relevant = [...ongoing, ...upcoming, ...finished];
      const map = await loadPublicationMap(relevant);

      for (const match of relevant) {
        await processMatch(match, map);
      }

      lastError = null;
    } catch (error) {
      lastError = errorDetails(error);

      console.error("telegram_match_poll_failed", lastError);
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
    const result = {
      sent: 0,
      failed: 0,
      baseline: 0,
    };

    for (const status of Object.keys(result)) {
      const { count, error } = await supabase
        .from("telegram_match_publications")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (error) throw error;
      result[status] = count || 0;
    }

    return result;
  }

  async function statusCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const stats = await publicationStats();

    await sendMessage(
      message.chat.id,
      [
        `🎮 <b>${copy.statusTitle}</b>`,
        "",
        `✅ ${copy.active}`,
        `${copy.interval}: <code>${pollSeconds}s</code>`,
        `${copy.reminder}: <code>${reminderMinutes} ${copy.minutes}</code>`,
        `Source: <code>${escapeHtml(matchDataUrl)}</code>`,
        "",
        `${copy.sent}: <b>${stats.sent}</b>`,
        `${copy.failed}: <b>${stats.failed}</b>`,
        `${copy.baseline}: <b>${stats.baseline}</b>`,
        lastFetchAt ? `Last fetch: <code>${escapeHtml(lastFetchAt)}</code>` : "",
        lastError ? `Error: <code>${escapeHtml(lastError.message)}</code>` : "",
      ].filter(Boolean).join("\n"),
    );
  }

  function scheduleMatches(payload) {
    return payload.teamMatches
      .filter((match) =>
        ["upcoming", "ongoing"].includes(match?.status),
      )
      .sort((a, b) => {
        if (a?.status === "ongoing" && b?.status !== "ongoing") return -1;
        if (b?.status === "ongoing" && a?.status !== "ongoing") return 1;
        return timestamp(a?.scheduledAt) - timestamp(b?.scheduledAt);
      });
  }

  function renderMatchList(matches, lang, title, emptyText) {
    if (!matches.length) {
      return `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(emptyText)}`;
    }

    const lines = [`<b>${escapeHtml(title)}</b>`, ""];

    for (const match of matches.slice(0, 6)) {
      const statusIcon =
        match?.status === "ongoing" ? "🔴" :
        match?.status === "upcoming" ? "🕒" :
        "✅";

      const time = formatDate(
        match?.scheduledAt || match?.startedAt || match?.finishedAt,
        lang,
      );

      const score = scoreLine(match);

      lines.push(
        `${statusIcon} <b>${escapeHtml(matchLine(match))}</b>`,
        time ? `   ${escapeHtml(time)}` : "",
        score ? `   ${escapeHtml(score)}` : "",
      );
    }

    return lines.filter(Boolean).join("\n");
  }

  async function scheduleCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const payload = await fetchMatchData();
    const matches = scheduleMatches(payload);

    await sendMessage(
      message.chat.id,
      renderMatchList(
        matches,
        lang,
        copy.scheduleTitle,
        copy.noUpcoming,
      ),
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: `🌐 ${copy.site}`,
              url: `${siteUrl}/matches`,
            },
          ]],
        },
      },
    );
  }

  async function matchesCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const payload = await fetchMatchData();

    const current = scheduleMatches(payload);
    const recent = payload.teamMatches
      .filter((match) => match?.status === "finished")
      .sort(
        (a, b) =>
          timestamp(b?.finishedAt || b?.scheduledAt) -
          timestamp(a?.finishedAt || a?.scheduledAt),
      )
      .slice(0, 3);

    const list = current.length ? current : recent;

    await sendMessage(
      message.chat.id,
      renderMatchList(list, lang, copy.matchesTitle, copy.noMatches),
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: `🌐 ${copy.site}`,
              url: `${siteUrl}/matches`,
            },
          ]],
        },
      },
    );
  }

  async function testCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, "⛔ Access denied.");
      return;
    }

    const payload = await fetchMatchData();
    const current = scheduleMatches(payload);

    const match =
      current[0] ||
      payload.teamMatches
        .filter((item) => item?.status === "finished")
        .sort(
          (a, b) =>
            timestamp(b?.finishedAt || b?.scheduledAt) -
            timestamp(a?.finishedAt || a?.scheduledAt),
        )[0];

    if (!match) {
      await sendMessage(message.chat.id, copy.noPreview);
      return;
    }

    await sendMatch(
      message.chat.id,
      match,
      eventTypeForPreview(match),
      lang,
      true,
    );

    await audit(message.from.id, "match_preview_opened", {
      matchId: String(match.matchId || ""),
    });
  }

  async function handleCommand(command, message, user) {
    if (command === "/matches") {
      await matchesCommand(message, user);
      return true;
    }

    if (command === "/schedule") {
      await scheduleCommand(message, user);
      return true;
    }

    if (command === "/matchstatus") {
      await statusCommand(message, user);
      return true;
    }

    if (command === "/matchtest") {
      await testCommand(message, user);
      return true;
    }

    return false;
  }

  async function handleCallback(data, query, user) {
    if (data === "admin:matchstatus") {
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

    if (data === "admin:matchtest") {
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
        text: `🎮 ${copy.statusTitle}`,
        callback_data: "admin:matchstatus",
      },
      {
        text: "🧪 Match test",
        callback_data: "admin:matchtest",
      },
    ]];
  }

  async function initialize() {
    try {
      await ensureBaseline();
      return true;
    } catch (error) {
      lastError = errorDetails(error);
      console.error("telegram_match_init_failed", lastError);
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
      matchDataUrl,
      pollSeconds,
      reminderMinutes,
      channelLanguage,
    },
  };
}
