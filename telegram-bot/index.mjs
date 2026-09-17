import { createTwitchAutomation } from "./twitch.mjs";
import { createFaceitAutomation } from "./faceit.mjs";
import { createMatchAutomation } from "./matches.mjs";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = requiredEnv("TELEGRAM_BOT_TOKEN");
const OWNER_ID = requiredEnv("TELEGRAM_OWNER_ID");
const CHANNEL = String(process.env.TELEGRAM_CHANNEL || "@ISTesport").trim();
const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = String(
  process.env.ISTE_SITE_URL || "https://istesport.com",
).replace(/\/+$/, "");

const POLL_TIMEOUT = Math.min(
  50,
  Math.max(10, Number(process.env.TELEGRAM_POLL_TIMEOUT || 30)),
);

const NEWS_POLL_SECONDS = Math.min(
  300,
  Math.max(15, Number(process.env.TELEGRAM_NEWS_POLL_SECONDS || 30)),
);

const CHANNEL_LANGUAGE = localeKey(
  process.env.TELEGRAM_CHANNEL_LANGUAGE || "uk",
);

const NEWS_RETRY_MS = 5 * 60 * 1000;
const NEWS_STATE_KEY = "news_autopost_initialized";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

const ROLE_LEVEL = {
  user: 0,
  editor: 10,
  moderator: 20,
  admin: 30,
  owner: 40,
};

const COPY = {
  uk: {
    startTitle: "ISTesport Bot",
    startText: "Офіційний Telegram бот ISTesport.",
    commands: "Команди",
    help: "Довідка",
    language: "Мова",
    role: "Моя роль",
    admin: "Адмін панель",
    channelCheck: "Перевірити канал",
    newsStatus: "Статус автоновин",
    newsTest: "Тест новини",
    selectLanguage: "Оберіть мову:",
    languageSaved: "Мову збережено.",
    noAccess: "Ця дія недоступна для вашої ролі.",
    dbError: "Не вдалося перевірити права. Спробуйте ще раз пізніше.",
    roleLabel: "Роль",
    ownerPanel: "Панель керування ISTesport Bot",
    adminPanelText:
      "Система ролей активна. Автопублікація новин із сайту також підключена.",
    channelOk: "Перевірка каналу завершена",
    post: "Публікація",
    edit: "Редагування",
    delete: "Видалення",
    yes: "є",
    no: "немає",
    readMore: "Читати на сайті",
    latestNews: "ОСТАННЯ НОВИНА",
    newsAutoTitle: "Автопублікація новин",
    newsAutoActive: "Стан: активна",
    interval: "Інтервал",
    channelLanguage: "Мова каналу",
    sent: "Надіслано",
    failed: "Помилки",
    baseline: "Базових записів",
    noNews: "Опублікованих новин поки немає.",
    previewOnly: "Тестовий перегляд. У канал нічого не опубліковано.",
  },
  ru: {
    startTitle: "ISTesport Bot",
    startText: "Официальный Telegram бот ISTesport.",
    commands: "Команды",
    help: "Справка",
    language: "Язык",
    role: "Моя роль",
    admin: "Админ панель",
    channelCheck: "Проверить канал",
    newsStatus: "Статус автоновостей",
    newsTest: "Тест новости",
    selectLanguage: "Выберите язык:",
    languageSaved: "Язык сохранён.",
    noAccess: "Это действие недоступно для вашей роли.",
    dbError: "Не удалось проверить права. Попробуйте ещё раз позже.",
    roleLabel: "Роль",
    ownerPanel: "Панель управления ISTesport Bot",
    adminPanelText:
      "Система ролей активна. Автопубликация новостей с сайта также подключена.",
    channelOk: "Проверка канала завершена",
    post: "Публикация",
    edit: "Редактирование",
    delete: "Удаление",
    yes: "есть",
    no: "нет",
    readMore: "Читать на сайте",
    latestNews: "ПОСЛЕДНЯЯ НОВОСТЬ",
    newsAutoTitle: "Автопубликация новостей",
    newsAutoActive: "Состояние: активна",
    interval: "Интервал",
    channelLanguage: "Язык канала",
    sent: "Отправлено",
    failed: "Ошибки",
    baseline: "Базовых записей",
    noNews: "Опубликованных новостей пока нет.",
    previewOnly: "Тестовый просмотр. В канал ничего не опубликовано.",
  },
  en: {
    startTitle: "ISTesport Bot",
    startText: "Official ISTesport Telegram bot.",
    commands: "Commands",
    help: "Help",
    language: "Language",
    role: "My role",
    admin: "Admin panel",
    channelCheck: "Check channel",
    newsStatus: "News autopost status",
    newsTest: "Test news",
    selectLanguage: "Choose a language:",
    languageSaved: "Language saved.",
    noAccess: "This action is not available for your role.",
    dbError: "Could not verify permissions. Please try again later.",
    roleLabel: "Role",
    ownerPanel: "ISTesport Bot control panel",
    adminPanelText:
      "The role system is active. Automatic news publishing from the website is also enabled.",
    channelOk: "Channel check completed",
    post: "Posting",
    edit: "Editing",
    delete: "Deleting",
    yes: "available",
    no: "missing",
    readMore: "Read on website",
    latestNews: "LATEST NEWS",
    newsAutoTitle: "News autopublishing",
    newsAutoActive: "Status: active",
    interval: "Interval",
    channelLanguage: "Channel language",
    sent: "Sent",
    failed: "Failed",
    baseline: "Baseline records",
    noNews: "There are no published news posts yet.",
    previewOnly: "Test preview. Nothing was posted to the channel.",
  },
};

const CATEGORY_TRANSLATIONS = {
  team: { uk: "КОМАНДА", ru: "КОМАНДА", en: "TEAM" },
  tournament: { uk: "ТУРНІР", ru: "ТУРНИР", en: "TOURNAMENT" },
  match: { uk: "МАТЧ", ru: "МАТЧ", en: "MATCH" },
  club: { uk: "КЛУБ", ru: "КЛУБ", en: "CLUB" },
  update: { uk: "ОНОВЛЕННЯ", ru: "ОБНОВЛЕНИЕ", en: "UPDATE" },
};

let offset = 0;
let stopping = false;
let botInfo = null;
let matchAutomation = null;
let faceitAutomation = null;
let twitchAutomation = null;
let newsTimer = null;
let newsPollRunning = false;

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function localeKey(value) {
  const lang = String(value || "").toLowerCase();
  return ["uk", "ru", "en"].includes(lang) ? lang : "uk";
}

function displayName(from) {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim()
    || from?.username
    || String(from?.id || "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clip(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function errorDetails(error) {
  if (!error) {
    return { message: "Unknown error" };
  }

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

function localizeCategory(value, lang) {
  const source = cleanText(value);
  if (!source) return "";

  const key = source.toLowerCase();
  return CATEGORY_TRANSLATIONS[key]?.[lang] || source.toUpperCase();
}

function localizedNewsField(post, lang, field) {
  const translations =
    post?.translations &&
    typeof post.translations === "object" &&
    !Array.isArray(post.translations)
      ? post.translations
      : null;

  const translated = cleanText(translations?.[lang]?.[field]);
  if (translated) return translated;

  return cleanText(post?.[field]);
}

function formatPublishedDate(value, lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale =
    lang === "uk" ? "uk-UA" :
    lang === "ru" ? "ru-RU" :
    "en-US";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function newsUrl(post) {
  // Current ISTesport News page opens articles on /news.
  // Keep the URL stable even when a slug is absent.
  return `${SITE_URL}/news`;
}

function buildNewsMessage(post, lang, preview = false) {
  const c = COPY[lang];
  const title = localizedNewsField(post, lang, "title") || "ISTesport";
  const excerpt =
    localizedNewsField(post, lang, "excerpt") ||
    localizedNewsField(post, lang, "content");

  const category = localizeCategory(post.category, lang);
  const date = formatPublishedDate(post.published_at, lang);

  const meta = [category, date].filter(Boolean).join(" · ");
  const lines = [];

  if (preview) {
    lines.push(`🧪 <b>${escapeHtml(c.previewOnly)}</b>`, "");
  }

  lines.push(`📰 <b>${escapeHtml(title)}</b>`);

  if (meta) {
    lines.push("", `<i>${escapeHtml(meta)}</i>`);
  }

  if (excerpt) {
    lines.push("", escapeHtml(clip(excerpt, 650)));
  }

  return {
    text: lines.join("\n"),
    coverUrl: cleanText(post.cover_url),
    replyMarkup: {
      inline_keyboard: [[
        {
          text: `🌐 ${c.readMore}`,
          url: newsUrl(post),
        },
      ]],
    },
  };
}

async function telegram(method, payload = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const error = new Error(
      data?.description || `Telegram API HTTP ${response.status}`,
    );
    error.status = response.status;
    error.telegram = data;
    throw error;
  }

  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

async function sendNews(chatId, post, lang, preview = false) {
  const built = buildNewsMessage(post, lang, preview);

  if (built.coverUrl) {
    try {
      return await telegram("sendPhoto", {
        chat_id: chatId,
        photo: built.coverUrl,
        caption: clip(built.text, 1000),
        parse_mode: "HTML",
        reply_markup: built.replyMarkup,
      });
    } catch (error) {
      console.error("telegram_news_photo_failed", {
        newsPostId: String(post.id),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return sendMessage(chatId, built.text, {
    reply_markup: built.replyMarkup,
  });
}

async function answerCallback(callbackQueryId, text = "") {
  return telegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

async function audit(actorId, action, metadata = {}) {
  const { error } = await supabase.from("telegram_bot_audit_log").insert({
    actor_telegram_user_id: Number(actorId),
    action,
    metadata,
  });

  if (error) {
    console.error("telegram_audit_failed", {
      action,
      code: error.code || null,
      message: error.message || null,
    });
  }
}

async function upsertUser(from, preferredLanguage = null) {
  const telegramUserId = Number(from?.id);
  if (!Number.isSafeInteger(telegramUserId)) {
    throw new Error("Invalid Telegram user ID");
  }

  const row = {
    telegram_user_id: telegramUserId,
    username: from?.username || null,
    display_name: displayName(from),
    updated_at: new Date().toISOString(),
  };

  if (preferredLanguage) {
    row.language = localeKey(preferredLanguage);
  }

  const { data, error } = await supabase
    .from("telegram_bot_users")
    .upsert(row, { onConflict: "telegram_user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function getUser(from) {
  const telegramUserId = Number(from?.id);

  const { data, error } = await supabase
    .from("telegram_bot_users")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    if (
      data.username !== (from?.username || null) ||
      data.display_name !== displayName(from)
    ) {
      return upsertUser(from, data.language);
    }
    return data;
  }

  return upsertUser(from, from?.language_code);
}

async function ensureOwner() {
  const numericOwnerId = Number(OWNER_ID);
  if (!Number.isSafeInteger(numericOwnerId)) {
    throw new Error("TELEGRAM_OWNER_ID must be a numeric Telegram user ID");
  }

  const { error } = await supabase
    .from("telegram_bot_users")
    .upsert(
      {
        telegram_user_id: numericOwnerId,
        role: "owner",
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_user_id" },
    );

  if (error) throw error;
}

function hasRole(user, minimumRole) {
  if (!user?.active) return false;
  return (ROLE_LEVEL[user.role] ?? -1) >= (ROLE_LEVEL[minimumRole] ?? 999);
}

function normalizeCommand(text) {
  const first = String(text || "").trim().split(/\s+/)[0] || "";
  return first.split("@")[0].toLowerCase();
}

function mainKeyboard(lang, privileged) {
  const c = COPY[lang];

  const rows = [
    [
      { text: `🌐 ${c.language}`, callback_data: "menu:language" },
      { text: `👤 ${c.role}`, callback_data: "menu:role" },
    ],
    [
      { text: "🌐 ISTesport", url: SITE_URL },
      { text: "📣 Telegram", url: "https://t.me/ISTesport" },
    ],
  ];

  if (privileged) {
    rows.unshift([
      { text: `🛡️ ${c.admin}`, callback_data: "menu:admin" },
    ]);
  }

  return { inline_keyboard: rows };
}

async function fetchPublishedNews(limit = 20) {
  const { data, error } = await supabase
    .from("news_posts")
    .select(
      "id, title, slug, excerpt, content, cover_url, category, published_at",
    )
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function ensureNewsBaseline() {
  const { data: state, error: stateError } = await supabase
    .from("telegram_bot_state")
    .select("key")
    .eq("key", NEWS_STATE_KEY)
    .maybeSingle();

  if (stateError) throw stateError;
  if (state) return;

  const current = await fetchPublishedNews(500);

  if (current.length) {
    const rows = current.map((post) => ({
      news_post_id: String(post.id),
      status: "baseline",
      attempt_count: 0,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("telegram_news_publications")
      .upsert(rows, { onConflict: "news_post_id" });

    if (error) throw error;
  }

  const { error: insertStateError } = await supabase
    .from("telegram_bot_state")
    .insert({
      key: NEWS_STATE_KEY,
      value: {
        initializedAt: new Date().toISOString(),
        baselineCount: current.length,
      },
    });

  if (insertStateError) throw insertStateError;

  console.log("telegram_news_baseline_initialized", {
    count: current.length,
  });
}

async function claimNewsPost(post, existing) {
  const now = new Date();
  const postId = String(post.id);

  if (!existing) {
    const { error } = await supabase
      .from("telegram_news_publications")
      .insert({
        news_post_id: postId,
        status: "processing",
        attempt_count: 1,
        updated_at: now.toISOString(),
      });

    if (error) {
      if (error.code === "23505") return false;
      throw error;
    }

    return true;
  }

  if (existing.status !== "failed") return false;

  const previous = new Date(existing.updated_at || 0).getTime();
  if (Number.isFinite(previous) && Date.now() - previous < NEWS_RETRY_MS) {
    return false;
  }

  const { error } = await supabase
    .from("telegram_news_publications")
    .update({
      status: "processing",
      attempt_count: Number(existing.attempt_count || 0) + 1,
      last_error: null,
      updated_at: now.toISOString(),
    })
    .eq("news_post_id", postId)
    .eq("status", "failed");

  if (error) throw error;
  return true;
}

async function publishNewsPost(post) {
  const postId = String(post.id);

  try {
    const message = await sendNews(
      CHANNEL,
      post,
      CHANNEL_LANGUAGE,
      false,
    );

    const { error } = await supabase
      .from("telegram_news_publications")
      .update({
        status: "sent",
        telegram_chat_id: String(message.chat?.id || CHANNEL),
        telegram_message_id: Number(message.message_id),
        sent_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("news_post_id", postId);

    if (error) {
      // Keep processing status if Telegram succeeded but DB acknowledgement failed.
      // This intentionally favors avoiding duplicate channel posts.
      throw error;
    }

    await audit(Number(OWNER_ID), "news_autopublished", {
      newsPostId: postId,
      telegramMessageId: message.message_id,
      channel: CHANNEL,
    });

    console.log("telegram_news_published", {
      newsPostId: postId,
      telegramMessageId: message.message_id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    const { error: updateError } = await supabase
      .from("telegram_news_publications")
      .update({
        status: "failed",
        last_error: clip(message, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("news_post_id", postId)
      .eq("status", "processing");

    if (updateError) {
      console.error("telegram_news_failure_state_failed", {
        newsPostId: postId,
        message: updateError.message,
      });
    }

    console.error("telegram_news_publish_failed", {
      newsPostId: postId,
      message,
    });
  }
}

async function pollNews() {
  if (newsPollRunning || stopping) return;
  newsPollRunning = true;

  try {
    const posts = await fetchPublishedNews(50);
    if (!posts.length) return;

    const ids = posts.map((post) => String(post.id));

    const { data: rows, error } = await supabase
      .from("telegram_news_publications")
      .select("news_post_id, status, attempt_count, updated_at")
      .in("news_post_id", ids);

    if (error) throw error;

    const existing = new Map(
      (rows || []).map((row) => [String(row.news_post_id), row]),
    );

    for (const post of posts) {
      if (stopping) break;

      const row = existing.get(String(post.id)) || null;
      const claimed = await claimNewsPost(post, row);
      if (!claimed) continue;

      await publishNewsPost(post);
    }
  } catch (error) {
    console.error("telegram_news_poll_failed", errorDetails(error));
  } finally {
    newsPollRunning = false;
  }
}

function scheduleNewsPoll() {
  if (stopping) return;

  clearTimeout(newsTimer);
  newsTimer = setTimeout(async () => {
    await pollNews();
    scheduleNewsPoll();
  }, NEWS_POLL_SECONDS * 1000);

  newsTimer.unref?.();
}

async function newsStats() {
  const statuses = ["sent", "failed", "baseline"];
  const result = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from("telegram_news_publications")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    if (error) throw error;
    result[status] = count || 0;
  }

  return result;
}

async function latestPublishedNews() {
  const { data, error } = await supabase
    .from("news_posts")
    .select(
      "id, title, slug, excerpt, content, cover_url, category, published_at",
    )
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function startCommand(message) {
  const user = await getUser(message.from);
  const lang = localeKey(user.language);
  const c = COPY[lang];

  await sendMessage(
    message.chat.id,
    [
      `👋 <b>${c.startTitle}</b>`,
      "",
      c.startText,
      "",
      `<b>${c.roleLabel}:</b> <code>${user.role}</code>`,
      "",
      `<b>${c.commands}:</b>`,
      "<code>/help</code>",
      "<code>/language</code>",
      "<code>/role</code>",
      "<code>/whoami</code>",
      "<code>/faceit</code>",
      "<code>/roster</code>",
      "<code>/matches</code>",
      "<code>/schedule</code>",
    ].join("\n"),
    { reply_markup: mainKeyboard(lang, hasRole(user, "editor")) },
  );
}

async function helpCommand(message, user) {
  const lang = localeKey(user.language);
  const c = COPY[lang];
  const lines = [
    `<b>${c.help}</b>`,
    "",
    "<code>/start</code>",
    "<code>/help</code>",
    "<code>/language</code>",
    "<code>/role</code>",
    "<code>/whoami</code>",
    "<code>/matches</code>",
    "<code>/schedule</code>",
    "<code>/faceit</code>",
    "<code>/roster</code>",
    "<code>/live</code>",
  ];

  if (hasRole(user, "editor")) {
    lines.push("<code>/admin</code>");
    lines.push("<code>/newsstatus</code>");
    lines.push("<code>/newstest</code>");
    lines.push("<code>/matchstatus</code>");
    lines.push("<code>/matchtest</code>");
    lines.push("<code>/rosterstatus</code>");
    lines.push("<code>/rostertest</code>");
    lines.push("<code>/livestatus</code>");
    lines.push("<code>/livetest</code>");
  }

  if (hasRole(user, "owner")) {
    lines.push("<code>/channelcheck</code>");
  }

  await sendMessage(message.chat.id, lines.join("\n"));
}

async function languageCommand(message, user) {
  const lang = localeKey(user.language);
  await sendMessage(
    message.chat.id,
    COPY[lang].selectLanguage,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: "🇺🇦 Українська", callback_data: "lang:uk" },
          { text: "🇷🇺 Русский", callback_data: "lang:ru" },
          { text: "🇬🇧 English", callback_data: "lang:en" },
        ]],
      },
    },
  );
}

async function roleCommand(message, user) {
  const lang = localeKey(user.language);
  await sendMessage(
    message.chat.id,
    `👤 <b>${COPY[lang].roleLabel}:</b> <code>${user.role}</code>`,
  );
}

async function whoamiCommand(message, user) {
  await sendMessage(
    message.chat.id,
    [
      "🪪 <b>Telegram ID</b>",
      `<code>${message.from.id}</code>`,
      "",
      `Role: <code>${user.role}</code>`,
    ].join("\n"),
  );
}

async function newsStatusCommand(message, user) {
  const lang = localeKey(user.language);
  const c = COPY[lang];

  if (!hasRole(user, "editor")) {
    await sendMessage(message.chat.id, c.noAccess);
    return;
  }

  const stats = await newsStats();

  await sendMessage(
    message.chat.id,
    [
      `📰 <b>${c.newsAutoTitle}</b>`,
      "",
      `✅ ${c.newsAutoActive}`,
      `${c.interval}: <code>${NEWS_POLL_SECONDS}s</code>`,
      `${c.channelLanguage}: <code>${CHANNEL_LANGUAGE}</code>`,
      `Channel: <code>${escapeHtml(CHANNEL)}</code>`,
      "",
      `${c.sent}: <b>${stats.sent}</b>`,
      `${c.failed}: <b>${stats.failed}</b>`,
      `${c.baseline}: <b>${stats.baseline}</b>`,
    ].join("\n"),
  );
}

async function newsTestCommand(message, user) {
  const lang = localeKey(user.language);
  const c = COPY[lang];

  if (!hasRole(user, "editor")) {
    await sendMessage(message.chat.id, c.noAccess);
    return;
  }

  const post = await latestPublishedNews();

  if (!post) {
    await sendMessage(message.chat.id, c.noNews);
    return;
  }

  await sendNews(message.chat.id, post, lang, true);

  await audit(message.from.id, "news_preview_opened", {
    newsPostId: String(post.id),
  });
}

async function adminCommand(message, user) {
  const lang = localeKey(user.language);
  const c = COPY[lang];

  if (!hasRole(user, "editor")) {
    await sendMessage(message.chat.id, c.noAccess);
    return;
  }

  await audit(message.from.id, "admin_panel_opened", {
    role: user.role,
  });

  await sendMessage(
    message.chat.id,
    [
      `🛡️ <b>${c.ownerPanel}</b>`,
      "",
      c.adminPanelText,
      "",
      `<b>${c.roleLabel}:</b> <code>${user.role}</code>`,
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `📰 ${c.newsStatus}`,
              callback_data: "admin:newsstatus",
            },
            {
              text: `🧪 ${c.newsTest}`,
              callback_data: "admin:newstest",
            },
          ],
          ...(matchAutomation ? matchAutomation.adminRows(lang) : []),
          ...(faceitAutomation ? faceitAutomation.adminRows(lang) : []),
          ...(twitchAutomation ? twitchAutomation.adminRows(lang) : []),
          [
            {
              text: `📣 ${c.channelCheck}`,
              callback_data: "admin:channelcheck",
            },
          ],
        ],
      },
    },
  );
}

async function channelCheck(actor, chatId, user) {
  const lang = localeKey(user.language);
  const c = COPY[lang];

  if (!hasRole(user, "owner")) {
    await sendMessage(chatId, c.noAccess);
    return;
  }

  const chat = await telegram("getChat", { chat_id: CHANNEL });
  const member = await telegram("getChatMember", {
    chat_id: chat.id,
    user_id: botInfo.id,
  });

  const rights = {
    status: member?.status || "unknown",
    can_post_messages: Boolean(member?.can_post_messages),
    can_edit_messages: Boolean(member?.can_edit_messages),
    can_delete_messages: Boolean(member?.can_delete_messages),
  };

  await audit(actor.id, "channel_check", {
    channelId: chat.id,
    rights,
  });

  await sendMessage(
    chatId,
    [
      `✅ <b>${c.channelOk}</b>`,
      "",
      `Channel: <code>${escapeHtml(chat?.title || CHANNEL)}</code>`,
      `ID: <code>${chat?.id}</code>`,
      `Status: <code>${escapeHtml(rights.status)}</code>`,
      "",
      `${c.post}: <b>${rights.can_post_messages ? c.yes : c.no}</b>`,
      `${c.edit}: <b>${rights.can_edit_messages ? c.yes : c.no}</b>`,
      `${c.delete}: <b>${rights.can_delete_messages ? c.yes : c.no}</b>`,
    ].join("\n"),
  );
}

async function handleMessage(message) {
  if (!message?.text || message?.chat?.type !== "private") return;

  let user;
  try {
    user = await getUser(message.from);
  } catch (error) {
    console.error("telegram_user_lookup_failed", {
      userId: message?.from?.id ?? null,
      message: error instanceof Error ? error.message : String(error),
    });
    await sendMessage(message.chat.id, COPY.ru.dbError);
    return;
  }

  const command = normalizeCommand(message.text);

  if (command === "/start") return startCommand(message);
  if (command === "/help") return helpCommand(message, user);
  if (command === "/language") return languageCommand(message, user);
  if (command === "/role") return roleCommand(message, user);
  if (command === "/whoami") return whoamiCommand(message, user);
  if (command === "/admin") return adminCommand(message, user);
  if (command === "/newsstatus") return newsStatusCommand(message, user);
  if (command === "/newstest") return newsTestCommand(message, user);

  if (
    matchAutomation &&
    await matchAutomation.handleCommand(command, message, user)
  ) {
    return;
  }

  if (
    faceitAutomation &&
    await faceitAutomation.handleCommand(command, message, user)
  ) {
    return;
  }

  if (
    twitchAutomation &&
    await twitchAutomation.handleCommand(command, message, user)
  ) {
    return;
  }

  if (command === "/channelcheck") {
    return channelCheck(message.from, message.chat.id, user);
  }
}

async function handleCallback(query) {
  if (!query?.id || !query?.from || !query?.message?.chat?.id) return;

  let user;
  try {
    user = await getUser(query.from);
  } catch {
    await answerCallback(query.id, "Database error");
    return;
  }

  const data = String(query.data || "");

  if (data.startsWith("lang:")) {
    const requested = localeKey(data.slice(5));
    const updated = await upsertUser(query.from, requested);
    await answerCallback(query.id, COPY[requested].languageSaved);
    await startCommand({
      chat: query.message.chat,
      from: query.from,
    });
    return updated;
  }

  const lang = localeKey(user.language);
  const c = COPY[lang];

  if (data === "menu:language") {
    await answerCallback(query.id);
    return languageCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
  }

  if (data === "menu:role") {
    await answerCallback(query.id);
    return roleCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
  }

  if (data === "menu:admin") {
    await answerCallback(query.id);
    return adminCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
  }

  if (data === "admin:newsstatus") {
    if (!hasRole(user, "editor")) {
      await answerCallback(query.id, c.noAccess);
      return;
    }

    await answerCallback(query.id);
    return newsStatusCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
  }

  if (data === "admin:newstest") {
    if (!hasRole(user, "editor")) {
      await answerCallback(query.id, c.noAccess);
      return;
    }

    await answerCallback(query.id);
    return newsTestCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
  }

  if (
    matchAutomation &&
    await matchAutomation.handleCallback(data, query, user)
  ) {
    return;
  }

  if (
    faceitAutomation &&
    await faceitAutomation.handleCallback(data, query, user)
  ) {
    return;
  }

  if (
    twitchAutomation &&
    await twitchAutomation.handleCallback(data, query, user)
  ) {
    return;
  }

  if (data === "admin:channelcheck") {
    if (!hasRole(user, "owner")) {
      await answerCallback(query.id, c.noAccess);
      return;
    }

    await answerCallback(query.id);
    return channelCheck(query.from, query.message.chat.id, user);
  }
}

async function handleUpdate(update) {
  if (update?.message) return handleMessage(update.message);
  if (update?.callback_query) return handleCallback(update.callback_query);
}

async function syncCommands() {
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Open ISTesport Bot" },
      { command: "help", description: "Show commands" },
      { command: "language", description: "Change language" },
      { command: "role", description: "Show my role" },
      { command: "whoami", description: "Show my Telegram ID" },
      { command: "admin", description: "Open admin panel" },
      { command: "newsstatus", description: "News autopost status" },
      { command: "newstest", description: "Preview latest news" },
      { command: "matches", description: "Show ISTesport matches" },
      { command: "schedule", description: "Show upcoming schedule" },
      { command: "matchstatus", description: "Match autopost status" },
      { command: "matchtest", description: "Preview a match post" },
      { command: "faceit", description: "Show ISTesport FACEIT stats" },
      { command: "roster", description: "Show ISTesport roster" },
      { command: "rosterstatus", description: "Roster watch status" },
      { command: "rostertest", description: "Preview roster change post" },
      { command: "live", description: "Show current Twitch LIVE status" },
      { command: "livestatus", description: "Twitch LIVE monitor status" },
      { command: "livetest", description: "Preview Twitch LIVE post" },
      { command: "channelcheck", description: "Check ISTesport channel" },
    ],
    scope: { type: "all_private_chats" },
  });
}

async function bootstrap() {
  await ensureOwner();
  await ensureNewsBaseline();

  botInfo = await telegram("getMe");

  matchAutomation = createMatchAutomation({
    telegram,
    sendMessage,
    answerCallback,
    audit,
    supabase,
    channel: CHANNEL,
    siteUrl: SITE_URL,
    ownerId: OWNER_ID,
    hasRole,
  });

  const matchInitialized = await matchAutomation.initialize();

  faceitAutomation = createFaceitAutomation({
    telegram,
    sendMessage,
    answerCallback,
    audit,
    supabase,
    channel: CHANNEL,
    siteUrl: SITE_URL,
    ownerId: OWNER_ID,
    hasRole,
  });

  const faceitInitialized = await faceitAutomation.initialize();

  twitchAutomation = createTwitchAutomation({
    telegram,
    sendMessage,
    answerCallback,
    audit,
    supabase,
    channel: CHANNEL,
    ownerId: OWNER_ID,
    hasRole,
  });

  const twitchInitialized = await twitchAutomation.initialize();

  await syncCommands();

  console.log(
    JSON.stringify({
      event: "telegram_bot_ready",
      version: "0.6.0",
      id: botInfo.id,
      username: botInfo.username,
      channel: CHANNEL,
      ownerConfigured: true,
      supabaseConfigured: true,
      newsAutopost: true,
      newsPollSeconds: NEWS_POLL_SECONDS,
      channelLanguage: CHANNEL_LANGUAGE,
      matchAutopost: true,
      matchInitialized,
      matchPollSeconds: matchAutomation.config.pollSeconds,
      matchReminderMinutes: matchAutomation.config.reminderMinutes,
      faceitAutopost: true,
      faceitInitialized,
      faceitPollSeconds: faceitAutomation.config.pollSeconds,
      twitchAutopost: true,
      twitchInitialized,
      twitchChannel: twitchAutomation.config.twitchLogin,
      twitchPollSeconds: twitchAutomation.config.pollSeconds,
    }),
  );

  await pollNews();
  scheduleNewsPoll();

  await matchAutomation.start();
  await faceitAutomation.start();
  await twitchAutomation.start();

  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: POLL_TIMEOUT,
        allowed_updates: ["message", "callback_query"],
      });

      for (const update of updates) {
        offset = Math.max(offset, Number(update.update_id || 0) + 1);

        try {
          await handleUpdate(update);
        } catch (error) {
          console.error("telegram_update_failed", {
            updateId: update?.update_id ?? null,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      if (stopping) break;

      console.error("telegram_poll_failed", {
        message: error instanceof Error ? error.message : String(error),
      });

      await sleep(2000);
    }
  }
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;

  if (newsTimer) {
    clearTimeout(newsTimer);
    newsTimer = null;
  }

  matchAutomation?.stop();
  faceitAutomation?.stop();
  twitchAutomation?.stop();

  console.log(JSON.stringify({ event: "telegram_bot_stopping", signal }));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((error) => {
  console.error("telegram_bot_start_failed", errorDetails(error));
  process.exit(1);
});
