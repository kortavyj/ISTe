import nacl from "npm:tweetnacl@1.0.3";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import {
  handleRecruitmentCommand,
  handleRecruitmentComponent,
  handleRecruitmentModal,
} from "./recruitment.ts";

const encoder = new TextEncoder();
const SITE_URL = (Deno.env.get("SITE_URL") || "https://istesport.com").replace(/\/+$/, "");
const DISCORD_PUBLIC_KEY =
  Deno.env.get("DISCORD_PUBLIC_KEY") ||
  "65365ccdf33b5d411932191201b26eb21a4d479757d93ff021704b9a118ee86a";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DISCORD_API = "https://discord.com/api/v10";
const BRAND_COLOR = 0xe30613;
const BOT_VERSION = "2.0.0";

const PERMISSIONS = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_MESSAGES: 1n << 13n,
  MODERATE_MEMBERS: 1n << 40n,
  SEND_POLLS: 1n << 49n,
};

const publicDb = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const adminDb = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function verifyDiscordRequest(signature: string, timestamp: string, rawBody: string) {
  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(DISCORD_PUBLIC_KEY);

  if (!signatureBytes || !publicKeyBytes) return false;

  return nacl.sign.detached.verify(
    encoder.encode(`${timestamp}${rawBody}`),
    signatureBytes,
    publicKeyBytes,
  );
}

function localeFamily(value: unknown) {
  const locale = String(value || "").toLowerCase();
  if (locale.startsWith("uk")) return "uk";
  if (locale.startsWith("ru")) return "ru";
  return "en";
}

const copy = {
  uk: {
    footer: "ISTe Bot • istesport.com",
    openSite: "Відкрити сайт",
    installBot: "Додати ISTe Bot",
    openAvatar: "Відкрити аватар",
    noData: "Дані поки недоступні.",
    siteTitle: "Офіційний сайт ISTe",
    siteText: "Команда, матчі, новини, партнерства та ISTe Wear — в одному місці.",
    rulesTitle: "Правила ISTe Discord",
    rulesText:
      "Поважайте інших учасників, не використовуйте образи, спам, шахрайство або заборонений контент. Виконуйте вимоги модерації та правила конкретних каналів.",
    teamTitle: "Склад ISTe",
    matchesTitle: "Останні матчі ISTe",
    newsTitle: "Останні новини ISTe",
    helpTitle: "ISTe Bot — команди",
    helpText:
      "**Утиліти**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n**Спільнота**\n`/poll`\n\n**Модерація**\n`/clear` `/timeout`\n\n**ISTe**\n`/site` `/rules` `/team` `/matches` `/news`\n\n`/help` — ця довідка",
    pingTitle: "ISTe Bot онлайн",
    pingText: "Обробка запиту: **{{ms}} мс**",
    serverTitle: "Інформація про сервер",
    serverId: "ID сервера",
    serverCreated: "Створено",
    serverLocale: "Мова сервера",
    serverMembers: "Учасників",
    userTitle: "Інформація про користувача",
    userId: "ID користувача",
    userCreated: "Акаунт створено",
    userJoined: "На сервері з",
    userRoles: "Ролей",
    userType: "Тип",
    userBot: "Бот",
    userHuman: "Користувач",
    avatarTitle: "Аватар {{name}}",
    avatarMissing: "Не вдалося отримати аватар користувача.",
    botTitle: "ISTe Bot",
    botText:
      "Універсальний Discord-бот від ISTesport: утиліти, опитування, модерація та інтеграції ISTe.",
    botVersion: "Версія",
    botCommands: "Команд",
    botLanguage: "Локалізація",
    inviteTitle: "Додайте ISTe Bot на свій сервер",
    inviteText:
      "Встановлення проходить через офіційне вікно Discord. Ви самі обираєте сервер, де маєте право керування.",
    pollPermission:
      "ISTe Bot не має права **Надсилати опитування** в цьому каналі. Додайте боту це право й повторіть команду.",
    pollInvalid: "Для опитування потрібно щонайменше дві непорожні відповіді.",
    clearPermission: "Для `/clear` потрібне право **Керувати повідомленнями**.",
    clearBotPermission:
      "ISTe Bot не має права **Керувати повідомленнями** в цьому каналі.",
    clearSecret:
      "Модерація ще не активована на серверній частині ISTe Bot. Власнику бота потрібно додати DISCORD_BOT_TOKEN у Supabase Edge Function Secrets.",
    clearNothing: "Немає придатних повідомлень для видалення.",
    clearDone: "Видалено повідомлень: **{{count}}**.",
    clearFailed: "Не вдалося видалити повідомлення. Перевірте права ISTe Bot.",
    timeoutPermission: "Для `/timeout` потрібне право **Тайм-аут учасників**.",
    timeoutBotPermission:
      "ISTe Bot не має права **Тайм-аут учасників** на цьому сервері.",
    timeoutSecret:
      "Модерація ще не активована на серверній частині ISTe Bot. Власнику бота потрібно додати DISCORD_BOT_TOKEN у Supabase Edge Function Secrets.",
    timeoutSelf: "Не можна видати тайм-аут самому собі.",
    timeoutDone: "<@{{userId}}> отримав тайм-аут на **{{minutes}} хв**.",
    timeoutFailed:
      "Не вдалося видати тайм-аут. Перевірте роль ISTe Bot, її позицію та право модерації.",
    genericError: "Під час виконання команди сталася помилка.",
  },
  ru: {
    footer: "ISTe Bot • istesport.com",
    openSite: "Открыть сайт",
    installBot: "Добавить ISTe Bot",
    openAvatar: "Открыть аватар",
    noData: "Данные пока недоступны.",
    siteTitle: "Официальный сайт ISTe",
    siteText: "Команда, матчи, новости, партнёрства и ISTe Wear — в одном месте.",
    rulesTitle: "Правила ISTe Discord",
    rulesText:
      "Уважайте других участников, не используйте оскорбления, спам, мошенничество или запрещённый контент. Выполняйте требования модерации и правила конкретных каналов.",
    teamTitle: "Состав ISTe",
    matchesTitle: "Последние матчи ISTe",
    newsTitle: "Последние новости ISTe",
    helpTitle: "ISTe Bot — команды",
    helpText:
      "**Утилиты**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n**Сообщество**\n`/poll`\n\n**Модерация**\n`/clear` `/timeout`\n\n**ISTe**\n`/site` `/rules` `/team` `/matches` `/news`\n\n`/help` — эта справка",
    pingTitle: "ISTe Bot онлайн",
    pingText: "Обработка запроса: **{{ms}} мс**",
    serverTitle: "Информация о сервере",
    serverId: "ID сервера",
    serverCreated: "Создан",
    serverLocale: "Язык сервера",
    serverMembers: "Участников",
    userTitle: "Информация о пользователе",
    userId: "ID пользователя",
    userCreated: "Аккаунт создан",
    userJoined: "На сервере с",
    userRoles: "Ролей",
    userType: "Тип",
    userBot: "Бот",
    userHuman: "Пользователь",
    avatarTitle: "Аватар {{name}}",
    avatarMissing: "Не удалось получить аватар пользователя.",
    botTitle: "ISTe Bot",
    botText:
      "Универсальный Discord-бот от ISTesport: утилиты, опросы, модерация и интеграции ISTe.",
    botVersion: "Версия",
    botCommands: "Команд",
    botLanguage: "Локализация",
    inviteTitle: "Добавьте ISTe Bot на свой сервер",
    inviteText:
      "Установка проходит через официальное окно Discord. Вы сами выбираете сервер, где у вас есть право управления.",
    pollPermission:
      "У ISTe Bot нет права **Отправлять опросы** в этом канале. Добавьте боту это право и повторите команду.",
    pollInvalid: "Для опроса нужны как минимум два непустых варианта ответа.",
    clearPermission: "Для `/clear` требуется право **Управлять сообщениями**.",
    clearBotPermission:
      "У ISTe Bot нет права **Управлять сообщениями** в этом канале.",
    clearSecret:
      "Модерация ещё не активирована на серверной части ISTe Bot. Владельцу бота нужно добавить DISCORD_BOT_TOKEN в Supabase Edge Function Secrets.",
    clearNothing: "Нет подходящих сообщений для удаления.",
    clearDone: "Удалено сообщений: **{{count}}**.",
    clearFailed: "Не удалось удалить сообщения. Проверьте права ISTe Bot.",
    timeoutPermission: "Для `/timeout` требуется право **Тайм-аут участников**.",
    timeoutBotPermission:
      "У ISTe Bot нет права **Тайм-аут участников** на этом сервере.",
    timeoutSecret:
      "Модерация ещё не активирована на серверной части ISTe Bot. Владельцу бота нужно добавить DISCORD_BOT_TOKEN в Supabase Edge Function Secrets.",
    timeoutSelf: "Нельзя выдать тайм-аут самому себе.",
    timeoutDone: "<@{{userId}}> получил тайм-аут на **{{minutes}} мин**.",
    timeoutFailed:
      "Не удалось выдать тайм-аут. Проверьте роль ISTe Bot, её позицию и право модерации.",
    genericError: "Во время выполнения команды произошла ошибка.",
  },
  en: {
    footer: "ISTe Bot • istesport.com",
    openSite: "Open website",
    installBot: "Add ISTe Bot",
    openAvatar: "Open avatar",
    noData: "Data is currently unavailable.",
    siteTitle: "Official ISTe website",
    siteText: "Team, matches, news, partnerships and ISTe Wear in one place.",
    rulesTitle: "ISTe Discord rules",
    rulesText:
      "Respect other members. No harassment, spam, scams or prohibited content. Follow moderator instructions and channel-specific rules.",
    teamTitle: "ISTe roster",
    matchesTitle: "Latest ISTe matches",
    newsTitle: "Latest ISTe news",
    helpTitle: "ISTe Bot commands",
    helpText:
      "**Utilities**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n**Community**\n`/poll`\n\n**Moderation**\n`/clear` `/timeout`\n\n**ISTe**\n`/site` `/rules` `/team` `/matches` `/news`\n\n`/help` — this help page",
    pingTitle: "ISTe Bot is online",
    pingText: "Request processing: **{{ms}} ms**",
    serverTitle: "Server information",
    serverId: "Server ID",
    serverCreated: "Created",
    serverLocale: "Server locale",
    serverMembers: "Members",
    userTitle: "User information",
    userId: "User ID",
    userCreated: "Account created",
    userJoined: "Joined server",
    userRoles: "Roles",
    userType: "Type",
    userBot: "Bot",
    userHuman: "User",
    avatarTitle: "{{name}}'s avatar",
    avatarMissing: "Could not resolve this user's avatar.",
    botTitle: "ISTe Bot",
    botText:
      "A universal Discord bot by ISTesport: utilities, polls, moderation and ISTe integrations.",
    botVersion: "Version",
    botCommands: "Commands",
    botLanguage: "Localization",
    inviteTitle: "Add ISTe Bot to your server",
    inviteText:
      "Installation uses Discord's official authorization screen. You choose a server you are allowed to manage.",
    pollPermission:
      "ISTe Bot is missing the **Send Polls** permission in this channel. Grant it and try again.",
    pollInvalid: "A poll needs at least two non-empty answer options.",
    clearPermission: "`/clear` requires the **Manage Messages** permission.",
    clearBotPermission: "ISTe Bot is missing **Manage Messages** in this channel.",
    clearSecret:
      "Moderation is not enabled on the ISTe Bot backend yet. The bot owner must add DISCORD_BOT_TOKEN to Supabase Edge Function Secrets.",
    clearNothing: "There are no eligible messages to delete.",
    clearDone: "Deleted **{{count}}** messages.",
    clearFailed: "Could not delete the messages. Check ISTe Bot permissions.",
    timeoutPermission: "`/timeout` requires the **Timeout Members** permission.",
    timeoutBotPermission: "ISTe Bot is missing **Timeout Members** on this server.",
    timeoutSecret:
      "Moderation is not enabled on the ISTe Bot backend yet. The bot owner must add DISCORD_BOT_TOKEN to Supabase Edge Function Secrets.",
    timeoutSelf: "You cannot timeout yourself.",
    timeoutDone: "<@{{userId}}> was timed out for **{{minutes}} min**.",
    timeoutFailed:
      "Could not timeout that member. Check the ISTe Bot role position and moderation permission.",
    genericError: "An error occurred while running this command.",
  },
};

type Language = keyof typeof copy;

function interpolate(value: string, variables: Record<string, string | number>) {
  return value.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(variables, name)
      ? String(variables[name])
      : match
  );
}

function escapeMarkdown(value: unknown) {
  return String(value ?? "").replace(/([\\`*_{}\[\]()<>#+\-.!|])/g, "\\$1");
}

function interactionMessage(
  embed: Record<string, unknown>,
  components: unknown[] = [],
  ephemeral = false,
) {
  return {
    type: 4,
    data: {
      embeds: [embed],
      components,
      allowed_mentions: { parse: [] },
      ...(ephemeral ? { flags: 64 } : {}),
    },
  };
}

function ephemeralText(content: string) {
  return {
    type: 4,
    data: {
      content,
      flags: 64,
      allowed_mentions: { parse: [] },
    },
  };
}

function linkRow(buttons: Array<{ label: string; url: string }>) {
  return [
    {
      type: 1,
      components: buttons.slice(0, 5).map((button) => ({
        type: 2,
        style: 5,
        label: button.label,
        url: button.url,
      })),
    },
  ];
}

function baseEmbed(title: string, description: string, footer: string) {
  return {
    title,
    description,
    color: BRAND_COLOR,
    footer: { text: footer },
    timestamp: new Date().toISOString(),
  };
}

function snowflakeTimestamp(id: unknown) {
  try {
    const snowflake = BigInt(String(id || "0"));
    return Number((snowflake >> 22n) + 1420070400000n);
  } catch {
    return 0;
  }
}

function discordTimestamp(value: unknown) {
  const millis = typeof value === "number" ? value : Date.parse(String(value || ""));
  if (!Number.isFinite(millis) || millis <= 0) return "—";
  return `<t:${Math.floor(millis / 1000)}:F>`;
}

function hasPermission(raw: unknown, permission: bigint) {
  try {
    const bits = BigInt(String(raw || "0"));
    return (
      (bits & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR ||
      (bits & permission) === permission
    );
  } catch {
    return false;
  }
}

function getOptions(interaction: any) {
  const result: Record<string, any> = {};
  for (const option of interaction?.data?.options || []) {
    if (option?.name) result[String(option.name)] = option.value;
  }
  return result;
}

function getActor(interaction: any) {
  return interaction?.member?.user || interaction?.user || null;
}

function getResolvedUser(interaction: any, optionName = "member") {
  const options = getOptions(interaction);
  const id = options[optionName] ? String(options[optionName]) : "";
  if (!id) return null;

  const user = interaction?.data?.resolved?.users?.[id] || null;
  const member = interaction?.data?.resolved?.members?.[id] || null;

  return { id, user, member };
}

function avatarUrl(user: any, size = 1024) {
  const id = String(user?.id || "");
  const avatar = String(user?.avatar || "");

  if (id && avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}?size=${size}`;
  }

  if (!id) return "";

  try {
    const index = Number((BigInt(id) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return "";
  }
}

async function discordApi(
  path: string,
  {
    method = "GET",
    body = null,
    reason = "",
  }: { method?: string; body?: unknown; reason?: string } = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    throw Object.assign(new Error("DISCORD_BOT_TOKEN missing"), {
      code: "BOT_TOKEN_MISSING",
    });
  }

  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(reason
        ? { "X-Audit-Log-Reason": encodeURIComponent(reason).slice(0, 512) }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  if (response.status !== 204) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(payload?.message || `Discord API ${response.status}`),
      {
        status: response.status,
        details: payload,
      },
    );
  }

  return payload;
}

async function writeAudit(
  guildId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  if (!adminDb || !guildId) return;

  try {
    await adminDb.from("discord_bot_audit").insert({
      guild_id: guildId,
      event_type: eventType,
      payload,
    });
  } catch (error) {
    console.error("discord audit insert failed", error);
  }
}

async function rememberGuild(interaction: any) {
  const guildInstallOwner =
    interaction?.authorizing_integration_owners?.["0"];

  if (
    !adminDb ||
    !interaction?.guild_id ||
    !guildInstallOwner
  ) return;

  try {
    const guildName = String(interaction?.guild?.name || "").slice(0, 120);
    const now = new Date().toISOString();

    await adminDb.from("discord_guilds").upsert(
      {
        guild_id: String(interaction.guild_id),
        ...(guildName ? { guild_name: guildName } : {}),
        active: true,
        locale: localeFamily(interaction.guild_locale || interaction.locale),
        removed_at: null,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: "guild_id" },
    );
  } catch (error) {
    console.error("discord guild upsert failed", error);
  }
}

async function loadFaceit() {
  const response = await fetch(`${SITE_URL}/data/faceit-stats.json`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) throw new Error(`faceit ${response.status}`);
  return await response.json();
}

async function teamCommand(lang: Language) {
  const t = copy[lang];

  try {
    const data = await loadFaceit();
    const roster = Array.isArray(data?.roster) ? data.roster.slice(0, 7) : [];
    const lines = roster.map((player: any) => {
      const captain = player?.captain ? " 👑" : "";
      const role = player?.role ? ` • ${escapeMarkdown(player.role)}` : "";
      const level = Number.isFinite(player?.level) ? ` • LVL ${player.level}` : "";
      return `**${escapeMarkdown(player?.nickname || "Player")}**${captain}${role}${level}`;
    });

    return interactionMessage(
      baseEmbed(t.teamTitle, lines.length ? lines.join("\n") : t.noData, t.footer),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/team` }]),
    );
  } catch (error) {
    console.error("team command failed", error);
    return interactionMessage(baseEmbed(t.teamTitle, t.noData, t.footer));
  }
}

async function matchesCommand(lang: Language) {
  const t = copy[lang];

  try {
    const data = await loadFaceit();
    const matches = Array.isArray(data?.teamMatches) ? data.teamMatches.slice(0, 3) : [];
    const lines = matches.map((match: any) => {
      const own = match?.ownTeam || {};
      const opponent = match?.opponent || {};
      const score =
        Number.isFinite(own?.score) && Number.isFinite(opponent?.score)
          ? `${own.score}:${opponent.score}`
          : "—";
      const mark =
        match?.result === "win" ? "✅" : match?.result === "loss" ? "❌" : "•";
      return `${mark} **ISTe ${score} ${escapeMarkdown(opponent?.name || "Opponent")}**`;
    });

    return interactionMessage(
      baseEmbed(t.matchesTitle, lines.length ? lines.join("\n") : t.noData, t.footer),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/matches` }]),
    );
  } catch (error) {
    console.error("matches command failed", error);
    return interactionMessage(baseEmbed(t.matchesTitle, t.noData, t.footer));
  }
}

async function newsCommand(lang: Language) {
  const t = copy[lang];

  if (!publicDb) {
    return interactionMessage(baseEmbed(t.newsTitle, t.noData, t.footer));
  }

  try {
    const { data, error } = await publicDb
      .from("news_posts")
      .select("title, slug, excerpt, published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    const lines = (Array.isArray(data) ? data : []).map((post: any) => {
      const title = escapeMarkdown(post?.title || "ISTe News");
      const slug = encodeURIComponent(String(post?.slug || ""));
      return `• **[${title}](${SITE_URL}/news${slug ? `?article=${slug}` : ""})**`;
    });

    return interactionMessage(
      baseEmbed(t.newsTitle, lines.length ? lines.join("\n") : t.noData, t.footer),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/news` }]),
    );
  } catch (error) {
    console.error("news command failed", error);
    return interactionMessage(baseEmbed(t.newsTitle, t.noData, t.footer));
  }
}

async function serverCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const guildId = String(interaction?.guild_id || "");
  const guild = interaction?.guild || {};
  let memberCount: number | null = null;

  if (adminDb && guildId) {
    try {
      const { data } = await adminDb
        .from("discord_guilds")
        .select("member_count")
        .eq("guild_id", guildId)
        .maybeSingle();
      memberCount = Number.isFinite(data?.member_count) ? data.member_count : null;
    } catch {
      memberCount = null;
    }
  }

  const title = guild?.name ? escapeMarkdown(guild.name) : t.serverTitle;
  const embed: Record<string, unknown> = {
    ...baseEmbed(title, t.serverTitle, t.footer),
    fields: [
      { name: t.serverId, value: guildId || "—", inline: true },
      {
        name: t.serverCreated,
        value: guildId ? discordTimestamp(snowflakeTimestamp(guildId)) : "—",
        inline: true,
      },
      {
        name: t.serverLocale,
        value: String(interaction?.guild_locale || guild?.locale || "—"),
        inline: true,
      },
      {
        name: t.serverMembers,
        value: memberCount == null ? "—" : String(memberCount),
        inline: true,
      },
    ],
  };

  if (guildId && guild?.icon) {
    embed.thumbnail = {
      url: `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.webp?size=512`,
    };
  }

  return interactionMessage(embed);
}

function userCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const resolved = getResolvedUser(interaction);
  const actor = getActor(interaction);
  const targetUser = resolved?.user || actor;
  const targetMember = resolved?.member || (!resolved ? interaction?.member : null);

  if (!targetUser) return ephemeralText(t.genericError);

  const displayName =
    targetMember?.nick || targetUser?.global_name || targetUser?.username || targetUser.id;
  const avatar = avatarUrl(targetUser, 512);
  const fields = [
    { name: t.userId, value: String(targetUser.id), inline: true },
    {
      name: t.userCreated,
      value: discordTimestamp(snowflakeTimestamp(targetUser.id)),
      inline: true,
    },
    {
      name: t.userType,
      value: targetUser?.bot ? t.userBot : t.userHuman,
      inline: true,
    },
  ];

  if (targetMember?.joined_at) {
    fields.push({
      name: t.userJoined,
      value: discordTimestamp(targetMember.joined_at),
      inline: true,
    });
  }

  if (Array.isArray(targetMember?.roles)) {
    fields.push({
      name: t.userRoles,
      value: String(targetMember.roles.length),
      inline: true,
    });
  }

  const embed: Record<string, unknown> = {
    ...baseEmbed(escapeMarkdown(displayName), t.userTitle, t.footer),
    fields,
  };

  if (avatar) embed.thumbnail = { url: avatar };
  return interactionMessage(embed);
}

function avatarCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const resolved = getResolvedUser(interaction);
  const targetUser = resolved?.user || getActor(interaction);

  if (!targetUser) return ephemeralText(t.avatarMissing);

  const url = avatarUrl(targetUser, 1024);
  if (!url) return ephemeralText(t.avatarMissing);

  const name = targetUser?.global_name || targetUser?.username || targetUser.id;
  const embed: Record<string, unknown> = {
    ...baseEmbed(
      interpolate(t.avatarTitle, { name: escapeMarkdown(name) }),
      `ID: ${targetUser.id}`,
      t.footer,
    ),
    image: { url },
  };

  return interactionMessage(
    embed,
    linkRow([{ label: t.openAvatar, url }]),
  );
}

function botCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const embed = {
    ...baseEmbed(t.botTitle, t.botText, t.footer),
    fields: [
      { name: t.botVersion, value: BOT_VERSION, inline: true },
      { name: t.botCommands, value: "18", inline: true },
      { name: t.botLanguage, value: "UA • RU • EN", inline: true },
    ],
  };

  const appId = String(interaction?.application_id || "");
  const installUrl = appId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(appId)}`
    : `${SITE_URL}/discord`;

  return interactionMessage(
    embed,
    linkRow([
      { label: t.installBot, url: installUrl },
      { label: t.openSite, url: SITE_URL },
    ]),
  );
}

function inviteCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const appId = String(interaction?.application_id || "");
  const installUrl = appId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(appId)}`
    : `${SITE_URL}/discord`;

  return interactionMessage(
    baseEmbed(t.inviteTitle, t.inviteText, t.footer),
    linkRow([
      { label: t.installBot, url: installUrl },
      { label: t.openSite, url: `${SITE_URL}/discord` },
    ]),
  );
}

function pollCommand(interaction: any, lang: Language) {
  const t = copy[lang];

  if (!hasPermission(interaction?.app_permissions, PERMISSIONS.SEND_POLLS)) {
    return ephemeralText(t.pollPermission);
  }

  const options = getOptions(interaction);
  const question = String(options.question || "").trim().slice(0, 300);
  const answers = [
    options.option1,
    options.option2,
    options.option3,
    options.option4,
    options.option5,
  ]
    .map((value) => String(value || "").trim().slice(0, 55))
    .filter(Boolean);

  if (!question || answers.length < 2) {
    return ephemeralText(t.pollInvalid);
  }

  const hours = Math.min(768, Math.max(1, Number(options.hours || 24)));

  return {
    type: 4,
    data: {
      poll: {
        question: { text: question },
        answers: answers.map((answer) => ({
          poll_media: { text: answer },
        })),
        duration: hours,
        allow_multiselect: Boolean(options.multiselect),
        layout_type: 1,
      },
      allowed_mentions: { parse: [] },
    },
  };
}

async function clearCommand(interaction: any, lang: Language) {
  const t = copy[lang];

  if (!hasPermission(interaction?.member?.permissions, PERMISSIONS.MANAGE_MESSAGES)) {
    return ephemeralText(t.clearPermission);
  }

  if (!hasPermission(interaction?.app_permissions, PERMISSIONS.MANAGE_MESSAGES)) {
    return ephemeralText(t.clearBotPermission);
  }

  if (!DISCORD_BOT_TOKEN) return ephemeralText(t.clearSecret);

  const channelId = String(interaction?.channel_id || "");
  const guildId = String(interaction?.guild_id || "");
  const actor = getActor(interaction);
  const options = getOptions(interaction);
  const amount = Math.min(100, Math.max(1, Number(options.amount || 1)));

  if (!channelId || !guildId) return ephemeralText(t.clearFailed);

  try {
    const messages = await discordApi(
      `/channels/${channelId}/messages?limit=${amount}`,
    );

    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const ids = (Array.isArray(messages) ? messages : [])
      .filter((message: any) => {
        const timestamp = Date.parse(String(message?.timestamp || ""));
        return Number.isFinite(timestamp) && timestamp > cutoff;
      })
      .map((message: any) => String(message.id))
      .slice(0, amount);

    if (!ids.length) return ephemeralText(t.clearNothing);

    const reason = `ISTe Bot /clear by ${actor?.username || actor?.id || "moderator"}`;

    if (ids.length === 1) {
      await discordApi(`/channels/${channelId}/messages/${ids[0]}`, {
        method: "DELETE",
        reason,
      });
    } else {
      await discordApi(`/channels/${channelId}/messages/bulk-delete`, {
        method: "POST",
        body: { messages: ids },
        reason,
      });
    }

    await writeAudit(guildId, "command.clear", {
      actor_id: actor?.id || null,
      channel_id: channelId,
      amount: ids.length,
    });

    return ephemeralText(interpolate(t.clearDone, { count: ids.length }));
  } catch (error) {
    console.error("clear command failed", error);
    return ephemeralText(t.clearFailed);
  }
}

async function timeoutCommand(interaction: any, lang: Language) {
  const t = copy[lang];

  if (!hasPermission(interaction?.member?.permissions, PERMISSIONS.MODERATE_MEMBERS)) {
    return ephemeralText(t.timeoutPermission);
  }

  if (!hasPermission(interaction?.app_permissions, PERMISSIONS.MODERATE_MEMBERS)) {
    return ephemeralText(t.timeoutBotPermission);
  }

  if (!DISCORD_BOT_TOKEN) return ephemeralText(t.timeoutSecret);

  const guildId = String(interaction?.guild_id || "");
  const actor = getActor(interaction);
  const target = getResolvedUser(interaction);
  const options = getOptions(interaction);
  const minutes = Math.min(40320, Math.max(1, Number(options.minutes || 1)));
  const reason = String(options.reason || "").trim().slice(0, 256);

  if (!guildId || !target?.id) return ephemeralText(t.timeoutFailed);
  if (String(actor?.id || "") === target.id) return ephemeralText(t.timeoutSelf);

  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  try {
    await discordApi(`/guilds/${guildId}/members/${target.id}`, {
      method: "PATCH",
      body: { communication_disabled_until: until },
      reason:
        reason ||
        `ISTe Bot /timeout by ${actor?.username || actor?.id || "moderator"}`,
    });

    await writeAudit(guildId, "command.timeout", {
      actor_id: actor?.id || null,
      target_id: target.id,
      minutes,
      reason: reason || null,
    });

    return ephemeralText(
      interpolate(t.timeoutDone, {
        userId: target.id,
        minutes,
      }),
    );
  } catch (error) {
    console.error("timeout command failed", error);
    return ephemeralText(t.timeoutFailed);
  }
}

async function handleCommand(interaction: any, startedAt: number) {
  await rememberGuild(interaction);

  const lang = localeFamily(
    interaction?.locale || interaction?.guild_locale,
  ) as Language;
  const t = copy[lang];
  const command = String(interaction?.data?.name || "").toLowerCase();

  const recruitmentResponse = await handleRecruitmentCommand(
    interaction,
    command,
  );

  if (recruitmentResponse) {
    return recruitmentResponse;
  }

  const recruitmentResponse = await handleRecruitmentCommand(
    interaction,
    command,
  );

  if (recruitmentResponse) {
    return recruitmentResponse;
  }

  if (command === "ping") {
    const elapsed = Math.max(0, Date.now() - startedAt);
    return interactionMessage(
      baseEmbed(
        t.pingTitle,
        interpolate(t.pingText, { ms: elapsed }),
        t.footer,
      ),
    );
  }

  if (command === "server") return await serverCommand(interaction, lang);
  if (command === "user") return userCommand(interaction, lang);
  if (command === "avatar") return avatarCommand(interaction, lang);
  if (command === "bot") return botCommand(interaction, lang);
  if (command === "invite") return inviteCommand(interaction, lang);
  if (command === "poll") return pollCommand(interaction, lang);
  if (command === "clear") return await clearCommand(interaction, lang);
  if (command === "timeout") return await timeoutCommand(interaction, lang);

  if (command === "site") {
    return interactionMessage(
      baseEmbed(t.siteTitle, t.siteText, t.footer),
      linkRow([{ label: t.openSite, url: SITE_URL }]),
    );
  }

  if (command === "rules") {
    return interactionMessage(baseEmbed(t.rulesTitle, t.rulesText, t.footer));
  }

  if (command === "team") return await teamCommand(lang);
  if (command === "matches") return await matchesCommand(lang);
  if (command === "news") return await newsCommand(lang);

  return interactionMessage(baseEmbed(t.helpTitle, t.helpText, t.footer));
}

Deno.serve(async (request) => {
  const startedAt = Date.now();

  if (request.method !== "POST") {
    return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  }

  const signature = request.headers.get("x-signature-ed25519") || "";
  const timestamp = request.headers.get("x-signature-timestamp") || "";
  const rawBody = await request.text();

  if (
    !signature ||
    !timestamp ||
    !verifyDiscordRequest(signature, timestamp, rawBody)
  ) {
    return json({ ok: false, error: "INVALID_SIGNATURE" }, 401);
  }

  let interaction: any;
  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }

  if (interaction?.type === 1) {
    return json({ type: 1 });
  }

  if (interaction?.type === 2) {
    try {
      return json(await handleCommand(interaction, startedAt));
    } catch (error) {
      console.error("discord command failed", error);
      const lang = localeFamily(
        interaction?.locale || interaction?.guild_locale,
      ) as Language;
      return json(ephemeralText(copy[lang].genericError));
    }
  }

  if (interaction?.type === 3) {
    try {
      const response = await handleRecruitmentComponent(interaction);
      if (response) return json(response);
    } catch (error) {
      console.error("discord component failed", error);
      return json(ephemeralText("Не вдалося виконати дію."));
    }
  }

  if (interaction?.type === 5) {
    try {
      const response = await handleRecruitmentModal(interaction);
      if (response) return json(response);
    } catch (error) {
      console.error("discord modal failed", error);
      return json(ephemeralText("Не вдалося надіслати заявку."));
    }
  }

  return json({
    type: 4,
    data: {
      content: "ISTe Bot: unsupported interaction.",
      flags: 64,
      allowed_mentions: { parse: [] },
    },
  });
});
