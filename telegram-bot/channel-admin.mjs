const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const COPY = {
  uk: {
    noAccess: "Ця дія недоступна для вашої ролі.",
    title: "Публікації каналу",
    draftExists: "У вас уже є незавершена публікація. Завершіть її або використайте /postcancel.",
    draftMissing: "Активної чернетки немає.",
    draftCancelled: "Чернетку публікації скасовано.",
    textPrompt: "Надішліть текст публікації. Максимум 3500 символів.",
    imagePrompt: "Надішліть пряме HTTPS-посилання на зображення або «-», якщо зображення не потрібне.",
    buttonPrompt: "Надішліть кнопку у форматі:\nНазва | https://example.com\n\nАбо «-», якщо кнопка не потрібна.",
    badImage: "Потрібне пряме HTTPS-посилання або «-».",
    badButton: "Формат: Назва | https://example.com або «-».",
    preview: "Попередній перегляд",
    publish: "📣 Опублікувати",
    cancel: "❌ Скасувати",
    published: "Публікацію опубліковано.",
    posts: "Останні ручні публікації",
    noPosts: "Ручних публікацій поки немає.",
    editPrompt: "Редагування публікації. Надішліть новий текст.",
    updated: "Публікацію оновлено.",
    deleted: "Публікацію видалено.",
    notFound: "Публікацію не знайдено або вона вже видалена.",
    usageEdit: "Використання: /editpost ID",
    usageDelete: "Використання: /deletepost ID",
    text: "Текст",
    image: "Зображення",
    button: "Кнопка",
    none: "немає",
    status: "Статус",
    channelPost: "Публікація каналу",
    adminPanel: "Канал / публікації",
    newPost: "✍️ Новий пост",
    recentPosts: "🗂 Останні пости",
  },
  ru: {
    noAccess: "Это действие недоступно для вашей роли.",
    title: "Публикации канала",
    draftExists: "У вас уже есть незавершённая публикация. Завершите её или используйте /postcancel.",
    draftMissing: "Активного черновика нет.",
    draftCancelled: "Черновик публикации отменён.",
    textPrompt: "Отправьте текст публикации. Максимум 3500 символов.",
    imagePrompt: "Отправьте прямую HTTPS-ссылку на изображение или «-», если изображение не нужно.",
    buttonPrompt: "Отправьте кнопку в формате:\nНазвание | https://example.com\n\nИли «-», если кнопка не нужна.",
    badImage: "Нужна прямая HTTPS-ссылка или «-».",
    badButton: "Формат: Название | https://example.com или «-».",
    preview: "Предпросмотр",
    publish: "📣 Опубликовать",
    cancel: "❌ Отменить",
    published: "Публикация опубликована.",
    posts: "Последние ручные публикации",
    noPosts: "Ручных публикаций пока нет.",
    editPrompt: "Редактирование публикации. Отправьте новый текст.",
    updated: "Публикация обновлена.",
    deleted: "Публикация удалена.",
    notFound: "Публикация не найдена или уже удалена.",
    usageEdit: "Использование: /editpost ID",
    usageDelete: "Использование: /deletepost ID",
    text: "Текст",
    image: "Изображение",
    button: "Кнопка",
    none: "нет",
    status: "Статус",
    channelPost: "Публикация канала",
    adminPanel: "Канал / публикации",
    newPost: "✍️ Новый пост",
    recentPosts: "🗂 Последние посты",
  },
  en: {
    noAccess: "This action is not available for your role.",
    title: "Channel posts",
    draftExists: "You already have an unfinished post. Finish it or use /postcancel.",
    draftMissing: "There is no active draft.",
    draftCancelled: "Post draft cancelled.",
    textPrompt: "Send the post text. Maximum 3500 characters.",
    imagePrompt: "Send a direct HTTPS image URL or “-” for no image.",
    buttonPrompt: "Send a button as:\nLabel | https://example.com\n\nOr “-” for no button.",
    badImage: "Send a direct HTTPS URL or “-”.",
    badButton: "Format: Label | https://example.com or “-”.",
    preview: "Preview",
    publish: "📣 Publish",
    cancel: "❌ Cancel",
    published: "Post published.",
    posts: "Recent manual posts",
    noPosts: "There are no manual posts yet.",
    editPrompt: "Editing post. Send the new text.",
    updated: "Post updated.",
    deleted: "Post deleted.",
    notFound: "Post not found or already deleted.",
    usageEdit: "Usage: /editpost ID",
    usageDelete: "Usage: /deletepost ID",
    text: "Text",
    image: "Image",
    button: "Button",
    none: "none",
    status: "Status",
    channelPost: "Channel post",
    adminPanel: "Channel / posts",
    newPost: "✍️ New post",
    recentPosts: "🗂 Recent posts",
  },
};

function localeKey(value) {
  const lang = String(value || "").toLowerCase();
  return ["uk","ru","en"].includes(lang) ? lang : "uk";
}
function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
function normalizeCommand(text) {
  return cleanText(text).split(/\s+/)[0].split("@")[0].toLowerCase();
}
function validHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
function parseButton(value) {
  const source = String(value ?? "").trim();
  if (source === "-") return null;
  const parts = source.split("|").map((item) => item.trim());
  if (parts.length !== 2 || !parts[0] || !validHttpsUrl(parts[1])) return undefined;
  return { text: parts[0].slice(0, 64), url: parts[1] };
}
function buttonMarkup(button) {
  return button ? { inline_keyboard: [[button]] } : { inline_keyboard: [] };
}
function formatDate(value, lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
function previewText(data, lang) {
  const c = COPY[lang];
  const lines = [
    `🧪 <b>${escapeHtml(c.preview)}</b>`,
    "",
    data.text,
  ];
  if (data.image_url) lines.push("", `🖼 ${escapeHtml(data.image_url)}`);
  if (data.button?.text) lines.push("", `🔘 ${escapeHtml(data.button.text)}`);
  return lines.join("\n");
}

export function createChannelAdminAutomation({
  telegram,
  sendMessage,
  answerCallback,
  audit,
  supabase,
  channel,
  hasRole,
}) {
  async function getDraft(userId) {
    const { data, error } = await supabase
      .from("telegram_manual_post_drafts")
      .select("*")
      .eq("telegram_user_id", Number(userId))
      .maybeSingle();
    if (error) throw error;
    if (data && new Date(data.expires_at).getTime() <= Date.now()) {
      await deleteDraft(userId);
      return null;
    }
    return data || null;
  }

  async function saveDraft(userId, mode, step, data, language, postId = null) {
    const now = new Date();
    const { error } = await supabase
      .from("telegram_manual_post_drafts")
      .upsert({
        telegram_user_id: Number(userId),
        mode,
        step,
        data,
        language: localeKey(language),
        target_post_id: postId,
        updated_at: now.toISOString(),
        expires_at: new Date(now.getTime() + DRAFT_TTL_MS).toISOString(),
      }, { onConflict: "telegram_user_id" });
    if (error) throw error;
  }

  async function deleteDraft(userId) {
    const { error } = await supabase
      .from("telegram_manual_post_drafts")
      .delete()
      .eq("telegram_user_id", Number(userId));
    if (error) throw error;
  }

  async function startNew(message, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return sendMessage(message.chat.id, c.noAccess);
    if (await getDraft(message.from.id)) return sendMessage(message.chat.id, c.draftExists);

    await saveDraft(message.from.id, "create", "text", {}, lang);
    await sendMessage(message.chat.id, `✍️ <b>${c.channelPost}</b>\n\n${c.textPrompt}`);
  }

  async function cancelDraft(message, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    const draft = await getDraft(message.from.id);
    if (!draft) return sendMessage(message.chat.id, c.draftMissing);
    await deleteDraft(message.from.id);
    await sendMessage(message.chat.id, c.draftCancelled);
  }

  async function loadPost(id) {
    const { data, error } = await supabase
      .from("telegram_manual_posts")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function startEdit(message, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return sendMessage(message.chat.id, c.noAccess);

    const parts = cleanText(message.text).split(/\s+/);
    const id = Number(parts[1]);
    if (!Number.isSafeInteger(id) || id <= 0) return sendMessage(message.chat.id, c.usageEdit);

    const post = await loadPost(id);
    if (!post || post.status !== "published") return sendMessage(message.chat.id, c.notFound);
    if (await getDraft(message.from.id)) return sendMessage(message.chat.id, c.draftExists);

    await saveDraft(
      message.from.id,
      "edit",
      "text",
      {
        text: post.text,
        image_url: post.image_url,
        button: post.button_text && post.button_url
          ? { text: post.button_text, url: post.button_url }
          : null,
      },
      lang,
      post.id,
    );
    await sendMessage(message.chat.id, c.editPrompt);
  }

  async function processDraft(message, user, draft) {
    const lang = localeKey(draft.language || user.language);
    const c = COPY[lang];
    const raw = String(message.text ?? "");
    const data = { ...(draft.data || {}) };

    if (draft.step === "text") {
      if (!raw.trim() || raw.length > 3500) {
        await sendMessage(message.chat.id, c.textPrompt);
        return true;
      }
      data.text = raw.trim();
      await saveDraft(message.from.id, draft.mode, "image", data, lang, draft.target_post_id);
      await sendMessage(message.chat.id, c.imagePrompt);
      return true;
    }

    if (draft.step === "image") {
      const value = cleanText(raw);
      if (value !== "-" && !validHttpsUrl(value)) {
        await sendMessage(message.chat.id, c.badImage);
        return true;
      }
      data.image_url = value === "-" ? null : value;
      await saveDraft(message.from.id, draft.mode, "button", data, lang, draft.target_post_id);
      await sendMessage(message.chat.id, c.buttonPrompt);
      return true;
    }

    if (draft.step === "button") {
      const button = parseButton(raw);
      if (button === undefined) {
        await sendMessage(message.chat.id, c.badButton);
        return true;
      }
      data.button = button;
      await saveDraft(message.from.id, draft.mode, "confirm", data, lang, draft.target_post_id);
      await sendMessage(message.chat.id, previewText(data, lang), {
        reply_markup: {
          inline_keyboard: [[
            {
              text: draft.mode === "edit" ? `💾 ${c.updated}` : c.publish,
              callback_data: draft.mode === "edit" ? "post:saveedit" : "post:publish",
            },
            { text: c.cancel, callback_data: "post:cancel" },
          ]],
        },
      });
      return true;
    }

    if (draft.step === "confirm") {
      await sendMessage(message.chat.id, previewText(data, lang));
      return true;
    }

    return false;
  }

  async function sendChannelPost(data) {
    const markup = buttonMarkup(data.button);
    if (data.image_url) {
      return telegram("sendPhoto", {
        chat_id: channel,
        photo: data.image_url,
        caption: data.text,
        parse_mode: "HTML",
        reply_markup: markup,
      });
    }
    return sendMessage(channel, data.text, { reply_markup: markup });
  }

  async function publish(query, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return answerCallback(query.id, c.noAccess);

    const draft = await getDraft(query.from.id);
    if (!draft || draft.mode !== "create" || draft.step !== "confirm") {
      return answerCallback(query.id, c.draftMissing);
    }

    const data = draft.data || {};
    const sent = await sendChannelPost(data);

    const { data: row, error } = await supabase
      .from("telegram_manual_posts")
      .insert({
        status: "published",
        text: data.text,
        image_url: data.image_url || null,
        button_text: data.button?.text || null,
        button_url: data.button?.url || null,
        telegram_chat_id: String(sent.chat.id),
        telegram_message_id: Number(sent.message_id),
        created_by: Number(query.from.id),
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("telegram_manual_post_db_ack_failed", {
        telegramMessageId: sent.message_id,
        message: error.message || String(error),
      });
      throw error;
    }

    await deleteDraft(query.from.id);
    await answerCallback(query.id, `${c.published} #${row.id}`);
    await audit(query.from.id, "manual_post_published", {
      postId: row.id,
      telegramMessageId: sent.message_id,
    });
  }

  async function applyEdit(post, data) {
    const markup = buttonMarkup(data.button);

    if (post.image_url && data.image_url) {
      if (post.image_url !== data.image_url) {
        await telegram("editMessageMedia", {
          chat_id: post.telegram_chat_id,
          message_id: post.telegram_message_id,
          media: {
            type: "photo",
            media: data.image_url,
            caption: data.text,
            parse_mode: "HTML",
          },
          reply_markup: markup,
        });
      } else {
        await telegram("editMessageCaption", {
          chat_id: post.telegram_chat_id,
          message_id: post.telegram_message_id,
          caption: data.text,
          parse_mode: "HTML",
          reply_markup: markup,
        });
      }
      return;
    }

    if (!post.image_url && !data.image_url) {
      await telegram("editMessageText", {
        chat_id: post.telegram_chat_id,
        message_id: post.telegram_message_id,
        text: data.text,
        parse_mode: "HTML",
        reply_markup: markup,
        disable_web_page_preview: true,
      });
      return;
    }

    throw new Error(
      "Changing a post between text-only and photo mode is not supported by Telegram editing. Delete and republish the post instead.",
    );
  }

  async function saveEdit(query, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return answerCallback(query.id, c.noAccess);

    const draft = await getDraft(query.from.id);
    if (!draft || draft.mode !== "edit" || draft.step !== "confirm") {
      return answerCallback(query.id, c.draftMissing);
    }

    const post = await loadPost(draft.target_post_id);
    if (!post || post.status !== "published") return answerCallback(query.id, c.notFound);

    const data = draft.data || {};
    await applyEdit(post, data);

    const { error } = await supabase
      .from("telegram_manual_posts")
      .update({
        text: data.text,
        image_url: data.image_url || null,
        button_text: data.button?.text || null,
        button_url: data.button?.url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("status", "published");

    if (error) throw error;

    await deleteDraft(query.from.id);
    await answerCallback(query.id, c.updated);
    await audit(query.from.id, "manual_post_updated", { postId: post.id });
  }

  async function listPosts(message, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return sendMessage(message.chat.id, c.noAccess);

    const { data, error } = await supabase
      .from("telegram_manual_posts")
      .select("id, text, status, published_at, telegram_message_id")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data?.length) return sendMessage(message.chat.id, c.noPosts);

    const lines = [`🗂 <b>${c.posts}</b>`, ""];
    for (const post of data) {
      lines.push(
        `<b>#${post.id}</b> · ${escapeHtml(post.status)}`,
        escapeHtml(cleanText(post.text).slice(0, 120)),
        post.published_at ? escapeHtml(formatDate(post.published_at, lang)) : "",
        post.status === "published"
          ? `<code>/editpost ${post.id}</code> · <code>/deletepost ${post.id}</code>`
          : "",
        "",
      );
    }
    await sendMessage(message.chat.id, lines.filter(Boolean).join("\n").trim());
  }

  async function deletePost(message, user) {
    const lang = localeKey(user.language);
    const c = COPY[lang];
    if (!hasRole(user, "editor")) return sendMessage(message.chat.id, c.noAccess);

    const parts = cleanText(message.text).split(/\s+/);
    const id = Number(parts[1]);
    if (!Number.isSafeInteger(id) || id <= 0) return sendMessage(message.chat.id, c.usageDelete);

    const post = await loadPost(id);
    if (!post || post.status !== "published") return sendMessage(message.chat.id, c.notFound);

    await telegram("deleteMessage", {
      chat_id: post.telegram_chat_id,
      message_id: post.telegram_message_id,
    });

    const { error } = await supabase
      .from("telegram_manual_posts")
      .update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "published");

    if (error) throw error;
    await audit(message.from.id, "manual_post_deleted", { postId: id });
    await sendMessage(message.chat.id, `✅ ${c.deleted} #${id}`);
  }

  async function handleMessage(message, user) {
    if (!message?.text || message?.chat?.type !== "private") return false;

    const command = normalizeCommand(message.text);

    if (command === "/post") {
      await startNew(message, user);
      return true;
    }
    if (command === "/posts") {
      await listPosts(message, user);
      return true;
    }
    if (command === "/postcancel") {
      await cancelDraft(message, user);
      return true;
    }
    if (command === "/editpost") {
      await startEdit(message, user);
      return true;
    }
    if (command === "/deletepost") {
      await deletePost(message, user);
      return true;
    }

    const draft = await getDraft(message.from.id);
    if (draft) {
      await processDraft(message, user, draft);
      return true;
    }
    return false;
  }

  async function handleCallback(data, query, user) {
    if (data === "post:publish") {
      await publish(query, user);
      return true;
    }
    if (data === "post:saveedit") {
      await saveEdit(query, user);
      return true;
    }
    if (data === "post:cancel") {
      const lang = localeKey(user.language);
      await deleteDraft(query.from.id);
      await answerCallback(query.id, COPY[lang].draftCancelled);
      return true;
    }
    if (data === "admin:post:new") {
      await answerCallback(query.id);
      await startNew({ chat: query.message.chat, from: query.from, text: "/post" }, user);
      return true;
    }
    if (data === "admin:post:list") {
      await answerCallback(query.id);
      await listPosts({ chat: query.message.chat, from: query.from, text: "/posts" }, user);
      return true;
    }
    return false;
  }

  function adminRows(lang) {
    const c = COPY[localeKey(lang)];
    return [[
      { text: c.newPost, callback_data: "admin:post:new" },
      { text: c.recentPosts, callback_data: "admin:post:list" },
    ]];
  }

  async function initialize() {
    try {
      const checks = await Promise.all([
        supabase.from("telegram_manual_posts").select("id").limit(1),
        supabase.from("telegram_manual_post_drafts").select("telegram_user_id").limit(1),
      ]);
      for (const result of checks) if (result.error) throw result.error;
      console.log("telegram_channel_admin_ready", { channel });
      return true;
    } catch (error) {
      console.error("telegram_channel_admin_init_failed", {
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
  };
}
