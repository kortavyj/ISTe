import { randomInt } from "node:crypto";

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_GIVEAWAY_MS = 10 * 60 * 1000;
const MAX_GIVEAWAY_MS = 30 * 24 * 60 * 60 * 1000;

const COPY = {
  uk: {
    noAccess: "Ця дія недоступна для вашої ролі.",
    giveawayTitle: "Розіграші ISTesport",
    noGiveaways: "Активних розіграшів зараз немає.",
    createGiveaway: "Створити розіграш",
    giveawayNamePrompt: "Вкажіть назву розіграшу.",
    giveawayPrizePrompt: "Вкажіть приз.",
    giveawayRulesPrompt:
      "Опишіть умови участі. Якщо додаткових умов немає, надішліть «-».",
    giveawayDurationPrompt:
      "Вкажіть тривалість. Приклади: 30m, 2h, 1d, 7d. Мінімум 10 хвилин, максимум 30 днів.",
    badDuration:
      "Не вдалося розпізнати тривалість. Приклади: 30m, 2h, 1d, 7d.",
    draftExists:
      "У вас уже є незавершений розіграш або опитування. Завершіть його або скасуйте.",
    draftCancelled: "Чернетку скасовано.",
    draftMissing: "Активної чернетки немає.",
    giveawayPreview: "Попередній перегляд розіграшу",
    publish: "📣 Опублікувати",
    cancel: "❌ Скасувати",
    join: "🎁 Взяти участь",
    joined: "Ви берете участь",
    alreadyJoined: "Ви вже берете участь",
    membershipRequired:
      "Для участі потрібно бути підписаним на канал ISTesport.",
    giveawayClosed: "Розіграш уже завершено.",
    giveawayEnded: "Розіграш завершено",
    winner: "Переможець",
    noWinner: "Учасників немає. Переможця не обрано.",
    participants: "Учасників",
    prize: "Приз",
    rules: "Умови",
    ends: "Завершення",
    active: "активний",
    finished: "завершений",
    cancelled: "скасований",
    giveawayPublished: "Розіграш опубліковано в каналі.",
    giveawayNotFound: "Розіграш не знайдено.",
    giveawayStatusTitle: "Статус розіграшів",
    activeCount: "Активних",
    finishedCount: "Завершених",
    participantCount: "Усього участей",
    pollTitle: "Опитування ISTesport",
    pollQuestionPrompt: "Надішліть питання для опитування.",
    pollOptionsPrompt:
      "Надішліть варіанти відповіді, кожен з нового рядка. Від 2 до 10 варіантів.",
    pollBadOptions: "Потрібно від 2 до 10 непорожніх варіантів.",
    pollModePrompt: "Оберіть режим опитування.",
    anonymous: "Анонімне",
    publicPoll: "Публічне",
    pollPublished: "Опитування опубліковано в каналі.",
    pollsTitle: "Опитування",
    noPolls: "Опитувань поки немає.",
    pollClosed: "Опитування закрито.",
    pollNotFound: "Опитування не знайдено або вже закрито.",
    adminPanel: "Розіграші / опитування",
    newGiveaway: "🎁 Новий розіграш",
    newPoll: "📊 Нове опитування",
    listGiveaways: "🎁 Розіграші",
    listPolls: "📊 Опитування",
  },
  ru: {
    noAccess: "Это действие недоступно для вашей роли.",
    giveawayTitle: "Розыгрыши ISTesport",
    noGiveaways: "Активных розыгрышей сейчас нет.",
    createGiveaway: "Создать розыгрыш",
    giveawayNamePrompt: "Укажите название розыгрыша.",
    giveawayPrizePrompt: "Укажите приз.",
    giveawayRulesPrompt:
      "Опишите условия участия. Если дополнительных условий нет, отправьте «-».",
    giveawayDurationPrompt:
      "Укажите длительность. Примеры: 30m, 2h, 1d, 7d. Минимум 10 минут, максимум 30 дней.",
    badDuration:
      "Не удалось распознать длительность. Примеры: 30m, 2h, 1d, 7d.",
    draftExists:
      "У вас уже есть незавершённый розыгрыш или опрос. Завершите его или отмените.",
    draftCancelled: "Черновик отменён.",
    draftMissing: "Активного черновика нет.",
    giveawayPreview: "Предпросмотр розыгрыша",
    publish: "📣 Опубликовать",
    cancel: "❌ Отменить",
    join: "🎁 Участвовать",
    joined: "Вы участвуете",
    alreadyJoined: "Вы уже участвуете",
    membershipRequired:
      "Для участия нужно быть подписанным на канал ISTesport.",
    giveawayClosed: "Розыгрыш уже завершён.",
    giveawayEnded: "Розыгрыш завершён",
    winner: "Победитель",
    noWinner: "Участников нет. Победитель не выбран.",
    participants: "Участников",
    prize: "Приз",
    rules: "Условия",
    ends: "Завершение",
    active: "активный",
    finished: "завершён",
    cancelled: "отменён",
    giveawayPublished: "Розыгрыш опубликован в канале.",
    giveawayNotFound: "Розыгрыш не найден.",
    giveawayStatusTitle: "Статус розыгрышей",
    activeCount: "Активных",
    finishedCount: "Завершённых",
    participantCount: "Всего участий",
    pollTitle: "Опрос ISTesport",
    pollQuestionPrompt: "Отправьте вопрос для опроса.",
    pollOptionsPrompt:
      "Отправьте варианты ответа, каждый с новой строки. От 2 до 10 вариантов.",
    pollBadOptions: "Нужно от 2 до 10 непустых вариантов.",
    pollModePrompt: "Выберите режим опроса.",
    anonymous: "Анонимный",
    publicPoll: "Публичный",
    pollPublished: "Опрос опубликован в канале.",
    pollsTitle: "Опросы",
    noPolls: "Опросов пока нет.",
    pollClosed: "Опрос закрыт.",
    pollNotFound: "Опрос не найден или уже закрыт.",
    adminPanel: "Розыгрыши / опросы",
    newGiveaway: "🎁 Новый розыгрыш",
    newPoll: "📊 Новый опрос",
    listGiveaways: "🎁 Розыгрыши",
    listPolls: "📊 Опросы",
  },
  en: {
    noAccess: "This action is not available for your role.",
    giveawayTitle: "ISTesport giveaways",
    noGiveaways: "There are no active giveaways right now.",
    createGiveaway: "Create giveaway",
    giveawayNamePrompt: "Enter a giveaway title.",
    giveawayPrizePrompt: "Enter the prize.",
    giveawayRulesPrompt:
      "Describe the participation rules. Send “-” if there are no extra rules.",
    giveawayDurationPrompt:
      "Enter duration. Examples: 30m, 2h, 1d, 7d. Minimum 10 minutes, maximum 30 days.",
    badDuration:
      "Could not parse the duration. Examples: 30m, 2h, 1d, 7d.",
    draftExists:
      "You already have an unfinished giveaway or poll. Finish or cancel it first.",
    draftCancelled: "Draft cancelled.",
    draftMissing: "There is no active draft.",
    giveawayPreview: "Giveaway preview",
    publish: "📣 Publish",
    cancel: "❌ Cancel",
    join: "🎁 Join giveaway",
    joined: "You are participating",
    alreadyJoined: "You are already participating",
    membershipRequired:
      "You must be subscribed to the ISTesport channel to participate.",
    giveawayClosed: "This giveaway has already ended.",
    giveawayEnded: "Giveaway ended",
    winner: "Winner",
    noWinner: "There were no participants. No winner was selected.",
    participants: "Participants",
    prize: "Prize",
    rules: "Rules",
    ends: "Ends",
    active: "active",
    finished: "finished",
    cancelled: "cancelled",
    giveawayPublished: "Giveaway published to the channel.",
    giveawayNotFound: "Giveaway not found.",
    giveawayStatusTitle: "Giveaway status",
    activeCount: "Active",
    finishedCount: "Finished",
    participantCount: "Total entries",
    pollTitle: "ISTesport poll",
    pollQuestionPrompt: "Send the poll question.",
    pollOptionsPrompt:
      "Send the answer options, one per line. Use 2 to 10 options.",
    pollBadOptions: "Use 2 to 10 non-empty options.",
    pollModePrompt: "Choose poll mode.",
    anonymous: "Anonymous",
    publicPoll: "Public",
    pollPublished: "Poll published to the channel.",
    pollsTitle: "Polls",
    noPolls: "There are no polls yet.",
    pollClosed: "Poll closed.",
    pollNotFound: "Poll not found or already closed.",
    adminPanel: "Giveaways / polls",
    newGiveaway: "🎁 New giveaway",
    newPoll: "📊 New poll",
    listGiveaways: "🎁 Giveaways",
    listPolls: "📊 Polls",
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

function displayName(from) {
  return [from?.first_name, from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
    || from?.username
    || String(from?.id || "");
}

function normalizeCommand(text) {
  return cleanText(text).split(/\s+/)[0].split("@")[0].toLowerCase();
}

function parseDuration(value) {
  const source = cleanText(value).toLowerCase().replace(/\s+/g, "");
  const match = source.match(/^(\d{1,4})(m|min|мин|h|hr|час|ч|d|day|д)$/i);

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  let multiplier = 0;

  if (["m", "min", "мин"].includes(unit)) multiplier = 60 * 1000;
  if (["h", "hr", "час", "ч"].includes(unit)) multiplier = 60 * 60 * 1000;
  if (["d", "day", "д"].includes(unit)) multiplier = 24 * 60 * 60 * 1000;

  const milliseconds = amount * multiplier;

  if (
    !Number.isFinite(milliseconds) ||
    milliseconds < MIN_GIVEAWAY_MS ||
    milliseconds > MAX_GIVEAWAY_MS
  ) {
    return null;
  }

  return milliseconds;
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
  }).format(date);
}

function statusLabel(status, lang) {
  const copy = COPY[lang];
  return copy[status] || status;
}

function giveawayText(giveaway, lang, options = {}) {
  const copy = COPY[lang];
  const preview = Boolean(options.preview);
  const ended = ["finished", "cancelled"].includes(giveaway.status);
  const lines = [];

  if (preview) {
    lines.push(`🧪 <b>${escapeHtml(copy.giveawayPreview)}</b>`, "");
  }

  lines.push(
    `🎁 <b>${escapeHtml(giveaway.title || "ISTesport Giveaway")}</b>`,
    "",
    `${copy.prize}: <b>${escapeHtml(giveaway.prize || "")}</b>`,
  );

  const rules = cleanText(giveaway.rules);
  if (rules && rules !== "-") {
    lines.push("", `${copy.rules}:`, escapeHtml(rules));
  }

  if (giveaway.ends_at) {
    lines.push(
      "",
      `⏳ ${copy.ends}: <b>${escapeHtml(formatDate(giveaway.ends_at, lang))}</b>`,
    );
  }

  if (ended && giveaway.participant_count !== undefined) {
    lines.push(
      `👥 ${copy.participants}: <b>${Number(giveaway.participant_count || 0)}</b>`,
    );
  }

  if (giveaway.status === "finished" && giveaway.winner_telegram_user_id) {
    const winnerName =
      giveaway.winner_display_name ||
      giveaway.winner_username ||
      String(giveaway.winner_telegram_user_id);

    lines.push(
      "",
      `🏆 ${copy.winner}: <a href="tg://user?id=${Number(giveaway.winner_telegram_user_id)}">${escapeHtml(winnerName)}</a>`,
    );
  }

  if (giveaway.status === "finished" && !giveaway.winner_telegram_user_id) {
    lines.push("", escapeHtml(copy.noWinner));
  }

  return lines.join("\n");
}

function giveawayKeyboard(giveaway, lang) {
  if (giveaway.status !== "active") return { inline_keyboard: [] };

  return {
    inline_keyboard: [[
      {
        text: COPY[lang].join,
        callback_data: `gw:join:${giveaway.id}`,
      },
    ]],
  };
}

function draftPreview(data, lang) {
  return giveawayText(
    {
      title: data.title,
      prize: data.prize,
      rules: data.rules,
      ends_at: new Date(Date.now() + Number(data.duration_ms || 0)).toISOString(),
      status: "active",
    },
    lang,
    { preview: true },
  );
}

function pollOptionsFromText(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 20);
}

export function createEngagementAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  channel,
  ownerId,
  hasRole,
}) {
  const channelLanguage = localeKey(
    process.env.TELEGRAM_CHANNEL_LANGUAGE || "uk",
  );

  const sweepSeconds = Math.min(
    300,
    Math.max(
      15,
      Number(process.env.TELEGRAM_GIVEAWAY_POLL_SECONDS || 30),
    ),
  );

  let sweepTimer = null;
  let sweepRunning = false;

  async function getGiveawayDraft(userId) {
    const { data, error } = await supabase
      .from("telegram_giveaway_drafts")
      .select("*")
      .eq("telegram_user_id", Number(userId))
      .maybeSingle();

    if (error) throw error;

    if (
      data &&
      new Date(data.expires_at).getTime() <= Date.now()
    ) {
      await deleteGiveawayDraft(userId);
      return null;
    }

    return data || null;
  }

  async function saveGiveawayDraft(userId, step, data, language) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DRAFT_TTL_MS);

    const { error } = await supabase
      .from("telegram_giveaway_drafts")
      .upsert(
        {
          telegram_user_id: Number(userId),
          step,
          data,
          language: localeKey(language),
          updated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "telegram_user_id" },
      );

    if (error) throw error;
  }

  async function deleteGiveawayDraft(userId) {
    const { error } = await supabase
      .from("telegram_giveaway_drafts")
      .delete()
      .eq("telegram_user_id", Number(userId));

    if (error) throw error;
  }

  async function getPollDraft(userId) {
    const { data, error } = await supabase
      .from("telegram_poll_drafts")
      .select("*")
      .eq("telegram_user_id", Number(userId))
      .maybeSingle();

    if (error) throw error;

    if (
      data &&
      new Date(data.expires_at).getTime() <= Date.now()
    ) {
      await deletePollDraft(userId);
      return null;
    }

    return data || null;
  }

  async function savePollDraft(userId, step, data, language) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DRAFT_TTL_MS);

    const { error } = await supabase
      .from("telegram_poll_drafts")
      .upsert(
        {
          telegram_user_id: Number(userId),
          step,
          data,
          language: localeKey(language),
          updated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "telegram_user_id" },
      );

    if (error) throw error;
  }

  async function deletePollDraft(userId) {
    const { error } = await supabase
      .from("telegram_poll_drafts")
      .delete()
      .eq("telegram_user_id", Number(userId));

    if (error) throw error;
  }

  async function hasAnyDraft(userId) {
    const [giveaway, poll] = await Promise.all([
      getGiveawayDraft(userId),
      getPollDraft(userId),
    ]);

    return Boolean(giveaway || poll);
  }

  async function startGiveaway(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    if (await hasAnyDraft(message.from.id)) {
      await sendMessage(message.chat.id, copy.draftExists);
      return;
    }

    await saveGiveawayDraft(
      message.from.id,
      "title",
      {},
      lang,
    );

    await sendMessage(
      message.chat.id,
      `🎁 <b>${copy.createGiveaway}</b>\n\n${copy.giveawayNamePrompt}`,
    );
  }

  async function cancelGiveawayDraft(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const draft = await getGiveawayDraft(message.from.id);

    if (!draft) {
      await sendMessage(message.chat.id, copy.draftMissing);
      return;
    }

    await deleteGiveawayDraft(message.from.id);
    await sendMessage(message.chat.id, copy.draftCancelled);
  }

  async function processGiveawayDraft(message, user, draft) {
    const lang = localeKey(draft.language || user.language);
    const copy = COPY[lang];
    const value = cleanText(message.text);
    const data = { ...(draft.data || {}) };

    if (!value) return true;

    if (draft.step === "title") {
      if (value.length < 3 || value.length > 120) {
        await sendMessage(
          message.chat.id,
          `${copy.giveawayNamePrompt}\n\n3–120`,
        );
        return true;
      }

      data.title = value;
      await saveGiveawayDraft(message.from.id, "prize", data, lang);
      await sendMessage(message.chat.id, copy.giveawayPrizePrompt);
      return true;
    }

    if (draft.step === "prize") {
      if (value.length < 2 || value.length > 250) {
        await sendMessage(message.chat.id, copy.giveawayPrizePrompt);
        return true;
      }

      data.prize = value;
      await saveGiveawayDraft(message.from.id, "rules", data, lang);
      await sendMessage(message.chat.id, copy.giveawayRulesPrompt);
      return true;
    }

    if (draft.step === "rules") {
      if (value.length > 1000) {
        await sendMessage(message.chat.id, copy.giveawayRulesPrompt);
        return true;
      }

      data.rules = value;
      await saveGiveawayDraft(message.from.id, "duration", data, lang);
      await sendMessage(message.chat.id, copy.giveawayDurationPrompt);
      return true;
    }

    if (draft.step === "duration") {
      const durationMs = parseDuration(value);

      if (!durationMs) {
        await sendMessage(message.chat.id, copy.badDuration);
        return true;
      }

      data.duration_ms = durationMs;

      await saveGiveawayDraft(
        message.from.id,
        "confirm",
        data,
        lang,
      );

      await sendMessage(
        message.chat.id,
        draftPreview(data, lang),
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: copy.publish,
                callback_data: "gw:create:publish",
              },
              {
                text: copy.cancel,
                callback_data: "gw:create:cancel",
              },
            ]],
          },
        },
      );

      return true;
    }

    if (draft.step === "confirm") {
      await sendMessage(
        message.chat.id,
        draftPreview(data, lang),
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: copy.publish,
                callback_data: "gw:create:publish",
              },
              {
                text: copy.cancel,
                callback_data: "gw:create:cancel",
              },
            ]],
          },
        },
      );
      return true;
    }

    return false;
  }

  async function publishGiveaway(query, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await answerCallback(query.id, copy.noAccess);
      return;
    }

    const draft = await getGiveawayDraft(query.from.id);

    if (!draft || draft.step !== "confirm") {
      await answerCallback(query.id, copy.draftMissing);
      return;
    }

    const data = draft.data || {};
    const now = new Date();
    const endsAt = new Date(
      now.getTime() + Number(data.duration_ms || 0),
    );

    const { data: giveaway, error: insertError } = await supabase
      .from("telegram_giveaways")
      .insert({
        title: cleanText(data.title),
        prize: cleanText(data.prize),
        rules: cleanText(data.rules),
        status: "publishing",
        created_by: Number(query.from.id),
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    let channelMessage = null;

    try {
      channelMessage = await sendMessage(
        channel,
        giveawayText(
          { ...giveaway, status: "active" },
          channelLanguage,
        ),
        {
          reply_markup: giveawayKeyboard(
            { ...giveaway, status: "active" },
            channelLanguage,
          ),
        },
      );

      const { error: updateError } = await supabase
        .from("telegram_giveaways")
        .update({
          status: "active",
          telegram_chat_id: String(channelMessage.chat.id),
          telegram_message_id: Number(channelMessage.message_id),
          updated_at: new Date().toISOString(),
        })
        .eq("id", giveaway.id)
        .eq("status", "publishing");

      if (updateError) throw updateError;

      await deleteGiveawayDraft(query.from.id);

      await answerCallback(query.id, copy.giveawayPublished);

      try {
        await telegram("editMessageText", {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          text: `✅ <b>${escapeHtml(copy.giveawayPublished)}</b>`,
          parse_mode: "HTML",
        });
      } catch {
        // The confirmation message may already have been changed.
      }

      await audit(query.from.id, "giveaway_published", {
        giveawayId: giveaway.id,
        telegramMessageId: channelMessage.message_id,
      });

      console.log("telegram_giveaway_published", {
        giveawayId: giveaway.id,
        telegramMessageId: channelMessage.message_id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!channelMessage) {
        await supabase
          .from("telegram_giveaways")
          .update({
            status: "failed",
            last_error: message.slice(0, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", giveaway.id);
      } else {
        // A channel post already exists. Keep publishing state to avoid a duplicate.
        await supabase
          .from("telegram_giveaways")
          .update({
            last_error:
              `Telegram post created but DB acknowledgement failed: ${message}`.slice(0, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", giveaway.id);
      }

      throw error;
    }
  }

  async function isChannelMember(userId) {
    try {
      const member = await telegram("getChatMember", {
        chat_id: channel,
        user_id: Number(userId),
      });

      if (["creator", "administrator", "member"].includes(member.status)) {
        return true;
      }

      if (member.status === "restricted" && member.is_member) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("telegram_giveaway_membership_check_failed", {
        userId: Number(userId),
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function joinGiveaway(data, query, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const giveawayId = Number(data.split(":")[2]);

    if (!Number.isSafeInteger(giveawayId) || giveawayId <= 0) {
      await answerCallback(query.id, copy.giveawayNotFound);
      return;
    }

    const { data: giveaway, error } = await supabase
      .from("telegram_giveaways")
      .select("id, status, ends_at")
      .eq("id", giveawayId)
      .maybeSingle();

    if (error) throw error;

    if (
      !giveaway ||
      giveaway.status !== "active" ||
      new Date(giveaway.ends_at).getTime() <= Date.now()
    ) {
      await answerCallback(query.id, copy.giveawayClosed);
      return;
    }

    if (!(await isChannelMember(query.from.id))) {
      await answerCallback(query.id, copy.membershipRequired);
      return;
    }

    const row = {
      giveaway_id: giveawayId,
      telegram_user_id: Number(query.from.id),
      username: query.from.username || null,
      display_name: displayName(query.from),
    };

    const { error: insertError } = await supabase
      .from("telegram_giveaway_participants")
      .insert(row);

    if (insertError && insertError.code !== "23505") {
      throw insertError;
    }

    const { count, error: countError } = await supabase
      .from("telegram_giveaway_participants")
      .select("*", { count: "exact", head: true })
      .eq("giveaway_id", giveawayId);

    if (countError) throw countError;

    await answerCallback(
      query.id,
      `${insertError?.code === "23505" ? copy.alreadyJoined : copy.joined}. ${copy.participants}: ${count || 0}`,
    );

    if (!insertError) {
      await audit(query.from.id, "giveaway_joined", {
        giveawayId,
      });
    }
  }

  async function pickWinner(giveawayId) {
    const { count, error: countError } = await supabase
      .from("telegram_giveaway_participants")
      .select("*", { count: "exact", head: true })
      .eq("giveaway_id", giveawayId);

    if (countError) throw countError;

    const participantCount = Number(count || 0);
    if (!participantCount) {
      return { participantCount: 0, winner: null };
    }

    const index = randomInt(participantCount);

    const { data, error } = await supabase
      .from("telegram_giveaway_participants")
      .select("telegram_user_id, username, display_name")
      .eq("giveaway_id", giveawayId)
      .order("id", { ascending: true })
      .range(index, index)
      .single();

    if (error) throw error;

    return {
      participantCount,
      winner: data,
    };
  }

  async function finalizeGiveaway(giveawayId, actorId = null) {
    const { data: claimed, error: claimError } = await supabase
      .from("telegram_giveaways")
      .update({
        status: "drawing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", giveawayId)
      .eq("status", "active")
      .select("*")
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claimed) return null;

    try {
      const { participantCount, winner } = await pickWinner(giveawayId);
      const finishedAt = new Date().toISOString();

      const update = {
        status: "finished",
        participant_count: participantCount,
        ended_at: finishedAt,
        updated_at: finishedAt,
        winner_telegram_user_id: winner?.telegram_user_id || null,
        winner_username: winner?.username || null,
        winner_display_name: winner?.display_name || null,
        last_error: null,
      };

      const { data: finished, error: finishError } = await supabase
        .from("telegram_giveaways")
        .update(update)
        .eq("id", giveawayId)
        .eq("status", "drawing")
        .select("*")
        .single();

      if (finishError) throw finishError;

      if (
        finished.telegram_chat_id &&
        finished.telegram_message_id
      ) {
        try {
          await telegram("editMessageText", {
            chat_id: finished.telegram_chat_id,
            message_id: finished.telegram_message_id,
            text: giveawayText(finished, channelLanguage),
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard: [] },
          });
        } catch (error) {
          console.error("telegram_giveaway_edit_failed", {
            giveawayId,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (winner) {
        const winnerName =
          winner.display_name ||
          winner.username ||
          String(winner.telegram_user_id);

        await sendMessage(
          channel,
          [
            `🏆 <b>${escapeHtml(COPY[channelLanguage].giveawayEnded)}</b>`,
            "",
            `${COPY[channelLanguage].winner}: <a href="tg://user?id=${Number(winner.telegram_user_id)}">${escapeHtml(winnerName)}</a>`,
            `${COPY[channelLanguage].prize}: <b>${escapeHtml(finished.prize)}</b>`,
            `${COPY[channelLanguage].participants}: <b>${participantCount}</b>`,
          ].join("\n"),
        );
      } else {
        await sendMessage(
          channel,
          [
            `🎁 <b>${escapeHtml(COPY[channelLanguage].giveawayEnded)}</b>`,
            "",
            escapeHtml(COPY[channelLanguage].noWinner),
          ].join("\n"),
        );
      }

      await audit(
        actorId || Number(ownerId),
        "giveaway_finished",
        {
          giveawayId,
          participantCount,
          winnerTelegramUserId: winner?.telegram_user_id || null,
          automatic: !actorId,
        },
      );

      console.log("telegram_giveaway_finished", {
        giveawayId,
        participantCount,
        winnerTelegramUserId: winner?.telegram_user_id || null,
        automatic: !actorId,
      });

      return finished;
    } catch (error) {
      await supabase
        .from("telegram_giveaways")
        .update({
          status: "active",
          last_error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", giveawayId)
        .eq("status", "drawing");

      throw error;
    }
  }

  async function sweepGiveaways() {
    if (sweepRunning) return;
    sweepRunning = true;

    try {
      const { data, error } = await supabase
        .from("telegram_giveaways")
        .select("id")
        .eq("status", "active")
        .lte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true })
        .limit(20);

      if (error) throw error;

      for (const giveaway of data || []) {
        try {
          await finalizeGiveaway(giveaway.id, null);
        } catch (error) {
          console.error("telegram_giveaway_auto_finish_failed", {
            giveawayId: giveaway.id,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      sweepRunning = false;
    }
  }

  function scheduleSweep() {
    clearTimeout(sweepTimer);

    sweepTimer = setTimeout(async () => {
      try {
        await sweepGiveaways();
      } catch (error) {
        console.error("telegram_giveaway_sweep_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        scheduleSweep();
      }
    }, sweepSeconds * 1000);

    sweepTimer.unref?.();
  }

  async function listGiveaways(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    const { data, error } = await supabase
      .from("telegram_giveaways")
      .select("id, title, prize, ends_at, status")
      .eq("status", "active")
      .order("ends_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, copy.noGiveaways);
      return;
    }

    const lines = [`🎁 <b>${copy.giveawayTitle}</b>`, ""];

    for (const item of data) {
      lines.push(
        `<b>#${item.id} · ${escapeHtml(item.title)}</b>`,
        `${copy.prize}: ${escapeHtml(item.prize)}`,
        `${copy.ends}: ${escapeHtml(formatDate(item.ends_at, lang))}`,
        "",
      );
    }

    await sendMessage(message.chat.id, lines.join("\n").trim());
  }

  async function giveawayStatus(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const [active, finished, participants] = await Promise.all([
      supabase
        .from("telegram_giveaways")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("telegram_giveaways")
        .select("*", { count: "exact", head: true })
        .eq("status", "finished"),
      supabase
        .from("telegram_giveaway_participants")
        .select("*", { count: "exact", head: true }),
    ]);

    for (const result of [active, finished, participants]) {
      if (result.error) throw result.error;
    }

    await sendMessage(
      message.chat.id,
      [
        `🎁 <b>${copy.giveawayStatusTitle}</b>`,
        "",
        `${copy.activeCount}: <b>${active.count || 0}</b>`,
        `${copy.finishedCount}: <b>${finished.count || 0}</b>`,
        `${copy.participantCount}: <b>${participants.count || 0}</b>`,
        `Sweep: <code>${sweepSeconds}s</code>`,
      ].join("\n"),
    );
  }

  async function endGiveaway(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const parts = cleanText(message.text).split(/\s+/);
    const giveawayId = Number(parts[1]);

    if (!Number.isSafeInteger(giveawayId) || giveawayId <= 0) {
      await sendMessage(
        message.chat.id,
        `<code>/endgiveaway ID</code>`,
      );
      return;
    }

    const finished = await finalizeGiveaway(
      giveawayId,
      message.from.id,
    );

    if (!finished) {
      await sendMessage(message.chat.id, copy.giveawayNotFound);
      return;
    }

    await sendMessage(
      message.chat.id,
      `✅ ${copy.giveawayEnded} #${giveawayId}`,
    );
  }

  async function startPoll(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    if (await hasAnyDraft(message.from.id)) {
      await sendMessage(message.chat.id, copy.draftExists);
      return;
    }

    await savePollDraft(
      message.from.id,
      "question",
      {},
      lang,
    );

    await sendMessage(
      message.chat.id,
      `📊 <b>${copy.pollTitle}</b>\n\n${copy.pollQuestionPrompt}`,
    );
  }

  async function cancelPollDraft(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];
    const draft = await getPollDraft(message.from.id);

    if (!draft) {
      await sendMessage(message.chat.id, copy.draftMissing);
      return;
    }

    await deletePollDraft(message.from.id);
    await sendMessage(message.chat.id, copy.draftCancelled);
  }

  async function processPollDraft(message, user, draft) {
    const lang = localeKey(draft.language || user.language);
    const copy = COPY[lang];
    const data = { ...(draft.data || {}) };

    if (draft.step === "question") {
      const question = cleanText(message.text);

      if (question.length < 3 || question.length > 250) {
        await sendMessage(message.chat.id, copy.pollQuestionPrompt);
        return true;
      }

      data.question = question;

      await savePollDraft(
        message.from.id,
        "options",
        data,
        lang,
      );

      await sendMessage(message.chat.id, copy.pollOptionsPrompt);
      return true;
    }

    if (draft.step === "options") {
      const options = pollOptionsFromText(message.text);

      if (
        options.length < 2 ||
        options.length > 10 ||
        options.some((item) => item.length > 100)
      ) {
        await sendMessage(message.chat.id, copy.pollBadOptions);
        return true;
      }

      data.options = options;

      await savePollDraft(
        message.from.id,
        "mode",
        data,
        lang,
      );

      await sendMessage(
        message.chat.id,
        [
          `📊 <b>${escapeHtml(data.question)}</b>`,
          "",
          ...options.map((option, index) =>
            `${index + 1}. ${escapeHtml(option)}`,
          ),
          "",
          copy.pollModePrompt,
        ].join("\n"),
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: `🔒 ${copy.anonymous}`,
                callback_data: "poll:create:anonymous",
              },
              {
                text: `👤 ${copy.publicPoll}`,
                callback_data: "poll:create:public",
              },
            ], [
              {
                text: copy.cancel,
                callback_data: "poll:create:cancel",
              },
            ]],
          },
        },
      );

      return true;
    }

    if (draft.step === "mode") {
      await sendMessage(message.chat.id, copy.pollModePrompt, {
        reply_markup: {
          inline_keyboard: [[
            {
              text: `🔒 ${copy.anonymous}`,
              callback_data: "poll:create:anonymous",
            },
            {
              text: `👤 ${copy.publicPoll}`,
              callback_data: "poll:create:public",
            },
          ], [
            {
              text: copy.cancel,
              callback_data: "poll:create:cancel",
            },
          ]],
        },
      });

      return true;
    }

    return false;
  }

  async function publishPoll(mode, query, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await answerCallback(query.id, copy.noAccess);
      return;
    }

    const draft = await getPollDraft(query.from.id);

    if (!draft || draft.step !== "mode") {
      await answerCallback(query.id, copy.draftMissing);
      return;
    }

    const question = cleanText(draft.data?.question);
    const options = Array.isArray(draft.data?.options)
      ? draft.data.options.map(cleanText).filter(Boolean)
      : [];

    if (!question || options.length < 2) {
      await answerCallback(query.id, copy.draftMissing);
      return;
    }

    const isAnonymous = mode === "anonymous";

    const pollMessage = await telegram("sendPoll", {
      chat_id: channel,
      question,
      options,
      is_anonymous: isAnonymous,
      allows_multiple_answers: false,
    });

    const { error } = await supabase
      .from("telegram_polls")
      .insert({
        telegram_poll_id: String(pollMessage.poll.id),
        telegram_chat_id: String(pollMessage.chat.id),
        telegram_message_id: Number(pollMessage.message_id),
        question,
        options,
        is_anonymous: isAnonymous,
        status: "open",
        created_by: Number(query.from.id),
      });

    if (error) {
      // The poll is already public. Do not retry automatically and duplicate it.
      console.error("telegram_poll_db_ack_failed", {
        pollId: pollMessage.poll.id,
        message: error.message || String(error),
      });
      throw error;
    }

    await deletePollDraft(query.from.id);
    await answerCallback(query.id, copy.pollPublished);

    try {
      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: `✅ <b>${escapeHtml(copy.pollPublished)}</b>`,
        parse_mode: "HTML",
      });
    } catch {
      // The preview may no longer be editable.
    }

    await audit(query.from.id, "poll_published", {
      telegramPollId: pollMessage.poll.id,
      anonymous: isAnonymous,
    });

    console.log("telegram_poll_published", {
      telegramPollId: pollMessage.poll.id,
      anonymous: isAnonymous,
    });
  }

  async function listPolls(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_polls")
      .select("id, question, status, is_anonymous, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, copy.noPolls);
      return;
    }

    const lines = [`📊 <b>${copy.pollsTitle}</b>`, ""];

    for (const poll of data) {
      lines.push(
        `<b>#${poll.id}</b> · ${escapeHtml(poll.question)}`,
        `${poll.status === "open" ? "🟢 OPEN" : "⚫ CLOSED"} · ${poll.is_anonymous ? copy.anonymous : copy.publicPoll}`,
        poll.status === "open"
          ? `<code>/closepoll ${poll.id}</code>`
          : "",
        "",
      );
    }

    await sendMessage(
      message.chat.id,
      lines.filter(Boolean).join("\n").trim(),
    );
  }

  async function closePoll(message, user) {
    const lang = localeKey(user.language);
    const copy = COPY[lang];

    if (!hasRole(user, "editor")) {
      await sendMessage(message.chat.id, copy.noAccess);
      return;
    }

    const parts = cleanText(message.text).split(/\s+/);
    const pollId = Number(parts[1]);

    if (!Number.isSafeInteger(pollId) || pollId <= 0) {
      await sendMessage(message.chat.id, `<code>/closepoll ID</code>`);
      return;
    }

    const { data: poll, error } = await supabase
      .from("telegram_polls")
      .select("*")
      .eq("id", pollId)
      .eq("status", "open")
      .maybeSingle();

    if (error) throw error;

    if (!poll) {
      await sendMessage(message.chat.id, copy.pollNotFound);
      return;
    }

    await telegram("stopPoll", {
      chat_id: poll.telegram_chat_id,
      message_id: poll.telegram_message_id,
    });

    const { error: updateError } = await supabase
      .from("telegram_polls")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pollId)
      .eq("status", "open");

    if (updateError) throw updateError;

    await audit(message.from.id, "poll_closed", {
      pollId,
      telegramPollId: poll.telegram_poll_id,
    });

    await sendMessage(message.chat.id, `✅ ${copy.pollClosed} #${pollId}`);
  }

  async function handleMessage(message, user) {
    if (
      !message?.text ||
      message?.chat?.type !== "private"
    ) {
      return false;
    }

    const command = normalizeCommand(message.text);

    if (command === "/giveaway") {
      await startGiveaway(message, user);
      return true;
    }

    if (command === "/giveawaycancel") {
      await cancelGiveawayDraft(message, user);
      return true;
    }

    if (command === "/giveaways") {
      await listGiveaways(message, user);
      return true;
    }

    if (command === "/giveawaystatus") {
      await giveawayStatus(message, user);
      return true;
    }

    if (command === "/endgiveaway") {
      await endGiveaway(message, user);
      return true;
    }

    if (command === "/poll") {
      await startPoll(message, user);
      return true;
    }

    if (command === "/pollcancel") {
      await cancelPollDraft(message, user);
      return true;
    }

    if (command === "/polls") {
      await listPolls(message, user);
      return true;
    }

    if (command === "/closepoll") {
      await closePoll(message, user);
      return true;
    }

    const giveawayDraft = await getGiveawayDraft(message.from.id);
    if (giveawayDraft) {
      await processGiveawayDraft(message, user, giveawayDraft);
      return true;
    }

    const pollDraft = await getPollDraft(message.from.id);
    if (pollDraft) {
      await processPollDraft(message, user, pollDraft);
      return true;
    }

    return false;
  }

  async function handleCallback(data, query, user) {
    if (data.startsWith("gw:join:")) {
      await joinGiveaway(data, query, user);
      return true;
    }

    if (data === "gw:create:publish") {
      await publishGiveaway(query, user);
      return true;
    }

    if (data === "gw:create:cancel") {
      const lang = localeKey(user.language);
      await deleteGiveawayDraft(query.from.id);
      await answerCallback(query.id, COPY[lang].draftCancelled);
      return true;
    }

    if (data === "poll:create:anonymous") {
      await publishPoll("anonymous", query, user);
      return true;
    }

    if (data === "poll:create:public") {
      await publishPoll("public", query, user);
      return true;
    }

    if (data === "poll:create:cancel") {
      const lang = localeKey(user.language);
      await deletePollDraft(query.from.id);
      await answerCallback(query.id, COPY[lang].draftCancelled);
      return true;
    }

    if (data === "admin:giveaway:new") {
      if (!hasRole(user, "editor")) {
        await answerCallback(query.id, COPY[localeKey(user.language)].noAccess);
        return true;
      }

      await answerCallback(query.id);
      await startGiveaway(
        { chat: query.message.chat, from: query.from, text: "/giveaway" },
        user,
      );
      return true;
    }

    if (data === "admin:giveaway:list") {
      await answerCallback(query.id);
      await listGiveaways(
        { chat: query.message.chat, from: query.from, text: "/giveaways" },
        user,
      );
      return true;
    }

    if (data === "admin:poll:new") {
      if (!hasRole(user, "editor")) {
        await answerCallback(query.id, COPY[localeKey(user.language)].noAccess);
        return true;
      }

      await answerCallback(query.id);
      await startPoll(
        { chat: query.message.chat, from: query.from, text: "/poll" },
        user,
      );
      return true;
    }

    if (data === "admin:poll:list") {
      await answerCallback(query.id);
      await listPolls(
        { chat: query.message.chat, from: query.from, text: "/polls" },
        user,
      );
      return true;
    }

    return false;
  }

  function adminRows(lang) {
    const copy = COPY[localeKey(lang)];

    return [
      [
        {
          text: copy.newGiveaway,
          callback_data: "admin:giveaway:new",
        },
        {
          text: copy.listGiveaways,
          callback_data: "admin:giveaway:list",
        },
      ],
      [
        {
          text: copy.newPoll,
          callback_data: "admin:poll:new",
        },
        {
          text: copy.listPolls,
          callback_data: "admin:poll:list",
        },
      ],
    ];
  }

  async function initialize() {
    try {
      const checks = await Promise.all([
        supabase
          .from("telegram_giveaways")
          .select("id")
          .limit(1),
        supabase
          .from("telegram_giveaway_drafts")
          .select("telegram_user_id")
          .limit(1),
        supabase
          .from("telegram_giveaway_participants")
          .select("id")
          .limit(1),
        supabase
          .from("telegram_polls")
          .select("id")
          .limit(1),
        supabase
          .from("telegram_poll_drafts")
          .select("telegram_user_id")
          .limit(1),
      ]);

      for (const check of checks) {
        if (check.error) throw check.error;
      }

      await sweepGiveaways();
      scheduleSweep();

      console.log("telegram_engagement_ready", {
        channel,
        giveawaySweepSeconds: sweepSeconds,
      });

      return true;
    } catch (error) {
      console.error("telegram_engagement_init_failed", {
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
    handleCallback,
    adminRows,
    config: {
      sweepSeconds,
      channelLanguage,
    },
  };
}
