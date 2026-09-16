const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";

const CATEGORY_NAME = "🔒 ПРИВАТНІ КІМНАТИ";
const LOBBY_NAME = "➕ Створити приватний";
const ROOM_PREFIX = "🔒・";

const PERMISSIONS = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  STREAM: 1n << 9n,
  CREATE_INSTANT_INVITE: 1n << 0n,
};

const MEMBER_ALLOW =
  PERMISSIONS.VIEW_CHANNEL |
  PERMISSIONS.CONNECT |
  PERMISSIONS.SPEAK |
  PERMISSIONS.STREAM |
  PERMISSIONS.USE_VAD |
  PERMISSIONS.CREATE_INSTANT_INVITE |
  PERMISSIONS.SEND_MESSAGES |
  PERMISSIONS.READ_MESSAGE_HISTORY;

const OWNER_ALLOW =
  MEMBER_ALLOW |
  PERMISSIONS.MANAGE_CHANNELS;

type Language = "uk" | "ru" | "en";

const text = {
  uk: {
    onlyOwner: "⛔ Керувати цією кімнатою може лише її власник.",
    noRoom: "У вас немає активної приватної кімнати.",
    noGuild: "Ця команда працює лише на сервері.",
    setupPermission: "Для `/room setup` потрібне право **Керувати каналами**.",
    setupDone: "Систему приватних кімнат готово: {{lobby}}.",
    setupFailed: "Не вдалося налаштувати приватні кімнати.",
    actionFailed: "Не вдалося виконати дію. Перевірте права ISTe Bot.",
    inviteDone: "✅ Доступ надано {{user}}.",
    removeDone: "✅ Доступ для {{user}} видалено.",
    kickDone: "✅ {{user}} відключено від кімнати.",
    transferDone: "👑 {{user}} тепер власник кімнати.",
    renameDone: "✅ Назву кімнати змінено.",
    limitDone: "✅ Ліміт кімнати змінено.",
    regionDone: "✅ Голосовий регіон змінено.",
    deleted: "🗑️ Приватну кімнату видалено.",
    selectOther: "Оберіть іншого користувача.",
    memberMenu: "Керування {{user}}",
  },
  ru: {
    onlyOwner: "⛔ Управлять этой комнатой может только её владелец.",
    noRoom: "У вас нет активной приватной комнаты.",
    noGuild: "Эта команда работает только на сервере.",
    setupPermission: "Для `/room setup` требуется право **Управлять каналами**.",
    setupDone: "Система приватных комнат готова: {{lobby}}.",
    setupFailed: "Не удалось настроить приватные комнаты.",
    actionFailed: "Не удалось выполнить действие. Проверьте права ISTe Bot.",
    inviteDone: "✅ Доступ выдан {{user}}.",
    removeDone: "✅ Доступ для {{user}} удалён.",
    kickDone: "✅ {{user}} отключён от комнаты.",
    transferDone: "👑 {{user}} теперь владелец комнаты.",
    renameDone: "✅ Название комнаты изменено.",
    limitDone: "✅ Лимит комнаты изменён.",
    regionDone: "✅ Голосовой регион изменён.",
    deleted: "🗑️ Приватная комната удалена.",
    selectOther: "Выберите другого пользователя.",
    memberMenu: "Управление {{user}}",
  },
  en: {
    onlyOwner: "⛔ Only the room owner can use these controls.",
    noRoom: "You do not have an active private room.",
    noGuild: "This command only works inside a server.",
    setupPermission: "`/room setup` requires **Manage Channels**.",
    setupDone: "Private room system is ready: {{lobby}}.",
    setupFailed: "Could not configure private rooms.",
    actionFailed: "Could not complete the action. Check ISTe Bot permissions.",
    inviteDone: "✅ Access granted to {{user}}.",
    removeDone: "✅ Access removed for {{user}}.",
    kickDone: "✅ {{user}} was disconnected from the room.",
    transferDone: "👑 {{user}} is now the room owner.",
    renameDone: "✅ Room name updated.",
    limitDone: "✅ Room limit updated.",
    regionDone: "✅ Voice region updated.",
    deleted: "🗑️ Private room deleted.",
    selectOther: "Choose another user.",
    memberMenu: "Manage {{user}}",
  },
};

function localeFamily(value: unknown): Language {
  const locale = String(value || "").toLowerCase();
  if (locale.startsWith("uk")) return "uk";
  if (locale.startsWith("ru")) return "ru";
  return "en";
}

function interpolate(value: string, variables: Record<string, string | number>) {
  return value.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(variables, name)
      ? String(variables[name])
      : match
  );
}

function actorId(interaction: any) {
  return String(
    interaction?.member?.user?.id ||
      interaction?.user?.id ||
      "",
  );
}

function ephemeral(content: string, components: unknown[] = []) {
  return {
    type: 4,
    data: {
      content,
      flags: 64,
      components,
      allowed_mentions: { parse: [] },
    },
  };
}

function updateMessage(data: Record<string, unknown>) {
  return {
    type: 7,
    data,
  };
}

function modal(customId: string, title: string, label: string, value = "") {
  return {
    type: 9,
    data: {
      custom_id: customId,
      title: title.slice(0, 45),
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "value",
              style: 1,
              label: label.slice(0, 45),
              required: true,
              value: String(value || "").slice(0, 100),
              min_length: 1,
              max_length: 100,
            },
          ],
        },
      ],
    },
  };
}

function permissionHas(raw: unknown, permission: bigint) {
  try {
    return (BigInt(String(raw || "0")) & permission) === permission;
  } catch {
    return false;
  }
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
    throw new Error("DISCORD_BOT_TOKEN is missing");
  }

  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(reason
        ? {
            "X-Audit-Log-Reason": encodeURIComponent(reason).slice(0, 512),
          }
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

function getOwnerOverwrite(channel: any, ownerId: string) {
  return (channel?.permission_overwrites || []).find(
    (overwrite: any) =>
      Number(overwrite?.type) === 1 &&
      String(overwrite?.id || "") === ownerId &&
      permissionHas(overwrite?.allow, PERMISSIONS.MANAGE_CHANNELS),
  ) || null;
}

function everyoneOverwrite(channel: any) {
  const guildId = String(channel?.guild_id || "");
  return (channel?.permission_overwrites || []).find(
    (overwrite: any) =>
      Number(overwrite?.type) === 0 &&
      String(overwrite?.id || "") === guildId,
  ) || null;
}

function roomState(channel: any) {
  const overwrite = everyoneOverwrite(channel);
  const deny = BigInt(String(overwrite?.deny || "0"));

  return {
    locked: (deny & PERMISSIONS.CONNECT) === PERMISSIONS.CONNECT,
    hidden: (deny & PERMISSIONS.VIEW_CHANNEL) === PERMISSIONS.VIEW_CHANNEL,
    userLimit: Number(channel?.user_limit || 0),
    rtcRegion: channel?.rtc_region || null,
  };
}

function panelData(channel: any, ownerId: string) {
  const state = roomState(channel);

  return {
    embeds: [
      {
        title: "🔒 Управление приватной комнатой",
        description:
          `⭐ **Владелец:** <@${ownerId}>\n\n` +
          "Только владелец комнаты может использовать элементы управления ниже.",
        color: 0xe30613,
        fields: [
          {
            name: "👥 Лимит",
            value: state.userLimit > 0 ? String(state.userLimit) : "Без лимита",
            inline: true,
          },
          {
            name: "🔐 Вход",
            value: state.locked ? "Закрыт" : "Открыт",
            inline: true,
          },
          {
            name: "👁️ Видимость",
            value: state.hidden ? "Скрыта" : "Видна",
            inline: true,
          },
          {
            name: "🌍 Регион",
            value: state.rtcRegion || "Automatic",
            inline: true,
          },
        ],
        footer: { text: "ISTesport Private Voice" },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            label: "✏️ Название",
            custom_id: `pv:rename:${channel.id}:${ownerId}`,
          },
          {
            type: 2,
            style: 2,
            label: "👥 Лимит",
            custom_id: `pv:limit:${channel.id}:${ownerId}`,
          },
          {
            type: 2,
            style: state.locked ? 3 : 2,
            label: state.locked ? "🔓 Открыть" : "🔒 Закрыть",
            custom_id: `pv:lock:${channel.id}:${ownerId}`,
          },
          {
            type: 2,
            style: state.hidden ? 3 : 2,
            label: state.hidden ? "👁️ Показать" : "🙈 Скрыть",
            custom_id: `pv:hide:${channel.id}:${ownerId}`,
          },
          {
            type: 2,
            style: 4,
            label: "🗑️ Удалить",
            custom_id: `pv:delete:${channel.id}:${ownerId}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 5,
            custom_id: `pv:invite:${channel.id}:${ownerId}`,
            placeholder: "➕ Выдать доступ пользователю",
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 5,
            custom_id: `pv:manage:${channel.id}:${ownerId}`,
            placeholder: "👤 Управление участником",
            min_values: 1,
            max_values: 1,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: `pv:region:${channel.id}:${ownerId}`,
            placeholder: "🌍 Выбрать голосовой регион",
            min_values: 1,
            max_values: 1,
            options: [
              {
                label: "Automatic",
                value: "automatic",
                description: "Discord выберет регион автоматически",
              },
              {
                label: "Europe",
                value: "rotterdam",
                description: "Европейский голосовой регион",
              },
              { label: "US East", value: "us-east" },
              { label: "US West", value: "us-west" },
              { label: "Singapore", value: "singapore" },
            ],
          },
        ],
      },
    ],
    allowed_mentions: {
      parse: [],
      users: [ownerId],
    },
  };
}

async function patchPanelMessage(channelId: string, ownerId: string) {
  const channel = await discordApi(`/channels/${channelId}`);
  const messages = await discordApi(`/channels/${channelId}/messages?limit=20`);
  const panelMessage = (Array.isArray(messages) ? messages : []).find(
    (message: any) =>
      (message?.components || []).some((row: any) =>
        (row?.components || []).some((component: any) =>
          String(component?.custom_id || "").startsWith("pv:"),
        ),
      ),
  );

  if (!panelMessage?.id) {
    await discordApi(`/channels/${channelId}/messages`, {
      method: "POST",
      body: panelData(channel, ownerId),
      reason: "ISTesport private room control panel",
    });
    return;
  }

  await discordApi(`/channels/${channelId}/messages/${panelMessage.id}`, {
    method: "PATCH",
    body: panelData(channel, ownerId),
  });
}

async function setEveryoneDeny(
  channel: any,
  permission: bigint,
  shouldDeny: boolean,
) {
  const guildId = String(channel.guild_id || "");
  const overwrite = everyoneOverwrite(channel);

  let allow = BigInt(String(overwrite?.allow || "0"));
  let deny = BigInt(String(overwrite?.deny || "0"));

  if (shouldDeny) {
    deny |= permission;
    allow &= ~permission;
  } else {
    deny &= ~permission;
    allow &= ~permission;
  }

  await discordApi(`/channels/${channel.id}/permissions/${guildId}`, {
    method: "PUT",
    body: {
      type: 0,
      allow: String(allow),
      deny: String(deny),
    },
    reason: "ISTesport private room owner control",
  });
}

async function setMemberAccess(
  channelId: string,
  userId: string,
  owner = false,
) {
  await discordApi(`/channels/${channelId}/permissions/${userId}`, {
    method: "PUT",
    body: {
      type: 1,
      allow: String(owner ? OWNER_ALLOW : MEMBER_ALLOW),
      deny: "0",
    },
    reason: owner
      ? "ISTesport private room ownership"
      : "ISTesport private room access",
  });
}

async function removeMemberAccess(channelId: string, userId: string) {
  await discordApi(`/channels/${channelId}/permissions/${userId}`, {
    method: "DELETE",
    reason: "ISTesport private room access removed",
  }).catch((error) => {
    if (error?.status !== 404) throw error;
  });
}

async function disconnectMember(
  guildId: string,
  userId: string,
  channelId: string,
) {
  const member = await discordApi(`/guilds/${guildId}/members/${userId}`).catch(
    () => null,
  );

  if (!member) return;

  await discordApi(`/guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    body: { channel_id: null },
    reason: `ISTesport private room disconnect from ${channelId}`,
  }).catch(() => null);
}

async function assertOwner(
  interaction: any,
  channelId: string,
  ownerId: string,
) {
  const actor = actorId(interaction);

  if (!actor || actor !== ownerId) {
    return {
      ok: false,
      response: ephemeral(
        text[localeFamily(interaction?.locale || interaction?.guild_locale)]
          .onlyOwner,
      ),
    };
  }

  const channel = await discordApi(`/channels/${channelId}`);

  if (!getOwnerOverwrite(channel, ownerId)) {
    return {
      ok: false,
      response: ephemeral(
        text[localeFamily(interaction?.locale || interaction?.guild_locale)]
          .onlyOwner,
      ),
    };
  }

  return { ok: true, channel };
}

function parseCustomId(value: unknown) {
  const parts = String(value || "").split(":");
  return {
    prefix: parts[0] || "",
    action: parts[1] || "",
    channelId: parts[2] || "",
    ownerId: parts[3] || "",
    targetId: parts[4] || "",
  };
}

function modalValue(interaction: any) {
  for (const row of interaction?.data?.components || []) {
    for (const component of row?.components || []) {
      if (component?.custom_id === "value") {
        return String(component?.value || "").trim();
      }
    }
  }
  return "";
}

async function loadGuildChannels(guildId: string) {
  const channels = await discordApi(`/guilds/${guildId}/channels`);
  return Array.isArray(channels) ? channels : [];
}

function findCategory(channels: any[]) {
  return channels.find(
    (channel) =>
      Number(channel?.type) === 4 &&
      channel?.name === CATEGORY_NAME,
  ) || null;
}

function findLobby(channels: any[], categoryId: string) {
  return channels.find(
    (channel) =>
      Number(channel?.type) === 2 &&
      String(channel?.parent_id || "") === categoryId &&
      channel?.name === LOBBY_NAME,
  ) || null;
}

function findOwnedRoom(
  channels: any[],
  categoryId: string,
  ownerId: string,
) {
  return channels.find((channel) => {
    if (
      Number(channel?.type) !== 2 ||
      String(channel?.parent_id || "") !== categoryId ||
      !String(channel?.name || "").startsWith(ROOM_PREFIX)
    ) {
      return false;
    }

    return Boolean(getOwnerOverwrite(channel, ownerId));
  }) || null;
}

async function ensureSetup(guildId: string) {
  let channels = await loadGuildChannels(guildId);
  let category = findCategory(channels);

  if (!category) {
    category = await discordApi(`/guilds/${guildId}/channels`, {
      method: "POST",
      body: {
        name: CATEGORY_NAME,
        type: 4,
      },
      reason: "ISTesport private voice setup",
    });

    channels = await loadGuildChannels(guildId);
  }

  let lobby = findLobby(channels, String(category.id));

  if (!lobby) {
    lobby = await discordApi(`/guilds/${guildId}/channels`, {
      method: "POST",
      body: {
        name: LOBBY_NAME,
        type: 2,
        parent_id: String(category.id),
      },
      reason: "ISTesport private voice setup",
    });
  }

  return { category, lobby };
}

function commandOptions(interaction: any) {
  const sub = (interaction?.data?.options || []).find(
    (option: any) => Number(option?.type) === 1,
  );

  const values: Record<string, unknown> = {};
  for (const option of sub?.options || []) {
    if (option?.name) values[String(option.name)] = option.value;
  }

  return {
    subcommand: String(sub?.name || "info"),
    values,
  };
}

async function ownedRoom(interaction: any) {
  const guildId = String(interaction?.guild_id || "");
  const ownerId = actorId(interaction);

  if (!guildId || !ownerId) return null;

  const channels = await loadGuildChannels(guildId);
  const category = findCategory(channels);

  if (!category) return null;

  return findOwnedRoom(channels, String(category.id), ownerId);
}

export async function handlePrivateRoomCommand(
  interaction: any,
  command: string,
) {
  if (command !== "room") return null;

  const lang = localeFamily(interaction?.locale || interaction?.guild_locale);
  const t = text[lang];
  const guildId = String(interaction?.guild_id || "");
  const ownerId = actorId(interaction);

  if (!guildId || !ownerId) return ephemeral(t.noGuild);

  const { subcommand, values } = commandOptions(interaction);

  if (subcommand === "setup") {
    if (
      !hasPermission(
        interaction?.member?.permissions,
        PERMISSIONS.MANAGE_CHANNELS,
      )
    ) {
      return ephemeral(t.setupPermission);
    }

    try {
      const { lobby } = await ensureSetup(guildId);
      return ephemeral(
        interpolate(t.setupDone, { lobby: `<#${lobby.id}>` }),
      );
    } catch (error) {
      console.error("private room setup failed", error);
      return ephemeral(t.setupFailed);
    }
  }

  const room = await ownedRoom(interaction).catch(() => null);
  if (!room) return ephemeral(t.noRoom);

  try {
    if (subcommand === "info") {
      return {
        type: 4,
        data: {
          flags: 64,
          ...panelData(room, ownerId),
        },
      };
    }

    if (subcommand === "rename") {
      const name = String(values.name || "").trim().slice(0, 80);
      if (!name) return ephemeral(t.actionFailed);

      await discordApi(`/channels/${room.id}`, {
        method: "PATCH",
        body: { name: `${ROOM_PREFIX}${name}`.slice(0, 100) },
      });
      await patchPanelMessage(String(room.id), ownerId);
      return ephemeral(t.renameDone);
    }

    if (subcommand === "limit") {
      const limit = Math.max(
        0,
        Math.min(99, Math.trunc(Number(values.amount || 0))),
      );
      await discordApi(`/channels/${room.id}`, {
        method: "PATCH",
        body: { user_limit: limit },
      });
      await patchPanelMessage(String(room.id), ownerId);
      return ephemeral(t.limitDone);
    }

    if (subcommand === "invite") {
      const userId = String(values.member || "");
      if (!userId || userId === ownerId) return ephemeral(t.selectOther);

      await setMemberAccess(String(room.id), userId, false);
      return ephemeral(
        interpolate(t.inviteDone, { user: `<@${userId}>` }),
      );
    }

    if (subcommand === "remove") {
      const userId = String(values.member || "");
      if (!userId || userId === ownerId) return ephemeral(t.selectOther);

      await removeMemberAccess(String(room.id), userId);
      await disconnectMember(guildId, userId, String(room.id));
      return ephemeral(
        interpolate(t.removeDone, { user: `<@${userId}>` }),
      );
    }

    if (subcommand === "transfer") {
      const userId = String(values.member || "");
      if (!userId || userId === ownerId) return ephemeral(t.selectOther);

      await setMemberAccess(String(room.id), userId, true);
      await setMemberAccess(String(room.id), ownerId, false);
      await patchPanelMessage(String(room.id), userId);

      return ephemeral(
        interpolate(t.transferDone, { user: `<@${userId}>` }),
      );
    }

    if (subcommand === "delete") {
      await discordApi(`/channels/${room.id}`, {
        method: "DELETE",
        reason: "ISTesport private room deleted by owner",
      });
      return ephemeral(t.deleted);
    }

    return ephemeral(t.actionFailed);
  } catch (error) {
    console.error("private room slash command failed", error);
    return ephemeral(t.actionFailed);
  }
}

export async function handlePrivateRoomComponent(interaction: any) {
  const customId = String(interaction?.data?.custom_id || "");

  if (!customId.startsWith("pv:")) return null;

  const lang = localeFamily(interaction?.locale || interaction?.guild_locale);
  const t = text[lang];
  const parsed = parseCustomId(customId);

  if (!parsed.channelId || !parsed.ownerId) {
    return ephemeral(t.actionFailed);
  }

  let guard;
  try {
    guard = await assertOwner(
      interaction,
      parsed.channelId,
      parsed.ownerId,
    );
  } catch (error) {
    console.error("private room owner validation failed", error);
    return ephemeral(t.actionFailed);
  }

  if (!guard.ok) return guard.response;

  const channel = guard.channel;

  try {
    if (parsed.action === "rename") {
      return modal(
        `pvmodal:rename:${parsed.channelId}:${parsed.ownerId}`,
        "Изменить название",
        "Новое название",
        String(channel?.name || "").replace(ROOM_PREFIX, ""),
      );
    }

    if (parsed.action === "limit") {
      return modal(
        `pvmodal:limit:${parsed.channelId}:${parsed.ownerId}`,
        "Лимит участников",
        "Количество от 0 до 99",
        String(channel?.user_limit || 0),
      );
    }

    if (parsed.action === "lock") {
      const state = roomState(channel);
      await setEveryoneDeny(
        channel,
        PERMISSIONS.CONNECT,
        !state.locked,
      );
      const fresh = await discordApi(`/channels/${parsed.channelId}`);
      return updateMessage(panelData(fresh, parsed.ownerId));
    }

    if (parsed.action === "hide") {
      const state = roomState(channel);
      await setEveryoneDeny(
        channel,
        PERMISSIONS.VIEW_CHANNEL,
        !state.hidden,
      );
      const fresh = await discordApi(`/channels/${parsed.channelId}`);
      return updateMessage(panelData(fresh, parsed.ownerId));
    }

    if (parsed.action === "delete") {
      await discordApi(`/channels/${parsed.channelId}`, {
        method: "DELETE",
        reason: "ISTesport private room deleted from panel",
      });
      return ephemeral(t.deleted);
    }

    if (parsed.action === "invite") {
      const targetId = String(interaction?.data?.values?.[0] || "");
      if (!targetId || targetId === parsed.ownerId) {
        return ephemeral(t.selectOther);
      }

      await setMemberAccess(parsed.channelId, targetId, false);
      const fresh = await discordApi(`/channels/${parsed.channelId}`);
      return updateMessage(panelData(fresh, parsed.ownerId));
    }

    if (parsed.action === "manage") {
      const targetId = String(interaction?.data?.values?.[0] || "");
      if (!targetId || targetId === parsed.ownerId) {
        return ephemeral(t.selectOther);
      }

      return ephemeral(
        interpolate(t.memberMenu, { user: `<@${targetId}>` }),
        [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 2,
                label: "🚫 Забрать доступ",
                custom_id:
                  `pv:member_remove:${parsed.channelId}:${parsed.ownerId}:${targetId}`,
              },
              {
                type: 2,
                style: 2,
                label: "👢 Выгнать",
                custom_id:
                  `pv:member_kick:${parsed.channelId}:${parsed.ownerId}:${targetId}`,
              },
              {
                type: 2,
                style: 1,
                label: "👑 Передать владельца",
                custom_id:
                  `pv:member_transfer:${parsed.channelId}:${parsed.ownerId}:${targetId}`,
              },
            ],
          },
        ],
      );
    }

    if (parsed.action === "region") {
      const value = String(interaction?.data?.values?.[0] || "automatic");
      await discordApi(`/channels/${parsed.channelId}`, {
        method: "PATCH",
        body: {
          rtc_region: value === "automatic" ? null : value,
        },
        reason: "ISTesport private room region changed",
      });

      const fresh = await discordApi(`/channels/${parsed.channelId}`);
      return updateMessage(panelData(fresh, parsed.ownerId));
    }

    if (parsed.action === "member_remove") {
      if (!parsed.targetId || parsed.targetId === parsed.ownerId) {
        return ephemeral(t.selectOther);
      }

      await removeMemberAccess(parsed.channelId, parsed.targetId);
      await disconnectMember(
        String(channel.guild_id || interaction?.guild_id || ""),
        parsed.targetId,
        parsed.channelId,
      );
      await patchPanelMessage(parsed.channelId, parsed.ownerId);

      return updateMessage({
        content: interpolate(t.removeDone, {
          user: `<@${parsed.targetId}>`,
        }),
        components: [],
        allowed_mentions: { parse: [] },
      });
    }

    if (parsed.action === "member_kick") {
      if (!parsed.targetId || parsed.targetId === parsed.ownerId) {
        return ephemeral(t.selectOther);
      }

      await disconnectMember(
        String(channel.guild_id || interaction?.guild_id || ""),
        parsed.targetId,
        parsed.channelId,
      );

      return updateMessage({
        content: interpolate(t.kickDone, {
          user: `<@${parsed.targetId}>`,
        }),
        components: [],
        allowed_mentions: { parse: [] },
      });
    }

    if (parsed.action === "member_transfer") {
      if (!parsed.targetId || parsed.targetId === parsed.ownerId) {
        return ephemeral(t.selectOther);
      }

      await setMemberAccess(parsed.channelId, parsed.targetId, true);
      await setMemberAccess(parsed.channelId, parsed.ownerId, false);
      await patchPanelMessage(parsed.channelId, parsed.targetId);

      return updateMessage({
        content: interpolate(t.transferDone, {
          user: `<@${parsed.targetId}>`,
        }),
        components: [],
        allowed_mentions: { parse: [] },
      });
    }

    return ephemeral(t.actionFailed);
  } catch (error) {
    console.error(`private room component ${parsed.action} failed`, error);
    return ephemeral(t.actionFailed);
  }
}

export async function handlePrivateRoomModal(interaction: any) {
  const customId = String(interaction?.data?.custom_id || "");

  if (!customId.startsWith("pvmodal:")) return null;

  const parts = customId.split(":");
  const action = parts[1] || "";
  const channelId = parts[2] || "";
  const ownerId = parts[3] || "";

  const lang = localeFamily(interaction?.locale || interaction?.guild_locale);
  const t = text[lang];

  if (!channelId || !ownerId) return ephemeral(t.actionFailed);

  let guard;
  try {
    guard = await assertOwner(interaction, channelId, ownerId);
  } catch (error) {
    console.error("private room modal validation failed", error);
    return ephemeral(t.actionFailed);
  }

  if (!guard.ok) return guard.response;

  const value = modalValue(interaction);

  try {
    if (action === "rename") {
      const clean = value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);

      if (!clean) return ephemeral(t.actionFailed);

      await discordApi(`/channels/${channelId}`, {
        method: "PATCH",
        body: {
          name: `${ROOM_PREFIX}${clean}`.slice(0, 100),
        },
      });

      await patchPanelMessage(channelId, ownerId);
      return ephemeral(t.renameDone);
    }

    if (action === "limit") {
      const numeric = Number(value);
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > 99) {
        return ephemeral("Введите целое число от 0 до 99.");
      }

      await discordApi(`/channels/${channelId}`, {
        method: "PATCH",
        body: {
          user_limit: numeric,
        },
      });

      await patchPanelMessage(channelId, ownerId);
      return ephemeral(t.limitDone);
    }

    return ephemeral(t.actionFailed);
  } catch (error) {
    console.error(`private room modal ${action} failed`, error);
    return ephemeral(t.actionFailed);
  }
}
