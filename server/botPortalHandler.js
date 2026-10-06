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
import { requireAdminOrOwner } from "../api/lib/ownerRequest.js";
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

const SUBSCRIBER_ROLE_NAME =
  "ISTe Bot Subscriber";

const PLAN_CATALOG =
  Object.freeze({
    free: {
      priceUsd: 0,
      maxGuilds: 1,
      features: [],
    },
    starter: {
      priceUsd: 2.99,
      maxGuilds: 1,
      features: [
        "auto_roles",
        "welcome",
        "moderation",
        "logs",
      ],
    },
    pro: {
      priceUsd: 4.99,
      maxGuilds: 3,
      features: [
        "auto_roles",
        "welcome",
        "moderation",
        "logs",
        "private_voice",
        "tickets",
        "applications",
        "faceit",
        "team",
      ],
    },
    max: {
      priceUsd: 6.99,
      maxGuilds: 10,
      features: [
        "auto_roles",
        "welcome",
        "moderation",
        "logs",
        "private_voice",
        "tickets",
        "applications",
        "faceit",
        "team",
        "giveaways",
        "highlights",
        "analytics",
      ],
    },
    internal: {
      priceUsd: 0,
      maxGuilds: null,
      features: ["*"],
    },
  });

const PAID_PLANS =
  new Set([
    "starter",
    "pro",
    "max",
  ]);

function normalizePlan(value) {
  const plan =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    plan ===
    "organization"
  ) {
    return "max";
  }

  return PLAN_CATALOG[plan]
    ? plan
    : "free";
}

function getPlanConfig(value) {
  const plan =
    normalizePlan(value);

  return {
    plan,
    ...PLAN_CATALOG[plan],
  };
}

function hasPlanFeature(
  plan,
  feature,
) {
  const config =
    getPlanConfig(plan);

  return (
    config.features.includes(
      "*",
    ) ||
    config.features.includes(
      feature,
    )
  );
}

function licenseActive(
  license,
) {
  if (!license) {
    return false;
  }

  if (
    ![
      "active",
      "internal",
    ].includes(
      license.status,
    )
  ) {
    return false;
  }

  if (
    !license.expires_at
  ) {
    return true;
  }

  return (
    new Date(
      license.expires_at,
    ).getTime() >
    Date.now()
  );
}

function sanitizeSettingsForPlan(
  settings,
  plan,
) {
  const source =
    settings || {};

  return {
    ...source,
    autoRolesEnabled:
      hasPlanFeature(
        plan,
        "auto_roles",
      )
        ? source
            .autoRolesEnabled ===
          true
        : false,
    privateVoiceEnabled:
      hasPlanFeature(
        plan,
        "private_voice",
      )
        ? source
            .privateVoiceEnabled ===
          true
        : false,
    welcomeEnabled:
      hasPlanFeature(
        plan,
        "welcome",
      )
        ? source
            .welcomeEnabled ===
          true
        : false,
    moderationEnabled:
      hasPlanFeature(
        plan,
        "moderation",
      )
        ? source
            .moderationEnabled ===
          true
        : false,
    ticketsEnabled:
      hasPlanFeature(
        plan,
        "tickets",
      )
        ? source
            .ticketsEnabled ===
          true
        : false,
  };
}

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
    subscriberRoleId:
      process.env
        .DISCORD_SUBSCRIBER_ROLE_ID
        ?.trim() ||
      "",
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
  role = "user",
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

  if (role === "owner") {
    if (
      existing?.plan ===
        "internal" &&
      existing?.status ===
        "internal" &&
      !existing?.expires_at
    ) {
      return existing;
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "discord_subscriptions",
      )
      .upsert(
        {
          user_id:
            userId,
          plan:
            "internal",
          status:
            "internal",
          starts_at:
            existing
              ?.starts_at ||
            new Date()
              .toISOString(),
          expires_at: null,
          max_guilds: 50,
          subscriber_role_expires_at:
            null,
          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "user_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
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

async function expireSubscriptionIfNeeded(
  supabase,
  subscription,
) {
  if (
    !subscription ||
    !PAID_PLANS.has(
      normalizePlan(
        subscription.plan,
      ),
    ) ||
    subscription.status !==
      "active" ||
    !subscription.expires_at ||
    new Date(
      subscription.expires_at,
    ).getTime() >
      Date.now()
  ) {
    return subscription;
  }

  const now =
    new Date()
      .toISOString();

  const {
    data,
    error,
  } = await supabase
    .from(
      "discord_subscriptions",
    )
    .update({
      status: "expired",
      updated_at: now,
    })
    .eq(
      "user_id",
      subscription.user_id,
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from(
      "discord_guild_licenses",
    )
    .update({
      status: "expired",
      updated_at: now,
    })
    .eq(
      "user_id",
      subscription.user_id,
    )
    .neq(
      "status",
      "internal",
    );

  return data;
}

async function getSubscriberRoleId(
  config,
) {
  if (
    config.subscriberRoleId
  ) {
    return config
      .subscriberRoleId;
  }

  const roles =
    await discordRequest(
      `/guilds/${INTERNAL_GUILD_ID}/roles`,
      {
        token:
          config.botToken,
        authType: "Bot",
      },
    );

  const existing =
    (
      Array.isArray(roles)
        ? roles
        : []
    ).find(
      (role) =>
        role.name ===
        SUBSCRIBER_ROLE_NAME,
    );

  if (existing?.id) {
    return String(
      existing.id,
    );
  }

  const created =
    await discordRequest(
      `/guilds/${INTERNAL_GUILD_ID}/roles`,
      {
        method: "POST",
        token:
          config.botToken,
        authType: "Bot",
        body: {
          name:
            SUBSCRIBER_ROLE_NAME,
          color:
            14878227,
          hoist: false,
          mentionable: false,
          reason:
            "ISTe Bot paid subscriber role",
        },
      },
    );

  return String(
    created?.id || "",
  );
}

async function syncSubscriberRole(
  supabase,
  subscription,
  discordAccount,
) {
  const plan =
    normalizePlan(
      subscription?.plan,
    );

  if (
    !subscription ||
    plan === "internal" ||
    !discordAccount
      ?.discord_user_id
  ) {
    return {
      synced:
        subscription
          ?.subscriber_role_synced ===
        true,
      skipped: true,
    };
  }

  const config =
    readConfig();

  if (!config.botToken) {
    return {
      synced: false,
      skipped: true,
      reason:
        "DISCORD_BOT_TOKEN_MISSING",
    };
  }

  const paidActive =
    PAID_PLANS.has(
      plan,
    ) &&
    subscriptionActive(
      subscription,
    );

  try {
    await discordRequest(
      `/guilds/${INTERNAL_GUILD_ID}/members/${discordAccount.discord_user_id}`,
      {
        token:
          config.botToken,
        authType: "Bot",
      },
    );

    const roleId =
      await getSubscriberRoleId(
        config,
      );

    if (!roleId) {
      throw new Error(
        "SUBSCRIBER_ROLE_NOT_FOUND",
      );
    }

    if (paidActive) {
      await discordRequest(
        `/guilds/${INTERNAL_GUILD_ID}/members/${discordAccount.discord_user_id}/roles/${roleId}`,
        {
          method: "PUT",
          token:
            config.botToken,
          authType: "Bot",
        },
      );
    } else if (
      subscription
        .subscriber_role_synced
    ) {
      await discordRequest(
        `/guilds/${INTERNAL_GUILD_ID}/members/${discordAccount.discord_user_id}/roles/${roleId}`,
        {
          method: "DELETE",
          token:
            config.botToken,
          authType: "Bot",
        },
      );
    }

    const synced =
      paidActive;

    const {
      error,
    } = await supabase
      .from(
        "discord_subscriptions",
      )
      .update({
        subscriber_role_synced:
          synced,
        subscriber_role_expires_at:
          paidActive
            ? subscription
                .expires_at
            : null,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "user_id",
        subscription.user_id,
      );

    if (error) {
      throw error;
    }

    return {
      synced,
      skipped: false,
    };
  } catch (error) {
    console.error(
      "Subscriber role sync error:",
      {
        userId:
          subscription.user_id,
        discordUserId:
          discordAccount
            .discord_user_id,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    return {
      synced: false,
      skipped: false,
      reason:
        "ROLE_SYNC_FAILED",
    };
  }
}

async function reconcileGuildLicenses(
  supabase,
  userId,
  plan,
  expiresAt,
) {
  const config =
    getPlanConfig(plan);

  const {
    data: licenses,
    error,
  } = await supabase
    .from(
      "discord_guild_licenses",
    )
    .select("*")
    .eq(
      "user_id",
      userId,
    )
    .order(
      "activated_at",
      {
        ascending: true,
      },
    );

  if (error) {
    throw error;
  }

  const rows =
    Array.isArray(
      licenses,
    )
      ? licenses
      : [];

  const limit =
    config.maxGuilds;

  for (
    let index = 0;
    index < rows.length;
    index += 1
  ) {
    const license =
      rows[index];

    const active =
      limit === null ||
      index < limit;

    const {
      error: updateError,
    } = await supabase
      .from(
        "discord_guild_licenses",
      )
      .update({
        plan:
          config.plan,
        status:
          config.plan ===
            "internal"
            ? "internal"
            : active
              ? "active"
              : "suspended",
        expires_at:
          config.plan ===
            "internal"
            ? null
            : expiresAt,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "guild_id",
        license.guild_id,
      );

    if (updateError) {
      throw updateError;
    }
  }
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
    matchChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .matchChannelId ||
            "",
          )
        : "",
    welcomeTitle:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .welcomeTitle ||
            "",
          )
        : "",
    welcomeMessage:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .welcomeMessage ||
            "",
          )
        : "",
    welcomeMention:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .welcomeMention !==
          false
        : true,
    welcomeShowMemberCount:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .welcomeShowMemberCount !==
          false
        : true,
    moderationClearEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .moderationClearEnabled !==
          false
        : true,
    moderationTimeoutEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .moderationTimeoutEnabled !==
          false
        : true,
    ticketPanelChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketPanelChannelId ||
            "",
          )
        : "",
    ticketCategoryId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketCategoryId ||
            "",
          )
        : "",
    ticketSupportRoleId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketSupportRoleId ||
            "",
          )
        : "",
    ticketLogChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketLogChannelId ||
            "",
          )
        : "",
    ticketPanelTitle:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketPanelTitle ||
            "",
          )
        : "",
    ticketPanelMessage:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .ticketPanelMessage ||
            "",
          )
        : "",
    ticketMaxOpenPerUser:
      row?.config &&
      typeof row.config ===
        "object"
        ? Math.max(
            1,
            Math.min(
              5,
              Number(
                row.config
                  .ticketMaxOpenPerUser ||
                1,
              ) ||
              1,
            ),
          )
        : 1,
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

    let subscription =
      await ensureSubscription(
        supabase,
        account.user.id,
        account.role,
      );

    subscription =
      await expireSubscriptionIfNeeded(
        supabase,
        subscription,
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

    const roleSync =
      await syncSubscriberRole(
        supabase,
        subscription,
        discordAccountResult
          .data,
      );

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
        planCatalog:
          Object.entries(
            PLAN_CATALOG,
          )
            .filter(
              ([plan]) =>
                plan !==
                "internal",
            )
            .map(
              ([
                plan,
                config,
              ]) => ({
                plan,
                priceUsd:
                  config.priceUsd,
                maxGuilds:
                  config.maxGuilds,
                features:
                  config.features,
              }),
            ),
        subscription: {
          plan:
            normalizePlan(
              subscription.plan,
            ),
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
          features:
            getPlanConfig(
              subscription.plan,
            ).features,
          subscriberRoleSynced:
            roleSync.synced ===
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
        account.role,
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

  const welcomeTitle =
    String(
      body.welcomeTitle ||
      "",
    )
      .trim()
      .slice(0, 80);

  const welcomeMessage =
    String(
      body.welcomeMessage ||
      "",
    )
      .trim()
      .slice(0, 500);

  const ticketPanelTitle =
    String(
      body.ticketPanelTitle ||
      "",
    )
      .trim()
      .slice(0, 80);

  const ticketPanelMessage =
    String(
      body.ticketPanelMessage ||
      "",
    )
      .trim()
      .slice(0, 500);

  const ticketMaxOpenPerUser =
    Math.max(
      1,
      Math.min(
        5,
        Math.round(
          Number(
            body.ticketMaxOpenPerUser ||
            1,
          ) ||
          1,
        ),
      ),
    );

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
    matchChannelId:
      readSnowflakeOrEmpty(
        body.matchChannelId,
      ),
    ticketPanelChannelId:
      readSnowflakeOrEmpty(
        body.ticketPanelChannelId,
      ),
    ticketCategoryId:
      readSnowflakeOrEmpty(
        body.ticketCategoryId,
      ),
    ticketSupportRoleId:
      readSnowflakeOrEmpty(
        body.ticketSupportRoleId,
      ),
    ticketLogChannelId:
      readSnowflakeOrEmpty(
        body.ticketLogChannelId,
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
      !owned.license ||
      !licenseActive(
        owned.license,
      )
    ) {
      return sendError(
        response,
        403,
        "GUILD_LICENSE_REQUIRED",
        "Немає активної ліцензії для цього сервера.",
      );
    }

    let subscription =
      await ensureSubscription(
        supabase,
        account.user.id,
        account.role,
      );

    subscription =
      await expireSubscriptionIfNeeded(
        supabase,
        subscription,
      );

    const featureChecks = [
      [
        body.autoRolesEnabled,
        "auto_roles",
      ],
      [
        body.privateVoiceEnabled,
        "private_voice",
      ],
      [
        body.welcomeEnabled,
        "welcome",
      ],
      [
        body.moderationEnabled,
        "moderation",
      ],
      [
        body.ticketsEnabled,
        "tickets",
      ],
    ];

    const lockedFeature =
      featureChecks.find(
        ([
          enabled,
          feature,
        ]) =>
          enabled === true &&
          !hasPlanFeature(
            subscription.plan,
            feature,
          ),
      );

    if (lockedFeature) {
      return sendError(
        response,
        402,
        "FEATURE_REQUIRES_PLAN",
        "Ця функція недоступна на поточному тарифі ISTe Bot.",
      );
    }

    const {
      data:
        existingSettings,
      error:
        existingSettingsError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .select("config")
      .eq(
        "guild_id",
        guildId,
      )
      .maybeSingle();

    if (
      existingSettingsError
    ) {
      throw existingSettingsError;
    }

    const existingConfig =
      existingSettings
        ?.config &&
      typeof existingSettings
        .config ===
        "object"
        ? existingSettings
            .config
        : {};

    const nextConfig = {
      ...existingConfig,
      matchChannelId:
        fields
          .matchChannelId
          .value,
      welcomeTitle,
      welcomeMessage,
      welcomeMention:
        body.welcomeMention !==
        false,
      welcomeShowMemberCount:
        body
          .welcomeShowMemberCount !==
        false,
      moderationClearEnabled:
        body
          .moderationClearEnabled !==
        false,
      moderationTimeoutEnabled:
        body
          .moderationTimeoutEnabled !==
        false,
      ticketPanelChannelId:
        fields
          .ticketPanelChannelId
          .value,
      ticketCategoryId:
        fields
          .ticketCategoryId
          .value,
      ticketSupportRoleId:
        fields
          .ticketSupportRoleId
          .value,
      ticketLogChannelId:
        fields
          .ticketLogChannelId
          .value,
      ticketPanelTitle,
      ticketPanelMessage,
      ticketMaxOpenPerUser,
    };

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
          config:
            nextConfig,
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

async function handleGuildResources(
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

  if (!isSnowflake(guildId)) {
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

    const [
      accessResult,
      owned,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_customer_guilds",
          )
          .select(
            "guild_id, can_manage",
          )
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
          .maybeSingle(),
        readOwnedLicense(
          supabase,
          account.user.id,
          guildId,
        ),
      ]);

    if (
      accessResult.error ||
      !accessResult.data
    ) {
      return sendError(
        response,
        403,
        "GUILD_MANAGE_REQUIRED",
        "Discord не підтвердив право керування цим сервером.",
      );
    }

    if (
      !owned.ok ||
      !owned.license
    ) {
      return sendError(
        response,
        403,
        "GUILD_LICENSE_REQUIRED",
        "Спочатку активуйте ліцензію для цього сервера.",
      );
    }

    const config =
      readConfig();

    if (!config.botToken) {
      return sendError(
        response,
        503,
        "DISCORD_BOT_TOKEN_MISSING",
        "ISTe Bot ще не налаштований на сервері застосунку.",
      );
    }

    const [
      roles,
      channels,
    ] =
      await Promise.all([
        discordRequest(
          `/guilds/${guildId}/roles`,
          {
            token:
              config.botToken,
            authType: "Bot",
          },
        ),
        discordRequest(
          `/guilds/${guildId}/channels`,
          {
            token:
              config.botToken,
            authType: "Bot",
          },
        ),
      ]);

    const normalizedRoles =
      (
        Array.isArray(roles)
          ? roles
          : []
      )
        .filter(
          (role) =>
            role.id !==
              guildId &&
            role.managed !==
              true,
        )
        .sort(
          (left, right) =>
            Number(
              right.position ||
              0,
            ) -
            Number(
              left.position ||
              0,
            ),
        )
        .map(
          (role) => ({
            id:
              String(role.id),
            name:
              String(
                role.name ||
                "Role",
              ),
            color:
              Number(
                role.color ||
                0,
              ),
            position:
              Number(
                role.position ||
                0,
              ),
          }),
        );

    const normalizedCategories =
      (
        Array.isArray(
          channels,
        )
          ? channels
          : []
      )
        .filter(
          (channel) =>
            Number(
              channel.type,
            ) === 4,
        )
        .sort(
          (left, right) =>
            Number(
              left.position ||
              0,
            ) -
            Number(
              right.position ||
              0,
            ),
        )
        .map(
          (channel) => ({
            id:
              String(
                channel.id,
              ),
            name:
              String(
                channel.name ||
                "category",
              ),
          }),
        );

    const normalizedChannels =
      (
        Array.isArray(
          channels,
        )
          ? channels
          : []
      )
        .filter(
          (channel) =>
            [
              0,
              5,
            ].includes(
              Number(
                channel.type,
              ),
            ),
        )
        .sort(
          (left, right) =>
            Number(
              left.position ||
              0,
            ) -
            Number(
              right.position ||
              0,
            ),
        )
        .map(
          (channel) => ({
            id:
              String(
                channel.id,
              ),
            name:
              String(
                channel.name ||
                "channel",
              ),
            type:
              Number(
                channel.type,
              ),
          }),
        );

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        roles:
          normalizedRoles,
        channels:
          normalizedChannels,
        categories:
          normalizedCategories,
      });
  } catch (error) {
    console.error(
      "Guild resources error:",
      error,
    );

    if (
      error?.status ===
      401
    ) {
      return sendError(
        response,
        502,
        "DISCORD_BOT_TOKEN_INVALID",
        "Discord відхилив токен ISTe Bot. Перевірте DISCORD_BOT_TOKEN у Vercel.",
      );
    }

    if (
      error?.status ===
      403
    ) {
      return sendError(
        response,
        409,
        "DISCORD_GUILD_FORBIDDEN",
        "ISTe Bot бачить Discord API, але не має доступу до ресурсів цього сервера. Перевірте, що саме цей бот встановлений на сервері та має доступ до каналів.",
      );
    }

    if (
      error?.status ===
      404
    ) {
      return sendError(
        response,
        409,
        "DISCORD_GUILD_NOT_FOUND",
        "Discord не знайшов цей сервер для ISTe Bot. Найімовірніше, бот не встановлений на цьому сервері або використовується інший Discord application.",
      );
    }

    return sendError(
      response,
      502,
      "GUILD_RESOURCES_FAILED",
      error instanceof Error &&
      error.message
        ? `Discord resources error: ${error.message}`
        : "Не вдалося завантажити ролі та канали Discord.",
    );
  }
}

async function handlePublishTicketPanel(
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

  if (!isSnowflake(guildId)) {
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

    const [
      owned,
      settingsResult,
    ] =
      await Promise.all([
        readOwnedLicense(
          supabase,
          account.user.id,
          guildId,
        ),
        supabase
          .from(
            "discord_guild_settings",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          )
          .eq(
            "owner_user_id",
            account.user.id,
          )
          .maybeSingle(),
      ]);

    if (
      !owned.ok ||
      !owned.license ||
      !licenseActive(
        owned.license,
      )
    ) {
      return sendError(
        response,
        403,
        "GUILD_LICENSE_REQUIRED",
        "Немає активної ліцензії для цього сервера.",
      );
    }

    if (
      settingsResult.error ||
      !settingsResult.data
    ) {
      return sendError(
        response,
        404,
        "GUILD_SETTINGS_NOT_FOUND",
        "Спочатку збережіть налаштування сервера.",
      );
    }

    const settings =
      normalizeSettings(
        settingsResult.data,
      );

    if (!settings.ticketsEnabled) {
      return sendError(
        response,
        409,
        "TICKETS_DISABLED",
        "Спочатку увімкніть модуль Tickets.",
      );
    }

    if (
      !isSnowflake(
        settings
          .ticketPanelChannelId,
      )
    ) {
      return sendError(
        response,
        400,
        "TICKET_PANEL_CHANNEL_REQUIRED",
        "Оберіть канал панелі тикетів.",
      );
    }

    const config =
      readConfig();

    if (!config.botToken) {
      return sendError(
        response,
        503,
        "DISCORD_BOT_TOKEN_MISSING",
        "ISTe Bot не має Discord токена.",
      );
    }

    const language =
      settings.locale ===
        "en"
        ? "en"
        : "uk";

    const title =
      settings.ticketPanelTitle ||
      (
        language === "en"
          ? "ISTe Support"
          : "Підтримка ISTe"
      );

    const description =
      settings.ticketPanelMessage ||
      (
        language === "en"
          ? "Press the button below to create a private support ticket."
          : "Натисни кнопку нижче, щоб створити приватний тикет зі staff."
      );

    const messageBody = {
      embeds: [
        {
          title:
            title.slice(
              0,
              256,
            ),
          description:
            description.slice(
              0,
              4096,
            ),
          color: 0xe30613,
          footer: {
            text:
              "ISTe Tickets • istesport.com",
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
                "iste:ticket:create",
              label:
                language ===
                  "en"
                  ? "Create ticket"
                  : "Створити тикет",
              emoji: {
                name: "🎫",
              },
            },
          ],
        },
      ],
      allowed_mentions: {
        parse: [],
      },
    };

    const rawConfig =
      settingsResult.data
        .config &&
      typeof settingsResult.data
        .config ===
        "object"
        ? settingsResult.data
            .config
        : {};

    const oldMessageId =
      String(
        rawConfig
          .ticketPanelMessageId ||
        "",
      );

    const oldChannelId =
      String(
        rawConfig
          .ticketPanelMessageChannelId ||
        "",
      );

    let panelMessage = null;

    if (
      isSnowflake(
        oldMessageId,
      ) &&
      oldChannelId ===
        settings
          .ticketPanelChannelId
    ) {
      try {
        panelMessage =
          await discordRequest(
            `/channels/${settings.ticketPanelChannelId}/messages/${oldMessageId}`,
            {
              method:
                "PATCH",
              token:
                config.botToken,
              authType: "Bot",
              body:
                messageBody,
            },
          );
      } catch (error) {
        if (
          error?.status !==
          404
        ) {
          throw error;
        }
      }
    }

    if (!panelMessage) {
      if (
        isSnowflake(
          oldMessageId,
        ) &&
        isSnowflake(
          oldChannelId,
        ) &&
        oldChannelId !==
          settings
            .ticketPanelChannelId
      ) {
        await discordRequest(
          `/channels/${oldChannelId}/messages/${oldMessageId}`,
          {
            method:
              "DELETE",
            token:
              config.botToken,
            authType: "Bot",
          },
        ).catch(
          () => null,
        );
      }

      panelMessage =
        await discordRequest(
          `/channels/${settings.ticketPanelChannelId}/messages`,
          {
            method:
              "POST",
            token:
              config.botToken,
            authType: "Bot",
            body:
              messageBody,
          },
        );
    }

    const nextConfig = {
      ...rawConfig,
      ticketPanelMessageId:
        String(
          panelMessage?.id ||
          "",
        ),
      ticketPanelMessageChannelId:
        settings
          .ticketPanelChannelId,
    };

    const {
      error: updateError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .update({
        config:
          nextConfig,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "owner_user_id",
        account.user.id,
      );

    if (updateError) {
      throw updateError;
    }

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        channelId:
          settings
            .ticketPanelChannelId,
        messageId:
          String(
            panelMessage?.id ||
            "",
          ),
      });
  } catch (error) {
    console.error(
      "Publish ticket panel error:",
      error,
    );

    return sendError(
      response,
      502,
      "TICKET_PANEL_PUBLISH_FAILED",
      error instanceof Error &&
      error.message
        ? `Не вдалося опублікувати Ticket panel: ${error.message}`
        : "Не вдалося опублікувати Ticket panel.",
    );
  }
}

async function handleReleaseLicense(
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

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  if (
    guildId ===
    INTERNAL_GUILD_ID
  ) {
    return sendError(
      response,
      403,
      "INTERNAL_GUILD_PROTECTED",
      "Внутрішню ліцензію ISTe не можна від'єднати.",
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
        404,
        "GUILD_LICENSE_NOT_FOUND",
        "Ліцензію для цього сервера не знайдено.",
      );
    }

    const {
      error: settingsError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .delete()
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "owner_user_id",
        account.user.id,
      );

    if (settingsError) {
      throw settingsError;
    }

    const {
      error: licenseError,
    } = await supabase
      .from(
        "discord_guild_licenses",
      )
      .delete()
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "user_id",
        account.user.id,
      );

    if (licenseError) {
      throw licenseError;
    }

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
      });
  } catch (error) {
    console.error(
      "Release guild license error:",
      error,
    );

    return sendError(
      response,
      500,
      "GUILD_LICENSE_RELEASE_FAILED",
      "Не вдалося звільнити ліцензію.",
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

    const rawSettings =
      settingsResult.data
        ? normalizeSettings(
            settingsResult.data,
          )
        : {
            guildId,
            locale: "uk",
            memberRoleId: "",
            matchChannelId: "",
            welcomeTitle: "",
            welcomeMessage: "",
            welcomeMention: true,
            welcomeShowMemberCount:
              true,
            moderationClearEnabled:
              true,
            moderationTimeoutEnabled:
              true,
            ticketPanelChannelId:
              "",
            ticketCategoryId: "",
            ticketSupportRoleId:
              "",
            ticketLogChannelId: "",
            ticketPanelTitle: "",
            ticketPanelMessage: "",
            ticketMaxOpenPerUser:
              1,
            privateVoiceEnabled:
              fallbackInternal,
            autoRolesEnabled:
              fallbackInternal,
            welcomeEnabled: false,
            moderationEnabled: false,
            ticketsEnabled: false,
          };

    const settings =
      sanitizeSettingsForPlan(
        rawSettings,
        fallbackInternal
          ? "internal"
          : license?.plan ||
            "free",
      );

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

async function requireSubscriptionManager(
  request,
  response,
) {
  const access =
    await requireAdminOrOwner(
      request,
      response,
    );

  if (!access.ok) {
    sendError(
      response,
      access.status,
      access.error,
      access.message,
    );

    return null;
  }

  return access;
}

async function handleAdminSubscriptions(
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

  const manager =
    await requireSubscriptionManager(
      request,
      response,
    );

  if (!manager) return;

  const search =
    readQueryString(
      request.query?.search,
      100,
    )
      .trim()
      .toLowerCase();

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data: accounts,
      error: accountError,
    } = await supabase
      .from(
        "discord_customer_accounts",
      )
      .select("*")
      .order(
        "last_synced_at",
        {
          ascending: false,
        },
      )
      .limit(300);

    if (accountError) {
      throw accountError;
    }

    const userIds =
      (
        accounts || []
      ).map(
        (item) =>
          item.user_id,
      );

    const [
      subscriptionResult,
      profileResult,
      roleResult,
    ] =
      userIds.length
        ? await Promise.all([
            supabase
              .from(
                "discord_subscriptions",
              )
              .select("*")
              .in(
                "user_id",
                userIds,
              ),
            supabase
              .from("profiles")
              .select(
                "id, username, display_name, avatar_url",
              )
              .in(
                "id",
                userIds,
              ),
            supabase
              .from(
                "user_roles",
              )
              .select(
                "user_id, role",
              )
              .in(
                "user_id",
                userIds,
              ),
          ])
        : [
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
            {
              data: [],
              error: null,
            },
          ];

    for (
      const result
      of [
        subscriptionResult,
        profileResult,
        roleResult,
      ]
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    const subscriptionMap =
      new Map(
        (
          subscriptionResult
            .data || []
        ).map(
          (item) => [
            item.user_id,
            item,
          ],
        ),
      );

    const profileMap =
      new Map(
        (
          profileResult
            .data || []
        ).map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const roleMap =
      new Map(
        (
          roleResult.data ||
          []
        ).map(
          (item) => [
            item.user_id,
            item.role,
          ],
        ),
      );

    const rows =
      (accounts || [])
        .map(
          (account) => {
            const sub =
              subscriptionMap.get(
                account.user_id,
              );

            const profile =
              profileMap.get(
                account.user_id,
              );

            const role =
              roleMap.get(
                account.user_id,
              ) || "user";

            return {
              userId:
                account.user_id,
              siteRole:
                role,
              username:
                profile?.username ||
                "",
              displayName:
                profile
                  ?.display_name ||
                "",
              avatarUrl:
                profile?.avatar_url ||
                "",
              discordUserId:
                account
                  .discord_user_id,
              discordUsername:
                account
                  .discord_username,
              discordGlobalName:
                account
                  .discord_global_name,
              discordAvatar:
                account
                  .discord_avatar,
              plan:
                normalizePlan(
                  sub?.plan ||
                  "free",
                ),
              status:
                sub?.status ||
                "free",
              startsAt:
                sub?.starts_at ||
                null,
              expiresAt:
                sub?.expires_at ||
                null,
              maxGuilds:
                normalizePlan(
                  sub?.plan,
                ) ===
                  "internal"
                  ? null
                  : sub?.max_guilds ??
                    1,
              subscriberRoleSynced:
                sub
                  ?.subscriber_role_synced ===
                true,
            };
          },
        )
        .filter(
          (row) => {
            if (!search) {
              return true;
            }

            return [
              row.username,
              row.displayName,
              row.discordUsername,
              row.discordGlobalName,
              row.discordUserId,
            ].some(
              (value) =>
                String(
                  value || "",
                )
                  .toLowerCase()
                  .includes(
                    search,
                  ),
            );
          },
        );

    return response
      .status(200)
      .json({
        ok: true,
        plans:
          ["starter", "pro", "max"].map(
            (plan) => ({
              plan,
              ...PLAN_CATALOG[
                plan
              ],
            }),
          ),
        subscriptions:
          rows,
      });
  } catch (error) {
    console.error(
      "Subscription manager list error:",
      error,
    );

    return sendError(
      response,
      500,
      "SUBSCRIPTIONS_LOAD_FAILED",
      "Не вдалося завантажити підписки ISTe Bot.",
    );
  }
}

async function handleAdminSetSubscription(
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
        maxBodyBytes: 8192,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const manager =
    await requireSubscriptionManager(
      request,
      response,
    );

  if (!manager) return;

  const body =
    readJsonBody(request) ||
    {};

  const userId =
    String(
      body.userId || "",
    ).trim();

  const mode =
    String(
      body.mode || "",
    )
      .trim()
      .toLowerCase();

  const requestedPlan =
    normalizePlan(
      body.plan,
    );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_USER_ID",
      "Некоректний ID користувача.",
    );
  }

  if (
    ![
      "activate",
      "extend",
      "revoke",
    ].includes(
      mode,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_SUBSCRIPTION_ACTION",
      "Некоректна дія підписки.",
    );
  }

  if (
    mode !== "revoke" &&
    !PAID_PLANS.has(
      requestedPlan,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_SUBSCRIPTION_PLAN",
      "Оберіть Starter, Pro або Max.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data: targetRole,
      error: targetRoleError,
    } = await supabase
      .from(
        "user_roles",
      )
      .select(
        "role",
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();

    if (
      targetRoleError ||
      !targetRole
    ) {
      return sendError(
        response,
        404,
        "SUBSCRIPTION_USER_NOT_FOUND",
        "Користувача не знайдено.",
      );
    }

    if (
      targetRole.role ===
      "owner"
    ) {
      return sendError(
        response,
        403,
        "OWNER_SUBSCRIPTION_PROTECTED",
        "Внутрішня підписка власника ISTe захищена.",
      );
    }

    const {
      data: existing,
      error: existingError,
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

    if (existingError) {
      throw existingError;
    }

    const now =
      new Date();

    if (
      mode === "revoke"
    ) {
      const nowIso =
        now.toISOString();

      const {
        data: subscription,
        error,
      } = await supabase
        .from(
          "discord_subscriptions",
        )
        .upsert(
          {
            user_id:
              userId,
            plan: "free",
            status: "free",
            starts_at:
              existing
                ?.starts_at ||
              nowIso,
            expires_at: null,
            max_guilds: 1,
            subscriber_role_expires_at:
              null,
            updated_at:
              nowIso,
          },
          {
            onConflict:
              "user_id",
          },
        )
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      await reconcileGuildLicenses(
        supabase,
        userId,
        "free",
        null,
      );

      const {
        data: discordAccount,
      } = await supabase
        .from(
          "discord_customer_accounts",
        )
        .select("*")
        .eq(
          "user_id",
          userId,
        )
        .maybeSingle();

      await syncSubscriberRole(
        supabase,
        subscription,
        discordAccount,
      );

      await supabase
        .from(
          "discord_subscription_events",
        )
        .insert({
          user_id:
            userId,
          actor_user_id:
            manager.user.id,
          event_type:
            "revoked",
          plan: "free",
          starts_at:
            subscription
              .starts_at,
          expires_at: null,
        });

      return response
        .status(200)
        .json({
          ok: true,
          subscription: {
            plan: "free",
            status: "free",
            expiresAt: null,
          },
        });
    }

    const planConfig =
      getPlanConfig(
        requestedPlan,
      );

    const existingExpiry =
      existing
        ?.expires_at
        ? new Date(
            existing.expires_at,
          )
        : null;

    const baseDate =
      mode === "extend" &&
      existingExpiry &&
      existingExpiry.getTime() >
        now.getTime()
        ? existingExpiry
        : now;

    const expiresAt =
      new Date(
        baseDate.getTime() +
        30 *
          24 *
          60 *
          60 *
          1000,
      );

    const startsAt =
      mode === "extend" &&
      existing
        ?.starts_at
        ? existing.starts_at
        : now.toISOString();

    const {
      data: subscription,
      error,
    } = await supabase
      .from(
        "discord_subscriptions",
      )
      .upsert(
        {
          user_id:
            userId,
          plan:
            planConfig.plan,
          status: "active",
          starts_at:
            startsAt,
          expires_at:
            expiresAt
              .toISOString(),
          max_guilds:
            planConfig
              .maxGuilds,
          subscriber_role_synced:
            false,
          subscriber_role_expires_at:
            expiresAt
              .toISOString(),
          provider:
            existing?.provider ||
            "manual",
          updated_at:
            now.toISOString(),
        },
        {
          onConflict:
            "user_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await reconcileGuildLicenses(
      supabase,
      userId,
      planConfig.plan,
      expiresAt
        .toISOString(),
    );

    const {
      data: discordAccount,
    } = await supabase
      .from(
        "discord_customer_accounts",
      )
      .select("*")
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();

    const roleSync =
      await syncSubscriberRole(
        supabase,
        subscription,
        discordAccount,
      );

    await supabase
      .from(
        "discord_subscription_events",
      )
      .insert({
        user_id:
          userId,
        actor_user_id:
          manager.user.id,
        event_type:
          mode === "extend"
            ? "extended"
            : "activated",
        plan:
          planConfig.plan,
        starts_at:
          startsAt,
        expires_at:
          expiresAt
            .toISOString(),
        metadata: {
          priceUsd:
            planConfig
              .priceUsd,
          roleSynced:
            roleSync.synced ===
            true,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
        subscription: {
          plan:
            planConfig.plan,
          status: "active",
          startsAt,
          expiresAt:
            expiresAt
              .toISOString(),
          maxGuilds:
            planConfig
              .maxGuilds,
          subscriberRoleSynced:
            roleSync.synced ===
            true,
        },
      });
  } catch (error) {
    console.error(
      "Subscription manager update error:",
      error,
    );

    return sendError(
      response,
      500,
      "SUBSCRIPTION_UPDATE_FAILED",
      "Не вдалося змінити підписку ISTe Bot.",
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
    action ===
    "admin-subscriptions"
  ) {
    return handleAdminSubscriptions(
      request,
      response,
    );
  }

  if (
    action ===
    "admin-set-subscription"
  ) {
    return handleAdminSetSubscription(
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
    "guild-resources"
  ) {
    return handleGuildResources(
      request,
      response,
    );
  }

  if (
    action ===
    "publish-ticket-panel"
  ) {
    return handlePublishTicketPanel(
      request,
      response,
    );
  }

  if (
    action ===
    "release-license"
  ) {
    return handleReleaseLicense(
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
