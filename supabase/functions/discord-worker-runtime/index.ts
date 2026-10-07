import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const BOT_TOKEN =
  Deno.env.get(
    "DISCORD_BOT_TOKEN",
  ) || "";

const CLIENT_ID =
  Deno.env.get(
    "DISCORD_CLIENT_ID",
  ) || "ISTeBot";

const SUPABASE_URL =
  Deno.env.get(
    "SUPABASE_URL",
  ) || "";

const SERVICE_ROLE =
  Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  ) || "";

const INTERNAL_GUILD_ID =
  "1334264628695404556";

const API =
  "https://discord.com/api/v10";

const db =
  SUPABASE_URL &&
  SERVICE_ROLE
    ? createClient(
        SUPABASE_URL,
        SERVICE_ROLE,
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

function json(
  status: number,
  payload: Record<
    string,
    unknown
  >,
) {
  return new Response(
    JSON.stringify(
      payload,
    ),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store",
      },
    },
  );
}

function safeEqual(
  left: string,
  right: string,
) {
  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let index = 0;
    index <
      left.length;
    index += 1
  ) {
    result |=
      left.charCodeAt(
        index,
      ) ^
      right.charCodeAt(
        index,
      );
  }

  return result === 0;
}

function isSnowflake(
  value: unknown,
) {
  return /^[0-9]{17,20}$/.test(
    String(
      value ||
      "",
    ),
  );
}

function configObject(
  row: any,
) {
  return (
    row?.config &&
    typeof row.config ===
      "object"
  )
    ? row.config
    : {};
}

function normalizeSettings(
  row: any,
  fallbackInternal = false,
) {
  const config =
    configObject(
      row,
    );

  return {
    guildId:
      String(
        row?.guild_id ||
        "",
      ),
    locale:
      row?.locale ===
        "en"
        ? "en"
        : "uk",
    adminRoleId:
      String(
        row?.admin_role_id ||
        "",
      ),
    moderatorRoleId:
      String(
        row?.moderator_role_id ||
        "",
      ),
    memberRoleId:
      String(
        row?.member_role_id ||
        "",
      ),
    logChannelId:
      String(
        row?.log_channel_id ||
        "",
      ),
    welcomeChannelId:
      String(
        row?.welcome_channel_id ||
        "",
      ),
    matchChannelId:
      String(
        config.matchChannelId ||
        "",
      ),
    welcomeTitle:
      String(
        config.welcomeTitle ||
        "",
      ),
    welcomeMessage:
      String(
        config.welcomeMessage ||
        "",
      ),
    welcomeMention:
      config.welcomeMention !==
      false,
    welcomeShowMemberCount:
      config
        .welcomeShowMemberCount !==
      false,
    moderationClearEnabled:
      config
        .moderationClearEnabled !==
      false,
    moderationTimeoutEnabled:
      config
        .moderationTimeoutEnabled !==
      false,
    automodEnabled:
      config.automodEnabled ===
      true,
    automodRuleIds:
      config.automodRuleIds &&
      typeof config.automodRuleIds ===
        "object"
        ? config.automodRuleIds
        : {},
    automodEscalationCount:
      Math.max(
        2,
        Math.min(
          10,
          Number(
            config
              .automodEscalationCount ||
            3,
          ) ||
          3,
        ),
      ),
    automodEscalationWindowMinutes:
      Math.max(
        1,
        Math.min(
          1440,
          Number(
            config
              .automodEscalationWindowMinutes ||
            10,
          ) ||
          10,
        ),
      ),
    automodTimeoutMinutes:
      Math.max(
        1,
        Math.min(
          40320,
          Number(
            config
              .automodTimeoutMinutes ||
            10,
          ) ||
          10,
        ),
      ),
    verificationEnabled:
      config
        .verificationEnabled ===
      true,
    verificationRoleId:
      String(
        config.verificationRoleId ||
        "",
      ),
    verificationRemoveRoleId:
      String(
        config
          .verificationRemoveRoleId ||
        "",
      ),
    selfRolesEnabled:
      config.selfRolesEnabled ===
      true,
    selfRoleIds:
      Array.isArray(
        config.selfRoleIds,
      )
        ? config.selfRoleIds.map(
            (
              value:
                unknown,
            ) =>
              String(value),
          )
        : [],
    ticketPanelChannelId:
      String(
        config
          .ticketPanelChannelId ||
        "",
      ),
    ticketCategoryId:
      String(
        config.ticketCategoryId ||
        "",
      ),
    ticketSupportRoleId:
      String(
        config
          .ticketSupportRoleId ||
        "",
      ),
    ticketLogChannelId:
      String(
        config
          .ticketLogChannelId ||
        "",
      ),
    ticketPanelTitle:
      String(
        config.ticketPanelTitle ||
        "",
      ),
    ticketPanelMessage:
      String(
        config.ticketPanelMessage ||
        "",
      ),
    ticketMaxOpenPerUser:
      Math.max(
        1,
        Math.min(
          5,
          Number(
            config
              .ticketMaxOpenPerUser ||
            1,
          ) ||
          1,
        ),
      ),
    privateVoiceEnabled:
      row
        ?.private_voice_enabled ===
        true ||
      fallbackInternal,
    autoRolesEnabled:
      row
        ?.auto_roles_enabled ===
        true ||
      fallbackInternal,
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
  };
}

async function discord(
  path: string,
  method = "GET",
  body?: unknown,
) {
  const response =
    await fetch(
      API + path,
      {
        method,
        headers: {
          Authorization:
            "Bot " +
            BOT_TOKEN,
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
    throw new Error(
      payload?.message ||
      "Discord API " +
      String(
        response.status,
      ),
    );
  }

  return payload;
}

function pickRandomUserIds(
  rows: any[],
  count: number,
) {
  const values =
    [
      ...new Set(
        (
          Array.isArray(rows)
            ? rows
            : []
        )
          .map(
            (row) =>
              String(
                row?.user_id ||
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

  const randomUint =
    () => {
      const buffer =
        new Uint32Array(1);

      crypto.getRandomValues(
        buffer,
      );

      return buffer[0];
    };

  for (
    let index =
      values.length - 1;
    index > 0;
    index -= 1
  ) {
    const swap =
      randomUint() %
      (
        index +
        1
      );

    [
      values[index],
      values[swap],
    ] = [
      values[swap],
      values[index],
    ];
  }

  return values.slice(
    0,
    Math.max(
      0,
      Math.min(
        count,
        values.length,
      ),
    ),
  );
}

async function handleConfig(
  body: any,
) {
  const guildId =
    String(
      body.guildId ||
      "",
    );

  if (
    !isSnowflake(
      guildId,
    )
  ) {
    return {
      status: 400,
      payload: {
        ok: false,
        error:
          "INVALID_GUILD_ID",
      },
    };
  }

  const [
    licenseResult,
    settingsResult,
  ] =
    await Promise.all([
      db!
        .from(
          "discord_guild_licenses",
        )
        .select("*")
        .eq(
          "guild_id",
          guildId,
        )
        .maybeSingle(),
      db!
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
        String(
          license.status ||
          "",
        ),
      ) &&
      (
        !license.expires_at ||
        new Date(
          license.expires_at,
        ).getTime() >
          Date.now()
      );
  }

  const settings =
    normalizeSettings(
      settingsResult.data,
      fallbackInternal,
    );

  return {
    status: 200,
    payload: {
      ok: true,
      guildId,
      active,
      plan:
        fallbackInternal
          ? "internal"
          : String(
              license?.plan ||
              "none",
            ),
      settings,
    },
  };
}

async function handleAutomod(
  body: any,
) {
  const guildId =
    String(
      body.guildId ||
      "",
    );
  const userId =
    String(
      body.userId ||
      "",
    );
  const channelId =
    String(
      body.channelId ||
      "",
    );
  const ruleId =
    String(
      body.ruleId ||
      "",
    );
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
    actionType !==
      1
  ) {
    return {
      status: 200,
      payload: {
        ok: true,
        ignored: true,
      },
    };
  }

  const {
    data:
      settingsRow,
    error:
      settingsError,
  } = await db!
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
    return {
      status: 200,
      payload: {
        ok: true,
        ignored: true,
      },
    };
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
    return {
      status: 200,
      payload: {
        ok: true,
        ignored: true,
      },
    };
  }

  const matchedKeyword =
    String(
      body.matchedKeyword ||
      "",
    )
      .trim()
      .slice(
        0,
        120,
      );

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
    (
      "AutoMod " +
      ruleKey +
      (
        matchedKeyword
          ? ": " +
            matchedKeyword
          : ""
      )
    ).slice(
      0,
      256,
    );

  const {
    data:
      warnCase,
    error:
      warnError,
  } = await db!
    .from(
      "discord_moderation_cases",
    )
    .insert({
      guild_id:
        guildId,
      target_user_id:
        userId,
      moderator_user_id:
        CLIENT_ID,
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

  await db!
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
          60000,
    ).toISOString();

  const {
    data:
      recentWarnings,
    error:
      recentError,
  } = await db!
    .from(
      "discord_moderation_cases",
    )
    .select(
      "id,metadata,created_at",
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
    .limit(20);

  if (recentError) {
    throw recentError;
  }

  const automodWarnings =
    (
      recentWarnings ||
      []
    ).filter(
      (item: any) =>
        item?.metadata
          ?.source ===
        "automod",
    );

  let timedOut =
    false;
  let timeoutCaseId:
    number |
    null =
      null;

  if (
    automodWarnings.length >=
    settings
      .automodEscalationCount
  ) {
    const {
      data:
        recentTimeouts,
      error:
        timeoutReadError,
    } = await db!
      .from(
        "discord_moderation_cases",
      )
      .select(
        "id,metadata,created_at",
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
      .limit(10);

    if (
      timeoutReadError
    ) {
      throw timeoutReadError;
    }

    const already =
      (
        recentTimeouts ||
        []
      ).some(
        (item: any) =>
          item?.metadata
            ?.source ===
          "automod",
      );

    if (!already) {
      const minutes =
        settings
          .automodTimeoutMinutes;
      const until =
        new Date(
          Date.now() +
            minutes *
              60000,
        ).toISOString();

      await discord(
        "/guilds/" +
        guildId +
        "/members/" +
        userId,
        "PATCH",
        {
          communication_disabled_until:
            until,
        },
      );

      const {
        data:
          timeoutCase,
        error:
          timeoutError,
      } = await db!
        .from(
          "discord_moderation_cases",
        )
        .insert({
          guild_id:
            guildId,
          target_user_id:
            userId,
          moderator_user_id:
            CLIENT_ID,
          action:
            "timeout",
          reason:
            "AutoMod escalation after " +
            String(
              automodWarnings.length,
            ) +
            " violations",
          duration_minutes:
            minutes,
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
        timeoutError
      ) {
        throw timeoutError;
      }

      timedOut = true;
      timeoutCaseId =
        timeoutCase.id;

      await db!
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
            minutes,
            warning_count:
              automodWarnings.length,
          },
        });
    }
  }

  return {
    status: 200,
    payload: {
      ok: true,
      caseId:
        warnCase.id,
      warningCount:
        automodWarnings.length,
      timedOut,
      timeoutCaseId,
    },
  };
}

async function handleDue() {
  const now =
    new Date()
      .toISOString();

  const [
    giveawaysResult,
    scheduledResult,
  ] =
    await Promise.all([
      db!
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
      db!
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
    of (
      giveawaysResult.data ||
      []
    )
  ) {
    const {
      data:
        participants,
      error:
        participantError,
    } = await db!
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

    if (
      participantError
    ) {
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
              (
                value:
                  unknown,
              ) =>
                String(value),
            )
            .filter(
              (value:
                string) =>
                isSnowflake(
                  value,
                ),
            )
        : [];

    if (!winners.length) {
      winners =
        pickRandomUserIds(
          participants ||
          [],
          Number(
            giveaway
              .winner_count ||
            1,
          ),
        );

      const {
        error:
          winnerError,
      } = await db!
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

      if (
        winnerError
      ) {
        throw winnerError;
      }
    }

    const {
      data:
        settingsRow,
    } = await db!
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
        (
          participants ||
          []
        ).length,
      locale:
        settingsRow
          ?.locale ===
          "en"
          ? "en"
          : "uk",
    });
  }

  return {
    status: 200,
    payload: {
      ok: true,
      giveaways,
      scheduled:
        scheduledResult.data ||
        [],
    },
  };
}

async function handleResult(
  body: any,
) {
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
    body.ok ===
    true;
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
      .slice(
        0,
        1000,
      );

  if (
    ![
      "giveaway",
      "scheduled",
    ].includes(
      kind,
    ) ||
    !/^[0-9a-f-]{36}$/i.test(
      id,
    )
  ) {
    return {
      status: 400,
      payload: {
        ok: false,
        error:
          "INVALID_RESULT",
      },
    };
  }

  const table =
    kind ===
    "giveaway"
      ? "discord_giveaways"
      : "discord_scheduled_messages";

  const {
    data:
      current,
    error:
      readError,
  } = await db!
    .from(table)
    .select("*")
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (
    readError ||
    !current
  ) {
    return {
      status: 200,
      payload: {
        ok: true,
        ignored: true,
      },
    };
  }

  const attempts =
    Number(
      current
        .delivery_attempts ||
      0,
    ) + 1;

  const now =
    new Date()
      .toISOString();

  const update =
    kind ===
    "scheduled"
      ? {
          status:
            ok
              ? "sent"
              : attempts >=
                  5
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
        }
      : {
          status:
            ok
              ? "ended"
              : attempts >=
                  5
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
            attempts >=
              5
              ? now
              : current
                  .ended_at,
          updated_at:
            now,
        };

  const {
    error:
      updateError,
  } = await db!
    .from(table)
    .update(update)
    .eq(
      "id",
      id,
    );

  if (updateError) {
    throw updateError;
  }

  await db!
    .from(
      "discord_bot_audit",
    )
    .insert({
      guild_id:
        current.guild_id,
      event_type:
        kind ===
        "scheduled"
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

  return {
    status: 200,
    payload: {
      ok: true,
    },
  };
}

Deno.serve(
  async (
    request: Request,
  ) => {
    if (
      request.method !==
      "POST"
    ) {
      return json(
        405,
        {
          ok: false,
          error:
            "METHOD_NOT_ALLOWED",
        },
      );
    }

    if (
      !BOT_TOKEN ||
      !db
    ) {
      return json(
        503,
        {
          ok: false,
          error:
            "RUNTIME_NOT_CONFIGURED",
        },
      );
    }

    const authorization =
      request.headers.get(
        "authorization",
      ) || "";

    const expected =
      "Bot " +
      BOT_TOKEN;

    if (
      !safeEqual(
        authorization,
        expected,
      )
    ) {
      return json(
        401,
        {
          ok: false,
          error:
            "BOT_AUTH_REQUIRED",
        },
      );
    }

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return json(
        400,
        {
          ok: false,
          error:
            "INVALID_JSON",
        },
      );
    }

    const action =
      String(
        body?.action ||
        "",
      );

    try {
      const result =
        action === "config"
          ? await handleConfig(
              body,
            )
          : action ===
              "automod-event"
            ? await handleAutomod(
                body,
              )
            : action ===
                "publications-due"
              ? await handleDue()
              : action ===
                  "publication-result"
                ? await handleResult(
                    body,
                  )
                : {
                    status: 400,
                    payload: {
                      ok: false,
                      error:
                        "UNKNOWN_ACTION",
                    },
                  };

      return json(
        result.status,
        result.payload,
      );
    } catch (error) {
      console.error(
        "discord worker runtime error",
        error,
      );

      return json(
        500,
        {
          ok: false,
          error:
            "WORKER_RUNTIME_FAILED",
        },
      );
    }
  },
);
