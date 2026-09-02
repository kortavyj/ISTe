import { createHmac } from "node:crypto";

import { getSupabaseAdminClient } from "./supabaseAdmin.js";

function getHeader(request, name) {
  const value = request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getClientAddress(request) {
  const forwarded = getHeader(request, "x-forwarded-for");

  if (forwarded.trim()) {
    return forwarded.split(",")[0].trim().slice(0, 96);
  }

  const realIp = getHeader(request, "x-real-ip");

  return realIp.trim()
    ? realIp.trim().slice(0, 96)
    : "unknown";
}

function getSecret() {
  const secret =
    process.env.AUTH_RATE_LIMIT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw Object.assign(
      new Error(
        "AUTH_RATE_LIMIT_SECRET is missing or too short.",
      ),
      {
        code: "AUTH_SECURITY_NOT_CONFIGURED",
      },
    );
  }

  return secret;
}

function digest(value) {
  return createHmac("sha256", getSecret())
    .update(String(value))
    .digest("hex");
}

export function getAuthSecurityContext(
  request,
  identity = "",
) {
  const normalizedIdentity =
    String(identity || "").trim().toLowerCase();

  return {
    clientHash: digest(
      `client:${getClientAddress(request)}`,
    ),
    identityHash: normalizedIdentity
      ? digest(`identity:${normalizedIdentity}`)
      : "",
  };
}

async function consumeBucket(
  bucket,
  limit,
  windowSeconds,
  blockSeconds,
) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "auth_consume_rate_limit",
    {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_block_seconds: blockSeconds,
    },
  );

  if (error) {
    console.error(
      "Auth rate limit RPC error:",
      error,
    );

    throw Object.assign(
      new Error(
        "Authentication rate limit check failed.",
      ),
      {
        code: "AUTH_RATE_LIMIT_CHECK_FAILED",
      },
    );
  }

  return {
    allowed: data?.allowed === true,
    retryAfterSeconds: Math.max(
      0,
      Number(data?.retry_after_seconds) || 0,
    ),
  };
}

export async function enforceLoginRateLimit(
  request,
  email,
) {
  const context = getAuthSecurityContext(
    request,
    email,
  );

  const pairHash = digest(
    `login-pair:${context.clientHash}:${context.identityHash}`,
  );

  const pairBucket =
    `auth:login:pair:${pairHash}`;

  const clientBucket =
    `auth:login:client:${context.clientHash}`;

  const [pair, client] = await Promise.all([
    consumeBucket(
      pairBucket,
      8,
      15 * 60,
      15 * 60,
    ),
    consumeBucket(
      clientBucket,
      30,
      15 * 60,
      30 * 60,
    ),
  ]);

  return {
    ...context,
    pairBucket,
    allowed:
      pair.allowed &&
      client.allowed,
    retryAfterSeconds: Math.max(
      pair.retryAfterSeconds,
      client.retryAfterSeconds,
    ),
  };
}

export async function enforceRegisterRateLimit(
  request,
  email,
) {
  const context = getAuthSecurityContext(
    request,
    email,
  );

  const pairHash = digest(
    `register-pair:${context.clientHash}:${context.identityHash}`,
  );

  const pairBucket =
    `auth:register:pair:${pairHash}`;

  const clientBucket =
    `auth:register:client:${context.clientHash}`;

  const [pair, client] = await Promise.all([
    consumeBucket(
      pairBucket,
      3,
      60 * 60,
      60 * 60,
    ),
    consumeBucket(
      clientBucket,
      10,
      60 * 60,
      60 * 60,
    ),
  ]);

  return {
    ...context,
    pairBucket,
    allowed:
      pair.allowed &&
      client.allowed,
    retryAfterSeconds: Math.max(
      pair.retryAfterSeconds,
      client.retryAfterSeconds,
    ),
  };
}

export async function enforceRecoveryRateLimit(
  request,
  email,
) {
  const context = getAuthSecurityContext(
    request,
    email,
  );

  const pairHash = digest(
    `recovery-pair:${context.clientHash}:${context.identityHash}`,
  );

  const pairBucket =
    `auth:recovery:pair:${pairHash}`;

  const clientBucket =
    `auth:recovery:client:${context.clientHash}`;

  const [pair, client] = await Promise.all([
    consumeBucket(
      pairBucket,
      3,
      60 * 60,
      60 * 60,
    ),
    consumeBucket(
      clientBucket,
      12,
      60 * 60,
      60 * 60,
    ),
  ]);

  return {
    ...context,
    pairBucket,
    allowed:
      pair.allowed &&
      client.allowed,
    retryAfterSeconds: Math.max(
      pair.retryAfterSeconds,
      client.retryAfterSeconds,
    ),
  };
}

export async function resetAuthRateLimitBucket(
  bucket,
) {
  if (!bucket) return false;

  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.rpc(
      "auth_reset_rate_limit",
      {
        p_bucket: bucket,
      },
    );

    if (error) {
      console.error(
        "Auth rate limit reset error:",
        error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Unexpected auth rate limit reset error:",
      error,
    );
    return false;
  }
}

export async function recordAuthSecurityEvent({
  eventType,
  userId = null,
  identityHash = "",
  clientHash = "",
  metadata = {},
}) {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.rpc(
      "auth_record_security_event",
      {
        p_event_type:
          String(eventType || "")
            .trim()
            .slice(0, 64),
        p_user_id: userId || null,
        p_identity_hash:
          identityHash || null,
        p_client_hash:
          clientHash || null,
        p_metadata:
          metadata &&
          typeof metadata === "object"
            ? metadata
            : {},
      },
    );

    if (error) {
      console.error(
        "Auth security event error:",
        error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Unexpected auth security event error:",
      error,
    );
    return false;
  }
}
