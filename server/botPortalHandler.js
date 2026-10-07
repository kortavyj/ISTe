import {
  randomBytes,
  randomInt,
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
  "564049733577782";

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
    automodEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .automodEnabled ===
          true
        : false,
    automodSpamEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .automodSpamEnabled !==
          false
        : true,
    automodInvitesEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .automodInvitesEnabled !==
          false
        : true,
    automodMentionEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .automodMentionEnabled !==
          false
        : true,
    automodCapsEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .automodCapsEnabled ===
          true
        : false,
    automodForbiddenWords:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .automodForbiddenWords ||
            "",
          )
        : "",
    automodAlertChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .automodAlertChannelId ||
            "",
          )
        : "",
    automodMentionLimit:
      row?.config &&
      typeof row.config ===
        "object"
        ? Math.max(
            2,
            Math.min(
              50,
              Number(
                row.config
                  .automodMentionLimit ||
                5,
              ) ||
              5,
            ),
          )
        : 5,
    automodEscalationCount:
      row?.config &&
      typeof row.config ===
        "object"
        ? Math.max(
            2,
            Math.min(
              10,
              Number(
                row.config
                  .automodEscalationCount ||
                3,
              ) ||
              3,
            ),
          )
        : 3,
    automodEscalationWindowMinutes:
      row?.config &&
      typeof row.config ===
        "object"
        ? Math.max(
            1,
            Math.min(
              1440,
              Number(
                row.config
                  .automodEscalationWindowMinutes ||
                10,
              ) ||
              10,
            ),
          )
        : 10,
    automodTimeoutMinutes:
      row?.config &&
      typeof row.config ===
        "object"
        ? Math.max(
            1,
            Math.min(
              40320,
              Number(
                row.config
                  .automodTimeoutMinutes ||
                10,
              ) ||
              10,
            ),
          )
        : 10,
    automodRuleIds:
      row?.config &&
      typeof row.config ===
        "object" &&
      row.config
        .automodRuleIds &&
      typeof row.config
        .automodRuleIds ===
        "object"
        ? row.config
            .automodRuleIds
        : {},
    verificationEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .verificationEnabled ===
          true
        : false,
    verificationPanelChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .verificationPanelChannelId ||
            "",
          )
        : "",
    verificationRoleId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .verificationRoleId ||
            "",
          )
        : "",
    verificationRemoveRoleId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .verificationRemoveRoleId ||
            "",
          )
        : "",
    verificationPanelTitle:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .verificationPanelTitle ||
            "",
          )
        : "",
    verificationPanelMessage:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .verificationPanelMessage ||
            "",
          )
        : "",
    selfRolesEnabled:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
            .selfRolesEnabled ===
          true
        : false,
    selfRolesPanelChannelId:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .selfRolesPanelChannelId ||
            "",
          )
        : "",
    selfRolesPanelTitle:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .selfRolesPanelTitle ||
            "",
          )
        : "",
    selfRolesPanelMessage:
      row?.config &&
      typeof row.config ===
        "object"
        ? String(
            row.config
              .selfRolesPanelMessage ||
            "",
          )
        : "",
    selfRoleIds:
      row?.config &&
      typeof row.config ===
        "object" &&
      Array.isArray(
        row.config
          .selfRoleIds,
      )
        ? [
            ...new Set(
              row.config
                .selfRoleIds
                .map(
                  (value) =>
                    String(value),
                )
                .filter(
                  (value) =>
                    isSnowflake(
                      value,
                    ),
                ),
            ),
          ].slice(0, 10)
        : [],
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



const DISCORD_COMMAND_CATALOG =
  Object.freeze([
    {
      name: "ping",
      category: "utility",
      label: "Ping",
    },
    {
      name: "server",
      category: "utility",
      label: "Server info",
    },
    {
      name: "user",
      category: "utility",
      label: "User info",
    },
    {
      name: "avatar",
      category: "utility",
      label: "Avatar",
    },
    {
      name: "bot",
      category: "utility",
      label: "Bot info",
    },
    {
      name: "invite",
      category: "utility",
      label: "Invite",
    },
    {
      name: "help",
      category: "utility",
      label: "Help",
    },
    {
      name: "poll",
      category: "community",
      label: "Poll",
    },
    {
      name: "room",
      category: "community",
      label: "Private Room",
    },
    {
      name: "warn",
      category: "moderation",
      label: "Warn",
    },
    {
      name: "warnings",
      category: "moderation",
      label: "Warnings",
    },
    {
      name: "unwarn",
      category: "moderation",
      label: "Unwarn",
    },
    {
      name: "timeout",
      category: "moderation",
      label: "Timeout",
    },
    {
      name: "kick",
      category: "moderation",
      label: "Kick",
    },
    {
      name: "ban",
      category: "moderation",
      label: "Ban",
    },
    {
      name: "unban",
      category: "moderation",
      label: "Unban",
    },
    {
      name: "clear",
      category: "moderation",
      label: "Clear messages",
    },
    {
      name: "slowmode",
      category: "moderation",
      label: "Slowmode",
    },
    {
      name: "site",
      category: "iste",
      label: "ISTe website",
    },
    {
      name: "rules",
      category: "iste",
      label: "Rules",
    },
    {
      name: "team",
      category: "iste",
      label: "Team",
    },
    {
      name: "matches",
      category: "iste",
      label: "Matches",
    },
    {
      name: "news",
      category: "iste",
      label: "News",
    },
    {
      name: "apply",
      category: "recruitment",
      label: "Apply",
    },
    {
      name: "recruitment",
      category: "recruitment",
      label: "Recruitment setup",
    },
    {
      name: "applications",
      category: "recruitment",
      label: "Applications",
    },
  ]);

const DISCORD_COMMAND_NAMES =
  new Set(
    DISCORD_COMMAND_CATALOG.map(
      (command) =>
        command.name,
    ),
  );

function normalizeCommandSetting(
  command,
  row,
  stats = {},
) {
  return {
    name:
      command.name,
    category:
      command.category,
    label:
      command.label,
    enabled:
      row?.enabled !==
      false,
    allowedRoleIds:
      Array.isArray(
        row?.allowed_role_ids,
      )
        ? row
            .allowed_role_ids
            .map(
              (value) =>
                String(value),
            )
            .filter(
              (value) =>
                isSnowflake(
                  value,
                ),
            )
        : [],
    allowedChannelIds:
      Array.isArray(
        row
          ?.allowed_channel_ids,
      )
        ? row
            .allowed_channel_ids
            .map(
              (value) =>
                String(value),
            )
            .filter(
              (value) =>
                isSnowflake(
                  value,
                ),
            )
        : [],
    cooldownSeconds:
      Math.max(
        0,
        Math.min(
          86400,
          Math.round(
            Number(
              row
                ?.cooldown_seconds ||
              0,
            ) ||
            0,
          ),
        ),
      ),
    customized:
      Boolean(row),
    stats: {
      total:
        Number(
          stats.total ||
          0,
        ),
      allowed:
        Number(
          stats.allowed ||
          0,
        ),
      denied:
        Number(
          stats.denied ||
          0,
        ),
      errors:
        Number(
          stats.errors ||
          0,
        ),
      uniqueUsers:
        Number(
          stats.uniqueUsers ||
          0,
        ),
      lastUsedAt:
        stats.lastUsedAt ||
        null,
    },
  };
}

function commandUsageTimeline(
  rows,
  days = 7,
) {
  const timeline = [];
  const map = new Map();

  for (
    let offset =
      days - 1;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(
        Date.now() -
        offset *
          86400000,
      );
    const key =
      analyticsDayKey(
        date,
      );
    const item = {
      date: key,
      total: 0,
      allowed: 0,
      denied: 0,
      errors: 0,
    };

    timeline.push(item);
    map.set(
      key,
      item,
    );
  }

  for (
    const row
    of (
      Array.isArray(rows)
        ? rows
        : []
    )
  ) {
    const item =
      map.get(
        analyticsDayKey(
          row.created_at,
        ),
      );

    if (!item) {
      continue;
    }

    item.total += 1;

    if (
      row.outcome ===
      "allowed"
    ) {
      item.allowed += 1;
    } else if (
      row.outcome ===
      "denied"
    ) {
      item.denied += 1;
    } else if (
      row.outcome ===
      "error"
    ) {
      item.errors += 1;
    }
  }

  return timeline;
}

async function handleCommandCenterOverview(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const since =
      new Date(
        Date.now() -
        7 *
          86400000,
      ).toISOString();

    const [
      settingsResult,
      usageResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_command_settings",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          ),
        supabase
          .from(
            "discord_command_usage",
          )
          .select(
            "id,command_name,user_id,channel_id,outcome,denied_reason,duration_ms,created_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(5000),
      ]);

    if (
      settingsResult.error ||
      usageResult.error
    ) {
      throw (
        settingsResult.error ||
        usageResult.error
      );
    }

    const settingsMap =
      new Map(
        (
          settingsResult.data ||
          []
        ).map(
          (row) => [
            String(
              row.command_name,
            ),
            row,
          ],
        ),
      );

    const usageRows =
      usageResult.data ||
      [];
    const statsMap =
      new Map();

    for (
      const row
      of usageRows
    ) {
      const name =
        String(
          row.command_name ||
          "",
        );

      if (
        !statsMap.has(
          name,
        )
      ) {
        statsMap.set(
          name,
          {
            total: 0,
            allowed: 0,
            denied: 0,
            errors: 0,
            users:
              new Set(),
            lastUsedAt: null,
          },
        );
      }

      const stats =
        statsMap.get(
          name,
        );

      stats.total += 1;
      stats.users.add(
        String(
          row.user_id ||
          "",
        ),
      );

      if (
        row.outcome ===
        "allowed"
      ) {
        stats.allowed += 1;
      } else if (
        row.outcome ===
        "denied"
      ) {
        stats.denied += 1;
      } else if (
        row.outcome ===
        "error"
      ) {
        stats.errors += 1;
      }

      if (!stats.lastUsedAt) {
        stats.lastUsedAt =
          row.created_at;
      }
    }

    const commands =
      DISCORD_COMMAND_CATALOG.map(
        (command) => {
          const stats =
            statsMap.get(
              command.name,
            );

          return normalizeCommandSetting(
            command,
            settingsMap.get(
              command.name,
            ),
            stats
              ? {
                  ...stats,
                  uniqueUsers:
                    stats.users.size,
                }
              : {},
          );
        },
      );

    const summary = {
      commands:
        commands.length,
      enabled:
        commands.filter(
          (command) =>
            command.enabled,
        ).length,
      customized:
        commands.filter(
          (command) =>
            command.customized,
        ).length,
      invocations:
        usageRows.length,
      allowed:
        usageRows.filter(
          (row) =>
            row.outcome ===
            "allowed",
        ).length,
      denied:
        usageRows.filter(
          (row) =>
            row.outcome ===
            "denied",
        ).length,
      errors:
        usageRows.filter(
          (row) =>
            row.outcome ===
            "error",
        ).length,
      uniqueUsers:
        new Set(
          usageRows.map(
            (row) =>
              String(
                row.user_id ||
                "",
              ),
          ),
        ).size,
    };

    const recentUsage =
      usageRows
        .slice(
          0,
          40,
        )
        .map(
          (row) => ({
            id:
              row.id,
            command:
              row.command_name,
            userId:
              row.user_id,
            channelId:
              row.channel_id,
            outcome:
              row.outcome,
            deniedReason:
              row.denied_reason,
            durationMs:
              row.duration_ms,
            createdAt:
              row.created_at,
          }),
        );

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        summary,
        commands,
        timeline:
          commandUsageTimeline(
            usageRows,
            7,
          ),
        recentUsage,
      });
  } catch (error) {
    console.error(
      "Command center overview error:",
      error,
    );

    return sendError(
      response,
      500,
      "COMMAND_CENTER_LOAD_FAILED",
      "Не вдалося завантажити Command Center.",
    );
  }
}

async function handleSaveCommandSettings(
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
        maxBodyBytes: 64000,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
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
  const commands =
    Array.isArray(
      body.commands,
    )
      ? body.commands
      : [];

  if (
    !isSnowflake(
      guildId,
    ) ||
    commands.length >
      DISCORD_COMMAND_CATALOG
        .length
  ) {
    return sendError(
      response,
      400,
      "INVALID_COMMAND_SETTINGS",
      "Некоректні налаштування команд.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const normalized = [];

    for (
      const item
      of commands
    ) {
      const commandName =
        String(
          item?.name ||
          "",
        )
          .trim()
          .toLowerCase();

      if (
        !DISCORD_COMMAND_NAMES.has(
          commandName,
        )
      ) {
        return sendError(
          response,
          400,
          "UNKNOWN_COMMAND",
          "Невідома Discord команда: /" +
            commandName,
        );
      }

      const roleIds =
        Array.isArray(
          item
            ?.allowedRoleIds,
        )
          ? [
              ...new Set(
                item
                  .allowedRoleIds
                  .map(
                    (value) =>
                      String(
                        value ||
                        "",
                      ),
                  )
                  .filter(
                    (value) =>
                      isSnowflake(
                        value,
                      ),
                  ),
              ),
            ]
              .slice(
                0,
                20,
              )
          : [];

      const channelIds =
        Array.isArray(
          item
            ?.allowedChannelIds,
        )
          ? [
              ...new Set(
                item
                  .allowedChannelIds
                  .map(
                    (value) =>
                      String(
                        value ||
                        "",
                      ),
                  )
                  .filter(
                    (value) =>
                      isSnowflake(
                        value,
                      ),
                  ),
              ),
            ]
              .slice(
                0,
                20,
              )
          : [];

      normalized.push({
        guild_id:
          guildId,
        command_name:
          commandName,
        enabled:
          item?.enabled !==
          false,
        allowed_role_ids:
          roleIds,
        allowed_channel_ids:
          channelIds,
        cooldown_seconds:
          Math.max(
            0,
            Math.min(
              86400,
              Math.round(
                Number(
                  item
                    ?.cooldownSeconds ||
                  0,
                ) ||
                0,
              ),
            ),
          ),
        updated_by:
          access.account
            .user.id,
        updated_at:
          new Date()
            .toISOString(),
      });
    }

    if (normalized.length) {
      const {
        error,
      } = await access.supabase
        .from(
          "discord_command_settings",
        )
        .upsert(
          normalized,
          {
            onConflict:
              "guild_id,command_name",
          },
        );

      if (error) {
        throw error;
      }
    }

    await access.supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "command_center.saved",
        payload: {
          commands:
            normalized.length,
          disabled:
            normalized.filter(
              (item) =>
                !item.enabled,
            ).map(
              (item) =>
                item
                  .command_name,
            ),
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Command center save error:",
      error,
    );

    return sendError(
      response,
      500,
      "COMMAND_CENTER_SAVE_FAILED",
      "Не вдалося зберегти налаштування команд.",
    );
  }
}

async function handleResetCommandSettings(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const {
      error,
    } = await access.supabase
      .from(
        "discord_command_settings",
      )
      .delete()
      .eq(
        "guild_id",
        guildId,
      );

    if (error) {
      throw error;
    }

    await access.supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "command_center.reset",
        payload: {},
      });

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Command center reset error:",
      error,
    );

    return sendError(
      response,
      500,
      "COMMAND_CENTER_RESET_FAILED",
      "Не вдалося скинути налаштування команд.",
    );
  }
}

const CONFIG_VERSION_LIMIT =
  50;

function rawGuildSettingsSnapshot(
  row,
) {
  return {
    locale:
      row?.locale ===
      "en"
        ? "en"
        : "uk",
    admin_role_id:
      String(
        row?.admin_role_id ||
        "",
      ),
    moderator_role_id:
      String(
        row?.moderator_role_id ||
        "",
      ),
    member_role_id:
      String(
        row?.member_role_id ||
        "",
      ),
    log_channel_id:
      String(
        row?.log_channel_id ||
        "",
      ),
    welcome_channel_id:
      String(
        row?.welcome_channel_id ||
        "",
      ),
    welcome_enabled:
      row?.welcome_enabled ===
      true,
    moderation_enabled:
      row?.moderation_enabled ===
      true,
    tickets_enabled:
      row?.tickets_enabled ===
      true,
    private_voice_enabled:
      row?.private_voice_enabled ===
      true,
    auto_roles_enabled:
      row?.auto_roles_enabled ===
      true,
    config:
      row?.config &&
      typeof row.config ===
        "object"
        ? row.config
        : {},
    updated_at:
      row?.updated_at ||
      null,
  };
}

function snapshotAsSettingsRow(
  guildId,
  ownerUserId,
  snapshot,
) {
  const value =
    snapshot &&
    typeof snapshot ===
      "object"
      ? snapshot
      : {};

  return {
    guild_id:
      guildId,
    owner_user_id:
      ownerUserId,
    locale:
      value.locale ===
      "en"
        ? "en"
        : "uk",
    admin_role_id:
      String(
        value.admin_role_id ||
        "",
      ),
    moderator_role_id:
      String(
        value.moderator_role_id ||
        "",
      ),
    member_role_id:
      String(
        value.member_role_id ||
        "",
      ),
    log_channel_id:
      String(
        value.log_channel_id ||
        "",
      ),
    welcome_channel_id:
      String(
        value.welcome_channel_id ||
        "",
      ),
    welcome_enabled:
      value.welcome_enabled ===
      true,
    moderation_enabled:
      value.moderation_enabled ===
      true,
    tickets_enabled:
      value.tickets_enabled ===
      true,
    private_voice_enabled:
      value.private_voice_enabled ===
      true,
    auto_roles_enabled:
      value.auto_roles_enabled ===
      true,
    config:
      value.config &&
      typeof value.config ===
        "object"
        ? value.config
        : {},
  };
}

const CONFIG_HISTORY_GROUPS =
  Object.freeze({
    general: [
      "locale",
      "adminRoleId",
      "moderatorRoleId",
      "logChannelId",
      "matchChannelId",
    ],
    onboarding: [
      "autoRolesEnabled",
      "memberRoleId",
      "welcomeEnabled",
      "welcomeChannelId",
      "welcomeTitle",
      "welcomeMessage",
      "welcomeMention",
      "welcomeShowMemberCount",
      "verificationEnabled",
      "verificationPanelChannelId",
      "verificationRoleId",
      "verificationRemoveRoleId",
      "verificationPanelTitle",
      "verificationPanelMessage",
      "selfRolesEnabled",
      "selfRolesPanelChannelId",
      "selfRolesPanelTitle",
      "selfRolesPanelMessage",
      "selfRoleIds",
    ],
    moderation: [
      "moderationEnabled",
      "moderationClearEnabled",
      "moderationTimeoutEnabled",
      "automodEnabled",
      "automodSpamEnabled",
      "automodInvitesEnabled",
      "automodMentionEnabled",
      "automodCapsEnabled",
      "automodForbiddenWords",
      "automodAlertChannelId",
      "automodMentionLimit",
      "automodEscalationCount",
      "automodEscalationWindowMinutes",
      "automodTimeoutMinutes",
    ],
    support: [
      "privateVoiceEnabled",
      "ticketsEnabled",
      "ticketPanelChannelId",
      "ticketCategoryId",
      "ticketSupportRoleId",
      "ticketLogChannelId",
      "ticketPanelTitle",
      "ticketPanelMessage",
      "ticketMaxOpenPerUser",
    ],
  });

function configVersionDiff(
  currentRow,
  snapshotRow,
) {
  const current =
    normalizeSettings(
      currentRow,
    );
  const previous =
    normalizeSettings(
      snapshotRow,
    );

  const changedFields = [];

  for (
    const [
      group,
      fields,
    ]
    of Object.entries(
      CONFIG_HISTORY_GROUPS,
    )
  ) {
    const changed =
      fields.filter(
        (field) =>
          JSON.stringify(
            current[field],
          ) !==
          JSON.stringify(
            previous[field],
          ),
      );

    if (changed.length) {
      changedFields.push({
        group,
        fields:
          changed,
      });
    }
  }

  return {
    changedCount:
      changedFields.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.fields.length,
        0,
      ),
    changedGroups:
      changedFields.map(
        (item) =>
          item.group,
      ),
    changedFields,
  };
}

async function createGuildConfigVersion(
  supabase,
  row,
  {
    actorUserId = null,
    source = "save",
    label = "",
    restoredFrom = null,
  } = {},
) {
  if (
    !row?.guild_id ||
    !row?.owner_user_id
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "discord_guild_config_versions",
    )
    .insert({
      guild_id:
        row.guild_id,
      owner_user_id:
        row.owner_user_id,
      actor_user_id:
        actorUserId,
      source,
      label:
        String(
          label ||
          "",
        )
          .trim()
          .slice(
            0,
            100,
          ),
      settings:
        rawGuildSettingsSnapshot(
          row,
        ),
      restored_from:
        restoredFrom ||
        null,
    })
    .select(
      "id,guild_id,source,label,created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  const {
    data:
      stale,
    error:
      staleError,
  } = await supabase
    .from(
      "discord_guild_config_versions",
    )
    .select("id")
    .eq(
      "guild_id",
      row.guild_id,
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      },
    )
    .range(
      CONFIG_VERSION_LIMIT,
      CONFIG_VERSION_LIMIT +
      100,
    );

  if (staleError) {
    throw staleError;
  }

  const staleIds =
    (stale || [])
      .map(
        (item) =>
          item.id,
      )
      .filter(Boolean);

  if (staleIds.length) {
    const {
      error:
        pruneError,
    } = await supabase
      .from(
        "discord_guild_config_versions",
      )
      .delete()
      .in(
        "id",
        staleIds,
      );

    if (pruneError) {
      throw pruneError;
    }
  }

  return data;
}

async function handleConfigHistoryList(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const {
      supabase,
      settingsRow,
      account,
    } = access;

    const {
      data,
      error,
    } = await supabase
      .from(
        "discord_guild_config_versions",
      )
      .select(
        "id,actor_user_id,source,label,settings,restored_from,created_at",
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "owner_user_id",
        account.user.id,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        CONFIG_VERSION_LIMIT,
      );

    if (error) {
      throw error;
    }

    const versions =
      (data || []).map(
        (version) => {
          const versionRow =
            snapshotAsSettingsRow(
              guildId,
              account.user.id,
              version.settings,
            );
          const diff =
            configVersionDiff(
              settingsRow,
              versionRow,
            );

          return {
            id:
              version.id,
            actorUserId:
              version.actor_user_id,
            source:
              version.source,
            label:
              version.label,
            restoredFrom:
              version.restored_from,
            createdAt:
              version.created_at,
            ...diff,
          };
        },
      );

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        current: {
          updatedAt:
            settingsRow.updated_at,
          settings:
            normalizeSettings(
              settingsRow,
            ),
        },
        versions,
      });
  } catch (error) {
    console.error(
      "Config history list error:",
      error,
    );

    return sendError(
      response,
      500,
      "CONFIG_HISTORY_LOAD_FAILED",
      "Не вдалося завантажити історію конфігурації.",
    );
  }
}

async function handleCreateConfigSnapshot(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const label =
    String(
      body.label ||
      "",
    )
      .trim()
      .slice(
        0,
        100,
      );

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const snapshot =
      await createGuildConfigVersion(
        access.supabase,
        access.settingsRow,
        {
          actorUserId:
            access.account.user.id,
          source:
            "manual",
          label,
        },
      );

    await access.supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "settings.snapshot_created",
        payload: {
          snapshot_id:
            snapshot?.id ||
            null,
          label:
            label ||
            null,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
        snapshot,
      });
  } catch (error) {
    console.error(
      "Create config snapshot error:",
      error,
    );

    return sendError(
      response,
      500,
      "CONFIG_SNAPSHOT_CREATE_FAILED",
      "Не вдалося створити snapshot конфігурації.",
    );
  }
}

async function handleRestoreConfigVersion(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const versionId =
    String(
      body.versionId ||
      "",
    ).trim();

  if (
    !isSnowflake(
      guildId,
    ) ||
    !/^[0-9a-f-]{36}$/i.test(
      versionId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_CONFIG_VERSION",
      "Некоректна версія конфігурації.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const {
      supabase,
      settingsRow,
      account,
    } = access;

    const {
      data:
        version,
      error:
        versionError,
    } = await supabase
      .from(
        "discord_guild_config_versions",
      )
      .select("*")
      .eq(
        "id",
        versionId,
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "owner_user_id",
        account.user.id,
      )
      .maybeSingle();

    if (
      versionError ||
      !version
    ) {
      return sendError(
        response,
        404,
        "CONFIG_VERSION_NOT_FOUND",
        "Версію конфігурації не знайдено.",
      );
    }

    const rollbackSnapshot =
      await createGuildConfigVersion(
        supabase,
        settingsRow,
        {
          actorUserId:
            account.user.id,
          source:
            "restore",
          label:
            "Before restore",
          restoredFrom:
            version.id,
        },
      );

    const restoredRow =
      snapshotAsSettingsRow(
        guildId,
        account.user.id,
        version.settings,
      );

    const {
      data:
        restored,
      error:
        restoreError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .update({
        locale:
          restoredRow.locale,
        admin_role_id:
          restoredRow
            .admin_role_id,
        moderator_role_id:
          restoredRow
            .moderator_role_id,
        member_role_id:
          restoredRow
            .member_role_id,
        log_channel_id:
          restoredRow
            .log_channel_id,
        welcome_channel_id:
          restoredRow
            .welcome_channel_id,
        welcome_enabled:
          restoredRow
            .welcome_enabled,
        moderation_enabled:
          restoredRow
            .moderation_enabled,
        tickets_enabled:
          restoredRow
            .tickets_enabled,
        private_voice_enabled:
          restoredRow
            .private_voice_enabled,
        auto_roles_enabled:
          restoredRow
            .auto_roles_enabled,
        config:
          restoredRow.config,
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
      )
      .select("*")
      .single();

    if (restoreError) {
      throw restoreError;
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "settings.restored",
        payload: {
          version_id:
            version.id,
          rollback_snapshot_id:
            rollbackSnapshot
              ?.id ||
            null,
          source:
            version.source,
          label:
            version.label ||
            null,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
        settings:
          normalizeSettings(
            restored,
          ),
        restoredVersionId:
          version.id,
        rollbackSnapshotId:
          rollbackSnapshot
            ?.id ||
          null,
      });
  } catch (error) {
    console.error(
      "Restore config version error:",
      error,
    );

    return sendError(
      response,
      500,
      "CONFIG_VERSION_RESTORE_FAILED",
      "Не вдалося відновити конфігурацію.",
    );
  }
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

  const automodForbiddenWords =
    String(
      body.automodForbiddenWords ||
      "",
    )
      .replace(/\r/g, "")
      .trim()
      .slice(0, 12000);

  const automodMentionLimit =
    Math.max(
      2,
      Math.min(
        50,
        Math.round(
          Number(
            body.automodMentionLimit ||
            5,
          ) ||
          5,
        ),
      ),
    );

  const automodEscalationCount =
    Math.max(
      2,
      Math.min(
        10,
        Math.round(
          Number(
            body.automodEscalationCount ||
            3,
          ) ||
          3,
        ),
      ),
    );

  const automodEscalationWindowMinutes =
    Math.max(
      1,
      Math.min(
        1440,
        Math.round(
          Number(
            body.automodEscalationWindowMinutes ||
            10,
          ) ||
          10,
        ),
      ),
    );

  const automodTimeoutMinutes =
    Math.max(
      1,
      Math.min(
        40320,
        Math.round(
          Number(
            body.automodTimeoutMinutes ||
            10,
          ) ||
          10,
        ),
      ),
    );

  const verificationPanelTitle =
    String(
      body.verificationPanelTitle ||
      "",
    )
      .trim()
      .slice(0, 80);

  const verificationPanelMessage =
    String(
      body.verificationPanelMessage ||
      "",
    )
      .trim()
      .slice(0, 500);

  const selfRolesPanelTitle =
    String(
      body.selfRolesPanelTitle ||
      "",
    )
      .trim()
      .slice(0, 80);

  const selfRolesPanelMessage =
    String(
      body.selfRolesPanelMessage ||
      "",
    )
      .trim()
      .slice(0, 500);

  const selfRoleIds =
    [
      ...new Set(
        (
          Array.isArray(
            body.selfRoleIds,
          )
            ? body.selfRoleIds
            : []
        )
          .map(
            (value) =>
              String(
                value ||
                "",
              ).trim(),
          )
          .filter(
            (value) =>
              isSnowflake(
                value,
              ),
          ),
      ),
    ].slice(0, 10);

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
    automodAlertChannelId:
      readSnowflakeOrEmpty(
        body.automodAlertChannelId,
      ),
    verificationPanelChannelId:
      readSnowflakeOrEmpty(
        body.verificationPanelChannelId,
      ),
    verificationRoleId:
      readSnowflakeOrEmpty(
        body.verificationRoleId,
      ),
    verificationRemoveRoleId:
      readSnowflakeOrEmpty(
        body.verificationRemoveRoleId,
      ),
    selfRolesPanelChannelId:
      readSnowflakeOrEmpty(
        body.selfRolesPanelChannelId,
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
      .select("*")
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
      automodEnabled:
        body.automodEnabled ===
        true,
      automodSpamEnabled:
        body.automodSpamEnabled !==
        false,
      automodInvitesEnabled:
        body.automodInvitesEnabled !==
        false,
      automodMentionEnabled:
        body.automodMentionEnabled !==
        false,
      automodCapsEnabled:
        body.automodCapsEnabled ===
        true,
      automodForbiddenWords,
      automodAlertChannelId:
        fields
          .automodAlertChannelId
          .value,
      automodMentionLimit,
      automodEscalationCount,
      automodEscalationWindowMinutes,
      automodTimeoutMinutes,
      verificationEnabled:
        body.verificationEnabled ===
        true,
      verificationPanelChannelId:
        fields
          .verificationPanelChannelId
          .value,
      verificationRoleId:
        fields
          .verificationRoleId
          .value,
      verificationRemoveRoleId:
        fields
          .verificationRemoveRoleId
          .value,
      verificationPanelTitle,
      verificationPanelMessage,
      selfRolesEnabled:
        body.selfRolesEnabled ===
        true,
      selfRolesPanelChannelId:
        fields
          .selfRolesPanelChannelId
          .value,
      selfRolesPanelTitle,
      selfRolesPanelMessage,
      selfRoleIds,
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

    if (existingSettings) {
      await createGuildConfigVersion(
        supabase,
        existingSettings,
        {
          actorUserId:
            account.user.id,
          source:
            "save",
          label:
            "Before save",
        },
      );
    }

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

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "settings.saved",
        payload: {
          updated_at:
            data.updated_at,
        },
      });

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
      botMember,
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
        discordRequest(
          `/guilds/${guildId}/members/${config.clientId}`,
          {
            token:
              config.botToken,
            authType: "Bot",
          },
        ),
      ]);

    const botRoleIds =
      new Set(
        (
          Array.isArray(
            botMember?.roles,
          )
            ? botMember.roles
            : []
        ).map(
          (value) =>
            String(value),
        ),
      );

    const botHighestRolePosition =
      (
        Array.isArray(roles)
          ? roles
          : []
      ).reduce(
        (highest, role) =>
          botRoleIds.has(
            String(
              role.id,
            ),
          )
            ? Math.max(
                highest,
                Number(
                  role.position ||
                  0,
                ),
              )
            : highest,
        0,
      );

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
            manageable:
              Number(
                role.position ||
                0,
              ) <
              botHighestRolePosition,
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

const ISTE_AUTOMOD_PREFIX =
  "ISTe AutoMod •";

function parseAutomodWords(
  value,
) {
  return [
    ...new Set(
      String(value || "")
        .split(/[\n,]+/)
        .map(
          (item) =>
            item
              .trim()
              .slice(
                0,
                60,
              ),
        )
        .filter(Boolean),
    ),
  ].slice(0, 1000);
}

function uniqueSnowflakes(
  values,
) {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            String(
              value ||
              "",
            ),
        )
        .filter(
          (value) =>
            isSnowflake(
              value,
            ),
        ),
    ),
  ];
}

function automodActions(
  alertChannelId,
) {
  return [
    {
      type: 1,
      metadata: {
        custom_message:
          "ISTe AutoMod: повідомлення заблоковано.",
      },
    },
    ...(
      isSnowflake(
        alertChannelId,
      )
        ? [
            {
              type: 2,
              metadata: {
                channel_id:
                  alertChannelId,
              },
            },
          ]
        : []
    ),
  ];
}

function buildDesiredAutomodRules(
  settings,
) {
  if (
    settings.automodEnabled !==
    true
  ) {
    return [];
  }

  const exemptRoles =
    uniqueSnowflakes([
      settings.adminRoleId,
      settings.moderatorRoleId,
      settings
        .ticketSupportRoleId,
    ]);

  const actions =
    automodActions(
      settings
        .automodAlertChannelId ||
      settings.logChannelId,
    );

  const rules = [];
  const keywords =
    parseAutomodWords(
      settings
        .automodForbiddenWords,
    );

  if (
    settings
      .automodInvitesEnabled
  ) {
    keywords.push(
      "*discord.gg/*",
      "*discord.com/invite/*",
      "*discord.com/invites/*",
    );
  }

  if (
    keywords.length ||
    settings.automodCapsEnabled
  ) {
    rules.push({
      key: "keywords",
      name:
        `${ISTE_AUTOMOD_PREFIX}Keywords`,
      triggerType: 1,
      triggerMetadata: {
        keyword_filter:
          [
            ...new Set(
              keywords,
            ),
          ].slice(
            0,
            1000,
          ),
        regex_patterns:
          settings
            .automodCapsEnabled
            ? [
                "[A-ZА-ЯІЇЄҐ]{12,}",
              ]
            : [],
      },
      actions,
      exemptRoles,
    });
  }

  if (
    settings
      .automodSpamEnabled
  ) {
    rules.push({
      key: "spam",
      name:
        `${ISTE_AUTOMOD_PREFIX}Spam`,
      triggerType: 3,
      triggerMetadata: {},
      actions,
      exemptRoles,
    });
  }

  if (
    settings
      .automodMentionEnabled
  ) {
    rules.push({
      key: "mentions",
      name:
        `${ISTE_AUTOMOD_PREFIX}Mentions`,
      triggerType: 5,
      triggerMetadata: {
        mention_total_limit:
          settings
            .automodMentionLimit,
        mention_raid_protection_enabled:
          true,
      },
      actions,
      exemptRoles,
    });
  }

  return rules;
}

async function syncAutomodRules(
  guildId,
  settings,
  config,
) {
  const existing =
    await discordRequest(
      `/guilds/${guildId}/auto-moderation/rules`,
      {
        token:
          config.botToken,
        authType: "Bot",
      },
    );

  const allRules =
    Array.isArray(existing)
      ? existing
      : [];

  const managed =
    allRules.filter(
      (rule) =>
        String(
          rule?.name ||
          "",
        ).startsWith(
          ISTE_AUTOMOD_PREFIX,
        ),
    );

  const desired =
    buildDesiredAutomodRules(
      settings,
    );

  const desiredNames =
    new Set(
      desired.map(
        (rule) =>
          rule.name,
      ),
    );

  for (
    const oldRule
    of managed
  ) {
    if (
      !desiredNames.has(
        String(
          oldRule?.name ||
          "",
        ),
      )
    ) {
      await discordRequest(
        `/guilds/${guildId}/auto-moderation/rules/${oldRule.id}`,
        {
          method: "DELETE",
          token:
            config.botToken,
          authType: "Bot",
        },
      );
    }
  }

  const ids = {};
  const warnings = [];

  for (
    const rule
    of desired
  ) {
    let current =
      managed.find(
        (item) =>
          item?.name ===
          rule.name,
      );

    if (
      current &&
      Number(
        current.trigger_type,
      ) !==
        rule.triggerType
    ) {
      await discordRequest(
        `/guilds/${guildId}/auto-moderation/rules/${current.id}`,
        {
          method: "DELETE",
          token:
            config.botToken,
          authType: "Bot",
        },
      );

      current = null;
    }

    if (
      !current &&
      [3, 5].includes(
        rule.triggerType,
      )
    ) {
      const external =
        allRules.find(
          (item) =>
            !String(
              item?.name ||
              "",
            ).startsWith(
              ISTE_AUTOMOD_PREFIX,
            ) &&
            Number(
              item?.trigger_type,
            ) ===
              rule.triggerType,
        );

      if (external) {
        warnings.push(
          rule.key,
        );
        continue;
      }
    }

    const common = {
      name:
        rule.name,
      event_type: 1,
      trigger_metadata:
        rule.triggerMetadata,
      actions:
        rule.actions,
      enabled: true,
      exempt_roles:
        rule.exemptRoles,
      exempt_channels: [],
    };

    let result;

    if (current?.id) {
      result =
        await discordRequest(
          `/guilds/${guildId}/auto-moderation/rules/${current.id}`,
          {
            method: "PATCH",
            token:
              config.botToken,
            authType: "Bot",
            body:
              common,
          },
        );
    } else {
      result =
        await discordRequest(
          `/guilds/${guildId}/auto-moderation/rules`,
          {
            method: "POST",
            token:
              config.botToken,
            authType: "Bot",
            body: {
              ...common,
              trigger_type:
                rule.triggerType,
            },
          },
        );
    }

    if (result?.id) {
      ids[rule.key] =
        String(
          result.id,
        );
    }
  }

  return {
    ids,
    warnings,
  };
}

async function handleSyncAutomod(
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

    const settings =
      normalizeSettings(
        settingsResult.data,
      );

    const sync =
      await syncAutomodRules(
        guildId,
        settings,
        config,
      );

    const rawConfig =
      settingsResult.data
        .config &&
      typeof settingsResult.data
        .config ===
        "object"
        ? settingsResult.data
            .config
        : {};

    const {
      error: updateError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .update({
        config: {
          ...rawConfig,
          automodRuleIds:
            sync.ids,
          automodSyncWarnings:
            sync.warnings,
          automodLastSyncedAt:
            new Date()
              .toISOString(),
        },
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
        enabled:
          settings
            .automodEnabled ===
          true,
        rules:
          sync.ids,
        warnings:
          sync.warnings,
      });
  } catch (error) {
    console.error(
      "AutoMod sync error:",
      error,
    );

    if (
      error?.status ===
      403
    ) {
      return sendError(
        response,
        403,
        "AUTOMOD_MANAGE_GUILD_REQUIRED",
        "ISTe Bot потрібне право Manage Server. Натисніть «Оновити права бота» і повторно авторизуйте його.",
      );
    }

    return sendError(
      response,
      502,
      "AUTOMOD_SYNC_FAILED",
      error instanceof Error &&
      error.message
        ? `Не вдалося синхронізувати AutoMod: ${error.message}`
        : "Не вдалося синхронізувати AutoMod.",
    );
  }
}

async function handleWorkerAutomodEvent(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: false,
        maxBodyBytes: 8192,
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const userId =
    String(
      body.userId ||
      "",
    ).trim();
  const channelId =
    String(
      body.channelId ||
      "",
    ).trim();
  const ruleId =
    String(
      body.ruleId ||
      "",
    ).trim();
  const actionType =
    Number(
      body.actionType ||
      0,
    );

  if (
    !isSnowflake(
      guildId,
    ) ||
    !isSnowflake(
      userId,
    ) ||
    !isSnowflake(
      ruleId,
    ) ||
    actionType !== 1
  ) {
    return response
      .status(200)
      .json({
        ok: true,
        ignored: true,
      });
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data:
        settingsRow,
      error:
        settingsError,
    } = await supabase
      .from(
        "discord_guild_settings",
      )
      .select("*")
      .eq(
        "guild_id",
        guildId,
      )
      .maybeSingle();

    if (
      settingsError ||
      !settingsRow
    ) {
      return response
        .status(200)
        .json({
          ok: true,
          ignored: true,
        });
    }

    const settings =
      normalizeSettings(
        settingsRow,
      );

    const managedIds =
      Object.values(
        settings
          .automodRuleIds ||
        {},
      ).map(
        (value) =>
          String(value),
      );

    if (
      settings
        .automodEnabled !==
        true ||
      !managedIds.includes(
        ruleId,
      )
    ) {
      return response
        .status(200)
        .json({
          ok: true,
          ignored: true,
        });
    }

    const matchedKeyword =
      String(
        body.matchedKeyword ||
        "",
      )
        .trim()
        .slice(0, 120);

    const ruleKey =
      Object.entries(
        settings
          .automodRuleIds ||
        {},
      ).find(
        ([
          ,
          value,
        ]) =>
          String(value) ===
          ruleId,
      )?.[0] ||
      "automod";

    const reason =
      `AutoMod ${ruleKey}${matchedKeyword ? `: ${matchedKeyword}` : ""}`
        .slice(
          0,
          256,
        );

    const now =
      new Date()
        .toISOString();

    const {
      data:
        warnCase,
      error:
        warnError,
    } = await supabase
      .from(
        "discord_moderation_cases",
      )
      .insert({
        guild_id:
          guildId,
        target_user_id:
          userId,
        moderator_user_id:
          config.clientId,
        action: "warn",
        reason,
        status: "active",
        metadata: {
          source:
            "automod",
          rule_id:
            ruleId,
          rule_key:
            ruleKey,
          channel_id:
            channelId ||
            null,
          matched_keyword:
            matchedKeyword ||
            null,
        },
      })
      .select("*")
      .single();

    if (warnError) {
      throw warnError;
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "automod.warn",
        payload: {
          case_id:
            warnCase.id,
          user_id:
            userId,
          rule_id:
            ruleId,
          rule_key:
            ruleKey,
          channel_id:
            channelId ||
            null,
        },
      });

    const since =
      new Date(
        Date.now() -
          settings
            .automodEscalationWindowMinutes *
            60 *
            1000,
      ).toISOString();

    const {
      data:
        recentWarnings,
      error:
        recentWarningsError,
    } = await supabase
      .from(
        "discord_moderation_cases",
      )
      .select(
        "id, created_at, metadata",
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "target_user_id",
        userId,
      )
      .eq(
        "action",
        "warn",
      )
      .eq(
        "status",
        "active",
      )
      .gte(
        "created_at",
        since,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(20);

    if (
      recentWarningsError
    ) {
      throw recentWarningsError;
    }

    const automodWarnings =
      (
        recentWarnings ||
        []
      ).filter(
        (item) =>
          item?.metadata
            ?.source ===
          "automod",
      );

    const threshold =
      settings
        .automodEscalationCount;

    let timedOut = false;
    let timeoutCaseId = null;

    if (
      automodWarnings.length >=
      threshold
    ) {
      const {
        data:
          recentTimeouts,
        error:
          recentTimeoutsError,
      } = await supabase
        .from(
          "discord_moderation_cases",
        )
        .select(
          "id, created_at, metadata",
        )
        .eq(
          "guild_id",
          guildId,
        )
        .eq(
          "target_user_id",
          userId,
        )
        .eq(
          "action",
          "timeout",
        )
        .gte(
          "created_at",
          since,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(10);

      if (
        recentTimeoutsError
      ) {
        throw recentTimeoutsError;
      }

      const alreadyEscalated =
        (
          recentTimeouts ||
          []
        ).some(
          (item) =>
            item?.metadata
              ?.source ===
            "automod",
        );

      if (!alreadyEscalated) {
        const timeoutMinutes =
          settings
            .automodTimeoutMinutes;

        const until =
          new Date(
            Date.now() +
              timeoutMinutes *
                60 *
                1000,
          ).toISOString();

        await discordRequest(
          `/guilds/${guildId}/members/${userId}`,
          {
            method: "PATCH",
            token:
              config.botToken,
            authType: "Bot",
            body: {
              communication_disabled_until:
                until,
            },
          },
        );

        const {
          data:
            timeoutCase,
          error:
            timeoutCaseError,
        } = await supabase
          .from(
            "discord_moderation_cases",
          )
          .insert({
            guild_id:
              guildId,
            target_user_id:
              userId,
            moderator_user_id:
              config.clientId,
            action:
              "timeout",
            reason:
              `AutoMod escalation after ${automodWarnings.length} violations`,
            duration_minutes:
              timeoutMinutes,
            status:
              "completed",
            metadata: {
              source:
                "automod",
              escalation:
                true,
              warning_count:
                automodWarnings.length,
              window_minutes:
                settings
                  .automodEscalationWindowMinutes,
            },
          })
          .select("*")
          .single();

        if (
          timeoutCaseError
        ) {
          throw timeoutCaseError;
        }

        timeoutCaseId =
          timeoutCase.id;
        timedOut = true;

        await supabase
          .from(
            "discord_bot_audit",
          )
          .insert({
            guild_id:
              guildId,
            event_type:
              "automod.timeout",
            payload: {
              case_id:
                timeoutCase.id,
              user_id:
                userId,
              minutes:
                timeoutMinutes,
              warning_count:
                automodWarnings.length,
            },
          });
      }
    }

    return response
      .status(200)
      .json({
        ok: true,
        caseId:
          warnCase.id,
        warningCount:
          automodWarnings.length,
        timedOut,
        timeoutCaseId,
        processedAt:
          now,
      });
  } catch (error) {
    console.error(
      "Worker AutoMod event error:",
      error,
    );

    return sendError(
      response,
      500,
      "AUTOMOD_EVENT_FAILED",
      "Could not process AutoMod event.",
    );
  }
}

async function handleModerationHistory(
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
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const targetUserId =
    String(
      body.targetUserId ||
      "",
    ).trim();
  const action =
    String(
      body.action ||
      "",
    )
      .trim()
      .toLowerCase();
  const allowedActions =
    new Set([
      "",
      "warn",
      "unwarn",
      "timeout",
      "kick",
      "ban",
      "unban",
    ]);

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  if (
    targetUserId &&
    !isSnowflake(
      targetUserId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_TARGET_USER_ID",
      "Discord User ID має містити 17–20 цифр.",
    );
  }

  if (
    !allowedActions.has(
      action,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_MODERATION_ACTION",
      "Некоректний тип moderation case.",
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
        "Немає доступу до налаштувань цього сервера.",
      );
    }

    let caseQuery =
      supabase
        .from(
          "discord_moderation_cases",
        )
        .select("*")
        .eq(
          "guild_id",
          guildId,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(60);

    if (targetUserId) {
      caseQuery =
        caseQuery.eq(
          "target_user_id",
          targetUserId,
        );
    }

    if (action) {
      caseQuery =
        caseQuery.eq(
          "action",
          action,
        );
    }

    let warningCountQuery =
      supabase
        .from(
          "discord_moderation_cases",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "guild_id",
          guildId,
        )
        .eq(
          "action",
          "warn",
        )
        .eq(
          "status",
          "active",
        );

    if (targetUserId) {
      warningCountQuery =
        warningCountQuery.eq(
          "target_user_id",
          targetUserId,
        );
    }

    const since24h =
      new Date(
        Date.now() -
          24 * 60 * 60 *
            1000,
      ).toISOString();

    const [
      casesResult,
      auditResult,
      totalCountResult,
      warningCountResult,
      recentCountResult,
    ] =
      await Promise.all([
        caseQuery,
        supabase
          .from(
            "discord_bot_audit",
          )
          .select(
            "id, event_type, payload, created_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(60),
        supabase
          .from(
            "discord_moderation_cases",
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            },
          )
          .eq(
            "guild_id",
            guildId,
          ),
        warningCountQuery,
        supabase
          .from(
            "discord_moderation_cases",
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            },
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since24h,
          ),
      ]);

    for (
      const result
      of [
        casesResult,
        auditResult,
        totalCountResult,
        warningCountResult,
        recentCountResult,
      ]
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        filters: {
          targetUserId,
          action,
        },
        summary: {
          totalCases:
            totalCountResult
              .count ||
            0,
          activeWarnings:
            warningCountResult
              .count ||
            0,
          last24h:
            recentCountResult
              .count ||
            0,
        },
        cases:
          casesResult.data ||
          [],
        audit:
          auditResult.data ||
          [],
      });
  } catch (error) {
    console.error(
      "Moderation history error:",
      error,
    );

    return sendError(
      response,
      500,
      "MODERATION_HISTORY_FAILED",
      "Не вдалося завантажити журнал модерації.",
    );
  }
}

async function readManagedGuildSettings(
  request,
  response,
  guildId,
) {
  const account =
    await requireAccount(
      request,
      response,
    );

  if (!account.ok) {
    return {
      ok: false,
      sent:
        sendError(
          response,
          account.status,
          account.error,
          account.message,
        ),
    };
  }

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
    return {
      ok: false,
      sent:
        sendError(
          response,
          403,
          "GUILD_LICENSE_REQUIRED",
          "Немає активної ліцензії для цього сервера.",
        ),
    };
  }

  if (
    settingsResult.error ||
    !settingsResult.data
  ) {
    return {
      ok: false,
      sent:
        sendError(
          response,
          404,
          "GUILD_SETTINGS_NOT_FOUND",
          "Спочатку збережіть налаштування сервера.",
        ),
    };
  }

  return {
    ok: true,
    account,
    supabase,
    settingsRow:
      settingsResult.data,
    settings:
      normalizeSettings(
        settingsResult.data,
      ),
  };
}

async function publishManagedDiscordPanel({
  guildId,
  channelId,
  messageBody,
  rawConfig,
  messageIdKey,
  channelIdKey,
  config,
}) {
  const oldMessageId =
    String(
      rawConfig[
        messageIdKey
      ] ||
      "",
    );
  const oldChannelId =
    String(
      rawConfig[
        channelIdKey
      ] ||
      "",
    );

  let panelMessage = null;

  if (
    isSnowflake(
      oldMessageId,
    ) &&
    oldChannelId ===
      channelId
  ) {
    try {
      panelMessage =
        await discordRequest(
          `/channels/${channelId}/messages/${oldMessageId}`,
          {
            method: "PATCH",
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
        channelId
    ) {
      await discordRequest(
        `/channels/${oldChannelId}/messages/${oldMessageId}`,
        {
          method: "DELETE",
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
        `/channels/${channelId}/messages`,
        {
          method: "POST",
          token:
            config.botToken,
          authType: "Bot",
          body:
            messageBody,
        },
      );
  }

  return panelMessage;
}

async function handlePublishVerificationPanel(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const {
      settings,
      settingsRow,
      supabase,
      account,
    } = access;

    if (
      !settings
        .verificationEnabled
    ) {
      return sendError(
        response,
        409,
        "VERIFICATION_DISABLED",
        "Спочатку увімкніть Verification.",
      );
    }

    if (
      !isSnowflake(
        settings
          .verificationPanelChannelId,
      ) ||
      !isSnowflake(
        settings
          .verificationRoleId,
      )
    ) {
      return sendError(
        response,
        400,
        "VERIFICATION_SETTINGS_REQUIRED",
        "Оберіть канал Verification та verified роль.",
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

    const messageBody = {
      embeds: [
        {
          title:
            (
              settings
                .verificationPanelTitle ||
              (
                language === "en"
                  ? "ISTe Verification"
                  : "Верифікація ISTe"
              )
            ).slice(
              0,
              256,
            ),
          description:
            (
              settings
                .verificationPanelMessage ||
              (
                language === "en"
                  ? "Press the button below to verify and unlock server access."
                  : "Натисни кнопку нижче, щоб підтвердити доступ до сервера."
              )
            ).slice(
              0,
              4096,
            ),
          color: 0xe30613,
          footer: {
            text:
              "ISTe Verification • istesport.com",
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id:
                "iste:verify:confirm",
              label:
                language ===
                  "en"
                  ? "Verify"
                  : "Підтвердити",
              emoji: {
                name: "✅",
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
      settingsRow.config &&
      typeof settingsRow.config ===
        "object"
        ? settingsRow.config
        : {};

    const panelMessage =
      await publishManagedDiscordPanel({
        guildId,
        channelId:
          settings
            .verificationPanelChannelId,
        messageBody,
        rawConfig,
        messageIdKey:
          "verificationPanelMessageId",
        channelIdKey:
          "verificationPanelMessageChannelId",
        config,
      });

    const nextConfig = {
      ...rawConfig,
      verificationPanelMessageId:
        String(
          panelMessage?.id ||
          "",
        ),
      verificationPanelMessageChannelId:
        settings
          .verificationPanelChannelId,
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
            .verificationPanelChannelId,
        messageId:
          String(
            panelMessage?.id ||
            "",
          ),
      });
  } catch (error) {
    console.error(
      "Publish verification panel error:",
      error,
    );

    return sendError(
      response,
      502,
      "VERIFICATION_PANEL_PUBLISH_FAILED",
      error instanceof Error &&
      error.message
        ? `Не вдалося опублікувати Verification panel: ${error.message}`
        : "Не вдалося опублікувати Verification panel.",
    );
  }
}

async function handlePublishSelfRolesPanel(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const {
      settings,
      settingsRow,
      supabase,
      account,
    } = access;

    if (
      !settings
        .selfRolesEnabled
    ) {
      return sendError(
        response,
        409,
        "SELF_ROLES_DISABLED",
        "Спочатку увімкніть Button Roles.",
      );
    }

    if (
      !isSnowflake(
        settings
          .selfRolesPanelChannelId,
      ) ||
      !settings
        .selfRoleIds
        .length
    ) {
      return sendError(
        response,
        400,
        "SELF_ROLES_SETTINGS_REQUIRED",
        "Оберіть канал та хоча б одну self role.",
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

    const roles =
      await discordRequest(
        `/guilds/${guildId}/roles`,
        {
          token:
            config.botToken,
          authType: "Bot",
        },
      );

    const selectedRoles =
      settings
        .selfRoleIds
        .map(
          (roleId) =>
            (
              Array.isArray(
                roles,
              )
                ? roles
                : []
            ).find(
              (role) =>
                String(
                  role.id,
                ) ===
                roleId,
            ),
        )
        .filter(Boolean)
        .slice(0, 10);

    if (
      !selectedRoles.length
    ) {
      return sendError(
        response,
        409,
        "SELF_ROLES_NOT_FOUND",
        "Обрані ролі більше не існують у Discord.",
      );
    }

    const language =
      settings.locale ===
        "en"
        ? "en"
        : "uk";

    const buttonRows = [];

    for (
      let index = 0;
      index <
        selectedRoles.length;
      index += 5
    ) {
      buttonRows.push({
        type: 1,
        components:
          selectedRoles
            .slice(
              index,
              index + 5,
            )
            .map(
              (role) => ({
                type: 2,
                style: 2,
                custom_id:
                  `iste:role:${role.id}`,
                label:
                  String(
                    role.name ||
                    "Role",
                  ).slice(
                    0,
                    80,
                  ),
              }),
            ),
      });
    }

    const messageBody = {
      embeds: [
        {
          title:
            (
              settings
                .selfRolesPanelTitle ||
              (
                language === "en"
                  ? "Choose your roles"
                  : "Обери свої ролі"
              )
            ).slice(
              0,
              256,
            ),
          description:
            (
              settings
                .selfRolesPanelMessage ||
              (
                language === "en"
                  ? "Press a role button to add it. Press it again to remove it."
                  : "Натисни кнопку ролі, щоб отримати її. Повторне натискання зніме роль."
              )
            ).slice(
              0,
              4096,
            ),
          color: 0xe30613,
          footer: {
            text:
              "ISTe Roles • istesport.com",
          },
        },
      ],
      components:
        buttonRows,
      allowed_mentions: {
        parse: [],
      },
    };

    const rawConfig =
      settingsRow.config &&
      typeof settingsRow.config ===
        "object"
        ? settingsRow.config
        : {};

    const panelMessage =
      await publishManagedDiscordPanel({
        guildId,
        channelId:
          settings
            .selfRolesPanelChannelId,
        messageBody,
        rawConfig,
        messageIdKey:
          "selfRolesPanelMessageId",
        channelIdKey:
          "selfRolesPanelMessageChannelId",
        config,
      });

    const nextConfig = {
      ...rawConfig,
      selfRolesPanelMessageId:
        String(
          panelMessage?.id ||
          "",
        ),
      selfRolesPanelMessageChannelId:
        settings
          .selfRolesPanelChannelId,
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
            .selfRolesPanelChannelId,
        messageId:
          String(
            panelMessage?.id ||
            "",
          ),
        roles:
          selectedRoles.map(
            (role) => ({
              id:
                String(
                  role.id,
                ),
              name:
                String(
                  role.name ||
                  "",
                ),
            }),
          ),
      });
  } catch (error) {
    console.error(
      "Publish self roles panel error:",
      error,
    );

    return sendError(
      response,
      502,
      "SELF_ROLES_PANEL_PUBLISH_FAILED",
      error instanceof Error &&
      error.message
        ? `Не вдалося опублікувати Button Roles panel: ${error.message}`
        : "Не вдалося опублікувати Button Roles panel.",
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


function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function pickRandomUserIds(
  rows,
  count,
  exclude = [],
) {
  const excluded =
    new Set(
      (Array.isArray(exclude)
        ? exclude
        : []
      ).map(
        (value) =>
          String(value),
      ),
    );

  const values =
    [
      ...new Set(
        (Array.isArray(rows)
          ? rows
          : []
        )
          .map(
            (row) =>
              String(
                row?.user_id ||
                row ||
                "",
              ),
          )
          .filter(
            (value) =>
              isSnowflake(value) &&
              !excluded.has(value),
          ),
      ),
    ];

  for (
    let index =
      values.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex =
      randomInt(
        index + 1,
      );

    [
      values[index],
      values[swapIndex],
    ] = [
      values[swapIndex],
      values[index],
    ];
  }

  return values.slice(
    0,
    Math.max(
      0,
      Math.min(
        Number(count) || 0,
        values.length,
      ),
    ),
  );
}

function giveawayMessageBody(
  giveaway,
  participantCount = 0,
  locale = "uk",
  state = "active",
) {
  const english =
    locale === "en";
  const endsAt =
    new Date(
      giveaway.ends_at ||
      giveaway.endsAt,
    );
  const unix =
    Number.isNaN(
      endsAt.getTime(),
    )
      ? 0
      : Math.floor(
          endsAt.getTime() /
          1000,
        );
  const roleId =
    String(
      giveaway.required_role_id ||
      giveaway.requiredRoleId ||
      "",
    );
  const fields = [
    {
      name:
        english
          ? "Winners"
          : "Переможців",
      value:
        String(
          giveaway.winner_count ||
          giveaway.winnerCount ||
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
        String(
          participantCount,
        ),
      inline: true,
    },
  ];

  if (unix) {
    fields.push({
      name:
        english
          ? "Ends"
          : "Завершення",
      value:
        "<t:" +
        String(unix) +
        (
          state === "active"
            ? ":R>"
            : ":f>"
        ),
      inline: true,
    });
  }

  if (isSnowflake(roleId)) {
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

  const statusText =
    state === "cancelled"
      ? (
          english
            ? "❌ Giveaway cancelled"
            : "❌ Розіграш скасовано"
        )
      : state === "ended"
        ? (
            english
              ? "🏁 Giveaway ended"
              : "🏁 Розіграш завершено"
          )
        : "";

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
          [
            String(
              giveaway.description ||
              "",
            )
              .trim()
              .slice(
                0,
                3000,
              ),
            statusText,
          ]
            .filter(Boolean)
            .join("\n\n"),
        color:
          state === "cancelled"
            ? 0x6b7280
            : 0xe30613,
        fields,
        footer: {
          text:
            "ISTe Giveaways • istesport.com",
        },
        timestamp:
          new Date()
            .toISOString(),
      },
    ],
    components:
      state === "active"
        ? [
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
          ]
        : [],
    allowed_mentions: {
      parse: [],
    },
  };
}

async function handlePublicationsList(
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
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;

    const [
      giveawaysResult,
      scheduledResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_giveaways",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(30),
        supabase
          .from(
            "discord_scheduled_messages",
          )
          .select("*")
          .eq(
            "guild_id",
            guildId,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(30),
      ]);

    if (
      giveawaysResult.error ||
      scheduledResult.error
    ) {
      throw (
        giveawaysResult.error ||
        scheduledResult.error
      );
    }

    const ids =
      (giveawaysResult.data || [])
        .map(
          (row) =>
            row.id,
        );

    const counts = {};

    if (ids.length) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "discord_giveaway_participants",
        )
        .select(
          "giveaway_id",
        )
        .in(
          "giveaway_id",
          ids,
        );

      if (error) {
        throw error;
      }

      for (
        const row
        of (data || [])
      ) {
        counts[
          row.giveaway_id
        ] =
          (
            counts[
              row.giveaway_id
            ] ||
            0
          ) + 1;
      }
    }

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        giveaways:
          (giveawaysResult.data || [])
            .map(
              (row) => ({
                ...row,
                participant_count:
                  counts[
                    row.id
                  ] ||
                  0,
              }),
            ),
        scheduled:
          scheduledResult.data ||
          [],
      });
  } catch (error) {
    console.error(
      "Publications list error:",
      error,
    );

    return sendError(
      response,
      500,
      "PUBLICATIONS_LOAD_FAILED",
      "Не вдалося завантажити публікації Discord.",
    );
  }
}

async function handleCreateGiveaway(
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
        maxBodyBytes: 16384,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
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
  const channelId =
    String(
      body.channelId ||
      "",
    ).trim();
  const prize =
    String(
      body.prize ||
      "",
    )
      .trim()
      .slice(0, 200);
  const description =
    String(
      body.description ||
      "",
    )
      .trim()
      .slice(0, 3000);
  const requiredRoleId =
    String(
      body.requiredRoleId ||
      "",
    ).trim();
  const winnerCount =
    Math.max(
      1,
      Math.min(
        20,
        Math.round(
          Number(
            body.winnerCount ||
            1,
          ) ||
          1,
        ),
      ),
    );
  const endsAt =
    new Date(
      body.endsAt,
    );

  if (
    !isSnowflake(guildId) ||
    !isSnowflake(channelId)
  ) {
    return sendError(
      response,
      400,
      "INVALID_GIVEAWAY_CHANNEL",
      "Оберіть коректний Discord канал.",
    );
  }

  if (!prize) {
    return sendError(
      response,
      400,
      "GIVEAWAY_PRIZE_REQUIRED",
      "Вкажіть приз розіграшу.",
    );
  }

  if (
    requiredRoleId &&
    !isSnowflake(
      requiredRoleId,
    )
  ) {
    return sendError(
      response,
      400,
      "INVALID_REQUIRED_ROLE",
      "Некоректна обов'язкова роль.",
    );
  }

  if (
    Number.isNaN(
      endsAt.getTime(),
    ) ||
    endsAt.getTime() <
      Date.now() +
      60000
  ) {
    return sendError(
      response,
      400,
      "INVALID_GIVEAWAY_END",
      "Час завершення має бути щонайменше через 1 хвилину.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const account =
      access.account;
    const settings =
      access.settings;

    const {
      data:
        giveaway,
      error:
        insertError,
    } = await supabase
      .from(
        "discord_giveaways",
      )
      .insert({
        guild_id:
          guildId,
        channel_id:
          channelId,
        prize,
        description,
        required_role_id:
          requiredRoleId,
        winner_count:
          winnerCount,
        ends_at:
          endsAt
            .toISOString(),
        status:
          "active",
        created_by:
          account.user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    try {
      const config =
        readConfig();

      if (!config.botToken) {
        throw new Error(
          "DISCORD_BOT_TOKEN missing",
        );
      }

      const message =
        await discordRequest(
          "/channels/" +
          channelId +
          "/messages",
          {
            method: "POST",
            token:
              config.botToken,
            authType: "Bot",
            body:
              giveawayMessageBody(
                giveaway,
                0,
                settings.locale,
                "active",
              ),
          },
        );

      const {
        error:
          updateError,
      } = await supabase
        .from(
          "discord_giveaways",
        )
        .update({
          message_id:
            String(
              message?.id ||
              "",
            ),
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          giveaway.id,
        );

      if (updateError) {
        throw updateError;
      }

      await supabase
        .from(
          "discord_bot_audit",
        )
        .insert({
          guild_id:
            guildId,
          event_type:
            "giveaway.created",
          payload: {
            giveaway_id:
              giveaway.id,
            channel_id:
              channelId,
            message_id:
              String(
                message?.id ||
                "",
              ),
            prize,
            winner_count:
              winnerCount,
            ends_at:
              endsAt
                .toISOString(),
          },
        });

      return response
        .status(200)
        .json({
          ok: true,
          giveaway: {
            ...giveaway,
            message_id:
              String(
                message?.id ||
                "",
              ),
            participant_count:
              0,
          },
        });
    } catch (publishError) {
      await supabase
        .from(
          "discord_giveaways",
        )
        .delete()
        .eq(
          "id",
          giveaway.id,
        );

      throw publishError;
    }
  } catch (error) {
    console.error(
      "Create giveaway error:",
      error,
    );

    return sendError(
      response,
      502,
      "GIVEAWAY_CREATE_FAILED",
      error instanceof Error &&
      error.message
        ? "Не вдалося створити розіграш: " +
          error.message
        : "Не вдалося створити розіграш.",
    );
  }
}

async function handleCancelGiveaway(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const giveawayId =
    String(
      body.giveawayId ||
      "",
    ).trim();

  if (
    !isSnowflake(guildId) ||
    !isUuid(giveawayId)
  ) {
    return sendError(
      response,
      400,
      "INVALID_GIVEAWAY",
      "Некоректний розіграш.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const settings =
      access.settings;

    const {
      data:
        giveaway,
      error,
    } = await supabase
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
      error ||
      !giveaway
    ) {
      return sendError(
        response,
        404,
        "GIVEAWAY_NOT_FOUND",
        "Розіграш не знайдено.",
      );
    }

    if (
      giveaway.status !==
      "active"
    ) {
      return sendError(
        response,
        409,
        "GIVEAWAY_NOT_ACTIVE",
        "Цей розіграш уже не активний.",
      );
    }

    const {
      count,
      error:
        countError,
    } = await supabase
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

    if (countError) {
      throw countError;
    }

    const now =
      new Date()
        .toISOString();

    const {
      error:
        updateError,
    } = await supabase
      .from(
        "discord_giveaways",
      )
      .update({
        status:
          "cancelled",
        ended_at:
          now,
        updated_at:
          now,
      })
      .eq(
        "id",
        giveawayId,
      );

    if (updateError) {
      throw updateError;
    }

    if (
      isSnowflake(
        giveaway.channel_id,
      ) &&
      isSnowflake(
        giveaway.message_id,
      )
    ) {
      const config =
        readConfig();

      await discordRequest(
        "/channels/" +
        giveaway.channel_id +
        "/messages/" +
        giveaway.message_id,
        {
          method: "PATCH",
          token:
            config.botToken,
          authType: "Bot",
          body:
            giveawayMessageBody(
              giveaway,
              count || 0,
              settings.locale,
              "cancelled",
            ),
        },
      ).catch(
        () => null,
      );
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "giveaway.cancelled",
        payload: {
          giveaway_id:
            giveawayId,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Cancel giveaway error:",
      error,
    );

    return sendError(
      response,
      500,
      "GIVEAWAY_CANCEL_FAILED",
      "Не вдалося скасувати розіграш.",
    );
  }
}

async function handleRerollGiveaway(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const giveawayId =
    String(
      body.giveawayId ||
      "",
    ).trim();

  if (
    !isSnowflake(guildId) ||
    !isUuid(giveawayId)
  ) {
    return sendError(
      response,
      400,
      "INVALID_GIVEAWAY",
      "Некоректний розіграш.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const settings =
      access.settings;

    const {
      data:
        giveaway,
      error,
    } = await supabase
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
      error ||
      !giveaway
    ) {
      return sendError(
        response,
        404,
        "GIVEAWAY_NOT_FOUND",
        "Розіграш не знайдено.",
      );
    }

    if (
      giveaway.status !==
      "ended"
    ) {
      return sendError(
        response,
        409,
        "GIVEAWAY_NOT_ENDED",
        "Reroll доступний лише після завершення розіграшу.",
      );
    }

    const {
      data:
        participants,
      error:
        participantError,
    } = await supabase
      .from(
        "discord_giveaway_participants",
      )
      .select(
        "user_id",
      )
      .eq(
        "giveaway_id",
        giveawayId,
      );

    if (
      participantError
    ) {
      throw participantError;
    }

    const previous =
      Array.isArray(
        giveaway
          .winner_user_ids,
      )
        ? giveaway
            .winner_user_ids
        : [];

    let winners =
      pickRandomUserIds(
        participants,
        giveaway
          .winner_count,
        previous,
      );

    if (!winners.length) {
      winners =
        pickRandomUserIds(
          participants,
          giveaway
            .winner_count,
        );
    }

    const {
      error:
        updateError,
    } = await supabase
      .from(
        "discord_giveaways",
      )
      .update({
        winner_user_ids:
          winners,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        giveawayId,
      );

    if (updateError) {
      throw updateError;
    }

    if (
      isSnowflake(
        giveaway.channel_id,
      )
    ) {
      const config =
        readConfig();
      const english =
        settings.locale ===
        "en";

      await discordRequest(
        "/channels/" +
        giveaway.channel_id +
        "/messages",
        {
          method: "POST",
          token:
            config.botToken,
          authType: "Bot",
          body: {
            content:
              winners.length
                ? (
                    english
                      ? "🔁 Reroll winners: "
                      : "🔁 Нові переможці: "
                  ) +
                  winners
                    .map(
                      (id) =>
                        "<@" +
                        id +
                        ">",
                    )
                    .join(" ")
                : (
                    english
                      ? "🔁 Reroll: no eligible participants."
                      : "🔁 Reroll: немає доступних учасників."
                  ),
            allowed_mentions: {
              parse: [],
              users:
                winners,
            },
          },
        },
      );
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "giveaway.rerolled",
        payload: {
          giveaway_id:
            giveawayId,
          previous_winners:
            previous,
          winners,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
        winners,
      });
  } catch (error) {
    console.error(
      "Reroll giveaway error:",
      error,
    );

    return sendError(
      response,
      500,
      "GIVEAWAY_REROLL_FAILED",
      "Не вдалося виконати reroll.",
    );
  }
}

async function handleCreateScheduledMessage(
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
        maxBodyBytes: 20000,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
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
  const channelId =
    String(
      body.channelId ||
      "",
    ).trim();
  const content =
    String(
      body.content ||
      "",
    )
      .trim()
      .slice(0, 2000);
  const embedTitle =
    String(
      body.embedTitle ||
      "",
    )
      .trim()
      .slice(0, 256);
  const embedDescription =
    String(
      body.embedDescription ||
      "",
    )
      .trim()
      .slice(0, 4000);
  const scheduledAt =
    new Date(
      body.scheduledAt,
    );

  if (
    !isSnowflake(guildId) ||
    !isSnowflake(channelId)
  ) {
    return sendError(
      response,
      400,
      "INVALID_SCHEDULE_CHANNEL",
      "Оберіть коректний Discord канал.",
    );
  }

  if (
    !content &&
    !embedTitle &&
    !embedDescription
  ) {
    return sendError(
      response,
      400,
      "SCHEDULE_CONTENT_REQUIRED",
      "Додайте текст або Embed.",
    );
  }

  if (
    Number.isNaN(
      scheduledAt.getTime(),
    ) ||
    scheduledAt.getTime() <
      Date.now() +
      30000
  ) {
    return sendError(
      response,
      400,
      "INVALID_SCHEDULE_TIME",
      "Час публікації має бути в майбутньому.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const account =
      access.account;

    const {
      data:
        scheduled,
      error,
    } = await supabase
      .from(
        "discord_scheduled_messages",
      )
      .insert({
        guild_id:
          guildId,
        channel_id:
          channelId,
        content,
        embed_title:
          embedTitle,
        embed_description:
          embedDescription,
        scheduled_at:
          scheduledAt
            .toISOString(),
        status:
          "scheduled",
        created_by:
          account.user.id,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "scheduled_message.created",
        payload: {
          scheduled_message_id:
            scheduled.id,
          channel_id:
            channelId,
          scheduled_at:
            scheduled
              .scheduled_at,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
        scheduled,
      });
  } catch (error) {
    console.error(
      "Create scheduled message error:",
      error,
    );

    return sendError(
      response,
      500,
      "SCHEDULE_CREATE_FAILED",
      "Не вдалося запланувати повідомлення.",
    );
  }
}

async function handleCancelScheduledMessage(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const scheduledId =
    String(
      body.scheduledId ||
      "",
    ).trim();

  if (
    !isSnowflake(guildId) ||
    !isUuid(scheduledId)
  ) {
    return sendError(
      response,
      400,
      "INVALID_SCHEDULE",
      "Некоректна запланована публікація.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;

    const {
      data,
      error,
    } = await supabase
      .from(
        "discord_scheduled_messages",
      )
      .update({
        status:
          "cancelled",
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        scheduledId,
      )
      .eq(
        "guild_id",
        guildId,
      )
      .eq(
        "status",
        "scheduled",
      )
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return sendError(
        response,
        409,
        "SCHEDULE_NOT_ACTIVE",
        "Це повідомлення вже не очікує публікації.",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Cancel scheduled message error:",
      error,
    );

    return sendError(
      response,
      500,
      "SCHEDULE_CANCEL_FAILED",
      "Не вдалося скасувати публікацію.",
    );
  }
}

function requireWorkerBot(
  request,
  response,
) {
  const config =
    readConfig();
  const auth =
    String(
      request.headers
        ?.authorization ||
      "",
    );

  if (
    !config.botToken ||
    !safeEqual(
      auth,
      "Bot " +
      config.botToken,
    )
  ) {
    sendError(
      response,
      401,
      "BOT_AUTH_REQUIRED",
      "Bot authentication required.",
    );

    return null;
  }

  return config;
}

async function handleWorkerPublicationsDue(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: false,
        maxBodyBytes: 2048,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  if (
    !requireWorkerBot(
      request,
      response,
    )
  ) {
    return;
  }

  try {
    const supabase =
      getSupabaseAdminClient();
    const now =
      new Date()
        .toISOString();

    const [
      giveawaysResult,
      scheduledResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_giveaways",
          )
          .select("*")
          .eq(
            "status",
            "active",
          )
          .lte(
            "ends_at",
            now,
          )
          .order(
            "ends_at",
            {
              ascending:
                true,
            },
          )
          .limit(8),
        supabase
          .from(
            "discord_scheduled_messages",
          )
          .select("*")
          .eq(
            "status",
            "scheduled",
          )
          .lte(
            "scheduled_at",
            now,
          )
          .order(
            "scheduled_at",
            {
              ascending:
                true,
            },
          )
          .limit(8),
      ]);

    if (
      giveawaysResult.error ||
      scheduledResult.error
    ) {
      throw (
        giveawaysResult.error ||
        scheduledResult.error
      );
    }

    const giveaways = [];

    for (
      const giveaway
      of (giveawaysResult.data || [])
    ) {
      const {
        data:
          participants,
        error:
          participantError,
      } = await supabase
        .from(
          "discord_giveaway_participants",
        )
        .select(
          "user_id",
        )
        .eq(
          "giveaway_id",
          giveaway.id,
        );

      if (participantError) {
        throw participantError;
      }

      let winners =
        Array.isArray(
          giveaway
            .winner_user_ids,
        )
          ? giveaway
              .winner_user_ids
              .map(
                (value) =>
                  String(value),
              )
              .filter(
                (value) =>
                  isSnowflake(value),
              )
          : [];

      if (!winners.length) {
        winners =
          pickRandomUserIds(
            participants,
            giveaway
              .winner_count,
          );

        const {
          error:
            winnerError,
        } = await supabase
          .from(
            "discord_giveaways",
          )
          .update({
            winner_user_ids:
              winners,
            last_attempt_at:
              now,
            updated_at:
              now,
          })
          .eq(
            "id",
            giveaway.id,
          )
          .eq(
            "status",
            "active",
          );

        if (winnerError) {
          throw winnerError;
        }
      }

      const {
        data:
          settingsRow,
      } = await supabase
        .from(
          "discord_guild_settings",
        )
        .select(
          "locale",
        )
        .eq(
          "guild_id",
          giveaway
            .guild_id,
        )
        .maybeSingle();

      giveaways.push({
        ...giveaway,
        winner_user_ids:
          winners,
        participant_count:
          (participants || [])
            .length,
        locale:
          settingsRow
            ?.locale ===
            "en"
            ? "en"
            : "uk",
      });
    }

    return response
      .status(200)
      .json({
        ok: true,
        giveaways,
        scheduled:
          scheduledResult.data ||
          [],
      });
  } catch (error) {
    console.error(
      "Worker publications due error:",
      error,
    );

    return sendError(
      response,
      500,
      "PUBLICATION_JOBS_FAILED",
      "Could not load due Discord publications.",
    );
  }
}

async function handleWorkerPublicationResult(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: false,
        maxBodyBytes: 8192,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  if (
    !requireWorkerBot(
      request,
      response,
    )
  ) {
    return;
  }

  const body =
    readJsonBody(request) ||
    {};
  const kind =
    String(
      body.kind ||
      "",
    );
  const id =
    String(
      body.id ||
      "",
    );
  const ok =
    body.ok === true;
  const messageId =
    String(
      body.messageId ||
      "",
    );
  const errorMessage =
    String(
      body.error ||
      "",
    )
      .slice(0, 1000);

  if (
    ![
      "giveaway",
      "scheduled",
    ].includes(kind) ||
    !isUuid(id)
  ) {
    return sendError(
      response,
      400,
      "INVALID_PUBLICATION_RESULT",
      "Invalid publication result.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();
    const now =
      new Date()
        .toISOString();

    const table =
      kind === "giveaway"
        ? "discord_giveaways"
        : "discord_scheduled_messages";

    const {
      data:
        current,
      error:
        currentError,
    } = await supabase
      .from(table)
      .select("*")
      .eq(
        "id",
        id,
      )
      .maybeSingle();

    if (
      currentError ||
      !current
    ) {
      return response
        .status(200)
        .json({
          ok: true,
          ignored: true,
        });
    }

    const attempts =
      Number(
        current
          .delivery_attempts ||
        0,
      ) + 1;

    let update;

    if (
      kind ===
      "scheduled"
    ) {
      update = {
        status:
          ok
            ? "sent"
            : attempts >= 5
              ? "failed"
              : "scheduled",
        sent_message_id:
          ok
            ? messageId
            : current
                .sent_message_id,
        error_message:
          ok
            ? null
            : errorMessage,
        delivery_attempts:
          attempts,
        last_attempt_at:
          now,
        sent_at:
          ok
            ? now
            : current
                .sent_at,
        updated_at:
          now,
      };
    } else {
      update = {
        status:
          ok
            ? "ended"
            : attempts >= 5
              ? "cancelled"
              : "active",
        delivery_attempts:
          attempts,
        last_error:
          ok
            ? null
            : errorMessage,
        last_attempt_at:
          now,
        ended_at:
          ok ||
          attempts >= 5
            ? now
            : current
                .ended_at,
        updated_at:
          now,
      };
    }

    const {
      error:
        updateError,
    } = await supabase
      .from(table)
      .update(update)
      .eq(
        "id",
        id,
      );

    if (updateError) {
      throw updateError;
    }

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          current.guild_id,
        event_type:
          kind === "scheduled"
            ? (
                ok
                  ? "scheduled_message.sent"
                  : "scheduled_message.delivery_failed"
              )
            : (
                ok
                  ? "giveaway.ended"
                  : "giveaway.delivery_failed"
              ),
        payload: {
          id,
          message_id:
            messageId ||
            null,
          attempt:
            attempts,
          error:
            errorMessage ||
            null,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Worker publication result error:",
      error,
    );

    return sendError(
      response,
      500,
      "PUBLICATION_RESULT_FAILED",
      "Could not persist Discord publication result.",
    );
  }
}


function analyticsDayKey(
  value,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Europe/Kyiv",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    )
      .formatToParts(
        date,
      )
      .reduce(
        (
          result,
          part,
        ) => {
          if (
            part.type !==
            "literal"
          ) {
            result[
              part.type
            ] =
              part.value;
          }

          return result;
        },
        {},
      );

  return (
    String(
      parts.year ||
      "",
    ) +
    "-" +
    String(
      parts.month ||
      "",
    ) +
    "-" +
    String(
      parts.day ||
      "",
    )
  );
}

function analyticsTimeline(
  days,
  auditRows,
  moderationRows,
) {
  const result = [];
  const map = new Map();

  for (
    let offset =
      days - 1;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(
        Date.now() -
          offset *
            86400000,
      );
    const key =
      analyticsDayKey(
        date,
      );

    const item = {
      date: key,
      joins: 0,
      leaves: 0,
      moderation: 0,
      tickets: 0,
      verification: 0,
      roles: 0,
      giveaways: 0,
      publications: 0,
      recruitment: 0,
      total: 0,
    };

    result.push(item);
    map.set(
      key,
      item,
    );
  }

  for (
    const row
    of (
      Array.isArray(
        auditRows,
      )
        ? auditRows
        : []
    )
  ) {
    const key =
      analyticsDayKey(
        row.created_at,
      );
    const item =
      map.get(key);

    if (!item) {
      continue;
    }

    const event =
      String(
        row.event_type ||
        "",
      );

    item.total += 1;

    if (
      event ===
      "member.join"
    ) {
      item.joins += 1;
    } else if (
      event ===
      "member.leave"
    ) {
      item.leaves += 1;
    } else if (
      event.startsWith(
        "ticket.",
      )
    ) {
      item.tickets += 1;
    } else if (
      event ===
      "verification.completed"
    ) {
      item.verification += 1;
    } else if (
      event.startsWith(
        "self_role.",
      )
    ) {
      item.roles += 1;
    } else if (
      event.startsWith(
        "giveaway.",
      )
    ) {
      item.giveaways += 1;
    } else if (
      event.startsWith(
        "scheduled_message.",
      )
    ) {
      item.publications += 1;
    } else if (
      event.startsWith(
        "recruitment.",
      )
    ) {
      item.recruitment += 1;
    }
  }

  for (
    const row
    of (
      Array.isArray(
        moderationRows,
      )
        ? moderationRows
        : []
    )
  ) {
    const key =
      analyticsDayKey(
        row.created_at,
      );
    const item =
      map.get(key);

    if (item) {
      item.moderation +=
        1;
      item.total += 1;
    }
  }

  return result;
}

function analyticsEventLabel(
  eventType,
) {
  const labels = {
    "member.join":
      "Member joined",
    "member.leave":
      "Member left",
    "verification.completed":
      "Verification completed",
    "self_role.added":
      "Self role added",
    "self_role.removed":
      "Self role removed",
    "ticket.created":
      "Ticket created",
    "ticket.closed":
      "Ticket closed",
    "ticket.reopened":
      "Ticket reopened",
    "ticket.deleted":
      "Ticket deleted",
    "giveaway.created":
      "Giveaway created",
    "giveaway.joined":
      "Giveaway joined",
    "giveaway.left":
      "Giveaway left",
    "giveaway.ended":
      "Giveaway ended",
    "giveaway.rerolled":
      "Giveaway rerolled",
    "scheduled_message.created":
      "Scheduled message created",
    "scheduled_message.sent":
      "Scheduled message sent",
    "automod.warn":
      "AutoMod warning",
    "automod.timeout":
      "AutoMod timeout",
  };

  return (
    labels[eventType] ||
    String(
      eventType ||
      "event",
    )
  );
}

async function handleWorkerMemberEvent(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: false,
        maxBodyBytes: 4096,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  if (
    !requireWorkerBot(
      request,
      response,
    )
  ) {
    return;
  }

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const userId =
    String(
      body.userId ||
      "",
    ).trim();
  const type =
    String(
      body.type ||
      "",
    ).trim();

  if (
    !isSnowflake(
      guildId,
    ) ||
    !isSnowflake(
      userId,
    ) ||
    ![
      "join",
      "leave",
    ].includes(type)
  ) {
    return sendError(
      response,
      400,
      "INVALID_MEMBER_EVENT",
      "Invalid member event.",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    await supabase
      .from(
        "discord_bot_audit",
      )
      .insert({
        guild_id:
          guildId,
        event_type:
          "member." +
          type,
        payload: {
          user_id:
            userId,
          member_count:
            Number(
              body.memberCount ||
              0,
            ) ||
            null,
          is_bot:
            body.isBot ===
            true,
          account_created_at:
            String(
              body.accountCreatedAt ||
              "",
            ) ||
            null,
        },
      });

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Worker member event error:",
      error,
    );

    return sendError(
      response,
      500,
      "MEMBER_EVENT_FAILED",
      "Could not record member event.",
    );
  }
}

async function handleWorkerHealthSnapshot(
  request,
  response,
) {
  const guard =
    guardRequest(
      request,
      {
        methods: ["POST"],
        requireJson: true,
        requireOrigin: false,
        maxBodyBytes: 12000,
      },
    );

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  if (
    !requireWorkerBot(
      request,
      response,
    )
  ) {
    return;
  }

  const body =
    readJsonBody(request) ||
    {};

  try {
    const supabase =
      getSupabaseAdminClient();

    const snapshot = {
      worker_id:
        String(
          body.workerId ||
          "discord-primary",
        )
          .trim()
          .slice(
            0,
            80,
          ),
      ready:
        body.ready ===
        true,
      ws_ping_ms:
        Number.isFinite(
          Number(
            body.wsPingMs,
          ),
        )
          ? Math.max(
              0,
              Math.round(
                Number(
                  body.wsPingMs,
                ),
              ),
            )
          : null,
      uptime_seconds:
        Math.max(
          0,
          Math.round(
            Number(
              body.uptimeSeconds ||
              0,
            ) ||
            0,
          ),
        ),
      guild_count:
        Math.max(
          0,
          Math.round(
            Number(
              body.guildCount ||
              0,
            ) ||
            0,
          ),
        ),
      metrics:
        body.metrics &&
        typeof body.metrics ===
          "object"
          ? body.metrics
          : {},
    };

    const {
      error,
    } = await supabase
      .from(
        "discord_bot_health_snapshots",
      )
      .insert(
        snapshot,
      );

    if (error) {
      throw error;
    }

    if (
      Math.random() <
      0.05
    ) {
      const cutoff =
        new Date(
          Date.now() -
            30 *
              86400000,
        ).toISOString();

      await supabase
        .from(
          "discord_bot_health_snapshots",
        )
        .delete()
        .lt(
          "captured_at",
          cutoff,
        );
    }

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Worker health snapshot error:",
      error,
    );

    return sendError(
      response,
      500,
      "HEALTH_SNAPSHOT_FAILED",
      "Could not store worker health snapshot.",
    );
  }
}


const DIAGNOSTIC_PERMISSION_BITS =
  Object.freeze({
    viewChannels: 1n << 10n,
    sendMessages: 1n << 11n,
    manageMessages: 1n << 13n,
    embedLinks: 1n << 14n,
    readHistory: 1n << 16n,
    manageRoles: 1n << 28n,
    manageChannels: 1n << 4n,
    manageGuild: 1n << 5n,
    kickMembers: 1n << 1n,
    banMembers: 1n << 2n,
    moderateMembers: 1n << 40n,
    administrator: 1n << 3n,
  });

function discordPermissionValue(value) {
  try {
    return BigInt(String(value || "0"));
  } catch {
    return 0n;
  }
}

function diagnosticStatusRank(status) {
  return ({ ok: 0, warning: 1, error: 2 })[status] ?? 0;
}

function diagnosticCheck(id, title, status, detail, items = []) {
  return { id, title, status, detail, items };
}

async function handleDiagnosticsOverview(request, response) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 4096,
  });

  if (!guard.ok) {
    return sendGuardError(response, guard);
  }

  const body = readJsonBody(request) || {};
  const guildId = String(body.guildId || "").trim();

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  try {
    const access = await readManagedGuildSettings(
      request,
      response,
      guildId,
    );

    if (!access.ok) {
      return access.sent;
    }

    const { supabase, settings } = access;
    const config = readConfig();

    if (!config.botToken) {
      return response.status(200).json({
        ok: true,
        guildId,
        checkedAt: new Date().toISOString(),
        overallStatus: "error",
        summary: { ok: 0, warning: 0, error: 1 },
        checks: [
          diagnosticCheck(
            "bot-token",
            "Discord Bot token",
            "error",
            "DISCORD_BOT_TOKEN відсутній у Vercel.",
          ),
        ],
        permissions: [],
        worker: null,
        bot: null,
      });
    }

    const [
      botUserResult,
      rolesResult,
      channelsResult,
      botMemberResult,
      healthResult,
      failuresResult,
    ] = await Promise.allSettled([
      discordRequest("/users/@me", {
        token: config.botToken,
        authType: "Bot",
      }),
      discordRequest("/guilds/" + guildId + "/roles", {
        token: config.botToken,
        authType: "Bot",
      }),
      discordRequest("/guilds/" + guildId + "/channels", {
        token: config.botToken,
        authType: "Bot",
      }),
      discordRequest(
        "/guilds/" + guildId + "/members/" + config.clientId,
        {
          token: config.botToken,
          authType: "Bot",
        },
      ),
      supabase
        .from("discord_bot_health_snapshots")
        .select(
          "ready,ws_ping_ms,uptime_seconds,guild_count,metrics,captured_at",
        )
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("discord_bot_audit")
        .select("id,event_type,payload,created_at")
        .eq("guild_id", guildId)
        .in("event_type", [
          "scheduled_message.delivery_failed",
          "giveaway.delivery_failed",
        ])
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 3600000).toISOString(),
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const checks = [];

    const botUser =
      botUserResult.status === "fulfilled"
        ? botUserResult.value
        : null;

    const roles =
      rolesResult.status === "fulfilled" &&
      Array.isArray(rolesResult.value)
        ? rolesResult.value
        : [];

    const channels =
      channelsResult.status === "fulfilled" &&
      Array.isArray(channelsResult.value)
        ? channelsResult.value
        : [];

    const botMember =
      botMemberResult.status === "fulfilled"
        ? botMemberResult.value
        : null;

    if (!botUser) {
      checks.push(
        diagnosticCheck(
          "bot-identity",
          "Bot identity",
          "error",
          botUserResult.reason?.message ||
            "Discord відхилив Bot token.",
        ),
      );
    } else {
      const identityMatches =
        String(botUser.id || "") === String(config.clientId || "");

      checks.push(
        diagnosticCheck(
          "bot-identity",
          "Bot identity",
          identityMatches ? "ok" : "error",
          identityMatches
            ? String(botUser.username || "ISTe Bot") +
                " (" +
                String(botUser.id) +
                ") відповідає DISCORD_CLIENT_ID."
            : "Token належить Discord user " +
                String(botUser.id) +
                ", а DISCORD_CLIENT_ID = " +
                String(config.clientId) +
                ".",
        ),
      );
    }

    if (!roles.length || !channels.length || !botMember) {
      const resourceErrors = [
        rolesResult,
        channelsResult,
        botMemberResult,
      ]
        .filter((result) => result.status === "rejected")
        .map(
          (result) =>
            result.reason?.message || "Discord API error",
        );

      checks.push(
        diagnosticCheck(
          "guild-access",
          "Discord server access",
          "error",
          resourceErrors.join(" · ") ||
            "Не вдалося прочитати ресурси Discord-сервера.",
        ),
      );
    } else {
      checks.push(
        diagnosticCheck(
          "guild-access",
          "Discord server access",
          "ok",
          "Доступ підтверджено: " +
            String(roles.length) +
            " ролей, " +
            String(channels.length) +
            " каналів.",
        ),
      );
    }

    const roleMap = new Map(
      roles.map((role) => [String(role.id), role]),
    );

    const channelMap = new Map(
      channels.map((channel) => [String(channel.id), channel]),
    );

    const botRoleIds = new Set(
      (
        Array.isArray(botMember?.roles)
          ? botMember.roles
          : []
      ).map((value) => String(value)),
    );

    let effectivePermissions = discordPermissionValue(
      roleMap.get(guildId)?.permissions,
    );

    let botHighestRolePosition = 0;

    for (const roleId of botRoleIds) {
      const role = roleMap.get(roleId);
      if (!role) continue;

      effectivePermissions |= discordPermissionValue(
        role.permissions,
      );

      botHighestRolePosition = Math.max(
        botHighestRolePosition,
        Number(role.position || 0),
      );
    }

    const administrator =
      (
        effectivePermissions &
        DIAGNOSTIC_PERMISSION_BITS.administrator
      ) !== 0n;

    const hasPermission = (bit) =>
      administrator || (effectivePermissions & bit) !== 0n;

    const roleFeaturesEnabled =
      settings.autoRolesEnabled ||
      settings.verificationEnabled ||
      settings.selfRolesEnabled;

    const channelsFeatureEnabled =
      settings.ticketsEnabled ||
      settings.privateVoiceEnabled;

    const moderationEnabled =
      settings.moderationEnabled === true;

    const automodEnabled =
      settings.automodEnabled === true;

    const permissionDefinitions = [
      {
        key: "viewChannels",
        label: "View Channels",
        required: true,
      },
      {
        key: "sendMessages",
        label: "Send Messages",
        required: true,
      },
      {
        key: "embedLinks",
        label: "Embed Links",
        required: true,
      },
      {
        key: "readHistory",
        label: "Read Message History",
        required: true,
      },
      {
        key: "manageRoles",
        label: "Manage Roles",
        required: roleFeaturesEnabled,
      },
      {
        key: "manageChannels",
        label: "Manage Channels",
        required: channelsFeatureEnabled,
      },
      {
        key: "manageMessages",
        label: "Manage Messages",
        required: moderationEnabled,
      },
      {
        key: "moderateMembers",
        label: "Moderate Members",
        required: moderationEnabled || automodEnabled,
      },
      {
        key: "manageGuild",
        label: "Manage Server",
        required: automodEnabled,
      },
      {
        key: "kickMembers",
        label: "Kick Members",
        required: moderationEnabled,
      },
      {
        key: "banMembers",
        label: "Ban Members",
        required: moderationEnabled,
      },
    ];

    const permissions = permissionDefinitions.map((definition) => {
      const granted = hasPermission(
        DIAGNOSTIC_PERMISSION_BITS[definition.key],
      );

      return {
        ...definition,
        granted,
        status: !definition.required
          ? "optional"
          : granted
            ? "ok"
            : "error",
      };
    });

    const missingRequired = permissions.filter(
      (permission) =>
        permission.required && !permission.granted,
    );

    checks.push(
      diagnosticCheck(
        "permissions",
        "Discord permissions",
        missingRequired.length ? "error" : "ok",
        missingRequired.length
          ? "Не вистачає " +
              String(missingRequired.length) +
              " обов'язкових permission(s)."
          : administrator
            ? "Administrator активний. Усі необхідні права покрито."
            : "Усі права, потрібні активним модулям, доступні.",
        missingRequired.map((permission) => permission.label),
      ),
    );

    const channelReferences = [
      [
        "Log channel",
        settings.logChannelId,
        false,
        [0, 5],
      ],
      [
        "Welcome channel",
        settings.welcomeChannelId,
        settings.welcomeEnabled,
        [0, 5],
      ],
      [
        "LIVE match channel",
        settings.matchChannelId,
        Boolean(settings.matchChannelId),
        [0, 5],
      ],
      [
        "AutoMod alerts",
        settings.automodAlertChannelId,
        automodEnabled &&
          Boolean(settings.automodAlertChannelId),
        [0, 5],
      ],
      [
        "Verification panel",
        settings.verificationPanelChannelId,
        settings.verificationEnabled,
        [0, 5],
      ],
      [
        "Self Roles panel",
        settings.selfRolesPanelChannelId,
        settings.selfRolesEnabled,
        [0, 5],
      ],
      [
        "Ticket panel",
        settings.ticketPanelChannelId,
        settings.ticketsEnabled,
        [0, 5],
      ],
      [
        "Ticket log",
        settings.ticketLogChannelId,
        settings.ticketsEnabled &&
          Boolean(settings.ticketLogChannelId),
        [0, 5],
      ],
      [
        "Ticket category",
        settings.ticketCategoryId,
        settings.ticketsEnabled,
        [4],
      ],
    ];

    const channelIssues = [];

    for (const [
      label,
      id,
      required,
      allowedTypes,
    ] of channelReferences) {
      if (!id) {
        if (required) {
          channelIssues.push(label + ": не налаштовано");
        }
        continue;
      }

      const channel = channelMap.get(String(id));

      if (!channel) {
        channelIssues.push(
          label + ": канал видалено або недоступний",
        );
        continue;
      }

      if (
        !allowedTypes.includes(Number(channel.type))
      ) {
        channelIssues.push(
          label + ": неправильний тип каналу",
        );
      }
    }

    checks.push(
      diagnosticCheck(
        "channels",
        "Configured channels",
        channelIssues.length ? "error" : "ok",
        channelIssues.length
          ? String(channelIssues.length) +
              " проблем із каналами."
          : "Усі налаштовані канали існують і мають правильний тип.",
        channelIssues,
      ),
    );

    const roleReferences = [
      [
        "Member role",
        settings.memberRoleId,
        settings.autoRolesEnabled,
        true,
      ],
      [
        "Verification role",
        settings.verificationRoleId,
        settings.verificationEnabled,
        true,
      ],
      [
        "Verification remove role",
        settings.verificationRemoveRoleId,
        false,
        true,
      ],
      [
        "Admin role",
        settings.adminRoleId,
        false,
        false,
      ],
      [
        "Moderator role",
        settings.moderatorRoleId,
        false,
        false,
      ],
      [
        "Ticket support role",
        settings.ticketSupportRoleId,
        settings.ticketsEnabled,
        false,
      ],
      ...(
        Array.isArray(settings.selfRoleIds)
          ? settings.selfRoleIds.map((roleId, index) => [
              "Self role " + String(index + 1),
              roleId,
              settings.selfRolesEnabled,
              true,
            ])
          : []
      ),
    ];

    const roleIssues = [];

    for (const [
      label,
      id,
      required,
      mustManage,
    ] of roleReferences) {
      if (!id) {
        if (required) {
          roleIssues.push(label + ": не налаштовано");
        }
        continue;
      }

      const role = roleMap.get(String(id));

      if (!role) {
        roleIssues.push(
          label + ": роль видалено або недоступна",
        );
        continue;
      }

      if (
        mustManage &&
        Number(role.position || 0) >= botHighestRolePosition
      ) {
        roleIssues.push(
          label +
            ": роль ISTe Bot має бути вище @" +
            String(role.name || id),
        );
      }
    }

    checks.push(
      diagnosticCheck(
        "roles",
        "Configured roles",
        roleIssues.length ? "error" : "ok",
        roleIssues.length
          ? String(roleIssues.length) +
              " проблем із ролями або hierarchy."
          : "Усі налаштовані ролі існують, hierarchy коректна.",
        roleIssues,
      ),
    );

    const health =
      healthResult.status === "fulfilled" &&
      !healthResult.value.error
        ? healthResult.value.data
        : null;

    const healthAge = health?.captured_at
      ? Date.now() -
        new Date(health.captured_at).getTime()
      : Infinity;

    const workerFresh =
      health?.ready === true &&
      healthAge < 3 * 60 * 1000;

    checks.push(
      diagnosticCheck(
        "worker",
        "Discord worker",
        !health
          ? "warning"
          : workerFresh
            ? "ok"
            : "error",
        !health
          ? "Health snapshot ще не отримано."
          : workerFresh
            ? "Worker online · " +
                String(health.ws_ping_ms ?? "—") +
                " ms · uptime " +
                String(health.uptime_seconds ?? 0) +
                "s."
            : "Останній health snapshot застарів або worker не ready.",
      ),
    );

    const runtimeErrorItems = [];
    const metrics =
      health?.metrics &&
      typeof health.metrics === "object"
        ? health.metrics
        : {};

    const pushRuntimeError = (label, value) => {
      const text = String(value || "").trim();

      if (text) {
        runtimeErrorItems.push(label + ": " + text);
      }
    };

    pushRuntimeError("Presence", metrics.lastError);
    pushRuntimeError(
      "Welcome",
      metrics.welcome?.lastError,
    );
    pushRuntimeError(
      "AutoMod",
      metrics.automod?.lastError,
    );
    pushRuntimeError(
      "Private Voice",
      metrics.privateVoice?.lastError,
    );
    pushRuntimeError(
      "Publications",
      metrics.publications?.lastError,
    );

    const matchGuild =
      Array.isArray(
        metrics.matchAnnouncements?.guilds,
      )
        ? metrics.matchAnnouncements.guilds.find(
            (item) =>
              String(item.guildId || "") === guildId,
          )
        : null;

    pushRuntimeError(
      "LIVE announcements",
      matchGuild?.lastError,
    );

    checks.push(
      diagnosticCheck(
        "runtime-errors",
        "Runtime modules",
        runtimeErrorItems.length ? "error" : "ok",
        runtimeErrorItems.length
          ? String(runtimeErrorItems.length) +
              " runtime error(s) знайдено."
          : "Активні runtime модулі не повідомляють про помилки.",
        runtimeErrorItems,
      ),
    );

    const failureRows =
      failuresResult.status === "fulfilled" &&
      !failuresResult.value.error
        ? failuresResult.value.data || []
        : [];

    checks.push(
      diagnosticCheck(
        "delivery-failures",
        "Delivery failures · 24h",
        failureRows.length ? "warning" : "ok",
        failureRows.length
          ? String(failureRows.length) +
              " невдалих delivery attempt(s) за 24 години."
          : "Giveaways і Scheduled Messages не мають delivery failures за 24 години.",
        failureRows
          .slice(0, 5)
          .map(
            (row) =>
              String(row.event_type) +
              " · " +
              String(row.created_at),
          ),
      ),
    );

    const summary = {
      ok: checks.filter(
        (check) => check.status === "ok",
      ).length,
      warning: checks.filter(
        (check) => check.status === "warning",
      ).length,
      error: checks.filter(
        (check) => check.status === "error",
      ).length,
    };

    const overallStatus = checks.reduce(
      (current, check) =>
        diagnosticStatusRank(check.status) >
        diagnosticStatusRank(current)
          ? check.status
          : current,
      "ok",
    );

    return response.status(200).json({
      ok: true,
      guildId,
      checkedAt: new Date().toISOString(),
      overallStatus,
      summary,
      checks,
      permissions,
      worker: health,
      bot: botUser
        ? {
            id: String(botUser.id || ""),
            username: String(botUser.username || ""),
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Discord diagnostics error:",
      error,
    );

    return sendError(
      response,
      500,
      "DIAGNOSTICS_FAILED",
      error instanceof Error && error.message
        ? "Не вдалося виконати Discord diagnostics: " +
            error.message
        : "Не вдалося виконати Discord diagnostics.",
    );
  }
}

async function handleAnalyticsOverview(
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

  const body =
    readJsonBody(request) ||
    {};
  const guildId =
    String(
      body.guildId ||
      "",
    ).trim();
  const requestedDays =
    Number(
      body.days ||
      7,
    );
  const days =
    requestedDays ===
      30
      ? 30
      : 7;

  if (!isSnowflake(guildId)) {
    return sendError(
      response,
      400,
      "INVALID_GUILD_ID",
      "Некоректний Discord Server ID.",
    );
  }

  try {
    const access =
      await readManagedGuildSettings(
        request,
        response,
        guildId,
      );

    if (!access.ok) {
      return access.sent;
    }

    const supabase =
      access.supabase;
    const since =
      new Date(
        Date.now() -
          days *
            86400000,
      ).toISOString();
    const healthSince =
      new Date(
        Date.now() -
          24 *
            3600000,
      ).toISOString();

    const [
      auditResult,
      moderationResult,
      openWarningsResult,
      ticketResult,
      openTicketsResult,
      giveawaysResult,
      participantResult,
      scheduledResult,
      healthResult,
      latestHealthResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "discord_bot_audit",
          )
          .select(
            "id,event_type,payload,created_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(4000),
        supabase
          .from(
            "discord_moderation_cases",
          )
          .select(
            "id,action,status,target_user_id,moderator_user_id,reason,duration_minutes,created_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(1000),
        supabase
          .from(
            "discord_moderation_cases",
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            },
          )
          .eq(
            "guild_id",
            guildId,
          )
          .eq(
            "action",
            "warn",
          )
          .eq(
            "status",
            "active",
          ),
        supabase
          .from(
            "discord_tickets",
          )
          .select(
            "id,status,opener_id,created_at,closed_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(1000),
        supabase
          .from(
            "discord_tickets",
          )
          .select(
            "id",
            {
              count: "exact",
              head: true,
            },
          )
          .eq(
            "guild_id",
            guildId,
          )
          .eq(
            "status",
            "open",
          ),
        supabase
          .from(
            "discord_giveaways",
          )
          .select(
            "id,status,prize,winner_count,winner_user_ids,created_at,ends_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(500),
        supabase
          .from(
            "discord_giveaway_participants",
          )
          .select(
            "giveaway_id,user_id,joined_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "joined_at",
            since,
          )
          .limit(3000),
        supabase
          .from(
            "discord_scheduled_messages",
          )
          .select(
            "id,status,created_at,sent_at",
          )
          .eq(
            "guild_id",
            guildId,
          )
          .gte(
            "created_at",
            since,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(1000),
        supabase
          .from(
            "discord_bot_health_snapshots",
          )
          .select(
            "ready,ws_ping_ms,uptime_seconds,guild_count,metrics,captured_at",
          )
          .gte(
            "captured_at",
            healthSince,
          )
          .order(
            "captured_at",
            {
              ascending:
                true,
            },
          )
          .limit(500),
        supabase
          .from(
            "discord_bot_health_snapshots",
          )
          .select(
            "ready,ws_ping_ms,uptime_seconds,guild_count,metrics,captured_at",
          )
          .order(
            "captured_at",
            {
              ascending:
                false,
            },
          )
          .limit(1)
          .maybeSingle(),
      ]);

    const queryResults = [
      auditResult,
      moderationResult,
      openWarningsResult,
      ticketResult,
      openTicketsResult,
      giveawaysResult,
      participantResult,
      scheduledResult,
      healthResult,
      latestHealthResult,
    ];

    for (
      const result
      of queryResults
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    const auditRows =
      auditResult.data ||
      [];
    const moderationRows =
      moderationResult.data ||
      [];
    const ticketRows =
      ticketResult.data ||
      [];
    const giveawayRows =
      giveawaysResult.data ||
      [];
    const participantRows =
      participantResult.data ||
      [];
    const scheduledRows =
      scheduledResult.data ||
      [];
    const healthRows =
      healthResult.data ||
      [];

    const joins =
      auditRows.filter(
        (row) =>
          row.event_type ===
          "member.join",
      ).length;
    const leaves =
      auditRows.filter(
        (row) =>
          row.event_type ===
          "member.leave",
      ).length;
    const verified =
      auditRows.filter(
        (row) =>
          row.event_type ===
          "verification.completed",
      ).length;
    const selfRoleChanges =
      auditRows.filter(
        (row) =>
          String(
            row.event_type ||
            "",
          ).startsWith(
            "self_role.",
          ),
      ).length;
    const automodActions =
      auditRows.filter(
        (row) =>
          String(
            row.event_type ||
            "",
          ).startsWith(
            "automod.",
          ),
      ).length;
    const recruitment =
      auditRows.filter(
        (row) =>
          String(
            row.event_type ||
            "",
          ).startsWith(
            "recruitment.",
          ),
      ).length;

    const roleCounts = {};

    for (
      const row
      of auditRows
    ) {
      if (
        row.event_type !==
        "self_role.added"
      ) {
        continue;
      }

      const roleId =
        String(
          row.payload
            ?.role_id ||
          "",
        );

      if (isSnowflake(roleId)) {
        roleCounts[roleId] =
          (
            roleCounts[
              roleId
            ] ||
            0
          ) + 1;
      }
    }

    let currentMembers =
      null;
    let roleNames = {};

    try {
      const config =
        readConfig();

      if (config.botToken) {
        const [
          guild,
          roles,
        ] =
          await Promise.all([
            discordRequest(
              "/guilds/" +
              guildId +
              "?with_counts=true",
              {
                token:
                  config.botToken,
                authType: "Bot",
              },
            ),
            discordRequest(
              "/guilds/" +
              guildId +
              "/roles",
              {
                token:
                  config.botToken,
                authType: "Bot",
              },
            ),
          ]);

        currentMembers =
          Number(
            guild
              ?.approximate_member_count,
          ) ||
          null;

        roleNames =
          (
            Array.isArray(roles)
              ? roles
              : []
          ).reduce(
            (
              result,
              role,
            ) => {
              result[
                String(
                  role.id,
                )
              ] =
                String(
                  role.name ||
                  role.id,
                );

              return result;
            },
            {},
          );
      }
    } catch (error) {
      console.warn(
        "Analytics Discord enrichment failed:",
        error,
      );
    }

    const topSelfRoles =
      Object.entries(
        roleCounts,
      )
        .map(
          ([
            roleId,
            count,
          ]) => ({
            roleId,
            name:
              roleNames[
                roleId
              ] ||
              roleId,
            count,
          }),
        )
        .sort(
          (
            left,
            right,
          ) =>
            right.count -
            left.count,
        )
        .slice(0, 5);

    const healthReady =
      healthRows.filter(
        (row) =>
          row.ready ===
          true,
      ).length;
    const pingValues =
      healthRows
        .map(
          (row) =>
            Number(
              row.ws_ping_ms,
            ),
        )
        .filter(
          (value) =>
            Number.isFinite(
              value,
            ) &&
            value >= 0,
        );
    const uptime24h =
      healthRows.length
        ? Math.round(
            (
              healthReady /
              healthRows.length
            ) *
              10000,
          ) /
          100
        : null;
    const avgPing24h =
      pingValues.length
        ? Math.round(
            pingValues.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            ) /
              pingValues.length,
          )
        : null;

    const recentActivity =
      auditRows
        .slice(0, 30)
        .map(
          (row) => ({
            id:
              row.id,
            type:
              row.event_type,
            label:
              analyticsEventLabel(
                row.event_type,
              ),
            payload:
              row.payload ||
              {},
            createdAt:
              row.created_at,
          }),
        );

    return response
      .status(200)
      .json({
        ok: true,
        guildId,
        days,
        summary: {
          currentMembers,
          joins,
          leaves,
          netGrowth:
            joins -
            leaves,
          moderationCases:
            moderationRows.length,
          activeWarnings:
            openWarningsResult
              .count ||
            0,
          ticketsCreated:
            ticketRows.length,
          openTickets:
            openTicketsResult
              .count ||
            0,
          giveaways:
            giveawayRows.length,
          giveawayEntries:
            participantRows.length,
          scheduledMessages:
            scheduledRows.length,
          sentMessages:
            scheduledRows.filter(
              (row) =>
                row.status ===
                "sent",
            ).length,
          verified,
          selfRoleChanges,
          automodActions,
          recruitmentEvents:
            recruitment,
        },
        timeline:
          analyticsTimeline(
            days,
            auditRows,
            moderationRows,
          ),
        topSelfRoles,
        recentActivity,
        health: {
          latest:
            latestHealthResult
              .data ||
            null,
          uptime24h,
          avgPing24h,
          samples24h:
            healthRows.length,
        },
      });
  } catch (error) {
    console.error(
      "Analytics overview error:",
      error,
    );

    return sendError(
      response,
      500,
      "ANALYTICS_LOAD_FAILED",
      "Не вдалося завантажити Discord analytics.",
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
            automodEnabled:
              false,
            automodSpamEnabled:
              true,
            automodInvitesEnabled:
              true,
            automodMentionEnabled:
              true,
            automodCapsEnabled:
              false,
            automodForbiddenWords:
              "",
            automodAlertChannelId:
              "",
            automodMentionLimit:
              5,
            automodEscalationCount:
              3,
            automodEscalationWindowMinutes:
              10,
            automodTimeoutMinutes:
              10,
            automodRuleIds: {},
            verificationEnabled:
              false,
            verificationPanelChannelId:
              "",
            verificationRoleId:
              "",
            verificationRemoveRoleId:
              "",
            verificationPanelTitle:
              "",
            verificationPanelMessage:
              "",
            selfRolesEnabled:
              false,
            selfRolesPanelChannelId:
              "",
            selfRolesPanelTitle:
              "",
            selfRolesPanelMessage:
              "",
            selfRoleIds: [],
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
    "moderation-history"
  ) {
    return handleModerationHistory(
      request,
      response,
    );
  }

  if (
    action ===
    "sync-automod"
  ) {
    return handleSyncAutomod(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-automod-event"
  ) {
    return handleWorkerAutomodEvent(
      request,
      response,
    );
  }

  if (
    action ===
    "publish-verification-panel"
  ) {
    return handlePublishVerificationPanel(
      request,
      response,
    );
  }

  if (
    action ===
    "publish-self-roles-panel"
  ) {
    return handlePublishSelfRolesPanel(
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
    "command-center-overview"
  ) {
    return handleCommandCenterOverview(
      request,
      response,
    );
  }

  if (
    action ===
    "save-command-settings"
  ) {
    return handleSaveCommandSettings(
      request,
      response,
    );
  }

  if (
    action ===
    "reset-command-settings"
  ) {
    return handleResetCommandSettings(
      request,
      response,
    );
  }

  if (
    action ===
    "config-history-list"
  ) {
    return handleConfigHistoryList(
      request,
      response,
    );
  }

  if (
    action ===
    "create-config-snapshot"
  ) {
    return handleCreateConfigSnapshot(
      request,
      response,
    );
  }

  if (
    action ===
    "restore-config-version"
  ) {
    return handleRestoreConfigVersion(
      request,
      response,
    );
  }

  if (
    action ===
    "diagnostics-overview"
  ) {
    return handleDiagnosticsOverview(
      request,
      response,
    );
  }

  if (
    action ===
    "analytics-overview"
  ) {
    return handleAnalyticsOverview(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-member-event"
  ) {
    return handleWorkerMemberEvent(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-health-snapshot"
  ) {
    return handleWorkerHealthSnapshot(
      request,
      response,
    );
  }

  if (
    action ===
    "publications-list"
  ) {
    return handlePublicationsList(
      request,
      response,
    );
  }

  if (
    action ===
    "create-giveaway"
  ) {
    return handleCreateGiveaway(
      request,
      response,
    );
  }

  if (
    action ===
    "cancel-giveaway"
  ) {
    return handleCancelGiveaway(
      request,
      response,
    );
  }

  if (
    action ===
    "reroll-giveaway"
  ) {
    return handleRerollGiveaway(
      request,
      response,
    );
  }

  if (
    action ===
    "create-scheduled-message"
  ) {
    return handleCreateScheduledMessage(
      request,
      response,
    );
  }

  if (
    action ===
    "cancel-scheduled-message"
  ) {
    return handleCancelScheduledMessage(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-publications-due"
  ) {
    return handleWorkerPublicationsDue(
      request,
      response,
    );
  }

  if (
    action ===
    "worker-publication-result"
  ) {
    return handleWorkerPublicationResult(
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
