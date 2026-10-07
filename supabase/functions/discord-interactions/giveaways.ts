import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const API =
  "https://discord.com/api/v10";

const TOKEN =
  Deno.env.get(
    "DISCORD_BOT_TOKEN",
  ) || "";

const URL =
  Deno.env.get(
    "SUPABASE_URL",
  ) || "";

const SERVICE =
  Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  ) || "";

const db =
  URL && SERVICE
    ? createClient(
        URL,
        SERVICE,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      )
    : null;

function ephemeral(
  content: string,
) {
  return {
    type: 4,
    data: {
      content,
      flags: 64,
      allowed_mentions: {
        parse: [],
      },
    },
  };
}

function actorId(
  interaction: any,
) {
  return String(
    interaction
      ?.member
      ?.user
      ?.id ||
      interaction
        ?.user
        ?.id ||
      "",
  );
}

function memberRoles(
  interaction: any,
) {
  return Array.isArray(
    interaction
      ?.member
      ?.roles,
  )
    ? interaction.member.roles.map(
        (
          value:
            unknown,
        ) =>
          String(value),
      )
    : [];
}

function isEnglish(
  interaction: any,
) {
  return String(
    interaction
      ?.locale ||
      "",
  )
    .toLowerCase()
    .startsWith(
      "en",
    );
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
      API + path,
      {
        method,
        headers: {
          Authorization:
            "Bot " + TOKEN,
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

  if (!response.ok) {
    const payload =
      await response
        .json()
        .catch(
          () => null,
        );

    throw new Error(
      payload?.message ||
      "Discord API " +
      String(
        response.status,
      ),
    );
  }

  return response.status ===
    204
    ? null
    : await response
        .json()
        .catch(
          () => null,
        );
}

function giveawayBody(
  giveaway: any,
  count: number,
  english: boolean,
) {
  const endsAt =
    new Date(
      giveaway.ends_at,
    );
  const unix =
    Math.floor(
      endsAt.getTime() /
      1000,
    );

  const fields: any[] = [
    {
      name:
        english
          ? "Winners"
          : "Переможців",
      value:
        String(
          giveaway
            .winner_count ||
          1,
        ),
      inline: true,
    },
    {
      name:
        english
          ? "Participants"
          : "Учасників",
      value:
        String(count),
      inline: true,
    },
    {
      name:
        english
          ? "Ends"
          : "Завершення",
      value:
        "<t:" +
        String(unix) +
        ":R>",
      inline: true,
    },
  ];

  const roleId =
    String(
      giveaway
        .required_role_id ||
      "",
    );

  if (
    /^[0-9]{17,20}$/.test(
      roleId,
    )
  ) {
    fields.push({
      name:
        english
          ? "Required role"
          : "Обов'язкова роль",
      value:
        "<@&" +
        roleId +
        ">",
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title:
          "🎁 " +
          String(
            giveaway.prize ||
            "ISTe Giveaway",
          ).slice(
            0,
            240,
          ),
        description:
          String(
            giveaway.description ||
            "",
          )
            .trim()
            .slice(
              0,
              3000,
            ),
        color: 0xe30613,
        fields,
        footer: {
          text:
            "ISTe Giveaways • istesport.com",
        },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            custom_id:
              "iste:giveaway:" +
              String(
                giveaway.id,
              ),
            label:
              english
                ? "Participate"
                : "Взяти участь",
            emoji: {
              name: "🎉",
            },
          },
        ],
      },
    ],
    allowed_mentions: {
      parse: [],
    },
  };
}

export async function handleGiveawayComponent(
  interaction: any,
) {
  const customId =
    String(
      interaction
        ?.data
        ?.custom_id ||
      "",
    );

  if (
    !customId.startsWith(
      "iste:giveaway:",
    )
  ) {
    return null;
  }

  const english =
    isEnglish(
      interaction,
    );

  const giveawayId =
    customId.slice(
      "iste:giveaway:"
        .length,
    );

  const guildId =
    String(
      interaction
        ?.guild_id ||
      "",
    );

  const userId =
    actorId(
      interaction,
    );

  if (
    !db ||
    !guildId ||
    !userId
  ) {
    return ephemeral(
      english
        ? "Giveaway is unavailable."
        : "Розіграш зараз недоступний.",
    );
  }

  const {
    data:
      giveaway,
    error:
      giveawayError,
  } = await db
    .from(
      "discord_giveaways",
    )
    .select("*")
    .eq(
      "id",
      giveawayId,
    )
    .eq(
      "guild_id",
      guildId,
    )
    .maybeSingle();

  if (
    giveawayError ||
    !giveaway
  ) {
    return ephemeral(
      english
        ? "Giveaway not found."
        : "Розіграш не знайдено.",
    );
  }

  if (
    giveaway.status !==
      "active" ||
    new Date(
      giveaway.ends_at,
    ).getTime() <=
      Date.now()
  ) {
    return ephemeral(
      english
        ? "This giveaway has ended."
        : "Цей розіграш уже завершено.",
    );
  }

  const requiredRoleId =
    String(
      giveaway
        .required_role_id ||
      "",
    );

  if (
    requiredRoleId &&
    !memberRoles(
      interaction,
    ).includes(
      requiredRoleId,
    )
  ) {
    return ephemeral(
      english
        ? "You need <@&" +
          requiredRoleId +
          "> to participate."
        : "Для участі потрібна роль <@&" +
          requiredRoleId +
          ">.",
    );
  }

  const {
    data:
      existing,
    error:
      existingError,
  } = await db
    .from(
      "discord_giveaway_participants",
    )
    .select(
      "user_id",
    )
    .eq(
      "giveaway_id",
      giveawayId,
    )
    .eq(
      "user_id",
      userId,
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let joined =
    false;

  if (existing) {
    const {
      error:
        deleteError,
    } = await db
      .from(
        "discord_giveaway_participants",
      )
      .delete()
      .eq(
        "giveaway_id",
        giveawayId,
      )
      .eq(
        "user_id",
        userId,
      );

    if (deleteError) {
      throw deleteError;
    }
  } else {
    const {
      error:
        insertError,
    } = await db
      .from(
        "discord_giveaway_participants",
      )
      .insert({
        giveaway_id:
          giveawayId,
        guild_id:
          guildId,
        user_id:
          userId,
      });

    if (insertError) {
      throw insertError;
    }

    joined = true;
  }

  const {
    count,
  } = await db
    .from(
      "discord_giveaway_participants",
    )
    .select(
      "user_id",
      {
        count: "exact",
        head: true,
      },
    )
    .eq(
      "giveaway_id",
      giveawayId,
    );

  if (
    /^[0-9]{17,20}$/.test(
      String(
        giveaway
          .channel_id ||
        "",
      ),
    ) &&
    /^[0-9]{17,20}$/.test(
      String(
        giveaway
          .message_id ||
        "",
      ),
    )
  ) {
    await discord(
      "/channels/" +
      giveaway.channel_id +
      "/messages/" +
      giveaway.message_id,
      "PATCH",
      giveawayBody(
        giveaway,
        count || 0,
        english,
      ),
    ).catch(
      () => null,
    );
  }

  try {
    await db
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          joined
            ? "giveaway.joined"
            : "giveaway.left",
        payload: {
          giveaway_id:
            giveawayId,
          user_id:
            userId,
        },
      });
  } catch {
    // Audit failure must not break participation.
  }

  return ephemeral(
    joined
      ? (
          english
            ? "🎉 You joined the giveaway."
            : "🎉 Ти береш участь у розіграші."
        )
      : (
          english
            ? "Participation cancelled."
            : "Участь у розіграші скасовано."
        ),
  );
}
