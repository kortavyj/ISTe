import nacl from "npm:tweetnacl@1.0.3";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

import {
  handleRecruitmentCommand,
  handleRecruitmentComponent,
  handleRecruitmentModal,
} from "./recruitment.ts";

import {
  handlePrivateRoomCommand,
  handlePrivateRoomComponent,
  handlePrivateRoomModal,
} from "./privateRooms.ts";

import {
  handleTicketComponent,
} from "./tickets.ts";

import {
  handleRolesVerificationComponent,
} from "./rolesVerification.ts";

import {
  handleGiveawayComponent,
} from "./giveaways.ts";

const encoder = new TextEncoder();
const SITE_URL = (Deno.env.get("SITE_URL") || "https://istesport.com").replace(/\/+$/, "");
const BOT_PORTAL_URL =
  (
    Deno.env.get(
      "BOT_PORTAL_URL",
    ) ||
    "https://www.istesport.com/api/owner"
  ).replace(/\/+$/, "");
const DISCORD_PUBLIC_KEY =
  Deno.env.get("DISCORD_PUBLIC_KEY") ||
  "65365ccdf33b5d411932191201b26eb21a4d479757d93ff021704b9a118ee86a";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DISCORD_API = "https://discord.com/api/v10";
const INTERNAL_GUILD_ID =
  Deno.env.get("ISTE_INTERNAL_GUILD_ID") ||
  "1334264628695404556";
const SHOP_CHANNEL_ID =
  Deno.env.get("ISTE_SHOP_CHANNEL_ID") ||
  "";
const SHOP_CHANNEL_NAME =
  (
    Deno.env.get("ISTE_SHOP_CHANNEL_NAME") ||
    "shop"
  )
    .trim()
    .toLowerCase();
const BRAND_COLOR = 0xe30613;
const BOT_VERSION = "2.5.0";

const SUBSCRIPTION_PLANS = {
  starter: {
    priceUsd: 2.99,
    maxGuilds: 1,
  },
  pro: {
    priceUsd: 4.99,
    maxGuilds: 3,
  },
  max: {
    priceUsd: 6.99,
    maxGuilds: 10,
  },
} as const;

type SubscriptionPlan =
  keyof typeof SUBSCRIPTION_PLANS;

const PERMISSIONS = {
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
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
    siteTitle: "Офіційний сайт ISTesport",
    siteText: "Команда, матчі, новини, партнерства та Discord ISTesport — в одному місці.",
    rulesTitle: "Правила ISTesport Discord",
    rulesText:
      "Поважайте інших учасників, не використовуйте образи, спам, шахрайство або заборонений контент. Виконуйте вимоги модерації та правила конкретних каналів.",
    teamTitle: "Склад ISTesport",
    matchesTitle: "Останні матчі ISTesport",
    newsTitle: "Останні новини ISTesport",
    helpTitle: "ISTe Bot — команди",
    helpText:
      "**Утиліти**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n" +
      "**Спільнота**\n`/poll` `/room`\n\n" +
      "**Модерація**\n`/warn` `/warnings` `/unwarn` `/timeout` `/kick` `/ban` `/unban` `/clear` `/slowmode`\n\n" +
      "**ISTesport**\n`/site` `/rules` `/team` `/matches` `/news` `/subscription`\n\n" +
      "`/help` — ця довідка",
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
      "Discord-бот ISTesport: утиліти, опитування, приватні голосові кімнати, модерація та інтеграції ISTesport.",
    botVersion: "Версія",
    botCommands: "Команд",
    botLanguage: "Локалізація",
    inviteTitle: "Додайте ISTe Bot на свій сервер",
    inviteText:
      "Встановлення проходить через офіційне вікно Discord. Ви самі обираєте сервер, де маєте право керування.",
    subscriptionTitle: "Підписка ISTe Bot",
    subscriptionCurrent: "Поточний тариф",
    subscriptionStatus: "Статус",
    subscriptionExpires: "Діє до",
    subscriptionPending: "Очікує підтвердження",
    subscriptionChoose:
      "Оберіть тариф нижче. Бот створить замовлення у каналі **Shop**. Після оплати адміністратор підтвердить її, і підписка активується на 30 днів.",
    subscriptionLinkRequired:
      "Спочатку прив'яжіть Discord до акаунта ISTe на сайті. Після цього поверніться до цієї команди.",
    subscriptionOpenDashboard: "Відкрити ISTe Dashboard",
    subscriptionRequested:
      "Замовлення на **{{plan}}** створено. Перейдіть у канал **Shop** для оплати. Підписка активується лише після підтвердження оплати адміністратором ISTe.",
    subscriptionOpenShop: "Перейти в Shop",
    subscriptionPaymentPending: "Очікує оплату",
    subscriptionPaymentApprove: "Підтвердити оплату",
    subscriptionPaymentReject: "Відхилити",
    subscriptionPaymentApproved:
      "Оплату підтверджено. Підписку **{{plan}}** активовано до {{expires}}.",
    subscriptionPaymentRejected:
      "Замовлення на **{{plan}}** відхилено.",
    subscriptionInternal:
      "Для цього акаунта активна внутрішня підписка ISTe. Заявка не потрібна.",
    subscriptionUnavailable:
      "Сервіс підписок тимчасово недоступний.",
    subscriptionNoExpiry: "безстроково",
    subscriptionFree: "FREE",
    subscriptionAdminTitle: "Заявки на підписку",
    subscriptionAdminEmpty: "Нових заявок немає.",
    subscriptionAdminDenied:
      "Ця команда доступна лише адміністратору або власнику ISTe.",
    subscriptionAdminApprove: "Активувати",
    subscriptionAdminReject: "Відхилити",
    subscriptionAdminApproved:
      "Підписку **{{plan}}** активовано до {{expires}}.",
    subscriptionAdminRejected:
      "Заявку на **{{plan}}** відхилено.",
    subscriptionAdminUser: "Користувач",
    subscriptionAdminRequested: "Запит",
    subscriptionAdminCurrent: "Зараз",
    pollPermission:
      "ISTe Bot не має права **Надсилати опитування** в цьому каналі.",
    pollInvalid:
      "Для опитування потрібно щонайменше дві непорожні відповіді.",
    clearPermission:
      "Для `/clear` потрібне право **Керувати повідомленнями**.",
    clearBotPermission:
      "ISTe Bot не має права **Керувати повідомленнями** в цьому каналі.",
    clearNothing: "Немає придатних повідомлень для видалення.",
    clearDone: "Видалено повідомлень: **{{count}}**.",
    clearFailed:
      "Не вдалося видалити повідомлення. Перевірте права ISTe Bot.",
    timeoutPermission:
      "Для `/timeout` потрібне право **Тайм-аут учасників**.",
    timeoutBotPermission:
      "ISTe Bot не має права **Тайм-аут учасників** на цьому сервері.",
    timeoutSelf: "Не можна видати тайм-аут самому собі.",
    timeoutDone:
      "<@{{userId}}> отримав тайм-аут на **{{minutes}} хв**.",
    timeoutFailed:
      "Не вдалося видати тайм-аут. Перевірте роль ISTe Bot і її права.",
    moderationDisabled:
      "Модуль Moderation вимкнено в панелі ISTe Bot.",
    clearDisabled:
      "Команду /clear вимкнено в налаштуваннях цього сервера.",
    timeoutDisabled:
      "Команду /timeout вимкнено в налаштуваннях цього сервера.",
    moderatorRoleRequired:
      "Для цієї дії потрібна налаштована роль модератора або адміністратора ISTe.",
    moderationBotPermission:
      "ISTe Bot не має потрібного Discord-дозволу для цієї дії.",
    moderationInvalidTarget:
      "Не можна застосувати цю дію до самого себе.",
    warnDone:
      "Попередження видано. Кейс **#{{caseId}}** для <@{{userId}}>.",
    warningsNone:
      "У <@{{userId}}> немає активних попереджень.",
    unwarnMissing:
      "Активний warn-кейс з таким номером не знайдено.",
    unwarnDone:
      "Попередження **#{{caseId}}** знято.",
    kickDone:
      "<@{{userId}}> виключено із сервера. Кейс **#{{caseId}}**.",
    kickFailed:
      "Не вдалося виключити учасника. Перевірте ієрархію ролей і права ISTe Bot.",
    banDone:
      "<@{{userId}}> заблоковано. Кейс **#{{caseId}}**.",
    banFailed:
      "Не вдалося заблокувати учасника. Перевірте ієрархію ролей і права ISTe Bot.",
    unbanDone:
      "Користувача **{{userId}}** розблоковано. Кейс **#{{caseId}}**.",
    unbanFailed:
      "Не вдалося розблокувати користувача.",
    invalidUserId:
      "Вкажіть коректний Discord User ID.",
    slowmodeDone:
      "Slowmode для <#{{channelId}}> встановлено на **{{seconds}} с**.",
    slowmodeFailed:
      "Не вдалося змінити slowmode цього каналу.",
    moderationHistoryFailed:
      "Не вдалося завантажити історію модерації.",
    genericError: "Під час виконання команди сталася помилка.",
  },

  ru: {
    footer: "ISTe Bot • istesport.com",
    openSite: "Открыть сайт",
    installBot: "Добавить ISTe Bot",
    openAvatar: "Открыть аватар",
    noData: "Данные пока недоступны.",
    siteTitle: "Официальный сайт ISTesport",
    siteText: "Команда, матчи, новости, партнёрства и Discord ISTesport — в одном месте.",
    rulesTitle: "Правила ISTesport Discord",
    rulesText:
      "Уважайте других участников, не используйте оскорбления, спам, мошенничество или запрещённый контент. Выполняйте требования модерации и правила конкретных каналов.",
    teamTitle: "Состав ISTesport",
    matchesTitle: "Последние матчи ISTesport",
    newsTitle: "Последние новости ISTesport",
    helpTitle: "ISTe Bot — команды",
    helpText:
      "**Утилиты**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n" +
      "**Сообщество**\n`/poll` `/room`\n\n" +
      "**Модерация**\n`/warn` `/warnings` `/unwarn` `/timeout` `/kick` `/ban` `/unban` `/clear` `/slowmode`\n\n" +
      "**ISTesport**\n`/site` `/rules` `/team` `/matches` `/news` `/subscription`\n\n" +
      "`/help` — эта справка",
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
      "Discord-бот ISTesport: утилиты, опросы, приватные голосовые комнаты, модерация и интеграции ISTesport.",
    botVersion: "Версия",
    botCommands: "Команд",
    botLanguage: "Локализация",
    inviteTitle: "Добавьте ISTe Bot на свой сервер",
    inviteText:
      "Установка проходит через официальное окно Discord. Вы сами выбираете сервер, где у вас есть право управления.",
    subscriptionTitle: "Подписка ISTe Bot",
    subscriptionCurrent: "Текущий тариф",
    subscriptionStatus: "Статус",
    subscriptionExpires: "Действует до",
    subscriptionPending: "Ожидает подтверждения",
    subscriptionChoose:
      "Выберите тариф ниже. Бот создаст заказ в канале **Shop**. После оплаты администратор подтвердит её, и подписка активируется на 30 дней.",
    subscriptionLinkRequired:
      "Сначала привяжите Discord к аккаунту ISTe на сайте. После этого вернитесь к этой команде.",
    subscriptionOpenDashboard: "Открыть ISTe Dashboard",
    subscriptionRequested:
      "Заказ на **{{plan}}** создан. Перейдите в канал **Shop** для оплаты. Подписка активируется только после подтверждения оплаты администратором ISTe.",
    subscriptionOpenShop: "Перейти в Shop",
    subscriptionPaymentPending: "Ожидает оплату",
    subscriptionPaymentApprove: "Подтвердить оплату",
    subscriptionPaymentReject: "Отклонить",
    subscriptionPaymentApproved:
      "Оплата подтверждена. Подписка **{{plan}}** активирована до {{expires}}.",
    subscriptionPaymentRejected:
      "Заказ на **{{plan}}** отклонён.",
    subscriptionInternal:
      "Для этого аккаунта активна внутренняя подписка ISTe. Заявка не требуется.",
    subscriptionUnavailable:
      "Сервис подписок временно недоступен.",
    subscriptionNoExpiry: "бессрочно",
    subscriptionFree: "FREE",
    subscriptionAdminTitle: "Заявки на подписку",
    subscriptionAdminEmpty: "Новых заявок нет.",
    subscriptionAdminDenied:
      "Эта команда доступна только администратору или владельцу ISTe.",
    subscriptionAdminApprove: "Активировать",
    subscriptionAdminReject: "Отклонить",
    subscriptionAdminApproved:
      "Подписка **{{plan}}** активирована до {{expires}}.",
    subscriptionAdminRejected:
      "Заявка на **{{plan}}** отклонена.",
    subscriptionAdminUser: "Пользователь",
    subscriptionAdminRequested: "Запрос",
    subscriptionAdminCurrent: "Сейчас",
    pollPermission:
      "У ISTe Bot нет права **Отправлять опросы** в этом канале.",
    pollInvalid:
      "Для опроса нужны как минимум два непустых варианта ответа.",
    clearPermission:
      "Для `/clear` требуется право **Управлять сообщениями**.",
    clearBotPermission:
      "У ISTe Bot нет права **Управлять сообщениями** в этом канале.",
    clearNothing: "Нет подходящих сообщений для удаления.",
    clearDone: "Удалено сообщений: **{{count}}**.",
    clearFailed:
      "Не удалось удалить сообщения. Проверьте права ISTe Bot.",
    timeoutPermission:
      "Для `/timeout` требуется право **Тайм-аут участников**.",
    timeoutBotPermission:
      "У ISTe Bot нет права **Тайм-аут участников** на этом сервере.",
    timeoutSelf: "Нельзя выдать тайм-аут самому себе.",
    timeoutDone:
      "<@{{userId}}> получил тайм-аут на **{{minutes}} мин**.",
    timeoutFailed:
      "Не удалось выдать тайм-аут. Проверьте роль ISTe Bot и её права.",
    moderationDisabled:
      "Модуль Moderation выключен в панели ISTe Bot.",
    clearDisabled:
      "Команда /clear выключена в настройках этого сервера.",
    timeoutDisabled:
      "Команда /timeout выключена в настройках этого сервера.",
    moderatorRoleRequired:
      "Для этого действия нужна настроенная роль модератора или администратора ISTe.",
    moderationBotPermission:
      "У ISTe Bot нет нужного Discord-разрешения для этого действия.",
    moderationInvalidTarget:
      "Нельзя применить это действие к самому себе.",
    warnDone:
      "Предупреждение выдано. Кейс **#{{caseId}}** для <@{{userId}}>.",
    warningsNone:
      "У <@{{userId}}> нет активных предупреждений.",
    unwarnMissing:
      "Активный warn-кейс с таким номером не найден.",
    unwarnDone:
      "Предупреждение **#{{caseId}}** снято.",
    kickDone:
      "<@{{userId}}> исключён с сервера. Кейс **#{{caseId}}**.",
    kickFailed:
      "Не удалось исключить участника. Проверьте иерархию ролей и права ISTe Bot.",
    banDone:
      "<@{{userId}}> заблокирован. Кейс **#{{caseId}}**.",
    banFailed:
      "Не удалось заблокировать участника. Проверьте иерархию ролей и права ISTe Bot.",
    unbanDone:
      "Пользователь **{{userId}}** разблокирован. Кейс **#{{caseId}}**.",
    unbanFailed:
      "Не удалось разблокировать пользователя.",
    invalidUserId:
      "Укажите корректный Discord User ID.",
    slowmodeDone:
      "Slowmode для <#{{channelId}}> установлен на **{{seconds}} с**.",
    slowmodeFailed:
      "Не удалось изменить slowmode этого канала.",
    moderationHistoryFailed:
      "Не удалось загрузить историю модерации.",
    genericError: "Во время выполнения команды произошла ошибка.",
  },

  en: {
    footer: "ISTe Bot • istesport.com",
    openSite: "Open website",
    installBot: "Add ISTe Bot",
    openAvatar: "Open avatar",
    noData: "Data is currently unavailable.",
    siteTitle: "Official ISTesport website",
    siteText: "Team, matches, news, partnerships and ISTesport Discord in one place.",
    rulesTitle: "ISTesport Discord rules",
    rulesText:
      "Respect other members. No harassment, spam, scams or prohibited content. Follow moderator instructions and channel-specific rules.",
    teamTitle: "ISTesport roster",
    matchesTitle: "Latest ISTesport matches",
    newsTitle: "Latest ISTesport news",
    helpTitle: "ISTe Bot commands",
    helpText:
      "**Utilities**\n`/ping` `/server` `/user` `/avatar` `/bot` `/invite`\n\n" +
      "**Community**\n`/poll` `/room`\n\n" +
      "**Moderation**\n`/warn` `/warnings` `/unwarn` `/timeout` `/kick` `/ban` `/unban` `/clear` `/slowmode`\n\n" +
      "**ISTesport**\n`/site` `/rules` `/team` `/matches` `/news` `/subscription`\n\n" +
      "`/help` — this help page",
    pingTitle: "ISTe Bot is online",
    pingText: "Request processing: **{{ms}} ms**",
    serverTitle: "Server information",
    serverId: "Server ID",
    serverCreated: "Created",
    serverLocale: "Server language",
    serverMembers: "Members",
    userTitle: "User information",
    userId: "User ID",
    userCreated: "Account created",
    userJoined: "Joined server",
    userRoles: "Roles",
    userType: "Type",
    userBot: "Bot",
    userHuman: "User",
    avatarTitle: "{{name}} avatar",
    avatarMissing: "Could not get the user's avatar.",
    botTitle: "ISTe Bot",
    botText:
      "ISTesport Discord bot: utilities, polls, private voice rooms, moderation and ISTesport integrations.",
    botVersion: "Version",
    botCommands: "Commands",
    botLanguage: "Localization",
    inviteTitle: "Add ISTe Bot to your server",
    inviteText:
      "Installation uses Discord's official authorization screen.",
    subscriptionTitle: "ISTe Bot subscription",
    subscriptionCurrent: "Current plan",
    subscriptionStatus: "Status",
    subscriptionExpires: "Expires",
    subscriptionPending: "Pending approval",
    subscriptionChoose:
      "Choose a plan below. The bot creates an order in the **Shop** channel. After payment, an ISTe admin confirms it and the subscription activates for 30 days.",
    subscriptionLinkRequired:
      "Link Discord to your ISTe website account first, then return to this command.",
    subscriptionOpenDashboard: "Open ISTe Dashboard",
    subscriptionRequested:
      "Your **{{plan}}** order was created. Open the **Shop** channel to complete payment. The subscription activates only after an ISTe admin confirms payment.",
    subscriptionOpenShop: "Open Shop",
    subscriptionPaymentPending: "Awaiting payment",
    subscriptionPaymentApprove: "Confirm payment",
    subscriptionPaymentReject: "Reject",
    subscriptionPaymentApproved:
      "Payment confirmed. **{{plan}}** is active until {{expires}}.",
    subscriptionPaymentRejected:
      "The **{{plan}}** order was rejected.",
    subscriptionInternal:
      "This account already has an internal ISTe subscription. No request is needed.",
    subscriptionUnavailable:
      "The subscription service is temporarily unavailable.",
    subscriptionNoExpiry: "unlimited",
    subscriptionFree: "FREE",
    subscriptionAdminTitle: "Subscription requests",
    subscriptionAdminEmpty: "There are no new requests.",
    subscriptionAdminDenied:
      "This command is available only to an ISTe administrator or owner.",
    subscriptionAdminApprove: "Activate",
    subscriptionAdminReject: "Reject",
    subscriptionAdminApproved:
      "**{{plan}}** activated until {{expires}}.",
    subscriptionAdminRejected:
      "The **{{plan}}** request was rejected.",
    subscriptionAdminUser: "User",
    subscriptionAdminRequested: "Requested",
    subscriptionAdminCurrent: "Current",
    pollPermission:
      "ISTe Bot is missing the **Send Polls** permission in this channel.",
    pollInvalid:
      "A poll needs at least two non-empty answer options.",
    clearPermission:
      "`/clear` requires the **Manage Messages** permission.",
    clearBotPermission:
      "ISTe Bot is missing **Manage Messages** in this channel.",
    clearNothing: "There are no eligible messages to delete.",
    clearDone: "Deleted **{{count}}** messages.",
    clearFailed:
      "Could not delete the messages. Check ISTe Bot permissions.",
    timeoutPermission:
      "`/timeout` requires the **Timeout Members** permission.",
    timeoutBotPermission:
      "ISTe Bot is missing **Timeout Members** on this server.",
    timeoutSelf: "You cannot timeout yourself.",
    timeoutDone:
      "<@{{userId}}> was timed out for **{{minutes}} min**.",
    timeoutFailed:
      "Could not timeout that member. Check ISTe Bot permissions.",
    moderationDisabled:
      "The Moderation module is disabled in the ISTe Bot dashboard.",
    clearDisabled:
      "The /clear command is disabled for this server.",
    timeoutDisabled:
      "The /timeout command is disabled for this server.",
    moderatorRoleRequired:
      "This action requires the configured ISTe moderator or administrator role.",
    moderationBotPermission:
      "ISTe Bot is missing the Discord permission required for this action.",
    moderationInvalidTarget:
      "You cannot apply this action to yourself.",
    warnDone:
      "Warning issued. Case **#{{caseId}}** for <@{{userId}}>.",
    warningsNone:
      "<@{{userId}}> has no active warnings.",
    unwarnMissing:
      "No active warning case with that number was found.",
    unwarnDone:
      "Warning **#{{caseId}}** revoked.",
    kickDone:
      "<@{{userId}}> was kicked. Case **#{{caseId}}**.",
    kickFailed:
      "Could not kick that member. Check role hierarchy and ISTe Bot permissions.",
    banDone:
      "<@{{userId}}> was banned. Case **#{{caseId}}**.",
    banFailed:
      "Could not ban that member. Check role hierarchy and ISTe Bot permissions.",
    unbanDone:
      "User **{{userId}}** was unbanned. Case **#{{caseId}}**.",
    unbanFailed:
      "Could not unban that user.",
    invalidUserId:
      "Enter a valid Discord User ID.",
    slowmodeDone:
      "Slowmode for <#{{channelId}}> is now **{{seconds}} s**.",
    slowmodeFailed:
      "Could not change slowmode for that channel.",
    moderationHistoryFailed:
      "Could not load moderation history.",
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
  const millis =
    typeof value === "number"
      ? value
      : Date.parse(String(value || ""));

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

async function discordBotRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN missing",
    );
  }

  const response =
    await fetch(
      DISCORD_API + path,
      {
        method:
          options.method ||
          "GET",
        headers: {
          Authorization:
            "Bot " +
            DISCORD_BOT_TOKEN,
          Accept:
            "application/json",
          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },
        ...(options.body
          ? {
              body:
                JSON.stringify(
                  options.body,
                ),
            }
          : {}),
      },
    );

  const payload =
    response.status === 204
      ? null
      : await response
          .json()
          .catch(
            () => null,
          );

  if (!response.ok) {
    throw new Error(
      (
        payload?.message ||
        "Discord API error"
      ) +
        " (" +
        String(
          response.status,
        ) +
        ")",
    );
  }

  return payload;
}

async function resolveShopChannelId() {
  if (
    /^[0-9]{17,20}$/.test(
      SHOP_CHANNEL_ID,
    )
  ) {
    return SHOP_CHANNEL_ID;
  }

  if (
    !/^[0-9]{17,20}$/.test(
      INTERNAL_GUILD_ID,
    )
  ) {
    return "";
  }

  const channels =
    await discordBotRequest(
      "/guilds/" +
        INTERNAL_GUILD_ID +
        "/channels",
    );

  if (
    !Array.isArray(
      channels,
    )
  ) {
    return "";
  }

  const channel =
    channels.find(
      (item: any) =>
        [0, 5].includes(
          Number(
            item?.type,
          ),
        ) &&
        String(
          item?.name ||
          "",
        )
          .trim()
          .toLowerCase() ===
          SHOP_CHANNEL_NAME,
    );

  return String(
    channel?.id ||
    "",
  );
}

function shopChannelUrl(
  channelId: string,
) {
  return (
    "https://discord.com/channels/" +
    INTERNAL_GUILD_ID +
    "/" +
    channelId
  );
}

function subscriptionShopEmbed(
  requestId: string,
  discordUserId: string,
  plan: SubscriptionPlan,
  status:
    | "pending"
    | "approved"
    | "rejected",
  expiresAt?: string | null,
) {
  const config =
    SUBSCRIPTION_PLANS[
      plan
    ];

  const statusText =
    status === "approved"
      ? "🟢 ОПЛАЧЕНО / АКТИВИРОВАНО"
      : status === "rejected"
        ? "🔴 ОТКЛОНЕНО"
        : "🟡 ОЖИДАЕТ ОПЛАТУ";

  return {
    title:
      "🛒 ISTe Bot • Подписка",
    description:
      status === "pending"
        ? "После получения оплаты администратор ISTe подтверждает заказ кнопкой ниже."
        : status ===
            "approved"
          ? "Оплата подтверждена, подписка активирована."
          : "Заказ закрыт без активации подписки.",
    color:
      status === "approved"
        ? 0x2ecc71
        : status ===
            "rejected"
          ? 0xe74c3c
          : BRAND_COLOR,
    fields: [
      {
        name:
          "Покупатель",
        value:
          "<@" +
          discordUserId +
          ">",
        inline: true,
      },
      {
        name: "Тариф",
        value:
          plan.toUpperCase(),
        inline: true,
      },
      {
        name: "Стоимость",
        value:
          "$" +
          config.priceUsd.toFixed(
            2,
          ),
        inline: true,
      },
      {
        name: "Период",
        value: "30 дней",
        inline: true,
      },
      {
        name: "Статус",
        value: statusText,
        inline: true,
      },
      {
        name:
          "ID заказа",
        value:
          "`" +
          requestId +
          "`",
        inline: false,
      },
      ...(expiresAt
        ? [
            {
              name:
                "Активна до",
              value:
                discordTimestamp(
                  expiresAt,
                ),
              inline: false,
            },
          ]
        : []),
    ],
    footer: {
      text:
        "ISTe Shop • ISTe Bot",
    },
    timestamp:
      new Date()
        .toISOString(),
  };
}

function subscriptionShopComponents(
  requestId: string,
) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          custom_id:
            "iste:subscription-admin:approve:" +
            requestId,
          label:
            "Подтвердить оплату",
        },
        {
          type: 2,
          style: 4,
          custom_id:
            "iste:subscription-admin:reject:" +
            requestId,
          label:
            "Отклонить",
        },
      ],
    },
  ];
}

async function upsertSubscriptionShopOrder(
  requestId: string,
  discordUserId: string,
  plan: SubscriptionPlan,
  metadata: Record<
    string,
    unknown
  > = {},
) {
  const channelId =
    await resolveShopChannelId();

  if (!channelId) {
    throw new Error(
      "ISTe Shop channel not found",
    );
  }

  const payload = {
    content:
      "<@" +
      discordUserId +
      ">",
    embeds: [
      subscriptionShopEmbed(
        requestId,
        discordUserId,
        plan,
        "pending",
      ),
    ],
    components:
      subscriptionShopComponents(
        requestId,
      ),
    allowed_mentions: {
      users: [
        discordUserId,
      ],
      parse: [],
    },
  };

  const existingChannelId =
    String(
      metadata
        ?.shop_channel_id ||
      "",
    );
  const existingMessageId =
    String(
      metadata
        ?.shop_message_id ||
      "",
    );

  let message;

  if (
    /^[0-9]{17,20}$/.test(
      existingChannelId,
    ) &&
    /^[0-9]{17,20}$/.test(
      existingMessageId,
    )
  ) {
    try {
      message =
        await discordBotRequest(
          "/channels/" +
            existingChannelId +
            "/messages/" +
            existingMessageId,
          {
            method:
              "PATCH",
            body:
              payload,
          },
        );
    } catch {
      message = null;
    }
  }

  if (!message) {
    message =
      await discordBotRequest(
        "/channels/" +
          channelId +
          "/messages",
        {
          method: "POST",
          body: payload,
        },
      );
  }

  return {
    guildId:
      INTERNAL_GUILD_ID,
    channelId,
    messageId:
      String(
        message?.id ||
        "",
      ),
    url:
      shopChannelUrl(
        channelId,
      ),
  };
}

async function sendSubscriptionDecisionDm(
  discordUserId: string,
  plan: SubscriptionPlan,
  decision:
    | "approve"
    | "reject",
  expiresAt?: string | null,
) {
  if (
    !/^[0-9]{17,20}$/.test(
      discordUserId,
    )
  ) {
    return false;
  }

  try {
    const dm =
      await discordBotRequest(
        "/users/@me/channels",
        {
          method: "POST",
          body: {
            recipient_id:
              discordUserId,
          },
        },
      );

    const channelId =
      String(
        dm?.id ||
        "",
      );

    if (
      !/^[0-9]{17,20}$/.test(
        channelId,
      )
    ) {
      return false;
    }

    await discordBotRequest(
      "/channels/" +
        channelId +
        "/messages",
      {
        method: "POST",
        body: {
          embeds: [
            {
              title:
                "ISTe Bot • Подписка",
              description:
                decision ===
                "approve"
                  ? "✅ Оплата подтверждена. Тариф **" +
                    plan.toUpperCase() +
                    "** активирован" +
                    (
                      expiresAt
                        ? " до " +
                          discordTimestamp(
                            expiresAt,
                          )
                        : ""
                    ) +
                    "."
                  : "❌ Заказ на тариф **" +
                    plan.toUpperCase() +
                    "** отклонён.",
              color:
                decision ===
                "approve"
                  ? 0x2ecc71
                  : 0xe74c3c,
              footer: {
                text:
                  "ISTe Shop • ISTe Bot",
              },
              timestamp:
                new Date()
                  .toISOString(),
            },
          ],
          allowed_mentions: {
            parse: [],
          },
        },
      },
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "subscription decision DM failed",
      error,
    );
    return false;
  }
}

function subscriptionButtons() {
  return [
    {
      type: 1,
      components: (
        Object.entries(
          SUBSCRIPTION_PLANS,
        ) as Array<
          [
            SubscriptionPlan,
            {
              priceUsd: number;
              maxGuilds: number;
            },
          ]
        >
      ).map(
        ([
          plan,
          config,
        ]) => ({
          type: 2,
          style:
            plan === "pro"
              ? 1
              : 2,
          custom_id:
            "iste:subscription:" +
            plan,
          label:
            plan.toUpperCase() +
            " · $" +
            config.priceUsd.toFixed(
              2,
            ),
        }),
      ),
    },
  ];
}

function subscriptionDashboardRow(
  label: string,
) {
  return linkRow([
    {
      label,
      url:
        SITE_URL +
        "/bot/dashboard",
    },
  ]);
}

function subscriptionExpiryText(
  value: unknown,
  t: (typeof copy)[Language],
) {
  if (!value) {
    return t.subscriptionNoExpiry;
  }

  const parsed =
    Date.parse(
      String(value),
    );

  return Number.isFinite(
    parsed,
  )
    ? discordTimestamp(
        parsed,
      )
    : t.subscriptionNoExpiry;
}

async function subscriptionRuntime(
  action:
    | "requests"
    | "decision",
  actorDiscordUserId: string,
  body: Record<
    string,
    unknown
  > = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN missing",
    );
  }

  const response =
    await fetch(
      BOT_PORTAL_URL +
        "?module=bot-portal&action=worker-subscription-" +
        action,
      {
        method: "POST",
        headers: {
          Authorization:
            "Bot " +
            DISCORD_BOT_TOKEN,
          Accept:
            "application/json",
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            actorDiscordUserId,
            ...body,
          }),
      },
    );

  const payload =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    payload?.ok !==
      true
  ) {
    const error =
      new Error(
        payload?.error ||
          "SUBSCRIPTION_RUNTIME_FAILED",
      ) as Error & {
        status?: number;
      };

    error.status =
      response.status;

    throw error;
  }

  return payload;
}

async function readDiscordSubscriptionAccount(
  discordUserId: string,
) {
  if (
    !adminDb ||
    !/^[0-9]{17,20}$/.test(
      discordUserId,
    )
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await adminDb
    .from(
      "discord_customer_accounts",
    )
    .select(
      "user_id,discord_user_id,discord_username,discord_global_name",
    )
    .eq(
      "discord_user_id",
      discordUserId,
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function subscriptionCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const actor =
    getActor(
      interaction,
    );
  const discordUserId =
    String(
      actor?.id ||
      "",
    );

  if (!adminDb) {
    return interactionMessage(
      baseEmbed(
        t.subscriptionTitle,
        t.subscriptionUnavailable,
        t.footer,
      ),
      [],
      true,
    );
  }

  const account =
    await readDiscordSubscriptionAccount(
      discordUserId,
    );

  if (!account) {
    return interactionMessage(
      baseEmbed(
        t.subscriptionTitle,
        t.subscriptionLinkRequired,
        t.footer,
      ),
      subscriptionDashboardRow(
        t.subscriptionOpenDashboard,
      ),
      true,
    );
  }

  const [
    subscriptionResult,
    requestResult,
  ] =
    await Promise.all([
      adminDb
        .from(
          "discord_subscriptions",
        )
        .select(
          "plan,status,expires_at,max_guilds",
        )
        .eq(
          "user_id",
          account.user_id,
        )
        .maybeSingle(),
      adminDb
        .from(
          "discord_subscription_requests",
        )
        .select(
          "id,plan,status,requested_at",
        )
        .eq(
          "user_id",
          account.user_id,
        )
        .eq(
          "status",
          "pending",
        )
        .maybeSingle(),
    ]);

  if (
    subscriptionResult.error ||
    requestResult.error
  ) {
    throw (
      subscriptionResult.error ||
      requestResult.error
    );
  }

  const subscription =
    subscriptionResult.data;
  const pending =
    requestResult.data;

  if (
    subscription?.plan ===
    "internal"
  ) {
    return interactionMessage(
      baseEmbed(
        t.subscriptionTitle,
        t.subscriptionInternal,
        t.footer,
      ),
      subscriptionDashboardRow(
        t.subscriptionOpenDashboard,
      ),
      true,
    );
  }

  const currentPlan =
    String(
      subscription?.plan ||
      t.subscriptionFree,
    ).toUpperCase();

  const lines = [
    "**" +
      t.subscriptionCurrent +
      ":** " +
      currentPlan,
    "**" +
      t.subscriptionStatus +
      ":** " +
      String(
        subscription?.status ||
        "free",
      ).toUpperCase(),
    "**" +
      t.subscriptionExpires +
      ":** " +
      subscriptionExpiryText(
        subscription
          ?.expires_at,
        t,
      ),
  ];

  if (pending) {
    lines.push(
      "**" +
        t.subscriptionPending +
        ":** " +
        String(
          pending.plan,
        ).toUpperCase(),
    );
  }

  lines.push(
    "",
    t.subscriptionChoose,
  );

  return interactionMessage(
    baseEmbed(
      t.subscriptionTitle,
      lines.join("\n"),
      t.footer,
    ),
    subscriptionButtons(),
    true,
  );
}

async function subscriptionsAdminCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const actor =
    getActor(
      interaction,
    );
  const actorDiscordUserId =
    String(
      actor?.id ||
      "",
    );

  try {
    const result =
      await subscriptionRuntime(
        "requests",
        actorDiscordUserId,
      );

    const rows =
      Array.isArray(
        result?.requests,
      )
        ? result.requests
            .slice(0, 5)
        : [];

    if (!rows.length) {
      return interactionMessage(
        baseEmbed(
          t.subscriptionAdminTitle,
          t.subscriptionAdminEmpty,
          t.footer,
        ),
        [],
        true,
      );
    }

    const description =
      rows
        .map(
          (
            row: any,
            index: number,
          ) => {
            const name =
              row
                .discordGlobalName ||
              row
                .discordUsername ||
              row
                .discordUserId ||
              "Discord user";

            return [
              "**" +
                String(
                  index + 1,
                ) +
                ". " +
                escapeMarkdown(
                  name,
                ) +
                "**",
              t.subscriptionAdminRequested +
                ": **" +
                String(
                  row.plan ||
                  "free",
                )
                  .toUpperCase() +
                "**",
              t.subscriptionAdminCurrent +
                ": **" +
                String(
                  row.currentPlan ||
                  "free",
                )
                  .toUpperCase() +
                "**",
              row.requestedAt
                ? discordTimestamp(
                    row.requestedAt,
                  )
                : "",
            ]
              .filter(Boolean)
              .join("\n");
          },
        )
        .join(
          "\n\n",
        );

    const components =
      rows.map(
        (row: any) => ({
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id:
                "iste:subscription-admin:approve:" +
                String(
                  row.id,
                ),
              label:
                t.subscriptionAdminApprove,
            },
            {
              type: 2,
              style: 4,
              custom_id:
                "iste:subscription-admin:reject:" +
                String(
                  row.id,
                ),
              label:
                t.subscriptionAdminReject,
            },
          ],
        }),
      );

    return interactionMessage(
      baseEmbed(
        t.subscriptionAdminTitle,
        description,
        t.footer,
      ),
      components,
      true,
    );
  } catch (error) {
    if (
      (
        error as
          Error & {
            status?: number;
          }
      ).status ===
      403
    ) {
      return ephemeralText(
        t.subscriptionAdminDenied,
      );
    }

    console.error(
      "subscription admin command failed",
      error,
    );

    return ephemeralText(
      t.subscriptionUnavailable,
    );
  }
}

async function handleSubscriptionShopOpenComponent(
  interaction: any,
) {
  const customId =
    String(
      interaction
        ?.data
        ?.custom_id ||
      "",
    );

  if (
    customId !==
    "iste:subscription-shop-open"
  ) {
    return null;
  }

  const lang =
    localeFamily(
      interaction?.locale ||
      interaction
        ?.guild_locale,
    ) as Language;

  return subscriptionCommand(
    interaction,
    lang,
  );
}

async function handleSubscriptionAdminComponent(
  interaction: any,
) {
  const customId =
    String(
      interaction
        ?.data
        ?.custom_id ||
      "",
    );
  const prefix =
    "iste:subscription-admin:";

  if (
    !customId.startsWith(
      prefix,
    )
  ) {
    return null;
  }

  const [
    decision,
    requestId,
  ] =
    customId
      .slice(
        prefix.length,
      )
      .split(
        ":",
        2,
      );

  if (
    ![
      "approve",
      "reject",
    ].includes(
      decision,
    ) ||
    !/^[0-9a-f-]{36}$/i.test(
      requestId ||
      "",
    )
  ) {
    return ephemeralText(
      "Invalid subscription request.",
    );
  }

  const lang =
    localeFamily(
      interaction?.locale ||
      interaction
        ?.guild_locale,
    ) as Language;
  const t =
    copy[lang];
  const actor =
    getActor(
      interaction,
    );
  const actorDiscordUserId =
    String(
      actor?.id ||
      "",
    );

  try {
    let requestRow:
      | {
          discord_user_id?: string;
          plan?: string;
          metadata?: Record<
            string,
            unknown
          >;
        }
      | null = null;

    if (adminDb) {
      const {
        data,
      } = await adminDb
        .from(
          "discord_subscription_requests",
        )
        .select(
          "discord_user_id,plan,metadata",
        )
        .eq(
          "id",
          requestId,
        )
        .maybeSingle();

      requestRow =
        data;
    }

    const result =
      await subscriptionRuntime(
        "decision",
        actorDiscordUserId,
        {
          requestId,
          decision,
        },
      );

    const finalPlan =
      String(
        result?.plan ||
        requestRow?.plan ||
        "",
      )
        .toLowerCase() as
        SubscriptionPlan;
    const targetDiscordUserId =
      String(
        result
          ?.discordUserId ||
        requestRow
          ?.discord_user_id ||
        "",
      );
    const shopChannelId =
      String(
        requestRow
          ?.metadata
          ?.shop_channel_id ||
        "",
      );
    const shopMessageId =
      String(
        requestRow
          ?.metadata
          ?.shop_message_id ||
        "",
      );

    if (
      Object.prototype
        .hasOwnProperty.call(
          SUBSCRIPTION_PLANS,
          finalPlan,
        )
    ) {
      if (
        /^[0-9]{17,20}$/.test(
          shopChannelId,
        ) &&
        /^[0-9]{17,20}$/.test(
          shopMessageId,
        )
      ) {
        try {
          await discordBotRequest(
            "/channels/" +
              shopChannelId +
              "/messages/" +
              shopMessageId,
            {
              method:
                "PATCH",
              body: {
                content:
                  targetDiscordUserId
                    ? "<@" +
                      targetDiscordUserId +
                      ">"
                    : "",
                embeds: [
                  subscriptionShopEmbed(
                    requestId,
                    targetDiscordUserId,
                    finalPlan,
                    decision ===
                      "approve"
                      ? "approved"
                      : "rejected",
                    result
                      ?.expiresAt ||
                      null,
                  ),
                ],
                components: [],
                allowed_mentions: {
                  users:
                    targetDiscordUserId
                      ? [
                          targetDiscordUserId,
                        ]
                      : [],
                  parse: [],
                },
              },
            },
          );
        } catch (
          error
        ) {
          console.error(
            "subscription Shop status update failed",
            error,
          );
        }
      }

      await sendSubscriptionDecisionDm(
        targetDiscordUserId,
        finalPlan,
        decision ===
          "approve"
          ? "approve"
          : "reject",
        result?.expiresAt ||
          null,
      );
    }

    if (
      decision ===
      "approve"
    ) {
      return ephemeralText(
        interpolate(
          t.subscriptionAdminApproved,
          {
            plan:
              String(
                result?.plan ||
                "",
              )
                .toUpperCase(),
            expires:
              result?.expiresAt
                ? discordTimestamp(
                    result.expiresAt,
                  )
                : "—",
          },
        ),
      );
    }

    return ephemeralText(
      interpolate(
        t.subscriptionAdminRejected,
        {
          plan:
            String(
              result?.plan ||
              "",
            )
              .toUpperCase(),
        },
      ),
    );
  } catch (error) {
    if (
      (
        error as
          Error & {
            status?: number;
          }
      ).status ===
      403
    ) {
      return ephemeralText(
        t.subscriptionAdminDenied,
      );
    }

    console.error(
      "subscription admin decision failed",
      error,
    );

    return ephemeralText(
      t.subscriptionUnavailable,
    );
  }
}

async function handleSubscriptionComponent(
  interaction: any,
) {
  const customId =
    String(
      interaction
        ?.data
        ?.custom_id ||
      "",
    );

  if (
    !customId.startsWith(
      "iste:subscription:",
    )
  ) {
    return null;
  }

  const lang =
    localeFamily(
      interaction?.locale ||
      interaction
        ?.guild_locale,
    ) as Language;
  const t =
    copy[lang];
  const plan =
    customId.slice(
      "iste:subscription:"
        .length,
    ) as SubscriptionPlan;

  if (
    !Object.prototype.hasOwnProperty.call(
      SUBSCRIPTION_PLANS,
      plan,
    )
  ) {
    return ephemeralText(
      t.subscriptionUnavailable,
    );
  }

  const actor =
    getActor(
      interaction,
    );
  const discordUserId =
    String(
      actor?.id ||
      "",
    );

  if (!adminDb) {
    return ephemeralText(
      t.subscriptionUnavailable,
    );
  }

  const account =
    await readDiscordSubscriptionAccount(
      discordUserId,
    );

  if (!account) {
    return interactionMessage(
      baseEmbed(
        t.subscriptionTitle,
        t.subscriptionLinkRequired,
        t.footer,
      ),
      subscriptionDashboardRow(
        t.subscriptionOpenDashboard,
      ),
      true,
    );
  }

  const {
    data:
      subscription,
    error:
      subscriptionError,
  } = await adminDb
    .from(
      "discord_subscriptions",
    )
    .select(
      "plan,status,expires_at",
    )
    .eq(
      "user_id",
      account.user_id,
    )
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (
    subscription?.plan ===
    "internal"
  ) {
    return interactionMessage(
      baseEmbed(
        t.subscriptionTitle,
        t.subscriptionInternal,
        t.footer,
      ),
      subscriptionDashboardRow(
        t.subscriptionOpenDashboard,
      ),
      true,
    );
  }

  const {
    data:
      existingRequest,
    error:
      existingError,
  } = await adminDb
    .from(
      "discord_subscription_requests",
    )
    .select("id,metadata")
    .eq(
      "user_id",
      account.user_id,
    )
    .eq(
      "status",
      "pending",
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const now =
    new Date()
      .toISOString();

  const metadata = {
    ...(
      existingRequest
        ?.metadata &&
      typeof existingRequest
        .metadata ===
        "object"
        ? existingRequest
            .metadata
        : {}
    ),
    locale:
      lang,
    guild_id:
      String(
        interaction
          ?.guild_id ||
        "",
      ) ||
      null,
    channel_id:
      String(
        interaction
          ?.channel_id ||
        "",
      ) ||
      null,
    requested_via:
      "discord_button",
    payment_mode:
      "discord_shop",
  };

  let requestId =
    String(
      existingRequest?.id ||
      "",
    );

  if (existingRequest) {
    const {
      error,
    } = await adminDb
      .from(
        "discord_subscription_requests",
      )
      .update({
        plan,
        discord_user_id:
          discordUserId,
        source:
          "discord",
        requested_at:
          now,
        updated_at:
          now,
        metadata,
      })
      .eq(
        "id",
        existingRequest.id,
      )
      .eq(
        "status",
        "pending",
      );

    if (error) {
      throw error;
    }
  } else {
    const {
      data:
        insertedRequest,
      error,
    } = await adminDb
      .from(
        "discord_subscription_requests",
      )
      .insert({
        user_id:
          account.user_id,
        discord_user_id:
          discordUserId,
        plan,
        status:
          "pending",
        source:
          "discord",
        requested_at:
          now,
        updated_at:
          now,
        metadata,
      })
      .select(
        "id,metadata",
      )
      .single();

    if (!error) {
      requestId =
        String(
          insertedRequest?.id ||
          "",
        );
    }

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        const {
          error:
            retryError,
        } = await adminDb
          .from(
            "discord_subscription_requests",
          )
          .update({
            plan,
            discord_user_id:
              discordUserId,
            requested_at:
              now,
            updated_at:
              now,
            metadata,
          })
          .eq(
            "user_id",
            account.user_id,
          )
          .eq(
            "status",
            "pending",
          );

        if (retryError) {
          throw retryError;
        }

        const {
          data:
            retryRequest,
          error:
            retryFetchError,
        } = await adminDb
          .from(
            "discord_subscription_requests",
          )
          .select(
            "id,metadata",
          )
          .eq(
            "user_id",
            account.user_id,
          )
          .eq(
            "status",
            "pending",
          )
          .maybeSingle();

        if (
          retryFetchError ||
          !retryRequest
        ) {
          throw (
            retryFetchError ||
            new Error(
              "SUBSCRIPTION_REQUEST_MISSING",
            )
          );
        }

        requestId =
          String(
            retryRequest.id,
          );
      } else {
        throw error;
      }
    }
  }

  if (!requestId) {
    throw new Error(
      "SUBSCRIPTION_REQUEST_ID_MISSING",
    );
  }

  const shopOrder =
    await upsertSubscriptionShopOrder(
      requestId,
      discordUserId,
      plan,
      metadata,
    );

  const finalMetadata = {
    ...metadata,
    shop_guild_id:
      shopOrder.guildId,
    shop_channel_id:
      shopOrder.channelId,
    shop_message_id:
      shopOrder.messageId,
  };

  const {
    error:
      metadataUpdateError,
  } = await adminDb
    .from(
      "discord_subscription_requests",
    )
    .update({
      metadata:
        finalMetadata,
      updated_at:
        now,
    })
    .eq(
      "id",
      requestId,
    )
    .eq(
      "status",
      "pending",
    );

  if (metadataUpdateError) {
    throw metadataUpdateError;
  }

  return interactionMessage(
    baseEmbed(
      t.subscriptionTitle,
      interpolate(
        t.subscriptionRequested,
        {
          plan:
            plan.toUpperCase(),
        },
      ),
      t.footer,
    ),
    [
      ...subscriptionButtons(),
      ...linkRow([
        {
          label:
            t.subscriptionOpenShop,
          url:
            shopOrder.url,
        },
      ]),
    ],
    true,
  );
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
  }: {
    method?: string;
    body?: unknown;
    reason?: string;
  } = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN missing");
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
      { status: response.status, details: payload },
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

function memberHasRole(
  interaction: any,
  roleId: string,
) {
  if (!roleId) return false;

  const roles =
    Array.isArray(
      interaction?.member?.roles,
    )
      ? interaction.member.roles.map(
          (role: unknown) =>
            String(role),
        )
      : [];

  return roles.includes(roleId);
}

async function loadModerationSettings(
  guildId: string,
) {
  const fallback = {
    enabled: true,
    clearEnabled: true,
    timeoutEnabled: true,
    adminRoleId: "",
    moderatorRoleId: "",
    logChannelId: "",
  };

  if (!adminDb || !guildId) {
    return fallback;
  }

  try {
    const {
      data,
      error,
    } = await adminDb
      .from(
        "discord_guild_settings",
      )
      .select(
        "moderation_enabled, admin_role_id, moderator_role_id, log_channel_id, config",
      )
      .eq(
        "guild_id",
        guildId,
      )
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    const config =
      data.config &&
      typeof data.config ===
        "object"
        ? data.config
        : {};

    return {
      enabled:
        data
          .moderation_enabled ===
        true,
      clearEnabled:
        config
          .moderationClearEnabled !==
        false,
      timeoutEnabled:
        config
          .moderationTimeoutEnabled !==
        false,
      adminRoleId:
        String(
          data.admin_role_id ||
          "",
        ),
      moderatorRoleId:
        String(
          data.moderator_role_id ||
          "",
        ),
      logChannelId:
        String(
          data.log_channel_id ||
          "",
        ),
    };
  } catch (error) {
    console.error(
      "moderation settings load failed",
      error,
    );

    return fallback;
  }
}

function moderationActorAllowed(
  interaction: any,
  settings: {
    adminRoleId: string;
    moderatorRoleId: string;
  },
  nativePermission: bigint,
) {
  return (
    hasPermission(
      interaction?.member
        ?.permissions,
      nativePermission,
    ) ||
    memberHasRole(
      interaction,
      settings.adminRoleId,
    ) ||
    memberHasRole(
      interaction,
      settings.moderatorRoleId,
    )
  );
}

async function sendModerationLog(
  settings: {
    logChannelId: string;
  },
  {
    title,
    actorId,
    targetId = "",
    channelId = "",
    details = "",
  }: {
    title: string;
    actorId: string;
    targetId?: string;
    channelId?: string;
    details?: string;
  },
) {
  if (!settings.logChannelId) {
    return;
  }

  const fields = [
    {
      name: "Moderator",
      value:
        actorId
          ? `<@${actorId}>`
          : "—",
      inline: true,
    },
  ];

  if (targetId) {
    fields.push({
      name: "Target",
      value:
        `<@${targetId}>`,
      inline: true,
    });
  }

  if (channelId) {
    fields.push({
      name: "Channel",
      value:
        `<#${channelId}>`,
      inline: true,
    });
  }

  if (details) {
    fields.push({
      name: "Details",
      value:
        details.slice(
          0,
          1024,
        ),
      inline: false,
    });
  }

  try {
    await discordApi(
      `/channels/${settings.logChannelId}/messages`,
      {
        method: "POST",
        body: {
          embeds: [
            {
              title,
              color:
                BRAND_COLOR,
              fields,
              footer: {
                text:
                  "ISTe Moderation",
              },
              timestamp:
                new Date()
                  .toISOString(),
            },
          ],
          allowed_mentions: {
            parse: [],
          },
        },
      },
    );
  } catch (error) {
    console.error(
      "moderation log send failed",
      error,
    );
  }
}

function moderationDisplayName(
  target: any,
) {
  return String(
    target?.member?.nick ||
      target?.user?.global_name ||
      target?.user?.username ||
      target?.global_name ||
      target?.username ||
      "",
  ).slice(0, 100);
}

async function createModerationCase({
  guildId,
  targetUserId,
  moderatorUserId,
  action,
  reason = "",
  durationMinutes = null,
  status = "completed",
  relatedCaseId = null,
  metadata = {},
}: {
  guildId: string;
  targetUserId: string;
  moderatorUserId: string;
  action:
    | "warn"
    | "unwarn"
    | "timeout"
    | "kick"
    | "ban"
    | "unban";
  reason?: string;
  durationMinutes?: number | null;
  status?: "active" | "completed" | "revoked";
  relatedCaseId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  if (!adminDb) {
    throw new Error(
      "Moderation database unavailable",
    );
  }

  const {
    data,
    error,
  } = await adminDb
    .from(
      "discord_moderation_cases",
    )
    .insert({
      guild_id:
        guildId,
      target_user_id:
        targetUserId,
      moderator_user_id:
        moderatorUserId,
      action,
      reason:
        reason
          .trim()
          .slice(0, 256),
      duration_minutes:
        durationMinutes,
      status,
      related_case_id:
        relatedCaseId,
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function moderationAccess(
  interaction: any,
  lang: Language,
  memberPermission: bigint,
  botPermission: bigint | null = null,
) {
  const t =
    copy[lang];
  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );
  const settings =
    await loadModerationSettings(
      guildId,
    );

  if (!settings.enabled) {
    return {
      response:
        ephemeralText(
          t.moderationDisabled,
        ),
    };
  }

  if (
    !moderationActorAllowed(
      interaction,
      settings,
      memberPermission,
    )
  ) {
    return {
      response:
        ephemeralText(
          t.moderatorRoleRequired,
        ),
    };
  }

  if (
    botPermission &&
    !hasPermission(
      interaction
        ?.app_permissions,
      botPermission,
    )
  ) {
    return {
      response:
        ephemeralText(
          t.moderationBotPermission,
        ),
    };
  }

  return {
    response: null,
    guildId,
    settings,
    actor:
      getActor(
        interaction,
      ),
    options:
      getOptions(
        interaction,
      ),
  };
}

async function warnCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .MODERATE_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  const target =
    getResolvedUser(
      interaction,
    );
  const actorId =
    String(
      access.actor?.id ||
      "",
    );
  const reason =
    String(
      access.options?.reason ||
      "",
    )
      .trim()
      .slice(0, 256);

  if (!target?.id) {
    return ephemeralText(
      t.genericError,
    );
  }

  if (
    target.id ===
    actorId
  ) {
    return ephemeralText(
      t.moderationInvalidTarget,
    );
  }

  const moderationCase =
    await createModerationCase({
      guildId:
        access.guildId,
      targetUserId:
        target.id,
      moderatorUserId:
        actorId,
      action: "warn",
      reason,
      status: "active",
      metadata: {
        target_name:
          moderationDisplayName(
            target,
          ),
        moderator_name:
          moderationDisplayName(
            access.actor,
          ),
      },
    });

  await writeAudit(
    access.guildId,
    "command.warn",
    {
      case_id:
        moderationCase.id,
      actor_id:
        actorId,
      target_id:
        target.id,
      reason:
        reason || null,
    },
  );

  await sendModerationLog(
    access.settings,
    {
      title:
        `⚠️ /warn • Case #${moderationCase.id}`,
      actorId,
      targetId:
        target.id,
      details:
        reason ||
        "No reason",
    },
  );

  return ephemeralText(
    interpolate(
      t.warnDone,
      {
        caseId:
          moderationCase.id,
        userId:
          target.id,
      },
    ),
  );
}

async function warningsCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .MODERATE_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  const target =
    getResolvedUser(
      interaction,
    );

  if (
    !target?.id ||
    !adminDb
  ) {
    return ephemeralText(
      t.genericError,
    );
  }

  const {
    data,
    error,
  } = await adminDb
    .from(
      "discord_moderation_cases",
    )
    .select(
      "id, reason, created_at",
    )
    .eq(
      "guild_id",
      access.guildId,
    )
    .eq(
      "target_user_id",
      target.id,
    )
    .eq(
      "action",
      "warn",
    )
    .eq(
      "status",
      "active",
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      },
    )
    .limit(10);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return ephemeralText(
      interpolate(
        t.warningsNone,
        {
          userId:
            target.id,
        },
      ),
    );
  }

  const lines =
    data.map(
      (item: any) =>
        `**#${item.id}** · ${new Date(item.created_at).toISOString().slice(0, 10)} · ${String(item.reason || "No reason").slice(0, 120)}`,
    );

  return ephemeralText(
    `⚠️ <@${target.id}> · **${data.length}**\n${lines.join("\n")}`
      .slice(
        0,
        1950,
      ),
  );
}

async function unwarnCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .MODERATE_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  if (!adminDb) {
    return ephemeralText(
      t.genericError,
    );
  }

  const caseId =
    Number(
      access.options?.case ||
      0,
    );
  const reason =
    String(
      access.options?.reason ||
      "",
    )
      .trim()
      .slice(0, 256);

  const {
    data:
      original,
    error,
  } = await adminDb
    .from(
      "discord_moderation_cases",
    )
    .select("*")
    .eq(
      "id",
      caseId,
    )
    .eq(
      "guild_id",
      access.guildId,
    )
    .eq(
      "action",
      "warn",
    )
    .eq(
      "status",
      "active",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!original) {
    return ephemeralText(
      t.unwarnMissing,
    );
  }

  const now =
    new Date()
      .toISOString();

  const {
    error:
      revokeError,
  } = await adminDb
    .from(
      "discord_moderation_cases",
    )
    .update({
      status:
        "revoked",
      revoked_at:
        now,
      updated_at:
        now,
    })
    .eq(
      "id",
      original.id,
    );

  if (revokeError) {
    throw revokeError;
  }

  const actorId =
    String(
      access.actor?.id ||
      "",
    );

  const revokeCase =
    await createModerationCase({
      guildId:
        access.guildId,
      targetUserId:
        String(
          original
            .target_user_id,
        ),
      moderatorUserId:
        actorId,
      action:
        "unwarn",
      reason,
      status:
        "completed",
      relatedCaseId:
        Number(
          original.id,
        ),
      metadata: {
        target_name:
          original
            .metadata
            ?.target_name ||
          "",
        moderator_name:
          moderationDisplayName(
            access.actor,
          ),
      },
    });

  await writeAudit(
    access.guildId,
    "command.unwarn",
    {
      case_id:
        revokeCase.id,
      related_case_id:
        original.id,
      actor_id:
        actorId,
      target_id:
        original
          .target_user_id,
      reason:
        reason || null,
    },
  );

  await sendModerationLog(
    access.settings,
    {
      title:
        `✅ /unwarn • Case #${original.id}`,
      actorId,
      targetId:
        String(
          original
            .target_user_id,
        ),
      details:
        reason ||
        "Warning revoked",
    },
  );

  return ephemeralText(
    interpolate(
      t.unwarnDone,
      {
        caseId:
          original.id,
      },
    ),
  );
}

async function kickCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .KICK_MEMBERS,
      PERMISSIONS
        .KICK_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  const target =
    getResolvedUser(
      interaction,
    );
  const actorId =
    String(
      access.actor?.id ||
      "",
    );
  const reason =
    String(
      access.options?.reason ||
      "",
    )
      .trim()
      .slice(0, 256);

  if (!target?.id) {
    return ephemeralText(
      t.genericError,
    );
  }

  if (
    target.id ===
    actorId
  ) {
    return ephemeralText(
      t.moderationInvalidTarget,
    );
  }

  try {
    await discordApi(
      `/guilds/${access.guildId}/members/${target.id}`,
      {
        method:
          "DELETE",
        reason:
          reason ||
          `ISTe /kick by ${access.actor?.username || actorId}`,
      },
    );

    const moderationCase =
      await createModerationCase({
        guildId:
          access.guildId,
        targetUserId:
          target.id,
        moderatorUserId:
          actorId,
        action: "kick",
        reason,
        metadata: {
          target_name:
            moderationDisplayName(
              target,
            ),
          moderator_name:
            moderationDisplayName(
              access.actor,
            ),
        },
      });

    await writeAudit(
      access.guildId,
      "command.kick",
      {
        case_id:
          moderationCase.id,
        actor_id:
          actorId,
        target_id:
          target.id,
        reason:
          reason || null,
      },
    );

    await sendModerationLog(
      access.settings,
      {
        title:
          `👢 /kick • Case #${moderationCase.id}`,
        actorId,
        targetId:
          target.id,
        details:
          reason ||
          "No reason",
      },
    );

    return ephemeralText(
      interpolate(
        t.kickDone,
        {
          caseId:
            moderationCase.id,
          userId:
            target.id,
        },
      ),
    );
  } catch (error) {
    console.error(
      "kick command failed",
      error,
    );

    return ephemeralText(
      t.kickFailed,
    );
  }
}

async function banCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .BAN_MEMBERS,
      PERMISSIONS
        .BAN_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  const target =
    getResolvedUser(
      interaction,
    );
  const actorId =
    String(
      access.actor?.id ||
      "",
    );
  const reason =
    String(
      access.options?.reason ||
      "",
    )
      .trim()
      .slice(0, 256);
  const deleteDays =
    Math.max(
      0,
      Math.min(
        7,
        Number(
          access.options
            ?.delete_days ||
          0,
        ) ||
        0,
      ),
    );

  if (!target?.id) {
    return ephemeralText(
      t.genericError,
    );
  }

  if (
    target.id ===
    actorId
  ) {
    return ephemeralText(
      t.moderationInvalidTarget,
    );
  }

  try {
    await discordApi(
      `/guilds/${access.guildId}/bans/${target.id}`,
      {
        method:
          "PUT",
        body: {
          delete_message_seconds:
            deleteDays *
            86400,
        },
        reason:
          reason ||
          `ISTe /ban by ${access.actor?.username || actorId}`,
      },
    );

    const moderationCase =
      await createModerationCase({
        guildId:
          access.guildId,
        targetUserId:
          target.id,
        moderatorUserId:
          actorId,
        action: "ban",
        reason,
        metadata: {
          target_name:
            moderationDisplayName(
              target,
            ),
          moderator_name:
            moderationDisplayName(
              access.actor,
            ),
          delete_days:
            deleteDays,
        },
      });

    await writeAudit(
      access.guildId,
      "command.ban",
      {
        case_id:
          moderationCase.id,
        actor_id:
          actorId,
        target_id:
          target.id,
        reason:
          reason || null,
        delete_days:
          deleteDays,
      },
    );

    await sendModerationLog(
      access.settings,
      {
        title:
          `🔨 /ban • Case #${moderationCase.id}`,
        actorId,
        targetId:
          target.id,
        details:
          [
            reason ||
              "No reason",
            deleteDays
              ? `Deleted history: ${deleteDays} day(s)`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
      },
    );

    return ephemeralText(
      interpolate(
        t.banDone,
        {
          caseId:
            moderationCase.id,
          userId:
            target.id,
        },
      ),
    );
  } catch (error) {
    console.error(
      "ban command failed",
      error,
    );

    return ephemeralText(
      t.banFailed,
    );
  }
}

async function unbanCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .BAN_MEMBERS,
      PERMISSIONS
        .BAN_MEMBERS,
    );

  if (access.response) {
    return access.response;
  }

  const userId =
    String(
      access.options
        ?.user_id ||
      "",
    ).trim();
  const reason =
    String(
      access.options?.reason ||
      "",
    )
      .trim()
      .slice(0, 256);

  if (
    !/^\d{17,20}$/.test(
      userId,
    )
  ) {
    return ephemeralText(
      t.invalidUserId,
    );
  }

  try {
    const user =
      await discordApi(
        `/users/${userId}`,
      ).catch(
        () => null,
      );

    await discordApi(
      `/guilds/${access.guildId}/bans/${userId}`,
      {
        method:
          "DELETE",
        reason:
          reason ||
          `ISTe /unban by ${access.actor?.username || access.actor?.id || "moderator"}`,
      },
    );

    const actorId =
      String(
        access.actor?.id ||
        "",
      );

    const moderationCase =
      await createModerationCase({
        guildId:
          access.guildId,
        targetUserId:
          userId,
        moderatorUserId:
          actorId,
        action: "unban",
        reason,
        metadata: {
          target_name:
            moderationDisplayName(
              user,
            ),
          moderator_name:
            moderationDisplayName(
              access.actor,
            ),
        },
      });

    await writeAudit(
      access.guildId,
      "command.unban",
      {
        case_id:
          moderationCase.id,
        actor_id:
          actorId,
        target_id:
          userId,
        reason:
          reason || null,
      },
    );

    await sendModerationLog(
      access.settings,
      {
        title:
          `🔓 /unban • Case #${moderationCase.id}`,
        actorId,
        targetId:
          userId,
        details:
          reason ||
          "No reason",
      },
    );

    return ephemeralText(
      interpolate(
        t.unbanDone,
        {
          caseId:
            moderationCase.id,
          userId,
        },
      ),
    );
  } catch (error) {
    console.error(
      "unban command failed",
      error,
    );

    return ephemeralText(
      t.unbanFailed,
    );
  }
}

async function slowmodeCommand(
  interaction: any,
  lang: Language,
) {
  const t =
    copy[lang];
  const access =
    await moderationAccess(
      interaction,
      lang,
      PERMISSIONS
        .MANAGE_CHANNELS,
      PERMISSIONS
        .MANAGE_CHANNELS,
    );

  if (access.response) {
    return access.response;
  }

  const seconds =
    Math.max(
      0,
      Math.min(
        21600,
        Number(
          access.options
            ?.seconds ||
          0,
        ) ||
        0,
      ),
    );
  const channelId =
    String(
      access.options
        ?.channel ||
      interaction?.channel_id ||
      "",
    );

  if (!channelId) {
    return ephemeralText(
      t.slowmodeFailed,
    );
  }

  try {
    await discordApi(
      `/channels/${channelId}`,
      {
        method:
          "PATCH",
        body: {
          rate_limit_per_user:
            seconds,
        },
        reason:
          `ISTe /slowmode by ${access.actor?.username || access.actor?.id || "moderator"}`,
      },
    );

    const actorId =
      String(
        access.actor?.id ||
        "",
      );

    await writeAudit(
      access.guildId,
      "command.slowmode",
      {
        actor_id:
          actorId,
        channel_id:
          channelId,
        seconds,
      },
    );

    await sendModerationLog(
      access.settings,
      {
        title:
          "🐢 /slowmode",
        actorId,
        channelId,
        details:
          `Delay: ${seconds}s`,
      },
    );

    return ephemeralText(
      interpolate(
        t.slowmodeDone,
        {
          channelId,
          seconds,
        },
      ),
    );
  } catch (error) {
    console.error(
      "slowmode command failed",
      error,
    );

    return ephemeralText(
      t.slowmodeFailed,
    );
  }
}

async function rememberGuild(interaction: any) {
  const guildInstallOwner =
    interaction?.authorizing_integration_owners?.["0"];

  if (!adminDb || !interaction?.guild_id || !guildInstallOwner) return;

  try {
    const guildName = String(interaction?.guild?.name || "").slice(0, 120);
    const now = new Date().toISOString();

    await adminDb.from("discord_guilds").upsert(
      {
        guild_id: String(interaction.guild_id),
        ...(guildName ? { guild_name: guildName } : {}),
        active: true,
        locale: localeFamily(
          interaction.guild_locale || interaction.locale,
        ),
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
    const roster = Array.isArray(data?.roster)
      ? data.roster.slice(0, 7)
      : [];

    const lines = roster.map((player: any) => {
      const captain = player?.captain ? " 👑" : "";
      const role = player?.role
        ? ` • ${escapeMarkdown(player.role)}`
        : "";
      const level = Number.isFinite(player?.level)
        ? ` • LVL ${player.level}`
        : "";

      return `**${escapeMarkdown(player?.nickname || "Player")}**${captain}${role}${level}`;
    });

    return interactionMessage(
      baseEmbed(
        t.teamTitle,
        lines.length ? lines.join("\n") : t.noData,
        t.footer,
      ),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/team` }]),
    );
  } catch (error) {
    console.error("team command failed", error);
    return interactionMessage(
      baseEmbed(t.teamTitle, t.noData, t.footer),
    );
  }
}

async function matchesCommand(lang: Language) {
  const t = copy[lang];

  try {
    const data = await loadFaceit();
    const matches = Array.isArray(data?.teamMatches)
      ? data.teamMatches.slice(0, 3)
      : [];

    const lines = matches.map((match: any) => {
      const own = match?.ownTeam || {};
      const opponent = match?.opponent || {};
      const score =
        Number.isFinite(own?.score) &&
        Number.isFinite(opponent?.score)
          ? `${own.score}:${opponent.score}`
          : "—";

      const mark =
        match?.result === "win"
          ? "✅"
          : match?.result === "loss"
            ? "❌"
            : "•";

      return `${mark} **ISTesport ${score} ${escapeMarkdown(
        opponent?.name || "Opponent",
      )}**`;
    });

    return interactionMessage(
      baseEmbed(
        t.matchesTitle,
        lines.length ? lines.join("\n") : t.noData,
        t.footer,
      ),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/matches` }]),
    );
  } catch (error) {
    console.error("matches command failed", error);
    return interactionMessage(
      baseEmbed(t.matchesTitle, t.noData, t.footer),
    );
  }
}

async function newsCommand(lang: Language) {
  const t = copy[lang];

  if (!publicDb) {
    return interactionMessage(
      baseEmbed(t.newsTitle, t.noData, t.footer),
    );
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
      const title = escapeMarkdown(post?.title || "ISTesport News");
      const slug = encodeURIComponent(String(post?.slug || ""));

      return `• **[${title}](${SITE_URL}/news${slug ? `?article=${slug}` : ""})**`;
    });

    return interactionMessage(
      baseEmbed(
        t.newsTitle,
        lines.length ? lines.join("\n") : t.noData,
        t.footer,
      ),
      linkRow([{ label: t.openSite, url: `${SITE_URL}/news` }]),
    );
  } catch (error) {
    console.error("news command failed", error);
    return interactionMessage(
      baseEmbed(t.newsTitle, t.noData, t.footer),
    );
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

      memberCount = Number.isFinite(data?.member_count)
        ? data.member_count
        : null;
    } catch {
      memberCount = null;
    }
  }

  const title = guild?.name
    ? escapeMarkdown(guild.name)
    : t.serverTitle;

  const embed: Record<string, unknown> = {
    ...baseEmbed(title, t.serverTitle, t.footer),
    fields: [
      { name: t.serverId, value: guildId || "—", inline: true },
      {
        name: t.serverCreated,
        value: guildId
          ? discordTimestamp(snowflakeTimestamp(guildId))
          : "—",
        inline: true,
      },
      {
        name: t.serverLocale,
        value: String(
          interaction?.guild_locale || guild?.locale || "—",
        ),
        inline: true,
      },
      {
        name: t.serverMembers,
        value:
          memberCount == null ? "—" : String(memberCount),
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
  const targetMember =
    resolved?.member ||
    (!resolved ? interaction?.member : null);

  if (!targetUser) return ephemeralText(t.genericError);

  const displayName =
    targetMember?.nick ||
    targetUser?.global_name ||
    targetUser?.username ||
    targetUser.id;

  const avatar = avatarUrl(targetUser, 512);

  const fields: Array<Record<string, unknown>> = [
    {
      name: t.userId,
      value: String(targetUser.id),
      inline: true,
    },
    {
      name: t.userCreated,
      value: discordTimestamp(
        snowflakeTimestamp(targetUser.id),
      ),
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
    ...baseEmbed(
      escapeMarkdown(displayName),
      t.userTitle,
      t.footer,
    ),
    fields,
  };

  if (avatar) {
    embed.thumbnail = { url: avatar };
  }

  return interactionMessage(embed);
}

function avatarCommand(interaction: any, lang: Language) {
  const t = copy[lang];
  const resolved = getResolvedUser(interaction);
  const targetUser = resolved?.user || getActor(interaction);

  if (!targetUser) return ephemeralText(t.avatarMissing);

  const url = avatarUrl(targetUser, 1024);
  if (!url) return ephemeralText(t.avatarMissing);

  const name =
    targetUser?.global_name ||
    targetUser?.username ||
    targetUser.id;

  const embed: Record<string, unknown> = {
    ...baseEmbed(
      interpolate(t.avatarTitle, {
        name: escapeMarkdown(name),
      }),
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
      { name: t.botCommands, value: "19", inline: true },
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

  if (
    !hasPermission(
      interaction?.app_permissions,
      PERMISSIONS.SEND_POLLS,
    )
  ) {
    return ephemeralText(t.pollPermission);
  }

  const options = getOptions(interaction);
  const question = String(options.question || "")
    .trim()
    .slice(0, 300);

  const answers = [
    options.option1,
    options.option2,
    options.option3,
    options.option4,
    options.option5,
  ]
    .map((value) =>
      String(value || "").trim().slice(0, 55),
    )
    .filter(Boolean);

  if (!question || answers.length < 2) {
    return ephemeralText(t.pollInvalid);
  }

  const hours = Math.min(
    768,
    Math.max(1, Number(options.hours || 24)),
  );

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
  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );

  const moderation =
    await loadModerationSettings(
      guildId,
    );

  if (!moderation.enabled) {
    return ephemeralText(
      t.moderationDisabled,
    );
  }

  if (!moderation.clearEnabled) {
    return ephemeralText(
      t.clearDisabled,
    );
  }

  if (
    !moderationActorAllowed(
      interaction,
      moderation,
      PERMISSIONS.MANAGE_MESSAGES,
    )
  ) {
    return ephemeralText(
      moderation
          .adminRoleId ||
        moderation
          .moderatorRoleId
        ? t.moderatorRoleRequired
        : t.clearPermission,
    );
  }

  if (
    !hasPermission(
      interaction?.app_permissions,
      PERMISSIONS.MANAGE_MESSAGES,
    )
  ) {
    return ephemeralText(t.clearBotPermission);
  }

  const channelId = String(interaction?.channel_id || "");
  const actor = getActor(interaction);
  const options = getOptions(interaction);
  const amount = Math.min(
    100,
    Math.max(1, Number(options.amount || 1)),
  );

  if (!channelId || !guildId) {
    return ephemeralText(t.clearFailed);
  }

  try {
    const messages = await discordApi(
      `/channels/${channelId}/messages?limit=${amount}`,
    );

    const cutoff =
      Date.now() - 14 * 24 * 60 * 60 * 1000;

    const ids = (Array.isArray(messages) ? messages : [])
      .filter((message: any) => {
        const timestamp = Date.parse(
          String(message?.timestamp || ""),
        );

        return (
          Number.isFinite(timestamp) &&
          timestamp > cutoff
        );
      })
      .map((message: any) => String(message.id))
      .slice(0, amount);

    if (!ids.length) {
      return ephemeralText(t.clearNothing);
    }

    if (ids.length === 1) {
      await discordApi(
        `/channels/${channelId}/messages/${ids[0]}`,
        { method: "DELETE" },
      );
    } else {
      await discordApi(
        `/channels/${channelId}/messages/bulk-delete`,
        {
          method: "POST",
          body: { messages: ids },
        },
      );
    }

    await writeAudit(guildId, "command.clear", {
      actor_id: actor?.id || null,
      channel_id: channelId,
      amount: ids.length,
    });

    await sendModerationLog(
      moderation,
      {
        title:
          "🧹 /clear",
        actorId:
          String(
            actor?.id ||
            "",
          ),
        channelId,
        details:
          `Deleted messages: ${ids.length}`,
      },
    );

    return ephemeralText(
      interpolate(t.clearDone, { count: ids.length }),
    );
  } catch (error) {
    console.error("clear command failed", error);
    return ephemeralText(t.clearFailed);
  }
}

async function timeoutCommand(
  interaction: any,
  lang: Language,
) {
  const t = copy[lang];
  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );

  const moderation =
    await loadModerationSettings(
      guildId,
    );

  if (!moderation.enabled) {
    return ephemeralText(
      t.moderationDisabled,
    );
  }

  if (
    !moderation
      .timeoutEnabled
  ) {
    return ephemeralText(
      t.timeoutDisabled,
    );
  }

  if (
    !moderationActorAllowed(
      interaction,
      moderation,
      PERMISSIONS.MODERATE_MEMBERS,
    )
  ) {
    return ephemeralText(
      moderation
          .adminRoleId ||
        moderation
          .moderatorRoleId
        ? t.moderatorRoleRequired
        : t.timeoutPermission,
    );
  }

  if (
    !hasPermission(
      interaction?.app_permissions,
      PERMISSIONS.MODERATE_MEMBERS,
    )
  ) {
    return ephemeralText(t.timeoutBotPermission);
  }
  const actor = getActor(interaction);
  const target = getResolvedUser(interaction);
  const options = getOptions(interaction);

  const minutes = Math.min(
    40320,
    Math.max(1, Number(options.minutes || 1)),
  );

  const reason = String(options.reason || "")
    .trim()
    .slice(0, 256);

  if (!guildId || !target?.id) {
    return ephemeralText(t.timeoutFailed);
  }

  if (String(actor?.id || "") === target.id) {
    return ephemeralText(t.timeoutSelf);
  }

  const until = new Date(
    Date.now() + minutes * 60 * 1000,
  ).toISOString();

  try {
    await discordApi(
      `/guilds/${guildId}/members/${target.id}`,
      {
        method: "PATCH",
        body: {
          communication_disabled_until: until,
        },
        reason:
          reason ||
          `ISTe Bot /timeout by ${
            actor?.username ||
            actor?.id ||
            "moderator"
          }`,
      },
    );

    await writeAudit(guildId, "command.timeout", {
      actor_id: actor?.id || null,
      target_id: target.id,
      minutes,
      reason: reason || null,
    });

    const timeoutCase =
      await createModerationCase({
        guildId,
        targetUserId:
          target.id,
        moderatorUserId:
          String(
            actor?.id ||
            "",
          ),
        action:
          "timeout",
        reason,
        durationMinutes:
          minutes,
        metadata: {
          target_name:
            moderationDisplayName(
              target,
            ),
          moderator_name:
            moderationDisplayName(
              actor,
            ),
        },
      });

    await writeAudit(
      guildId,
      "moderation.case",
      {
        case_id:
          timeoutCase.id,
        action:
          "timeout",
        target_id:
          target.id,
      },
    );

    await sendModerationLog(
      moderation,
      {
        title:
          "⏱️ /timeout",
        actorId:
          String(
            actor?.id ||
            "",
          ),
        targetId:
          target.id,
        details:
          [
            `Duration: ${minutes} min`,
            reason
              ? `Reason: ${reason}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
      },
    );

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


type CommandPolicyResult = {
  allowed: boolean;
  reason?: string;
  retrySeconds?: number;
};

function commandPolicyText(
  interaction: any,
  reason = "",
  retrySeconds = 0,
) {
  const lang =
    localeFamily(
      interaction?.locale ||
      interaction?.guild_locale,
    );

  const messages = {
    uk: {
      disabled:
        "Цю команду вимкнено на цьому Discord-сервері.",
      channel:
        "Ця команда недоступна в цьому каналі.",
      role:
        "Для цієї команди потрібна дозволена роль.",
      cooldown:
        "Команда на cooldown. Спробуй ще раз через {{seconds}} с.",
    },
    ru: {
      disabled:
        "Эта команда отключена на этом Discord-сервере.",
      channel:
        "Эта команда недоступна в этом канале.",
      role:
        "Для этой команды нужна разрешённая роль.",
      cooldown:
        "Команда на cooldown. Попробуй снова через {{seconds}} с.",
    },
    en: {
      disabled:
        "This command is disabled on this Discord server.",
      channel:
        "This command is not available in this channel.",
      role:
        "You need an allowed role to use this command.",
      cooldown:
        "This command is on cooldown. Try again in {{seconds}}s.",
    },
  } as const;

  const family =
    lang === "uk"
      ? "uk"
      : lang === "ru"
        ? "ru"
        : "en";

  return interpolate(
    messages[family][
      reason as
        keyof typeof messages.uk
    ] ||
      messages[family]
        .disabled,
    {
      seconds:
        Math.max(
          1,
          Math.ceil(
            retrySeconds,
          ),
        ),
    },
  );
}

async function loadCommandPolicy(
  interaction: any,
  command: string,
): Promise<CommandPolicyResult> {
  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );

  if (
    !adminDb ||
    !guildId ||
    !command
  ) {
    return {
      allowed: true,
    };
  }

  try {
    const {
      data:
        policy,
      error,
    } = await adminDb
      .from(
        "discord_command_settings",
      )
      .select(
        "enabled,allowed_role_ids,allowed_channel_ids,cooldown_seconds",
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "command_name",
        command,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!policy) {
      return {
        allowed: true,
      };
    }

    if (
      policy.enabled ===
      false
    ) {
      return {
        allowed: false,
        reason:
          "disabled",
      };
    }

    const allowedChannels =
      Array.isArray(
        policy
          .allowed_channel_ids,
      )
        ? policy
            .allowed_channel_ids
            .map(
              (
                value:
                  unknown,
              ) =>
                String(value),
            )
            .filter(Boolean)
        : [];

    if (
      allowedChannels.length &&
      !allowedChannels.includes(
        String(
          interaction
            ?.channel_id ||
          "",
        ),
      )
    ) {
      return {
        allowed: false,
        reason:
          "channel",
      };
    }

    const allowedRoles =
      Array.isArray(
        policy
          .allowed_role_ids,
      )
        ? policy
            .allowed_role_ids
            .map(
              (
                value:
                  unknown,
              ) =>
                String(value),
            )
            .filter(Boolean)
        : [];

    if (allowedRoles.length) {
      const memberRoles =
        Array.isArray(
          interaction
            ?.member
            ?.roles,
        )
          ? interaction
              .member
              .roles
              .map(
                (
                  value:
                    unknown,
                ) =>
                  String(value),
              )
          : [];

      const matchesRole =
        allowedRoles.some(
          (roleId) =>
            memberRoles.includes(
              roleId,
            ),
        );

      if (!matchesRole) {
        return {
          allowed: false,
          reason:
            "role",
        };
      }
    }

    const cooldownSeconds =
      Math.max(
        0,
        Math.min(
          86400,
          Math.round(
            Number(
              policy
                .cooldown_seconds ||
              0,
            ) ||
            0,
          ),
        ),
      );

    if (cooldownSeconds > 0) {
      const actor =
        getActor(
          interaction,
        );
      const userId =
        String(
          actor?.id ||
          "",
        );

      if (userId) {
        const {
          data:
            lastUsage,
          error:
            cooldownError,
        } = await adminDb
          .from(
            "discord_command_usage",
          )
          .select(
            "created_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .eq(
            "command_name",
            command,
          )
          .eq(
            "user_id",
            userId,
          )
          .eq(
            "outcome",
            "allowed",
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(1)
          .maybeSingle();

        if (cooldownError) {
          throw cooldownError;
        }

        if (
          lastUsage
            ?.created_at
        ) {
          const elapsedSeconds =
            (
              Date.now() -
              new Date(
                lastUsage
                  .created_at,
              ).getTime()
            ) /
            1000;

          if (
            elapsedSeconds <
            cooldownSeconds
          ) {
            return {
              allowed: false,
              reason:
                "cooldown",
              retrySeconds:
                cooldownSeconds -
                elapsedSeconds,
            };
          }
        }
      }
    }

    return {
      allowed: true,
    };
  } catch (error) {
    console.error(
      "command policy load failed",
      error,
    );

    return {
      allowed: true,
    };
  }
}

async function writeCommandUsage(
  interaction: any,
  command: string,
  outcome:
    | "allowed"
    | "denied"
    | "error",
  {
    reason = "",
    durationMs = null,
  }: {
    reason?: string;
    durationMs?: number | null;
  } = {},
) {
  if (!adminDb) {
    return;
  }

  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );
  const actor =
    getActor(
      interaction,
    );
  const userId =
    String(
      actor?.id ||
      "",
    );

  if (
    !guildId ||
    !userId ||
    !command
  ) {
    return;
  }

  try {
    await adminDb
      .from(
        "discord_command_usage",
      )
      .insert({
        guild_id:
          guildId,
        command_name:
          command,
        user_id:
          userId,
        channel_id:
          String(
            interaction
              ?.channel_id ||
            "",
          ) ||
          null,
        outcome,
        denied_reason:
          String(
            reason ||
            "",
          )
            .trim()
            .slice(
              0,
              80,
            ) ||
          null,
        duration_ms:
          Number.isFinite(
            Number(
              durationMs,
            ),
          )
            ? Math.max(
                0,
                Math.round(
                  Number(
                    durationMs,
                  ),
                ),
              )
            : null,
      });
  } catch (error) {
    console.error(
      "command usage insert failed",
      error,
    );
  }
}

async function handleCommand(
  interaction: any,
  startedAt: number,
) {
  await rememberGuild(interaction);

  const lang = localeFamily(
    interaction?.locale || interaction?.guild_locale,
  ) as Language;

  const t = copy[lang];
  const command = String(
    interaction?.data?.name || "",
  ).toLowerCase();

  const recruitmentResponse =
    await handleRecruitmentCommand(
      interaction,
      command,
    );

  if (recruitmentResponse) {
    return recruitmentResponse;
  }

  const privateRoomResponse =
    await handlePrivateRoomCommand(
      interaction,
      command,
    );

  if (privateRoomResponse) {
    return privateRoomResponse;
  }

  if (command === "ping") {
    const elapsed = Math.max(
      0,
      Date.now() - startedAt,
    );

    return interactionMessage(
      baseEmbed(
        t.pingTitle,
        interpolate(t.pingText, { ms: elapsed }),
        t.footer,
      ),
    );
  }

  if (command === "server") {
    return await serverCommand(interaction, lang);
  }

  if (command === "user") {
    return userCommand(interaction, lang);
  }

  if (command === "avatar") {
    return avatarCommand(interaction, lang);
  }

  if (command === "bot") {
    return botCommand(interaction, lang);
  }

  if (command === "invite") {
    return inviteCommand(interaction, lang);
  }

  if (command === "subscription") {
    return await subscriptionCommand(
      interaction,
      lang,
    );
  }

  if (command === "subscriptions") {
    return await subscriptionsAdminCommand(
      interaction,
      lang,
    );
  }

  if (command === "poll") {
    return pollCommand(interaction, lang);
  }

  if (command === "warn") {
    return await warnCommand(interaction, lang);
  }

  if (command === "warnings") {
    return await warningsCommand(interaction, lang);
  }

  if (command === "unwarn") {
    return await unwarnCommand(interaction, lang);
  }

  if (command === "kick") {
    return await kickCommand(interaction, lang);
  }

  if (command === "ban") {
    return await banCommand(interaction, lang);
  }

  if (command === "unban") {
    return await unbanCommand(interaction, lang);
  }

  if (command === "slowmode") {
    return await slowmodeCommand(interaction, lang);
  }

  if (command === "clear") {
    return await clearCommand(interaction, lang);
  }

  if (command === "timeout") {
    return await timeoutCommand(interaction, lang);
  }

  if (command === "site") {
    return interactionMessage(
      baseEmbed(
        t.siteTitle,
        t.siteText,
        t.footer,
      ),
      linkRow([
        { label: t.openSite, url: SITE_URL },
      ]),
    );
  }

  if (command === "rules") {
    return interactionMessage(
      baseEmbed(
        t.rulesTitle,
        t.rulesText,
        t.footer,
      ),
    );
  }

  if (command === "team") {
    return await teamCommand(lang);
  }

  if (command === "matches") {
    return await matchesCommand(lang);
  }

  if (command === "news") {
    return await newsCommand(lang);
  }

  return interactionMessage(
    baseEmbed(
      t.helpTitle,
      t.helpText,
      t.footer,
    ),
  );
}

Deno.serve(async (request) => {
  const startedAt = Date.now();

  if (request.method !== "POST") {
    return json(
      {
        ok: false,
        error: "METHOD_NOT_ALLOWED",
      },
      405,
    );
  }

  const signature =
    request.headers.get("x-signature-ed25519") || "";

  const timestamp =
    request.headers.get("x-signature-timestamp") || "";

  const rawBody = await request.text();

  if (
    !signature ||
    !timestamp ||
    !verifyDiscordRequest(
      signature,
      timestamp,
      rawBody,
    )
  ) {
    return json(
      {
        ok: false,
        error: "INVALID_SIGNATURE",
      },
      401,
    );
  }

  let interaction: any;

  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return json(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      400,
    );
  }

  if (interaction?.type === 1) {
    return json({ type: 1 });
  }

  if (interaction?.type === 2) {
    const command =
      String(
        interaction
          ?.data
          ?.name ||
        "",
      )
        .toLowerCase();

    const policy =
      await loadCommandPolicy(
        interaction,
        command,
      );

    if (!policy.allowed) {
      await writeCommandUsage(
        interaction,
        command,
        "denied",
        {
          reason:
            policy.reason ||
            "policy",
          durationMs:
            Date.now() -
            startedAt,
        },
      );

      return json(
        ephemeralText(
          commandPolicyText(
            interaction,
            policy.reason,
            policy.retrySeconds,
          ),
        ),
      );
    }

    try {
      const result =
        await handleCommand(
          interaction,
          startedAt,
        );

      await writeCommandUsage(
        interaction,
        command,
        "allowed",
        {
          durationMs:
            Date.now() -
            startedAt,
        },
      );

      return json(result);
    } catch (error) {
      console.error(
        "discord command failed",
        error,
      );

      await writeCommandUsage(
        interaction,
        command,
        "error",
        {
          reason:
            error instanceof Error
              ? error.message
              : "command_error",
          durationMs:
            Date.now() -
            startedAt,
        },
      );

      const lang =
        localeFamily(
          interaction?.locale ||
          interaction
            ?.guild_locale,
        ) as Language;

      return json(
        ephemeralText(
          copy[lang]
            .genericError,
        ),
      );
    }
  }

  if (interaction?.type === 3) {
    try {
      const subscriptionShopOpenResponse =
        await handleSubscriptionShopOpenComponent(
          interaction,
        );

      if (subscriptionShopOpenResponse) {
        return json(
          subscriptionShopOpenResponse,
        );
      }

      const subscriptionAdminResponse =
        await handleSubscriptionAdminComponent(
          interaction,
        );

      if (subscriptionAdminResponse) {
        return json(
          subscriptionAdminResponse,
        );
      }

      const subscriptionResponse =
        await handleSubscriptionComponent(
          interaction,
        );

      if (subscriptionResponse) {
        return json(
          subscriptionResponse,
        );
      }

      const giveawayResponse =
        await handleGiveawayComponent(
          interaction,
        );

      if (giveawayResponse) {
        return json(
          giveawayResponse,
        );
      }

      const roleResponse =
        await handleRolesVerificationComponent(
          interaction,
        );

      if (roleResponse) {
        return json(roleResponse);
      }

      const ticketResponse =
        await handleTicketComponent(
          interaction,
        );

      if (ticketResponse) {
        return json(ticketResponse);
      }

      const privateResponse =
        await handlePrivateRoomComponent(
          interaction,
        );

      if (privateResponse) {
        return json(privateResponse);
      }

      const recruitmentResponse =
        await handleRecruitmentComponent(
          interaction,
        );

      if (recruitmentResponse) {
        return json(recruitmentResponse);
      }
    } catch (error) {
      console.error(
        "discord component failed",
        error,
      );

      return json(
        ephemeralText(
          "Не удалось выполнить действие.",
        ),
      );
    }
  }

  if (interaction?.type === 5) {
    try {
      const privateResponse =
        await handlePrivateRoomModal(
          interaction,
        );

      if (privateResponse) {
        return json(privateResponse);
      }

      const recruitmentResponse =
        await handleRecruitmentModal(
          interaction,
        );

      if (recruitmentResponse) {
        return json(recruitmentResponse);
      }
    } catch (error) {
      console.error(
        "discord modal failed",
        error,
      );

      return json(
        ephemeralText(
          "Не удалось выполнить действие.",
        ),
      );
    }
  }

  return json({
    type: 4,
    data: {
      content:
        "ISTe Bot: unsupported interaction.",
      flags: 64,
      allowed_mentions: { parse: [] },
    },
  });
});
