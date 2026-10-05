import {
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../api/lib/authCookies.js";
import { guardRequest } from "../api/lib/requestGuard.js";
import {
  readJsonBody,
  readQueryString,
} from "../api/lib/requestBody.js";
import { getSupabaseServerClient } from "../api/lib/supabaseServer.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const DISCORD_API =
  "https://discord.com/api/v10";

const DEFAULT_CLIENT_ID =
  "1545183724218359848";

const DEFAULT_SITE_URL =
  "https://www.istesport.com";

const DEFAULT_PERMISSIONS =
  "564049465142272";

const MANAGE_GUILD =
  0x20n;

const ADMINISTRATOR =
  0x8n;

const INTERNAL_GUILD_ID =
  "1334264628695404556";

function sendError(
  response,
  status,
  error,
  message,
) {
  return response
    .status(status)
    .json({
      ok: false,
      error,
      message,
    });
}

function sendGuardError(
  response,
  guard,
) {
  if (guard.allow) {
    response.setHeader(
      "Allow",
      guard.allow,
    );
  }

  return sendError(
    response,
    guard.status,
    guard.error,
    "Запит відхилено сервером.",
  );
}

function readConfig() {
  const siteUrl =
    (
      process.env
        .ISTE_SITE_URL ||
      process.env
        .PUBLIC_SITE_URL ||
      DEFAULT_SITE_URL
    )
      .trim()
      .replace(/\/$/, "");

  return {
    clientId:
      process.env
        .DISCORD_CLIENT_ID
        ?.trim() ||
      DEFAULT_CLIENT_ID,
    clientSecret:
      process.env
        .DISCORD_CLIENT_SECRET
        ?.trim() ||
      "",
    botToken:
      process.env
        .DISCORD_BOT_TOKEN
        ?.trim() ||
      "",
    permissions:
      process.env
        .DISCORD_PERMISSIONS
        ?.trim() ||
      DEFAULT_PERMISSIONS,
    siteUrl,
    redirectUri:
      process.env
        .DISCORD_OAUTH_REDIRECT_URI
        ?.trim() ||
      `${siteUrl}/api/owner?module=bot-portal&action=discord-callback`,
  };
}

function isSnowflake(value) {
  return /^[0-9]{17,20}$/.test(
    String(value || ""),
  );
}

function safeEqual(
  left,
  right,
) {
  const a =
    Buffer.from(
      String(left || ""),
    );

  const b =
    Buffer.from(
      String(right || ""),
    );

  return (
    a.length === b.length &&
    a.length > 0 &&
    timingSafeEqual(a, b)
  );
}

async function establishSession(
  supabase,
  accessToken,
  refreshToken,
) {
  if (
    accessToken &&
    refreshToken
  ) {
    const result =
      await supabase.auth
        .setSession({
          access_token:
            accessToken,
          refresh_token:
            refreshToken,
        });

    if (
      !result.error &&
      result.data?.session &&
      result.data?.user
    ) {
      return result;
    }
  }

  if (refreshToken) {
    return supabase.auth
      .refreshSession({
        refresh_token:
          refreshToken,
      });
  }

  return {
    data: null,
    error:
      new Error(
        "AUTH_REQUIRED",
      ),
  };
}

async function requireAccount(
  request,
  response,
) {
  const {
    accessToken,
    refreshToken,
  } =
    readAuthCookies(
      request,
    );

  if (!refreshToken) {
    clearAuthCookies(
      response,
    );

    return {
      ok: false,
      status: 401,
      error:
        "AUTH_REQUIRED",
      message:
        "Увійдіть в акаунт ISTe.",
    };
  }

  const supabase =
    getSupabaseServerClient();

  const sessionResult =
    await establishSession(
      supabase,
      accessToken,
      refreshToken,
    );

  if (
    sessionResult.error ||
    !sessionResult.data
      ?.session ||
    !sessionResult.data
      ?.user
  ) {
    clearAuthCookies(
      response,
    );

    return {
      ok: false,
      status: 401,
      error:
        "AUTH_REQUIRED",
      message:
        "Сесію завершено. Увійдіть знову.",
    };
  }

  setAuthCookies(
    response,
    sessionResult.data
      .session,
  );

  const user =
    sessionResult.data.user;

  const {
    data: access,
    error: accessError,
  } = await supabase
    .from("user_roles")
    .select(
      "role, is_blocked, blocked_reason",
    )
    .eq(
      "user_id",
      user.id,
    )
    .maybeSingle();

  if (accessError) {
    return {
      ok: false,
      status: 502,
      error:
        "ACCOUNT_CHECK_FAILED",
      message:
        "Не вдалося перевірити акаунт.",
    };
  }

  if (
    access?.is_blocked ===
    true
  ) {
    return {
      ok: false,
      status: 403,
      error:
        "ACCOUNT_BLOCKED",
      message:
        access
          .blocked_reason ||
        "Акаунт заблоковано.",
    };
  }

  return {
    ok: true,
    user,
    role:
      access?.role ||
      "user",
  };
}

function subscriptionActive(
  subscription,
) {
  if (!subscription) {
    return false;
  }

  if (
    [
      "free",
      "internal",
    ].includes(
      subscription.status,
    )
  ) {
    return true;
  }

  if (
    subscription.status !==
    "active"
  ) {
    return false;
  }

  if (
    !subscription.expires_at
  ) {
    return true;
  }

  return (
    new Date(
      subscription.expires_at,
    ).getTime() >
    Date.now()
  );
}

async function ensureSubscription(
  supabase,
  userId,
) {
  const {
    data: existing,
    error: readError,
  } = await supabase
    .from(
      "discord_subscriptions",
    )
    .select("*")
    .eq(
      "user_id",
      userId,
    )
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return existing;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "discord_subscriptions",
    )
    .insert({
      user_id:
        userId,
      plan: "free",
      status: "free",
      max_guilds: 1,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function normalizeSettings(
  row,
) {
  return {
    guildId:
      row?.guild_id || "",
    locale:
      row?.locale || "uk",
    adminRoleId:
      row?.admin_role_id || "",
    moderatorRoleId:
      row?.moderator_role_id ||
      "",
    memberRoleId:
      row?.member_role_id || "",
    logChannelId:
      row?.log_channel_id || "",
    welcomeChannelId:
      row
        ?.welcome_channel_id ||
      "",
    welcomeEnabled:
      row?.welcome_enabled ===
      true,
    moderationEnabled:
      row
        ?.moderation_enabled ===
      true,
    ticketsEnabled:
      row?.tickets_enabled ===
      true,
    privateVoiceEnabled:
      row
        ?.private_voice_enabled ===
      true,
    autoRolesEnabled:
      row
        ?.auto_roles_enabled ===
      true,
    config:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
        : {},
    updatedAt:
      row?.updated_at || null,
  };
}

function discordGuildIconUrl(
  guildId,
  icon,
) {
  if (!guildId || !icon) {
    return "";
  }

  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`;
}

async function discordRequest(
  path,
  {
    method = "GET",
    token = "",
    body = null,
    authType = "Bearer",
  } = {},
) {
  const response =
    await fetch(
      `${DISCORD_API}${path}`,
      {
        method,
        headers: {
          Authorization:
            `${authType} ${token}`,
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

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    throw Object.assign(
      new Error(
        result?.message ||
        `Discord API returned ${response.status}`,
      ),
      {
        status:
          response.status,
        details:
          result,
      },
    );
  }

  return result;
}

function makeInstallUrl(
  guildId,
) {
  const config =
    readConfig();

  const params =
    new URLSearchParams({
      client_id:
        config.clientId,
      scope:
        "bot applications.commands",
      permissions:
        config.permissions,
      guild_id:
        guildId,
      disable_guild_select:
        "true",
    });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function readOwnedLicense(
  supabase,
  userId,
  guildId,
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "discord_guild_licenses",
    )
    .select("*")
    .eq(
      "guild_id",
      guildId,
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    data &&
    data.user_id !==
      userId
  ) {
    return {
      ok: false,
      status: 409,
      error:
        "GUILD_LICENSE_TAKEN",
      message:
        "Цей Discord-сервер уже прив'язаний до іншої підписки.",
    };
  }

  return {
    ok: true,
    license:
      data || null,
  };
}

async function handleStatus(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["GET"],
        requireJson: false,
        requireOrigin: false,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return sendError(
      response,
      account.status,
      account.error,
      account.message,
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const subscription =
      await ensureSubscription(
        supabase,
        account.user.id,
      );

    const [
      discordAccountResult,
      guildsResult,
      licensesResult,
      settingsResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_customer_accounts",
          )
          .select("*")
          .eq(
            "user_id",
            account.user.id,
          )
          .maybeSingle(),
        supabase
          .from(
            "discord_customer_guilds",
          )
          .select("*")
          .eq(
            "user_id",
            account.user.id,
          )
          .eq(
            "can_manage",
            true,
          )
          .order(
            "guild_name",
            {
              ascending: true,
            },
          ),
        supabase
          .from(
            "discord_guild_licenses",
          )
          .select("*")
          .eq(
            "user_id",
            account.user.id,
          ),
        supabase
          .from(
            "discord_guild_settings",
          )
          .select("*")
          .eq(
            "owner_user_id",
            account.user.id,
          ),
      ]);

    for (
      const result
      of [
        discordAccountResult,
        guildsResult,
        licensesResult,
        settingsResult,
      ]
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    const guilds =
      Array.isArray(
        guildsResult.data,
      )
        ? guildsResult.data
        : [];

    const licenses =
      Array.isArray(
        licensesResult.data,
      )
        ? licensesResult.data
        : [];

    const settings =
      Array.isArray(
        settingsResult.data,
      )
        ? settingsResult.data
        : [];

    const guildIds =
      [
        ...new Set(
          [
            ...guilds.map(
              (item) =>
                item.guild_id,
            ),
            ...licenses.map(
              (item) =>
                item.guild_id,
            ),
          ],
        ),
      ];

    let installed =
      [];

    if (guildIds.length) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "discord_guilds",
        )
        .select(
          "guild_id, guild_name, guild_icon, active, member_count, locale, last_seen_at, updated_at",
        )
        .in(
          "guild_id",
          guildIds,
        );

      if (error) {
        throw error;
      }

      installed =
        Array.isArray(data)
          ? data
          : [];
    }

    const licenseMap =
      new Map(
        licenses.map(
          (item) => [
            item.guild_id,
            item,
          ],
        ),
      );

    const settingsMap =
      new Map(
        settings.map(
          (item) => [
            item.guild_id,
            item,
          ],
        ),
      );

    const installedMap =
      new Map(
        installed.map(
          (item) => [
            item.guild_id,
            item,
          ],
        ),
      );

    return response
      .status(200)
      .json({
        ok: true,
        oauthConfigured:
          Boolean(
            readConfig()
              .clientSecret,
          ),
        discordAccount:
          discordAccountResult
            .data
            ? {
                discordUserId:
                  discordAccountResult
                    .data
                    .discord_user_id,
                username:
                  discordAccountResult
                    .data
                    .discord_username,
                globalName:
                  discordAccountResult
                    .data
                    .discord_global_name,
                avatar:
                  discordAccountResult
                    .data
                    .discord_avatar,
                linkedAt:
                  discordAccountResult
                    .data
                    .linked_at,
                lastSyncedAt:
                  discordAccountResult
                    .data
                    .last_synced_at,
              }
            : null,
        subscription: {
          plan:
            subscription.plan,
          status:
            subscription.status,
          active:
            subscriptionActive(
              subscription,
            ),
          unlimited:
            subscription.plan ===
              "internal",
          fullAccess:
            subscription.plan ===
              "internal",
          startsAt:
            subscription
              .starts_at,
          expiresAt:
            subscription
              .expires_at,
          maxGuilds:
            subscription.plan ===
              "internal"
              ? null
              : subscription
                  .max_guilds,
          usedGuilds:
            licenses.filter(
              (license) =>
                [
                  "active",
                  "internal",
                ].includes(
                  license.status,
                ),
            ).length,
          subscriberRoleSynced:
            subscription
              .subscriber_role_synced ===
            true,
          subscriberRoleExpiresAt:
            subscription
              .subscriber_role_expires_at,
        },
        guilds:
          guilds.map(
            (guild) => {
              const license =
                licenseMap.get(
                  guild.guild_id,
                ) || null;

              const runtime =
                installedMap.get(
                  guild.guild_id,
                ) || null;

              return {
                guildId:
                  guild.guild_id,
                name:
                  guild.guild_name ||
                  runtime?.guild_name ||
                  "Discord Server",
                iconUrl:
                  discordGuildIconUrl(
                    guild.guild_id,
                    guild.guild_icon ||
                      runtime
                        ?.guild_icon,
                  ),
                isOwner:
                  guild.is_owner ===
                  true,
                permissions:
                  guild.permissions ||
                  "0",
                canManage:
                  guild.can_manage ===
                  true,
                licensed:
                  Boolean(
                    license,
                  ),
                license:
                  license
                    ? {
                        plan:
                          license.plan,
                        status:
                          license.status,
                        expiresAt:
                          license
                            .expires_at,
                      }
                    : null,
                installed:
                  runtime?.active ===
                  true,
                memberCount:
                  runtime
                    ?.member_count ??
                  null,
                settings:
                  settingsMap.has(
                    guild.guild_id,
                  )
                    ? normalizeSettings(
                        settingsMap.get(
                          guild.guild_id,
                        ),
                      )
                    : null,
              };
            },
          ),
      });
  } catch (error) {
    console.error(
      "Bot portal status error:",
      error,
    );

    return sendError(
      response,
      500,
      "BOT_PORTAL_STATUS_FAILED",
      "Не вдалося завантажити панель ISTe Bot.",
    );
  }
}

async function handleOauthStart(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: true,
        maxBodyBytes: 1024,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return sendError(
      response,
      account.status,
      account.error,
      account.message,
    );
  }

  const config =
    readConfig();

  if (
    !config.clientSecret
  ) {
    return sendError(
      response,
      503,
      "DISCORD_OAUTH_NOT_CONFIGURED",
      "Для Discord OAuth потрібно додати DISCORD_CLIENT_SECRET у Vercel.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const state =
      randomBytes(32)
        .toString("hex");

    const expiresAt =
      new Date(
        Date.now() +
        10 * 60 * 1000,
      ).toISOString();

    await supabase
      .from(
        "discord_oauth_states",
      )
      .delete()
      .lt(
        "expires_at",
        new Date()
          .toISOString(),
      );

    const { error } =
      await supabase
        .from(
          "discord_oauth_states",
        )
        .insert({
          state,
          user_id:
            account.user.id,
          expires_at:
            expiresAt,
        });

    if (error) {
      throw error;
    }

    const params =
      new URLSearchParams({
        client_id:
          config.clientId,
        redirect_uri:
          config.redirectUri,
        response_type:
          "code",
        scope:
          "identify guilds",
        state,
        prompt:
          "consent",
      });

    return response
      .status(200)
      .json({
        ok: true,
        authorizationUrl:
          `https://discord.com/oauth2/authorize?${params.toString()}`,
      });
  } catch (error) {
    console.error(
      "Discord oauth start error:",
      error,
    );

    return sendError(
      response,
      500,
      "DISCORD_OAUTH_START_FAILED",
      "Не вдалося почати підключення Discord.",
    );
  }
}

async function handleOauthCallback(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["GET"],
        requireJson: false,
        requireOrigin: false,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const config =
    readConfig();

  const state =
    readQueryString(
      request.query?.state,
      128,
    );

  const code =
    readQueryString(
      request.query?.code,
      512,
    );

  if (
    !state ||
    !code ||
    !config.clientSecret
  ) {
    return response
      .redirect(
        302,
        `${config.siteUrl}/bot/dashboard?discord=error`,
      );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
      );

    if (!account.ok) {
      return response
        .redirect(
          302,
          `${config.siteUrl}/login`,
        );
    }

    const supabase =
      getSupabaseAdminClient();

    const {
      data: stateRow,
      error: stateError,
    } = await supabase
      .from(
        "discord_oauth_states",
      )
      .select("*")
      .eq(
        "state",
        state,
      )
      .maybeSingle();

    if (
      stateError ||
      !stateRow ||
      stateRow.user_id !==
        account.user.id ||
      new Date(
        stateRow.expires_at,
      ).getTime() <=
        Date.now()
    ) {
      return response
        .redirect(
          302,
          `${config.siteUrl}/bot/dashboard?discord=state-error`,
        );
    }

    await supabase
      .from(
        "discord_oauth_states",
      )
      .delete()
      .eq(
        "state",
        state,
      );

    const tokenResponse =
      await fetch(
        `${DISCORD_API}/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body:
            new URLSearchParams({
              client_id:
                config.clientId,
              client_secret:
                config.clientSecret,
              grant_type:
                "authorization_code",
              code,
              redirect_uri:
                config.redirectUri,
            }),
        },
      );

    const tokenPayload =
      await tokenResponse
        .json()
        .catch(
          () => null,
        );

    if (
      !tokenResponse.ok ||
      !tokenPayload
        ?.access_token
    ) {
      throw new Error(
        "DISCORD_TOKEN_EXCHANGE_FAILED",
      );
    }

    const [
      discordUser,
      discordGuilds,
    ] =
      await Promise.all([
        discordRequest(
          "/users/@me",
          {
            token:
              tokenPayload
                .access_token,
          },
        ),
        discordRequest(
          "/users/@me/guilds",
          {
            token:
              tokenPayload
                .access_token,
          },
        ),
      ]);

    const now =
      new Date()
        .toISOString();

    const {
      error: accountError,
    } = await supabase
      .from(
        "discord_customer_accounts",
      )
      .upsert(
        {
          user_id:
            account.user.id,
          discord_user_id:
            String(
              discordUser.id,
            ),
          discord_username:
            String(
              discordUser.username ||
              "",
            ).slice(
              0,
              100,
            ),
          discord_global_name:
            String(
              discordUser
                .global_name ||
              "",
            ).slice(
              0,
              100,
            ),
          discord_avatar:
            discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
              : "",
          linked_at:
            now,
          last_synced_at:
            now,
        },
        {
          onConflict:
            "user_id",
        },
      );

    if (accountError) {
      throw accountError;
    }

    const manageable =
      (
        Array.isArray(
          discordGuilds,
        )
          ? discordGuilds
          : []
      )
        .map(
          (guild) => {
            let permissionBits =
              0n;

            try {
              permissionBits =
                BigInt(
                  guild.permissions ||
                  "0",
                );
            } catch {
              permissionBits =
                0n;
            }

            const canManage =
              guild.owner ===
                true ||
              (
                permissionBits &
                ADMINISTRATOR
              ) ===
                ADMINISTRATOR ||
              (
                permissionBits &
                MANAGE_GUILD
              ) ===
                MANAGE_GUILD;

            return {
              user_id:
                account.user.id,
              guild_id:
                String(
                  guild.id,
                ),
              guild_name:
                String(
                  guild.name ||
                  "Discord Server",
                ).slice(
                  0,
                  120,
                ),
              guild_icon:
                String(
                  guild.icon ||
                  "",
                ),
              permissions:
                String(
                  guild.permissions ||
                  "0",
                ),
              is_owner:
                guild.owner ===
                true,
              can_manage:
                canManage,
              last_synced_at:
                now,
            };
          },
        )
        .filter(
          (guild) =>
            guild.can_manage,
        );

    const {
      error: deleteError,
    } = await supabase
      .from(
        "discord_customer_guilds",
      )
      .delete()
      .eq(
        "user_id",
        account.user.id,
      );

    if (deleteError) {
      throw deleteError;
    }

    if (
      manageable.length
    ) {
      const {
        error: insertError,
      } = await supabase
        .from(
          "discord_customer_guilds",
        )
        .insert(
          manageable,
        );

      if (insertError) {
        throw insertError;
      }
    }

    await ensureSubscription(
      supabase,
      account.user.id,
    );

    return response
      .redirect(
        302,
        `${config.siteUrl}/bot/dashboard?discord=linked`,
      );
  } catch (error) {
    console.error(
      "Discord oauth callback error:",
      error,
    );

    return response
      .redirect(
        302,
        `${config.siteUrl}/bot/dashboard?discord=error`,
      );
  }
}

async function handleActivateGuild(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: true,
        maxBodyBytes: 4096,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return sendError(
      response,
      account.status,
      account.error,
      account.message,
    );
  }

  const body =
    readJsonBody(request);

  const guildId =
    typeof body?.guildId ===
      "string"
      ? body.guildId
          .trim()
      : "";

  if (
    !isSnowflake(
      guildId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data: guildAccess,
      error: guildError,
    } = await supabase
      .from(
        "discord_customer_guilds",
      )
      .select("*")
      .eq(
        "user_id",
        account.user.id,
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "can_manage",
        true,
      )
      .maybeSingle();

    if (
      guildError ||
      !guildAccess
    ) {
      return sendError(
        response,
        403,
        "GUILD_MANAGE_REQUIRED",
        "Discord не підтвердив право керування цим сервером.",
      );
    }

    const owned =
      await readOwnedLicense(
        supabase,
        account.user.id,
        guildId,
      );

    if (!owned.ok) {
      return sendError(
        response,
        owned.status,
        owned.error,
        owned.message,
      );
    }

    const subscription =
      await ensureSubscription(
        supabase,
        account.user.id,
      );

    if (
      !subscriptionActive(
        subscription,
      )
    ) {
      return sendError(
        response,
        402,
        "SUBSCRIPTION_REQUIRED",
        "Підписка ISTe Bot не активна.",
      );
    }

    if (
      !owned.license &&
      subscription.plan !==
        "internal"
    ) {
      const {
        count,
        error: countError,
      } = await supabase
        .from(
          "discord_guild_licenses",
        )
        .select(
          "guild_id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "user_id",
          account.user.id,
        )
        .in(
          "status",
          [
            "active",
            "internal",
          ],
        );

      if (countError) {
        throw countError;
      }

      if (
        Number(count || 0) >=
        Number(
          subscription.max_guilds ||
          1,
        )
      ) {
        return sendError(
          response,
          409,
          "GUILD_LIMIT_REACHED",
          "Ліміт Discord-серверів для поточного тарифу вичерпано.",
        );
      }
    }

    const now =
      new Date()
        .toISOString();

    const {
      error: licenseError,
    } = await supabase
      .from(
        "discord_guild_licenses",
      )
      .upsert(
        {
          guild_id:
            guildId,
          user_id:
            account.user.id,
          plan:
            subscription.plan,
          status:
            subscription.plan ===
              "internal"
              ? "internal"
              : "active",
          activated_at:
            owned.license
              ?.activated_at ||
            now,
          expires_at:
            subscription
              .expires_at,
          updated_at:
            now,
        },
        {
          onConflict:
            "guild_id",
        },
      );

    if (licenseError) {
      throw licenseError;
    }

    const {
      error: settingsError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .upsert(
        {
          guild_id:
            guildId,
          owner_user_id:
            account.user.id,
          updated_at:
            now,
        },
        {
          onConflict:
            "guild_id",
        },
      );

    if (settingsError) {
      throw settingsError;
    }

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        installUrl:
          makeInstallUrl(
            guildId,
          ),
      });
  } catch (error) {
    console.error(
      "Bot portal activate guild error:",
      error,
    );

    return sendError(
      response,
      500,
      "GUILD_ACTIVATION_FAILED",
      "Не вдалося активувати сервер для ISTe Bot.",
    );
  }
}

async function handleVerifyGuild(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: true,
        maxBodyBytes: 4096,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return sendError(
      response,
      account.status,
      account.error,
      account.message,
    );
  }

  const guildId =
    String(
      readJsonBody(request)
        ?.guildId ||
      "",
    ).trim();

  if (
    !isSnowflake(
      guildId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const owned =
      await readOwnedLicense(
        supabase,
        account.user.id,
        guildId,
      );

    if (
      !owned.ok ||
      !owned.license
    ) {
      return sendError(
        response,
        403,
        "GUILD_LICENSE_REQUIRED",
        "Спочатку активуйте цей сервер.",
      );
    }

    const config =
      readConfig();

    if (
      !config.botToken
    ) {
      return sendError(
        response,
        503,
        "DISCORD_BOT_TOKEN_MISSING",
        "ISTe Bot ще не налаштований на сервері застосунку.",
      );
    }

    const guild =
      await discordRequest(
        `/guilds/${guildId}?with_counts=true`,
        {
          token:
            config.botToken,
          authType: "Bot",
        },
      );

    const now =
      new Date()
        .toISOString();

    const payload = {
      guild_id:
        guildId,
      guild_name:
        String(
          guild?.name ||
          "Discord Server",
        ).slice(
          0,
          120,
        ),
      guild_icon:
        guild?.icon
          ? String(
              guild.icon,
            )
          : null,
      active: true,
      member_count:
        Number.isFinite(
          guild
            ?.approximate_member_count,
        )
          ? guild
              .approximate_member_count
          : null,
      removed_at: null,
      last_seen_at: now,
      updated_at: now,
    };

    const {
      error,
    } = await supabase
      .from(
        "discord_guilds",
      )
      .upsert(
        payload,
        {
          onConflict:
            "guild_id",
        },
      );

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        guild: {
          guildId,
          name:
            payload.guild_name,
          memberCount:
            payload.member_count,
          active: true,
        },
      });
  } catch (error) {
    console.error(
      "Bot portal verify guild error:",
      error,
    );

    if (
      error?.status ===
        403 ||
      error?.status ===
        404
    ) {
      return sendError(
        response,
        409,
        "BOT_NOT_IN_GUILD",
        "ISTe Bot ще не знайдено на цьому сервері. Додайте бота та повторіть перевірку.",
      );
    }

    return sendError(
      response,
      502,
      "GUILD_VERIFY_FAILED",
      "Не вдалося перевірити ISTe Bot на сервері.",
    );
  }
}

function readSnowflakeOrEmpty(
  value,
) {
  const text =
    typeof value ===
      "string"
      ? value.trim()
      : "";

  if (!text) {
    return {
      ok: true,
      value: "",
    };
  }

  if (
    !isSnowflake(text)
  ) {
    return {
      ok: false,
      value: "",
    };
  }

  return {
    ok: true,
    value: text,
  };
}

async function handleSaveSettings(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: true,
        maxBodyBytes: 16 * 1024,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return sendError(
      response,
      account.status,
      account.error,
      account.message,
    );
  }

  const body =
    readJsonBody(request) ||
    {};

  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();

  if (
    !isSnowflake(
      guildId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  const locale =
    body.locale ===
      "en"
      ? "en"
      : "uk";

  const fields = {
    adminRoleId:
      readSnowflakeOrEmpty(
        body.adminRoleId,
      ),
    moderatorRoleId:
      readSnowflakeOrEmpty(
        body.moderatorRoleId,
      ),
    memberRoleId:
      readSnowflakeOrEmpty(
        body.memberRoleId,
      ),
    logChannelId:
      readSnowflakeOrEmpty(
        body.logChannelId,
      ),
    welcomeChannelId:
      readSnowflakeOrEmpty(
        body.welcomeChannelId,
      ),
  };

  if (
    Object.values(
      fields,
    ).some(
      (item) =>
        !item.ok,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_DISCORD_ID",
      "ID ролі або каналу Discord має містити 17–20 цифр.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const owned =
      await readOwnedLicense(
        supabase,
        account.user.id,
        guildId,
      );

    if (
      !owned.ok ||
      !owned.license
    ) {
      return sendError(
        response,
        403,
        "GUILD_LICENSE_REQUIRED",
        "Немає активної ліцензії для цього сервера.",
      );
    }

    const now =
      new Date()
        .toISOString();

    const {
      data,
      error,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .upsert(
        {
          guild_id:
            guildId,
          owner_user_id:
            account.user.id,
          locale,
          admin_role_id:
            fields
              .adminRoleId
              .value,
          moderator_role_id:
            fields
              .moderatorRoleId
              .value,
          member_role_id:
            fields
              .memberRoleId
              .value,
          log_channel_id:
            fields
              .logChannelId
              .value,
          welcome_channel_id:
            fields
              .welcomeChannelId
              .value,
          welcome_enabled:
            body
              .welcomeEnabled ===
            true,
          moderation_enabled:
            body
              .moderationEnabled ===
            true,
          tickets_enabled:
            body
              .ticketsEnabled ===
            true,
          private_voice_enabled:
            body
              .privateVoiceEnabled ===
            true,
          auto_roles_enabled:
            body
              .autoRolesEnabled ===
            true,
          updated_at:
            now,
        },
        {
          onConflict:
            "guild_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        settings:
          normalizeSettings(
            data,
          ),
      });
  } catch (error) {
    console.error(
      "Bot portal settings save error:",
      error,
    );

    return sendError(
      response,
      500,
      "GUILD_SETTINGS_SAVE_FAILED",
      "Не вдалося зберегти налаштування сервера.",
    );
  }
}

async function handleWorkerConfig(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["GET"],
        requireJson: false,
        requireOrigin: false,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const config =
    readConfig();

  const auth =
    String(
      request.headers
        ?.authorization ||
      "",
    );

  const expected =
    config.botToken
      ? `Bot ${config.botToken}`
      : "";

  if (
    !config.botToken ||
    !safeEqual(
      auth,
      expected,
    )
  ) {
    return sendError(
      response,
      401,
      "BOT_AUTH_REQUIRED",
      "Bot authentication required.",
    );
  }

  const guildId =
    readQueryString(
      request.query?.guildId,
      24,
    );

  if (
    !isSnowflake(
      guildId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Invalid guild ID.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const [
      licenseResult,
      settingsResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_guild_licenses",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          )
          .maybeSingle(),
        supabase
          .from(
            "discord_guild_settings",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          )
          .maybeSingle(),
      ]);

    if (
      licenseResult.error ||
      settingsResult.error
    ) {
      throw (
        licenseResult.error ||
        settingsResult.error
      );
    }

    const license =
      licenseResult.data;

    const fallbackInternal =
      guildId ===
        INTERNAL_GUILD_ID &&
      !license;

    let active =
      fallbackInternal;

    if (license) {
      active =
        [
          "active",
          "internal",
        ].includes(
          license.status,
        ) &&
        (
          !license
            .expires_at ||
          new Date(
            license.expires_at,
          ).getTime() >
            Date.now()
        );
    }

    const settings =
      settingsResult.data
        ? normalizeSettings(
            settingsResult.data,
          )
        : {
            guildId,
            locale: "uk",
            memberRoleId: "",
            privateVoiceEnabled:
              fallbackInternal,
            autoRolesEnabled:
              fallbackInternal,
            welcomeEnabled: false,
            moderationEnabled: false,
            ticketsEnabled: false,
          };

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        active,
        plan:
          fallbackInternal
            ? "internal"
            : license?.plan ||
              "none",
        settings,
      });
  } catch (error) {
    console.error(
      "Worker config error:",
      error,
    );

    return sendError(
      response,
      500,
      "BOT_CONFIG_FAILED",
      "Could not load bot guild configuration.",
    );
  }
}

export default async function botPortalHandler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const rawAction =
    Array.isArray(
      request.query?.action,
    )
      ? request.query.action[0]
      : request.query?.action;

  const action =
    typeof rawAction ===
      "string"
      ? rawAction
          .trim()
          .toLowerCase()
      : "status";

  if (
    action === "status"
  ) {
    return handleStatus(
      request,
      response,
    );
  }

  if (
    action === "oauth-start"
  ) {
    return handleOauthStart(
      request,
      response,
    );
  }

  if (
    action ===
    "discord-callback"
  ) {
    return handleOauthCallback(
      request,
      response,
    );
  }

  if (
    action ===
    "activate-guild"
  ) {
    return handleActivateGuild(
      request,
      response,
    );
  }

  if (
    action ===
    "verify-guild"
  ) {
    return handleVerifyGuild(
      request,
      response,
    );
  }

  if (
    action ===
    "save-settings"
  ) {
    return handleSaveSettings(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-config"
  ) {
    return handleWorkerConfig(
      request,
      response,
    );
  }

  return sendError(
    response,
    404,
    "BOT_PORTAL_ACTION_NOT_FOUND",
    "Дію ISTe Bot Dashboard не знайдено.",
  );
}
