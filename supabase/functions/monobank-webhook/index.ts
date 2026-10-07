import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { Buffer } from "node:buffer";
import { createVerify } from "node:crypto";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ||
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";
const MONOBANK_TOKEN =
  Deno.env.get("MONOBANK_TOKEN") ||
  "";
const MONOBANK_API =
  (
    Deno.env.get("MONOBANK_API_URL") ||
    "https://api.monobank.ua"
  ).replace(/\/+$/, "");
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

let cachedPublicKeyPem =
  "";

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

async function fetchMonobankPublicKey(
  force = false,
) {
  if (
    cachedPublicKeyPem &&
    !force
  ) {
    return cachedPublicKeyPem;
  }

  if (!MONOBANK_TOKEN) {
    throw new Error(
      "MONOBANK_TOKEN missing",
    );
  }

  const response =
    await fetch(
      MONOBANK_API +
        "/api/merchant/pubkey",
      {
        headers: {
          "X-Token":
            MONOBANK_TOKEN,
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

  if (
    !response.ok ||
    !payload?.key
  ) {
    throw new Error(
      "MONOBANK_PUBLIC_KEY_FAILED",
    );
  }

  const bytes =
    Buffer.from(
      String(
        payload.key,
      ),
      "base64",
    );
  const pem =
    bytes.toString(
      "utf8",
    );

  if (
    !pem.includes(
      "BEGIN PUBLIC KEY",
    )
  ) {
    throw new Error(
      "MONOBANK_PUBLIC_KEY_INVALID",
    );
  }

  cachedPublicKeyPem =
    pem;

  return pem;
}

function verifyMonobankSignatureWithKey(
  rawBody: Uint8Array,
  signatureBase64: string,
  publicKeyPem: string,
) {
  try {
    const verifier =
      createVerify(
        "SHA256",
      );

    verifier.update(
      rawBody,
    );
    verifier.end();

    return verifier.verify(
      publicKeyPem,
      Buffer.from(
        signatureBase64,
        "base64",
      ),
    );
  } catch {
    return false;
  }
}

async function verifyMonobankSignature(
  rawBody: Uint8Array,
  signatureBase64: string,
) {
  if (!signatureBase64) {
    return false;
  }

  let key =
    await fetchMonobankPublicKey(
      false,
    );

  if (
    verifyMonobankSignatureWithKey(
      rawBody,
      signatureBase64,
      key,
    )
  ) {
    return true;
  }

  key =
    await fetchMonobankPublicKey(
      true,
    );

  return verifyMonobankSignatureWithKey(
    rawBody,
    signatureBase64,
    key,
  );
}

async function discordRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN missing",
    );
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
    response.status === 204
      ? null
      : await response
          .json()
          .catch(
            () => null,
          );

  if (!response.ok) {
    throw new Error(
      (
        payload?.message ||
        "Discord API error"
      ) +
        " (" +
        String(
          response.status,
        ) +
        ")",
    );
  }

  return payload;
}

function language(
  value: unknown,
) {
  const locale =
    String(
      value ||
      "",
    ).toLowerCase();

  if (
    locale.startsWith(
      "uk",
    )
  ) {
    return "uk";
  }

  if (
    locale.startsWith(
      "ru",
    )
  ) {
    return "ru";
  }

  return "en";
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

async function resolveOwnerDiscordUserId() {
  if (!adminDb) {
    return "";
  }

  const {
    data:
      ownerRole,
    error:
      ownerRoleError,
  } = await adminDb
    .from(
      "user_roles",
    )
    .select(
      "user_id",
    )
    .eq(
      "role",
      "owner",
    )
    .limit(1)
    .maybeSingle();

  if (
    ownerRoleError ||
    !ownerRole?.user_id
  ) {
    return "";
  }

  const {
    data:
      account,
    error:
      accountError,
  } = await adminDb
    .from(
      "discord_customer_accounts",
    )
    .select(
      "discord_user_id",
    )
    .eq(
      "user_id",
      ownerRole.user_id,
    )
    .maybeSingle();

  if (
    accountError ||
    !/^[0-9]{17,20}$/.test(
      String(
        account
          ?.discord_user_id ||
        "",
      ),
    )
  ) {
    return "";
  }

  return String(
    account
      .discord_user_id,
  );
}

async function activateSubscription(
  requestId: string,
) {
  const ownerDiscordUserId =
    await resolveOwnerDiscordUserId();

  if (!ownerDiscordUserId) {
    throw new Error(
      "ISTE_OWNER_DISCORD_ACCOUNT_MISSING",
    );
  }

  if (!DISCORD_BOT_TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN missing",
    );
  }

  const response =
    await fetch(
      BOT_PORTAL_URL +
        "?module=bot-portal&action=worker-subscription-decision",
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
            actorDiscordUserId:
              ownerDiscordUserId,
            requestId,
            decision:
              "approve",
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
    response.ok &&
    payload?.ok ===
      true
  ) {
    return payload;
  }

  if (
    response.status ===
      409 &&
    adminDb
  ) {
    const {
      data:
        current,
    } = await adminDb
      .from(
        "discord_subscription_requests",
      )
      .select(
        "status",
      )
      .eq(
        "id",
        requestId,
      )
      .maybeSingle();

    if (
      current?.status ===
      "approved"
    ) {
      return {
        ok: true,
        requestId,
        alreadyHandled:
          true,
      };
    }
  }

  throw new Error(
    payload?.error ||
      "SUBSCRIPTION_ACTIVATION_FAILED",
  );
}

function successCopy(
  lang: "uk" | "ru" | "en",
) {
  if (lang === "uk") {
    return {
      title:
        "🛒 ISTe Bot • Підписка",
      description:
        "Оплату підтверджено автоматично. Підписку активовано.",
      buyer:
        "Покупець",
      plan:
        "Тариф",
      status:
        "Статус",
      statusValue:
        "🟢 ОПЛАЧЕНО / АКТИВОВАНО",
      order:
        "ID замовлення",
      expires:
        "Активна до",
      dm:
        "✅ Оплату підтверджено автоматично. Підписку активовано.",
    };
  }

  if (lang === "ru") {
    return {
      title:
        "🛒 ISTe Bot • Подписка",
      description:
        "Оплата подтверждена автоматически. Подписка активирована.",
      buyer:
        "Покупатель",
      plan:
        "Тариф",
      status:
        "Статус",
      statusValue:
        "🟢 ОПЛАЧЕНО / АКТИВИРОВАНО",
      order:
        "ID заказа",
      expires:
        "Активна до",
      dm:
        "✅ Оплата подтверждена автоматически. Подписка активирована.",
    };
  }

  return {
    title:
      "🛒 ISTe Bot • Subscription",
    description:
      "Payment was confirmed automatically. The subscription is active.",
    buyer:
      "Buyer",
    plan:
      "Plan",
    status:
      "Status",
    statusValue:
      "🟢 PAID / ACTIVE",
    order:
      "Order ID",
    expires:
      "Active until",
    dm:
      "✅ Payment was confirmed automatically. Your subscription is active.",
  };
}

async function updateDiscordOrderSuccess(
  requestRow: any,
  activation: any,
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
    String(
      metadata
        ?.shop_channel_id ||
      "",
    );
  const messageId =
    String(
      metadata
        ?.shop_message_id ||
      "",
    );
  const discordUserId =
    String(
      requestRow
        ?.discord_user_id ||
      "",
    );

  if (
    !/^[0-9]{17,20}$/.test(
      channelId,
    ) ||
    !/^[0-9]{17,20}$/.test(
      messageId,
    )
  ) {
    return;
  }

  const lang =
    language(
      metadata?.locale,
    );
  const t =
    successCopy(
      lang,
    );
  const expiresAt =
    activation
      ?.expiresAt ||
    null;

  const fields: any[] = [
    {
      name:
        t.buyer,
      value:
        "<@" +
        discordUserId +
        ">",
      inline:
        true,
    },
    {
      name:
        t.plan,
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
        t.status,
      value:
        t.statusValue,
      inline:
        true,
    },
    {
      name:
        t.order,
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
  ];

  if (expiresAt) {
    fields.push({
      name:
        t.expires,
      value:
        discordTimestamp(
          expiresAt,
        ),
      inline:
        false,
    });
  }

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
            title:
              t.title,
            description:
              t.description,
            color:
              0x2ecc71,
            fields,
            footer: {
              text:
                "ISTe Shop • ISTe Bot",
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

  if (
    !/^[0-9]{17,20}$/.test(
      discordUserId,
    )
  ) {
    return;
  }

  try {
    const dm =
      await discordRequest(
        "/users/@me/channels",
        {
          method:
            "POST",
          body: {
            recipient_id:
              discordUserId,
          },
        },
      );
    const dmChannelId =
      String(
        dm?.id ||
        "",
      );

    if (
      /^[0-9]{17,20}$/.test(
        dmChannelId,
      )
    ) {
      await discordRequest(
        "/channels/" +
          dmChannelId +
          "/messages",
        {
          method:
            "POST",
          body: {
            embeds: [
              {
                title:
                  t.title,
                description:
                  t.dm +
                  (
                    expiresAt
                      ? " " +
                        discordTimestamp(
                          expiresAt,
                        )
                      : ""
                  ),
                color:
                  0x2ecc71,
                footer: {
                  text:
                    "ISTe Shop • ISTe Bot",
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
        },
      );
    }
  } catch (
    error
  ) {
    console.error(
      "subscription success DM failed",
      error,
    );
  }
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
      !MONOBANK_TOKEN
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

    const signature =
      request.headers.get(
        "x-sign",
      ) ||
      "";
    const rawBody =
      new Uint8Array(
        await request
          .arrayBuffer(),
      );

    let verified =
      false;

    try {
      verified =
        await verifyMonobankSignature(
          rawBody,
          signature,
        );
    } catch (
      error
    ) {
      console.error(
        "monobank signature verification failed",
        error,
      );
    }

    if (!verified) {
      return json(
        {
          ok: false,
          error:
            "INVALID_SIGNATURE",
        },
        401,
      );
    }

    let payload: any;

    try {
      payload =
        JSON.parse(
          new TextDecoder()
            .decode(
              rawBody,
            ),
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

    const invoiceId =
      String(
        payload?.invoiceId ||
        "",
      );
    const status =
      String(
        payload?.status ||
        "",
      )
        .trim()
        .toLowerCase();
    const acceptedStatuses =
      new Set([
        "created",
        "processing",
        "hold",
        "success",
        "failure",
        "reversed",
        "expired",
      ]);

    if (
      !invoiceId ||
      !acceptedStatuses.has(
        status,
      )
    ) {
      return json(
        {
          ok: true,
          ignored:
            true,
        },
      );
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
        "invoice_id",
        invoiceId,
      )
      .maybeSingle();

    if (
      paymentError ||
      !payment
    ) {
      return json(
        {
          ok: true,
          ignored:
            true,
        },
      );
    }

    if (
      Number(
        payload?.amount,
      ) !==
        Number(
          payment
            .amount_minor,
        ) ||
      Number(
        payload?.ccy,
      ) !==
        Number(
          payment
            .currency,
        )
    ) {
      console.error(
        "monobank payment amount mismatch",
        {
          invoiceId,
          expectedAmount:
            payment
              .amount_minor,
          receivedAmount:
            payload?.amount,
          expectedCurrency:
            payment
              .currency,
          receivedCurrency:
            payload?.ccy,
        },
      );

      return json(
        {
          ok: false,
          error:
            "PAYMENT_MISMATCH",
        },
        409,
      );
    }

    const incomingModified =
      Date.parse(
        String(
          payload
            ?.modifiedDate ||
          "",
        ),
      );
    const storedModified =
      Date.parse(
        String(
          payment
            ?.provider_modified_at ||
          "",
        ),
      );

    if (
      Number.isFinite(
        incomingModified,
      ) &&
      Number.isFinite(
        storedModified,
      ) &&
      incomingModified <=
        storedModified
    ) {
      return json({
        ok: true,
        stale:
          true,
      });
    }

    const providerModifiedAt =
      Number.isFinite(
        incomingModified,
      )
        ? new Date(
            incomingModified,
          ).toISOString()
        : new Date()
            .toISOString();
    const now =
      new Date()
        .toISOString();

    const {
      error:
        paymentUpdateError,
    } = await adminDb
      .from(
        "discord_subscription_payments",
      )
      .update({
        status,
        provider_modified_at:
          providerModifiedAt,
        provider_payload:
          payload,
        updated_at:
          now,
      })
      .eq(
        "id",
        payment.id,
      );

    if (
      paymentUpdateError
    ) {
      console.error(
        "payment update failed",
        paymentUpdateError,
      );

      return json(
        {
          ok: false,
          error:
            "PAYMENT_UPDATE_FAILED",
        },
        500,
      );
    }

    const {
      data:
        requestRow,
      error:
        requestError,
    } = await adminDb
      .from(
        "discord_subscription_requests",
      )
      .select(
        "id,user_id,discord_user_id,plan,status,metadata",
      )
      .eq(
        "id",
        payment
          .request_id,
      )
      .maybeSingle();

    if (
      requestError ||
      !requestRow
    ) {
      return json(
        {
          ok: false,
          error:
            "SUBSCRIPTION_REQUEST_NOT_FOUND",
        },
        500,
      );
    }

    const metadata =
      requestRow
        ?.metadata &&
      typeof requestRow
        .metadata ===
        "object"
        ? requestRow
            .metadata
        : {};

    await adminDb
      .from(
        "discord_subscription_requests",
      )
      .update({
        metadata: {
          ...metadata,
          payment_provider:
            "monobank",
          payment_invoice_id:
            invoiceId,
          payment_status:
            status,
          payment_amount_minor:
            Number(
              payment
                .amount_minor,
            ),
          payment_ccy:
            Number(
              payment
                .currency,
            ),
          payment_modified_at:
            providerModifiedAt,
        },
        updated_at:
          now,
      })
      .eq(
        "id",
        requestRow.id,
      );

    if (
      status !==
        "success" ||
      requestRow.status !==
        "pending"
    ) {
      return json({
        ok: true,
        status,
      });
    }

    try {
      const activation =
        await activateSubscription(
          requestRow.id,
        );

      await updateDiscordOrderSuccess(
        {
          ...requestRow,
          metadata: {
            ...metadata,
            payment_provider:
              "monobank",
            payment_invoice_id:
              invoiceId,
            payment_status:
              status,
          },
        },
        activation,
      );

      return json({
        ok: true,
        status,
        activated:
          true,
      });
    } catch (
      error
    ) {
      console.error(
        "automatic subscription activation failed",
        error,
      );

      return json(
        {
          ok: false,
          error:
            "SUBSCRIPTION_ACTIVATION_FAILED",
        },
        500,
      );
    }
  },
);
