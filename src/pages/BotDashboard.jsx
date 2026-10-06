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
    tickets: "Tickets",
    ticketsText:
      "Повний ticket runtime з приватними каналами підключимо наступним блоком.",
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
    tickets: "Tickets",
    ticketsText:
      "The full private-channel ticket runtime will be connected in the next block.",
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
  });

  const [
    resourcesLoading,
    setResourcesLoading,
  ] = useState(false);

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
    });

    setResourcesLoading(true);
    setNotice("");
    setError("");

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

                  <article className="bot-dashboard-module-card">
                    <header>
                      <div>
                        <strong>
                          {c.tickets}
                        </strong>
                        <small>
                          {c.ticketsText}
                        </small>
                      </div>

                      <span className="bot-dashboard-module-next">
                        {c.comingNext}
                      </span>
                    </header>
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
