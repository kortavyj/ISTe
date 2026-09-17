const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const OWNER_ID = String(process.env.TELEGRAM_OWNER_ID || "").trim();
const CHANNEL = String(process.env.TELEGRAM_CHANNEL || "@ISTesport").trim();
const POLL_TIMEOUT = Math.min(
  50,
  Math.max(10, Number(process.env.TELEGRAM_POLL_TIMEOUT || 30)),
);

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is missing.");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;
let stopping = false;
let botInfo = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegram(method, payload = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const description =
      data?.description || `Telegram API HTTP ${response.status}`;
    const error = new Error(description);
    error.status = response.status;
    error.telegram = data;
    throw error;
  }

  return data.result;
}

function normalizeCommand(text) {
  const first = String(text || "").trim().split(/\s+/)[0] || "";
  return first.split("@")[0].toLowerCase();
}

function isPrivateMessage(message) {
  return message?.chat?.type === "private";
}

function actorId(message) {
  return String(message?.from?.id || "");
}

function isOwner(message) {
  return Boolean(OWNER_ID) && actorId(message) === OWNER_ID;
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

async function sendOwnerOnly(message, action) {
  const chatId = message?.chat?.id;

  if (!OWNER_ID) {
    await sendMessage(
      chatId,
      "🔐 Владелец ещё не настроен.\n\nОтправь <code>/whoami</code>, скопируй свой Telegram ID и добавь его в Railway Variable <code>TELEGRAM_OWNER_ID</code>.",
    );
    return;
  }

  if (!isOwner(message)) {
    await sendMessage(
      chatId,
      "⛔ Эта команда доступна только владельцу ISTesport Bot.",
    );
    return;
  }

  await action();
}

async function startCommand(message) {
  const chatId = message.chat.id;
  const firstName = String(message?.from?.first_name || "").trim();
  const hello = firstName ? `, ${firstName}` : "";

  await sendMessage(
    chatId,
    [
      `👋 <b>ISTesport Bot</b>${hello}`,
      "",
      "Официальный Telegram бот ISTesport.",
      "",
      "На первом этапе уже доступны:",
      "• <code>/help</code> — справка",
      "• <code>/whoami</code> — показать твой Telegram ID",
      "• <code>/channelcheck</code> — проверить доступ бота к каналу, только для владельца",
      "",
      "Дальше подключим матчи, новости, FACEIT, расписание, заявки, розыгрыши, поддержку и модерацию.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 ISTesport",
              url: "https://istesport.com",
            },
            {
              text: "📣 Канал",
              url: "https://t.me/ISTesport",
            },
          ],
        ],
      },
    },
  );
}

async function helpCommand(message) {
  await sendMessage(
    message.chat.id,
    [
      "<b>ISTesport Bot · Stage 1</b>",
      "",
      "<code>/start</code> — главное сообщение",
      "<code>/help</code> — список команд",
      "<code>/whoami</code> — твой Telegram User ID",
      "<code>/channelcheck</code> — проверка прав в канале, только OWNER",
      "",
      "Админские функции защищаются Telegram User ID и будут дополнительно переведены на роли OWNER / ADMIN / MODERATOR / EDITOR.",
    ].join("\n"),
  );
}

async function whoamiCommand(message) {
  const id = actorId(message);
  const username = message?.from?.username
    ? `@${message.from.username}`
    : "не задан";

  await sendMessage(
    message.chat.id,
    [
      "🪪 <b>Твой Telegram ID</b>",
      "",
      `<code>${id}</code>`,
      `Username: <code>${username}</code>`,
      "",
      "ID можно безопасно использовать как значение <code>TELEGRAM_OWNER_ID</code>. Bot Token сюда не отправляй.",
    ].join("\n"),
  );
}

async function channelCheckCommand(message) {
  await sendOwnerOnly(message, async () => {
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

    await sendMessage(
      message.chat.id,
      [
        "✅ <b>Проверка канала завершена</b>",
        "",
        `Канал: <code>${chat?.title || CHANNEL}</code>`,
        `ID: <code>${chat?.id}</code>`,
        `Статус бота: <code>${rights.status}</code>`,
        "",
        `Публикация: <b>${rights.can_post_messages ? "есть" : "нет"}</b>`,
        `Редактирование: <b>${rights.can_edit_messages ? "есть" : "нет"}</b>`,
        `Удаление: <b>${rights.can_delete_messages ? "есть" : "нет"}</b>`,
      ].join("\n"),
    );
  });
}

async function handleMessage(message) {
  if (!message?.text) return;

  // Stage 1 deliberately handles commands in private chat only.
  if (!isPrivateMessage(message)) return;

  const command = normalizeCommand(message.text);

  if (command === "/start") {
    await startCommand(message);
    return;
  }

  if (command === "/help") {
    await helpCommand(message);
    return;
  }

  if (command === "/whoami") {
    await whoamiCommand(message);
    return;
  }

  if (command === "/channelcheck") {
    await channelCheckCommand(message);
    return;
  }
}

async function handleUpdate(update) {
  if (update?.message) {
    await handleMessage(update.message);
  }
}

async function syncCommands() {
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть ISTesport Bot" },
      { command: "help", description: "Показать команды" },
      { command: "whoami", description: "Показать мой Telegram ID" },
      { command: "channelcheck", description: "Проверить канал ISTesport" },
    ],
    scope: { type: "all_private_chats" },
  });
}

async function bootstrap() {
  botInfo = await telegram("getMe");

  console.log(
    JSON.stringify({
      event: "telegram_bot_ready",
      id: botInfo.id,
      username: botInfo.username,
      channel: CHANNEL,
      ownerConfigured: Boolean(OWNER_ID),
    }),
  );

  await syncCommands();

  // Long polling means Railway does not need a public webhook URL at Stage 1.
  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: POLL_TIMEOUT,
        allowed_updates: ["message"],
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

  // Give an active long-poll request a moment to finish.
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
