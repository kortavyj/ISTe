const DEFAULTS = Object.freeze({
  anti_spam: true,
  link_filter: false,
  flood_limit: 6,
  flood_window_seconds: 10,
  duplicate_limit: 3,
  duplicate_window_seconds: 60,
  warn_limit: 3,
  auto_mute_minutes: 10,
});

const COPY = {
  uk: {
    noAccess: "Ця команда доступна лише адміністраторам групи.",
    replyRequired: "Використайте цю команду у відповідь на повідомлення користувача.",
    badDuration: "Вкажіть тривалість, наприклад: 10m, 2h, 1d.",
    warned: "⚠️ Попередження видано.",
    warnings: "Попередження",
    cleared: "✅ Активні попередження очищено.",
    muted: "🔇 Користувача тимчасово обмежено.",
    unmuted: "🔊 Обмеження знято.",
    banned: "⛔ Користувача заблоковано.",
    unbanned: "✅ Користувача розблоковано.",
    badUserId: "Вкажіть Telegram user ID: /unban 123456789",
    status: "Модерація ISTesport",
    antiSpam: "Антиспам",
    links: "Фільтр посилань",
    enabled: "увімкнено",
    disabled: "вимкнено",
    flood: "Flood",
    duplicate: "Повтори",
    warnLimit: "Ліміт попереджень",
    autoMute: "Авто mute",
    minutes: "хв",
    settingSaved: "✅ Налаштування збережено.",
    usageToggle: "Використання: on або off.",
    filterAdded: "✅ Фільтр додано.",
    filterRemoved: "✅ Фільтр видалено.",
    filterExists: "Такий фільтр уже існує.",
    filterMissing: "Фільтр не знайдено.",
    filters: "Фільтри",
    noFilters: "Фільтрів немає.",
    usageFilterAdd: "Використання: /filteradd слово або фраза",
    usageFilterDel: "Використання: /filterdel слово або фраза",
    spamRemoved: "Повідомлення видалено антиспамом.",
    filteredRemoved: "Повідомлення видалено фільтром.",
    linksRemoved: "Посилання в цій групі заборонені.",
    autoMuted: "Користувача автоматично обмежено за порушення.",
  },
  ru: {
    noAccess: "Эта команда доступна только администраторам группы.",
    replyRequired: "Используйте эту команду ответом на сообщение пользователя.",
    badDuration: "Укажите длительность, например: 10m, 2h, 1d.",
    warned: "⚠️ Предупреждение выдано.",
    warnings: "Предупреждения",
    cleared: "✅ Активные предупреждения очищены.",
    muted: "🔇 Пользователь временно ограничен.",
    unmuted: "🔊 Ограничение снято.",
    banned: "⛔ Пользователь заблокирован.",
    unbanned: "✅ Пользователь разблокирован.",
    badUserId: "Укажите Telegram user ID: /unban 123456789",
    status: "Модерация ISTesport",
    antiSpam: "Антиспам",
    links: "Фильтр ссылок",
    enabled: "включён",
    disabled: "выключен",
    flood: "Flood",
    duplicate: "Повторы",
    warnLimit: "Лимит предупреждений",
    autoMute: "Авто mute",
    minutes: "мин",
    settingSaved: "✅ Настройка сохранена.",
    usageToggle: "Использование: on или off.",
    filterAdded: "✅ Фильтр добавлен.",
    filterRemoved: "✅ Фильтр удалён.",
    filterExists: "Такой фильтр уже существует.",
    filterMissing: "Фильтр не найден.",
    filters: "Фильтры",
    noFilters: "Фильтров нет.",
    usageFilterAdd: "Использование: /filteradd слово или фраза",
    usageFilterDel: "Использование: /filterdel слово или фраза",
    spamRemoved: "Сообщение удалено антиспамом.",
    filteredRemoved: "Сообщение удалено фильтром.",
    linksRemoved: "Ссылки в этой группе запрещены.",
    autoMuted: "Пользователь автоматически ограничен за нарушение.",
  },
  en: {
    noAccess: "This command is available only to group administrators.",
    replyRequired: "Use this command as a reply to a user's message.",
    badDuration: "Enter a duration such as 10m, 2h, or 1d.",
    warned: "⚠️ Warning issued.",
    warnings: "Warnings",
    cleared: "✅ Active warnings cleared.",
    muted: "🔇 User temporarily restricted.",
    unmuted: "🔊 Restriction removed.",
    banned: "⛔ User banned.",
    unbanned: "✅ User unbanned.",
    badUserId: "Provide a Telegram user ID: /unban 123456789",
    status: "ISTesport moderation",
    antiSpam: "Anti-spam",
    links: "Link filter",
    enabled: "enabled",
    disabled: "disabled",
    flood: "Flood",
    duplicate: "Duplicates",
    warnLimit: "Warning limit",
    autoMute: "Auto mute",
    minutes: "min",
    settingSaved: "✅ Setting saved.",
    usageToggle: "Usage: on or off.",
    filterAdded: "✅ Filter added.",
    filterRemoved: "✅ Filter removed.",
    filterExists: "That filter already exists.",
    filterMissing: "Filter not found.",
    filters: "Filters",
    noFilters: "There are no filters.",
    usageFilterAdd: "Usage: /filteradd word or phrase",
    usageFilterDel: "Usage: /filterdel word or phrase",
    spamRemoved: "Message removed by anti-spam.",
    filteredRemoved: "Message removed by content filter.",
    linksRemoved: "Links are not allowed in this group.",
    autoMuted: "User automatically restricted for violations.",
  },
};

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeCommand(text) {
  return cleanText(text).split(/\s+/)[0].split("@")[0].toLowerCase();
}

function localeFromMessage(message) {
  const code = String(message?.from?.language_code || "").toLowerCase();
  if (code.startsWith("uk")) return "uk";
  if (code.startsWith("ru")) return "ru";
  return "en";
}

function displayName(from) {
  return [from?.first_name, from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
    || from?.username
    || String(from?.id || "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseDuration(value) {
  const source = cleanText(value).toLowerCase();
  const match = source.match(/^(\d{1,4})(m|min|h|hr|d|day)$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];

  const multiplier =
    ["m", "min"].includes(unit) ? 60 :
    ["h", "hr"].includes(unit) ? 60 * 60 :
    24 * 60 * 60;

  const seconds = amount * multiplier;
  if (!Number.isFinite(seconds) || seconds < 60 || seconds > 30 * 24 * 60 * 60) {
    return null;
  }
  return seconds;
}

function commandArgs(text) {
  const source = String(text || "").trim();
  const firstSpace = source.indexOf(" ");
  return firstSpace === -1 ? "" : source.slice(firstSpace + 1).trim();
}

function hasLink(text) {
  return /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|discord\.gg\/|discord\.com\/invite\/)/i
    .test(String(text || ""));
}

export function createModerationAutomation({
  telegram,
  sendMessage,
  audit,
  supabase,
}) {
  const traffic = new Map();
  const duplicateTraffic = new Map();
  const settingsCache = new Map();
  const filtersCache = new Map();
  const cacheTtlMs = 60 * 1000;

  function cacheKey(chatId) {
    return String(chatId);
  }

  async function ensureSettings(chatId) {
    const key = cacheKey(chatId);
    const cached = settingsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const { data, error } = await supabase
      .from("telegram_moderation_settings")
      .select("*")
      .eq("chat_id", Number(chatId))
      .maybeSingle();

    if (error) throw error;

    let value = data;

    if (!value) {
      const { data: created, error: insertError } = await supabase
        .from("telegram_moderation_settings")
        .insert({
          chat_id: Number(chatId),
          ...DEFAULTS,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      value = created;
    }

    settingsCache.set(key, {
      value,
      expiresAt: Date.now() + cacheTtlMs,
    });

    return value;
  }

  async function updateSettings(chatId, patch) {
    const { data, error } = await supabase
      .from("telegram_moderation_settings")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", Number(chatId))
      .select("*")
      .single();

    if (error) throw error;

    settingsCache.set(cacheKey(chatId), {
      value: data,
      expiresAt: Date.now() + cacheTtlMs,
    });

    return data;
  }

  async function getFilters(chatId, force = false) {
    const key = cacheKey(chatId);
    const cached = filtersCache.get(key);

    if (!force && cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const { data, error } = await supabase
      .from("telegram_moderation_filters")
      .select("phrase")
      .eq("chat_id", Number(chatId))
      .order("phrase", { ascending: true });

    if (error) throw error;

    const value = (data || []).map((row) => String(row.phrase || "").toLowerCase());

    filtersCache.set(key, {
      value,
      expiresAt: Date.now() + cacheTtlMs,
    });

    return value;
  }

  async function isAdmin(chatId, userId) {
    try {
      const member = await telegram("getChatMember", {
        chat_id: chatId,
        user_id: Number(userId),
      });

      return ["creator", "administrator"].includes(member?.status);
    } catch {
      return false;
    }
  }

  async function requireAdmin(message) {
    if (await isAdmin(message.chat.id, message.from.id)) return true;

    const copy = COPY[localeFromMessage(message)];
    await sendMessage(message.chat.id, copy.noAccess, {
      reply_to_message_id: message.message_id,
      allow_sending_without_reply: true,
    });
    return false;
  }

  async function botCanModerate(chatId) {
    try {
      const me = await telegram("getMe");
      const member = await telegram("getChatMember", {
        chat_id: chatId,
        user_id: me.id,
      });

      return {
        delete: Boolean(member?.can_delete_messages),
        restrict: Boolean(member?.can_restrict_members),
      };
    } catch {
      return { delete: false, restrict: false };
    }
  }

  async function safeDelete(message) {
    try {
      await telegram("deleteMessage", {
        chat_id: message.chat.id,
        message_id: message.message_id,
      });
      return true;
    } catch (error) {
      console.error("telegram_moderation_delete_failed", {
        chatId: message.chat.id,
        messageId: message.message_id,
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function restrictUser(chatId, userId, seconds) {
    const untilDate = Math.floor(Date.now() / 1000) + Number(seconds);

    return telegram("restrictChatMember", {
      chat_id: chatId,
      user_id: Number(userId),
      until_date: untilDate,
      permissions: {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_manage_topics: false,
      },
    });
  }

  async function unrestrictUser(chatId, userId) {
    return telegram("restrictChatMember", {
      chat_id: chatId,
      user_id: Number(userId),
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
        can_manage_topics: false,
      },
    });
  }

  async function logEvent({
    chatId,
    action,
    targetUserId = null,
    actorUserId = null,
    metadata = {},
  }) {
    const { error } = await supabase
      .from("telegram_moderation_events")
      .insert({
        chat_id: Number(chatId),
        action,
        target_user_id: targetUserId ? Number(targetUserId) : null,
        actor_user_id: actorUserId ? Number(actorUserId) : null,
        metadata,
      });

    if (error) {
      console.error("telegram_moderation_event_failed", {
        action,
        message: error.message || String(error),
      });
    }
  }

  async function activeWarningCount(chatId, userId) {
    const { count, error } = await supabase
      .from("telegram_moderation_warnings")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", Number(chatId))
      .eq("user_id", Number(userId))
      .eq("active", true);

    if (error) throw error;
    return Number(count || 0);
  }

  async function issueWarning({
    chatId,
    target,
    moderatorId,
    reason,
    automatic = false,
  }) {
    const { error } = await supabase
      .from("telegram_moderation_warnings")
      .insert({
        chat_id: Number(chatId),
        user_id: Number(target.id),
        username: target.username || null,
        display_name: displayName(target),
        moderator_id: moderatorId ? Number(moderatorId) : null,
        reason: cleanText(reason) || null,
        active: true,
        automatic,
      });

    if (error) throw error;

    const count = await activeWarningCount(chatId, target.id);

    await logEvent({
      chatId,
      action: automatic ? "auto_warn" : "warn",
      targetUserId: target.id,
      actorUserId: moderatorId,
      metadata: { reason: cleanText(reason) || null, count },
    });

    return count;
  }

  async function maybeAutoMute(chatId, target, warningCount, settings, lang) {
    if (warningCount < Number(settings.warn_limit)) return false;

    await restrictUser(
      chatId,
      target.id,
      Number(settings.auto_mute_minutes) * 60,
    );

    await logEvent({
      chatId,
      action: "auto_mute_warn_limit",
      targetUserId: target.id,
      metadata: {
        warningCount,
        minutes: Number(settings.auto_mute_minutes),
      },
    });

    await sendMessage(
      chatId,
      `🔇 <b>${escapeHtml(displayName(target))}</b>\n${COPY[lang].autoMuted} ${settings.auto_mute_minutes} ${COPY[lang].minutes}.`,
    );

    return true;
  }

  function replyTarget(message) {
    return message?.reply_to_message?.from || null;
  }

  async function warnCommand(message, settings) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target || target.is_bot) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    if (await isAdmin(message.chat.id, target.id)) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const reason = commandArgs(message.text);
    const count = await issueWarning({
      chatId: message.chat.id,
      target,
      moderatorId: message.from.id,
      reason,
    });

    await sendMessage(
      message.chat.id,
      `${copy.warned}\n<b>${escapeHtml(displayName(target))}</b>: ${copy.warnings} <b>${count}/${settings.warn_limit}</b>${reason ? `\n${escapeHtml(reason)}` : ""}`,
    );

    await maybeAutoMute(
      message.chat.id,
      target,
      count,
      settings,
      lang,
    );
  }

  async function warningsCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_moderation_warnings")
      .select("id, reason, automatic, created_at")
      .eq("chat_id", Number(message.chat.id))
      .eq("user_id", Number(target.id))
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const rows = data || [];
    const lines = [
      `⚠️ <b>${copy.warnings}: ${escapeHtml(displayName(target))}</b>`,
      "",
      `Active: <b>${rows.length}</b>`,
    ];

    for (const row of rows) {
      lines.push(
        `#${row.id}${row.automatic ? " · AUTO" : ""}${row.reason ? ` · ${escapeHtml(row.reason)}` : ""}`,
      );
    }

    await sendMessage(message.chat.id, lines.join("\n"));
  }

  async function clearWarningsCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("telegram_moderation_warnings")
      .update({
        active: false,
        cleared_at: now,
        cleared_by: Number(message.from.id),
      })
      .eq("chat_id", Number(message.chat.id))
      .eq("user_id", Number(target.id))
      .eq("active", true);

    if (error) throw error;

    await logEvent({
      chatId: message.chat.id,
      action: "clear_warnings",
      targetUserId: target.id,
      actorUserId: message.from.id,
    });

    await sendMessage(message.chat.id, copy.cleared);
  }

  async function muteCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target || target.is_bot) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    if (await isAdmin(message.chat.id, target.id)) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const args = commandArgs(message.text);
    const [durationToken, ...reasonParts] = args.split(/\s+/).filter(Boolean);
    const seconds = parseDuration(durationToken);

    if (!seconds) {
      await sendMessage(message.chat.id, copy.badDuration);
      return;
    }

    await restrictUser(message.chat.id, target.id, seconds);

    await logEvent({
      chatId: message.chat.id,
      action: "mute",
      targetUserId: target.id,
      actorUserId: message.from.id,
      metadata: {
        seconds,
        reason: reasonParts.join(" ") || null,
      },
    });

    await sendMessage(
      message.chat.id,
      `${copy.muted}\n<b>${escapeHtml(displayName(target))}</b> · ${durationToken}`,
    );
  }

  async function unmuteCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    await unrestrictUser(message.chat.id, target.id);

    await logEvent({
      chatId: message.chat.id,
      action: "unmute",
      targetUserId: target.id,
      actorUserId: message.from.id,
    });

    await sendMessage(message.chat.id, copy.unmuted);
  }

  async function banCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const target = replyTarget(message);
    if (!target || target.is_bot) {
      await sendMessage(message.chat.id, copy.replyRequired);
      return;
    }

    if (await isAdmin(message.chat.id, target.id)) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const reason = commandArgs(message.text);

    await telegram("banChatMember", {
      chat_id: message.chat.id,
      user_id: Number(target.id),
      revoke_messages: true,
    });

    await logEvent({
      chatId: message.chat.id,
      action: "ban",
      targetUserId: target.id,
      actorUserId: message.from.id,
      metadata: { reason: reason || null },
    });

    await sendMessage(
      message.chat.id,
      `${copy.banned}\n<b>${escapeHtml(displayName(target))}</b>`,
    );
  }

  async function unbanCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const id = Number(commandArgs(message.text).split(/\s+/)[0]);

    if (!Number.isSafeInteger(id) || id <= 0) {
      await sendMessage(message.chat.id, copy.badUserId);
      return;
    }

    await telegram("unbanChatMember", {
      chat_id: message.chat.id,
      user_id: id,
      only_if_banned: true,
    });

    await logEvent({
      chatId: message.chat.id,
      action: "unban",
      targetUserId: id,
      actorUserId: message.from.id,
    });

    await sendMessage(message.chat.id, copy.unbanned);
  }

  async function statusCommand(message, settings) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const rights = await botCanModerate(message.chat.id);

    await sendMessage(
      message.chat.id,
      [
        `🛡️ <b>${copy.status}</b>`,
        "",
        `${copy.antiSpam}: <b>${settings.anti_spam ? copy.enabled : copy.disabled}</b>`,
        `${copy.links}: <b>${settings.link_filter ? copy.enabled : copy.disabled}</b>`,
        `${copy.flood}: <code>${settings.flood_limit}/${settings.flood_window_seconds}s</code>`,
        `${copy.duplicate}: <code>${settings.duplicate_limit}/${settings.duplicate_window_seconds}s</code>`,
        `${copy.warnLimit}: <code>${settings.warn_limit}</code>`,
        `${copy.autoMute}: <code>${settings.auto_mute_minutes} ${copy.minutes}</code>`,
        "",
        `Delete messages: <b>${rights.delete ? "OK" : "NO"}</b>`,
        `Restrict members: <b>${rights.restrict ? "OK" : "NO"}</b>`,
      ].join("\n"),
    );
  }

  async function toggleCommand(message, field) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const value = commandArgs(message.text).toLowerCase();
    if (!["on", "off"].includes(value)) {
      await sendMessage(message.chat.id, copy.usageToggle);
      return;
    }

    await updateSettings(message.chat.id, {
      [field]: value === "on",
    });

    await logEvent({
      chatId: message.chat.id,
      action: `setting_${field}`,
      actorUserId: message.from.id,
      metadata: { enabled: value === "on" },
    });

    await sendMessage(message.chat.id, copy.settingSaved);
  }

  async function filterAddCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const phrase = cleanText(commandArgs(message.text)).toLowerCase();

    if (!phrase || phrase.length > 120) {
      await sendMessage(message.chat.id, copy.usageFilterAdd);
      return;
    }

    const { error } = await supabase
      .from("telegram_moderation_filters")
      .insert({
        chat_id: Number(message.chat.id),
        phrase,
        created_by: Number(message.from.id),
      });

    if (error?.code === "23505") {
      await sendMessage(message.chat.id, copy.filterExists);
      return;
    }

    if (error) throw error;

    await getFilters(message.chat.id, true);

    await logEvent({
      chatId: message.chat.id,
      action: "filter_add",
      actorUserId: message.from.id,
      metadata: { phrase },
    });

    await sendMessage(message.chat.id, copy.filterAdded);
  }

  async function filterDelCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const phrase = cleanText(commandArgs(message.text)).toLowerCase();

    if (!phrase) {
      await sendMessage(message.chat.id, copy.usageFilterDel);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_moderation_filters")
      .delete()
      .eq("chat_id", Number(message.chat.id))
      .eq("phrase", phrase)
      .select("id");

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, copy.filterMissing);
      return;
    }

    await getFilters(message.chat.id, true);

    await logEvent({
      chatId: message.chat.id,
      action: "filter_del",
      actorUserId: message.from.id,
      metadata: { phrase },
    });

    await sendMessage(message.chat.id, copy.filterRemoved);
  }

  async function filtersCommand(message) {
    const lang = localeFromMessage(message);
    const copy = COPY[lang];

    if (!(await requireAdmin(message))) return;

    const filters = await getFilters(message.chat.id, true);

    if (!filters.length) {
      await sendMessage(message.chat.id, copy.noFilters);
      return;
    }

    await sendMessage(
      message.chat.id,
      [
        `🧹 <b>${copy.filters}</b>`,
        "",
        ...filters.map((value) => `• <code>${escapeHtml(value)}</code>`),
      ].join("\n"),
    );
  }

  function prune(list, windowMs, now) {
    return list.filter((timestamp) => now - timestamp <= windowMs);
  }

  async function applyAutomaticModeration(message, settings) {
    if (!message?.from?.id || message.from.is_bot) return false;

    if (await isAdmin(message.chat.id, message.from.id)) return false;

    const lang = localeFromMessage(message);
    const copy = COPY[lang];
    const text = String(message.text || message.caption || "").trim();

    if (!text) return false;

    if (settings.link_filter && hasLink(text)) {
      await safeDelete(message);

      const count = await issueWarning({
        chatId: message.chat.id,
        target: message.from,
        moderatorId: null,
        reason: "link_filter",
        automatic: true,
      });

      await sendMessage(
        message.chat.id,
        `${copy.linksRemoved}\n<b>${escapeHtml(displayName(message.from))}</b> · ${copy.warnings}: ${count}/${settings.warn_limit}`,
      );

      await maybeAutoMute(
        message.chat.id,
        message.from,
        count,
        settings,
        lang,
      );

      return true;
    }

    const filters = await getFilters(message.chat.id);
    const normalized = text.toLowerCase();

    const matched = filters.find((phrase) => phrase && normalized.includes(phrase));
    if (matched) {
      await safeDelete(message);

      const count = await issueWarning({
        chatId: message.chat.id,
        target: message.from,
        moderatorId: null,
        reason: `filter:${matched}`,
        automatic: true,
      });

      await sendMessage(
        message.chat.id,
        `${copy.filteredRemoved}\n<b>${escapeHtml(displayName(message.from))}</b> · ${copy.warnings}: ${count}/${settings.warn_limit}`,
      );

      await maybeAutoMute(
        message.chat.id,
        message.from,
        count,
        settings,
        lang,
      );

      return true;
    }

    if (!settings.anti_spam) return false;

    const now = Date.now();
    const userKey = `${message.chat.id}:${message.from.id}`;

    const floodWindowMs = Number(settings.flood_window_seconds) * 1000;
    const floodList = prune(
      traffic.get(userKey) || [],
      floodWindowMs,
      now,
    );

    floodList.push(now);
    traffic.set(userKey, floodList);

    if (floodList.length > Number(settings.flood_limit)) {
      await safeDelete(message);

      await restrictUser(
        message.chat.id,
        message.from.id,
        Number(settings.auto_mute_minutes) * 60,
      );

      traffic.delete(userKey);

      await logEvent({
        chatId: message.chat.id,
        action: "auto_mute_flood",
        targetUserId: message.from.id,
        metadata: {
          messages: floodList.length,
          windowSeconds: Number(settings.flood_window_seconds),
          muteMinutes: Number(settings.auto_mute_minutes),
        },
      });

      await sendMessage(
        message.chat.id,
        `${copy.spamRemoved}\n<b>${escapeHtml(displayName(message.from))}</b> · ${copy.autoMuted} ${settings.auto_mute_minutes} ${copy.minutes}.`,
      );

      return true;
    }

    const duplicateWindowMs = Number(settings.duplicate_window_seconds) * 1000;
    const duplicateKey = `${userKey}:${normalized.slice(0, 250)}`;
    const duplicateList = prune(
      duplicateTraffic.get(duplicateKey) || [],
      duplicateWindowMs,
      now,
    );

    duplicateList.push(now);
    duplicateTraffic.set(duplicateKey, duplicateList);

    if (duplicateList.length >= Number(settings.duplicate_limit)) {
      await safeDelete(message);
      duplicateTraffic.delete(duplicateKey);

      const count = await issueWarning({
        chatId: message.chat.id,
        target: message.from,
        moderatorId: null,
        reason: "duplicate_spam",
        automatic: true,
      });

      await sendMessage(
        message.chat.id,
        `${copy.spamRemoved}\n<b>${escapeHtml(displayName(message.from))}</b> · ${copy.warnings}: ${count}/${settings.warn_limit}`,
      );

      await maybeAutoMute(
        message.chat.id,
        message.from,
        count,
        settings,
        lang,
      );

      return true;
    }

    return false;
  }

  async function handleMessage(message) {
    if (!["group", "supergroup"].includes(message?.chat?.type)) {
      return false;
    }

    if (!message?.from?.id) return false;

    const settings = await ensureSettings(message.chat.id);
    const command = normalizeCommand(message.text || "");

    if (command === "/warn") {
      await warnCommand(message, settings);
      return true;
    }

    if (command === "/warnings") {
      await warningsCommand(message);
      return true;
    }

    if (command === "/clearwarnings") {
      await clearWarningsCommand(message);
      return true;
    }

    if (command === "/mute") {
      await muteCommand(message);
      return true;
    }

    if (command === "/unmute") {
      await unmuteCommand(message);
      return true;
    }

    if (command === "/ban") {
      await banCommand(message);
      return true;
    }

    if (command === "/unban") {
      await unbanCommand(message);
      return true;
    }

    if (command === "/modstatus") {
      await statusCommand(message, settings);
      return true;
    }

    if (command === "/antispam") {
      await toggleCommand(message, "anti_spam");
      return true;
    }

    if (command === "/links") {
      await toggleCommand(message, "link_filter");
      return true;
    }

    if (command === "/filteradd") {
      await filterAddCommand(message);
      return true;
    }

    if (command === "/filterdel") {
      await filterDelCommand(message);
      return true;
    }

    if (command === "/filters") {
      await filtersCommand(message);
      return true;
    }

    return applyAutomaticModeration(message, settings);
  }

  async function initialize() {
    try {
      const checks = await Promise.all([
        supabase.from("telegram_moderation_settings").select("chat_id").limit(1),
        supabase.from("telegram_moderation_warnings").select("id").limit(1),
        supabase.from("telegram_moderation_filters").select("id").limit(1),
        supabase.from("telegram_moderation_events").select("id").limit(1),
      ]);

      for (const result of checks) {
        if (result.error) throw result.error;
      }

      console.log("telegram_moderation_ready", {
        antiSpamDefault: DEFAULTS.anti_spam,
        linkFilterDefault: DEFAULTS.link_filter,
        floodDefault: `${DEFAULTS.flood_limit}/${DEFAULTS.flood_window_seconds}s`,
        duplicateDefault: `${DEFAULTS.duplicate_limit}/${DEFAULTS.duplicate_window_seconds}s`,
        warnLimitDefault: DEFAULTS.warn_limit,
        autoMuteMinutesDefault: DEFAULTS.auto_mute_minutes,
      });

      return true;
    } catch (error) {
      console.error("telegram_moderation_init_failed", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code || null,
        details: error?.details || null,
        hint: error?.hint || null,
      });

      return false;
    }
  }

  return {
    initialize,
    handleMessage,
  };
}
