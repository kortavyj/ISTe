const HEALTH_RETENTION_DAYS = 30;
const ERROR_RETENTION_DAYS = 30;
const DEFAULT_MAINTENANCE_SECONDS = 6 * 60 * 60;

const COPY = {
  uk: {
    noAccess: "Ця дія недоступна для вашої ролі.",
    healthTitle: "Стан ISTesport Bot",
    statsTitle: "Статистика ISTesport Bot",
    auditTitle: "Останні дії",
    errorsTitle: "Останні помилки",
    securityTitle: "Перевірка безпеки",
    cleanupTitle: "Очищення завершено",
    ok: "OK",
    fail: "ПОМИЛКА",
    enabled: "увімкнено",
    disabled: "вимкнено",
    uptime: "Uptime",
    telegram: "Telegram API",
    webhook: "Webhook",
    channel: "Канал",
    supabase: "Supabase",
    dataFeed: "FACEIT data feed",
    modules: "Модулі",
    groupPrivacy: "Group Privacy",
    channelRights: "Права каналу",
    groupRights: "Права групи",
    ownerRole: "Owner роль",
    noRows: "Записів немає.",
    users: "Користувачі",
    requests: "Заявки",
    giveaways: "Розіграші",
    manualPosts: "Ручні публікації",
    audit24h: "Audit за 24 год",
    moderation24h: "Модерація за 24 год",
    errors24h: "Помилки за 24 год",
    cleanedDrafts: "Видалено прострочених чернеток",
    cleanedHealth: "Видалено старих health snapshots",
    cleanedErrors: "Видалено старих error records",
  },
  ru: {
    noAccess: "Это действие недоступно для вашей роли.",
    healthTitle: "Состояние ISTesport Bot",
    statsTitle: "Статистика ISTesport Bot",
    auditTitle: "Последние действия",
    errorsTitle: "Последние ошибки",
    securityTitle: "Проверка безопасности",
    cleanupTitle: "Очистка завершена",
    ok: "OK",
    fail: "ОШИБКА",
    enabled: "включено",
    disabled: "выключено",
    uptime: "Uptime",
    telegram: "Telegram API",
    webhook: "Webhook",
    channel: "Канал",
    supabase: "Supabase",
    dataFeed: "FACEIT data feed",
    modules: "Модули",
    groupPrivacy: "Group Privacy",
    channelRights: "Права канала",
    groupRights: "Права группы",
    ownerRole: "Owner роль",
    noRows: "Записей нет.",
    users: "Пользователи",
    requests: "Заявки",
    giveaways: "Розыгрыши",
    manualPosts: "Ручные публикации",
    audit24h: "Audit за 24 часа",
    moderation24h: "Модерация за 24 часа",
    errors24h: "Ошибки за 24 часа",
    cleanedDrafts: "Удалено просроченных черновиков",
    cleanedHealth: "Удалено старых health snapshots",
    cleanedErrors: "Удалено старых error records",
  },
  en: {
    noAccess: "This action is not available for your role.",
    healthTitle: "ISTesport Bot health",
    statsTitle: "ISTesport Bot statistics",
    auditTitle: "Recent actions",
    errorsTitle: "Recent errors",
    securityTitle: "Security check",
    cleanupTitle: "Cleanup completed",
    ok: "OK",
    fail: "FAILED",
    enabled: "enabled",
    disabled: "disabled",
    uptime: "Uptime",
    telegram: "Telegram API",
    webhook: "Webhook",
    channel: "Channel",
    supabase: "Supabase",
    dataFeed: "FACEIT data feed",
    modules: "Modules",
    groupPrivacy: "Group Privacy",
    channelRights: "Channel rights",
    groupRights: "Group rights",
    ownerRole: "Owner role",
    noRows: "No records.",
    users: "Users",
    requests: "Requests",
    giveaways: "Giveaways",
    manualPosts: "Manual posts",
    audit24h: "Audit in 24h",
    moderation24h: "Moderation in 24h",
    errors24h: "Errors in 24h",
    cleanedDrafts: "Expired drafts removed",
    cleanedHealth: "Old health snapshots removed",
    cleanedErrors: "Old error records removed",
  },
};

function localeKey(value) {
  const lang = String(value || "").toLowerCase();
  return ["uk", "ru", "en"].includes(lang) ? lang : "uk";
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeCommand(text) {
  const first = String(text || "").trim().split(/\s+/)[0] || "";
  return first.split("@")[0].toLowerCase();
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function formatDate(value, lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale =
    lang === "uk" ? "uk-UA" :
    lang === "ru" ? "ru-RU" :
    "en-US";

  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function boolLabel(value, copy) {
  return value ? `✅ ${copy.ok}` : `❌ ${copy.fail}`;
}

function compactError(error) {
  if (!error) return { message: "Unknown error" };

  if (error instanceof Error) {
    return {
      name: error.name || null,
      message: error.message || String(error),
      code: error.code || null,
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
      status: error.status || null,
    };
  }

  return { message: String(error) };
}

async function countRows(query) {
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

export function createObservabilityAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  channel,
  ownerId,
  botInfo,
  hasRole,
  moduleStatus,
}) {
  const startedAt = Date.now();

  const maintenanceSeconds = Math.min(
    24 * 60 * 60,
    Math.max(
      15 * 60,
      Number(
        process.env.TELEGRAM_MAINTENANCE_SECONDS
        || DEFAULT_MAINTENANCE_SECONDS,
      ),
    ),
  );

  const dataUrl = String(
    process.env.ISTE_FACEIT_DATA_URL
    || process.env.ISTE_MATCH_DATA_URL
    || "https://istesport.com/data/faceit-stats.json",
  ).trim();

  let timer = null;
  let stopped = false;
  let maintenanceRunning = false;

  async function recordError(scope, error, metadata = {}) {
    const details = compactError(error);

    try {
      const { error: insertError } = await supabase
        .from("telegram_bot_error_log")
        .insert({
          scope: cleanText(scope) || "unknown",
          message: String(details.message || "Unknown error").slice(0, 2000),
          error_name: details.name || null,
          error_code: details.code ? String(details.code).slice(0, 200) : null,
          metadata,
        });

      if (insertError) {
        console.error("telegram_observability_error_log_failed", {
          scope,
          code: insertError.code || null,
          message: insertError.message || String(insertError),
        });
      }
    } catch (loggingError) {
      console.error("telegram_observability_error_log_crashed", {
        scope,
        message:
          loggingError instanceof Error
            ? loggingError.message
            : String(loggingError),
      });
    }
  }

  async function checkDataFeed() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(dataUrl, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "user-agent": "ISTesport-TelegramBot/0.12.0",
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          message: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const roster = Array.isArray(data?.roster) ? data.roster.length : null;
      const matches = Array.isArray(data?.teamMatches)
        ? data.teamMatches.length
        : null;

      return {
        ok: true,
        status: response.status,
        roster,
        matches,
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function checkSupabase() {
    const checks = [
      ["telegram_bot_users", "telegram_user_id"],
      ["telegram_bot_audit_log", "id"],
      ["telegram_requests", "id"],
      ["telegram_giveaways", "id"],
      ["telegram_manual_posts", "id"],
      ["telegram_moderation_settings", "chat_id"],
      ["telegram_bot_health_snapshots", "id"],
      ["telegram_bot_error_log", "id"],
    ];

    const result = [];

    for (const [table, column] of checks) {
      const { error } = await supabase
        .from(table)
        .select(column)
        .limit(1);

      result.push({
        table,
        ok: !error,
        code: error?.code || null,
        message: error?.message || null,
      });
    }

    return {
      ok: result.every((item) => item.ok),
      tables: result,
    };
  }

  async function checkChannel() {
    try {
      const chat = await telegram("getChat", { chat_id: channel });
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

      const ok =
        ["administrator", "creator"].includes(rights.status)
        && rights.can_post_messages
        && rights.can_edit_messages
        && rights.can_delete_messages;

      return {
        ok,
        chatId: chat.id,
        title: chat.title || String(channel),
        rights,
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  }

  async function checkModerationGroups() {
    const { data, error } = await supabase
      .from("telegram_moderation_settings")
      .select("chat_id")
      .order("chat_id", { ascending: true });

    if (error) {
      return {
        ok: false,
        groups: [],
        message: error.message || String(error),
      };
    }

    const groups = [];

    for (const row of data || []) {
      try {
        const member = await telegram("getChatMember", {
          chat_id: row.chat_id,
          user_id: botInfo.id,
        });

        const item = {
          chatId: row.chat_id,
          status: member?.status || "unknown",
          can_delete_messages: Boolean(member?.can_delete_messages),
          can_restrict_members: Boolean(member?.can_restrict_members),
        };

        item.ok =
          ["administrator", "creator"].includes(item.status)
          && item.can_delete_messages
          && item.can_restrict_members;

        groups.push(item);
      } catch (groupError) {
        groups.push({
          chatId: row.chat_id,
          ok: false,
          message:
            groupError instanceof Error
              ? groupError.message
              : String(groupError),
        });
      }
    }

    return {
      ok: groups.every((item) => item.ok),
      groups,
    };
  }

  async function checkOwnerRole() {
    const { data, error } = await supabase
      .from("telegram_bot_users")
      .select("telegram_user_id, role, active")
      .eq("telegram_user_id", Number(ownerId))
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        message: error.message || String(error),
      };
    }

    return {
      ok: Boolean(data?.active && data?.role === "owner"),
      role: data?.role || null,
      active: Boolean(data?.active),
    };
  }

  async function runHealth({ persist = true } = {}) {
    const checks = {
      telegram: null,
      webhook: null,
      channel: null,
      supabase: null,
      dataFeed: null,
      moderationGroups: null,
      owner: null,
      modules: moduleStatus,
    };

    try {
      const me = await telegram("getMe");
      checks.telegram = {
        ok: Boolean(me?.id),
        id: me?.id || null,
        username: me?.username || null,
        canReadAllGroupMessages: Boolean(me?.can_read_all_group_messages),
      };
    } catch (error) {
      checks.telegram = {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }

    try {
      const webhook = await telegram("getWebhookInfo");
      checks.webhook = {
        ok: !cleanText(webhook?.url),
        urlConfigured: Boolean(cleanText(webhook?.url)),
        pendingUpdateCount: Number(webhook?.pending_update_count || 0),
        lastErrorMessage: webhook?.last_error_message || null,
      };
    } catch (error) {
      checks.webhook = {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }

    [
      checks.channel,
      checks.supabase,
      checks.dataFeed,
      checks.moderationGroups,
      checks.owner,
    ] = await Promise.all([
      checkChannel(),
      checkSupabase(),
      checkDataFeed(),
      checkModerationGroups(),
      checkOwnerRole(),
    ]);

    const moduleValues = Object.values(moduleStatus || {});
    const modulesOk = moduleValues.every((value) => value === true);

    const ok = [
      checks.telegram?.ok,
      checks.webhook?.ok,
      checks.channel?.ok,
      checks.supabase?.ok,
      checks.dataFeed?.ok,
      checks.moderationGroups?.ok,
      checks.owner?.ok,
      modulesOk,
    ].every(Boolean);

    const snapshot = {
      ok,
      checkedAt: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
      checks,
    };

    if (persist) {
      const { error } = await supabase
        .from("telegram_bot_health_snapshots")
        .insert({
          ok,
          checks,
          uptime_seconds: Math.floor(snapshot.uptimeMs / 1000),
        });

      if (error) {
        console.error("telegram_health_snapshot_failed", {
          code: error.code || null,
          message: error.message || String(error),
        });
      }
    }

    return snapshot;
  }

  async function cleanupExpired() {
    const now = new Date().toISOString();

    const draftTables = [
      "telegram_request_drafts",
      "telegram_giveaway_drafts",
      "telegram_poll_drafts",
      "telegram_manual_post_drafts",
    ];

    let draftsRemoved = 0;

    for (const table of draftTables) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .lt("expires_at", now)
        .select("expires_at");

      if (error) throw error;
      draftsRemoved += Array.isArray(data) ? data.length : 0;
    }

    const healthCutoff = new Date(
      Date.now() - HEALTH_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const errorCutoff = new Date(
      Date.now() - ERROR_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: oldHealth, error: healthError } = await supabase
      .from("telegram_bot_health_snapshots")
      .delete()
      .lt("created_at", healthCutoff)
      .select("id");

    if (healthError) throw healthError;

    const { data: oldErrors, error: errorError } = await supabase
      .from("telegram_bot_error_log")
      .delete()
      .lt("created_at", errorCutoff)
      .select("id");

    if (errorError) throw errorError;

    return {
      draftsRemoved,
      healthRemoved: Array.isArray(oldHealth) ? oldHealth.length : 0,
      errorsRemoved: Array.isArray(oldErrors) ? oldErrors.length : 0,
    };
  }

  async function runMaintenance() {
    if (maintenanceRunning || stopped) return;
    maintenanceRunning = true;

    try {
      const cleanup = await cleanupExpired();
      const health = await runHealth({ persist: true });

      console.log("telegram_maintenance_completed", {
        cleanup,
        healthOk: health.ok,
      });
    } catch (error) {
      console.error("telegram_maintenance_failed", compactError(error));
      await recordError("maintenance", error);
    } finally {
      maintenanceRunning = false;
    }
  }

  function scheduleMaintenance() {
    if (stopped) return;

    clearTimeout(timer);

    timer = setTimeout(async () => {
      await runMaintenance();
      scheduleMaintenance();
    }, maintenanceSeconds * 1000);

    timer.unref?.();
  }

  function moduleLines(lang) {
    const copy = COPY[lang];
    return Object.entries(moduleStatus || {}).map(
      ([name, value]) =>
        `${value ? "✅" : "❌"} ${escapeHtml(name)}: <b>${value ? copy.ok : copy.fail}</b>`,
    );
  }

  async function healthCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "admin")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const health = await runHealth({ persist: true });

    const channelRights = health.checks.channel?.rights || {};
    const groups = health.checks.moderationGroups?.groups || [];

    const lines = [
      `${health.ok ? "✅" : "⚠️"} <b>${copy.healthTitle}</b>`,
      "",
      `${copy.uptime}: <code>${formatDuration(health.uptimeMs)}</code>`,
      `${copy.telegram}: <b>${boolLabel(health.checks.telegram?.ok, copy)}</b>`,
      `${copy.webhook}: <b>${boolLabel(health.checks.webhook?.ok, copy)}</b>`,
      `${copy.channel}: <b>${boolLabel(health.checks.channel?.ok, copy)}</b>`,
      `${copy.supabase}: <b>${boolLabel(health.checks.supabase?.ok, copy)}</b>`,
      `${copy.dataFeed}: <b>${boolLabel(health.checks.dataFeed?.ok, copy)}</b>`,
      "",
      `<b>${copy.channelRights}</b>`,
      `Post: ${channelRights.can_post_messages ? "✅" : "❌"} · Edit: ${channelRights.can_edit_messages ? "✅" : "❌"} · Delete: ${channelRights.can_delete_messages ? "✅" : "❌"}`,
      `<b>${copy.groupRights}</b>: ${groups.length ? `${groups.filter((x) => x.ok).length}/${groups.length} OK` : "0 groups"}`,
      "",
      `<b>${copy.modules}</b>`,
      ...moduleLines(lang),
    ];

    await sendMessage(message.chat.id, lines.join("\n"));

    await audit(message.from.id, "health_checked", {
      ok: health.ok,
    });
  }

  async function statsCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "admin")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const since24h = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      users,
      requests,
      giveaways,
      manualPosts,
      audit24h,
      moderation24h,
      errors24h,
    ] = await Promise.all([
      countRows(
        supabase
          .from("telegram_bot_users")
          .select("*", { count: "exact", head: true }),
      ),
      countRows(
        supabase
          .from("telegram_requests")
          .select("*", { count: "exact", head: true }),
      ),
      countRows(
        supabase
          .from("telegram_giveaways")
          .select("*", { count: "exact", head: true }),
      ),
      countRows(
        supabase
          .from("telegram_manual_posts")
          .select("*", { count: "exact", head: true }),
      ),
      countRows(
        supabase
          .from("telegram_bot_audit_log")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since24h),
      ),
      countRows(
        supabase
          .from("telegram_moderation_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since24h),
      ),
      countRows(
        supabase
          .from("telegram_bot_error_log")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since24h),
      ),
    ]);

    await sendMessage(
      message.chat.id,
      [
        `📊 <b>${copy.statsTitle}</b>`,
        "",
        `${copy.users}: <b>${users}</b>`,
        `${copy.requests}: <b>${requests}</b>`,
        `${copy.giveaways}: <b>${giveaways}</b>`,
        `${copy.manualPosts}: <b>${manualPosts}</b>`,
        "",
        `${copy.audit24h}: <b>${audit24h}</b>`,
        `${copy.moderation24h}: <b>${moderation24h}</b>`,
        `${copy.errors24h}: <b>${errors24h}</b>`,
      ].join("\n"),
    );
  }

  async function auditCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "admin")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_bot_audit_log")
      .select("id, actor_telegram_user_id, action, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, copy.noRows);
      return;
    }

    const lines = [`🧾 <b>${copy.auditTitle}</b>`, ""];

    for (const row of data) {
      lines.push(
        `<b>#${row.id}</b> · <code>${escapeHtml(row.action)}</code>`,
        `${escapeHtml(formatDate(row.created_at, lang))} · actor <code>${escapeHtml(row.actor_telegram_user_id)}</code>`,
        "",
      );
    }

    await sendMessage(message.chat.id, lines.join("\n").trim());
  }

  async function errorsCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "admin")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_bot_error_log")
      .select("id, scope, message, error_code, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, copy.noRows);
      return;
    }

    const lines = [`🧯 <b>${copy.errorsTitle}</b>`, ""];

    for (const row of data) {
      lines.push(
        `<b>#${row.id}</b> · <code>${escapeHtml(row.scope)}</code>`,
        escapeHtml(cleanText(row.message).slice(0, 280)),
        row.error_code
          ? `code: <code>${escapeHtml(row.error_code)}</code>`
          : "",
        escapeHtml(formatDate(row.created_at, lang)),
        "",
      );
    }

    await sendMessage(
      message.chat.id,
      lines.filter(Boolean).join("\n").trim(),
    );
  }

  async function securityCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "owner")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const health = await runHealth({ persist: true });
    const groupPrivacyOff = Boolean(
      health.checks.telegram?.canReadAllGroupMessages,
    );
    const groups = health.checks.moderationGroups?.groups || [];

    await sendMessage(
      message.chat.id,
      [
        `🔐 <b>${copy.securityTitle}</b>`,
        "",
        `${copy.groupPrivacy}: <b>${groupPrivacyOff ? "✅ OFF" : "❌ ON / unknown"}</b>`,
        `${copy.webhook}: <b>${health.checks.webhook?.ok ? "✅ disabled" : "❌ configured/error"}</b>`,
        `${copy.channelRights}: <b>${health.checks.channel?.ok ? "✅" : "❌"}</b>`,
        `${copy.groupRights}: <b>${health.checks.moderationGroups?.ok ? "✅" : "❌"}</b> (${groups.length})`,
        `${copy.ownerRole}: <b>${health.checks.owner?.ok ? "✅" : "❌"}</b>`,
        `${copy.supabase}: <b>${health.checks.supabase?.ok ? "✅" : "❌"}</b>`,
        "",
        `<i>No secrets are displayed by this command.</i>`,
      ].join("\n"),
    );

    await audit(message.from.id, "security_checked", {
      ok: health.ok,
      groupPrivacyOff,
      moderationGroups: groups.length,
    });
  }

  async function cleanupCommand(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "owner")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const result = await cleanupExpired();

    await sendMessage(
      message.chat.id,
      [
        `🧹 <b>${copy.cleanupTitle}</b>`,
        "",
        `${copy.cleanedDrafts}: <b>${result.draftsRemoved}</b>`,
        `${copy.cleanedHealth}: <b>${result.healthRemoved}</b>`,
        `${copy.cleanedErrors}: <b>${result.errorsRemoved}</b>`,
      ].join("\n"),
    );

    await audit(message.from.id, "maintenance_cleanup_manual", result);
  }

  async function handleMessage(message, user) {
    if (!message?.text || message?.chat?.type !== "private") {
      return false;
    }

    const command = normalizeCommand(message.text);

    if (command === "/health") {
      await healthCommand(message, user);
      return true;
    }

    if (command === "/botstats") {
      await statsCommand(message, user);
      return true;
    }

    if (command === "/audit") {
      await auditCommand(message, user);
      return true;
    }

    if (command === "/errors") {
      await errorsCommand(message, user);
      return true;
    }

    if (command === "/security") {
      await securityCommand(message, user);
      return true;
    }

    if (command === "/cleanup") {
      await cleanupCommand(message, user);
      return true;
    }

    return false;
  }

  async function handleCallback(data, query, user) {
    if (data === "admin:health") {
      await answerCallback(query.id);
      await healthCommand({
        chat: query.message.chat,
        from: query.from,
        text: "/health",
      }, user);
      return true;
    }

    if (data === "admin:botstats") {
      await answerCallback(query.id);
      await statsCommand({
        chat: query.message.chat,
        from: query.from,
        text: "/botstats",
      }, user);
      return true;
    }

    return false;
  }

  function adminRows(lang) {
    localeKey(lang);
    return [[
      {
        text: "🩺 Health",
        callback_data: "admin:health",
      },
      {
        text: "📊 Stats",
        callback_data: "admin:botstats",
      },
    ]];
  }

  async function initialize() {
    try {
      const checks = await Promise.all([
        supabase
          .from("telegram_bot_health_snapshots")
          .select("id")
          .limit(1),
        supabase
          .from("telegram_bot_error_log")
          .select("id")
          .limit(1),
      ]);

      for (const result of checks) {
        if (result.error) throw result.error;
      }

      console.log("telegram_observability_ready", {
        maintenanceSeconds,
        healthRetentionDays: HEALTH_RETENTION_DAYS,
        errorRetentionDays: ERROR_RETENTION_DAYS,
      });

      return true;
    } catch (error) {
      console.error("telegram_observability_init_failed", compactError(error));
      return false;
    }
  }

  async function start() {
    stopped = false;
    await runMaintenance();
    scheduleMaintenance();
  }

  function stop() {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    initialize,
    start,
    stop,
    handleMessage,
    handleCallback,
    adminRows,
    recordError,
    runHealth,
    config: {
      maintenanceSeconds,
      dataUrl,
    },
  };
}
