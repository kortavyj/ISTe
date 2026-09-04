import { guardRequest } from "../api/lib/requestGuard.js";
import { readJsonBody, readQueryString } from "../api/lib/requestBody.js";
import { requireOwner } from "../api/lib/ownerRequest.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_PERMISSIONS = "564049465142272";

const COMMANDS = [
  {
    name: "ping",
    description: "Check ISTe Bot response time",
    description_localizations: {
      uk: "Перевірити швидкість відповіді ISTe Bot",
      ru: "Проверить скорость ответа ISTe Bot",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "server",
    description: "Show information about this Discord server",
    description_localizations: {
      uk: "Показати інформацію про цей Discord-сервер",
      ru: "Показать информацию об этом Discord-сервере",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "user",
    description: "Show information about a server member",
    description_localizations: {
      uk: "Показати інформацію про учасника сервера",
      ru: "Показать информацию об участнике сервера",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
      {
        name: "member",
        description: "Member to inspect (defaults to you)",
        description_localizations: {
          uk: "Учасник для перегляду (за замовчуванням ви)",
          ru: "Участник для просмотра (по умолчанию вы)",
        },
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: "avatar",
    description: "Show a user's Discord avatar",
    description_localizations: {
      uk: "Показати Discord-аватар користувача",
      ru: "Показать Discord-аватар пользователя",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
      {
        name: "member",
        description: "User whose avatar you want to view",
        description_localizations: {
          uk: "Користувач, аватар якого потрібно показати",
          ru: "Пользователь, аватар которого нужно показать",
        },
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: "bot",
    description: "Show ISTe Bot information and capabilities",
    description_localizations: {
      uk: "Показати інформацію та можливості ISTe Bot",
      ru: "Показать информацию и возможности ISTe Bot",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "invite",
    description: "Get the official ISTe Bot installation link",
    description_localizations: {
      uk: "Отримати офіційне посилання для встановлення ISTe Bot",
      ru: "Получить официальную ссылку для установки ISTe Bot",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "poll",
    description: "Create a native Discord poll",
    description_localizations: {
      uk: "Створити вбудоване опитування Discord",
      ru: "Создать встроенный опрос Discord",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
    default_member_permissions: "562949953421312",
    options: [
      {
        name: "question",
        description: "Poll question",
        description_localizations: { uk: "Питання опитування", ru: "Вопрос опроса" },
        type: 3,
        required: true,
        min_length: 1,
        max_length: 300,
      },
      {
        name: "option1",
        description: "First answer",
        description_localizations: { uk: "Перша відповідь", ru: "Первый ответ" },
        type: 3,
        required: true,
        min_length: 1,
        max_length: 55,
      },
      {
        name: "option2",
        description: "Second answer",
        description_localizations: { uk: "Друга відповідь", ru: "Второй ответ" },
        type: 3,
        required: true,
        min_length: 1,
        max_length: 55,
      },
      {
        name: "option3",
        description: "Third answer (optional)",
        description_localizations: { uk: "Третя відповідь (необов'язково)", ru: "Третий ответ (необязательно)" },
        type: 3,
        required: false,
        max_length: 55,
      },
      {
        name: "option4",
        description: "Fourth answer (optional)",
        description_localizations: { uk: "Четверта відповідь (необов'язково)", ru: "Четвёртый ответ (необязательно)" },
        type: 3,
        required: false,
        max_length: 55,
      },
      {
        name: "option5",
        description: "Fifth answer (optional)",
        description_localizations: { uk: "П'ята відповідь (необов'язково)", ru: "Пятый ответ (необязательно)" },
        type: 3,
        required: false,
        max_length: 55,
      },
      {
        name: "hours",
        description: "How many hours the poll stays open (default 24)",
        description_localizations: {
          uk: "Скільки годин триватиме опитування (типово 24)",
          ru: "Сколько часов будет идти опрос (по умолчанию 24)",
        },
        type: 4,
        required: false,
        min_value: 1,
        max_value: 768,
      },
      {
        name: "multiselect",
        description: "Allow selecting multiple answers",
        description_localizations: {
          uk: "Дозволити вибирати кілька відповідей",
          ru: "Разрешить выбирать несколько ответов",
        },
        type: 5,
        required: false,
      },
    ],
  },
  {
    name: "clear",
    description: "Delete recent messages from this channel",
    description_localizations: {
      uk: "Видалити останні повідомлення з цього каналу",
      ru: "Удалить последние сообщения из этого канала",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
    default_member_permissions: "8192",
    options: [
      {
        name: "amount",
        description: "Number of messages to delete (1-100)",
        description_localizations: {
          uk: "Кількість повідомлень для видалення (1-100)",
          ru: "Количество сообщений для удаления (1-100)",
        },
        type: 4,
        required: true,
        min_value: 1,
        max_value: 100,
      },
    ],
  },
  {
    name: "timeout",
    description: "Temporarily timeout a server member",
    description_localizations: {
      uk: "Тимчасово обмежити учасника сервера",
      ru: "Временно ограничить участника сервера",
    },
    type: 1,
    integration_types: [0],
    contexts: [0],
    default_member_permissions: "1099511627776",
    options: [
      {
        name: "member",
        description: "Member to timeout",
        description_localizations: { uk: "Учасник для тайм-ауту", ru: "Участник для тайм-аута" },
        type: 6,
        required: true,
      },
      {
        name: "minutes",
        description: "Timeout duration in minutes (max 40320 / 28 days)",
        description_localizations: {
          uk: "Тривалість у хвилинах (макс. 40320 / 28 днів)",
          ru: "Длительность в минутах (макс. 40320 / 28 дней)",
        },
        type: 4,
        required: true,
        min_value: 1,
        max_value: 40320,
      },
      {
        name: "reason",
        description: "Reason for the timeout (optional)",
        description_localizations: {
          uk: "Причина тайм-ауту (необов'язково)",
          ru: "Причина тайм-аута (необязательно)",
        },
        type: 3,
        required: false,
        max_length: 256,
      },
    ],
  },
  {
    name: "site",
    description: "Open the official ISTe website",
    description_localizations: { uk: "Відкрити офіційний сайт ISTe", ru: "Открыть официальный сайт ISTe" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "rules",
    description: "Show ISTe Discord rules",
    description_localizations: { uk: "Показати правила ISTe Discord", ru: "Показать правила ISTe Discord" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "team",
    description: "Show the current ISTe roster",
    description_localizations: { uk: "Показати поточний склад ISTe", ru: "Показать текущий состав ISTe" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "matches",
    description: "Show recent ISTe matches",
    description_localizations: { uk: "Показати останні матчі ISTe", ru: "Показать последние матчи ISTe" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "news",
    description: "Show the latest ISTe news",
    description_localizations: { uk: "Показати останні новини ISTe", ru: "Показать последние новости ISTe" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "help",
    description: "Show all ISTe Bot commands",
    description_localizations: { uk: "Показати всі команди ISTe Bot", ru: "Показать все команды ISTe Bot" },
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
];

function sendError(response, status, error, message) {
  return response.status(status).json({ ok: false, error, message });
}

function sendGuardError(response, guard) {
  if (guard.allow) response.setHeader("Allow", guard.allow);
  return sendError(
    response,
    guard.status,
    guard.error,
    "Запрос отклонён сервером.",
  );
}

function readConfig() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID?.trim() || "",
    botToken: process.env.DISCORD_BOT_TOKEN?.trim() || "",
    permissions:
      process.env.DISCORD_PERMISSIONS?.trim() || DEFAULT_PERMISSIONS,
  };
}

function isSnowflake(value) {
  return /^[0-9]{17,20}$/.test(String(value || ""));
}

function makeInstallUrl(clientId) {
  if (!clientId) return "";

  // Use the exact Discord Provided Link model.
  // Default Guild/User install scopes and bot permissions are configured
  // in Discord Developer Portal -> Installation.
  return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}`;
}

async function discordRequest(path, { method = "GET", body = null } = {}) {
  const { botToken } = readConfig();

  if (!botToken) {
    throw Object.assign(new Error("DISCORD_BOT_TOKEN is missing."), {
      code: "DISCORD_BOT_TOKEN_MISSING",
    });
  }

  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${botToken}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(
        result?.message || `Discord API returned ${response.status}.`,
      ),
      { status: response.status, details: result },
    );
  }

  return result;
}

async function getOwner(request, response) {
  const owner = await requireOwner(request, response);

  if (!owner.ok) {
    sendError(response, owner.status, owner.error, owner.message);
    return null;
  }

  return owner;
}

async function handleStatus(request, response) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const owner = await getOwner(request, response);
  if (!owner) return;

  const config = readConfig();
  const requestedGuildId = readQueryString(request.query?.guildId, 24);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("discord_guilds")
      .select(
        "guild_id, guild_name, active, member_count, locale, installed_at, last_seen_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const guilds = Array.isArray(data) ? data : [];
    const guild =
      guilds.find((item) => item.guild_id === requestedGuildId) ||
      guilds[0] ||
      null;

    return response.status(200).json({
      ok: true,
      configured: {
        clientId: Boolean(config.clientId),
        botToken: Boolean(config.botToken),
      },
      interactionUrl:
        "https://niwgrrprbcgbdaloijhq.supabase.co/functions/v1/discord-interactions",
      installUrl: makeInstallUrl(
        config.clientId,
        config.permissions,
        guild?.guild_id || requestedGuildId,
      ),
      guild,
      guilds,
      commands: COMMANDS.map((command) => command.name),
    });
  } catch (error) {
    console.error("Discord status error:", error);
    return sendError(
      response,
      500,
      "DISCORD_STATUS_FAILED",
      "Не удалось загрузить состояние ISTe Bot.",
    );
  }
}

async function handlePrepareInstall(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const body = readJsonBody(request);
  const guildId =
    typeof body?.guildId === "string" ? body.guildId.trim() : "";

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Укажите корректный Discord Server ID.",
    );
  }

  const owner = await getOwner(request, response);
  if (!owner) return;

  const config = readConfig();

  if (!config.clientId) {
    return sendError(
      response,
      503,
      "DISCORD_CLIENT_ID_MISSING",
      "DISCORD_CLIENT_ID ещё не добавлен в Vercel.",
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from("discord_guilds").upsert(
      {
        guild_id: guildId,
        active: false,
        removed_at: null,
        updated_at: now,
        last_seen_at: now,
      },
      { onConflict: "guild_id" },
    );

    if (error) throw error;

    return response.status(200).json({
      ok: true,
      guildId,
      installUrl: makeInstallUrl(
        config.clientId,
        config.permissions,
        guildId,
      ),
    });
  } catch (error) {
    console.error("Discord prepare install error:", error);
    return sendError(
      response,
      500,
      "DISCORD_INSTALL_PREPARE_FAILED",
      "Не удалось подготовить подключение Discord.",
    );
  }
}

async function handleVerify(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const body = readJsonBody(request);
  const guildId =
    typeof body?.guildId === "string" ? body.guildId.trim() : "";

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Укажите корректный Discord Server ID.",
    );
  }

  const owner = await getOwner(request, response);
  if (!owner) return;

  try {
    const guild = await discordRequest(`/guilds/${guildId}?with_counts=true`);

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const payload = {
      guild_id: guildId,
      guild_name: String(guild?.name || "ISTe Discord").slice(0, 120),
      guild_icon: guild?.icon ? String(guild.icon) : null,
      active: true,
      member_count: Number.isFinite(guild?.approximate_member_count)
        ? guild.approximate_member_count
        : null,
      removed_at: null,
      last_seen_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("discord_guilds")
      .upsert(payload, { onConflict: "guild_id" });

    if (error) throw error;

    await supabase.from("discord_bot_audit").insert({
      guild_id: guildId,
      event_type: "site.verify",
      payload: { guild_name: payload.guild_name },
    });

    return response.status(200).json({
      ok: true,
      connected: true,
      guild: payload,
    });
  } catch (error) {
    console.error("Discord verify error:", error);

    if (error?.status === 403 || error?.status === 404) {
      return sendError(
        response,
        409,
        "DISCORD_BOT_NOT_IN_GUILD",
        "ISTe Bot пока не найден на этом сервере. Добавьте бота и повторите проверку.",
      );
    }

    if (error?.code === "DISCORD_BOT_TOKEN_MISSING") {
      return sendError(
        response,
        503,
        error.code,
        "DISCORD_BOT_TOKEN ещё не добавлен в Vercel.",
      );
    }

    return sendError(
      response,
      502,
      "DISCORD_VERIFY_FAILED",
      "Не удалось проверить подключение ISTe Bot.",
    );
  }
}

async function handleRegisterCommands(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 2048,
  });

  if (!guard.ok) return sendGuardError(response, guard);

  const owner = await getOwner(request, response);
  if (!owner) return;

  const { clientId } = readConfig();

  if (!clientId) {
    return sendError(
      response,
      503,
      "DISCORD_CLIENT_ID_MISSING",
      "DISCORD_CLIENT_ID ещё не добавлен в Vercel.",
    );
  }

  try {
    const result = await discordRequest(
      `/applications/${clientId}/commands`,
      {
        method: "PUT",
        body: COMMANDS,
      },
    );

    return response.status(200).json({
      ok: true,
      commands: Array.isArray(result)
        ? result.map((item) => item.name)
        : [],
    });
  } catch (error) {
    console.error("Discord register commands error:", error);
    return sendError(
      response,
      502,
      "DISCORD_COMMANDS_REGISTER_FAILED",
      "Не удалось зарегистрировать slash-команды.",
    );
  }
}

export default async function discordHandler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");

  const rawAction = Array.isArray(request.query?.action)
    ? request.query.action[0]
    : request.query?.action;

  const action =
    typeof rawAction === "string"
      ? rawAction.trim().toLowerCase()
      : "status";

  if (action === "status") {
    return handleStatus(request, response);
  }

  if (action === "prepare-install") {
    return handlePrepareInstall(request, response);
  }

  if (action === "verify") {
    return handleVerify(request, response);
  }

  if (action === "register-commands") {
    return handleRegisterCommands(request, response);
  }

  return sendError(
    response,
    404,
    "DISCORD_ACTION_NOT_FOUND",
    "Операция Discord не найдена.",
  );
}
