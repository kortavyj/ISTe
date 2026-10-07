import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./BotDashboard.css";

const EMPTY_SETTINGS = {
  locale: "uk",
  adminRoleId: "",
  moderatorRoleId: "",
  memberRoleId: "",
  logChannelId: "",
  welcomeChannelId: "",
  matchChannelId: "",
  welcomeTitle: "",
  welcomeMessage: "",
  welcomeMention: true,
  welcomeShowMemberCount: true,
  moderationClearEnabled: true,
  moderationTimeoutEnabled: true,
  automodEnabled: false,
  automodSpamEnabled: true,
  automodInvitesEnabled: true,
  automodMentionEnabled: true,
  automodCapsEnabled: false,
  automodForbiddenWords: "",
  automodAlertChannelId: "",
  automodMentionLimit: 5,
  automodEscalationCount: 3,
  automodEscalationWindowMinutes: 10,
  automodTimeoutMinutes: 10,
  automodRuleIds: {},
  verificationEnabled: false,
  verificationPanelChannelId: "",
  verificationRoleId: "",
  verificationRemoveRoleId: "",
  verificationPanelTitle: "",
  verificationPanelMessage: "",
  selfRolesEnabled: false,
  selfRolesPanelChannelId: "",
  selfRolesPanelTitle: "",
  selfRolesPanelMessage: "",
  selfRoleIds: [],
  ticketPanelChannelId: "",
  ticketCategoryId: "",
  ticketSupportRoleId: "",
  ticketLogChannelId: "",
  ticketPanelTitle: "",
  ticketPanelMessage: "",
  ticketMaxOpenPerUser: 1,
  welcomeEnabled: false,
  moderationEnabled: false,
  ticketsEnabled: false,
  privateVoiceEnabled: false,
  autoRolesEnabled: false,
};

const copy = {
  uk: {
    eyebrow: "ISTe BOT CONTROL",
    title: "Мої Discord-сервери",
    intro:
      "Підключайте сервери до ISTe Bot і керуйте кожним окремо. Налаштування одного Discord-сервера не змінюють інші.",
    subscription: "Підписка",
    plan: "Тариф",
    active: "Активна",
    expires: "Діє до",
    unlimited: "Безстроково",
    licenses: "Ліцензії",
    role: "Subscriber role",
    rolePending: "Ще не синхронізовано",
    connectDiscord: "Підключити Discord",
    reconnectDiscord: "Оновити сервери Discord",
    oauthMissing:
      "Discord OAuth ще не активований. Потрібно додати DISCORD_CLIENT_SECRET у Vercel.",
    discordLinked: "Discord підключено",
    servers: "Доступні сервери",
    noServers:
      "Discord не повернув серверів, якими ви можете керувати.",
    license: "Активувати ліцензію",
    addBot: "Додати ISTe Bot",
    verify: "Перевірити бота",
    manage: "Налаштувати",
    connected: "Bot connected",
    notConnected: "Bot not connected",
    licensed: "Ліцензія активна",
    noLicense: "Без ліцензії",
    members: "учасників",
    settings: "Налаштування сервера",
    back: "Назад до серверів",
    general: "Основне",
    language: "Мова бота",
    uk: "Українська",
    en: "English",
    autoRole: "Автоматична роль",
    autoRoleText:
      "Видавати роль новому учаснику цього Discord-сервера.",
    memberRoleId: "Роль нового учасника",
    chooseRole: "Не вибрано",
    chooseChannel: "Не вибрано",
    resourcesLoading: "Завантаження ролей і каналів…",
    resourcesUnavailable:
      "Не вдалося отримати ролі або канали. Перевірте, що ISTe Bot встановлено та має доступ.",
    releaseLicense: "Звільнити ліцензію",
    releaseConfirm:
      "Звільнити ліцензію цього сервера? Налаштування сервера буде видалено, але сам бот залишиться у Discord.",
    licenseReleased: "Ліцензію звільнено.",
    privateVoice: "Приватні голосові кімнати",
    privateVoiceText:
      "Автоматична система тимчасових приватних кімнат тільки для цього сервера.",
    advanced: "Керування модулями",
    advancedText:
      "Кожен модуль має окремі параметри для цього Discord-сервера.",
    welcome: "Welcome",
    welcomeText:
      "Автоматичне привітання нового учасника з власним текстом та оформленням.",
    welcomeTitle: "Заголовок привітання",
    welcomeMessage: "Текст привітання",
    welcomeTitlePlaceholder: "Ласкаво просимо до {{server}}!",
    welcomeMessagePlaceholder:
      "**{{user}}**, вітаємо у спільноті. Ознайомся з правилами сервера.",
    welcomeMention: "Згадувати нового учасника",
    welcomeShowMemberCount: "Показувати кількість учасників",
    moderation: "Moderation",
    moderationText:
      "Керує командами модерації, ролями доступу та журналом дій.",
    moderationClear: "Дозволити /clear",
    moderationTimeout: "Дозволити /timeout",
    automod: "AutoMod",
    automodText:
      "Нативні правила Discord: блокування спаму, invite-посилань, масових згадок, CAPS і власних стоп-слів.",
    automodSpam: "Блокувати spam content",
    automodInvites: "Блокувати Discord invite",
    automodMentions: "Mention spam",
    automodCaps: "CAPS фільтр",
    automodWords: "Заборонені слова / фрази",
    automodWordsPlaceholder:
      "Одне слово або фраза на рядок",
    automodAlertChannel: "Канал AutoMod alerts",
    automodMentionLimit: "Ліміт згадок",
    automodEscalationCount: "Поріг для timeout",
    automodEscalationWindow: "Вікно, хв",
    automodTimeoutMinutes: "Timeout, хв",
    syncAutomod: "Синхронізувати AutoMod",
    syncingAutomod: "Синхронізація...",
    automodSynced: "AutoMod правила ISTe синхронізовано.",
    automodConflict:
      "Частина Spam/Mention правил уже керується Discord або іншим AutoMod правилом. ISTe їх не змінював.",
    updateBotPermissions: "Оновити права бота",
    verification: "Verification",
    verificationText:
      "Панель підтвердження доступу: видає verified роль і за потреби знімає роль нового учасника.",
    verificationPanelChannel: "Канал Verification panel",
    verificationRole: "Verified роль",
    verificationRemoveRole: "Роль, яку зняти після verify",
    verificationTitle: "Заголовок Verification",
    verificationMessage: "Текст Verification",
    verificationTitlePlaceholder: "Верифікація ISTe",
    verificationMessagePlaceholder:
      "Натисни кнопку нижче, щоб підтвердити доступ до сервера.",
    publishVerification: "Опублікувати Verification",
    publishingVerification: "Публікація...",
    verificationPublished: "Verification panel опубліковано або оновлено.",
    selfRoles: "Button Roles",
    selfRolesText:
      "Учасники самостійно отримують або знімають дозволені ролі кнопками.",
    selfRolesPanelChannel: "Канал Button Roles panel",
    selfRolesTitle: "Заголовок панелі ролей",
    selfRolesMessage: "Текст панелі ролей",
    selfRolesTitlePlaceholder: "Обери свої ролі",
    selfRolesMessagePlaceholder:
      "Натисни кнопку ролі, щоб отримати її. Повторне натискання зніме роль.",
    selfRolesAllowed: "Доступні self roles",
    selfRolesHint: "Можна обрати до 10 ролей.",
    selectedRoles: "Обрано ролей",
    publishSelfRoles: "Опублікувати Button Roles",
    publishingSelfRoles: "Публікація...",
    selfRolesPublished: "Button Roles panel опубліковано або оновлено.",
    moderationCenter: "Moderation Center",
    moderationCenterText:
      "Історія покарань, активні попередження та технічний журнал дій цього Discord-сервера.",
    totalCases: "Усього кейсів",
    activeWarnings: "Активні warn",
    last24h: "За 24 години",
    targetUserId: "Discord User ID",
    allActions: "Усі дії",
    refreshHistory: "Оновити журнал",
    historyLoading: "Завантаження журналу…",
    noModerationCases: "Кейсів за цим фільтром немає.",
    moderationCases: "Moderation cases",
    auditLog: "Audit log",
    caseTarget: "Користувач",
    caseModerator: "Модератор",
    caseReason: "Причина",
    caseStatus: "Статус",
    caseDuration: "Тривалість",
    caseMinutes: "хв",
    filterByUser: "Показати історію цього користувача",
    clearFilter: "Скинути фільтр",
    moderationHistoryFailed:
      "Не вдалося завантажити журнал модерації.",
    tickets: "Tickets",
    ticketsText:
      "Приватні канали підтримки з керуванням доступом, закриттям, повторним відкриттям і логами.",
    ticketPanelChannel: "Канал панелі",
    ticketCategory: "Категорія тикетів",
    ticketSupportRole: "Роль підтримки",
    ticketLogChannel: "Канал логів тикетів",
    ticketPanelTitle: "Заголовок панелі",
    ticketPanelMessage: "Текст панелі",
    ticketPanelTitlePlaceholder: "Підтримка ISTe",
    ticketPanelMessagePlaceholder:
      "Натисни кнопку нижче, щоб створити приватний тикет зі staff.",
    ticketMaxOpen: "Макс. відкритих на користувача",
    chooseCategory: "Без категорії",
    publishTicketPanel: "Опублікувати панель",
    publishingTicketPanel: "Публікація...",
    ticketPanelPublished: "Ticket panel опубліковано або оновлено.",
    comingNext: "Наступний модуль",
    serverControls: "Керування сервером",
    serverControlsText:
      "Службові ролі та інтеграції ISTe для цього Discord-сервера.",
    moduleOn: "Увімкнено",
    moduleOff: "Вимкнено",
    adminRoleId: "Роль адміністратора",
    moderatorRoleId: "Роль модератора",
    logChannelId: "Канал логів",
    welcomeChannelId: "Welcome-канал",
    matchChannelId: "Канал LIVE-матчів ISTe",
    save: "Зберегти",
    saving: "Збереження...",
    saved: "Налаштування збережено.",
    loadFailed: "Не вдалося завантажити ISTe Bot Dashboard.",
    actionFailed: "Не вдалося виконати дію.",
    oauthLinked: "Discord успішно підключено.",
    oauthError: "Не вдалося підключити Discord.",
    freeHint:
      "На етапі запуску Free дозволяє один Discord-сервер. Платні місячні тарифи та автоматична роль Subscriber будуть підключені до цієї ж системи ліцензій.",
    internalHint:
      "Внутрішній акаунт власника ISTe: повний доступ до всіх функцій, безлімітні Discord-сервери та безстрокова підписка.",
    fullAccess: "Повний доступ",
    unlimitedLicenses: "∞",
    plansTitle: "Тарифи ISTe Bot",
    plansText:
      "Місячна підписка діє 30 днів. Максимальний тариф коштує $6.99.",
    perMonth: "/ міс",
    currentPlan: "Поточний тариф",
    freePlan: "Free",
    starterPlan: "Starter",
    proPlan: "Pro",
    maxPlan: "Max",
    freeFeatures: "1 сервер · базові команди",
    starterFeatures: "1 сервер · Auto Role · Welcome · Moderation · Logs",
    proFeatures: "3 сервери · Starter + Private Voice · Tickets · FACEIT · Team",
    maxFeatures: "10 серверів · усі модулі · Highlights · Analytics",
    paymentSoon:
      "Оплата буде підключена окремим платіжним модулем. Тарифна система вже активна.",
    requiresPlan: "Потрібен вищий тариф",
  },
  en: {
    eyebrow: "ISTe BOT CONTROL",
    title: "My Discord servers",
    intro:
      "Connect servers to ISTe Bot and manage each one independently. Settings from one Discord server never change another.",
    subscription: "Subscription",
    plan: "Plan",
    active: "Active",
    expires: "Expires",
    unlimited: "No expiry",
    licenses: "Licenses",
    role: "Subscriber role",
    rolePending: "Not synced yet",
    connectDiscord: "Connect Discord",
    reconnectDiscord: "Refresh Discord servers",
    oauthMissing:
      "Discord OAuth is not active yet. DISCORD_CLIENT_SECRET must be added to Vercel.",
    discordLinked: "Discord connected",
    servers: "Available servers",
    noServers:
      "Discord returned no servers you are allowed to manage.",
    license: "Activate license",
    addBot: "Add ISTe Bot",
    verify: "Verify bot",
    manage: "Manage",
    connected: "Bot connected",
    notConnected: "Bot not connected",
    licensed: "License active",
    noLicense: "No license",
    members: "members",
    settings: "Server settings",
    back: "Back to servers",
    general: "General",
    language: "Bot language",
    uk: "Українська",
    en: "English",
    autoRole: "Automatic role",
    autoRoleText:
      "Assign a role to new members of this Discord server.",
    memberRoleId: "Member role",
    chooseRole: "Not selected",
    chooseChannel: "Not selected",
    resourcesLoading: "Loading roles and channels…",
    resourcesUnavailable:
      "Could not load roles or channels. Make sure ISTe Bot is installed and has access.",
    releaseLicense: "Release license",
    releaseConfirm:
      "Release this server license? Server settings will be deleted, but the bot will remain in Discord.",
    licenseReleased: "License released.",
    privateVoice: "Private voice rooms",
    privateVoiceText:
      "Automatic temporary private-room system only for this server.",
    advanced: "Module management",
    advancedText:
      "Each module has independent settings for this Discord server.",
    welcome: "Welcome",
    welcomeText:
      "Automatically greet new members with custom text and presentation.",
    welcomeTitle: "Welcome title",
    welcomeMessage: "Welcome message",
    welcomeTitlePlaceholder: "Welcome to {{server}}!",
    welcomeMessagePlaceholder:
      "**{{user}}**, welcome to the community. Please read the server rules.",
    welcomeMention: "Mention the new member",
    welcomeShowMemberCount: "Show member count",
    moderation: "Moderation",
    moderationText:
      "Controls moderation commands, access roles and action logging.",
    moderationClear: "Allow /clear",
    moderationTimeout: "Allow /timeout",
    automod: "AutoMod",
    automodText:
      "Native Discord rules for spam, invite links, mention spam, CAPS and custom blocked terms.",
    automodSpam: "Block spam content",
    automodInvites: "Block Discord invites",
    automodMentions: "Mention spam",
    automodCaps: "CAPS filter",
    automodWords: "Blocked words / phrases",
    automodWordsPlaceholder:
      "One word or phrase per line",
    automodAlertChannel: "AutoMod alert channel",
    automodMentionLimit: "Mention limit",
    automodEscalationCount: "Timeout threshold",
    automodEscalationWindow: "Window, min",
    automodTimeoutMinutes: "Timeout, min",
    syncAutomod: "Sync AutoMod",
    syncingAutomod: "Syncing...",
    automodSynced: "ISTe AutoMod rules synchronized.",
    automodConflict:
      "Some Spam/Mention rules are already managed by Discord or another AutoMod rule. ISTe left them unchanged.",
    updateBotPermissions: "Update bot permissions",
    verification: "Verification",
    verificationText:
      "Access verification panel: grants a verified role and can remove the newcomer role.",
    verificationPanelChannel: "Verification panel channel",
    verificationRole: "Verified role",
    verificationRemoveRole: "Role to remove after verification",
    verificationTitle: "Verification title",
    verificationMessage: "Verification message",
    verificationTitlePlaceholder: "ISTe Verification",
    verificationMessagePlaceholder:
      "Press the button below to verify and unlock server access.",
    publishVerification: "Publish Verification",
    publishingVerification: "Publishing...",
    verificationPublished: "Verification panel published or updated.",
    selfRoles: "Button Roles",
    selfRolesText:
      "Members can add or remove approved roles themselves with buttons.",
    selfRolesPanelChannel: "Button Roles panel channel",
    selfRolesTitle: "Role panel title",
    selfRolesMessage: "Role panel message",
    selfRolesTitlePlaceholder: "Choose your roles",
    selfRolesMessagePlaceholder:
      "Press a role button to add it. Press it again to remove it.",
    selfRolesAllowed: "Available self roles",
    selfRolesHint: "Select up to 10 roles.",
    selectedRoles: "Selected roles",
    publishSelfRoles: "Publish Button Roles",
    publishingSelfRoles: "Publishing...",
    selfRolesPublished: "Button Roles panel published or updated.",
    moderationCenter: "Moderation Center",
    moderationCenterText:
      "Punishment history, active warnings and technical action log for this Discord server.",
    totalCases: "Total cases",
    activeWarnings: "Active warnings",
    last24h: "Last 24 hours",
    targetUserId: "Discord User ID",
    allActions: "All actions",
    refreshHistory: "Refresh log",
    historyLoading: "Loading moderation history…",
    noModerationCases: "No cases match this filter.",
    moderationCases: "Moderation cases",
    auditLog: "Audit log",
    caseTarget: "User",
    caseModerator: "Moderator",
    caseReason: "Reason",
    caseStatus: "Status",
    caseDuration: "Duration",
    caseMinutes: "min",
    filterByUser: "Show this user's history",
    clearFilter: "Clear filter",
    moderationHistoryFailed:
      "Could not load moderation history.",
    tickets: "Tickets",
    ticketsText:
      "Private support channels with access control, closing, reopening and logs.",
    ticketPanelChannel: "Panel channel",
    ticketCategory: "Ticket category",
    ticketSupportRole: "Support role",
    ticketLogChannel: "Ticket log channel",
    ticketPanelTitle: "Panel title",
    ticketPanelMessage: "Panel message",
    ticketPanelTitlePlaceholder: "ISTe Support",
    ticketPanelMessagePlaceholder:
      "Press the button below to create a private ticket with staff.",
    ticketMaxOpen: "Max open per user",
    chooseCategory: "No category",
    publishTicketPanel: "Publish panel",
    publishingTicketPanel: "Publishing...",
    ticketPanelPublished: "Ticket panel published or updated.",
    comingNext: "Next module",
    serverControls: "Server management",
    serverControlsText:
      "Service roles and ISTe integrations for this Discord server.",
    moduleOn: "Enabled",
    moduleOff: "Disabled",
    adminRoleId: "Administrator role",
    moderatorRoleId: "Moderator role",
    logChannelId: "Log channel",
    welcomeChannelId: "Welcome channel",
    matchChannelId: "ISTe LIVE match channel",
    save: "Save",
    saving: "Saving...",
    saved: "Settings saved.",
    loadFailed: "Could not load ISTe Bot Dashboard.",
    actionFailed: "Could not complete the action.",
    oauthLinked: "Discord connected successfully.",
    oauthError: "Could not connect Discord.",
    freeHint:
      "During launch, Free supports one Discord server. Paid monthly plans and automatic Subscriber role sync will use this same license system.",
    internalHint:
      "ISTe owner internal account: full feature access, unlimited Discord servers and a non-expiring subscription.",
    fullAccess: "Full access",
    unlimitedLicenses: "∞",
    plansTitle: "ISTe Bot plans",
    plansText:
      "A monthly subscription lasts 30 days. The highest plan costs $6.99.",
    perMonth: "/ mo",
    currentPlan: "Current plan",
    freePlan: "Free",
    starterPlan: "Starter",
    proPlan: "Pro",
    maxPlan: "Max",
    freeFeatures: "1 server · basic commands",
    starterFeatures: "1 server · Auto Role · Welcome · Moderation · Logs",
    proFeatures: "3 servers · Starter + Private Voice · Tickets · FACEIT · Team",
    maxFeatures: "10 servers · all modules · Highlights · Analytics",
    paymentSoon:
      "Checkout will be connected through a payment provider. The plan system is already active.",
    requiresPlan: "Higher plan required",
  },
};

async function api(
  action,
  {
    method = "GET",
    body = null,
  } = {},
) {
  const options = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  };

  if (body) {
    options.headers[
      "Content-Type"
    ] = "application/json";
    options.body =
      JSON.stringify(body);
  }

  const response =
    await fetch(
      `/api/owner?module=bot-portal&action=${encodeURIComponent(
        action,
      )}`,
      options,
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      result?.message ||
        "REQUEST_FAILED",
    );
  }

  return result;
}

function formatDate(
  value,
  language,
) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    language === "en"
      ? "en-GB"
      : "uk-UA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value,
  language,
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "en"
      ? "en-GB"
      : "uk-UA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

export default function BotDashboard() {
  const {
    language,
  } = useLanguage();

  const c =
    copy[language] ||
    copy.uk;

  const [
    data,
    setData,
  ] = useState(null);

  const [
    selectedGuildId,
    setSelectedGuildId,
  ] = useState("");

  const [
    settings,
    setSettings,
  ] = useState(
    EMPTY_SETTINGS,
  );

  const [
    resources,
    setResources,
  ] = useState({
    roles: [],
    channels: [],
    categories: [],
  });

  const [
    resourcesLoading,
    setResourcesLoading,
  ] = useState(false);

  const [
    moderationHistory,
    setModerationHistory,
  ] = useState({
    summary: {
      totalCases: 0,
      activeWarnings: 0,
      last24h: 0,
    },
    cases: [],
    audit: [],
  });

  const [
    moderationLoading,
    setModerationLoading,
  ] = useState(false);

  const [
    moderationTarget,
    setModerationTarget,
  ] = useState("");

  const [
    moderationAction,
    setModerationAction,
  ] = useState("");

  const [
    moderationError,
    setModerationError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result =
        await api("status");

      setData(result);

      if (
        selectedGuildId
      ) {
        const selected =
          result.guilds?.find(
            (guild) =>
              guild.guildId ===
              selectedGuildId,
          );

        if (selected) {
          setSettings({
            ...EMPTY_SETTINGS,
            ...(selected.settings ||
              {}),
          });
        }
      }
    } catch (loadError) {
      setError(
        loadError?.message ||
        c.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const query =
      new URLSearchParams(
        window.location.search,
      );

    const discord =
      query.get("discord");

    if (
      discord === "linked"
    ) {
      setNotice(
        c.oauthLinked,
      );
    } else if (
      discord &&
      discord !== "linked"
    ) {
      setError(
        c.oauthError,
      );
    }
  }, []);

  const selectedGuild =
    useMemo(
      () =>
        data?.guilds?.find(
          (guild) =>
            guild.guildId ===
            selectedGuildId,
        ) || null,
      [
        data,
        selectedGuildId,
      ],
    );

  function patch(
    field,
    value,
  ) {
    setSettings(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function loadModerationHistory(
    guildId =
      selectedGuildId,
    targetUserId =
      moderationTarget,
    action =
      moderationAction,
  ) {
    if (!guildId) {
      return;
    }

    setModerationLoading(
      true,
    );
    setModerationError("");

    try {
      const result =
        await api(
          "moderation-history",
          {
            method: "POST",
            body: {
              guildId,
              targetUserId:
                String(
                  targetUserId ||
                  "",
                ).trim(),
              action:
                String(
                  action ||
                  "",
                ).trim(),
            },
          },
        );

      setModerationHistory({
        summary: {
          totalCases:
            result.summary
              ?.totalCases ||
            0,
          activeWarnings:
            result.summary
              ?.activeWarnings ||
            0,
          last24h:
            result.summary
              ?.last24h ||
            0,
        },
        cases:
          Array.isArray(
            result.cases,
          )
            ? result.cases
            : [],
        audit:
          Array.isArray(
            result.audit,
          )
            ? result.audit
            : [],
      });
    } catch (historyError) {
      setModerationError(
        historyError?.message ||
          c.moderationHistoryFailed,
      );
    } finally {
      setModerationLoading(
        false,
      );
    }
  }

  async function openSettings(
    guild,
  ) {
    setSelectedGuildId(
      guild.guildId,
    );

    setSettings({
      ...EMPTY_SETTINGS,
      ...(guild.settings ||
        {}),
    });

    setResources({
      roles: [],
      channels: [],
      categories: [],
    });

    setResourcesLoading(true);
    setModerationTarget("");
    setModerationAction("");
    setModerationHistory({
      summary: {
        totalCases: 0,
        activeWarnings: 0,
        last24h: 0,
      },
      cases: [],
      audit: [],
    });
    setModerationError("");
    setNotice("");
    setError("");

    void loadModerationHistory(
      guild.guildId,
      "",
      "",
    );

    try {
      const result =
        await api(
          "guild-resources",
          {
            method: "POST",
            body: {
              guildId:
                guild.guildId,
            },
          },
        );

      setResources({
        roles:
          Array.isArray(
            result.roles,
          )
            ? result.roles
            : [],
        channels:
          Array.isArray(
            result.channels,
          )
            ? result.channels
            : [],
        categories:
          Array.isArray(
            result.categories,
          )
            ? result.categories
            : [],
      });
    } catch (resourcesError) {
      setError(
        resourcesError?.message ||
          c.resourcesUnavailable,
      );
    } finally {
      setResourcesLoading(false);
    }
  }

  async function connectDiscord() {
    setBusy("oauth");
    setError("");

    try {
      const result =
        await api(
          "oauth-start",
          {
            method: "POST",
            body: {},
          },
        );

      window.location.assign(
        result.authorizationUrl,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
      setBusy("");
    }
  }

  async function activateGuild(
    guild,
    {
      openDiscord = true,
    } = {},
  ) {
    setBusy(
      `activate:${guild.guildId}`,
    );
    setError("");

    try {
      const result =
        await api(
          "activate-guild",
          {
            method: "POST",
            body: {
              guildId:
                guild.guildId,
            },
          },
        );

      await load();

      if (
        openDiscord &&
        result.installUrl
      ) {
        window.open(
          result.installUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function verifyGuild(
    guild,
  ) {
    setBusy(
      `verify:${guild.guildId}`,
    );
    setError("");

    try {
      await api(
        "verify-guild",
        {
          method: "POST",
          body: {
            guildId:
              guild.guildId,
          },
        },
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function releaseLicense(
    guild,
  ) {
    if (
      !window.confirm(
        c.releaseConfirm,
      )
    ) {
      return;
    }

    setBusy(
      `release:${guild.guildId}`,
    );
    setError("");
    setNotice("");

    try {
      await api(
        "release-license",
        {
          method: "POST",
          body: {
            guildId:
              guild.guildId,
          },
        },
      );

      if (
        selectedGuildId ===
        guild.guildId
      ) {
        setSelectedGuildId(
          "",
        );
      }

      setNotice(
        c.licenseReleased,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function saveSettings(
    event,
  ) {
    event.preventDefault();

    if (
      !selectedGuild
    ) {
      return;
    }

    setBusy("settings");
    setError("");
    setNotice("");

    try {
      const result =
        await api(
          "save-settings",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
              ...settings,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...result.settings,
      });

      setNotice(
        c.saved,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function publishVerificationPanel() {
    if (!selectedGuild) {
      return;
    }

    setBusy("verification-panel");
    setError("");
    setNotice("");

    try {
      const saved =
        await api(
          "save-settings",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
              ...settings,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...saved.settings,
      });

      await api(
        "publish-verification-panel",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild.guildId,
          },
        },
      );

      setNotice(
        c.verificationPublished,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function publishSelfRolesPanel() {
    if (!selectedGuild) {
      return;
    }

    setBusy("self-roles-panel");
    setError("");
    setNotice("");

    try {
      const saved =
        await api(
          "save-settings",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
              ...settings,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...saved.settings,
      });

      await api(
        "publish-self-roles-panel",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild.guildId,
          },
        },
      );

      setNotice(
        c.selfRolesPublished,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function syncAutomod() {
    if (!selectedGuild) {
      return;
    }

    setBusy("automod");
    setError("");
    setNotice("");

    try {
      const saved =
        await api(
          "save-settings",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
              ...settings,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...saved.settings,
      });

      const result =
        await api(
          "sync-automod",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
            },
          },
        );

      setNotice(
        result.warnings
          ?.length
          ? `${c.automodSynced} ${c.automodConflict}`
          : c.automodSynced,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function publishTicketPanel() {
    if (!selectedGuild) {
      return;
    }

    setBusy("ticket-panel");
    setError("");
    setNotice("");

    try {
      const saved =
        await api(
          "save-settings",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild.guildId,
              ...settings,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...saved.settings,
      });

      await api(
        "publish-ticket-panel",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild.guildId,
          },
        },
      );

      setNotice(
        c.ticketPanelPublished,
      );

      await load();
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <section className="bot-dashboard-page">
        <div className="bot-dashboard-loading">
          ISTe Bot…
        </div>
      </section>
    );
  }

  const subscription =
    data?.subscription;

  const entitlements =
    new Set(
      subscription
        ?.features ||
      [],
    );

  const hasFeature =
    (feature) =>
      subscription
        ?.fullAccess ===
        true ||
      entitlements.has("*") ||
      entitlements.has(
        feature,
      );

  const planCards = [
    {
      plan: "free",
      title: c.freePlan,
      price: 0,
      description:
        c.freeFeatures,
    },
    {
      plan: "starter",
      title:
        c.starterPlan,
      price: 2.99,
      description:
        c.starterFeatures,
    },
    {
      plan: "pro",
      title: c.proPlan,
      price: 4.99,
      description:
        c.proFeatures,
    },
    {
      plan: "max",
      title: c.maxPlan,
      price: 6.99,
      description:
        c.maxFeatures,
    },
  ];

  return (
    <section className="bot-dashboard-page">
      <div className="bot-dashboard-shell">
        <header className="bot-dashboard-hero">
          <div>
            <span>
              {c.eyebrow}
            </span>
            <h1>
              {c.title}
            </h1>
            <p>
              {c.intro}
            </p>
          </div>

          <button
            type="button"
            onClick={
              connectDiscord
            }
            disabled={
              busy === "oauth" ||
              !data
                ?.oauthConfigured
            }
          >
            {data
              ?.discordAccount
              ? c.reconnectDiscord
              : c.connectDiscord}
          </button>
        </header>

        {!data
          ?.oauthConfigured ? (
          <div className="bot-dashboard-alert warning">
            {c.oauthMissing}
          </div>
        ) : null}

        {error ? (
          <div className="bot-dashboard-alert error">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="bot-dashboard-alert success">
            {notice}
          </div>
        ) : null}

        <div className="bot-dashboard-summary">
          <article>
            <span>
              {c.subscription}
            </span>
            <strong>
              {String(
                subscription?.plan ||
                "free",
              ).toUpperCase()}
            </strong>
            <small>
              {subscription
                ?.fullAccess
                ? `${c.fullAccess} ✓`
                : `${c.active}: ${subscription?.active ? "✓" : "×"}`}
            </small>
          </article>

          <article>
            <span>
              {c.licenses}
            </span>
            <strong>
              {subscription
                ?.unlimited
                ? c.unlimitedLicenses
                : `${subscription?.usedGuilds || 0} / ${subscription?.maxGuilds || 1}`}
            </strong>
            <small>
              {c.expires}:{" "}
              {subscription
                ?.expiresAt
                ? formatDate(
                    subscription
                      .expiresAt,
                    language,
                  )
                : c.unlimited}
            </small>
          </article>

          <article>
            <span>
              {c.discordLinked}
            </span>
            <strong>
              {data
                ?.discordAccount
                ?.globalName ||
                data
                  ?.discordAccount
                  ?.username ||
                "—"}
            </strong>
            <small>
              {data
                ?.discordAccount
                ? "✓"
                : "×"}
            </small>
          </article>
        </div>

        <p className="bot-dashboard-plan-note">
          {subscription
            ?.unlimited
            ? c.internalHint
            : c.freeHint}
        </p>

        {!subscription?.unlimited ? (
          <section className="bot-dashboard-plans">
            <header>
              <div>
                <span>
                  ISTe BOT
                </span>
                <h2>
                  {c.plansTitle}
                </h2>
                <p>
                  {c.plansText}
                </p>
              </div>
            </header>

            <div className="bot-dashboard-plan-grid">
              {planCards.map(
                (plan) => (
                  <article
                    key={
                      plan.plan
                    }
                    className={
                      subscription?.plan ===
                      plan.plan
                        ? "current"
                        : ""
                    }
                  >
                    <span>
                      {plan.title}
                    </span>

                    <strong>
                      {"$"}
                      {plan.price.toFixed(
                        2,
                      )}
                      <small>
                        {plan.price > 0
                          ? c.perMonth
                          : ""}
                      </small>
                    </strong>

                    <p>
                      {
                        plan.description
                      }
                    </p>

                    {subscription?.plan ===
                    plan.plan ? (
                      <b>
                        {c.currentPlan}
                      </b>
                    ) : null}
                  </article>
                ),
              )}
            </div>

            <p className="bot-dashboard-payment-note">
              {c.paymentSoon}
            </p>
          </section>
        ) : null}

        {selectedGuild ? (
          <div className="bot-dashboard-settings-view">
            <button
              type="button"
              className="bot-dashboard-back"
              onClick={() =>
                setSelectedGuildId(
                  "",
                )
              }
            >
              ← {c.back}
            </button>

            <div className="bot-dashboard-settings-head">
              <div className="bot-dashboard-guild-icon">
                {selectedGuild
                  .iconUrl ? (
                  <img
                    src={
                      selectedGuild
                        .iconUrl
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {selectedGuild
                      .name
                      .slice(
                        0,
                        2,
                      )
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <span>
                  {c.settings}
                </span>
                <h2>
                  {
                    selectedGuild
                      .name
                  }
                </h2>
                <p>
                  ID{" "}
                  {
                    selectedGuild
                      .guildId
                  }
                </p>
              </div>
            </div>

            <form
              className="bot-dashboard-settings"
              onSubmit={
                saveSettings
              }
            >
              <section>
                <header>
                  <strong>
                    {c.general}
                  </strong>
                </header>

                <label>
                  <span>
                    {c.language}
                  </span>
                  <select
                    value={
                      settings.locale
                    }
                    onChange={(
                      event,
                    ) =>
                      patch(
                        "locale",
                        event
                          .target
                          .value,
                      )
                    }
                  >
                    <option value="uk">
                      {c.uk}
                    </option>
                    <option value="en">
                      {c.en}
                    </option>
                  </select>
                </label>
              </section>

              <section>
                <header>
                  <div>
                    <strong>
                      {c.autoRole}
                    </strong>
                    <small>
                      {c.autoRoleText}
                    </small>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      settings
                        .autoRolesEnabled
                    }
                    disabled={
                      !hasFeature(
                        "auto_roles",
                      )
                    }
                    onChange={(
                      event,
                    ) =>
                      patch(
                        "autoRolesEnabled",
                        event
                          .target
                          .checked,
                      )
                    }
                  />
                </header>

                <label>
                  <span>
                    {c.memberRoleId}
                  </span>

                  {resourcesLoading ? (
                    <small className="bot-dashboard-resource-loading">
                      {c.resourcesLoading}
                    </small>
                  ) : (
                    <select
                      value={
                        settings.memberRoleId
                      }
                      onChange={(
                        event,
                      ) =>
                        patch(
                          "memberRoleId",
                          event
                            .target
                            .value,
                        )
                      }
                    >
                      <option value="">
                        {c.chooseRole}
                      </option>

                      {resources.roles.map(
                        (role) => (
                          <option
                            key={
                              role.id
                            }
                            value={
                              role.id
                            }
                          >
                            @{role.name}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                </label>
              </section>

              <section>
                <header>
                  <div>
                    <strong>
                      {c.privateVoice}
                    </strong>
                    <small>
                      {c.privateVoiceText}
                    </small>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      settings
                        .privateVoiceEnabled
                    }
                    disabled={
                      !hasFeature(
                        "private_voice",
                      )
                    }
                    onChange={(
                      event,
                    ) =>
                      patch(
                        "privateVoiceEnabled",
                        event
                          .target
                          .checked,
                      )
                    }
                  />
                </header>
              </section>

              <section className="bot-dashboard-modules">
                <header>
                  <div>
                    <strong>
                      {c.advanced}
                    </strong>
                    <small>
                      {c.advancedText}
                    </small>
                  </div>
                </header>

                <div className="bot-dashboard-module-grid">
                  <article
                    className={
                      `bot-dashboard-module-card${settings.welcomeEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.welcome}
                        </strong>
                        <small>
                          {c.welcomeText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .welcomeEnabled
                          }
                          disabled={
                            !hasFeature(
                              "welcome",
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "welcomeEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.welcomeEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.welcomeChannelId}
                        </span>
                        <select
                          value={
                            settings
                              .welcomeChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "welcomeChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.welcomeTitle}
                        </span>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder={
                            c.welcomeTitlePlaceholder
                          }
                          value={
                            settings
                              .welcomeTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "welcomeTitle",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>
                          {c.welcomeMessage}
                        </span>
                        <textarea
                          rows={4}
                          maxLength={500}
                          placeholder={
                            c.welcomeMessagePlaceholder
                          }
                          value={
                            settings
                              .welcomeMessage
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "welcomeMessage",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <div className="bot-dashboard-inline-options full">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              settings
                                .welcomeMention
                            }
                            onChange={(
                              event,
                            ) =>
                              patch(
                                "welcomeMention",
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />
                          <span>
                            {c.welcomeMention}
                          </span>
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              settings
                                .welcomeShowMemberCount
                            }
                            onChange={(
                              event,
                            ) =>
                              patch(
                                "welcomeShowMemberCount",
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />
                          <span>
                            {c.welcomeShowMemberCount}
                          </span>
                        </label>
                      </div>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card${settings.verificationEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.verification}
                        </strong>
                        <small>
                          {c.verificationText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .verificationEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.verificationEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.verificationPanelChannel}
                        </span>
                        <select
                          value={
                            settings
                              .verificationPanelChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationPanelChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.verificationRole}
                        </span>
                        <select
                          value={
                            settings
                              .verificationRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationRoleId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles
                            .filter(
                              (role) =>
                                role.manageable !==
                                false,
                            )
                            .map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.verificationRemoveRole}
                        </span>
                        <select
                          value={
                            settings
                              .verificationRemoveRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationRemoveRoleId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles
                            .filter(
                              (role) =>
                                role.manageable !==
                                false,
                            )
                            .map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.verificationTitle}
                        </span>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder={
                            c.verificationTitlePlaceholder
                          }
                          value={
                            settings
                              .verificationPanelTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationPanelTitle",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>
                          {c.verificationMessage}
                        </span>
                        <textarea
                          rows={4}
                          maxLength={500}
                          placeholder={
                            c.verificationMessagePlaceholder
                          }
                          value={
                            settings
                              .verificationPanelMessage
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "verificationPanelMessage",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="bot-dashboard-module-action full"
                        onClick={
                          publishVerificationPanel
                        }
                        disabled={
                          busy ===
                            "verification-panel" ||
                          !settings
                            .verificationEnabled ||
                          !settings
                            .verificationPanelChannelId ||
                          !settings
                            .verificationRoleId
                        }
                      >
                        {busy ===
                        "verification-panel"
                          ? c.publishingVerification
                          : c.publishVerification}
                      </button>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card${settings.selfRolesEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.selfRoles}
                        </strong>
                        <small>
                          {c.selfRolesText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .selfRolesEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "selfRolesEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.selfRolesEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.selfRolesPanelChannel}
                        </span>
                        <select
                          value={
                            settings
                              .selfRolesPanelChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "selfRolesPanelChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.selfRolesTitle}
                        </span>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder={
                            c.selfRolesTitlePlaceholder
                          }
                          value={
                            settings
                              .selfRolesPanelTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "selfRolesPanelTitle",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>
                          {c.selfRolesMessage}
                        </span>
                        <textarea
                          rows={3}
                          maxLength={500}
                          placeholder={
                            c.selfRolesMessagePlaceholder
                          }
                          value={
                            settings
                              .selfRolesPanelMessage
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "selfRolesPanelMessage",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <div className="bot-dashboard-role-picker full">
                        <div className="bot-dashboard-role-picker-head">
                          <span>
                            {c.selfRolesAllowed}
                          </span>
                          <small>
                            {c.selectedRoles}:{" "}
                            {
                              settings
                                .selfRoleIds
                                .length
                            }
                            /10
                          </small>
                        </div>

                        <p>
                          {c.selfRolesHint}
                        </p>

                        <div className="bot-dashboard-role-picker-list">
                          {resources.roles
                            .filter(
                              (role) =>
                                role.manageable !==
                                false,
                            )
                            .map(
                            (role) => {
                              const selected =
                                settings
                                  .selfRoleIds
                                  .includes(
                                    role.id,
                                  );

                              return (
                                <label
                                  key={
                                    role.id
                                  }
                                  className={
                                    selected
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      selected
                                    }
                                    disabled={
                                      !selected &&
                                      settings
                                        .selfRoleIds
                                        .length >=
                                        10
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      const next =
                                        event
                                          .target
                                          .checked
                                          ? [
                                              ...settings
                                                .selfRoleIds,
                                              role.id,
                                            ].slice(
                                              0,
                                              10,
                                            )
                                          : settings
                                              .selfRoleIds
                                              .filter(
                                                (
                                                  id,
                                                ) =>
                                                  id !==
                                                  role.id,
                                              );

                                      patch(
                                        "selfRoleIds",
                                        next,
                                      );
                                    }}
                                  />
                                  <span>
                                    @{role.name}
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="bot-dashboard-module-action full"
                        onClick={
                          publishSelfRolesPanel
                        }
                        disabled={
                          busy ===
                            "self-roles-panel" ||
                          !settings
                            .selfRolesEnabled ||
                          !settings
                            .selfRolesPanelChannelId ||
                          !settings
                            .selfRoleIds
                            .length
                        }
                      >
                        {busy ===
                        "self-roles-panel"
                          ? c.publishingSelfRoles
                          : c.publishSelfRoles}
                      </button>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card${settings.moderationEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.moderation}
                        </strong>
                        <small>
                          {c.moderationText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .moderationEnabled
                          }
                          disabled={
                            !hasFeature(
                              "moderation",
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "moderationEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.moderationEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.moderatorRoleId}
                        </span>
                        <select
                          value={
                            settings
                              .moderatorRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "moderatorRoleId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles.map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.logChannelId}
                        </span>
                        <select
                          value={
                            settings
                              .logChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "logChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <div className="bot-dashboard-inline-options full">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              settings
                                .moderationClearEnabled
                            }
                            onChange={(
                              event,
                            ) =>
                              patch(
                                "moderationClearEnabled",
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />
                          <span>
                            {c.moderationClear}
                          </span>
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              settings
                                .moderationTimeoutEnabled
                            }
                            onChange={(
                              event,
                            ) =>
                              patch(
                                "moderationTimeoutEnabled",
                                event
                                  .target
                                  .checked,
                              )
                            }
                          />
                          <span>
                            {c.moderationTimeout}
                          </span>
                        </label>
                      </div>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card${settings.automodEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.automod}
                        </strong>
                        <small>
                          {c.automodText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .automodEnabled
                          }
                          disabled={
                            !hasFeature(
                              "moderation",
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.automodEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-inline-options full">
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .automodSpamEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodSpamEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.automodSpam}
                        </span>
                      </label>

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .automodInvitesEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodInvitesEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.automodInvites}
                        </span>
                      </label>

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .automodMentionEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodMentionEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.automodMentions}
                        </span>
                      </label>

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .automodCapsEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodCapsEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.automodCaps}
                        </span>
                      </label>
                    </div>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.automodAlertChannel}
                        </span>
                        <select
                          value={
                            settings
                              .automodAlertChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodAlertChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.automodMentionLimit}
                        </span>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={
                            settings
                              .automodMentionLimit
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodMentionLimit",
                              Math.max(
                                2,
                                Math.min(
                                  50,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) || 5,
                                ),
                              ),
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>
                          {c.automodWords}
                        </span>
                        <textarea
                          rows={5}
                          maxLength={12000}
                          placeholder={
                            c.automodWordsPlaceholder
                          }
                          value={
                            settings
                              .automodForbiddenWords
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodForbiddenWords",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.automodEscalationCount}
                        </span>
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={
                            settings
                              .automodEscalationCount
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodEscalationCount",
                              Math.max(
                                2,
                                Math.min(
                                  10,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) || 3,
                                ),
                              ),
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.automodEscalationWindow}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={
                            settings
                              .automodEscalationWindowMinutes
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodEscalationWindowMinutes",
                              Math.max(
                                1,
                                Math.min(
                                  1440,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) || 10,
                                ),
                              ),
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.automodTimeoutMinutes}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={40320}
                          value={
                            settings
                              .automodTimeoutMinutes
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "automodTimeoutMinutes",
                              Math.max(
                                1,
                                Math.min(
                                  40320,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) || 10,
                                ),
                              ),
                            )
                          }
                        />
                      </label>

                      <div className="bot-dashboard-automod-actions full">
                        <button
                          type="button"
                          className="bot-dashboard-module-action"
                          onClick={
                            syncAutomod
                          }
                          disabled={
                            busy ===
                            "automod"
                          }
                        >
                          {busy ===
                          "automod"
                            ? c.syncingAutomod
                            : c.syncAutomod}
                        </button>

                        <button
                          type="button"
                          className="bot-dashboard-module-action secondary"
                          onClick={() =>
                            activateGuild(
                              selectedGuild,
                            )
                          }
                          disabled={
                            busy ===
                            `activate:${selectedGuild.guildId}`
                          }
                        >
                          {c.updateBotPermissions}
                        </button>
                      </div>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card${settings.ticketsEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.tickets}
                        </strong>
                        <small>
                          {c.ticketsText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .ticketsEnabled
                          }
                          disabled={
                            !hasFeature(
                              "tickets",
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketsEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.ticketsEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.ticketPanelChannel}
                        </span>
                        <select
                          value={
                            settings
                              .ticketPanelChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketPanelChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.ticketCategory}
                        </span>
                        <select
                          value={
                            settings
                              .ticketCategoryId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketCategoryId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseCategory}
                          </option>
                          {resources.categories.map(
                            (category) => (
                              <option
                                key={
                                  category.id
                                }
                                value={
                                  category.id
                                }
                              >
                                {category.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.ticketSupportRole}
                        </span>
                        <select
                          value={
                            settings
                              .ticketSupportRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketSupportRoleId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles.map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.ticketLogChannel}
                        </span>
                        <select
                          value={
                            settings
                              .ticketLogChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketLogChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.ticketPanelTitle}
                        </span>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder={
                            c.ticketPanelTitlePlaceholder
                          }
                          value={
                            settings
                              .ticketPanelTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketPanelTitle",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.ticketMaxOpen}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={
                            settings
                              .ticketMaxOpenPerUser
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketMaxOpenPerUser",
                              Math.max(
                                1,
                                Math.min(
                                  5,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) || 1,
                                ),
                              ),
                            )
                          }
                        />
                      </label>

                      <label className="full">
                        <span>
                          {c.ticketPanelMessage}
                        </span>
                        <textarea
                          rows={4}
                          maxLength={500}
                          placeholder={
                            c.ticketPanelMessagePlaceholder
                          }
                          value={
                            settings
                              .ticketPanelMessage
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "ticketPanelMessage",
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="bot-dashboard-module-action full"
                        onClick={
                          publishTicketPanel
                        }
                        disabled={
                          busy ===
                            "ticket-panel" ||
                          !settings
                            .ticketsEnabled ||
                          !settings
                            .ticketPanelChannelId
                        }
                      >
                        {busy ===
                        "ticket-panel"
                          ? c.publishingTicketPanel
                          : c.publishTicketPanel}
                      </button>
                    </div>
                  </article>

                  <article className="bot-dashboard-module-card">
                    <header>
                      <div>
                        <strong>
                          {c.serverControls}
                        </strong>
                        <small>
                          {c.serverControlsText}
                        </small>
                      </div>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.adminRoleId}
                        </span>
                        <select
                          value={
                            settings
                              .adminRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "adminRoleId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles.map(
                            (role) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @{role.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.matchChannelId}
                        </span>
                        <select
                          value={
                            settings
                              .matchChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "matchChannelId",
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {c.chooseChannel}
                          </option>
                          {resources.channels.map(
                            (channel) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #{channel.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                  </article>
                </div>
              </section>

              <button
                type="submit"
                className="bot-dashboard-save"
                disabled={
                  busy ===
                  "settings"
                }
              >
                {busy ===
                "settings"
                  ? c.saving
                  : c.save}
              </button>
            </form>

            <section className="bot-dashboard-moderation-center">
              <header className="bot-dashboard-moderation-head">
                <div>
                  <span>
                    MODERATION
                  </span>
                  <h3>
                    {c.moderationCenter}
                  </h3>
                  <p>
                    {c.moderationCenterText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadModerationHistory()
                  }
                  disabled={
                    moderationLoading
                  }
                >
                  {moderationLoading
                    ? c.historyLoading
                    : c.refreshHistory}
                </button>
              </header>

              {moderationError ? (
                <div className="bot-dashboard-alert error">
                  {moderationError}
                </div>
              ) : null}

              <div className="bot-dashboard-moderation-summary">
                <article>
                  <span>
                    {c.totalCases}
                  </span>
                  <strong>
                    {
                      moderationHistory
                        .summary
                        .totalCases
                    }
                  </strong>
                </article>
                <article>
                  <span>
                    {c.activeWarnings}
                  </span>
                  <strong>
                    {
                      moderationHistory
                        .summary
                        .activeWarnings
                    }
                  </strong>
                </article>
                <article>
                  <span>
                    {c.last24h}
                  </span>
                  <strong>
                    {
                      moderationHistory
                        .summary
                        .last24h
                    }
                  </strong>
                </article>
              </div>

              <div className="bot-dashboard-moderation-filters">
                <label>
                  <span>
                    {c.targetUserId}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    value={
                      moderationTarget
                    }
                    onChange={(
                      event,
                    ) =>
                      setModerationTarget(
                        event
                          .target
                          .value
                          .replace(
                            /\D/g,
                            "",
                          ),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    ACTION
                  </span>
                  <select
                    value={
                      moderationAction
                    }
                    onChange={(
                      event,
                    ) =>
                      setModerationAction(
                        event
                          .target
                          .value,
                      )
                    }
                  >
                    <option value="">
                      {c.allActions}
                    </option>
                    <option value="warn">
                      WARN
                    </option>
                    <option value="unwarn">
                      UNWARN
                    </option>
                    <option value="timeout">
                      TIMEOUT
                    </option>
                    <option value="kick">
                      KICK
                    </option>
                    <option value="ban">
                      BAN
                    </option>
                    <option value="unban">
                      UNBAN
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    void loadModerationHistory()
                  }
                  disabled={
                    moderationLoading
                  }
                >
                  {c.refreshHistory}
                </button>

                {(moderationTarget ||
                  moderationAction) ? (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setModerationTarget(
                        "",
                      );
                      setModerationAction(
                        "",
                      );
                      void loadModerationHistory(
                        selectedGuild
                          .guildId,
                        "",
                        "",
                      );
                    }}
                  >
                    {c.clearFilter}
                  </button>
                ) : null}
              </div>

              <div className="bot-dashboard-moderation-columns">
                <article className="bot-dashboard-log-panel">
                  <header>
                    <strong>
                      {c.moderationCases}
                    </strong>
                    <span>
                      {
                        moderationHistory
                          .cases
                          .length
                      }
                    </span>
                  </header>

                  {moderationLoading &&
                  !moderationHistory
                    .cases.length ? (
                    <p className="bot-dashboard-log-empty">
                      {c.historyLoading}
                    </p>
                  ) : moderationHistory
                      .cases
                      .length ? (
                    <div className="bot-dashboard-case-list">
                      {moderationHistory.cases.map(
                        (item) => {
                          const targetName =
                            item.metadata
                              ?.target_name ||
                            item
                              .target_user_id;
                          const moderatorName =
                            item.metadata
                              ?.moderator_name ||
                            item
                              .moderator_user_id;

                          return (
                            <article
                              key={
                                item.id
                              }
                              className="bot-dashboard-case"
                            >
                              <header>
                                <div>
                                  <b>
                                    #
                                    {
                                      item.id
                                    }
                                  </b>
                                  <span
                                    className={
                                      `action ${item.action}`
                                    }
                                  >
                                    {String(
                                      item.action ||
                                        "",
                                    ).toUpperCase()}
                                  </span>
                                  <span
                                    className={
                                      `status ${item.status}`
                                    }
                                  >
                                    {String(
                                      item.status ||
                                        "",
                                    ).toUpperCase()}
                                  </span>
                                </div>
                                <time>
                                  {formatDateTime(
                                    item
                                      .created_at,
                                    language,
                                  )}
                                </time>
                              </header>

                              <div className="bot-dashboard-case-data">
                                <span>
                                  {c.caseTarget}
                                </span>
                                <button
                                  type="button"
                                  title={
                                    c.filterByUser
                                  }
                                  onClick={() => {
                                    setModerationTarget(
                                      item
                                        .target_user_id,
                                    );
                                    void loadModerationHistory(
                                      selectedGuild
                                        .guildId,
                                      item
                                        .target_user_id,
                                      moderationAction,
                                    );
                                  }}
                                >
                                  {targetName} ·{" "}
                                  {
                                    item
                                      .target_user_id
                                  }
                                </button>

                                <span>
                                  {c.caseModerator}
                                </span>
                                <strong>
                                  {moderatorName ||
                                    "—"}
                                </strong>

                                <span>
                                  {c.caseReason}
                                </span>
                                <strong>
                                  {item.reason ||
                                    "—"}
                                </strong>

                                {item
                                  .duration_minutes ? (
                                  <>
                                    <span>
                                      {c.caseDuration}
                                    </span>
                                    <strong>
                                      {
                                        item
                                          .duration_minutes
                                      }{" "}
                                      {c.caseMinutes}
                                    </strong>
                                  </>
                                ) : null}
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <p className="bot-dashboard-log-empty">
                      {c.noModerationCases}
                    </p>
                  )}
                </article>

                <article className="bot-dashboard-log-panel">
                  <header>
                    <strong>
                      {c.auditLog}
                    </strong>
                    <span>
                      {
                        moderationHistory
                          .audit
                          .length
                      }
                    </span>
                  </header>

                  <div className="bot-dashboard-audit-list">
                    {moderationHistory.audit.map(
                      (item) => (
                        <article
                          key={
                            item.id
                          }
                        >
                          <div>
                            <b>
                              {
                                item
                                  .event_type
                              }
                            </b>
                            <time>
                              {formatDateTime(
                                item
                                  .created_at,
                                language,
                              )}
                            </time>
                          </div>
                          <code>
                            {JSON.stringify(
                              item.payload ||
                                {},
                            ).slice(
                              0,
                              500,
                            )}
                          </code>
                        </article>
                      ),
                    )}
                  </div>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <div className="bot-dashboard-servers">
            <div className="bot-dashboard-section-head">
              <div>
                <span>
                  DISCORD
                </span>
                <h2>
                  {c.servers}
                </h2>
              </div>

              {data
                ?.discordAccount ? (
                <span className="bot-dashboard-linked">
                  ✓{" "}
                  {c.discordLinked}
                </span>
              ) : null}
            </div>

            {data?.guilds
              ?.length ? (
              <div className="bot-dashboard-server-grid">
                {data.guilds.map(
                  (guild) => {
                    const activating =
                      busy ===
                      `activate:${guild.guildId}`;

                    const verifying =
                      busy ===
                      `verify:${guild.guildId}`;

                    return (
                      <article
                        key={
                          guild.guildId
                        }
                        className="bot-dashboard-server-card"
                      >
                        <div className="bot-dashboard-server-main">
                          <div className="bot-dashboard-guild-icon">
                            {guild.iconUrl ? (
                              <img
                                src={
                                  guild.iconUrl
                                }
                                alt=""
                              />
                            ) : (
                              <span>
                                {guild.name
                                  .slice(
                                    0,
                                    2,
                                  )
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <h3>
                              {
                                guild.name
                              }
                            </h3>
                            <p>
                              {
                                guild.guildId
                              }
                            </p>
                          </div>
                        </div>

                        <div className="bot-dashboard-server-state">
                          <span
                            className={
                              guild.installed
                                ? "ok"
                                : ""
                            }
                          >
                            {guild.installed
                              ? c.connected
                              : c.notConnected}
                          </span>

                          <span
                            className={
                              guild.licensed
                                ? "ok"
                                : ""
                            }
                          >
                            {guild.licensed
                              ? c.licensed
                              : c.noLicense}
                          </span>

                          {guild.memberCount !==
                          null ? (
                            <small>
                              {
                                guild.memberCount
                              }{" "}
                              {c.members}
                            </small>
                          ) : null}
                        </div>

                        <div className="bot-dashboard-server-actions">
                          {!guild.licensed ? (
                            <button
                              type="button"
                              onClick={() =>
                                activateGuild(
                                  guild,
                                )
                              }
                              disabled={
                                activating
                              }
                            >
                              {c.license}
                            </button>
                          ) : !guild.installed ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  activateGuild(
                                    guild,
                                  )
                                }
                                disabled={
                                  activating
                                }
                              >
                                {c.addBot}
                              </button>

                              <button
                                type="button"
                                className="secondary"
                                onClick={() =>
                                  verifyGuild(
                                    guild,
                                  )
                                }
                                disabled={
                                  verifying
                                }
                              >
                                {c.verify}
                              </button>

                              {guild.guildId !==
                              "1334264628695404556" ? (
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    releaseLicense(
                                      guild,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    `release:${guild.guildId}`
                                  }
                                >
                                  {c.releaseLicense}
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openSettings(
                                    guild,
                                  )
                                }
                              >
                                {c.manage}
                              </button>

                              <button
                                type="button"
                                className="secondary"
                                onClick={() =>
                                  verifyGuild(
                                    guild,
                                  )
                                }
                                disabled={
                                  verifying
                                }
                              >
                                {c.verify}
                              </button>

                              {guild.guildId !==
                              "1334264628695404556" ? (
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    releaseLicense(
                                      guild,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    `release:${guild.guildId}`
                                  }
                                >
                                  {c.releaseLicense}
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="bot-dashboard-empty">
                <p>
                  {c.noServers}
                </p>

                <button
                  type="button"
                  onClick={
                    connectDiscord
                  }
                  disabled={
                    !data
                      ?.oauthConfigured ||
                    busy ===
                      "oauth"
                  }
                >
                  {c.connectDiscord}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
