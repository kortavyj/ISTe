const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const TYPES = Object.freeze({
  recruitment: "recruitment",
  support: "support",
  partnership: "partnership",
});

const COPY = {
  uk: {
    noAccess: "Ця дія недоступна для вашої ролі.",
    genericError: "Не вдалося виконати дію. Спробуйте ще раз пізніше.",
    activeDraft:
      "У вас уже є незавершена заявка. Продовжіть її або використайте /cancel.",
    cancelled: "Чернетку заявки скасовано.",
    nothingToCancel: "Активної чернетки немає.",
    saved: "Заявку збережено",
    savedText:
      "Адміністрація ISTesport отримала звернення. Статус можна перевірити командою /myrequests.",
    noRequests: "У вас поки немає заявок.",
    myRequests: "Мої заявки",
    openRequests: "Активні заявки",
    noOpenRequests: "Нових або активних заявок немає.",
    request: "Заявка",
    user: "Користувач",
    created: "Створено",
    type: "Тип",
    status: "Статус",
    details: "Дані",
    statusChanged: "Статус вашої заявки змінено",
    adminPanel: "Заявки",
    recruitment: "Вступ до команди",
    support: "Підтримка",
    partnership: "Партнерство",
    new: "нова",
    in_progress: "в роботі",
    approved: "схвалено",
    rejected: "відхилено",
    closed: "закрито",
    invalidFaceit: "Надішліть повне посилання на профіль FACEIT.",
    tooShort: "Відповідь занадто коротка. Напишіть трохи детальніше.",
    tooLong: "Повідомлення занадто довге. Максимум 1500 символів.",
    draftExpired: "Попередня чернетка застаріла. Почніть заявку ще раз.",
    commands:
      "Доступно: /apply, /support, /partner, /myrequests, /cancel",
    prompts: {
      recruitment: [
        "Вкажіть ваш ігровий нікнейм.",
        "Надішліть посилання на ваш профіль FACEIT.",
        "Вкажіть вашу основну роль у CS2.",
        "Скільки часу на тиждень ви готові приділяти тренуванням і матчам?",
        "Коротко опишіть досвід, сильні сторони та чому хочете приєднатися до ISTesport.",
      ],
      support: [
        "Коротко вкажіть тему звернення.",
        "Опишіть проблему або питання якомога детальніше.",
      ],
      partnership: [
        "Вкажіть назву компанії, бренду або ваше ім'я.",
        "Залиште контакт для зв'язку: Telegram, email або інший зручний спосіб.",
        "Оберіть формат: FREE PARTNER, ESEA PARTNER, MAIN PARTNER або запропонуйте власні умови.",
        "Опишіть вашу пропозицію та очікування від співпраці.",
      ],
    },
    labels: {
      nickname: "Нікнейм",
      faceit: "FACEIT",
      role: "Роль",
      availability: "Доступність",
      experience: "Досвід",
      subject: "Тема",
      message: "Повідомлення",
      organization: "Компанія / ім'я",
      contact: "Контакт",
      format: "Формат",
      proposal: "Пропозиція",
    },
    actions: {
      in_progress: "🛠 В роботу",
      approved: "✅ Схвалити",
      rejected: "❌ Відхилити",
      closed: "🔒 Закрити",
    },
  },
  ru: {
    noAccess: "Это действие недоступно для вашей роли.",
    genericError: "Не удалось выполнить действие. Попробуйте ещё раз позже.",
    activeDraft:
      "У вас уже есть незавершённая заявка. Продолжите её или используйте /cancel.",
    cancelled: "Черновик заявки отменён.",
    nothingToCancel: "Активного черновика нет.",
    saved: "Заявка сохранена",
    savedText:
      "Администрация ISTesport получила обращение. Статус можно проверить командой /myrequests.",
    noRequests: "У вас пока нет заявок.",
    myRequests: "Мои заявки",
    openRequests: "Активные заявки",
    noOpenRequests: "Новых или активных заявок нет.",
    request: "Заявка",
    user: "Пользователь",
    created: "Создано",
    type: "Тип",
    status: "Статус",
    details: "Данные",
    statusChanged: "Статус вашей заявки изменён",
    adminPanel: "Заявки",
    recruitment: "Вступление в команду",
    support: "Поддержка",
    partnership: "Партнёрство",
    new: "новая",
    in_progress: "в работе",
    approved: "одобрено",
    rejected: "отклонено",
    closed: "закрыто",
    invalidFaceit: "Отправьте полную ссылку на профиль FACEIT.",
    tooShort: "Ответ слишком короткий. Напишите немного подробнее.",
    tooLong: "Сообщение слишком длинное. Максимум 1500 символов.",
    draftExpired: "Предыдущий черновик устарел. Начните заявку заново.",
    commands:
      "Доступно: /apply, /support, /partner, /myrequests, /cancel",
    prompts: {
      recruitment: [
        "Укажите ваш игровой никнейм.",
        "Отправьте ссылку на ваш профиль FACEIT.",
        "Укажите вашу основную роль в CS2.",
        "Сколько времени в неделю вы готовы уделять тренировкам и матчам?",
        "Коротко опишите опыт, сильные стороны и почему хотите присоединиться к ISTesport.",
      ],
      support: [
        "Коротко укажите тему обращения.",
        "Опишите проблему или вопрос максимально подробно.",
      ],
      partnership: [
        "Укажите название компании, бренда или ваше имя.",
        "Оставьте контакт для связи: Telegram, email или другой удобный способ.",
        "Выберите формат: FREE PARTNER, ESEA PARTNER, MAIN PARTNER или предложите свои условия.",
        "Опишите ваше предложение и ожидания от сотрудничества.",
      ],
    },
    labels: {
      nickname: "Никнейм",
      faceit: "FACEIT",
      role: "Роль",
      availability: "Доступность",
      experience: "Опыт",
      subject: "Тема",
      message: "Сообщение",
      organization: "Компания / имя",
      contact: "Контакт",
      format: "Формат",
      proposal: "Предложение",
    },
    actions: {
      in_progress: "🛠 В работу",
      approved: "✅ Одобрить",
      rejected: "❌ Отклонить",
      closed: "🔒 Закрыть",
    },
  },
  en: {
    noAccess: "This action is not available for your role.",
    genericError: "The action could not be completed. Please try again later.",
    activeDraft:
      "You already have an unfinished request. Continue it or use /cancel.",
    cancelled: "Request draft cancelled.",
    nothingToCancel: "There is no active draft.",
    saved: "Request saved",
    savedText:
      "ISTesport administration received your request. Use /myrequests to check its status.",
    noRequests: "You do not have any requests yet.",
    myRequests: "My requests",
    openRequests: "Active requests",
    noOpenRequests: "There are no new or active requests.",
    request: "Request",
    user: "User",
    created: "Created",
    type: "Type",
    status: "Status",
    details: "Details",
    statusChanged: "Your request status changed",
    adminPanel: "Requests",
    recruitment: "Team application",
    support: "Support",
    partnership: "Partnership",
    new: "new",
    in_progress: "in progress",
    approved: "approved",
    rejected: "rejected",
    closed: "closed",
    invalidFaceit: "Send a full FACEIT profile URL.",
    tooShort: "The answer is too short. Please add a little more detail.",
    tooLong: "The message is too long. Maximum 1500 characters.",
    draftExpired: "The previous draft expired. Start the request again.",
    commands:
      "Available: /apply, /support, /partner, /myrequests, /cancel",
    prompts: {
      recruitment: [
        "Enter your in-game nickname.",
        "Send your FACEIT profile URL.",
        "Enter your main CS2 role.",
        "How much time per week can you dedicate to practice and matches?",
        "Briefly describe your experience, strengths, and why you want to join ISTesport.",
      ],
      support: [
        "Enter a short subject for your request.",
        "Describe the issue or question in as much detail as possible.",
      ],
      partnership: [
        "Enter your company, brand, or personal name.",
        "Provide a contact method: Telegram, email, or another convenient option.",
        "Choose a format: FREE PARTNER, ESEA PARTNER, MAIN PARTNER, or propose your own terms.",
        "Describe your proposal and expectations for the partnership.",
      ],
    },
    labels: {
      nickname: "Nickname",
      faceit: "FACEIT",
      role: "Role",
      availability: "Availability",
      experience: "Experience",
      subject: "Subject",
      message: "Message",
      organization: "Company / name",
      contact: "Contact",
      format: "Format",
      proposal: "Proposal",
    },
    actions: {
      in_progress: "🛠 In progress",
      approved: "✅ Approve",
      rejected: "❌ Reject",
      closed: "🔒 Close",
    },
  },
};

const FORMS = {
  recruitment: ["nickname", "faceit", "role", "availability", "experience"],
  support: ["subject", "message"],
  partnership: ["organization", "contact", "format", "proposal"],
};

const ALLOWED_TRANSITIONS = {
  new: new Set(["in_progress", "approved", "rejected", "closed"]),
  in_progress: new Set(["approved", "rejected", "closed"]),
  approved: new Set(["closed"]),
  rejected: new Set(["closed"]),
  closed: new Set(),
};

function localeKey(value) {
  const lang = String(value || "").toLowerCase();
  return ["uk", "ru", "en"].includes(lang) ? lang : "uk";
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clip(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function displayName(from) {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim()
    || from?.username
    || String(from?.id || "");
}

function typeLabel(type, lang) {
  return COPY[lang][type] || type;
}

function statusLabel(status, lang) {
  return COPY[lang][status] || status;
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

function normalizeCommand(text) {
  return cleanText(text).split(/\s+/)[0].split("@")[0].toLowerCase();
}

function formTypeFromCommand(command) {
  if (command === "/apply") return TYPES.recruitment;
  if (command === "/support") return TYPES.support;
  if (command === "/partner") return TYPES.partnership;
  return null;
}

function validateAnswer(type, key, value, lang) {
  const copy = COPY[lang];
  const text = cleanText(value);

  if (text.length > 1500) {
    return { ok: false, message: copy.tooLong };
  }

  if (text.length < 2) {
    return { ok: false, message: copy.tooShort };
  }

  if (type === TYPES.recruitment && key === "faceit") {
    try {
      const url = new URL(text);
      if (!url.hostname.toLowerCase().endsWith("faceit.com")) {
        return { ok: false, message: copy.invalidFaceit };
      }
    } catch {
      return { ok: false, message: copy.invalidFaceit };
    }
  }

  return { ok: true, value: text };
}

function requestButtons(id, lang, status) {
  const actions = COPY[lang].actions;
  const buttons = [];

  for (const nextStatus of ["in_progress", "approved", "rejected", "closed"]) {
    if (!ALLOWED_TRANSITIONS[status]?.has(nextStatus)) continue;
    buttons.push({
      text: actions[nextStatus],
      callback_data: `request:${id}:${nextStatus}`,
    });
  }

  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  return { inline_keyboard: rows };
}

function requestPayloadLines(request, lang) {
  const payload = request?.payload && typeof request.payload === "object"
    ? request.payload
    : {};

  const labels = COPY[lang].labels;
  const lines = [];

  for (const key of FORMS[request.type] || Object.keys(payload)) {
    const value = cleanText(payload[key]);
    if (!value) continue;
    lines.push(`<b>${escapeHtml(labels[key] || key)}:</b> ${escapeHtml(clip(value, 800))}`);
  }

  return lines;
}

function requestCard(request, lang) {
  const copy = COPY[lang];
  const username = request.username ? `@${request.username}` : "—";

  return [
    `📥 <b>${copy.request} #${request.id}</b>`,
    "",
    `<b>${copy.type}:</b> ${escapeHtml(typeLabel(request.type, lang))}`,
    `<b>${copy.status}:</b> ${escapeHtml(statusLabel(request.status, lang))}`,
    `<b>${copy.user}:</b> ${escapeHtml(request.display_name || String(request.telegram_user_id))}`,
    `<b>Telegram:</b> ${escapeHtml(username)}`,
    `<b>${copy.created}:</b> ${escapeHtml(formatDate(request.created_at, lang))}`,
    "",
    `<b>${copy.details}:</b>`,
    ...requestPayloadLines(request, lang),
  ].join("\n");
}

export function createRequestAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  ownerId,
  hasRole,
}) {
  const adminChat = String(
    process.env.TELEGRAM_ADMIN_CHAT || ownerId,
  ).trim();

  async function getDraft(userId) {
    const { data, error } = await supabase
      .from("telegram_request_drafts")
      .select("telegram_user_id, request_type, step, answers, language, created_at, updated_at, expires_at")
      .eq("telegram_user_id", Number(userId))
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (new Date(data.expires_at).getTime() <= Date.now()) {
      await supabase
        .from("telegram_request_drafts")
        .delete()
        .eq("telegram_user_id", Number(userId));
      return { expired: true };
    }

    return data;
  }

  async function deleteDraft(userId) {
    const { error } = await supabase
      .from("telegram_request_drafts")
      .delete()
      .eq("telegram_user_id", Number(userId));
    if (error) throw error;
  }

  async function saveDraft(userId, requestType, step, answers, language) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DRAFT_TTL_MS).toISOString();

    const { error } = await supabase
      .from("telegram_request_drafts")
      .upsert({
        telegram_user_id: Number(userId),
        request_type: requestType,
        step,
        answers,
        language,
        expires_at: expiresAt,
        updated_at: now.toISOString(),
      }, { onConflict: "telegram_user_id" });

    if (error) throw error;
  }

  async function promptStep(chatId, type, step, lang) {
    const prompt = COPY[lang].prompts[type]?.[step];
    if (!prompt) return;

    await sendMessage(
      chatId,
      [
        `📝 <b>${escapeHtml(typeLabel(type, lang))}</b>`,
        "",
        escapeHtml(prompt),
        "",
        `<i>/cancel</i>`,
      ].join("\n"),
    );
  }

  async function startDraft(message, user, type) {
    const lang = localeKey(user.language);
    const existing = await getDraft(message.from.id);

    if (existing?.expired) {
      await sendMessage(message.chat.id, COPY[lang].draftExpired);
    } else if (existing) {
      await sendMessage(message.chat.id, COPY[lang].activeDraft);
      return;
    }

    await saveDraft(message.from.id, type, 0, {}, lang);
    await promptStep(message.chat.id, type, 0, lang);

    await audit(message.from.id, "request_draft_started", { type });
  }

  async function createRequest(message, user, draft, answers) {
    const lang = localeKey(draft.language || user.language);

    const row = {
      type: draft.request_type,
      status: "new",
      telegram_user_id: Number(message.from.id),
      username: message.from.username || null,
      display_name: displayName(message.from),
      language: lang,
      payload: answers,
      updated_at: new Date().toISOString(),
    };

    const { data: request, error } = await supabase
      .from("telegram_requests")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;

    const { error: eventError } = await supabase
      .from("telegram_request_events")
      .insert({
        request_id: request.id,
        actor_telegram_user_id: Number(message.from.id),
        action: "created",
        from_status: null,
        to_status: "new",
      });

    if (eventError) throw eventError;

    await deleteDraft(message.from.id);

    await sendMessage(
      message.chat.id,
      [
        `✅ <b>${COPY[lang].saved} #${request.id}</b>`,
        "",
        escapeHtml(COPY[lang].savedText),
      ].join("\n"),
    );

    await audit(message.from.id, "request_created", {
      requestId: request.id,
      type: request.type,
    });

    await notifyAdmin(request);
  }

  async function notifyAdmin(request) {
    const lang = "uk";

    try {
      await sendMessage(adminChat, requestCard(request, lang), {
        reply_markup: requestButtons(request.id, lang, request.status),
      });
    } catch (error) {
      console.error("telegram_request_admin_notify_failed", {
        requestId: request.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function handleDraftText(message, user, draft) {
    const lang = localeKey(draft.language || user.language);
    const fields = FORMS[draft.request_type] || [];
    const step = Number(draft.step || 0);
    const key = fields[step];

    if (!key) {
      await deleteDraft(message.from.id);
      await sendMessage(message.chat.id, COPY[lang].genericError);
      return true;
    }

    const validation = validateAnswer(
      draft.request_type,
      key,
      message.text,
      lang,
    );

    if (!validation.ok) {
      await sendMessage(message.chat.id, validation.message);
      await promptStep(message.chat.id, draft.request_type, step, lang);
      return true;
    }

    const answers = {
      ...(draft.answers && typeof draft.answers === "object" ? draft.answers : {}),
      [key]: validation.value,
    };

    const nextStep = step + 1;

    if (nextStep >= fields.length) {
      await createRequest(message, user, draft, answers);
      return true;
    }

    await saveDraft(
      message.from.id,
      draft.request_type,
      nextStep,
      answers,
      lang,
    );

    await promptStep(message.chat.id, draft.request_type, nextStep, lang);
    return true;
  }

  async function cancelCommand(message, user) {
    const lang = localeKey(user.language);
    const draft = await getDraft(message.from.id);

    if (!draft || draft.expired) {
      await sendMessage(message.chat.id, COPY[lang].nothingToCancel);
      return;
    }

    await deleteDraft(message.from.id);
    await sendMessage(message.chat.id, COPY[lang].cancelled);
    await audit(message.from.id, "request_draft_cancelled", {
      type: draft.request_type,
    });
  }

  async function myRequestsCommand(message, user) {
    const lang = localeKey(user.language);

    const { data, error } = await supabase
      .from("telegram_requests")
      .select("id, type, status, created_at")
      .eq("telegram_user_id", Number(message.from.id))
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, COPY[lang].noRequests);
      return;
    }

    const lines = [`📥 <b>${COPY[lang].myRequests}</b>`, ""];

    for (const request of data) {
      lines.push(
        `#${request.id} · <b>${escapeHtml(typeLabel(request.type, lang))}</b> · ${escapeHtml(statusLabel(request.status, lang))}`,
        `   ${escapeHtml(formatDate(request.created_at, lang))}`,
      );
    }

    await sendMessage(message.chat.id, lines.join("\n"));
  }

  async function listRequestsCommand(message, user) {
    const lang = localeKey(user.language);

    if (!hasRole(user, "moderator")) {
      await sendMessage(message.chat.id, COPY[lang].noAccess);
      return;
    }

    const { data, error } = await supabase
      .from("telegram_requests")
      .select("id, type, status, display_name, username, created_at")
      .in("status", ["new", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data?.length) {
      await sendMessage(message.chat.id, COPY[lang].noOpenRequests);
      return;
    }

    const lines = [`📥 <b>${COPY[lang].openRequests}</b>`, ""];

    for (const request of data) {
      lines.push(
        `#${request.id} · <b>${escapeHtml(typeLabel(request.type, lang))}</b> · ${escapeHtml(statusLabel(request.status, lang))}`,
        `   ${escapeHtml(request.display_name || request.username || "Telegram user")}`,
      );
    }

    lines.push("", "<code>/request ID</code>");
    await sendMessage(message.chat.id, lines.join("\n"));
  }

  async function fetchRequest(id) {
    const { data, error } = await supabase
      .from("telegram_requests")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function requestDetailsCommand(message, user) {
    const lang = localeKey(user.language);

    if (!hasRole(user, "moderator")) {
      await sendMessage(message.chat.id, COPY[lang].noAccess);
      return;
    }

    const parts = cleanText(message.text).split(/\s+/);
    const id = Number(parts[1]);

    if (!Number.isSafeInteger(id)) {
      await sendMessage(message.chat.id, "<code>/request ID</code>");
      return;
    }

    const request = await fetchRequest(id);

    if (!request) {
      await sendMessage(message.chat.id, `Request #${id} not found.`);
      return;
    }

    await sendMessage(
      message.chat.id,
      requestCard(request, lang),
      { reply_markup: requestButtons(request.id, lang, request.status) },
    );
  }

  async function notifyUserStatus(request, status) {
    const lang = localeKey(request.language);

    try {
      await sendMessage(
        Number(request.telegram_user_id),
        [
          `📥 <b>${COPY[lang].statusChanged}</b>`,
          "",
          `${COPY[lang].request} #${request.id}`,
          `${COPY[lang].status}: <b>${escapeHtml(statusLabel(status, lang))}</b>`,
        ].join("\n"),
      );
    } catch (error) {
      console.error("telegram_request_user_notify_failed", {
        requestId: request.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function updateStatus(query, user, requestId, nextStatus) {
    const lang = localeKey(user.language);

    if (!hasRole(user, "moderator")) {
      await answerCallback(query.id, COPY[lang].noAccess);
      return;
    }

    const request = await fetchRequest(requestId);

    if (!request) {
      await answerCallback(query.id, "Request not found");
      return;
    }

    if (!ALLOWED_TRANSITIONS[request.status]?.has(nextStatus)) {
      await answerCallback(query.id, "Status transition is not available");
      return;
    }

    const now = new Date().toISOString();
    const update = {
      status: nextStatus,
      updated_at: now,
      assigned_to:
        nextStatus === "in_progress"
          ? Number(query.from.id)
          : request.assigned_to,
      closed_at: nextStatus === "closed" ? now : request.closed_at,
    };

    const { data: updated, error } = await supabase
      .from("telegram_requests")
      .update(update)
      .eq("id", request.id)
      .eq("status", request.status)
      .select("*")
      .single();

    if (error) throw error;

    const { error: eventError } = await supabase
      .from("telegram_request_events")
      .insert({
        request_id: request.id,
        actor_telegram_user_id: Number(query.from.id),
        action: "status_changed",
        from_status: request.status,
        to_status: nextStatus,
      });

    if (eventError) throw eventError;

    await audit(query.from.id, "request_status_changed", {
      requestId: request.id,
      from: request.status,
      to: nextStatus,
    });

    await answerCallback(query.id, statusLabel(nextStatus, lang));
    await notifyUserStatus(updated, nextStatus);

    if (query.message?.chat?.id && query.message?.message_id) {
      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: requestCard(updated, lang),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: requestButtons(updated.id, lang, updated.status),
      }).catch((editError) => {
        console.error("telegram_request_admin_card_edit_failed", {
          requestId: request.id,
          message: editError instanceof Error ? editError.message : String(editError),
        });
      });
    }
  }

  async function handleMessage(message, user) {
    const text = cleanText(message.text);
    if (!text) return false;

    const command = normalizeCommand(text);
    const lang = localeKey(user.language);

    try {
      const type = formTypeFromCommand(command);
      if (type) {
        await startDraft(message, user, type);
        return true;
      }

      if (command === "/cancel") {
        await cancelCommand(message, user);
        return true;
      }

      if (command === "/myrequests") {
        await myRequestsCommand(message, user);
        return true;
      }

      if (command === "/requests") {
        await listRequestsCommand(message, user);
        return true;
      }

      if (command === "/request") {
        await requestDetailsCommand(message, user);
        return true;
      }

      if (text.startsWith("/")) return false;

      const draft = await getDraft(message.from.id);
      if (!draft) return false;

      if (draft.expired) {
        await sendMessage(message.chat.id, COPY[lang].draftExpired);
        return true;
      }

      return handleDraftText(message, user, draft);
    } catch (error) {
      console.error("telegram_request_message_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      await sendMessage(message.chat.id, COPY[lang].genericError).catch(() => {});
      return true;
    }
  }

  async function handleCallback(data, query, user) {
    const lang = localeKey(user.language);

    try {
      if (data === "requests:list") {
        if (!hasRole(user, "moderator")) {
          await answerCallback(query.id, COPY[lang].noAccess);
          return true;
        }

        await answerCallback(query.id);
        await listRequestsCommand(
          { chat: query.message.chat, from: query.from, text: "/requests" },
          user,
        );
        return true;
      }

      const match = /^request:(\d+):(in_progress|approved|rejected|closed)$/.exec(data);
      if (!match) return false;

      await updateStatus(query, user, Number(match[1]), match[2]);
      return true;
    } catch (error) {
      console.error("telegram_request_callback_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      await answerCallback(query.id, COPY[lang].genericError).catch(() => {});
      return true;
    }
  }

  function adminRows(lang) {
    const key = localeKey(lang);
    return [[{
      text: `📥 ${COPY[key].adminPanel}`,
      callback_data: "requests:list",
    }]];
  }

  async function initialize() {
    try {
      const { error: requestError } = await supabase
        .from("telegram_requests")
        .select("id", { head: true })
        .limit(1);

      if (requestError) throw requestError;

      const { error: draftError } = await supabase
        .from("telegram_request_drafts")
        .select("telegram_user_id", { head: true })
        .limit(1);

      if (draftError) throw draftError;

      console.log("telegram_requests_ready", {
        adminChatConfigured: Boolean(process.env.TELEGRAM_ADMIN_CHAT),
      });
      return true;
    } catch (error) {
      console.error("telegram_requests_init_failed", {
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
    config: { adminChat },
  };
}
