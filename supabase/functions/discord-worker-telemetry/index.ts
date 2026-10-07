import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const BOT_TOKEN =
  Deno.env.get(
    "DISCORD_BOT_TOKEN",
  ) || "";

const SUPABASE_URL =
  Deno.env.get(
    "SUPABASE_URL",
  ) || "";

const SERVICE_ROLE =
  Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  ) || "";

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
            "TELEMETRY_NOT_CONFIGURED",
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

    let body: any = null;

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
      if (
        action ===
        "health"
      ) {
        const {
          error,
        } = await db
          .from(
            "discord_bot_health_snapshots",
          )
          .insert({
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
          });

        if (error) {
          throw error;
        }

        return json(
          200,
          {
            ok: true,
          },
        );
      }

      if (
        action ===
        "member"
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
        const type =
          String(
            body.type ||
            "",
          );

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
          ].includes(
            type,
          )
        ) {
          return json(
            400,
            {
              ok: false,
              error:
                "INVALID_MEMBER_EVENT",
            },
          );
        }

        const {
          error,
        } = await db
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

        if (error) {
          throw error;
        }

        return json(
          200,
          {
            ok: true,
          },
        );
      }

      return json(
        400,
        {
          ok: false,
          error:
            "UNKNOWN_ACTION",
        },
      );
    } catch (error) {
      console.error(
        "discord telemetry error",
        error,
      );

      return json(
        500,
        {
          ok: false,
          error:
            "TELEMETRY_WRITE_FAILED",
        },
      );
    }
  },
);
