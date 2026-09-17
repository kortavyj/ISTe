import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = requiredEnv("TELEGRAM_BOT_TOKEN");
const OWNER_ID = requiredEnv("TELEGRAM_OWNER_ID");
const CHANNEL = String(process.env.TELEGRAM_CHANNEL || "@ISTesport").trim();
const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const POLL_TIMEOUT = Math.min(
  50,
  Math.max(10, Number(process.env.TELEGRAM_POLL_TIMEOUT || 30)),
);

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
    whoami: "Мій Telegram ID",
    language: "Мова",
    role: "Моя роль",
    admin: "Адмін панель",
    channelCheck: "Перевірити канал",
    selectLanguage: "Оберіть мову:",
    languageSaved: "Мову збережено.",
    noAccess: "Ця дія недоступна для вашої ролі.",
    dbError: "Не вдалося перевірити права. Спробуйте ще раз пізніше.",
    roleLabel: "Роль",
    ownerPanel: "Панель керування ISTesport Bot",
    adminPanelText:
      "Базова система ролей активна. Наступними етапами тут з’являться публікації, розіграші, заявки, підтримка та статистика.",
    channelOk: "Перевірка каналу завершена",
    post: "Публікація",
    edit: "Редагування",
    delete: "Видалення",
    yes: "є",
    no: "немає",
  },
  ru: {
    startTitle: "ISTesport Bot",
    startText: "Официальный Telegram бот ISTesport.",
    commands: "Команды",
    help: "Справка",
    whoami: "Мой Telegram ID",
    language: "Язык",
    role: "Моя роль",
    admin: "Админ панель",
    channelCheck: "Проверить канал",
    selectLanguage: "Выберите язык:",
    languageSaved: "Язык сохранён.",
    noAccess: "Это действие недоступно для вашей роли.",
    dbError: "Не удалось проверить права. Попробуйте ещё раз позже.",
    roleLabel: "Роль",
    ownerPanel: "Панель управления ISTesport Bot",
    adminPanelText:
      "Базовая система ролей активна. Следующими этапами здесь появятся публикации, розыгрыши, заявки, поддержка и статистика.",
    channelOk: "Проверка канала завершена",
    post: "Публикация",
    edit: "Редактирование",
    delete: "Удаление",
    yes: "есть",
    no: "нет",
  },
  en: {
    startTitle: "ISTesport Bot",
    startText: "Official ISTesport Telegram bot.",
    commands: "Commands",
    help: "Help",
    whoami: "My Telegram ID",
    language: "Language",
    role: "My role",
    admin: "Admin panel",
    channelCheck: "Check channel",
    selectLanguage: "Choose a language:",
    languageSaved: "Language saved.",
    noAccess: "This action is not available for your role.",
    dbError: "Could not verify permissions. Please try again later.",
    roleLabel: "Role",
    ownerPanel: "ISTesport Bot control panel",
    adminPanelText:
      "The base role system is active. Publishing, giveaways, applications, support and analytics will be added here next.",
    channelOk: "Channel check completed",
    post: "Posting",
    edit: "Editing",
    delete: "Deleting",
    yes: "available",
    no: "missing",
  },
};

let offset = 0;
let stopping = false;
let botInfo = null;

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
      { text: "🌐 ISTesport", url: "https://istesport.com" },
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
  ];

  if (hasRole(user, "editor")) {
    lines.push("<code>/admin</code>");
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
      `Channel: <code>${chat?.title || CHANNEL}</code>`,
      `ID: <code>${chat?.id}</code>`,
      `Status: <code>${rights.status}</code>`,
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
    await languageCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
    return;
  }

  if (data === "menu:role") {
    await answerCallback(query.id);
    await roleCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
    return;
  }

  if (data === "menu:admin") {
    await answerCallback(query.id);
    await adminCommand(
      { chat: query.message.chat, from: query.from },
      user,
    );
    return;
  }

  if (data === "admin:channelcheck") {
    if (!hasRole(user, "owner")) {
      await answerCallback(query.id, c.noAccess);
      return;
    }

    await answerCallback(query.id);
    await channelCheck(query.from, query.message.chat.id, user);
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
      { command: "channelcheck", description: "Check ISTesport channel" },
    ],
    scope: { type: "all_private_chats" },
  });
}

async function bootstrap() {
  await ensureOwner();
  botInfo = await telegram("getMe");
  await syncCommands();

  console.log(
    JSON.stringify({
      event: "telegram_bot_ready",
      version: "0.2.0",
      id: botInfo.id,
      username: botInfo.username,
      channel: CHANNEL,
      ownerConfigured: true,
      supabaseConfigured: true,
    }),
  );

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
  console.log(JSON.stringify({ event: "telegram_bot_stopping", signal }));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((error) => {
  console.error("telegram_bot_start_failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
