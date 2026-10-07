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
  securityEnabled: false,
  securityAlertChannelId: "",
  securityQuarantineRoleId: "",
  securityJoinBurstThreshold: 8,
  securityJoinBurstWindowSeconds: 60,
  securityMinAccountAgeHours: 24,
  securityAutoQuarantine: false,
  securityEmergencyMode: false,
  securityIgnoreBots: true,
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

const EMPTY_PUBLICATIONS = {
  giveaways: [],
  scheduled: [],
};

const EMPTY_STAFF_CENTER = {
  permissionCatalog: [],
  presets: {},
  policies: [],
  recentAccess: [],
};

const EMPTY_STAFF_DRAFT = {
  roleId: "",
  label: "",
  preset: "moderator",
  permissionKeys: [],
  enabled: true,
};

const EMPTY_INCIDENT_CENTER = {
  windowDays: 14,
  summary: {
    events: 0,
    open: 0,
    reviewing: 0,
    resolved: 0,
    critical: 0,
  },
  events: [],
  incidents: [],
};

const EMPTY_SECURITY = {
  summary: {
    events: 0,
    warnings: 0,
    critical: 0,
    quarantined: 0,
    raidBursts: 0,
    newAccounts: 0,
  },
  events: [],
};

const EMPTY_COMMAND_CENTER = {
  summary: {
    commands: 0,
    enabled: 0,
    customized: 0,
    invocations: 0,
    allowed: 0,
    denied: 0,
    errors: 0,
    uniqueUsers: 0,
  },
  commands: [],
  timeline: [],
  recentUsage: [],
};

const EMPTY_CONFIG_HISTORY = {
  current: {
    updatedAt: null,
  },
  versions: [],
};

const EMPTY_DIAGNOSTICS = {
  overallStatus: "warning",
  checkedAt: null,
  summary: {
    ok: 0,
    warning: 0,
    error: 0,
  },
  checks: [],
  permissions: [],
  worker: null,
  bot: null,
};

const EMPTY_ANALYTICS = {
  summary: {
    currentMembers: null,
    joins: 0,
    leaves: 0,
    netGrowth: 0,
    moderationCases: 0,
    activeWarnings: 0,
    ticketsCreated: 0,
    openTickets: 0,
    giveaways: 0,
    giveawayEntries: 0,
    scheduledMessages: 0,
    sentMessages: 0,
    verified: 0,
    selfRoleChanges: 0,
    automodActions: 0,
    recruitmentEvents: 0,
  },
  timeline: [],
  topSelfRoles: [],
  recentActivity: [],
  health: {
    latest: null,
    uptime24h: null,
    avgPing24h: null,
    samples24h: 0,
  },
};

const EMPTY_GIVEAWAY_DRAFT = {
  channelId: "",
  prize: "",
  description: "",
  requiredRoleId: "",
  winnerCount: 1,
  endsAt: "",
};

const EMPTY_SCHEDULE_DRAFT = {
  channelId: "",
  content: "",
  embedTitle: "",
  embedDescription: "",
  scheduledAt: "",
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
    controlCenter: "ISTe Control Center",
    tabOverview: "Огляд",
    tabAnalytics: "Аналітика",
    tabCommands: "Команди",
    tabSecurity: "Безпека",
    tabIncidents: "Інциденти",
    tabStaff: "Staff",
    tabOnboarding: "Онбординг",
    tabModeration: "Модерація",
    tabSupport: "Підтримка",
    tabPublishing: "Публікації",
    tabSystem: "Система",
    tabDiagnostics: "Діагностика",
    overviewTitle: "Стан модулів",
    overviewText:
      "Швидкий огляд конфігурації. Обери розділ, щоб перейти до його налаштувань.",
    analyticsTitle: "Analytics & Activity",
    analyticsText:
      "Реальна активність Discord-сервера, модулів ISTe та стан worker за вибраний період.",
    analytics7d: "7 днів",
    analytics30d: "30 днів",
    refreshAnalytics: "Оновити",
    analyticsLoading: "Завантаження...",
    analyticsError: "Не вдалося завантажити Discord analytics.",
    commandCenterTitle: "Slash Command Center",
    commandCenterText:
      "Керуй доступністю slash-команд окремо для цього Discord-сервера: roles, channels, cooldown та usage.",
    commandCenterSave: "Зберегти команди",
    commandCenterSaving: "Збереження...",
    commandCenterSaved: "Налаштування slash-команд збережено.",
    commandCenterReset: "Скинути overrides",
    commandCenterResetConfirm:
      "Скинути всі налаштування команд до стандартних? Історія usage залишиться.",
    commandCenterResetDone: "Overrides команд скинуто.",
    commandCenterRefresh: "Оновити",
    commandCenterLoading: "Завантаження...",
    commandCenterError: "Не вдалося завантажити Command Center.",
    commandSearch: "Пошук команди",
    commandSearchPlaceholder: "Наприклад: warn, room, matches",
    commandCategory: "Категорія",
    commandCategoryAll: "Усі",
    commandCategoryUtility: "Утиліти",
    commandCategoryCommunity: "Спільнота",
    commandCategoryModeration: "Модерація",
    commandCategoryIste: "ISTesport",
    commandCategoryRecruitment: "Recruitment",
    commandEnabled: "Увімкнена",
    commandDisabled: "Вимкнена",
    commandConfigure: "Налаштувати",
    commandClose: "Закрити",
    commandCooldown: "Cooldown, секунд",
    commandRoles: "Дозволені ролі",
    commandChannels: "Дозволені канали",
    commandRestrictionHint:
      "Нічого не вибрано = доступно для всіх ролей або каналів.",
    commandInvocations: "Викликів · 7d",
    commandUniqueUsers: "Користувачів",
    commandDenied: "Заблоковано",
    commandErrors: "Помилок",
    commandCustomized: "Overrides",
    commandEnabledCount: "Увімкнено",
    commandRecentUsage: "Останні виклики",
    commandNoUsage: "Usage журнал поки порожній.",
    commandNoResults: "Команд за цим фільтром немає.",
    commandOutcomeAllowed: "ALLOWED",
    commandOutcomeDenied: "DENIED",
    commandOutcomeError: "ERROR",
    commandLastUsed: "Останній виклик",
    commandUses: "викликів",
    commandSelectMultiple: "Ctrl / Cmd для кількох значень",
    securityTitle: "Security & Raid Protection",
    securityText:
      "Захист від raid join bursts і підозріло нових Discord-акаунтів. За замовчуванням лише спостерігає.",
    securityModule: "Raid Guard",
    securityModuleText:
      "Правила перевірки нових учасників та автоматична quarantine дія.",
    securityEnabledLabel: "Увімкнути Security Center",
    securityAlertChannel: "Канал security alerts",
    securityQuarantineRole: "Quarantine роль",
    securityJoinThreshold: "Join burst threshold",
    securityJoinWindow: "Вікно burst, секунд",
    securityAccountAge: "Мінімальний вік акаунта, годин",
    securityAutoQuarantine: "Автоматичний quarantine підозрілих входів",
    securityEmergencyMode: "Emergency mode",
    securityEmergencyText:
      "Усі нові учасники проходять quarantine, поки режим активний.",
    securityIgnoreBots: "Ігнорувати bot accounts",
    securityObserveHint:
      "Auto quarantine вимкнений = бот лише зафіксує подію та надішле alert.",
    securityEvents: "Security events · 7d",
    securityWarnings: "Warnings",
    securityCritical: "Critical",
    securityQuarantined: "Quarantined",
    securityRaidBursts: "Raid bursts",
    securityNewAccounts: "Нові акаунти",
    securityRecentEvents: "Останні security events",
    securityNoEvents: "Підозрілих подій поки немає.",
    securityLoading: "Завантаження...",
    securityError: "Не вдалося завантажити Security Center.",
    securityActionObserved: "OBSERVED",
    securityActionQuarantine: "QUARANTINE",
    incidentTitle: "Audit & Incident Center",
    incidentText:
      "Єдина стрічка Discord подій та робочі incidents для staff review, нотаток і закриття.",
    incidentRefresh: "Оновити",
    incidentLoading: "Завантаження...",
    incidentError: "Не вдалося завантажити Incident Center.",
    incidentEvents: "Події · 14d",
    incidentOpen: "Open",
    incidentReviewing: "Reviewing",
    incidentResolved: "Resolved",
    incidentCritical: "Critical",
    incidentEventFeed: "Event feed",
    incidentTracked: "Tracked incidents",
    incidentSourceAll: "Усі джерела",
    incidentSourceAudit: "Audit",
    incidentSourceSecurity: "Security",
    incidentSourceModeration: "Moderation",
    incidentSourceCommand: "Commands",
    incidentSourceTicket: "Tickets",
    incidentStatusAll: "Усі статуси",
    incidentCreate: "Створити incident",
    incidentCreating: "Створення...",
    incidentAlreadyTracked: "TRACKED",
    incidentNoEvents: "Подій за вибраним фільтром немає.",
    incidentNoTracked: "Активних incidents поки немає.",
    incidentStatus: "Статус",
    incidentSeverity: "Severity",
    incidentResolution: "Resolution note",
    incidentResolutionPlaceholder: "Що було перевірено та як incident закрито",
    incidentSave: "Зберегти incident",
    incidentSaving: "Збереження...",
    incidentNotes: "Внутрішні нотатки",
    incidentNotePlaceholder: "Додати контекст для staff...",
    incidentAddNote: "Додати нотатку",
    incidentAddingNote: "Додавання...",
    incidentCreated: "Incident створено.",
    incidentUpdated: "Incident оновлено.",
    incidentNoteAdded: "Нотатку додано.",
    incidentSubject: "Subject",
    incidentActor: "Actor",
    incidentChannel: "Channel",
    staffTitle: "Staff & Permissions",
    staffText:
      "Делегуй Control Center через реальні Discord ролі. Зняття ролі в Discord одразу забирає доступ.",
    staffPolicies: "Role policies",
    staffRole: "Discord роль",
    staffLabel: "Назва policy",
    staffLabelPlaceholder: "Наприклад: Senior Moderator",
    staffPreset: "Preset",
    staffPresetModerator: "Moderator",
    staffPresetSupport: "Support",
    staffPresetRecruiter: "Recruiter",
    staffPresetSecurity: "Security",
    staffPresetContent: "Content Manager",
    staffPresetAdministrator: "Administrator",
    staffPermissions: "Permissions",
    staffSavePolicy: "Зберегти policy",
    staffSaving: "Збереження...",
    staffDelete: "Видалити",
    staffEdit: "Редагувати",
    staffCancelEdit: "Скасувати",
    staffEnabled: "Policy активна",
    staffNoPolicies: "Staff policies ще не створені.",
    staffAccessAudit: "Access audit",
    staffNoAudit: "Delegated access ще не використовувався.",
    staffAllowed: "ALLOWED",
    staffDenied: "DENIED",
    staffPolicySaved: "Staff policy збережено.",
    staffPolicyDeleted: "Staff policy видалено.",
    staffDeleteConfirm: "Видалити staff policy для цієї Discord ролі?",
    staffLoading: "Завантаження...",
    staffError: "Не вдалося завантажити Staff & Permissions.",
    staffDangerHint:
      "Danger permissions не входять у звичайні пресети: Emergency Mode та Configuration Restore треба додавати вручну.",
    diagnosticsTitle: "Diagnostics & Alerts",
    diagnosticsText:
      "Перевірка Discord permissions, ролей, каналів, worker runtime та помилок активних модулів.",
    diagnosticsRefresh: "Перевірити знову",
    diagnosticsLoading: "Перевірка...",
    diagnosticsError: "Не вдалося виконати Discord diagnostics.",
    diagnosticsHealthy: "Система справна",
    diagnosticsWarning: "Потрібна увага",
    diagnosticsCritical: "Є критичні проблеми",
    diagnosticsOk: "OK",
    diagnosticsWarnings: "WARNINGS",
    diagnosticsErrors: "ERRORS",
    diagnosticsChecks: "Перевірки",
    diagnosticsPermissions: "Discord permissions",
    diagnosticsRequired: "REQUIRED",
    diagnosticsOptional: "OPTIONAL",
    diagnosticsGranted: "GRANTED",
    diagnosticsMissing: "MISSING",
    diagnosticsActions: "Швидкі дії",
    diagnosticsCheckedAt: "Остання перевірка",
    diagnosticsNoIssues: "Додаткових деталей немає.",
    currentMembersMetric: "Учасники",
    netGrowthMetric: "Зміна",
    joinsMetric: "Приєдналися",
    leavesMetric: "Вийшли",
    moderationMetric: "Moderation cases",
    ticketsMetric: "Tickets створено",
    openTicketsMetric: "Відкриті tickets",
    verifiedMetric: "Verification",
    selfRolesMetric: "Self role зміни",
    automodMetric: "AutoMod",
    giveawayEntriesMetric: "Giveaway entries",
    sentMessagesMetric: "Повідомлень відправлено",
    activityChart: "Активність за днями",
    activityChartText:
      "Сумарні події модулів та moderation cases за київським календарем.",
    topSelfRoles: "Популярні self roles",
    noSelfRoles: "Ще немає даних про self roles.",
    recentActivity: "Останні події",
    noActivity: "Подій за цей період ще немає.",
    workerHealth: "Worker Health",
    workerOnline: "ONLINE",
    workerStale: "STALE",
    workerWaiting: "WAITING",
    workerPing: "Discord ping",
    workerUptime: "Worker uptime",
    workerUptime24: "Доступність 24h",
    workerGuilds: "Серверів",
    healthSamples: "Health samples",
    activityEvents: "подій",
    activeWarningsMetric: "Активні warn",
    configured: "налаштовано",
    enabledShort: "Увімкнено",
    disabledShort: "Вимкнено",
    discordPreview: "Discord preview",
    saveChanges: "Зберегти зміни",
    savingChanges: "Збереження…",
    currentSection: "Поточний розділ",
    publishingTitle: "Discord публікації",
    publishingText:
      "Створюй розіграші та плануй повідомлення. Worker ISTe опублікує все автоматично за київським часом.",
    refreshPublications: "Оновити",
    publicationsLoading: "Завантаження...",
    giveawayBuilder: "Новий Giveaway",
    giveawayBuilderText:
      "Кнопка участі, обов'язкова роль, кількість переможців та автоматичне завершення.",
    giveawayChannel: "Канал розіграшу",
    giveawayPrize: "Приз",
    giveawayPrizePlaceholder: "Наприклад: Discord Nitro",
    giveawayDescription: "Опис",
    giveawayDescriptionPlaceholder:
      "Умови або короткий опис розіграшу.",
    giveawayRequiredRole: "Обов'язкова роль",
    giveawayWinnerCount: "Кількість переможців",
    giveawayEndsAt: "Завершення",
    kyivTime: "Europe/Kyiv",
    createGiveaway: "Запустити Giveaway",
    creatingGiveaway: "Створення...",
    giveawayCreated: "Giveaway опубліковано.",
    activeGiveaways: "Giveaways",
    noGiveaways: "Розіграшів поки немає.",
    participants: "учасників",
    reroll: "Reroll",
    cancelGiveaway: "Скасувати",
    cancelGiveawayConfirm: "Скасувати цей розіграш?",
    rerollConfirm: "Обрати нових переможців?",
    scheduledBuilder: "Scheduled Messages",
    scheduledBuilderText:
      "Вкажи канал, дату й контент. ISTe Bot відправить повідомлення автоматично.",
    messageChannel: "Канал",
    messageContent: "Текст повідомлення",
    messageContentPlaceholder:
      "Звичайний текст над Embed, необов'язково.",
    embedTitle: "Embed заголовок",
    embedDescription: "Embed текст",
    scheduledAt: "Дата та час",
    scheduleMessage: "Запланувати",
    schedulingMessage: "Планування...",
    scheduledCreated: "Повідомлення заплановано.",
    scheduledMessages: "Черга повідомлень",
    noScheduled: "Запланованих повідомлень немає.",
    cancelScheduled: "Скасувати",
    cancelScheduledConfirm: "Скасувати цю заплановану публікацію?",
    publicationStatus: "Статус",
    statusActive: "ACTIVE",
    statusEnded: "ENDED",
    statusCancelled: "CANCELLED",
    statusScheduled: "SCHEDULED",
    statusSent: "SENT",
    statusFailed: "FAILED",
    publicationError:
      "Не вдалося завантажити або змінити Discord публікації.",
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
    configHistory: "Configuration History",
    configHistoryText:
      "Автоматичні rollback points перед Save та ручні snapshots для безпечного відновлення конфігурації.",
    configCurrent: "Поточна конфігурація",
    configVersions: "Точки відновлення",
    configSnapshotLabel: "Назва snapshot",
    configSnapshotPlaceholder: "Наприклад: Перед зміною AutoMod",
    configCreateSnapshot: "Створити snapshot",
    configCreatingSnapshot: "Створення...",
    configSnapshotCreated: "Snapshot конфігурації створено.",
    configRestore: "Відновити",
    configRestoring: "Відновлення...",
    configRestoreConfirm:
      "Відновити цю версію? Поточна конфігурація автоматично буде збережена як rollback point.",
    configRestored:
      "Конфігурацію відновлено. Поточний стан збережено як rollback point.",
    configHistoryEmpty: "Історія конфігурації поки порожня.",
    configHistoryError: "Не вдалося завантажити історію конфігурації.",
    configSourceSave: "AUTO",
    configSourceManual: "MANUAL",
    configSourceRestore: "ROLLBACK",
    configChanged: "змін",
    configNoDifference: "Без відмінностей від поточної",
    configGroupGeneral: "Основне",
    configGroupOnboarding: "Онбординг",
    configGroupModeration: "Модерація",
    configGroupSecurity: "Безпека",
    configGroupSupport: "Підтримка",
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
    requiresPlan: "Функція недоступна для цього акаунта",
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
    controlCenter: "ISTe Control Center",
    tabOverview: "Overview",
    tabAnalytics: "Analytics",
    tabCommands: "Commands",
    tabSecurity: "Security",
    tabIncidents: "Incidents",
    tabStaff: "Staff",
    tabOnboarding: "Onboarding",
    tabModeration: "Moderation",
    tabSupport: "Support",
    tabPublishing: "Publishing",
    tabSystem: "System",
    tabDiagnostics: "Diagnostics",
    overviewTitle: "Module status",
    overviewText:
      "Quick configuration overview. Choose a section to open its settings.",
    analyticsTitle: "Analytics & Activity",
    analyticsText:
      "Real Discord server activity, ISTe module usage and worker health for the selected period.",
    analytics7d: "7 days",
    analytics30d: "30 days",
    refreshAnalytics: "Refresh",
    analyticsLoading: "Loading...",
    analyticsError: "Could not load Discord analytics.",
    commandCenterTitle: "Slash Command Center",
    commandCenterText:
      "Control slash command availability for this Discord server: roles, channels, cooldown and usage.",
    commandCenterSave: "Save commands",
    commandCenterSaving: "Saving...",
    commandCenterSaved: "Slash command settings saved.",
    commandCenterReset: "Reset overrides",
    commandCenterResetConfirm:
      "Reset all command settings to defaults? Usage history will be kept.",
    commandCenterResetDone: "Command overrides reset.",
    commandCenterRefresh: "Refresh",
    commandCenterLoading: "Loading...",
    commandCenterError: "Could not load Command Center.",
    commandSearch: "Search commands",
    commandSearchPlaceholder: "Example: warn, room, matches",
    commandCategory: "Category",
    commandCategoryAll: "All",
    commandCategoryUtility: "Utilities",
    commandCategoryCommunity: "Community",
    commandCategoryModeration: "Moderation",
    commandCategoryIste: "ISTesport",
    commandCategoryRecruitment: "Recruitment",
    commandEnabled: "Enabled",
    commandDisabled: "Disabled",
    commandConfigure: "Configure",
    commandClose: "Close",
    commandCooldown: "Cooldown, seconds",
    commandRoles: "Allowed roles",
    commandChannels: "Allowed channels",
    commandRestrictionHint:
      "Nothing selected = available to all roles or channels.",
    commandInvocations: "Invocations · 7d",
    commandUniqueUsers: "Users",
    commandDenied: "Denied",
    commandErrors: "Errors",
    commandCustomized: "Overrides",
    commandEnabledCount: "Enabled",
    commandRecentUsage: "Recent usage",
    commandNoUsage: "Usage log is empty.",
    commandNoResults: "No commands match this filter.",
    commandOutcomeAllowed: "ALLOWED",
    commandOutcomeDenied: "DENIED",
    commandOutcomeError: "ERROR",
    commandLastUsed: "Last used",
    commandUses: "uses",
    commandSelectMultiple: "Ctrl / Cmd for multiple values",
    securityTitle: "Security & Raid Protection",
    securityText:
      "Protect against raid join bursts and suspiciously new Discord accounts. Observation only by default.",
    securityModule: "Raid Guard",
    securityModuleText:
      "New-member risk checks and optional automatic quarantine action.",
    securityEnabledLabel: "Enable Security Center",
    securityAlertChannel: "Security alert channel",
    securityQuarantineRole: "Quarantine role",
    securityJoinThreshold: "Join burst threshold",
    securityJoinWindow: "Burst window, seconds",
    securityAccountAge: "Minimum account age, hours",
    securityAutoQuarantine: "Auto quarantine suspicious joins",
    securityEmergencyMode: "Emergency mode",
    securityEmergencyText:
      "Every new member is quarantined while emergency mode is active.",
    securityIgnoreBots: "Ignore bot accounts",
    securityObserveHint:
      "Auto quarantine off = ISTe only records the event and sends an alert.",
    securityEvents: "Security events · 7d",
    securityWarnings: "Warnings",
    securityCritical: "Critical",
    securityQuarantined: "Quarantined",
    securityRaidBursts: "Raid bursts",
    securityNewAccounts: "New accounts",
    securityRecentEvents: "Recent security events",
    securityNoEvents: "No suspicious events yet.",
    securityLoading: "Loading...",
    securityError: "Could not load Security Center.",
    securityActionObserved: "OBSERVED",
    securityActionQuarantine: "QUARANTINE",
    incidentTitle: "Audit & Incident Center",
    incidentText:
      "Unified Discord event feed with tracked staff incidents, notes, review and resolution.",
    incidentRefresh: "Refresh",
    incidentLoading: "Loading...",
    incidentError: "Could not load Incident Center.",
    incidentEvents: "Events · 14d",
    incidentOpen: "Open",
    incidentReviewing: "Reviewing",
    incidentResolved: "Resolved",
    incidentCritical: "Critical",
    incidentEventFeed: "Event feed",
    incidentTracked: "Tracked incidents",
    incidentSourceAll: "All sources",
    incidentSourceAudit: "Audit",
    incidentSourceSecurity: "Security",
    incidentSourceModeration: "Moderation",
    incidentSourceCommand: "Commands",
    incidentSourceTicket: "Tickets",
    incidentStatusAll: "All statuses",
    incidentCreate: "Create incident",
    incidentCreating: "Creating...",
    incidentAlreadyTracked: "TRACKED",
    incidentNoEvents: "No events match this filter.",
    incidentNoTracked: "No tracked incidents yet.",
    incidentStatus: "Status",
    incidentSeverity: "Severity",
    incidentResolution: "Resolution note",
    incidentResolutionPlaceholder: "What was reviewed and how the incident was resolved",
    incidentSave: "Save incident",
    incidentSaving: "Saving...",
    incidentNotes: "Internal notes",
    incidentNotePlaceholder: "Add context for staff...",
    incidentAddNote: "Add note",
    incidentAddingNote: "Adding...",
    incidentCreated: "Incident created.",
    incidentUpdated: "Incident updated.",
    incidentNoteAdded: "Note added.",
    incidentSubject: "Subject",
    incidentActor: "Actor",
    incidentChannel: "Channel",
    staffTitle: "Staff & Permissions",
    staffText:
      "Delegate Control Center access through live Discord roles. Removing the role in Discord removes access immediately.",
    staffPolicies: "Role policies",
    staffRole: "Discord role",
    staffLabel: "Policy label",
    staffLabelPlaceholder: "Example: Senior Moderator",
    staffPreset: "Preset",
    staffPresetModerator: "Moderator",
    staffPresetSupport: "Support",
    staffPresetRecruiter: "Recruiter",
    staffPresetSecurity: "Security",
    staffPresetContent: "Content Manager",
    staffPresetAdministrator: "Administrator",
    staffPermissions: "Permissions",
    staffSavePolicy: "Save policy",
    staffSaving: "Saving...",
    staffDelete: "Delete",
    staffEdit: "Edit",
    staffCancelEdit: "Cancel",
    staffEnabled: "Policy enabled",
    staffNoPolicies: "No staff policies yet.",
    staffAccessAudit: "Access audit",
    staffNoAudit: "Delegated access has not been used yet.",
    staffAllowed: "ALLOWED",
    staffDenied: "DENIED",
    staffPolicySaved: "Staff policy saved.",
    staffPolicyDeleted: "Staff policy deleted.",
    staffDeleteConfirm: "Delete the staff policy for this Discord role?",
    staffLoading: "Loading...",
    staffError: "Could not load Staff & Permissions.",
    staffDangerHint:
      "Danger permissions are not included in normal presets. Emergency Mode and Configuration Restore must be added manually.",
    diagnosticsTitle: "Diagnostics & Alerts",
    diagnosticsText:
      "Check Discord permissions, roles, channels, worker runtime and active module errors.",
    diagnosticsRefresh: "Run check again",
    diagnosticsLoading: "Checking...",
    diagnosticsError: "Could not run Discord diagnostics.",
    diagnosticsHealthy: "System healthy",
    diagnosticsWarning: "Needs attention",
    diagnosticsCritical: "Critical issues found",
    diagnosticsOk: "OK",
    diagnosticsWarnings: "WARNINGS",
    diagnosticsErrors: "ERRORS",
    diagnosticsChecks: "Checks",
    diagnosticsPermissions: "Discord permissions",
    diagnosticsRequired: "REQUIRED",
    diagnosticsOptional: "OPTIONAL",
    diagnosticsGranted: "GRANTED",
    diagnosticsMissing: "MISSING",
    diagnosticsActions: "Quick actions",
    diagnosticsCheckedAt: "Last checked",
    diagnosticsNoIssues: "No additional details.",
    currentMembersMetric: "Members",
    netGrowthMetric: "Net growth",
    joinsMetric: "Joined",
    leavesMetric: "Left",
    moderationMetric: "Moderation cases",
    ticketsMetric: "Tickets created",
    openTicketsMetric: "Open tickets",
    verifiedMetric: "Verification",
    selfRolesMetric: "Self role changes",
    automodMetric: "AutoMod",
    giveawayEntriesMetric: "Giveaway entries",
    sentMessagesMetric: "Messages sent",
    activityChart: "Daily activity",
    activityChartText:
      "Combined module events and moderation cases using the Kyiv calendar.",
    topSelfRoles: "Popular self roles",
    noSelfRoles: "No self role activity yet.",
    recentActivity: "Recent activity",
    noActivity: "No activity for this period yet.",
    workerHealth: "Worker Health",
    workerOnline: "ONLINE",
    workerStale: "STALE",
    workerWaiting: "WAITING",
    workerPing: "Discord ping",
    workerUptime: "Worker uptime",
    workerUptime24: "24h availability",
    workerGuilds: "Guilds",
    healthSamples: "Health samples",
    activityEvents: "events",
    activeWarningsMetric: "Active warnings",
    configured: "configured",
    enabledShort: "Enabled",
    disabledShort: "Disabled",
    discordPreview: "Discord preview",
    saveChanges: "Save changes",
    savingChanges: "Saving…",
    currentSection: "Current section",
    publishingTitle: "Discord publishing",
    publishingText:
      "Create giveaways and schedule messages. The ISTe worker publishes them automatically using Kyiv time.",
    refreshPublications: "Refresh",
    publicationsLoading: "Loading...",
    giveawayBuilder: "New Giveaway",
    giveawayBuilderText:
      "Participation button, required role, winner count and automatic ending.",
    giveawayChannel: "Giveaway channel",
    giveawayPrize: "Prize",
    giveawayPrizePlaceholder: "Example: Discord Nitro",
    giveawayDescription: "Description",
    giveawayDescriptionPlaceholder:
      "Rules or a short giveaway description.",
    giveawayRequiredRole: "Required role",
    giveawayWinnerCount: "Winner count",
    giveawayEndsAt: "Ends at",
    kyivTime: "Europe/Kyiv",
    createGiveaway: "Launch Giveaway",
    creatingGiveaway: "Creating...",
    giveawayCreated: "Giveaway published.",
    activeGiveaways: "Giveaways",
    noGiveaways: "No giveaways yet.",
    participants: "participants",
    reroll: "Reroll",
    cancelGiveaway: "Cancel",
    cancelGiveawayConfirm: "Cancel this giveaway?",
    rerollConfirm: "Pick new winners?",
    scheduledBuilder: "Scheduled Messages",
    scheduledBuilderText:
      "Choose a channel, date and content. ISTe Bot will send it automatically.",
    messageChannel: "Channel",
    messageContent: "Message content",
    messageContentPlaceholder:
      "Optional plain text above the embed.",
    embedTitle: "Embed title",
    embedDescription: "Embed description",
    scheduledAt: "Date and time",
    scheduleMessage: "Schedule",
    schedulingMessage: "Scheduling...",
    scheduledCreated: "Message scheduled.",
    scheduledMessages: "Message queue",
    noScheduled: "No scheduled messages.",
    cancelScheduled: "Cancel",
    cancelScheduledConfirm: "Cancel this scheduled publication?",
    publicationStatus: "Status",
    statusActive: "ACTIVE",
    statusEnded: "ENDED",
    statusCancelled: "CANCELLED",
    statusScheduled: "SCHEDULED",
    statusSent: "SENT",
    statusFailed: "FAILED",
    publicationError:
      "Could not load or update Discord publications.",
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
    configHistory: "Configuration History",
    configHistoryText:
      "Automatic rollback points before Save and manual snapshots for safe configuration recovery.",
    configCurrent: "Current configuration",
    configVersions: "Restore points",
    configSnapshotLabel: "Snapshot label",
    configSnapshotPlaceholder: "Example: Before AutoMod changes",
    configCreateSnapshot: "Create snapshot",
    configCreatingSnapshot: "Creating...",
    configSnapshotCreated: "Configuration snapshot created.",
    configRestore: "Restore",
    configRestoring: "Restoring...",
    configRestoreConfirm:
      "Restore this version? The current configuration will automatically be saved as a rollback point.",
    configRestored:
      "Configuration restored. The previous current state was saved as a rollback point.",
    configHistoryEmpty: "Configuration history is empty.",
    configHistoryError: "Could not load configuration history.",
    configSourceSave: "AUTO",
    configSourceManual: "MANUAL",
    configSourceRestore: "ROLLBACK",
    configChanged: "changes",
    configNoDifference: "No difference from current",
    configGroupGeneral: "General",
    configGroupOnboarding: "Onboarding",
    configGroupModeration: "Moderation",
    configGroupSecurity: "Security",
    configGroupSupport: "Support",
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
    requiresPlan: "This feature is unavailable for this account",
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

function kyivLocalToIso(
  value,
) {
  if (!value) {
    return "";
  }

  const match =
    String(value)
      .match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
      );

  if (!match) {
    return "";
  }

  const target =
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      0,
    );

  let guess =
    target;

  for (
    let pass = 0;
    pass < 3;
    pass += 1
  ) {
    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Europe/Kyiv",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        },
      )
        .formatToParts(
          new Date(
            guess,
          ),
        )
        .reduce(
          (
            result,
            part,
          ) => {
            if (
              part.type !==
              "literal"
            ) {
              result[
                part.type
              ] =
                part.value;
            }

            return result;
          },
          {},
        );

    const rendered =
      Date.UTC(
        Number(
          parts.year,
        ),
        Number(
          parts.month,
        ) - 1,
        Number(
          parts.day,
        ),
        Number(
          parts.hour,
        ),
        Number(
          parts.minute,
        ),
        0,
      );

    guess +=
      target -
      rendered;
  }

  return new Date(
    guess,
  ).toISOString();
}

function formatKyivDateTime(
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
      timeZone:
        "Europe/Kyiv",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatDuration(
  seconds,
) {
  const value =
    Math.max(
      0,
      Number(seconds) ||
      0,
    );

  const days =
    Math.floor(
      value /
      86400,
    );
  const hours =
    Math.floor(
      (
        value %
        86400
      ) /
      3600,
    );
  const minutes =
    Math.floor(
      (
        value %
        3600
      ) /
      60,
    );

  if (days) {
    return (
      String(days) +
      "d " +
      String(hours) +
      "h"
    );
  }

  if (hours) {
    return (
      String(hours) +
      "h " +
      String(minutes) +
      "m"
    );
  }

  return (
    String(minutes) +
    "m"
  );
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
    settingsTab,
    setSettingsTab,
  ] = useState("overview");

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
    staffCenter,
    setStaffCenter,
  ] = useState(
    EMPTY_STAFF_CENTER,
  );

  const [
    staffDraft,
    setStaffDraft,
  ] = useState(
    EMPTY_STAFF_DRAFT,
  );

  const [
    staffLoading,
    setStaffLoading,
  ] = useState(false);

  const [
    staffError,
    setStaffError,
  ] = useState("");

  const [
    incidentCenter,
    setIncidentCenter,
  ] = useState(
    EMPTY_INCIDENT_CENTER,
  );

  const [
    incidentLoading,
    setIncidentLoading,
  ] = useState(false);

  const [
    incidentError,
    setIncidentError,
  ] = useState("");

  const [
    incidentSourceFilter,
    setIncidentSourceFilter,
  ] = useState("all");

  const [
    incidentStatusFilter,
    setIncidentStatusFilter,
  ] = useState("all");

  const [
    incidentNoteDrafts,
    setIncidentNoteDrafts,
  ] = useState({});

  const [
    securityOverview,
    setSecurityOverview,
  ] = useState(
    EMPTY_SECURITY,
  );

  const [
    securityLoading,
    setSecurityLoading,
  ] = useState(false);

  const [
    securityError,
    setSecurityError,
  ] = useState("");

  const [
    commandCenter,
    setCommandCenter,
  ] = useState(
    EMPTY_COMMAND_CENTER,
  );

  const [
    commandCenterLoading,
    setCommandCenterLoading,
  ] = useState(false);

  const [
    commandCenterError,
    setCommandCenterError,
  ] = useState("");

  const [
    commandSearch,
    setCommandSearch,
  ] = useState("");

  const [
    commandCategory,
    setCommandCategory,
  ] = useState("all");

  const [
    expandedCommand,
    setExpandedCommand,
  ] = useState("");

  const [
    configHistory,
    setConfigHistory,
  ] = useState(
    EMPTY_CONFIG_HISTORY,
  );

  const [
    configHistoryLoading,
    setConfigHistoryLoading,
  ] = useState(false);

  const [
    configHistoryError,
    setConfigHistoryError,
  ] = useState("");

  const [
    configSnapshotLabel,
    setConfigSnapshotLabel,
  ] = useState("");

  const [
    diagnostics,
    setDiagnostics,
  ] = useState(
    EMPTY_DIAGNOSTICS,
  );

  const [
    diagnosticsLoading,
    setDiagnosticsLoading,
  ] = useState(false);

  const [
    diagnosticsError,
    setDiagnosticsError,
  ] = useState("");

  const [
    analytics,
    setAnalytics,
  ] = useState(
    EMPTY_ANALYTICS,
  );

  const [
    analyticsDays,
    setAnalyticsDays,
  ] = useState(7);

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] = useState(false);

  const [
    analyticsError,
    setAnalyticsError,
  ] = useState("");

  const [
    publications,
    setPublications,
  ] = useState(
    EMPTY_PUBLICATIONS,
  );

  const [
    publicationsLoading,
    setPublicationsLoading,
  ] = useState(false);

  const [
    publicationsError,
    setPublicationsError,
  ] = useState("");

  const [
    giveawayDraft,
    setGiveawayDraft,
  ] = useState(
    EMPTY_GIVEAWAY_DRAFT,
  );

  const [
    scheduleDraft,
    setScheduleDraft,
  ] = useState(
    EMPTY_SCHEDULE_DRAFT,
  );

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

  function guildPermissionAllows(
    guild,
    permission,
  ) {
    const access =
      guild?.access ||
      {};

    if (
      access.isOwner ===
        true ||
      access.permissionKeys
        ?.includes("*")
    ) {
      return true;
    }

    const permissions =
      new Set(
        Array.isArray(
          access.permissionKeys,
        )
          ? access.permissionKeys
          : [],
      );

    if (!permission) {
      return permissions.size > 0;
    }

    if (
      permissions.has(
        permission,
      )
    ) {
      return true;
    }

    if (
      permission.endsWith(
        ".view",
      )
    ) {
      const group =
        permission.split(
          ".",
        )[0];

      return (
        permissions.has(
          group +
            ".manage",
        ) ||
        permissions.has(
          group +
            ".restore",
        ) ||
        permissions.has(
          group +
            ".emergency",
        )
      );
    }

    return false;
  }

  const canControl =
    (permission) =>
      guildPermissionAllows(
        selectedGuild,
        permission,
      );

  const controlOwner =
    selectedGuild
      ?.access
      ?.isOwner ===
    true;


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

  function previewTemplate(
    value,
    fallback,
  ) {
    return String(
      value ||
      fallback ||
      "",
    )
      .replaceAll(
        "{{server}}",
        selectedGuild?.name ||
          "ISTe",
      )
      .replaceAll(
        "{{user}}",
        language === "en"
          ? "NewMember"
          : "НовийУчасник",
      )
      .replaceAll(
        "{{count}}",
        String(
          selectedGuild
            ?.memberCount ||
            0,
        ),
      );
  }

  async function loadStaffCenter(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setStaffLoading(true);
    setStaffError("");

    try {
      const result =
        await api(
          "staff-permissions-overview",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setStaffCenter({
        permissionCatalog:
          Array.isArray(
            result.permissionCatalog,
          )
            ? result.permissionCatalog
            : [],
        presets:
          result.presets &&
          typeof result.presets ===
            "object"
            ? result.presets
            : {},
        policies:
          Array.isArray(
            result.policies,
          )
            ? result.policies
            : [],
        recentAccess:
          Array.isArray(
            result.recentAccess,
          )
            ? result.recentAccess
            : [],
      });
    } catch (loadError) {
      setStaffError(
        loadError?.message ||
          c.staffError,
      );
    } finally {
      setStaffLoading(false);
    }
  }

  function applyStaffPreset(
    preset,
  ) {
    setStaffDraft(
      (current) => ({
        ...current,
        preset,
        permissionKeys:
          Array.isArray(
            staffCenter
              .presets?.[
                preset
              ],
          )
            ? [
                ...staffCenter
                  .presets[
                    preset
                  ],
              ]
            : [],
      }),
    );
  }

  function toggleStaffPermission(
    permissionKey,
  ) {
    setStaffDraft(
      (current) => {
        const currentKeys =
          new Set(
            current
              .permissionKeys ||
            [],
          );

        if (
          currentKeys.has(
            permissionKey,
          )
        ) {
          currentKeys.delete(
            permissionKey,
          );
        } else {
          currentKeys.add(
            permissionKey,
          );
        }

        return {
          ...current,
          permissionKeys: [
            ...currentKeys,
          ],
        };
      },
    );
  }

  async function saveStaffPolicy() {
    if (
      !selectedGuild ||
      !staffDraft.roleId
    ) {
      return;
    }

    setBusy("staff-policy");
    setError("");
    setNotice("");

    try {
      await api(
        "save-staff-role-policy",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            roleId:
              staffDraft.roleId,
            label:
              staffDraft.label,
            permissionKeys:
              staffDraft
                .permissionKeys,
            enabled:
              staffDraft.enabled,
          },
        },
      );

      setStaffDraft({
        ...EMPTY_STAFF_DRAFT,
      });
      setNotice(
        c.staffPolicySaved,
      );

      await Promise.all([
        loadStaffCenter(
          selectedGuild
            .guildId,
        ),
        load(),
      ]);
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  function editStaffPolicy(
    policy,
  ) {
    setStaffDraft({
      roleId:
        policy.roleId,
      label:
        policy.label ||
        "",
      preset: "",
      permissionKeys:
        Array.isArray(
          policy.permissionKeys,
        )
          ? [
              ...policy
                .permissionKeys,
            ]
          : [],
      enabled:
        policy.enabled !==
        false,
    });
  }

  async function deleteStaffPolicy(
    roleId,
  ) {
    if (
      !selectedGuild ||
      !window.confirm(
        c.staffDeleteConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "staff-delete:" +
      roleId,
    );
    setError("");
    setNotice("");

    try {
      await api(
        "delete-staff-role-policy",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            roleId,
          },
        },
      );

      if (
        staffDraft.roleId ===
        roleId
      ) {
        setStaffDraft({
          ...EMPTY_STAFF_DRAFT,
        });
      }

      setNotice(
        c.staffPolicyDeleted,
      );

      await Promise.all([
        loadStaffCenter(
          selectedGuild
            .guildId,
        ),
        load(),
      ]);
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function loadIncidentCenter(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setIncidentLoading(
      true,
    );
    setIncidentError("");

    try {
      const result =
        await api(
          "incident-center-overview",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setIncidentCenter({
        windowDays:
          Number(
            result.windowDays ||
            14,
          ) ||
          14,
        summary: {
          ...EMPTY_INCIDENT_CENTER
            .summary,
          ...(result.summary ||
            {}),
        },
        events:
          Array.isArray(
            result.events,
          )
            ? result.events
            : [],
        incidents:
          Array.isArray(
            result.incidents,
          )
            ? result.incidents
            : [],
      });
    } catch (loadError) {
      setIncidentError(
        loadError?.message ||
          c.incidentError,
      );
    } finally {
      setIncidentLoading(
        false,
      );
    }
  }

  async function createIncidentFromEvent(
    event,
  ) {
    if (!selectedGuild) {
      return;
    }

    const busyKey =
      "incident-create:" +
      event.sourceType +
      ":" +
      event.sourceId;

    setBusy(busyKey);
    setError("");
    setNotice("");

    try {
      await api(
        "create-incident",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            sourceType:
              event.sourceType,
            sourceId:
              event.sourceId,
          },
        },
      );

      setNotice(
        c.incidentCreated,
      );

      await loadIncidentCenter(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  function patchIncident(
    incidentId,
    patchValue,
  ) {
    setIncidentCenter(
      (current) => ({
        ...current,
        incidents:
          current.incidents.map(
            (incident) =>
              incident.id ===
              incidentId
                ? {
                    ...incident,
                    ...patchValue,
                  }
                : incident,
          ),
      }),
    );
  }

  async function saveIncident(
    incident,
  ) {
    if (!selectedGuild) {
      return;
    }

    const busyKey =
      "incident-save:" +
      incident.id;

    setBusy(busyKey);
    setError("");
    setNotice("");

    try {
      await api(
        "update-incident",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            incidentId:
              incident.id,
            status:
              incident.status,
            severity:
              incident.severity,
            resolutionNote:
              incident
                .resolutionNote ||
              "",
          },
        },
      );

      setNotice(
        c.incidentUpdated,
      );

      await loadIncidentCenter(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function addIncidentNote(
    incidentId,
  ) {
    if (!selectedGuild) {
      return;
    }

    const note =
      String(
        incidentNoteDrafts[
          incidentId
        ] ||
        "",
      ).trim();

    if (!note) {
      return;
    }

    const busyKey =
      "incident-note:" +
      incidentId;

    setBusy(busyKey);
    setError("");
    setNotice("");

    try {
      await api(
        "add-incident-note",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            incidentId,
            note,
          },
        },
      );

      setIncidentNoteDrafts(
        (current) => ({
          ...current,
          [incidentId]: "",
        }),
      );

      setNotice(
        c.incidentNoteAdded,
      );

      await loadIncidentCenter(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function loadSecurityOverview(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setSecurityLoading(
      true,
    );
    setSecurityError("");

    try {
      const result =
        await api(
          "security-overview",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setSecurityOverview({
        summary: {
          ...EMPTY_SECURITY
            .summary,
          ...(result.summary ||
            {}),
        },
        events:
          Array.isArray(
            result.events,
          )
            ? result.events
            : [],
      });
    } catch (loadError) {
      setSecurityError(
        loadError?.message ||
          c.securityError,
      );
    } finally {
      setSecurityLoading(
        false,
      );
    }
  }

  async function loadCommandCenter(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setCommandCenterLoading(
      true,
    );
    setCommandCenterError("");

    try {
      const result =
        await api(
          "command-center-overview",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setCommandCenter({
        summary: {
          ...EMPTY_COMMAND_CENTER
            .summary,
          ...(result.summary ||
            {}),
        },
        commands:
          Array.isArray(
            result.commands,
          )
            ? result.commands
            : [],
        timeline:
          Array.isArray(
            result.timeline,
          )
            ? result.timeline
            : [],
        recentUsage:
          Array.isArray(
            result.recentUsage,
          )
            ? result.recentUsage
            : [],
      });
    } catch (loadError) {
      setCommandCenterError(
        loadError?.message ||
          c.commandCenterError,
      );
    } finally {
      setCommandCenterLoading(
        false,
      );
    }
  }

  function patchCommand(
    commandName,
    patchValue,
  ) {
    setCommandCenter(
      (current) => ({
        ...current,
        commands:
          current.commands.map(
            (command) =>
              command.name ===
              commandName
                ? {
                    ...command,
                    ...patchValue,
                  }
                : command,
          ),
      }),
    );
  }

  async function saveCommandCenter() {
    if (!selectedGuild) {
      return;
    }

    setBusy(
      "command-center",
    );
    setError("");
    setNotice("");

    try {
      await api(
        "save-command-settings",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            commands:
              commandCenter
                .commands
                .map(
                  (command) => ({
                    name:
                      command.name,
                    enabled:
                      command.enabled,
                    allowedRoleIds:
                      command
                        .allowedRoleIds,
                    allowedChannelIds:
                      command
                        .allowedChannelIds,
                    cooldownSeconds:
                      command
                        .cooldownSeconds,
                  }),
                ),
          },
        },
      );

      setNotice(
        c.commandCenterSaved,
      );

      await loadCommandCenter(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function resetCommandCenter() {
    if (
      !selectedGuild ||
      !window.confirm(
        c.commandCenterResetConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "command-center-reset",
    );
    setError("");
    setNotice("");

    try {
      await api(
        "reset-command-settings",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
          },
        },
      );

      setNotice(
        c.commandCenterResetDone,
      );

      await loadCommandCenter(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function loadConfigHistory(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setConfigHistoryLoading(
      true,
    );
    setConfigHistoryError("");

    try {
      const result =
        await api(
          "config-history-list",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setConfigHistory({
        current: {
          updatedAt:
            result.current
              ?.updatedAt ||
            null,
        },
        versions:
          Array.isArray(
            result.versions,
          )
            ? result.versions
            : [],
      });
    } catch (loadError) {
      setConfigHistoryError(
        loadError?.message ||
          c.configHistoryError,
      );
    } finally {
      setConfigHistoryLoading(
        false,
      );
    }
  }

  async function loadDiagnostics(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setDiagnosticsLoading(
      true,
    );
    setDiagnosticsError("");

    try {
      const result =
        await api(
          "diagnostics-overview",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setDiagnostics({
        ...EMPTY_DIAGNOSTICS,
        ...result,
        summary: {
          ...EMPTY_DIAGNOSTICS
            .summary,
          ...(result.summary ||
            {}),
        },
        checks:
          Array.isArray(
            result.checks,
          )
            ? result.checks
            : [],
        permissions:
          Array.isArray(
            result.permissions,
          )
            ? result.permissions
            : [],
      });
    } catch (loadError) {
      setDiagnosticsError(
        loadError?.message ||
          c.diagnosticsError,
      );
    } finally {
      setDiagnosticsLoading(
        false,
      );
    }
  }

  async function loadAnalytics(
    guildId =
      selectedGuildId,
    days =
      analyticsDays,
  ) {
    if (!guildId) {
      return;
    }

    setAnalyticsLoading(
      true,
    );
    setAnalyticsError("");

    try {
      const result =
        await api(
          "analytics-overview",
          {
            method: "POST",
            body: {
              guildId,
              days,
            },
          },
        );

      setAnalytics({
        summary: {
          ...EMPTY_ANALYTICS
            .summary,
          ...(result.summary ||
            {}),
        },
        timeline:
          Array.isArray(
            result.timeline,
          )
            ? result.timeline
            : [],
        topSelfRoles:
          Array.isArray(
            result.topSelfRoles,
          )
            ? result.topSelfRoles
            : [],
        recentActivity:
          Array.isArray(
            result.recentActivity,
          )
            ? result.recentActivity
            : [],
        health: {
          ...EMPTY_ANALYTICS
            .health,
          ...(result.health ||
            {}),
        },
      });
    } catch (loadError) {
      setAnalyticsError(
        loadError?.message ||
          c.analyticsError,
      );
    } finally {
      setAnalyticsLoading(
        false,
      );
    }
  }

  async function loadPublications(
    guildId =
      selectedGuildId,
  ) {
    if (!guildId) {
      return;
    }

    setPublicationsLoading(
      true,
    );
    setPublicationsError("");

    try {
      const result =
        await api(
          "publications-list",
          {
            method: "POST",
            body: {
              guildId,
            },
          },
        );

      setPublications({
        giveaways:
          Array.isArray(
            result.giveaways,
          )
            ? result.giveaways
            : [],
        scheduled:
          Array.isArray(
            result.scheduled,
          )
            ? result.scheduled
            : [],
      });
    } catch (loadError) {
      setPublicationsError(
        loadError?.message ||
          c.publicationError,
      );
    } finally {
      setPublicationsLoading(
        false,
      );
    }
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
    setSettingsTab(
      "overview",
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
    setStaffCenter(
      EMPTY_STAFF_CENTER,
    );
    setStaffDraft({
      ...EMPTY_STAFF_DRAFT,
    });
    setStaffError("");
    setIncidentCenter(
      EMPTY_INCIDENT_CENTER,
    );
    setIncidentError("");
    setIncidentSourceFilter("all");
    setIncidentStatusFilter("all");
    setIncidentNoteDrafts({});
    setSecurityOverview(
      EMPTY_SECURITY,
    );
    setSecurityError("");
    setCommandCenter(
      EMPTY_COMMAND_CENTER,
    );
    setCommandCenterError("");
    setCommandSearch("");
    setCommandCategory("all");
    setExpandedCommand("");
    setConfigHistory(
      EMPTY_CONFIG_HISTORY,
    );
    setConfigHistoryError("");
    setConfigSnapshotLabel("");
    setDiagnostics(
      EMPTY_DIAGNOSTICS,
    );
    setDiagnosticsError("");
    setAnalytics(
      EMPTY_ANALYTICS,
    );
    setAnalyticsDays(7);
    setAnalyticsError("");
    setPublications(
      EMPTY_PUBLICATIONS,
    );
    setPublicationsError("");
    setGiveawayDraft(
      EMPTY_GIVEAWAY_DRAFT,
    );
    setScheduleDraft(
      EMPTY_SCHEDULE_DRAFT,
    );
    setNotice("");
    setError("");

    if (
      guildPermissionAllows(
        guild,
        "moderation.view",
      )
    ) {
      void loadModerationHistory(
        guild.guildId,
        "",
        "",
      );
    }

    if (
      guild?.access
        ?.isOwner ===
      true
    ) {
      void loadStaffCenter(
        guild.guildId,
      );
    }

    if (
      guildPermissionAllows(
        guild,
        "incidents.view",
      )
    ) {
      void loadIncidentCenter(
        guild.guildId,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "security.view",
      )
    ) {
      void loadSecurityOverview(
        guild.guildId,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "commands.view",
      )
    ) {
      void loadCommandCenter(
        guild.guildId,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "system.view",
      )
    ) {
      void loadConfigHistory(
        guild.guildId,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "diagnostics.view",
      )
    ) {
      void loadDiagnostics(
        guild.guildId,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "analytics.view",
      )
    ) {
      void loadAnalytics(
        guild.guildId,
        7,
      );
  
    }
    if (
      guildPermissionAllows(
        guild,
        "publishing.view",
      )
    ) {
      void loadPublications(
        guild.guildId,
      );
  
    }
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

  async function createConfigSnapshot() {
    if (!selectedGuild) {
      return;
    }

    setBusy(
      "config-snapshot",
    );
    setError("");
    setNotice("");

    try {
      await api(
        "create-config-snapshot",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            label:
              configSnapshotLabel,
          },
        },
      );

      setConfigSnapshotLabel("");
      setNotice(
        c.configSnapshotCreated,
      );

      await loadConfigHistory(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function restoreConfigVersion(
    versionId,
  ) {
    if (
      !selectedGuild ||
      !window.confirm(
        c.configRestoreConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "config-restore:" +
      versionId,
    );
    setError("");
    setNotice("");

    try {
      const result =
        await api(
          "restore-config-version",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild
                  .guildId,
              versionId,
            },
          },
        );

      setSettings({
        ...EMPTY_SETTINGS,
        ...(result.settings ||
          {}),
      });

      setNotice(
        c.configRestored,
      );

      await Promise.all([
        load(),
        loadConfigHistory(
          selectedGuild
            .guildId,
        ),
        loadDiagnostics(
          selectedGuild
            .guildId,
        ),
      ]);
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
              section:
                settingsTab ===
                  "overview"
                  ? "system"
                  : settingsTab,
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

      await Promise.all([
        load(),
        loadConfigHistory(
          selectedGuild
            .guildId,
        ),
      ]);
    } catch (actionError) {
      setError(
        actionError?.message ||
        c.actionFailed,
      );
    } finally {
      setBusy("");
    }
  }

  async function createGiveaway() {
    if (!selectedGuild) {
      return;
    }

    setBusy("create-giveaway");
    setError("");
    setNotice("");

    try {
      const endsAt =
        kyivLocalToIso(
          giveawayDraft
            .endsAt,
        );

      const result =
        await api(
          "create-giveaway",
          {
            method: "POST",
            body: {
              guildId:
                selectedGuild
                  .guildId,
              channelId:
                giveawayDraft
                  .channelId,
              prize:
                giveawayDraft
                  .prize,
              description:
                giveawayDraft
                  .description,
              requiredRoleId:
                giveawayDraft
                  .requiredRoleId,
              winnerCount:
                giveawayDraft
                  .winnerCount,
              endsAt,
            },
          },
        );

      setGiveawayDraft(
        (current) => ({
          ...EMPTY_GIVEAWAY_DRAFT,
          channelId:
            current.channelId,
        }),
      );

      setNotice(
        c.giveawayCreated,
      );

      await loadPublications(
        selectedGuild
          .guildId,
      );

      return result;
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.publicationError,
      );
    } finally {
      setBusy("");
    }
  }

  async function cancelGiveaway(
    giveawayId,
  ) {
    if (
      !selectedGuild ||
      !window.confirm(
        c.cancelGiveawayConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "giveaway:" +
      giveawayId,
    );
    setError("");

    try {
      await api(
        "cancel-giveaway",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            giveawayId,
          },
        },
      );

      await loadPublications(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.publicationError,
      );
    } finally {
      setBusy("");
    }
  }

  async function rerollGiveaway(
    giveawayId,
  ) {
    if (
      !selectedGuild ||
      !window.confirm(
        c.rerollConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "reroll:" +
      giveawayId,
    );
    setError("");

    try {
      await api(
        "reroll-giveaway",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            giveawayId,
          },
        },
      );

      await loadPublications(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.publicationError,
      );
    } finally {
      setBusy("");
    }
  }

  async function createScheduledMessage() {
    if (!selectedGuild) {
      return;
    }

    setBusy(
      "schedule-message",
    );
    setError("");
    setNotice("");

    try {
      const scheduledAt =
        kyivLocalToIso(
          scheduleDraft
            .scheduledAt,
        );

      await api(
        "create-scheduled-message",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            channelId:
              scheduleDraft
                .channelId,
            content:
              scheduleDraft
                .content,
            embedTitle:
              scheduleDraft
                .embedTitle,
            embedDescription:
              scheduleDraft
                .embedDescription,
            scheduledAt,
          },
        },
      );

      setScheduleDraft(
        (current) => ({
          ...EMPTY_SCHEDULE_DRAFT,
          channelId:
            current.channelId,
        }),
      );

      setNotice(
        c.scheduledCreated,
      );

      await loadPublications(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.publicationError,
      );
    } finally {
      setBusy("");
    }
  }

  async function cancelScheduledMessage(
    scheduledId,
  ) {
    if (
      !selectedGuild ||
      !window.confirm(
        c.cancelScheduledConfirm,
      )
    ) {
      return;
    }

    setBusy(
      "schedule:" +
      scheduledId,
    );
    setError("");

    try {
      await api(
        "cancel-scheduled-message",
        {
          method: "POST",
          body: {
            guildId:
              selectedGuild
                .guildId,
            scheduledId,
          },
        },
      );

      await loadPublications(
        selectedGuild
          .guildId,
      );
    } catch (actionError) {
      setError(
        actionError?.message ||
          c.publicationError,
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
              section:
                "onboarding",
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
              section:
                "onboarding",
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
              section:
                "moderation",
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
              section:
                "support",
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

  const selectedLicensePlan =
    selectedGuild
      ?.license
      ?.plan ||
    subscription
      ?.plan ||
    "free";

  const selectedPlan =
    data?.planCatalog?.find(
      (item) =>
        item.plan ===
        selectedLicensePlan,
    );

  const selectedEntitlements =
    new Set(
      selectedLicensePlan ===
        "internal"
        ? ["*"]
        : (
            selectedPlan
              ?.features ||
            subscription
              ?.features ||
            []
          ),
    );

  const hasFeature =
    (feature) =>
      selectedLicensePlan ===
        "internal" ||
      selectedEntitlements.has(
        "*",
      ) ||
      selectedEntitlements.has(
        feature,
      );

  return (
    <section
      className={
        `bot-dashboard-page${selectedGuild ? " managing" : ""}`
      }
    >
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

          <article>
            <span>
              {c.servers}
            </span>
            <strong>
              {Array.isArray(
                data?.guilds,
              )
                ? data.guilds.length
                : 0}
            </strong>
            <small>
              ISTe Bot
            </small>
          </article>
        </div>

        {selectedGuild ? (
          <div className="bot-dashboard-settings-view">
            <button
              type="button"
              className="bot-dashboard-back"
              onClick={() => {
                setSelectedGuildId(
                  "",
                );
                setSettingsTab(
                  "overview",
                );
              }}
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
              <div className="bot-dashboard-control-status">
                <span
                  className={
                    selectedGuild
                      .installed
                      ? "ok"
                      : ""
                  }
                >
                  {selectedGuild
                    .installed
                    ? c.connected
                    : c.notConnected}
                </span>
                <span
                  className={
                    selectedGuild
                      .licensed
                      ? "ok"
                      : ""
                  }
                >
                  {selectedGuild
                    .licensed
                    ? c.licensed
                    : c.noLicense}
                </span>
              </div>
            </div>

            <nav
              className="bot-dashboard-control-tabs"
              aria-label={
                c.controlCenter
              }
            >
              {[
                [
                  "overview",
                  c.tabOverview,
                  "01",
                ],
                [
                  "analytics",
                  c.tabAnalytics,
                  "02",
                ],
                [
                  "commands",
                  c.tabCommands,
                  "03",
                ],
                [
                  "security",
                  c.tabSecurity,
                  "04",
                ],
                [
                  "incidents",
                  c.tabIncidents,
                  "05",
                ],
                [
                  "onboarding",
                  c.tabOnboarding,
                  "06",
                ],
                [
                  "moderation",
                  c.tabModeration,
                  "07",
                ],
                [
                  "support",
                  c.tabSupport,
                  "08",
                ],
                [
                  "publishing",
                  c.tabPublishing,
                  "09",
                ],
                [
                  "staff",
                  c.tabStaff,
                  "10",
                ],
                [
                  "system",
                  c.tabSystem,
                  "11",
                ],
                [
                  "diagnostics",
                  c.tabDiagnostics,
                  "12",
                ],
              ]
                .filter(
                  ([
                    key,
                  ]) => {
                    const permission =
                      key === "overview"
                        ? "overview.view"
                        : key === "analytics"
                          ? "analytics.view"
                          : key === "commands"
                            ? "commands.view"
                            : key === "security"
                              ? "security.view"
                              : key === "incidents"
                                ? "incidents.view"
                                : key === "onboarding"
                                  ? "onboarding.view"
                                  : key === "moderation"
                                    ? "moderation.view"
                                    : key === "support"
                                      ? "support.view"
                                      : key === "publishing"
                                        ? "publishing.view"
                                        : key === "staff"
                                          ? "owner"
                                          : key === "system"
                                            ? "system.view"
                                            : "diagnostics.view";

                    return permission ===
                      "owner"
                      ? controlOwner
                      : canControl(
                          permission,
                        );
                  },
                )
                .map(
                ([
                  key,
                  label,
                  index,
                ]) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      settingsTab ===
                      key
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setSettingsTab(
                        key,
                      );

                      if (
                        key ===
                        "analytics"
                      ) {
                        void loadAnalytics();
                      }

                      if (
                        key ===
                        "commands"
                      ) {
                        void loadCommandCenter();
                      }

                      if (
                        key ===
                        "security"
                      ) {
                        void loadSecurityOverview();
                      }

                      if (
                        key ===
                        "incidents"
                      ) {
                        void loadIncidentCenter();
                      }

                      if (
                        key ===
                        "publishing"
                      ) {
                        void loadPublications();
                      }

                      if (
                        key ===
                        "diagnostics"
                      ) {
                        void loadDiagnostics();
                      }

                      if (
                        key ===
                        "staff"
                      ) {
                        void loadStaffCenter();
                      }

                      if (
                        key ===
                        "system"
                      ) {
                        void loadConfigHistory();
                      }
                    }}
                  >
                    <span>
                      {index}
                    </span>
                    {label}
                  </button>
                ),
              )}
            </nav>

            {settingsTab ===
            "overview" ? (
              <section className="bot-dashboard-control-overview">
                <header>
                  <div>
                    <span>
                      {c.controlCenter}
                    </span>
                    <h3>
                      {c.overviewTitle}
                    </h3>
                    <p>
                      {c.overviewText}
                    </p>
                  </div>
                </header>

                <div className="bot-dashboard-overview-grid">
                  {[
                    {
                      key:
                        "analytics",
                      index: "02",
                      title:
                        c.tabAnalytics,
                      enabled:
                        analytics
                          .summary
                          .netGrowth,
                      total:
                        analytics
                          .summary
                          .currentMembers ??
                        0,
                    },
                    {
                      key:
                        "commands",
                      index: "03",
                      title:
                        c.tabCommands,
                      enabled:
                        commandCenter
                          .summary
                          .enabled,
                      total:
                        commandCenter
                          .summary
                          .commands ||
                        26,
                    },
                    {
                      key:
                        "security",
                      index: "04",
                      title:
                        c.tabSecurity,
                      enabled:
                        settings
                          .securityEnabled
                          ? 1
                          : 0,
                      total: 1,
                    },
                    {
                      key:
                        "incidents",
                      index: "05",
                      title:
                        c.tabIncidents,
                      enabled:
                        incidentCenter
                          .summary
                          .open +
                        incidentCenter
                          .summary
                          .reviewing,
                      total:
                        incidentCenter
                          .summary
                          .events,
                    },
                    {
                      key:
                        "onboarding",
                      index: "06",
                      title:
                        c.tabOnboarding,
                      enabled: [
                        settings
                          .autoRolesEnabled,
                        settings
                          .welcomeEnabled,
                        settings
                          .verificationEnabled,
                        settings
                          .selfRolesEnabled,
                      ].filter(
                        Boolean,
                      ).length,
                      total: 4,
                    },
                    {
                      key:
                        "moderation",
                      index: "07",
                      title:
                        c.tabModeration,
                      enabled: [
                        settings
                          .moderationEnabled,
                        settings
                          .automodEnabled,
                      ].filter(
                        Boolean,
                      ).length,
                      total: 2,
                    },
                    {
                      key:
                        "support",
                      index: "08",
                      title:
                        c.tabSupport,
                      enabled: [
                        settings
                          .privateVoiceEnabled,
                        settings
                          .ticketsEnabled,
                      ].filter(
                        Boolean,
                      ).length,
                      total: 2,
                    },
                    {
                      key:
                        "publishing",
                      index: "09",
                      title:
                        c.tabPublishing,
                      enabled:
                        publications
                          .giveaways
                          .filter(
                            (item) =>
                              item.status ===
                              "active",
                          )
                          .length +
                        publications
                          .scheduled
                          .filter(
                            (item) =>
                              item.status ===
                              "scheduled",
                          )
                          .length,
                      total:
                        publications
                          .giveaways
                          .length +
                        publications
                          .scheduled
                          .length,
                    },
                    ...(
                      controlOwner
                        ? [
                            {
                              key:
                                "staff",
                              index:
                                "10",
                              title:
                                c.tabStaff,
                              enabled:
                                staffCenter
                                  .policies
                                  .filter(
                                    (
                                      policy,
                                    ) =>
                                      policy.enabled,
                                  )
                                  .length,
                              total:
                                staffCenter
                                  .policies
                                  .length,
                            },
                          ]
                        : []
                    ),
                    {
                      key:
                        "system",
                      index: "11",
                      title:
                        c.tabSystem,
                      enabled: [
                        Boolean(
                          settings
                            .adminRoleId,
                        ),
                        Boolean(
                          settings
                            .matchChannelId,
                        ),
                      ].filter(
                        Boolean,
                      ).length,
                      total: 2,
                    },
                  ]
                    .filter(
                      (item) =>
                        item.key ===
                          "staff"
                          ? controlOwner
                          : canControl(
                              item.key +
                                ".view",
                            ),
                    )
                    .map(
                    (item) => (
                      <button
                        key={
                          item.key
                        }
                        type="button"
                        onClick={() =>
                          setSettingsTab(
                            item.key,
                          )
                        }
                      >
                        <span className="index">
                          {item.index}
                        </span>
                        <div>
                          <strong>
                            {
                              item.title
                            }
                          </strong>
                          <small>
                            {item.key ===
                            "analytics"
                              ? (
                                  (item.enabled >=
                                  0
                                    ? "+"
                                    : "") +
                                  String(
                                    item.enabled,
                                  ) +
                                  " · " +
                                  String(
                                    item.total,
                                  ) +
                                  " " +
                                  c.members
                                )
                              : (
                                  String(
                                    item.enabled,
                                  ) +
                                  "/" +
                                  String(
                                    item.total,
                                  ) +
                                  " " +
                                  c.configured
                                )}
                          </small>
                        </div>
                        <span className="arrow">
                          →
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <form
              className={
                `bot-dashboard-settings tab-${settingsTab}`
              }
              onSubmit={
                saveSettings
              }
            >
              <section className="bot-dashboard-core-section module-overview">
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

              <section className="bot-dashboard-core-section module-onboarding">
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

              <section className="bot-dashboard-core-section module-support">
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
                      `bot-dashboard-module-card module-onboarding module-welcome${settings.welcomeEnabled ? " active" : ""}`
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
                    <div className="bot-dashboard-discord-preview full">
                      <span className="preview-label">
                        {c.discordPreview}
                      </span>
                      <div className="discord-message">
                        <div className="discord-avatar">
                          I
                        </div>
                        <div className="discord-message-body">
                          <div className="discord-author">
                            <strong>
                              ISTe Bot
                            </strong>
                            <span>
                              BOT
                            </span>
                          </div>
                          {settings.welcomeMention ? (
                            <p className="discord-mention">
                              @
                              {language ===
                              "en"
                                ? "NewMember"
                                : "НовийУчасник"}
                            </p>
                          ) : null}
                          <div className="discord-embed">
                            <strong>
                              {previewTemplate(
                                settings
                                  .welcomeTitle,
                                c.welcomeTitlePlaceholder,
                              )}
                            </strong>
                            <p>
                              {previewTemplate(
                                settings
                                  .welcomeMessage,
                                c.welcomeMessagePlaceholder,
                              )}
                            </p>
                            {settings
                              .welcomeShowMemberCount ? (
                              <small>
                                {c.members}:{" "}
                                {
                                  selectedGuild
                                    .memberCount
                                }
                              </small>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card module-onboarding module-verification${settings.verificationEnabled ? " active" : ""}`
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

                      <div className="bot-dashboard-discord-preview full">
                        <span className="preview-label">
                          {c.discordPreview}
                        </span>
                        <div className="discord-panel">
                          <div className="discord-embed">
                            <strong>
                              {settings
                                .verificationPanelTitle ||
                                c.verificationTitlePlaceholder}
                            </strong>
                            <p>
                              {settings
                                .verificationPanelMessage ||
                                c.verificationMessagePlaceholder}
                            </p>
                          </div>
                          <button
                            type="button"
                            tabIndex={-1}
                          >
                            ✓{" "}
                            {language ===
                            "en"
                              ? "Verify"
                              : "Підтвердити"}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="bot-dashboard-module-action full"
                        onClick={
                          publishVerificationPanel
                        }
                        disabled={
                          busy ===
                            "verification-panel" ||
                          !canControl(
                            "onboarding.manage",
                          ) ||
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
                      `bot-dashboard-module-card module-onboarding module-selfroles${settings.selfRolesEnabled ? " active" : ""}`
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
                          !canControl(
                            "onboarding.manage",
                          ) ||
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
                      `bot-dashboard-module-card module-moderation module-manualmod${settings.moderationEnabled ? " active" : ""}`
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
                      `bot-dashboard-module-card module-moderation module-automod${settings.automodEnabled ? " active" : ""}`
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
                              "automod" ||
                            !canControl(
                              "moderation.manage",
                            )
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
                              `activate:${selectedGuild.guildId}` ||
                            !controlOwner
                          }
                        >
                          {c.updateBotPermissions}
                        </button>
                      </div>
                    </div>
                  </article>

                  <article
                    className={
                      `bot-dashboard-module-card module-support module-tickets${settings.ticketsEnabled ? " active" : ""}`
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

                      <div className="bot-dashboard-discord-preview full">
                        <span className="preview-label">
                          {c.discordPreview}
                        </span>
                        <div className="discord-panel">
                          <div className="discord-embed">
                            <strong>
                              {settings
                                .ticketPanelTitle ||
                                c.ticketPanelTitlePlaceholder}
                            </strong>
                            <p>
                              {settings
                                .ticketPanelMessage ||
                                c.ticketPanelMessagePlaceholder}
                            </p>
                          </div>
                          <button
                            type="button"
                            tabIndex={-1}
                          >
                            🎫{" "}
                            {language ===
                            "en"
                              ? "Create ticket"
                              : "Створити тикет"}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="bot-dashboard-module-action full"
                        onClick={
                          publishTicketPanel
                        }
                        disabled={
                          busy ===
                            "ticket-panel" ||
                          !canControl(
                            "support.manage",
                          ) ||
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

                  <article
                    className={
                      `bot-dashboard-module-card module-security module-raidguard${settings.securityEnabled ? " active" : ""}`
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {c.securityModule}
                        </strong>
                        <small>
                          {c.securityModuleText}
                        </small>
                      </div>

                      <label className="bot-dashboard-switch">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .securityEnabled
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityEnabled",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {settings.securityEnabled
                            ? c.moduleOn
                            : c.moduleOff}
                        </span>
                      </label>
                    </header>

                    <div className="bot-dashboard-module-fields">
                      <label>
                        <span>
                          {c.securityAlertChannel}
                        </span>
                        <select
                          value={
                            settings
                              .securityAlertChannelId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityAlertChannelId",
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
                            (
                              channel,
                            ) => (
                              <option
                                key={
                                  channel.id
                                }
                                value={
                                  channel.id
                                }
                              >
                                #
                                {
                                  channel.name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.securityQuarantineRole}
                        </span>
                        <select
                          value={
                            settings
                              .securityQuarantineRoleId
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityQuarantineRoleId",
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
                            (
                              role,
                            ) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @
                                {
                                  role.name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.securityJoinThreshold}
                        </span>
                        <input
                          type="number"
                          min={2}
                          max={100}
                          value={
                            settings
                              .securityJoinBurstThreshold
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityJoinBurstThreshold",
                              Number(
                                event
                                  .target
                                  .value,
                              ) ||
                                8,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.securityJoinWindow}
                        </span>
                        <input
                          type="number"
                          min={10}
                          max={600}
                          value={
                            settings
                              .securityJoinBurstWindowSeconds
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityJoinBurstWindowSeconds",
                              Number(
                                event
                                  .target
                                  .value,
                              ) ||
                                60,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {c.securityAccountAge}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={8760}
                          value={
                            settings
                              .securityMinAccountAgeHours
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityMinAccountAgeHours",
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value,
                                ) ||
                                  0,
                              ),
                            )
                          }
                        />
                      </label>

                      <label className="bot-dashboard-checkbox-line">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .securityAutoQuarantine
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityAutoQuarantine",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.securityAutoQuarantine}
                        </span>
                      </label>

                      <label className="bot-dashboard-checkbox-line">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .securityIgnoreBots
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityIgnoreBots",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          {c.securityIgnoreBots}
                        </span>
                      </label>

                      <label className="bot-dashboard-checkbox-line security-emergency">
                        <input
                          type="checkbox"
                          checked={
                            settings
                              .securityEmergencyMode
                          }
                          disabled={
                            !canControl(
                              "security.emergency",
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            patch(
                              "securityEmergencyMode",
                              event
                                .target
                                .checked,
                            )
                          }
                        />
                        <span>
                          <strong>
                            {c.securityEmergencyMode}
                          </strong>
                          <small>
                            {c.securityEmergencyText}
                          </small>
                        </span>
                      </label>

                      <p className="bot-dashboard-security-hint full">
                        {c.securityObserveHint}
                      </p>
                    </div>
                  </article>

                  <article className="bot-dashboard-module-card module-security module-security-events">
                    <header>
                      <div>
                        <strong>
                          {c.securityRecentEvents}
                        </strong>
                        <small>
                          {c.securityEvents}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="bot-dashboard-module-action"
                        onClick={() =>
                          void loadSecurityOverview()
                        }
                        disabled={
                          securityLoading
                        }
                      >
                        {securityLoading
                          ? c.securityLoading
                          : c.commandCenterRefresh}
                      </button>
                    </header>

                    {securityError ? (
                      <div className="bot-dashboard-inline-error">
                        {securityError}
                      </div>
                    ) : null}

                    <div className="bot-dashboard-security-kpis">
                      {[
                        [
                          c.securityWarnings,
                          securityOverview
                            .summary
                            .warnings,
                          "warning",
                        ],
                        [
                          c.securityCritical,
                          securityOverview
                            .summary
                            .critical,
                          "critical",
                        ],
                        [
                          c.securityQuarantined,
                          securityOverview
                            .summary
                            .quarantined,
                          "quarantine",
                        ],
                        [
                          c.securityRaidBursts,
                          securityOverview
                            .summary
                            .raidBursts,
                          "raid",
                        ],
                        [
                          c.securityNewAccounts,
                          securityOverview
                            .summary
                            .newAccounts,
                          "account",
                        ],
                      ].map(
                        ([
                          label,
                          value,
                          tone,
                        ]) => (
                          <div
                            key={
                              label
                            }
                            className={
                              tone
                            }
                          >
                            <span>
                              {label}
                            </span>
                            <strong>
                              {value}
                            </strong>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="bot-dashboard-security-feed">
                      {securityOverview
                        .events
                        .length ? (
                        securityOverview.events
                          .slice(
                            0,
                            40,
                          )
                          .map(
                            (
                              item,
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className={
                                  `security-event ${item.severity}`
                                }
                              >
                                <span className="security-dot" />
                                <div>
                                  <strong>
                                    {
                                      item.event_type
                                    }
                                  </strong>
                                  <small>
                                    {item.user_id
                                      ? "User " +
                                        item.user_id
                                      : "Guild event"}
                                  </small>
                                  {Array.isArray(
                                    item
                                      .details
                                      ?.reasons,
                                  ) &&
                                  item
                                    .details
                                    .reasons
                                    .length ? (
                                    <p>
                                      {item.details.reasons.join(
                                        " · ",
                                      )}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="event-meta">
                                  <span>
                                    {item.action_taken ===
                                    "quarantine"
                                      ? c.securityActionQuarantine
                                      : String(
                                          item.action_taken ||
                                            c.securityActionObserved,
                                        ).toUpperCase()}
                                  </span>
                                  <time>
                                    {formatKyivDateTime(
                                      item
                                        .created_at,
                                      language,
                                    )}
                                  </time>
                                </div>
                              </div>
                            ),
                          )
                      ) : (
                        <p className="bot-dashboard-log-empty">
                          {c.securityNoEvents}
                        </p>
                      )}
                    </div>
                  </article>

                  <article className="bot-dashboard-module-card module-system module-server">
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

                  <article className="bot-dashboard-module-card module-system module-config-history">
                    <header>
                      <div>
                        <strong>
                          {c.configHistory}
                        </strong>
                        <small>
                          {c.configHistoryText}
                        </small>
                      </div>

                      <span className="bot-dashboard-history-count">
                        {
                          configHistory
                            .versions
                            .length
                        }
                        /50
                      </span>
                    </header>

                    {configHistoryError ? (
                      <div className="bot-dashboard-inline-error">
                        {configHistoryError}
                      </div>
                    ) : null}

                    <div className="bot-dashboard-history-current">
                      <div>
                        <span>
                          {c.configCurrent}
                        </span>
                        <strong>
                          {configHistory
                            .current
                            .updatedAt
                            ? formatKyivDateTime(
                                configHistory
                                  .current
                                  .updatedAt,
                                language,
                              )
                            : "—"}
                        </strong>
                      </div>

                      <div className="bot-dashboard-history-create">
                        <label>
                          <span>
                            {c.configSnapshotLabel}
                          </span>
                          <input
                            type="text"
                            maxLength={100}
                            placeholder={
                              c.configSnapshotPlaceholder
                            }
                            value={
                              configSnapshotLabel
                            }
                            onChange={(
                              event,
                            ) =>
                              setConfigSnapshotLabel(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={
                            createConfigSnapshot
                          }
                          disabled={
                            busy ===
                              "config-snapshot" ||
                            !canControl(
                              "system.snapshot",
                            )
                          }
                        >
                          {busy ===
                          "config-snapshot"
                            ? c.configCreatingSnapshot
                            : c.configCreateSnapshot}
                        </button>
                      </div>
                    </div>

                    <div className="bot-dashboard-history-list">
                      {configHistoryLoading ? (
                        <p className="bot-dashboard-log-empty">
                          {c.resourcesLoading}
                        </p>
                      ) : configHistory
                          .versions
                          .length ? (
                        configHistory.versions.map(
                          (
                            version,
                          ) => {
                            const sourceLabel =
                              version.source ===
                              "manual"
                                ? c.configSourceManual
                                : version.source ===
                                    "restore"
                                  ? c.configSourceRestore
                                  : c.configSourceSave;

                            const groupLabel =
                              (
                                group,
                              ) =>
                                group ===
                                "general"
                                  ? c.configGroupGeneral
                                  : group ===
                                      "onboarding"
                                    ? c.configGroupOnboarding
                                    : group ===
                                        "moderation"
                                      ? c.configGroupModeration
                                      : group ===
                                          "security"
                                        ? c.configGroupSecurity
                                        : c.configGroupSupport;

                            return (
                              <div
                                key={
                                  version.id
                                }
                                className="bot-dashboard-history-row"
                              >
                                <div className="version-main">
                                  <div>
                                    <span
                                      className={
                                        `source ${version.source}`
                                      }
                                    >
                                      {
                                        sourceLabel
                                      }
                                    </span>
                                    <strong>
                                      {version.label ||
                                        formatKyivDateTime(
                                          version
                                            .createdAt,
                                          language,
                                        )}
                                    </strong>
                                  </div>

                                  <small>
                                    {formatKyivDateTime(
                                      version
                                        .createdAt,
                                      language,
                                    )}
                                  </small>

                                  <div className="groups">
                                    {version
                                      .changedGroups
                                      ?.length
                                      ? version.changedGroups.map(
                                          (
                                            group,
                                          ) => (
                                            <span
                                              key={
                                                group
                                              }
                                            >
                                              {groupLabel(
                                                group,
                                              )}
                                            </span>
                                          ),
                                        )
                                      : (
                                          <span>
                                            {c.configNoDifference}
                                          </span>
                                        )}
                                  </div>
                                </div>

                                <div className="version-meta">
                                  <span>
                                    {
                                      version
                                        .changedCount
                                    }{" "}
                                    {c.configChanged}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void restoreConfigVersion(
                                        version.id,
                                      )
                                    }
                                    disabled={
                                      busy ===
                                        "config-restore:" +
                                          version.id ||
                                      !canControl(
                                        "system.restore",
                                      )
                                    }
                                  >
                                    {busy ===
                                    "config-restore:" +
                                      version.id
                                      ? c.configRestoring
                                      : c.configRestore}
                                  </button>
                                </div>
                              </div>
                            );
                          },
                        )
                      ) : (
                        <p className="bot-dashboard-log-empty">
                          {c.configHistoryEmpty}
                        </p>
                      )}
                    </div>
                  </article>
                </div>
              </section>

              <div className="bot-dashboard-savebar">
                <div>
                  <span>
                    {c.currentSection}
                  </span>
                  <strong>
                    {settingsTab ===
                    "overview"
                      ? c.tabOverview
                      : settingsTab ===
                          "analytics"
                        ? c.tabAnalytics
                        : settingsTab ===
                            "security"
                          ? c.tabSecurity
                          : settingsTab ===
                              "onboarding"
                          ? c.tabOnboarding
                        : settingsTab ===
                            "moderation"
                          ? c.tabModeration
                          : settingsTab ===
                              "support"
                            ? c.tabSupport
                            : settingsTab ===
                                "publishing"
                              ? c.tabPublishing
                              : c.tabSystem}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="bot-dashboard-save"
                  disabled={
                    busy ===
                      "settings" ||
                    ![
                      "overview",
                      "onboarding",
                      "moderation",
                      "support",
                      "security",
                      "system",
                    ].includes(
                      settingsTab,
                    ) ||
                    !canControl(
                      (
                        settingsTab ===
                          "overview"
                          ? "system"
                          : settingsTab
                      ) +
                        ".manage",
                    )
                  }
                >
                  {busy ===
                  "settings"
                    ? c.savingChanges
                    : c.saveChanges}
                </button>
              </div>
            </form>

            <section
              className={
                `bot-dashboard-command-center${settingsTab === "commands" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-command-head">
                <div>
                  <span>
                    COMMAND CENTER
                  </span>
                  <h3>
                    {c.commandCenterTitle}
                  </h3>
                  <p>
                    {c.commandCenterText}
                  </p>
                </div>

                <div className="bot-dashboard-command-head-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={
                      resetCommandCenter
                    }
                    disabled={
                      busy ===
                        "command-center-reset" ||
                      !canControl(
                        "commands.manage",
                      )
                    }
                  >
                    {c.commandCenterReset}
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      void loadCommandCenter()
                    }
                    disabled={
                      commandCenterLoading
                    }
                  >
                    {commandCenterLoading
                      ? c.commandCenterLoading
                      : c.commandCenterRefresh}
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveCommandCenter
                    }
                    disabled={
                      busy ===
                        "command-center" ||
                      !canControl(
                        "commands.manage",
                      )
                    }
                  >
                    {busy ===
                    "command-center"
                      ? c.commandCenterSaving
                      : c.commandCenterSave}
                  </button>
                </div>
              </header>

              {commandCenterError ? (
                <div className="bot-dashboard-alert error">
                  {commandCenterError}
                </div>
              ) : null}

              <div className="bot-dashboard-command-kpis">
                {[
                  [
                    c.commandEnabledCount,
                    commandCenter
                      .summary
                      .enabled +
                      "/" +
                      (
                        commandCenter
                          .summary
                          .commands ||
                        26
                      ),
                    "enabled",
                  ],
                  [
                    c.commandInvocations,
                    commandCenter
                      .summary
                      .invocations,
                    "uses",
                  ],
                  [
                    c.commandUniqueUsers,
                    commandCenter
                      .summary
                      .uniqueUsers,
                    "users",
                  ],
                  [
                    c.commandDenied,
                    commandCenter
                      .summary
                      .denied,
                    "denied",
                  ],
                  [
                    c.commandErrors,
                    commandCenter
                      .summary
                      .errors,
                    "errors",
                  ],
                  [
                    c.commandCustomized,
                    commandCenter
                      .summary
                      .customized,
                    "custom",
                  ],
                ].map(
                  ([
                    label,
                    value,
                    tone,
                  ]) => (
                    <article
                      key={
                        label
                      }
                      className={
                        tone
                      }
                    >
                      <span>
                        {label}
                      </span>
                      <strong>
                        {value}
                      </strong>
                    </article>
                  ),
                )}
              </div>

              <div className="bot-dashboard-command-filters">
                <label>
                  <span>
                    {c.commandSearch}
                  </span>
                  <input
                    type="search"
                    placeholder={
                      c.commandSearchPlaceholder
                    }
                    value={
                      commandSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setCommandSearch(
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {c.commandCategory}
                  </span>
                  <select
                    value={
                      commandCategory
                    }
                    onChange={(
                      event,
                    ) =>
                      setCommandCategory(
                        event
                          .target
                          .value,
                      )
                    }
                  >
                    <option value="all">
                      {c.commandCategoryAll}
                    </option>
                    <option value="utility">
                      {c.commandCategoryUtility}
                    </option>
                    <option value="community">
                      {c.commandCategoryCommunity}
                    </option>
                    <option value="moderation">
                      {c.commandCategoryModeration}
                    </option>
                    <option value="iste">
                      {c.commandCategoryIste}
                    </option>
                    <option value="recruitment">
                      {c.commandCategoryRecruitment}
                    </option>
                  </select>
                </label>
              </div>

              <div className="bot-dashboard-command-layout">
                <article className="bot-dashboard-command-list-card">
                  <header>
                    <strong>
                      Slash commands
                    </strong>
                    <span>
                      {
                        commandCenter
                          .commands
                          .filter(
                            (
                              command,
                            ) =>
                              (
                                commandCategory ===
                                  "all" ||
                                command.category ===
                                  commandCategory
                              ) &&
                              (
                                !commandSearch
                                  .trim() ||
                                (
                                  command.name +
                                  " " +
                                  command.label
                                )
                                  .toLowerCase()
                                  .includes(
                                    commandSearch
                                      .trim()
                                      .toLowerCase(),
                                  )
                              ),
                          )
                          .length
                      }
                    </span>
                  </header>

                  <div className="bot-dashboard-command-list">
                    {commandCenter.commands
                      .filter(
                        (
                          command,
                        ) =>
                          (
                            commandCategory ===
                              "all" ||
                            command.category ===
                              commandCategory
                          ) &&
                          (
                            !commandSearch
                              .trim() ||
                            (
                              command.name +
                              " " +
                              command.label
                            )
                              .toLowerCase()
                              .includes(
                                commandSearch
                                  .trim()
                                  .toLowerCase(),
                              )
                          ),
                      )
                      .map(
                        (
                          command,
                        ) => {
                          const categoryLabel =
                            command.category ===
                            "utility"
                              ? c.commandCategoryUtility
                              : command.category ===
                                  "community"
                                ? c.commandCategoryCommunity
                                : command.category ===
                                    "moderation"
                                  ? c.commandCategoryModeration
                                  : command.category ===
                                      "recruitment"
                                    ? c.commandCategoryRecruitment
                                    : c.commandCategoryIste;

                          const expanded =
                            expandedCommand ===
                            command.name;

                          return (
                            <div
                              key={
                                command.name
                              }
                              className={
                                `bot-dashboard-command-row${command.enabled ? "" : " disabled"}${expanded ? " expanded" : ""}`
                              }
                            >
                              <div className="command-summary">
                                <div className="command-name">
                                  <code>
                                    /
                                    {
                                      command.name
                                    }
                                  </code>
                                  <div>
                                    <strong>
                                      {
                                        command.label
                                      }
                                    </strong>
                                    <small>
                                      {
                                        categoryLabel
                                      }
                                    </small>
                                  </div>
                                </div>

                                <div className="command-stats">
                                  <span>
                                    <strong>
                                      {
                                        command
                                          .stats
                                          ?.total ||
                                        0
                                      }
                                    </strong>
                                    {c.commandUses}
                                  </span>
                                  <span
                                    className={
                                      (
                                        command
                                          .stats
                                          ?.denied ||
                                        0
                                      )
                                        ? "denied"
                                        : ""
                                    }
                                  >
                                    <strong>
                                      {
                                        command
                                          .stats
                                          ?.denied ||
                                        0
                                      }
                                    </strong>
                                    {c.commandDenied}
                                  </span>
                                </div>

                                <label className="bot-dashboard-switch command-toggle">
                                  <input
                                    type="checkbox"
                                    checked={
                                      command.enabled
                                    }
                                    disabled={
                                      !canControl(
                                        "commands.manage",
                                      )
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      patchCommand(
                                        command.name,
                                        {
                                          enabled:
                                            event
                                              .target
                                              .checked,
                                        },
                                      )
                                    }
                                  />
                                  <span />
                                </label>

                                <button
                                  type="button"
                                  className="command-configure"
                                  onClick={() =>
                                    setExpandedCommand(
                                      expanded
                                        ? ""
                                        : command.name,
                                    )
                                  }
                                >
                                  {expanded
                                    ? c.commandClose
                                    : c.commandConfigure}
                                </button>
                              </div>

                              {expanded ? (
                                <div className="command-policy">
                                  <label>
                                    <span>
                                      {c.commandCooldown}
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={86400}
                                      step={1}
                                      value={
                                        command
                                          .cooldownSeconds
                                      }
                                      disabled={
                                        !canControl(
                                          "commands.manage",
                                        )
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        patchCommand(
                                          command.name,
                                          {
                                            cooldownSeconds:
                                              Math.max(
                                                0,
                                                Math.min(
                                                  86400,
                                                  Number(
                                                    event
                                                      .target
                                                      .value,
                                                  ) ||
                                                    0,
                                                ),
                                              ),
                                          },
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    <span>
                                      {c.commandRoles}
                                    </span>
                                    <select
                                      multiple
                                      size={4}
                                      value={
                                        command
                                          .allowedRoleIds
                                      }
                                      disabled={
                                        !canControl(
                                          "commands.manage",
                                        )
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        patchCommand(
                                          command.name,
                                          {
                                            allowedRoleIds:
                                              Array.from(
                                                event
                                                  .target
                                                  .selectedOptions,
                                              ).map(
                                                (
                                                  option,
                                                ) =>
                                                  option.value,
                                              ),
                                          },
                                        )
                                      }
                                    >
                                      {resources.roles.map(
                                        (
                                          role,
                                        ) => (
                                          <option
                                            key={
                                              role.id
                                            }
                                            value={
                                              role.id
                                            }
                                          >
                                            @
                                            {
                                              role.name
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </label>

                                  <label>
                                    <span>
                                      {c.commandChannels}
                                    </span>
                                    <select
                                      multiple
                                      size={4}
                                      value={
                                        command
                                          .allowedChannelIds
                                      }
                                      disabled={
                                        !canControl(
                                          "commands.manage",
                                        )
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        patchCommand(
                                          command.name,
                                          {
                                            allowedChannelIds:
                                              Array.from(
                                                event
                                                  .target
                                                  .selectedOptions,
                                              ).map(
                                                (
                                                  option,
                                                ) =>
                                                  option.value,
                                              ),
                                          },
                                        )
                                      }
                                    >
                                      {resources.channels.map(
                                        (
                                          channel,
                                        ) => (
                                          <option
                                            key={
                                              channel.id
                                            }
                                            value={
                                              channel.id
                                            }
                                          >
                                            #
                                            {
                                              channel.name
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </label>

                                  <div className="command-policy-hint">
                                    <span>
                                      {c.commandRestrictionHint}
                                    </span>
                                    <small>
                                      {c.commandSelectMultiple}
                                    </small>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        },
                      )}

                    {!commandCenter.commands
                      .filter(
                        (
                          command,
                        ) =>
                          (
                            commandCategory ===
                              "all" ||
                            command.category ===
                              commandCategory
                          ) &&
                          (
                            !commandSearch
                              .trim() ||
                            (
                              command.name +
                              " " +
                              command.label
                            )
                              .toLowerCase()
                              .includes(
                                commandSearch
                                  .trim()
                                  .toLowerCase(),
                              )
                          ),
                      )
                      .length ? (
                      <p className="bot-dashboard-log-empty">
                        {c.commandNoResults}
                      </p>
                    ) : null}
                  </div>
                </article>

                <article className="bot-dashboard-command-usage">
                  <header>
                    <strong>
                      {c.commandRecentUsage}
                    </strong>
                    <span>
                      {
                        commandCenter
                          .recentUsage
                          .length
                      }
                    </span>
                  </header>

                  <div className="usage-list">
                    {commandCenter
                      .recentUsage
                      .length ? (
                      commandCenter.recentUsage.map(
                        (
                          usage,
                        ) => (
                          <div
                            key={
                              usage.id
                            }
                            className={
                              `usage-row ${usage.outcome}`
                            }
                          >
                            <div>
                              <code>
                                /
                                {
                                  usage.command
                                }
                              </code>
                              <span
                                className="outcome"
                              >
                                {usage.outcome ===
                                "denied"
                                  ? c.commandOutcomeDenied
                                  : usage.outcome ===
                                      "error"
                                    ? c.commandOutcomeError
                                    : c.commandOutcomeAllowed}
                              </span>
                            </div>

                            <small>
                              User{" "}
                              {
                                usage.userId
                              }
                              {usage.channelId
                                ? " · #" +
                                  usage.channelId
                                : ""}
                            </small>

                            {usage.deniedReason ? (
                              <small className="reason">
                                {
                                  usage.deniedReason
                                }
                              </small>
                            ) : null}

                            <time>
                              {formatKyivDateTime(
                                usage
                                  .createdAt,
                                language,
                              )}
                              {usage.durationMs !=
                              null
                                ? " · " +
                                  usage.durationMs +
                                  " ms"
                                : ""}
                            </time>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="bot-dashboard-log-empty">
                        {c.commandNoUsage}
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section
              className={
                `bot-dashboard-staff-center${settingsTab === "staff" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-staff-head">
                <div>
                  <span>
                    STAFF RBAC
                  </span>
                  <h3>
                    {c.staffTitle}
                  </h3>
                  <p>
                    {c.staffText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadStaffCenter()
                  }
                  disabled={
                    staffLoading
                  }
                >
                  {staffLoading
                    ? c.staffLoading
                    : c.commandCenterRefresh}
                </button>
              </header>

              {staffError ? (
                <div className="bot-dashboard-alert error">
                  {staffError}
                </div>
              ) : null}

              <div className="bot-dashboard-staff-layout">
                <article className="bot-dashboard-staff-editor">
                  <header>
                    <strong>
                      {c.staffPolicies}
                    </strong>
                    <span>
                      {
                        staffCenter
                          .policies
                          .length
                      }
                    </span>
                  </header>

                  <div className="staff-editor-body">
                    <div className="staff-editor-grid">
                      <label>
                        <span>
                          {c.staffRole}
                        </span>
                        <select
                          value={
                            staffDraft
                              .roleId
                          }
                          onChange={(
                            event,
                          ) => {
                            const roleId =
                              event
                                .target
                                .value;
                            const role =
                              resources
                                .roles
                                .find(
                                  (
                                    item,
                                  ) =>
                                    item.id ===
                                    roleId,
                                );

                            setStaffDraft(
                              (
                                current,
                              ) => ({
                                ...current,
                                roleId,
                                label:
                                  current.label ||
                                  role
                                    ?.name ||
                                  "",
                              }),
                            );
                          }}
                        >
                          <option value="">
                            {c.chooseRole}
                          </option>
                          {resources.roles.map(
                            (
                              role,
                            ) => (
                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                @
                                {
                                  role.name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.staffPreset}
                        </span>
                        <select
                          value={
                            staffDraft
                              .preset
                          }
                          onChange={(
                            event,
                          ) =>
                            applyStaffPreset(
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="moderator">
                            {c.staffPresetModerator}
                          </option>
                          <option value="support">
                            {c.staffPresetSupport}
                          </option>
                          <option value="recruiter">
                            {c.staffPresetRecruiter}
                          </option>
                          <option value="security">
                            {c.staffPresetSecurity}
                          </option>
                          <option value="content">
                            {c.staffPresetContent}
                          </option>
                          <option value="administrator">
                            {c.staffPresetAdministrator}
                          </option>
                        </select>
                      </label>

                      <label>
                        <span>
                          {c.staffLabel}
                        </span>
                        <input
                          type="text"
                          maxLength={100}
                          placeholder={
                            c.staffLabelPlaceholder
                          }
                          value={
                            staffDraft
                              .label
                          }
                          onChange={(
                            event,
                          ) =>
                            setStaffDraft(
                              (
                                current,
                              ) => ({
                                ...current,
                                label:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                        />
                      </label>

                      <label className="staff-enabled-line">
                        <input
                          type="checkbox"
                          checked={
                            staffDraft
                              .enabled
                          }
                          onChange={(
                            event,
                          ) =>
                            setStaffDraft(
                              (
                                current,
                              ) => ({
                                ...current,
                                enabled:
                                  event
                                    .target
                                    .checked,
                              }),
                            )
                          }
                        />
                        <span>
                          {c.staffEnabled}
                        </span>
                      </label>
                    </div>

                    <div className="staff-permission-grid">
                      {staffCenter.permissionCatalog.map(
                        (
                          permission,
                        ) => (
                          <label
                            key={
                              permission.key
                            }
                            className={
                              `staff-permission ${permission.level}`
                            }
                          >
                            <input
                              type="checkbox"
                              checked={
                                staffDraft
                                  .permissionKeys
                                  .includes(
                                    permission.key,
                                  )
                              }
                              onChange={() =>
                                toggleStaffPermission(
                                  permission.key,
                                )
                              }
                            />
                            <span>
                              <strong>
                                {
                                  permission.label
                                }
                              </strong>
                              <small>
                                {
                                  permission.key
                                }
                              </small>
                            </span>
                          </label>
                        ),
                      )}
                    </div>

                    <p className="staff-danger-hint">
                      {c.staffDangerHint}
                    </p>

                    <div className="staff-editor-actions">
                      {staffDraft.roleId ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            setStaffDraft({
                              ...EMPTY_STAFF_DRAFT,
                            })
                          }
                        >
                          {c.staffCancelEdit}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={
                          saveStaffPolicy
                        }
                        disabled={
                          busy ===
                            "staff-policy" ||
                          !staffDraft
                            .roleId ||
                          !staffDraft
                            .permissionKeys
                            .length
                        }
                      >
                        {busy ===
                        "staff-policy"
                          ? c.staffSaving
                          : c.staffSavePolicy}
                      </button>
                    </div>
                  </div>

                  <div className="staff-policy-list">
                    {staffCenter
                      .policies
                      .length ? (
                      staffCenter.policies.map(
                        (
                          policy,
                        ) => {
                          const role =
                            resources.roles.find(
                              (
                                item,
                              ) =>
                                item.id ===
                                policy.roleId,
                            );

                          return (
                            <div
                              key={
                                policy.roleId
                              }
                              className={
                                `staff-policy-row${policy.enabled ? "" : " disabled"}`
                              }
                            >
                              <div>
                                <strong>
                                  @
                                  {role
                                    ?.name ||
                                    policy.label ||
                                    policy.roleId}
                                </strong>
                                <small>
                                  {policy.label ||
                                    role
                                      ?.name ||
                                    ""}
                                </small>
                                <div className="staff-policy-scopes">
                                  {policy.permissionKeys.map(
                                    (
                                      key,
                                    ) => (
                                      <span
                                        key={
                                          key
                                        }
                                      >
                                        {
                                          key
                                        }
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div className="staff-policy-actions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    editStaffPolicy(
                                      policy,
                                    )
                                  }
                                >
                                  {c.staffEdit}
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    void deleteStaffPolicy(
                                      policy.roleId,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    "staff-delete:" +
                                      policy.roleId
                                  }
                                >
                                  {c.staffDelete}
                                </button>
                              </div>
                            </div>
                          );
                        },
                      )
                    ) : (
                      <p className="bot-dashboard-log-empty">
                        {c.staffNoPolicies}
                      </p>
                    )}
                  </div>
                </article>

                <article className="bot-dashboard-staff-audit">
                  <header>
                    <strong>
                      {c.staffAccessAudit}
                    </strong>
                    <span>
                      {
                        staffCenter
                          .recentAccess
                          .length
                      }
                    </span>
                  </header>

                  <div className="staff-audit-list">
                    {staffCenter
                      .recentAccess
                      .length ? (
                      staffCenter.recentAccess.map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className={
                              `staff-audit-row ${item.decision}`
                            }
                          >
                            <div>
                              <strong>
                                {item.permissionKey ||
                                  item.action}
                              </strong>
                              <span>
                                {item.decision ===
                                "allowed"
                                  ? c.staffAllowed
                                  : c.staffDenied}
                              </span>
                            </div>

                            <small>
                              Discord{" "}
                              {item.discordUserId ||
                                "—"}
                            </small>
                            <small>
                              {
                                item.action
                              }
                            </small>
                            <time>
                              {formatKyivDateTime(
                                item
                                  .createdAt,
                                language,
                              )}
                            </time>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="bot-dashboard-log-empty">
                        {c.staffNoAudit}
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section
              className={
                `bot-dashboard-incident-center${settingsTab === "incidents" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-incident-head">
                <div>
                  <span>
                    INCIDENT CENTER
                  </span>
                  <h3>
                    {c.incidentTitle}
                  </h3>
                  <p>
                    {c.incidentText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadIncidentCenter()
                  }
                  disabled={
                    incidentLoading
                  }
                >
                  {incidentLoading
                    ? c.incidentLoading
                    : c.incidentRefresh}
                </button>
              </header>

              {incidentError ? (
                <div className="bot-dashboard-alert error">
                  {incidentError}
                </div>
              ) : null}

              <div className="bot-dashboard-incident-kpis">
                {[
                  [
                    c.incidentEvents,
                    incidentCenter
                      .summary
                      .events,
                    "events",
                  ],
                  [
                    c.incidentOpen,
                    incidentCenter
                      .summary
                      .open,
                    "open",
                  ],
                  [
                    c.incidentReviewing,
                    incidentCenter
                      .summary
                      .reviewing,
                    "reviewing",
                  ],
                  [
                    c.incidentResolved,
                    incidentCenter
                      .summary
                      .resolved,
                    "resolved",
                  ],
                  [
                    c.incidentCritical,
                    incidentCenter
                      .summary
                      .critical,
                    "critical",
                  ],
                ].map(
                  ([
                    label,
                    value,
                    tone,
                  ]) => (
                    <article
                      key={
                        label
                      }
                      className={
                        tone
                      }
                    >
                      <span>
                        {label}
                      </span>
                      <strong>
                        {value}
                      </strong>
                    </article>
                  ),
                )}
              </div>

              <div className="bot-dashboard-incident-layout">
                <article className="bot-dashboard-incident-events">
                  <header>
                    <strong>
                      {c.incidentEventFeed}
                    </strong>

                    <select
                      value={
                        incidentSourceFilter
                      }
                      onChange={(
                        event,
                      ) =>
                        setIncidentSourceFilter(
                          event
                            .target
                            .value,
                        )
                      }
                    >
                      <option value="all">
                        {c.incidentSourceAll}
                      </option>
                      <option value="audit">
                        {c.incidentSourceAudit}
                      </option>
                      <option value="security">
                        {c.incidentSourceSecurity}
                      </option>
                      <option value="moderation">
                        {c.incidentSourceModeration}
                      </option>
                      <option value="command">
                        {c.incidentSourceCommand}
                      </option>
                      <option value="ticket">
                        {c.incidentSourceTicket}
                      </option>
                    </select>
                  </header>

                  <div className="incident-event-list">
                    {incidentCenter.events
                      .filter(
                        (
                          event,
                        ) =>
                          incidentSourceFilter ===
                            "all" ||
                          event.sourceType ===
                            incidentSourceFilter,
                      )
                      .map(
                        (
                          event,
                        ) => {
                          const createBusy =
                            busy ===
                            "incident-create:" +
                              event.sourceType +
                              ":" +
                              event.sourceId;

                          return (
                            <div
                              key={
                                event.sourceType +
                                ":" +
                                event.sourceId
                              }
                              className={
                                `incident-event ${event.severity}`
                              }
                            >
                              <div className="event-top">
                                <div>
                                  <span className="source">
                                    {
                                      event.sourceType
                                    }
                                  </span>
                                  <strong>
                                    {
                                      event.title
                                    }
                                  </strong>
                                </div>

                                <span
                                  className={
                                    `severity ${event.severity}`
                                  }
                                >
                                  {
                                    event.severity
                                  }
                                </span>
                              </div>

                              {event.summary ? (
                                <p>
                                  {
                                    event.summary
                                  }
                                </p>
                              ) : null}

                              <div className="event-identities">
                                {event.subjectUserId ? (
                                  <span>
                                    {c.incidentSubject}:{" "}
                                    {
                                      event.subjectUserId
                                    }
                                  </span>
                                ) : null}
                                {event.actorUserId ? (
                                  <span>
                                    {c.incidentActor}:{" "}
                                    {
                                      event.actorUserId
                                    }
                                  </span>
                                ) : null}
                                {event.channelId ? (
                                  <span>
                                    {c.incidentChannel}:{" "}
                                    {
                                      event.channelId
                                    }
                                  </span>
                                ) : null}
                              </div>

                              <footer>
                                <time>
                                  {formatKyivDateTime(
                                    event
                                      .createdAt,
                                    language,
                                  )}
                                </time>

                                {event.incidentId ? (
                                  <span className="tracked">
                                    {
                                      event.incidentStatus ||
                                      c.incidentAlreadyTracked
                                    }
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void createIncidentFromEvent(
                                        event,
                                      )
                                    }
                                    disabled={
                                      createBusy ||
                                      !canControl(
                                        "incidents.manage",
                                      )
                                    }
                                  >
                                    {createBusy
                                      ? c.incidentCreating
                                      : c.incidentCreate}
                                  </button>
                                )}
                              </footer>
                            </div>
                          );
                        },
                      )}

                    {!incidentCenter.events
                      .filter(
                        (
                          event,
                        ) =>
                          incidentSourceFilter ===
                            "all" ||
                          event.sourceType ===
                            incidentSourceFilter,
                      )
                      .length ? (
                      <p className="bot-dashboard-log-empty">
                        {c.incidentNoEvents}
                      </p>
                    ) : null}
                  </div>
                </article>

                <article className="bot-dashboard-incident-tracked">
                  <header>
                    <strong>
                      {c.incidentTracked}
                    </strong>

                    <select
                      value={
                        incidentStatusFilter
                      }
                      onChange={(
                        event,
                      ) =>
                        setIncidentStatusFilter(
                          event
                            .target
                            .value,
                        )
                      }
                    >
                      <option value="all">
                        {c.incidentStatusAll}
                      </option>
                      <option value="open">
                        {c.incidentOpen}
                      </option>
                      <option value="reviewing">
                        {c.incidentReviewing}
                      </option>
                      <option value="resolved">
                        {c.incidentResolved}
                      </option>
                    </select>
                  </header>

                  <div className="incident-card-list">
                    {incidentCenter.incidents
                      .filter(
                        (
                          incident,
                        ) =>
                          incidentStatusFilter ===
                            "all" ||
                          incident.status ===
                            incidentStatusFilter,
                      )
                      .map(
                        (
                          incident,
                        ) => {
                          const saveBusy =
                            busy ===
                            "incident-save:" +
                              incident.id;
                          const noteBusy =
                            busy ===
                            "incident-note:" +
                              incident.id;

                          return (
                            <div
                              key={
                                incident.id
                              }
                              className={
                                `incident-card ${incident.severity} ${incident.status}`
                              }
                            >
                              <div className="incident-card-head">
                                <div>
                                  <span>
                                    {
                                      incident.sourceType
                                    }
                                  </span>
                                  <strong>
                                    {
                                      incident.title
                                    }
                                  </strong>
                                  <time>
                                    {formatKyivDateTime(
                                      incident
                                        .createdAt,
                                      language,
                                    )}
                                  </time>
                                </div>

                                <span className="incident-id">
                                  #
                                  {String(
                                    incident.id,
                                  ).slice(
                                    0,
                                    8,
                                  )}
                                </span>
                              </div>

                              {incident.summary ? (
                                <p className="incident-summary">
                                  {
                                    incident.summary
                                  }
                                </p>
                              ) : null}

                              <div className="incident-controls">
                                <label>
                                  <span>
                                    {c.incidentStatus}
                                  </span>
                                  <select
                                    value={
                                      incident.status
                                    }
                                    disabled={
                                      !canControl(
                                        "incidents.manage",
                                      )
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      patchIncident(
                                        incident.id,
                                        {
                                          status:
                                            event
                                              .target
                                              .value,
                                        },
                                      )
                                    }
                                  >
                                    <option value="open">
                                      {c.incidentOpen}
                                    </option>
                                    <option value="reviewing">
                                      {c.incidentReviewing}
                                    </option>
                                    <option value="resolved">
                                      {c.incidentResolved}
                                    </option>
                                  </select>
                                </label>

                                <label>
                                  <span>
                                    {c.incidentSeverity}
                                  </span>
                                  <select
                                    value={
                                      incident.severity
                                    }
                                    disabled={
                                      !canControl(
                                        "incidents.manage",
                                      )
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      patchIncident(
                                        incident.id,
                                        {
                                          severity:
                                            event
                                              .target
                                              .value,
                                        },
                                      )
                                    }
                                  >
                                    <option value="info">
                                      INFO
                                    </option>
                                    <option value="warning">
                                      WARNING
                                    </option>
                                    <option value="critical">
                                      CRITICAL
                                    </option>
                                  </select>
                                </label>
                              </div>

                              <label className="incident-resolution">
                                <span>
                                  {c.incidentResolution}
                                </span>
                                <textarea
                                  rows={2}
                                  maxLength={2000}
                                  placeholder={
                                    c.incidentResolutionPlaceholder
                                  }
                                  value={
                                    incident
                                      .resolutionNote ||
                                    ""
                                  }
                                  disabled={
                                    !canControl(
                                      "incidents.manage",
                                    )
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    patchIncident(
                                      incident.id,
                                      {
                                        resolutionNote:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                />
                              </label>

                              <button
                                type="button"
                                className="incident-save"
                                onClick={() =>
                                  void saveIncident(
                                    incident,
                                  )
                                }
                                disabled={
                                  saveBusy ||
                                  !canControl(
                                    "incidents.manage",
                                  )
                                }
                              >
                                {saveBusy
                                  ? c.incidentSaving
                                  : c.incidentSave}
                              </button>

                              <div className="incident-notes">
                                <strong>
                                  {c.incidentNotes}
                                </strong>

                                {incident.notes
                                  ?.length ? (
                                  incident.notes.map(
                                    (
                                      note,
                                    ) => (
                                      <div
                                        key={
                                          note.id
                                        }
                                        className="incident-note"
                                      >
                                        <p>
                                          {
                                            note.note
                                          }
                                        </p>
                                        <time>
                                          {formatKyivDateTime(
                                            note
                                              .createdAt,
                                            language,
                                          )}
                                        </time>
                                      </div>
                                    ),
                                  )
                                ) : null}

                                <div className="incident-note-compose">
                                  <textarea
                                    rows={2}
                                    maxLength={2000}
                                    placeholder={
                                      c.incidentNotePlaceholder
                                    }
                                    value={
                                      incidentNoteDrafts[
                                        incident.id
                                      ] ||
                                      ""
                                    }
                                    disabled={
                                      !canControl(
                                        "incidents.manage",
                                      )
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setIncidentNoteDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [incident.id]:
                                            event
                                              .target
                                              .value,
                                        }),
                                      )
                                    }
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void addIncidentNote(
                                        incident.id,
                                      )
                                    }
                                    disabled={
                                      noteBusy ||
                                      !canControl(
                                        "incidents.manage",
                                      ) ||
                                      !String(
                                        incidentNoteDrafts[
                                          incident.id
                                        ] ||
                                          "",
                                      ).trim()
                                    }
                                  >
                                    {noteBusy
                                      ? c.incidentAddingNote
                                      : c.incidentAddNote}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}

                    {!incidentCenter.incidents
                      .filter(
                        (
                          incident,
                        ) =>
                          incidentStatusFilter ===
                            "all" ||
                          incident.status ===
                            incidentStatusFilter,
                      )
                      .length ? (
                      <p className="bot-dashboard-log-empty">
                        {c.incidentNoTracked}
                      </p>
                    ) : null}
                  </div>
                </article>
              </div>
            </section>

            <section
              className={
                `bot-dashboard-diagnostics-center${settingsTab === "diagnostics" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-diagnostics-head">
                <div>
                  <span>
                    DIAGNOSTICS
                  </span>
                  <h3>
                    {c.diagnosticsTitle}
                  </h3>
                  <p>
                    {c.diagnosticsText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadDiagnostics()
                  }
                  disabled={
                    diagnosticsLoading
                  }
                >
                  {diagnosticsLoading
                    ? c.diagnosticsLoading
                    : c.diagnosticsRefresh}
                </button>
              </header>

              {diagnosticsError ? (
                <div className="bot-dashboard-alert error">
                  {diagnosticsError}
                </div>
              ) : null}

              <div
                className={
                  `bot-dashboard-diagnostics-status ${diagnostics.overallStatus || "warning"}`
                }
              >
                <div className="state">
                  <span className="pulse" />
                  <div>
                    <small>
                      SYSTEM STATUS
                    </small>
                    <strong>
                      {diagnostics.overallStatus ===
                      "error"
                        ? c.diagnosticsCritical
                        : diagnostics.overallStatus ===
                            "warning"
                          ? c.diagnosticsWarning
                          : c.diagnosticsHealthy}
                    </strong>
                  </div>
                </div>

                <div className="summary">
                  <span className="ok">
                    <strong>
                      {
                        diagnostics
                          .summary
                          .ok
                      }
                    </strong>
                    {c.diagnosticsOk}
                  </span>
                  <span className="warning">
                    <strong>
                      {
                        diagnostics
                          .summary
                          .warning
                      }
                    </strong>
                    {c.diagnosticsWarnings}
                  </span>
                  <span className="error">
                    <strong>
                      {
                        diagnostics
                          .summary
                          .error
                      }
                    </strong>
                    {c.diagnosticsErrors}
                  </span>
                </div>

                <div className="checked">
                  <small>
                    {c.diagnosticsCheckedAt}
                  </small>
                  <strong>
                    {diagnostics.checkedAt
                      ? formatKyivDateTime(
                          diagnostics
                            .checkedAt,
                          language,
                        )
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="bot-dashboard-diagnostics-grid">
                <article className="bot-dashboard-diagnostics-checks">
                  <header>
                    <strong>
                      {c.diagnosticsChecks}
                    </strong>
                    <span>
                      {
                        diagnostics
                          .checks
                          .length
                      }
                    </span>
                  </header>

                  <div className="checks">
                    {diagnostics.checks.map(
                      (
                        check,
                      ) => (
                        <div
                          key={
                            check.id
                          }
                          className={
                            `diagnostic-check ${check.status}`
                          }
                        >
                          <span className="indicator">
                            {check.status ===
                            "ok"
                              ? "✓"
                              : check.status ===
                                  "warning"
                                ? "!"
                                : "×"}
                          </span>

                          <div className="body">
                            <div>
                              <strong>
                                {
                                  check.title
                                }
                              </strong>
                              <span>
                                {String(
                                  check.status ||
                                    "",
                                ).toUpperCase()}
                              </span>
                            </div>

                            <p>
                              {
                                check.detail
                              }
                            </p>

                            {Array.isArray(
                              check.items,
                            ) &&
                            check.items
                              .length ? (
                              <ul>
                                {check.items.map(
                                  (
                                    item,
                                    index,
                                  ) => (
                                    <li
                                      key={
                                        check.id +
                                        ":" +
                                        index
                                      }
                                    >
                                      {
                                        item
                                      }
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )}

                    {!diagnostics.checks
                      .length &&
                    !diagnosticsLoading ? (
                      <p className="bot-dashboard-log-empty">
                        {c.diagnosticsNoIssues}
                      </p>
                    ) : null}
                  </div>
                </article>

                <article className="bot-dashboard-diagnostics-permissions">
                  <header>
                    <strong>
                      {c.diagnosticsPermissions}
                    </strong>
                    <span>
                      {
                        diagnostics
                          .permissions
                          .length
                      }
                    </span>
                  </header>

                  <div className="permissions">
                    {diagnostics.permissions.map(
                      (
                        permission,
                      ) => (
                        <div
                          key={
                            permission.key
                          }
                          className={
                            permission
                              .granted
                              ? "granted"
                              : permission
                                  .required
                                ? "missing"
                                : "optional"
                          }
                        >
                          <div>
                            <strong>
                              {
                                permission.label
                              }
                            </strong>
                            <small>
                              {permission.required
                                ? c.diagnosticsRequired
                                : c.diagnosticsOptional}
                            </small>
                          </div>

                          <span>
                            {permission.granted
                              ? c.diagnosticsGranted
                              : c.diagnosticsMissing}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              </div>

              <article className="bot-dashboard-diagnostics-actions">
                <header>
                  <strong>
                    {c.diagnosticsActions}
                  </strong>
                </header>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      activateGuild(
                        selectedGuild,
                      )
                    }
                    disabled={
                      busy ===
                        `activate:${selectedGuild.guildId}` ||
                      !controlOwner
                    }
                  >
                    {c.updateBotPermissions}
                  </button>

                  <button
                    type="button"
                    onClick={
                      syncAutomod
                    }
                    disabled={
                      busy ===
                        "automod" ||
                      !canControl(
                        "moderation.manage",
                      ) ||
                      !settings
                        .automodEnabled
                    }
                  >
                    {busy ===
                    "automod"
                      ? c.syncingAutomod
                      : c.syncAutomod}
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      void loadDiagnostics()
                    }
                    disabled={
                      diagnosticsLoading
                    }
                  >
                    {c.diagnosticsRefresh}
                  </button>
                </div>
              </article>
            </section>

            <section
              className={
                `bot-dashboard-analytics-center${settingsTab === "analytics" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-analytics-head">
                <div>
                  <span>
                    ANALYTICS
                  </span>
                  <h3>
                    {c.analyticsTitle}
                  </h3>
                  <p>
                    {c.analyticsText}
                  </p>
                </div>

                <div className="bot-dashboard-analytics-actions">
                  <div className="bot-dashboard-range-switch">
                    {[7, 30].map(
                      (days) => (
                        <button
                          key={days}
                          type="button"
                          className={
                            analyticsDays ===
                            days
                              ? "active"
                              : ""
                          }
                          onClick={() => {
                            setAnalyticsDays(
                              days,
                            );
                            void loadAnalytics(
                              selectedGuild
                                .guildId,
                              days,
                            );
                          }}
                        >
                          {days === 7
                            ? c.analytics7d
                            : c.analytics30d}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    className="refresh"
                    onClick={() =>
                      void loadAnalytics()
                    }
                    disabled={
                      analyticsLoading
                    }
                  >
                    {analyticsLoading
                      ? c.analyticsLoading
                      : c.refreshAnalytics}
                  </button>
                </div>
              </header>

              {analyticsError ? (
                <div className="bot-dashboard-alert error">
                  {analyticsError}
                </div>
              ) : null}

              <div className="bot-dashboard-analytics-kpis">
                {[
                  [
                    c.currentMembersMetric,
                    analytics.summary
                      .currentMembers ??
                      "—",
                    "members",
                  ],
                  [
                    c.netGrowthMetric,
                    (analytics.summary
                      .netGrowth >=
                    0
                      ? "+"
                      : "") +
                      String(
                        analytics
                          .summary
                          .netGrowth,
                      ),
                    analytics.summary
                      .netGrowth >=
                    0
                      ? "positive"
                      : "negative",
                  ],
                  [
                    c.joinsMetric,
                    analytics.summary
                      .joins,
                    "positive",
                  ],
                  [
                    c.leavesMetric,
                    analytics.summary
                      .leaves,
                    "negative",
                  ],
                  [
                    c.moderationMetric,
                    analytics.summary
                      .moderationCases,
                    "moderation",
                  ],
                  [
                    c.activeWarningsMetric,
                    analytics.summary
                      .activeWarnings,
                    "warning",
                  ],
                  [
                    c.ticketsMetric,
                    analytics.summary
                      .ticketsCreated,
                    "tickets",
                  ],
                  [
                    c.openTicketsMetric,
                    analytics.summary
                      .openTickets,
                    "tickets",
                  ],
                  [
                    c.verifiedMetric,
                    analytics.summary
                      .verified,
                    "positive",
                  ],
                  [
                    c.selfRolesMetric,
                    analytics.summary
                      .selfRoleChanges,
                    "roles",
                  ],
                  [
                    c.automodMetric,
                    analytics.summary
                      .automodActions,
                    "moderation",
                  ],
                  [
                    c.giveawayEntriesMetric,
                    analytics.summary
                      .giveawayEntries,
                    "publishing",
                  ],
                ].map(
                  ([
                    label,
                    value,
                    tone,
                  ]) => (
                    <article
                      key={
                        label
                      }
                      className={
                        tone
                      }
                    >
                      <span>
                        {label}
                      </span>
                      <strong>
                        {value}
                      </strong>
                    </article>
                  ),
                )}
              </div>

              <div className="bot-dashboard-analytics-main">
                <article className="bot-dashboard-analytics-chart-card">
                  <header>
                    <div>
                      <strong>
                        {c.activityChart}
                      </strong>
                      <small>
                        {c.activityChartText}
                      </small>
                    </div>
                    <span>
                      {analytics.timeline.reduce(
                        (
                          total,
                          item,
                        ) =>
                          total +
                          Number(
                            item.total ||
                            0,
                          ),
                        0,
                      )}{" "}
                      {c.activityEvents}
                    </span>
                  </header>

                  <div className="bot-dashboard-activity-chart">
                    {analytics.timeline.map(
                      (
                        item,
                        index,
                      ) => {
                        const maxValue =
                          Math.max(
                            1,
                            ...analytics.timeline.map(
                              (
                                day,
                              ) =>
                                Number(
                                  day.total ||
                                  0,
                                ),
                            ),
                          );

                        const height =
                          Math.max(
                            item.total
                              ? 8
                              : 2,
                            Math.round(
                              (
                                Number(
                                  item.total ||
                                  0,
                                ) /
                                maxValue
                              ) *
                                100,
                            ),
                          );

                        return (
                          <div
                            key={
                              item.date
                            }
                            className="day"
                            title={
                              item.date +
                              " · " +
                              String(
                                item.total ||
                                0,
                              ) +
                              " " +
                              c.activityEvents
                            }
                          >
                            <div className="bar-track">
                              <div
                                className="bar"
                                style={{
                                  height:
                                    String(
                                      height,
                                    ) +
                                    "%",
                                }}
                              />
                            </div>
                            <small>
                              {analyticsDays ===
                              7 ||
                              index %
                                5 ===
                                0 ||
                              index ===
                                analytics
                                  .timeline
                                  .length -
                                  1
                                ? item.date
                                    .slice(
                                      5,
                                    )
                                : ""}
                            </small>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="bot-dashboard-analytics-legend">
                    <span>
                      <i className="joins" />
                      {c.joinsMetric}:{" "}
                      {
                        analytics
                          .summary
                          .joins
                      }
                    </span>
                    <span>
                      <i className="leaves" />
                      {c.leavesMetric}:{" "}
                      {
                        analytics
                          .summary
                          .leaves
                      }
                    </span>
                    <span>
                      <i className="moderation" />
                      {c.moderationMetric}:{" "}
                      {
                        analytics
                          .summary
                          .moderationCases
                      }
                    </span>
                  </div>
                </article>

                <article className="bot-dashboard-worker-health">
                  <header>
                    <strong>
                      {c.workerHealth}
                    </strong>
                    {(() => {
                      const latest =
                        analytics
                          .health
                          .latest;
                      const age =
                        latest
                          ?.captured_at
                          ? Date.now() -
                            new Date(
                              latest
                                .captured_at,
                            )
                              .getTime()
                          : Infinity;
                      const online =
                        latest
                          ?.ready ===
                          true &&
                        age <
                          10 *
                            60 *
                            1000;

                      return (
                        <span
                          className={
                            !latest
                              ? "waiting"
                              : online
                                ? "online"
                                : "stale"
                          }
                        >
                          {!latest
                            ? c.workerWaiting
                            : online
                              ? c.workerOnline
                              : c.workerStale}
                        </span>
                      );
                    })()}
                  </header>

                  <div className="bot-dashboard-worker-grid">
                    <div>
                      <span>
                        {c.workerPing}
                      </span>
                      <strong>
                        {analytics
                          .health
                          .latest
                          ?.ws_ping_ms !=
                        null
                          ? String(
                              analytics
                                .health
                                .latest
                                .ws_ping_ms,
                            ) +
                            " ms"
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>
                        {c.workerUptime}
                      </span>
                      <strong>
                        {analytics
                          .health
                          .latest
                          ? formatDuration(
                              analytics
                                .health
                                .latest
                                .uptime_seconds,
                            )
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>
                        {c.workerUptime24}
                      </span>
                      <strong>
                        {analytics
                          .health
                          .uptime24h !=
                        null
                          ? String(
                              analytics
                                .health
                                .uptime24h,
                            ) +
                            "%"
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>
                        {c.workerGuilds}
                      </span>
                      <strong>
                        {analytics
                          .health
                          .latest
                          ?.guild_count ??
                          "—"}
                      </strong>
                    </div>
                    <div>
                      <span>
                        {c.healthSamples}
                      </span>
                      <strong>
                        {analytics
                          .health
                          .samples24h ||
                          0}
                      </strong>
                    </div>
                    <div>
                      <span>
                        {c.workerPing} 24h
                      </span>
                      <strong>
                        {analytics
                          .health
                          .avgPing24h !=
                        null
                          ? String(
                              analytics
                                .health
                                .avgPing24h,
                            ) +
                            " ms"
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  {analytics
                    .health
                    .latest
                    ?.captured_at ? (
                    <small className="last-seen">
                      {formatKyivDateTime(
                        analytics
                          .health
                          .latest
                          .captured_at,
                        language,
                      )}
                    </small>
                  ) : null}
                </article>
              </div>

              <div className="bot-dashboard-analytics-bottom">
                <article className="bot-dashboard-top-roles">
                  <header>
                    <strong>
                      {c.topSelfRoles}
                    </strong>
                  </header>

                  {analytics
                    .topSelfRoles
                    .length ? (
                    <div className="bot-dashboard-role-ranking">
                      {analytics.topSelfRoles.map(
                        (
                          role,
                          index,
                        ) => (
                          <div
                            key={
                              role.roleId
                            }
                          >
                            <span className="rank">
                              {index +
                                1}
                            </span>
                            <strong>
                              @
                              {
                                role.name
                              }
                            </strong>
                            <span className="count">
                              {
                                role.count
                              }
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="bot-dashboard-log-empty">
                      {c.noSelfRoles}
                    </p>
                  )}
                </article>

                <article className="bot-dashboard-activity-feed">
                  <header>
                    <strong>
                      {c.recentActivity}
                    </strong>
                    <span>
                      {
                        analytics
                          .recentActivity
                          .length
                      }
                    </span>
                  </header>

                  {analytics
                    .recentActivity
                    .length ? (
                    <div className="bot-dashboard-activity-feed-list">
                      {analytics.recentActivity.map(
                        (
                          item,
                        ) => {
                          const userId =
                            item
                              .payload
                              ?.user_id ||
                            item
                              .payload
                              ?.target_id ||
                            item
                              .payload
                              ?.opener_id ||
                            "";
                          const channelId =
                            item
                              .payload
                              ?.channel_id ||
                            "";

                          return (
                            <div
                              key={
                                item.id
                              }
                            >
                              <span className="dot" />
                              <div>
                                <strong>
                                  {
                                    item.label
                                  }
                                </strong>
                                <small>
                                  {userId
                                    ? "User " +
                                      userId
                                    : channelId
                                      ? "Channel " +
                                        channelId
                                      : item.type}
                                </small>
                              </div>
                              <time>
                                {formatKyivDateTime(
                                  item
                                    .createdAt,
                                  language,
                                )}
                              </time>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <p className="bot-dashboard-log-empty">
                      {c.noActivity}
                    </p>
                  )}
                </article>
              </div>
            </section>

            <section
              className={
                `bot-dashboard-publications-center${settingsTab === "publishing" ? "" : " hidden"}`
              }
            >
              <header className="bot-dashboard-publications-head">
                <div>
                  <span>
                    PUBLISHING
                  </span>
                  <h3>
                    {c.publishingTitle}
                  </h3>
                  <p>
                    {c.publishingText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadPublications()
                  }
                  disabled={
                    publicationsLoading
                  }
                >
                  {publicationsLoading
                    ? c.publicationsLoading
                    : c.refreshPublications}
                </button>
              </header>

              {publicationsError ? (
                <div className="bot-dashboard-alert error">
                  {publicationsError}
                </div>
              ) : null}

              <div className="bot-dashboard-publishing-builders">
                <article className="bot-dashboard-publishing-card">
                  <header>
                    <div>
                      <strong>
                        🎁 {c.giveawayBuilder}
                      </strong>
                      <small>
                        {c.giveawayBuilderText}
                      </small>
                    </div>
                  </header>

                  <div className="bot-dashboard-publishing-fields">
                    <label>
                      <span>
                        {c.giveawayChannel}
                      </span>
                      <select
                        value={
                          giveawayDraft
                            .channelId
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              channelId:
                                event
                                  .target
                                  .value,
                            }),
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
                        {c.giveawayPrize}
                      </span>
                      <input
                        type="text"
                        maxLength={200}
                        placeholder={
                          c.giveawayPrizePlaceholder
                        }
                        value={
                          giveawayDraft
                            .prize
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              prize:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {c.giveawayRequiredRole}
                      </span>
                      <select
                        value={
                          giveawayDraft
                            .requiredRoleId
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              requiredRoleId:
                                event
                                  .target
                                  .value,
                            }),
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
                        {c.giveawayWinnerCount}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={
                          giveawayDraft
                            .winnerCount
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              winnerCount:
                                Math.max(
                                  1,
                                  Math.min(
                                    20,
                                    Number(
                                      event
                                        .target
                                        .value,
                                    ) || 1,
                                  ),
                                ),
                            }),
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {c.giveawayEndsAt}
                      </span>
                      <input
                        type="datetime-local"
                        value={
                          giveawayDraft
                            .endsAt
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              endsAt:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                      <small className="bot-dashboard-timezone-hint">
                        {c.kyivTime}
                      </small>
                    </label>

                    <label className="full">
                      <span>
                        {c.giveawayDescription}
                      </span>
                      <textarea
                        rows={4}
                        maxLength={3000}
                        placeholder={
                          c.giveawayDescriptionPlaceholder
                        }
                        value={
                          giveawayDraft
                            .description
                        }
                        onChange={(
                          event,
                        ) =>
                          setGiveawayDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              description:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <div className="bot-dashboard-discord-preview full">
                      <span className="preview-label">
                        {c.discordPreview}
                      </span>
                      <div className="discord-panel">
                        <div className="discord-embed">
                          <strong>
                            🎁{" "}
                            {giveawayDraft
                              .prize ||
                              c.giveawayPrizePlaceholder}
                          </strong>
                          <p>
                            {giveawayDraft
                              .description ||
                              c.giveawayDescriptionPlaceholder}
                          </p>
                          <small>
                            {
                              giveawayDraft
                                .winnerCount
                            }{" "}
                            {language ===
                            "en"
                              ? "winner(s)"
                              : "переможець(ці)"}{" "}
                            ·{" "}
                            {
                              c.kyivTime
                            }
                          </small>
                        </div>
                        <button
                          type="button"
                          tabIndex={-1}
                        >
                          🎉{" "}
                          {language ===
                          "en"
                            ? "Participate"
                            : "Взяти участь"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bot-dashboard-module-action full"
                      onClick={
                        createGiveaway
                      }
                      disabled={
                        busy ===
                          "create-giveaway" ||
                        !canControl(
                          "publishing.manage",
                        ) ||
                        !giveawayDraft
                          .channelId ||
                        !giveawayDraft
                          .prize ||
                        !giveawayDraft
                          .endsAt
                      }
                    >
                      {busy ===
                      "create-giveaway"
                        ? c.creatingGiveaway
                        : c.createGiveaway}
                    </button>
                  </div>
                </article>

                <article className="bot-dashboard-publishing-card">
                  <header>
                    <div>
                      <strong>
                        🕒 {c.scheduledBuilder}
                      </strong>
                      <small>
                        {c.scheduledBuilderText}
                      </small>
                    </div>
                  </header>

                  <div className="bot-dashboard-publishing-fields">
                    <label>
                      <span>
                        {c.messageChannel}
                      </span>
                      <select
                        value={
                          scheduleDraft
                            .channelId
                        }
                        onChange={(
                          event,
                        ) =>
                          setScheduleDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              channelId:
                                event
                                  .target
                                  .value,
                            }),
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
                        {c.scheduledAt}
                      </span>
                      <input
                        type="datetime-local"
                        value={
                          scheduleDraft
                            .scheduledAt
                        }
                        onChange={(
                          event,
                        ) =>
                          setScheduleDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              scheduledAt:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                      <small className="bot-dashboard-timezone-hint">
                        {c.kyivTime}
                      </small>
                    </label>

                    <label className="full">
                      <span>
                        {c.messageContent}
                      </span>
                      <textarea
                        rows={3}
                        maxLength={2000}
                        placeholder={
                          c.messageContentPlaceholder
                        }
                        value={
                          scheduleDraft
                            .content
                        }
                        onChange={(
                          event,
                        ) =>
                          setScheduleDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              content:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {c.embedTitle}
                      </span>
                      <input
                        type="text"
                        maxLength={256}
                        value={
                          scheduleDraft
                            .embedTitle
                        }
                        onChange={(
                          event,
                        ) =>
                          setScheduleDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              embedTitle:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <label className="full">
                      <span>
                        {c.embedDescription}
                      </span>
                      <textarea
                        rows={4}
                        maxLength={4000}
                        value={
                          scheduleDraft
                            .embedDescription
                        }
                        onChange={(
                          event,
                        ) =>
                          setScheduleDraft(
                            (
                              current,
                            ) => ({
                              ...current,
                              embedDescription:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>

                    <div className="bot-dashboard-discord-preview full">
                      <span className="preview-label">
                        {c.discordPreview}
                      </span>
                      <div className="discord-message">
                        <div className="discord-avatar">
                          I
                        </div>
                        <div className="discord-message-body">
                          <div className="discord-author">
                            <strong>
                              ISTe Bot
                            </strong>
                            <span>
                              BOT
                            </span>
                          </div>
                          {scheduleDraft
                            .content ? (
                            <p className="discord-preview-content">
                              {
                                scheduleDraft
                                  .content
                              }
                            </p>
                          ) : null}
                          {(scheduleDraft
                            .embedTitle ||
                            scheduleDraft
                              .embedDescription) ? (
                            <div className="discord-embed">
                              <strong>
                                {scheduleDraft
                                  .embedTitle ||
                                  c.embedTitle}
                              </strong>
                              <p>
                                {scheduleDraft
                                  .embedDescription ||
                                  c.embedDescription}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bot-dashboard-module-action full"
                      onClick={
                        createScheduledMessage
                      }
                      disabled={
                        busy ===
                          "schedule-message" ||
                        !canControl(
                          "publishing.manage",
                        ) ||
                        !scheduleDraft
                          .channelId ||
                        !scheduleDraft
                          .scheduledAt ||
                        !(
                          scheduleDraft
                            .content ||
                          scheduleDraft
                            .embedTitle ||
                          scheduleDraft
                            .embedDescription
                        )
                      }
                    >
                      {busy ===
                      "schedule-message"
                        ? c.schedulingMessage
                        : c.scheduleMessage}
                    </button>
                  </div>
                </article>
              </div>

              <div className="bot-dashboard-publication-lists">
                <article>
                  <header>
                    <strong>
                      {c.activeGiveaways}
                    </strong>
                    <span>
                      {
                        publications
                          .giveaways
                          .length
                      }
                    </span>
                  </header>

                  <div className="bot-dashboard-publication-list">
                    {publications
                      .giveaways
                      .length ? (
                      publications.giveaways.map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="bot-dashboard-publication-row"
                          >
                            <div className="main">
                              <strong>
                                {
                                  item.prize
                                }
                              </strong>
                              <small>
                                {
                                  item
                                    .participant_count ||
                                  0
                                }{" "}
                                {c.participants}
                                {" · "}
                                {formatKyivDateTime(
                                  item
                                    .ends_at,
                                  language,
                                )}
                              </small>
                            </div>

                            <span
                              className={
                                `status ${item.status}`
                              }
                            >
                              {item.status ===
                              "active"
                                ? c.statusActive
                                : item.status ===
                                    "ended"
                                  ? c.statusEnded
                                  : c.statusCancelled}
                            </span>

                            <div className="actions">
                              {item.status ===
                              "active" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void cancelGiveaway(
                                      item.id,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    "giveaway:" +
                                      item.id
                                  }
                                >
                                  {c.cancelGiveaway}
                                </button>
                              ) : null}

                              {item.status ===
                              "ended" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void rerollGiveaway(
                                      item.id,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    "reroll:" +
                                      item.id
                                  }
                                >
                                  {c.reroll}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="bot-dashboard-log-empty">
                        {c.noGiveaways}
                      </p>
                    )}
                  </div>
                </article>

                <article>
                  <header>
                    <strong>
                      {c.scheduledMessages}
                    </strong>
                    <span>
                      {
                        publications
                          .scheduled
                          .length
                      }
                    </span>
                  </header>

                  <div className="bot-dashboard-publication-list">
                    {publications
                      .scheduled
                      .length ? (
                      publications.scheduled.map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="bot-dashboard-publication-row"
                          >
                            <div className="main">
                              <strong>
                                {item
                                  .embed_title ||
                                  item
                                    .content
                                    ?.slice(
                                      0,
                                      80,
                                    ) ||
                                  c.scheduledBuilder}
                              </strong>
                              <small>
                                {formatKyivDateTime(
                                  item
                                    .scheduled_at,
                                  language,
                                )}
                              </small>
                            </div>

                            <span
                              className={
                                `status ${item.status}`
                              }
                            >
                              {item.status ===
                              "scheduled"
                                ? c.statusScheduled
                                : item.status ===
                                    "sent"
                                  ? c.statusSent
                                  : item.status ===
                                      "failed"
                                    ? c.statusFailed
                                    : c.statusCancelled}
                            </span>

                            <div className="actions">
                              {item.status ===
                              "scheduled" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void cancelScheduledMessage(
                                      item.id,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    "schedule:" +
                                      item.id
                                  }
                                >
                                  {c.cancelScheduled}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="bot-dashboard-log-empty">
                        {c.noScheduled}
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section
              className={
                `bot-dashboard-moderation-center${settingsTab === "moderation" ? "" : " hidden"}`
              }
            >
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

                    const delegated =
                      guild.access
                        ?.delegated ===
                      true;

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
                            !delegated ? (
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
                            ) : null
                          ) : !guild.installed ? (
                            !delegated ? (
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
                            ) : null
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

                              {!delegated ? (
                                <>
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
