import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const API = "https://discord.com/api/v10";
const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = URL && SERVICE ? createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
}) : null;

const BRAND = 0xe30613;
const ADMIN = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

const categories: Record<string, { label: string; emoji: string; title: string }> = {
  player: { label: "Гравець CS2", emoji: "🎯", title: "Заявка гравця CS2" },
  coach: { label: "Тренер", emoji: "🧠", title: "Заявка тренера" },
  management: { label: "Менеджмент", emoji: "📋", title: "Заявка в менеджмент" },
  content: { label: "Контент / SMM", emoji: "📱", title: "Заявка в контент / SMM" },
  design: { label: "Дизайн / монтаж", emoji: "🎨", title: "Заявка в дизайн / монтаж" },
  moderation: { label: "Модерація", emoji: "🛡️", title: "Заявка в модерацію" },
  other: { label: "Інше", emoji: "✨", title: "Заявка в ISTe" },
};

const statuses: Record<string, string> = {
  submitted: "🟡 На розгляді",
  interview: "🔵 Співбесіда",
  accepted: "🟢 Прийнято",
  rejected: "🔴 Відхилено",
  withdrawn: "⚪ Відкликано",
};

const clip = (v: unknown, n = 1024) => {
  const s = String(v ?? "").trim();
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
};

const actor = (i: any) => i?.member?.user || i?.user || null;

function options(i: any) {
  const out: Record<string, any> = {};
  for (const o of i?.data?.options || []) if (o?.name) out[String(o.name)] = o.value;
  return out;
}

function has(raw: unknown, bit: bigint) {
  try {
    const bits = BigInt(String(raw || "0"));
    return (bits & ADMIN) === ADMIN || (bits & bit) === bit;
  } catch {
    return false;
  }
}

const isStaff = (i: any) => has(i?.member?.permissions, MANAGE_GUILD);

const eph = (content: string) => ({
  type: 4,
  data: { content, flags: 64, allowed_mentions: { parse: [] } },
});

const embed = (title: string, description: string, fields: any[] = []) => ({
  title,
  description,
  color: BRAND,
  fields,
  footer: { text: "ISTe Recruitment • istesport.com" },
  timestamp: new Date().toISOString(),
});

const msg = (e: any, components: any[] = [], ephemeral = false) => ({
  type: 4,
  data: {
    embeds: [e],
    components,
    allowed_mentions: { parse: [] },
    ...(ephemeral ? { flags: 64 } : {}),
  },
});

function picker() {
  return msg(embed(
    "Заявка в ISTe",
    "Обери напрямок. Після вибору відкриється коротка анкета.",
  ), [{
    type: 1,
    components: [{
      type: 3,
      custom_id: "iste:recruit:category",
      placeholder: "Обери напрямок",
      min_values: 1,
      max_values: 1,
      options: Object.entries(categories).map(([value, c]) => ({
        label: c.label,
        value,
        emoji: { name: c.emoji },
      })),
    }],
  }], true);
}

function panel() {
  return msg(embed(
    "ISTe Recruitment",
    [
      "Хочеш стати частиною ISTe?",
      "",
      "Ми розглядаємо заявки від гравців, тренерів, менеджерів, спеціалістів з контенту, дизайну та модерації.",
      "",
      "Натисни кнопку нижче, обери напрямок та заповни коротку заявку.",
    ].join("\n"),
  ), [{
    type: 1,
    components: [{
      type: 2,
      style: 1,
      custom_id: "iste:recruit:start",
      label: "Подати заявку",
      emoji: { name: "📨" },
    }],
  }]);
}

const input = (
  id: string,
  label: string,
  style = 1,
  required = true,
  max = 500,
  placeholder = "",
) => ({
  type: 1,
  components: [{
    type: 4,
    custom_id: id,
    label: clip(label, 45),
    style,
    required,
    min_length: required ? 1 : 0,
    max_length: max,
    ...(placeholder ? { placeholder: clip(placeholder, 100) } : {}),
  }],
});

function modal(category: string) {
  const c = categories[category];
  if (!c) return null;

  let fields: any[];
  if (category === "player") {
    fields = [
      input("name", "Нікнейм"),
      input("age", "Вік", 1, true, 3, "Наприклад: 19"),
      input("profile", "FACEIT профіль та ELO", 1, true, 250),
      input("role", "Роль у грі", 1, true, 100, "AWP, IGL, rifler, entry..."),
      input("experience", "Досвід та коротко про себе", 2, true, 1000),
    ];
  } else if (category === "coach") {
    fields = [
      input("name", "Ім'я або нікнейм"),
      input("age", "Вік", 1, true, 3),
      input("profile", "FACEIT / досвід", 1, true, 300),
      input("experience", "Команди, досвід та досягнення", 2, true, 1000),
      input("about", "Що можеш дати ISTe", 2, true, 1000),
    ];
  } else {
    fields = [
      input("name", "Ім'я або нікнейм"),
      input("age", "Вік", 1, true, 3),
      input("experience", "Досвід", 2, true, 1000),
      input("links", "Посилання / портфоліо", 1, false, 500),
      input("about", "Коротко про себе та мотивацію", 2, true, 1000),
    ];
  }

  return {
    type: 9,
    data: {
      custom_id: `iste:recruit:form:${category}`,
      title: clip(c.title, 45),
      components: fields,
    },
  };
}

function modalValues(i: any) {
  const out: Record<string, string> = {};
  for (const row of i?.data?.components || []) {
    for (const c of row?.components || []) {
      if (c?.custom_id) out[String(c.custom_id)] = clip(c.value || "", 1500);
    }
  }
  return out;
}

async function discord(path: string, method = "GET", body?: unknown) {
  if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN missing");
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.message || `Discord API ${r.status}`);
  return data;
}

async function settings(guildId: string) {
  if (!db || !guildId) return null;
  const { data, error } = await db
    .from("discord_guilds")
    .select("guild_id,recruitment_channel_id,recruitment_review_channel_id,recruitment_member_role_id")
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) console.error("recruitment settings failed", error);
  return error ? null : data;
}

async function audit(guildId: string, eventType: string, payload: Record<string, unknown>) {
  if (!db || !guildId) return;
  const { error } = await db.from("discord_bot_audit").insert({
    guild_id: guildId,
    event_type: eventType,
    payload,
  });
  if (error) console.error("recruitment audit failed", error);
}

async function setup(i: any) {
  if (!db) return eph("Supabase для заявок не налаштований.");
  if (!i?.guild_id) return eph("Команда працює лише на сервері.");
  if (!isStaff(i)) return eph("Потрібне право керування сервером.");

  const o = options(i);
  const review = String(o.review_channel || "");
  const role = String(o.member_role || "");
  if (!review) return eph("Оберіть закритий канал для розгляду заявок.");

  const guild = String(i.guild_id);
  const channel = String(i.channel_id || "");

  const { error } = await db.from("discord_guilds").update({
    recruitment_channel_id: channel,
    recruitment_review_channel_id: review,
    recruitment_member_role_id: role || null,
    updated_at: new Date().toISOString(),
  }).eq("guild_id", guild);

  if (error) {
    console.error("recruitment setup failed", error);
    return eph("Не вдалося зберегти налаштування.");
  }

  await audit(guild, "recruitment.setup", {
    actor_id: actor(i)?.id || null,
    recruitment_channel_id: channel,
    review_channel_id: review,
    member_role_id: role || null,
  });

  return panel();
}

async function list(i: any) {
  if (!db) return eph("Supabase для заявок не налаштований.");
  if (!i?.guild_id) return eph("Команда працює лише на сервері.");
  if (!isStaff(i)) return eph("Потрібне право керування сервером.");

  const { data, error } = await db
    .from("discord_recruitment_applications")
    .select("id,discord_user_id,category,status")
    .eq("guild_id", String(i.guild_id))
    .in("status", ["submitted", "interview"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return eph("Не вдалося завантажити заявки.");
  if (!data?.length) return eph("Активних заявок зараз немає.");

  const lines = data.map((a: any) =>
    `**#${a.id}** ${statuses[a.status] || a.status} • <@${a.discord_user_id}> • ${categories[a.category]?.label || a.category}`
  );

  return msg(embed("Активні заявки ISTe", lines.join("\n")), [], true);
}

async function begin(i: any) {
  const guild = String(i?.guild_id || "");
  if (!guild) return eph("Заявки доступні лише на сервері ISTe.");
  const s = await settings(guild);
  return s?.recruitment_review_channel_id
    ? picker()
    : eph("Система заявок на цьому сервері ще не налаштована.");
}

function reviewEmbed(a: any, answers: Record<string, string>, status = "submitted") {
  const names: Record<string, string> = {
    name: "Ім'я / нікнейм",
    age: "Вік",
    profile: "FACEIT / профіль",
    role: "Роль",
    experience: "Досвід",
    links: "Посилання / портфоліо",
    about: "Про себе / мотивація",
  };
  const fields = Object.entries(answers)
    .filter(([, v]) => String(v).trim())
    .map(([k, v]) => ({
      name: names[k] || k,
      value: clip(v, 1024),
      inline: false,
    }));

  return embed(
    `Заявка #${a.id}`,
    [
      `**Напрямок:** ${categories[a.category]?.emoji || ""} ${categories[a.category]?.label || a.category}`,
      `**Кандидат:** <@${a.discord_user_id}>`,
      `**Discord:** ${clip(a.discord_username, 100)}`,
      `**Статус:** ${statuses[status] || status}`,
    ].join("\n"),
    fields,
  );
}

function decisionButtons(id: number, interview = false) {
  return [{
    type: 1,
    components: [
      { type: 2, style: 3, custom_id: `iste:recruit:decision:${id}:accepted`, label: "Прийняти", emoji: { name: "✅" } },
      { type: 2, style: 1, custom_id: `iste:recruit:decision:${id}:interview`, label: interview ? "На співбесіді" : "На співбесіду", emoji: { name: "💬" }, disabled: interview },
      { type: 2, style: 4, custom_id: `iste:recruit:decision:${id}:rejected`, label: "Відхилити", emoji: { name: "✖️" } },
    ],
  }];
}

async function dm(userId: string, content: string) {
  try {
    const c = await discord("/users/@me/channels", "POST", { recipient_id: userId });
    if (c?.id) await discord(`/channels/${c.id}/messages`, "POST", {
      content,
      allowed_mentions: { parse: [] },
    });
  } catch (e) {
    console.error("recruitment DM failed", e);
  }
}

async function submit(i: any, category: string) {
  if (!db) return eph("Supabase для заявок не налаштований.");
  if (!categories[category]) return eph("Невідомий тип заявки.");

  const guild = String(i?.guild_id || "");
  const u = actor(i);
  if (!guild || !u?.id) return eph("Не вдалося визначити користувача.");

  const s = await settings(guild);
  if (!s?.recruitment_review_channel_id) return eph("Система заявок ще не налаштована.");

  const answers = modalValues(i);
  const username = clip(u.global_name || u.username || u.id, 120);

  const { data, error } = await db
    .from("discord_recruitment_applications")
    .insert({
      guild_id: guild,
      discord_user_id: String(u.id),
      discord_username: username,
      category,
      status: "submitted",
      answers,
      review_channel_id: s.recruitment_review_channel_id,
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    return eph("У тебе вже є активна заявка в цьому напрямку.");
  }
  if (error || !data) {
    console.error("recruitment insert failed", error);
    return eph("Не вдалося зберегти заявку.");
  }

  try {
    const m = await discord(`/channels/${s.recruitment_review_channel_id}/messages`, "POST", {
      embeds: [reviewEmbed(data, answers)],
      components: decisionButtons(data.id),
      allowed_mentions: { parse: [] },
    });
    if (m?.id) {
      await db.from("discord_recruitment_applications").update({
        review_message_id: String(m.id),
        updated_at: new Date().toISOString(),
      }).eq("id", data.id);
    }
  } catch (e) {
    console.error("recruitment review message failed", e);
  }

  await audit(guild, "recruitment.submitted", {
    application_id: data.id,
    user_id: u.id,
    category,
  });

  return msg(embed(
    `Заявка #${data.id} прийнята`,
    `Напрямок: **${categories[category].label}**\nСтатус: **На розгляді**\n\nКоманда ISTe розгляне заявку та зв'яжеться з тобою.`,
  ), [], true);
}

async function decide(i: any, id: number, next: string) {
  if (!db) return eph("Supabase для заявок не налаштований.");
  if (!isStaff(i)) return eph("Потрібне право керування сервером.");
  if (!["accepted", "interview", "rejected"].includes(next)) return eph("Невідоме рішення.");

  const guild = String(i?.guild_id || "");
  const { data: a, error } = await db
    .from("discord_recruitment_applications")
    .select("*")
    .eq("id", id)
    .eq("guild_id", guild)
    .maybeSingle();

  if (error || !a) return eph("Заявку не знайдено.");
  if (["accepted", "rejected", "withdrawn"].includes(a.status)) return eph("По цій заявці рішення вже прийнято.");

  const u = actor(i);
  const now = new Date().toISOString();

  const { error: updateError } = await db
    .from("discord_recruitment_applications")
    .update({
      status: next,
      reviewer_id: u?.id || null,
      reviewer_username: u?.username || u?.global_name || null,
      decided_at: next === "interview" ? null : now,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) return eph("Не вдалося зберегти рішення.");

  if (next === "accepted") {
    const s = await settings(guild);
    if (s?.recruitment_member_role_id) {
      try {
        await discord(`/guilds/${guild}/members/${a.discord_user_id}/roles/${s.recruitment_member_role_id}`, "PUT");
      } catch (e) {
        console.error("recruitment role failed", e);
      }
    }
    await dm(a.discord_user_id, `Вітаємо! Твою заявку #${id} до **ISTe** прийнято. 🎉\n\nПредставник команди зв'яжеться з тобою щодо наступних кроків.`);
  } else if (next === "interview") {
    await dm(a.discord_user_id, `Твоя заявка #${id} до **ISTe** перейшла на етап співбесіди. 💬\n\nПредставник команди зв'яжеться з тобою.`);
  } else {
    await dm(a.discord_user_id, `Дякуємо за заявку #${id} до **ISTe**.\n\nЦього разу ми не готові продовжити співпрацю, але будемо раді бачити тебе в нашій спільноті.`);
  }

  await audit(guild, `recruitment.${next}`, {
    application_id: id,
    user_id: a.discord_user_id,
    reviewer_id: u?.id || null,
  });

  const final = next === "accepted" || next === "rejected";
  const e = reviewEmbed(a, a.answers || {}, next);
  e.description += `\n**Рішення:** ${clip(u?.username || u?.id || "staff", 100)}`;

  return {
    type: 7,
    data: {
      embeds: [e],
      components: final ? [] : decisionButtons(id, next === "interview"),
      allowed_mentions: { parse: [] },
    },
  };
}

export async function handleRecruitmentCommand(i: any, command: string) {
  if (command === "apply") return await begin(i);
  if (command === "recruitment") return await setup(i);
  if (command === "applications") return await list(i);
  return null;
}

export async function handleRecruitmentComponent(i: any) {
  const id = String(i?.data?.custom_id || "");
  if (id === "iste:recruit:start") return await begin(i);
  if (id === "iste:recruit:category") {
    const c = String(i?.data?.values?.[0] || "");
    return modal(c) || eph("Невідомий напрямок.");
  }
  const m = id.match(/^iste:recruit:decision:(\d+):(accepted|interview|rejected)$/);
  return m ? await decide(i, Number(m[1]), m[2]) : null;
}

export async function handleRecruitmentModal(i: any) {
  const id = String(i?.data?.custom_id || "");
  const m = id.match(/^iste:recruit:form:(player|coach|management|content|design|moderation|other)$/);
  return m ? await submit(i, m[1]) : null;
}
