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

type Language =
  | "uk"
  | "ru"
  | "en";

const copy = {
  uk: {
    verificationDisabled:
      "Verification вимкнено на цьому сервері.",
    verificationMissing:
      "Verified роль не налаштована.",
    verified:
      "✅ Верифікацію пройдено. Доступ оновлено.",
    roleAdded:
      "✅ Роль <@&{{roleId}}> додано.",
    roleRemoved:
      "✅ Роль <@&{{roleId}}> знято.",
    roleUnavailable:
      "Ця роль більше не доступна для самостійного вибору.",
    rolesDisabled:
      "Button Roles вимкнено на цьому сервері.",
    manageRoleFailed:
      "ISTe Bot не може змінити цю роль. Перевірте право Manage Roles та позицію ролі бота.",
  },
  ru: {
    verificationDisabled:
      "Verification выключен на этом сервере.",
    verificationMissing:
      "Verified роль не настроена.",
    verified:
      "✅ Верификация пройдена. Доступ обновлён.",
    roleAdded:
      "✅ Роль <@&{{roleId}}> добавлена.",
    roleRemoved:
      "✅ Роль <@&{{roleId}}> снята.",
    roleUnavailable:
      "Эта роль больше не доступна для самостоятельного выбора.",
    rolesDisabled:
      "Button Roles выключен на этом сервере.",
    manageRoleFailed:
      "ISTe Bot не может изменить эту роль. Проверьте право Manage Roles и позицию роли бота.",
  },
  en: {
    verificationDisabled:
      "Verification is disabled on this server.",
    verificationMissing:
      "The verified role is not configured.",
    verified:
      "✅ Verification complete. Your access has been updated.",
    roleAdded:
      "✅ Role <@&{{roleId}}> added.",
    roleRemoved:
      "✅ Role <@&{{roleId}}> removed.",
    roleUnavailable:
      "This role is no longer available for self assignment.",
    rolesDisabled:
      "Button Roles are disabled on this server.",
    manageRoleFailed:
      "ISTe Bot cannot change this role. Check Manage Roles permission and bot role position.",
  },
};

function langOf(
  interaction: any,
): Language {
  const value =
    String(
      interaction?.locale ||
      interaction
        ?.guild_locale ||
      "",
    ).toLowerCase();

  if (
    value.startsWith(
      "uk",
    )
  ) {
    return "uk";
  }

  if (
    value.startsWith(
      "ru",
    )
  ) {
    return "ru";
  }

  return "en";
}

function interpolate(
  template: string,
  vars: Record<
    string,
    string | number
  >,
) {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (
      match,
      name,
    ) =>
      Object.prototype
        .hasOwnProperty.call(
          vars,
          name,
        )
        ? String(
            vars[name],
          )
        : match,
  );
}

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
        roles: [],
      },
    },
  };
}

async function discord(
  path: string,
  method = "GET",
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
        },
      },
    );

  if (!response.ok) {
    const payload =
      await response
        .json()
        .catch(
          () => null,
        );

    throw Object.assign(
      new Error(
        payload?.message ||
        `Discord API ${response.status}`,
      ),
      {
        status:
          response.status,
      },
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
      "config",
    )
    .eq(
      "guild_id",
      guildId,
    )
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    return null;
  }

  const config =
    data.config &&
    typeof data.config ===
      "object"
      ? data.config
      : {};

  return {
    verificationEnabled:
      config
        .verificationEnabled ===
      true,
    verificationRoleId:
      String(
        config
          .verificationRoleId ||
        "",
      ),
    verificationRemoveRoleId:
      String(
        config
          .verificationRemoveRoleId ||
        "",
      ),
    selfRolesEnabled:
      config
        .selfRolesEnabled ===
      true,
    selfRoleIds:
      Array.isArray(
        config.selfRoleIds,
      )
        ? config
            .selfRoleIds
            .map(
              (
                value:
                  unknown,
              ) =>
                String(
                  value,
                ),
            )
            .filter(
              (value:
                string) =>
                /^\d{17,20}$/.test(
                  value,
                ),
            )
            .slice(
              0,
              10,
            )
        : [],
  };
}

async function writeAudit(
  guildId: string,
  eventType: string,
  payload: Record<
    string,
    unknown
  >,
) {
  if (!db) {
    return;
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
          eventType,
        payload,
      });
  } catch (error) {
    console.error(
      "roles verification audit failed",
      error,
    );
  }
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
          role:
            unknown,
        ) =>
          String(role),
      )
    : [];
}

async function addRole(
  guildId: string,
  userId: string,
  roleId: string,
) {
  await discord(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    "PUT",
  );
}

async function removeRole(
  guildId: string,
  userId: string,
  roleId: string,
) {
  await discord(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    "DELETE",
  );
}

async function verify(
  interaction: any,
  settings: any,
  lang: Language,
) {
  const t =
    copy[lang];
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
  const roleId =
    settings
      .verificationRoleId;
  const removeRoleId =
    settings
      .verificationRemoveRoleId;

  if (
    !settings
      .verificationEnabled
  ) {
    return ephemeral(
      t.verificationDisabled,
    );
  }

  if (
    !/^\d{17,20}$/.test(
      roleId,
    )
  ) {
    return ephemeral(
      t.verificationMissing,
    );
  }

  try {
    await addRole(
      guildId,
      userId,
      roleId,
    );

    if (
      /^\d{17,20}$/.test(
        removeRoleId,
      ) &&
      removeRoleId !==
        roleId
    ) {
      await removeRole(
        guildId,
        userId,
        removeRoleId,
      ).catch(
        () => null,
      );
    }

    await writeAudit(
      guildId,
      "verification.completed",
      {
        user_id:
          userId,
        role_id:
          roleId,
        removed_role_id:
          removeRoleId ||
          null,
      },
    );

    return ephemeral(
      t.verified,
    );
  } catch (error) {
    console.error(
      "verification role update failed",
      error,
    );

    return ephemeral(
      t.manageRoleFailed,
    );
  }
}

async function toggleRole(
  interaction: any,
  settings: any,
  lang: Language,
  roleId: string,
) {
  const t =
    copy[lang];

  if (
    !settings
      .selfRolesEnabled
  ) {
    return ephemeral(
      t.rolesDisabled,
    );
  }

  if (
    !settings
      .selfRoleIds
      .includes(
        roleId,
      )
  ) {
    return ephemeral(
      t.roleUnavailable,
    );
  }

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
  const hasRole =
    memberRoles(
      interaction,
    ).includes(
      roleId,
    );

  try {
    if (hasRole) {
      await removeRole(
        guildId,
        userId,
        roleId,
      );
    } else {
      await addRole(
        guildId,
        userId,
        roleId,
      );
    }

    await writeAudit(
      guildId,
      hasRole
        ? "self_role.removed"
        : "self_role.added",
      {
        user_id:
          userId,
        role_id:
          roleId,
      },
    );

    return ephemeral(
      interpolate(
        hasRole
          ? t.roleRemoved
          : t.roleAdded,
        {
          roleId,
        },
      ),
    );
  } catch (error) {
    console.error(
      "self role update failed",
      error,
    );

    return ephemeral(
      t.manageRoleFailed,
    );
  }
}

export async function handleRolesVerificationComponent(
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
      "iste:verify:",
    ) &&
    !customId.startsWith(
      "iste:role:",
    )
  ) {
    return null;
  }

  const guildId =
    String(
      interaction
        ?.guild_id ||
      "",
    );

  if (!guildId) {
    return null;
  }

  const lang =
    langOf(
      interaction,
    );
  const settings =
    await loadSettings(
      guildId,
    );

  if (!settings) {
    return ephemeral(
      copy[lang]
        .manageRoleFailed,
    );
  }

  if (
    customId ===
    "iste:verify:confirm"
  ) {
    return await verify(
      interaction,
      settings,
      lang,
    );
  }

  const roleId =
    customId.slice(
      "iste:role:"
        .length,
    );

  if (
    /^\d{17,20}$/.test(
      roleId,
    )
  ) {
    return await toggleRole(
      interaction,
      settings,
      lang,
      roleId,
    );
  }

  return ephemeral(
    copy[lang]
      .roleUnavailable,
  );
}
