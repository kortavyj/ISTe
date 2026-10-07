import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ||
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";
const PADDLE_WEBHOOK_SECRET =
  Deno.env.get("PADDLE_WEBHOOK_SECRET") ||
  "";
const PADDLE_API_KEY =
  Deno.env.get("PADDLE_API_KEY") ||
  "";
const PADDLE_ENVIRONMENT =
  (
    Deno.env.get("PADDLE_ENVIRONMENT") ||
    "live"
  )
    .trim()
    .toLowerCase();
const PADDLE_API =
  (
    Deno.env.get("PADDLE_API_URL") ||
    (
      PADDLE_ENVIRONMENT === "sandbox"
        ? "https://sandbox-api.paddle.com"
        : "https://api.paddle.com"
    )
  ).replace(/\/+$/, "");
const PADDLE_SIGNATURE_TOLERANCE_SECONDS =
  Math.max(
    5,
    Number.parseInt(
      Deno.env.get(
        "PADDLE_SIGNATURE_TOLERANCE_SECONDS",
      ) || "30",
      10,
    ) || 30,
  );
const DISCORD_BOT_TOKEN =
  Deno.env.get("DISCORD_BOT_TOKEN") ||
  "";
const DISCORD_API =
  "https://discord.com/api/v10";
const BOT_PORTAL_URL =
  (
    Deno.env.get("BOT_PORTAL_URL") ||
    "https://www.istesport.com/api/owner"
  ).replace(/\/+$/, "");

const adminDb =
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      )
    : null;

function json(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store",
        "x-content-type-options":
          "nosniff",
      },
    },
  );
}

function safeEqualHex(
  left: string,
  right: string,
) {
  if (
    !/^[0-9a-f]+$/i.test(left) ||
    !/^[0-9a-f]+$/i.test(right)
  ) {
    return false;
  }

  const a =
    Buffer.from(
      left,
      "hex",
    );
  const b =
    Buffer.from(
      right,
      "hex",
    );

  return (
    a.length ===
      b.length &&
    a.length > 0 &&
    timingSafeEqual(
      a,
      b,
    )
  );
}

function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
) {
  if (
    !PADDLE_WEBHOOK_SECRET ||
    !signatureHeader
  ) {
    return false;
  }

  let timestamp =
    0;
  const signatures:
    string[] = [];

  for (
    const part
    of signatureHeader.split(
      ";",
    )
  ) {
    const [
      key,
      ...rest
    ] =
      part.split(
        "=",
      );
    const value =
      rest.join(
        "=",
      ).trim();

    if (
      key?.trim() ===
        "ts"
    ) {
      timestamp =
        Number.parseInt(
          value,
          10,
        );
    } else if (
      key?.trim() ===
        "h1" &&
      value
    ) {
      signatures.push(
        value,
      );
    }
  }

  if (
    !Number.isFinite(
      timestamp,
    ) ||
    timestamp <= 0 ||
    !signatures.length
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() /
        1000,
    );

  if (
    Math.abs(
      now -
      timestamp,
    ) >
      PADDLE_SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const signedPayload =
    String(
      timestamp,
    ) +
    ":" +
    rawBody;
  const expected =
    createHmac(
      "sha256",
      PADDLE_WEBHOOK_SECRET,
    )
      .update(
        signedPayload,
        "utf8",
      )
      .digest(
        "hex",
      );

  return signatures.some(
    (signature) =>
      safeEqualHex(
        signature,
        expected,
      ),
  );
}

function normalizePlan(
  value: unknown,
) {
  const plan =
    String(
      value ||
      "",
    )
      .trim()
      .toLowerCase();

  return [
    "starter",
    "pro",
    "max",
  ].includes(
    plan,
  )
    ? plan
    : "";
}

function asUuid(
  value: unknown,
) {
  const text =
    String(
      value ||
      "",
    ).trim();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    text,
  )
    ? text
    : "";
}

function asSnowflake(
  value: unknown,
) {
  const text =
    String(
      value ||
      "",
    ).trim();

  return /^[0-9]{17,20}$/.test(
    text,
  )
    ? text
    : "";
}

function asPaddleId(
  value: unknown,
  prefix: string,
) {
  const text =
    String(
      value ||
      "",
    ).trim();

  return new RegExp(
    "^" +
      prefix +
      "_[a-z\\d]{26}$",
    "i",
  ).test(
    text,
  )
    ? text
    : "";
}

async function beginEvent(
  eventId: string,
  eventType: string,
  occurredAt: string | null,
  payload: unknown,
) {
  if (!adminDb) {
    throw new Error(
      "SUPABASE_ADMIN_MISSING",
    );
  }

  const {
    data:
      existing,
    error:
      readError,
  } = await adminDb
    .from(
      "discord_subscription_provider_events",
    )
    .select(
      "event_id,status,attempts",
    )
    .eq(
      "event_id",
      eventId,
    )
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (
    existing?.status ===
      "processed"
  ) {
    return {
      duplicate: true,
    };
  }

  const now =
    new Date()
      .toISOString();

  if (existing) {
    const {
      error,
    } = await adminDb
      .from(
        "discord_subscription_provider_events",
      )
      .update({
        provider:
          "paddle",
        event_type:
          eventType,
        occurred_at:
          occurredAt,
        status:
          "processing",
        attempts:
          Number(
            existing.attempts ||
            1,
          ) + 1,
        payload:
          payload as any,
        error:
          "",
        updated_at:
          now,
      })
      .eq(
        "event_id",
        eventId,
      );

    if (error) {
      throw error;
    }

    return {
      duplicate: false,
    };
  }

  const {
    error:
      insertError,
  } = await adminDb
    .from(
      "discord_subscription_provider_events",
    )
    .insert({
      event_id:
        eventId,
      provider:
        "paddle",
      event_type:
        eventType,
      occurred_at:
        occurredAt,
      status:
        "processing",
      attempts:
        1,
      payload:
        payload as any,
      error:
        "",
      updated_at:
        now,
    });

  if (
    insertError &&
    insertError.code !==
      "23505"
  ) {
    throw insertError;
  }

  if (
    insertError?.code ===
      "23505"
  ) {
    return {
      duplicate: true,
    };
  }

  return {
    duplicate: false,
  };
}

async function finishEvent(
  eventId: string,
  ok: boolean,
  error = "",
) {
  if (!adminDb) {
    return;
  }

  const now =
    new Date()
      .toISOString();

  await adminDb
    .from(
      "discord_subscription_provider_events",
    )
    .update({
      status:
        ok
          ? "processed"
          : "failed",
      error:
        ok
          ? ""
          : error.slice(
              0,
              2000,
            ),
      processed_at:
        ok
          ? now
          : null,
      updated_at:
        now,
    })
    .eq(
      "event_id",
      eventId,
    );
}

async function paddleRequest(
  path: string,
) {
  if (!PADDLE_API_KEY) {
    return null;
  }

  const response =
    await fetch(
      PADDLE_API +
        path,
      {
        headers: {
          Authorization:
            "Bearer " +
            PADDLE_API_KEY,
          "Paddle-Version":
            "1",
          Accept:
            "application/json",
        },
      },
    );
  const payload =
    await response
      .json()
      .catch(
        () => null,
      );

  if (!response.ok) {
    console.error(
      "Paddle API request failed",
      {
        path,
        status:
          response.status,
        error:
          payload?.error ||
          null,
      },
    );

    return null;
  }

  return payload?.data ||
    null;
}

async function getRequestRow(
  requestId: string,
) {
  if (
    !adminDb ||
    !requestId
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await adminDb
    .from(
      "discord_subscription_requests",
    )
    .select(
      "id,user_id,discord_user_id,plan,status,metadata",
    )
    .eq(
      "id",
      requestId,
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function resolveContext(
  data: any,
) {
  const custom =
    data
      ?.custom_data &&
    typeof data
      .custom_data ===
      "object"
      ? data.custom_data
      : {};
  let requestId =
    asUuid(
      custom
        ?.request_id,
    );
  let userId =
    asUuid(
      custom
        ?.user_id,
    );
  let discordUserId =
    asSnowflake(
      custom
        ?.discord_user_id,
    );
  let plan =
    normalizePlan(
      custom?.plan,
    );
  const subscriptionId =
    asPaddleId(
      data?.id,
      "sub",
    ) ||
    asPaddleId(
      data
        ?.subscription_id,
      "sub",
    );

  let requestRow =
    requestId
      ? await getRequestRow(
          requestId,
        )
      : null;

  if (
    !requestRow &&
    adminDb &&
    asPaddleId(
      data?.id,
      "txn",
    )
  ) {
    const {
      data:
        payment,
      error,
    } = await adminDb
      .from(
        "discord_subscription_payments",
      )
      .select(
        "request_id",
      )
      .eq(
        "provider",
        "paddle",
      )
      .eq(
        "invoice_id",
        String(
          data.id,
        ),
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (
      payment
        ?.request_id
    ) {
      requestId =
        String(
          payment.request_id,
        );
      requestRow =
        await getRequestRow(
          requestId,
        );
    }
  }

  if (requestRow) {
    userId =
      userId ||
      asUuid(
        requestRow
          .user_id,
      );
    discordUserId =
      discordUserId ||
      asSnowflake(
        requestRow
          .discord_user_id,
      );
    plan =
      plan ||
      normalizePlan(
        requestRow.plan,
      );
  }

  if (
    (
      !userId ||
      !plan
    ) &&
    adminDb &&
    subscriptionId
  ) {
    const {
      data:
        existing,
      error,
    } = await adminDb
      .from(
        "discord_subscriptions",
      )
      .select(
        "user_id,plan",
      )
      .eq(
        "provider",
        "paddle",
      )
      .eq(
        "provider_subscription_id",
        subscriptionId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (existing) {
      userId =
        userId ||
        asUuid(
          existing.user_id,
        );
      plan =
        plan ||
        normalizePlan(
          existing.plan,
        );
    }
  }

  return {
    requestId,
    requestRow,
    userId,
    discordUserId,
    plan,
    subscriptionId,
    custom,
  };
}

async function callProviderSync(
  eventId: string,
  eventData: any,
  context: any,
  transactionId = "",
) {
  if (
    !DISCORD_BOT_TOKEN ||
    !context?.userId ||
    !context?.plan
  ) {
    throw new Error(
      "PADDLE_SYNC_CONTEXT_MISSING",
    );
  }

  const providerStatus =
    String(
      eventData?.status ||
      "",
    )
      .trim()
      .toLowerCase();

  if (
    ![
      "active",
      "trialing",
      "past_due",
      "paused",
      "canceled",
    ].includes(
      providerStatus,
    )
  ) {
    return null;
  }

  const period =
    eventData
      ?.current_billing_period ||
    null;
  const response =
    await fetch(
      BOT_PORTAL_URL +
        "?module=bot-portal&action=worker-subscription-provider-sync",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bot " +
            DISCORD_BOT_TOKEN,
          Accept:
            "application/json",
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            userId:
              context.userId,
            requestId:
              context.requestId ||
              "",
            plan:
              context.plan,
            provider:
              "paddle",
            providerStatus,
            providerCustomerId:
              String(
                eventData
                  ?.customer_id ||
                "",
              ),
            providerSubscriptionId:
              String(
                eventData
                  ?.id ||
                context
                  ?.subscriptionId ||
                "",
              ),
            providerTransactionId:
              transactionId,
            providerEventId:
              eventId,
            currentPeriodStart:
              period
                ?.starts_at ||
              "",
            currentPeriodEnd:
              period
                ?.ends_at ||
              "",
          }),
      },
    );
  const payload =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    payload?.ok !==
      true
  ) {
    throw new Error(
      payload?.error ||
      "PADDLE_PROVIDER_SYNC_FAILED",
    );
  }

  return payload;
}

async function updatePaymentSuccess(
  data: any,
  occurredAt: string | null,
) {
  if (!adminDb) {
    return null;
  }

  const transactionId =
    asPaddleId(
      data?.id,
      "txn",
    );

  if (!transactionId) {
    return null;
  }

  const {
    data:
      payment,
    error:
      paymentError,
  } = await adminDb
    .from(
      "discord_subscription_payments",
    )
    .select("*")
    .eq(
      "provider",
      "paddle",
    )
    .eq(
      "invoice_id",
      transactionId,
    )
    .maybeSingle();

  if (paymentError) {
    throw paymentError;
  }

  if (!payment) {
    return null;
  }

  const modifiedAt =
    data
      ?.updated_at ||
    occurredAt ||
    new Date()
      .toISOString();

  const {
    error:
      updateError,
  } = await adminDb
    .from(
      "discord_subscription_payments",
    )
    .update({
      status:
        "success",
      provider_modified_at:
        modifiedAt,
      provider_payload:
        data,
      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      payment.id,
    );

  if (updateError) {
    throw updateError;
  }

  return payment;
}

async function updatePaymentFailure(
  data: any,
  occurredAt: string | null,
) {
  if (!adminDb) {
    return;
  }

  const transactionId =
    asPaddleId(
      data?.id,
      "txn",
    );

  if (!transactionId) {
    return;
  }

  await adminDb
    .from(
      "discord_subscription_payments",
    )
    .update({
      status:
        "failure",
      provider_modified_at:
        data
          ?.updated_at ||
        occurredAt ||
        new Date()
          .toISOString(),
      provider_payload:
        data,
      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "provider",
      "paddle",
    )
    .eq(
      "invoice_id",
      transactionId,
    );
}

async function updateRequestPaymentMetadata(
  context: any,
  data: any,
  eventId: string,
  paymentStatus: string,
) {
  if (
    !adminDb ||
    !context
      ?.requestId
  ) {
    return;
  }

  const requestRow =
    context
      ?.requestRow ||
    await getRequestRow(
      context.requestId,
    );

  if (!requestRow) {
    return;
  }

  const metadata =
    requestRow
      ?.metadata &&
    typeof requestRow
      .metadata ===
      "object"
      ? requestRow.metadata
      : {};

  await adminDb
    .from(
      "discord_subscription_requests",
    )
    .update({
      metadata: {
        ...metadata,
        payment_provider:
          "paddle",
        payment_status:
          paymentStatus,
        provider_transaction_id:
          asPaddleId(
            data?.id,
            "txn",
          ) ||
          metadata
            ?.provider_transaction_id ||
          null,
        provider_customer_id:
          String(
            data
              ?.customer_id ||
            metadata
              ?.provider_customer_id ||
            "",
          ) ||
          null,
        provider_subscription_id:
          String(
            data
              ?.subscription_id ||
            (
              asPaddleId(
                data?.id,
                "sub",
              )
                ? data.id
                : ""
            ) ||
            metadata
              ?.provider_subscription_id ||
            "",
          ) ||
          null,
        provider_event_id:
          eventId,
      },
      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      context.requestId,
    );
}

function discordTimestamp(
  value: unknown,
) {
  const millis =
    Date.parse(
      String(
        value ||
        "",
      ),
    );

  return Number.isFinite(
    millis,
  )
    ? "<t:" +
        Math.floor(
          millis /
            1000,
        ) +
        ":F>"
    : "";
}

async function discordRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    return null;
  }

  const response =
    await fetch(
      DISCORD_API +
        path,
      {
        method:
          options.method ||
          "GET",
        headers: {
          Authorization:
            "Bot " +
            DISCORD_BOT_TOKEN,
          Accept:
            "application/json",
          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },
        ...(options.body
          ? {
              body:
                JSON.stringify(
                  options.body,
                ),
            }
          : {}),
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
    console.error(
      "Discord API update failed",
      {
        path,
        status:
          response.status,
        payload,
      },
    );
    return null;
  }

  return payload;
}

async function updateOrderSuccess(
  requestRow: any,
  syncResult: any,
) {
  const metadata =
    requestRow
      ?.metadata &&
    typeof requestRow
      .metadata ===
      "object"
      ? requestRow.metadata
      : {};
  const channelId =
    asSnowflake(
      metadata
        ?.shop_channel_id,
    );
  const messageId =
    asSnowflake(
      metadata
        ?.shop_message_id,
    );
  const discordUserId =
    asSnowflake(
      requestRow
        ?.discord_user_id,
    );

  if (
    !channelId ||
    !messageId
  ) {
    return;
  }

  const locale =
    String(
      metadata
        ?.locale ||
      "",
    )
      .trim()
      .toLowerCase();
  const lang =
    locale.startsWith(
      "uk",
    )
      ? "uk"
      : locale.startsWith(
          "ru",
        )
        ? "ru"
        : "en";
  const title =
    lang === "uk"
      ? "🛒 ISTe Bot • Підписка"
      : lang === "ru"
        ? "🛒 ISTe Bot • Подписка"
        : "🛒 ISTe Bot • Subscription";
  const description =
    lang === "uk"
      ? "Paddle підтвердив оплату. Підписку активовано та ввімкнено автоматичне продовження."
      : lang === "ru"
        ? "Paddle подтвердил оплату. Подписка активирована и включено автоматическое продление."
        : "Paddle confirmed the payment. The subscription is active with automatic renewal.";
  const statusName =
    lang === "uk"
      ? "Статус"
      : lang === "ru"
        ? "Статус"
        : "Status";
  const expiresName =
    lang === "uk"
      ? "Наступне списання / активна до"
      : lang === "ru"
        ? "Следующее списание / активна до"
        : "Next billing / active until";

  await discordRequest(
    "/channels/" +
      channelId +
      "/messages/" +
      messageId,
    {
      method:
        "PATCH",
      body: {
        content:
          discordUserId
            ? "<@" +
              discordUserId +
              ">"
            : "",
        embeds: [
          {
            title,
            description,
            color:
              0x2ecc71,
            fields: [
              {
                name:
                  lang === "uk"
                    ? "Тариф"
                    : lang === "ru"
                      ? "Тариф"
                      : "Plan",
                value:
                  String(
                    requestRow
                      ?.plan ||
                    "",
                  )
                    .toUpperCase(),
                inline:
                  true,
              },
              {
                name:
                  statusName,
                value:
                  "🟢 PADDLE ACTIVE",
                inline:
                  true,
              },
              {
                name:
                  lang === "uk"
                    ? "ID замовлення"
                    : lang === "ru"
                      ? "ID заказа"
                      : "Order ID",
                value:
                  "`" +
                  String(
                    requestRow
                      ?.id ||
                    "",
                  ) +
                  "`",
                inline:
                  false,
              },
              ...(syncResult
                ?.expiresAt
                ? [
                    {
                      name:
                        expiresName,
                      value:
                        discordTimestamp(
                          syncResult.expiresAt,
                        ),
                      inline:
                        false,
                    },
                  ]
                : []),
            ],
            footer: {
              text:
                "ISTe Shop • Paddle • ISTe Bot",
            },
            timestamp:
              new Date()
                .toISOString(),
          },
        ],
        components: [],
        allowed_mentions: {
          users:
            discordUserId
              ? [
                  discordUserId,
                ]
              : [],
          parse: [],
        },
      },
    },
  );
}

Deno.serve(
  async (
    request,
  ) => {
    if (
      request.method !==
      "POST"
    ) {
      return json(
        {
          ok: false,
          error:
            "METHOD_NOT_ALLOWED",
        },
        405,
      );
    }

    if (
      !adminDb ||
      !PADDLE_WEBHOOK_SECRET
    ) {
      return json(
        {
          ok: false,
          error:
            "PAYMENT_SERVICE_NOT_CONFIGURED",
        },
        503,
      );
    }

    const rawBody =
      await request.text();
    const signature =
      request.headers.get(
        "paddle-signature",
      ) ||
      "";

    if (
      !verifyPaddleSignature(
        rawBody,
        signature,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "INVALID_SIGNATURE",
        },
        401,
      );
    }

    let event: any;

    try {
      event =
        JSON.parse(
          rawBody,
        );
    } catch {
      return json(
        {
          ok: false,
          error:
            "INVALID_JSON",
        },
        400,
      );
    }

    const eventId =
      asPaddleId(
        event?.event_id,
        "evt",
      );
    const eventType =
      String(
        event?.event_type ||
        "",
      )
        .trim()
        .toLowerCase();
    const occurredAt =
      event?.occurred_at
        ? String(
            event.occurred_at,
          )
        : null;
    const data =
      event?.data ||
      {};

    if (!eventId) {
      return json(
        {
          ok: false,
          error:
            "INVALID_EVENT_ID",
        },
        400,
      );
    }

    const accepted =
      new Set([
        "subscription.created",
        "subscription.updated",
        "subscription.activated",
        "subscription.resumed",
        "subscription.past_due",
        "subscription.paused",
        "subscription.canceled",
        "transaction.completed",
        "transaction.payment_failed",
        "transaction.past_due",
      ]);

    if (
      !accepted.has(
        eventType,
      )
    ) {
      return json({
        ok: true,
        ignored:
          true,
      });
    }

    try {
      const start =
        await beginEvent(
          eventId,
          eventType,
          occurredAt,
          event,
        );

      if (
        start.duplicate
      ) {
        return json({
          ok: true,
          duplicate:
            true,
        });
      }

      const context =
        await resolveContext(
          data,
        );
      let syncResult =
        null;

      if (
        eventType ===
          "transaction.completed"
      ) {
        await updatePaymentSuccess(
          data,
          occurredAt,
        );
        await updateRequestPaymentMetadata(
          context,
          data,
          eventId,
          "success",
        );

        const subscriptionId =
          asPaddleId(
            data
              ?.subscription_id,
            "sub",
          );

        if (subscriptionId) {
          const subscription =
            await paddleRequest(
              "/subscriptions/" +
                subscriptionId,
            );

          if (subscription) {
            const subscriptionContext =
              await resolveContext(
                subscription,
              );

            syncResult =
              await callProviderSync(
                eventId,
                subscription,
                {
                  ...context,
                  ...subscriptionContext,
                  requestId:
                    context
                      .requestId ||
                    subscriptionContext
                      .requestId,
                  requestRow:
                    context
                      .requestRow ||
                    subscriptionContext
                      .requestRow,
                  userId:
                    context
                      .userId ||
                    subscriptionContext
                      .userId,
                  discordUserId:
                    context
                      .discordUserId ||
                    subscriptionContext
                      .discordUserId,
                  plan:
                    context
                      .plan ||
                    subscriptionContext
                      .plan,
                },
                String(
                  data?.id ||
                  "",
                ),
              );
          }
        }
      } else if (
        eventType ===
          "transaction.payment_failed" ||
        eventType ===
          "transaction.past_due"
      ) {
        await updatePaymentFailure(
          data,
          occurredAt,
        );
        await updateRequestPaymentMetadata(
          context,
          data,
          eventId,
          "failure",
        );

        const subscriptionId =
          asPaddleId(
            data
              ?.subscription_id,
            "sub",
          );

        if (subscriptionId) {
          const subscription =
            await paddleRequest(
              "/subscriptions/" +
                subscriptionId,
            );

          if (subscription) {
            const subscriptionContext =
              await resolveContext(
                subscription,
              );

            syncResult =
              await callProviderSync(
                eventId,
                subscription,
                {
                  ...context,
                  ...subscriptionContext,
                  userId:
                    context
                      .userId ||
                    subscriptionContext
                      .userId,
                  plan:
                    context
                      .plan ||
                    subscriptionContext
                      .plan,
                },
                String(
                  data?.id ||
                  "",
                ),
              );
          }
        }
      } else {
        syncResult =
          await callProviderSync(
            eventId,
            data,
            context,
          );
      }

      const requestRow =
        context
          ?.requestRow ||
        (
          context
            ?.requestId
            ? await getRequestRow(
                context.requestId,
              )
            : null
        );

      if (
        requestRow &&
        syncResult
          ?.status ===
          "active"
      ) {
        await updateOrderSuccess(
          requestRow,
          syncResult,
        );
      }

      await finishEvent(
        eventId,
        true,
      );

      return json({
        ok: true,
        eventId,
        eventType,
        synced:
          Boolean(
            syncResult,
          ),
      });
    } catch (
      error
    ) {
      const message =
        error instanceof
          Error
          ? error.message
          : String(
              error,
            );

      console.error(
        "Paddle webhook processing failed",
        {
          eventId,
          eventType,
          message,
        },
      );

      await finishEvent(
        eventId,
        false,
        message,
      );

      return json(
        {
          ok: false,
          error:
            "PADDLE_WEBHOOK_PROCESSING_FAILED",
        },
        500,
      );
    }
  },
);
