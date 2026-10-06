import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const API = "https://discord.com/api/v10";
const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const db =
  URL && SERVICE
    ? createClient(
        URL,
        SERVICE,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      )
    : null;

const BRAND = 0xe30613;

const PERMISSIONS = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
};

const USER_ALLOW =
  PERMISSIONS.VIEW_CHANNEL |
  PERMISSIONS.SEND_MESSAGES |
  PERMISSIONS.EMBED_LINKS |
  PERMISSIONS.ATTACH_FILES |
  PERMISSIONS.READ_MESSAGE_HISTORY;

const CLOSED_USER_ALLOW =
  PERMISSIONS.VIEW_CHANNEL |
  PERMISSIONS.READ_MESSAGE_HISTORY;

const STAFF_ALLOW =
  USER_ALLOW |
  PERMISSIONS.MANAGE_CHANNELS;

type Language = "uk" | "en";

const copy = {
  uk: {
    disabled:
      "Модуль Tickets вимкнено.",
    created:
      "Тикет створено: {{channel}}",
    limit:
      "У вас уже максимальна кількість відкритих тикетів.",
    createFailed:
      "Не вдалося створити тикет. Перевірте права ISTe Bot.",
    missing:
      "Цей тикет не знайдено в системі.",
    staffOnly:
      "Ця дія доступна лише staff.",
    closeDenied:
      "Закрити тикет може його автор або staff.",
    closed:
      "Тикет закрито.",
    reopened:
      "Тикет знову відкрито.",
    deleteConfirm:
      "Видалити цей тикет назавжди? Канал буде видалено.",
    deleteButton:
      "Так, видалити",
    actionFailed:
      "Не вдалося виконати дію з тикетом.",
    introTitle:
      "🎫 Тикет підтримки",
    introText:
      "Опиши питання або проблему нижче. Staff отримає доступ до цього приватного каналу.",
    closeButton:
      "Закрити",
    reopenButton:
      "Відкрити знову",
    deleteButtonShort:
      "Видалити",
  },
  en: {
    disabled:
      "The Tickets module is disabled.",
    created:
      "Ticket created: {{channel}}",
    limit:
      "You already have the maximum number of open tickets.",
    createFailed:
      "Could not create the ticket. Check ISTe Bot permissions.",
    missing:
      "This ticket was not found in the system.",
    staffOnly:
      "This action is available to staff only.",
    closeDenied:
      "Only the ticket author or staff can close it.",
    closed:
      "Ticket closed.",
    reopened:
      "Ticket reopened.",
    deleteConfirm:
      "Delete this ticket permanently? The channel will be removed.",
    deleteButton:
      "Yes, delete",
    actionFailed:
      "Could not complete the ticket action.",
    introTitle:
      "🎫 Support ticket",
    introText:
      "Describe your question or issue below. Staff has access to this private channel.",
    closeButton:
      "Close",
    reopenButton:
      "Reopen",
    deleteButtonShort:
      "Delete",
  },
};

const text = (
  template: string,
  vars: Record<string, string | number>,
) =>
  template.replace(
    /\{\{(\w+)\}\}/g,
    (match, name) =>
      Object.prototype.hasOwnProperty.call(
        vars,
        name,
      )
        ? String(vars[name])
        : match,
  );

function actorId(interaction: any) {
  return String(
    interaction?.member?.user?.id ||
      interaction?.user?.id ||
      "",
  );
}

function actorName(interaction: any) {
  return String(
    interaction?.member?.nick ||
      interaction?.member?.user?.global_name ||
      interaction?.member?.user?.username ||
      interaction?.user?.global_name ||
      interaction?.user?.username ||
      "user",
  );
}

function customId(interaction: any) {
  return String(
    interaction?.data?.custom_id ||
      "",
  );
}

function has(
  raw: unknown,
  permission: bigint,
) {
  try {
    const bits =
      BigInt(
        String(
          raw ||
          "0",
        ),
      );

    return (
      (
        bits &
        PERMISSIONS.ADMINISTRATOR
      ) ===
        PERMISSIONS.ADMINISTRATOR ||
      (
        bits &
        permission
      ) ===
        permission
    );
  } catch {
    return false;
  }
}

function memberHasRole(
  interaction: any,
  roleId: string,
) {
  if (!roleId) return false;

  const roles =
    Array.isArray(
      interaction?.member?.roles,
    )
      ? interaction.member.roles.map(
          (role: unknown) =>
            String(role),
        )
      : [];

  return roles.includes(
    roleId,
  );
}

function ephemeral(
  content: string,
  components: unknown[] = [],
) {
  return {
    type: 4,
    data: {
      content,
      components,
      flags: 64,
      allowed_mentions: {
        parse: [],
      },
    },
  };
}

function updateMessage(
  lang: Language,
  status: "open" | "closed",
) {
  const t = copy[lang];

  return {
    type: 7,
    data: {
      embeds: [
        {
          title:
            t.introTitle,
          description:
            status ===
              "open"
              ? t.introText
              : t.closed,
          color:
            status ===
              "open"
              ? BRAND
              : 0x6b7280,
          footer: {
            text:
              "ISTe Tickets • istesport.com",
          },
          timestamp:
            new Date()
              .toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components:
            status ===
              "open"
              ? [
                  {
                    type: 2,
                    style: 4,
                    custom_id:
                      "iste:ticket:close",
                    label:
                      t.closeButton,
                    emoji: {
                      name: "🔒",
                    },
                  },
                ]
              : [
                  {
                    type: 2,
                    style: 3,
                    custom_id:
                      "iste:ticket:reopen",
                    label:
                      t.reopenButton,
                    emoji: {
                      name: "🔓",
                    },
                  },
                  {
                    type: 2,
                    style: 4,
                    custom_id:
                      "iste:ticket:delete",
                    label:
                      t.deleteButtonShort,
                    emoji: {
                      name: "🗑️",
                    },
                  },
                ],
        },
      ],
      allowed_mentions: {
        parse: [],
      },
    },
  };
}

async function discord(
  path: string,
  method = "GET",
  body?: unknown,
) {
  if (!TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN missing",
    );
  }

  const response =
    await fetch(
      `${API}${path}`,
      {
        method,
        headers: {
          Authorization:
            `Bot ${TOKEN}`,
          Accept:
            "application/json",
          ...(
            body
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}
          ),
        },
        body:
          body
            ? JSON.stringify(
                body,
              )
            : undefined,
      },
    );

  const payload =
    response.status ===
      204
      ? null
      : await response
          .json()
          .catch(
            () => null,
          );

  if (!response.ok) {
    throw Object.assign(
      new Error(
        payload?.message ||
        `Discord API ${response.status}`,
      ),
      {
        status:
          response.status,
        details:
          payload,
      },
    );
  }

  return payload;
}

async function loadSettings(
  guildId: string,
) {
  if (!db) {
    return null;
  }

  const {
    data,
    error,
  } = await db
    .from(
      "discord_guild_settings",
    )
    .select(
      "locale, tickets_enabled, admin_role_id, moderator_role_id, log_channel_id, config",
    )
    .eq(
      "guild_id",
      guildId,
    )
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const config =
    data.config &&
    typeof data.config ===
      "object"
      ? data.config
      : {};

  return {
    locale:
      data.locale ===
        "en"
        ? "en"
        : "uk",
    enabled:
      data.tickets_enabled ===
      true,
    adminRoleId:
      String(
        data.admin_role_id ||
        "",
      ),
    moderatorRoleId:
      String(
        data.moderator_role_id ||
        "",
      ),
    supportRoleId:
      String(
        config.ticketSupportRoleId ||
        "",
      ),
    categoryId:
      String(
        config.ticketCategoryId ||
        "",
      ),
    logChannelId:
      String(
        config.ticketLogChannelId ||
        data.log_channel_id ||
        "",
      ),
    maxOpenPerUser:
      Math.max(
        1,
        Math.min(
          5,
          Number(
            config.ticketMaxOpenPerUser ||
            1,
          ) ||
          1,
        ),
      ),
  };
}

function isStaff(
  interaction: any,
  settings: any,
) {
  return (
    has(
      interaction?.member?.permissions,
      PERMISSIONS.MANAGE_CHANNELS,
    ) ||
    memberHasRole(
      interaction,
      settings.adminRoleId,
    ) ||
    memberHasRole(
      interaction,
      settings.moderatorRoleId,
    ) ||
    memberHasRole(
      interaction,
      settings.supportRoleId,
    )
  );
}

function safeChannelName(
  value: string,
) {
  const name =
    String(
      value ||
      "user",
    )
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[^a-z0-9а-яіїєґ_-]+/giu,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      )
      .slice(
        0,
        35,
      );

  return name || "user";
}

function uniqueRoleIds(
  values: string[],
) {
  return [
    ...new Set(
      values.filter(
        (value) =>
          /^\d{17,20}$/.test(
            value,
          ),
      ),
    ),
  ];
}

async function ticketByChannel(
  guildId: string,
  channelId: string,
) {
  if (!db) return null;

  const {
    data,
  } = await db
    .from(
      "discord_tickets",
    )
    .select("*")
    .eq(
      "guild_id",
      guildId,
    )
    .eq(
      "channel_id",
      channelId,
    )
    .maybeSingle();

  return data || null;
}

async function writeAudit(
  guildId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  if (!db) return;

  try {
    await db
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          eventType,
        payload,
      });
  } catch (error) {
    console.error(
      "ticket audit failed",
      error,
    );
  }
}

async function sendLog(
  settings: any,
  title: string,
  fields: any[],
) {
  if (
    !settings.logChannelId
  ) {
    return;
  }

  try {
    await discord(
      `/channels/${settings.logChannelId}/messages`,
      "POST",
      {
        embeds: [
          {
            title,
            color:
              BRAND,
            fields,
            footer: {
              text:
                "ISTe Tickets",
            },
            timestamp:
              new Date()
                .toISOString(),
          },
        ],
        allowed_mentions: {
          parse: [],
        },
      },
    );
  } catch (error) {
    console.error(
      "ticket log failed",
      error,
    );
  }
}

async function createTicket(
  interaction: any,
  settings: any,
) {
  const lang =
    settings.locale as
      Language;
  const t =
    copy[lang];
  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );
  const openerId =
    actorId(interaction);

  if (
    !db ||
    !guildId ||
    !openerId
  ) {
    return ephemeral(
      t.createFailed,
    );
  }

  const {
    data: openRows,
    error: openError,
  } = await db
    .from(
      "discord_tickets",
    )
    .select(
      "id, channel_id",
    )
    .eq(
      "guild_id",
      guildId,
    )
    .eq(
      "opener_id",
      openerId,
    )
    .eq(
      "status",
      "open",
    )
    .limit(
      settings.maxOpenPerUser,
    );

  if (openError) {
    throw openError;
  }

  if (
    (
      openRows ||
      []
    ).length >=
    settings.maxOpenPerUser
  ) {
    const first =
      openRows?.[0];

    return ephemeral(
      first?.channel_id
        ? `${t.limit} <#${first.channel_id}>`
        : t.limit,
    );
  }

  const ticketId =
    crypto.randomUUID();

  const staffRoles =
    uniqueRoleIds([
      settings
        .supportRoleId,
      settings
        .adminRoleId,
      settings
        .moderatorRoleId,
    ]);

  const overwrites: any[] =
    [
      {
        id:
          guildId,
        type: 0,
        allow: "0",
        deny:
          String(
            PERMISSIONS.VIEW_CHANNEL,
          ),
      },
      {
        id:
          openerId,
        type: 1,
        allow:
          String(
            USER_ALLOW,
          ),
        deny: "0",
      },
      ...staffRoles.map(
        (roleId) => ({
          id:
            roleId,
          type: 0,
          allow:
            String(
              STAFF_ALLOW,
            ),
          deny: "0",
        }),
      ),
    ];

  const applicationId =
    String(
      interaction
        ?.application_id ||
      "",
    );

  if (
    /^\d{17,20}$/.test(
      applicationId,
    )
  ) {
    overwrites.push({
      id:
        applicationId,
      type: 1,
      allow:
        String(
          STAFF_ALLOW,
        ),
      deny: "0",
    });
  }

  const base =
    safeChannelName(
      actorName(
        interaction,
      ),
    );

  let channel: any = null;

  try {
    channel =
      await discord(
        `/guilds/${guildId}/channels`,
        "POST",
        {
          name:
            `ticket-${base}-${ticketId.slice(0, 4)}`
              .slice(
                0,
                100,
              ),
          type: 0,
          ...(
            /^\d{17,20}$/.test(
              settings.categoryId,
            )
              ? {
                  parent_id:
                    settings.categoryId,
                }
              : {}
          ),
          topic:
            `ISTe ticket | owner:${openerId} | id:${ticketId}`
              .slice(
                0,
                1024,
              ),
          permission_overwrites:
            overwrites,
        },
      );

    const {
      error:
        insertError,
    } = await db
      .from(
        "discord_tickets",
      )
      .insert({
        id:
          ticketId,
        guild_id:
          guildId,
        channel_id:
          String(
            channel.id,
          ),
        opener_id:
          openerId,
        status:
          "open",
      });

    if (insertError) {
      throw insertError;
    }

    const tControl =
      updateMessage(
        lang,
        "open",
      ).data;

    await discord(
      `/channels/${channel.id}/messages`,
      "POST",
      {
        content:
          `<@${openerId}>`,
        embeds:
          tControl.embeds,
        components:
          tControl.components,
        allowed_mentions: {
          parse: [],
          users: [
            openerId,
          ],
        },
      },
    );

    await writeAudit(
      guildId,
      "ticket.created",
      {
        ticket_id:
          ticketId,
        channel_id:
          String(
            channel.id,
          ),
        opener_id:
          openerId,
      },
    );

    await sendLog(
      settings,
      "🎫 Ticket created",
      [
        {
          name: "User",
          value:
            `<@${openerId}>`,
          inline: true,
        },
        {
          name: "Channel",
          value:
            `<#${channel.id}>`,
          inline: true,
        },
      ],
    );

    return ephemeral(
      text(
        t.created,
        {
          channel:
            `<#${channel.id}>`,
        },
      ),
    );
  } catch (error) {
    console.error(
      "ticket create failed",
      error,
    );

    if (
      channel?.id
    ) {
      await discord(
        `/channels/${channel.id}`,
        "DELETE",
      ).catch(
        () => null,
      );
    }

    return ephemeral(
      t.createFailed,
    );
  }
}

async function setOpenerAccess(
  channelId: string,
  openerId: string,
  open: boolean,
) {
  await discord(
    `/channels/${channelId}/permissions/${openerId}`,
    "PUT",
    {
      type: 1,
      allow:
        String(
          open
            ? USER_ALLOW
            : CLOSED_USER_ALLOW,
        ),
      deny:
        String(
          open
            ? 0n
            : PERMISSIONS.SEND_MESSAGES,
        ),
    },
  );
}

async function closeTicket(
  interaction: any,
  settings: any,
  ticket: any,
) {
  const lang =
    settings.locale as
      Language;
  const t =
    copy[lang];
  const actor =
    actorId(
      interaction,
    );

  if (
    actor !==
      String(
        ticket.opener_id,
      ) &&
    !isStaff(
      interaction,
      settings,
    )
  ) {
    return ephemeral(
      t.closeDenied,
    );
  }

  if (
    ticket.status !==
    "open"
  ) {
    return updateMessage(
      lang,
      "closed",
    );
  }

  await setOpenerAccess(
    String(
      ticket.channel_id,
    ),
    String(
      ticket.opener_id,
    ),
    false,
  );

  const channel =
    await discord(
      `/channels/${ticket.channel_id}`,
    ).catch(
      () => null,
    );

  if (channel?.name) {
    const current =
      String(
        channel.name,
      );

    if (
      !current.startsWith(
        "closed-",
      )
    ) {
      await discord(
        `/channels/${ticket.channel_id}`,
        "PATCH",
        {
          name:
            `closed-${current}`
              .slice(
                0,
                100,
              ),
        },
      ).catch(
        () => null,
      );
    }
  }

  const now =
    new Date()
      .toISOString();

  await db
    ?.from(
      "discord_tickets",
    )
    .update({
      status:
        "closed",
      closed_by:
        actor,
      closed_at:
        now,
      updated_at:
        now,
    })
    .eq(
      "id",
      ticket.id,
    );

  await writeAudit(
    String(
      ticket.guild_id,
    ),
    "ticket.closed",
    {
      ticket_id:
        ticket.id,
      channel_id:
        ticket.channel_id,
      opener_id:
        ticket.opener_id,
      actor_id:
        actor,
    },
  );

  await sendLog(
    settings,
    "🔒 Ticket closed",
    [
      {
        name: "Ticket",
        value:
          `<#${ticket.channel_id}>`,
        inline: true,
      },
      {
        name: "Closed by",
        value:
          actor
            ? `<@${actor}>`
            : "—",
        inline: true,
      },
    ],
  );

  return updateMessage(
    lang,
    "closed",
  );
}

async function reopenTicket(
  interaction: any,
  settings: any,
  ticket: any,
) {
  const lang =
    settings.locale as
      Language;
  const t =
    copy[lang];

  if (
    !isStaff(
      interaction,
      settings,
    )
  ) {
    return ephemeral(
      t.staffOnly,
    );
  }

  await setOpenerAccess(
    String(
      ticket.channel_id,
    ),
    String(
      ticket.opener_id,
    ),
    true,
  );

  const channel =
    await discord(
      `/channels/${ticket.channel_id}`,
    ).catch(
      () => null,
    );

  if (channel?.name) {
    const current =
      String(
        channel.name,
      );

    if (
      current.startsWith(
        "closed-",
      )
    ) {
      await discord(
        `/channels/${ticket.channel_id}`,
        "PATCH",
        {
          name:
            current
              .slice(
                7,
              )
              .slice(
                0,
                100,
              ),
        },
      ).catch(
        () => null,
      );
    }
  }

  const now =
    new Date()
      .toISOString();

  await db
    ?.from(
      "discord_tickets",
    )
    .update({
      status:
        "open",
      closed_by:
        null,
      closed_at:
        null,
      updated_at:
        now,
    })
    .eq(
      "id",
      ticket.id,
    );

  const actor =
    actorId(
      interaction,
    );

  await writeAudit(
    String(
      ticket.guild_id,
    ),
    "ticket.reopened",
    {
      ticket_id:
        ticket.id,
      channel_id:
        ticket.channel_id,
      actor_id:
        actor,
    },
  );

  await sendLog(
    settings,
    "🔓 Ticket reopened",
    [
      {
        name: "Ticket",
        value:
          `<#${ticket.channel_id}>`,
        inline: true,
      },
      {
        name: "Reopened by",
        value:
          actor
            ? `<@${actor}>`
            : "—",
        inline: true,
      },
    ],
  );

  return updateMessage(
    lang,
    "open",
  );
}

async function deleteTicket(
  interaction: any,
  settings: any,
  ticket: any,
) {
  const lang =
    settings.locale as
      Language;
  const t =
    copy[lang];

  if (
    !isStaff(
      interaction,
      settings,
    )
  ) {
    return ephemeral(
      t.staffOnly,
    );
  }

  const actor =
    actorId(
      interaction,
    );
  const now =
    new Date()
      .toISOString();

  await db
    ?.from(
      "discord_tickets",
    )
    .update({
      status:
        "deleted",
      deleted_by:
        actor,
      deleted_at:
        now,
      updated_at:
        now,
    })
    .eq(
      "id",
      ticket.id,
    );

  await writeAudit(
    String(
      ticket.guild_id,
    ),
    "ticket.deleted",
    {
      ticket_id:
        ticket.id,
      channel_id:
        ticket.channel_id,
      opener_id:
        ticket.opener_id,
      actor_id:
        actor,
    },
  );

  await sendLog(
    settings,
    "🗑️ Ticket deleted",
    [
      {
        name: "Channel ID",
        value:
          String(
            ticket.channel_id,
          ),
        inline: true,
      },
      {
        name: "Deleted by",
        value:
          actor
            ? `<@${actor}>`
            : "—",
        inline: true,
      },
      {
        name: "Owner",
        value:
          `<@${ticket.opener_id}>`,
        inline: true,
      },
    ],
  );

  await discord(
    `/channels/${ticket.channel_id}`,
    "DELETE",
  );

  return ephemeral(
    "✅",
  );
}

export async function handleTicketComponent(
  interaction: any,
) {
  const id =
    customId(
      interaction,
    );

  if (
    !id.startsWith(
      "iste:ticket:",
    )
  ) {
    return null;
  }

  const guildId =
    String(
      interaction?.guild_id ||
      "",
    );
  const channelId =
    String(
      interaction?.channel_id ||
      "",
    );

  const settings =
    await loadSettings(
      guildId,
    );

  const lang =
    (
      settings?.locale ===
        "en"
        ? "en"
        : "uk"
    ) as Language;
  const t =
    copy[lang];

  if (
    !settings ||
    !settings.enabled
  ) {
    return ephemeral(
      t.disabled,
    );
  }

  const action =
    id.slice(
      "iste:ticket:"
        .length,
    );

  if (
    action === "create"
  ) {
    return await createTicket(
      interaction,
      settings,
    );
  }

  const ticket =
    await ticketByChannel(
      guildId,
      channelId,
    );

  if (!ticket) {
    return ephemeral(
      t.missing,
    );
  }

  try {
    if (
      action === "close"
    ) {
      return await closeTicket(
        interaction,
        settings,
        ticket,
      );
    }

    if (
      action === "reopen"
    ) {
      return await reopenTicket(
        interaction,
        settings,
        ticket,
      );
    }

    if (
      action === "delete"
    ) {
      if (
        !isStaff(
          interaction,
          settings,
        )
      ) {
        return ephemeral(
          t.staffOnly,
        );
      }

      return ephemeral(
        t.deleteConfirm,
        [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                custom_id:
                  "iste:ticket:delete-confirm",
                label:
                  t.deleteButton,
                emoji: {
                  name: "🗑️",
                },
              },
            ],
          },
        ],
      );
    }

    if (
      action ===
      "delete-confirm"
    ) {
      return await deleteTicket(
        interaction,
        settings,
        ticket,
      );
    }
  } catch (error) {
    console.error(
      "ticket action failed",
      error,
    );

    return ephemeral(
      t.actionFailed,
    );
  }

  return null;
}
