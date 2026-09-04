import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  setAuthCookies,
  setPendingMfaCookies,
} from "../lib/authCookies.js";

import {
  enforceLoginRateLimit,
  recordAuthSecurityEvent,
  resetAuthRateLimitBucket,
} from "../../server/lib/authSecurity.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MFA_REQUIRED_ROLES = new Set([
  "admin",
  "owner",
]);


function readBody(request) {
  if (
    request.body &&
    typeof request.body === "object" &&
    !Buffer.isBuffer(request.body)
  ) {
    return request.body;
  }

  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return null;
    }
  }

  return null;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mapLoginError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  if (
    message.includes("email not confirmed") ||
    code.includes("email_not_confirmed")
  ) {
    return {
      status: 403,
      error: "EMAIL_NOT_CONFIRMED",
      message: "Сначала подтвердите электронную почту.",
    };
  }

  if (message.includes("rate limit") || code.includes("rate_limit")) {
    return {
      status: 429,
      error: "TOO_MANY_ATTEMPTS",
      message: "Слишком много попыток входа. Подождите несколько минут.",
    };
  }

  return {
    status: 401,
    error: "INVALID_CREDENTIALS",
    message: "Неверная электронная почта или пароль.",
  };
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({
      ok: false,
      error: guard.error,
      message: "Запрос отклонён сервером.",
    });
  }

  const body = readBody(request);
  if (!body) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      message: "Некорректный формат запроса.",
    });
  }

  const email = cleanText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailPattern.test(email) || email.length > 254) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_EMAIL",
      message: "Введите корректную электронную почту.",
    });
  }

  if (password.length < 1 || password.length > 128) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_PASSWORD",
      message: "Введите пароль.",
    });
  }

  let security;

  try {
    security = await enforceLoginRateLimit(request, email);
  } catch (error) {
    console.error("Login security error:", error);
    clearAuthCookies(response);
    return response.status(503).json({
      ok: false,
      error: error?.code || "AUTH_SECURITY_UNAVAILABLE",
      message:
        "Система защиты входа временно недоступна. Повторите попытку позже.",
    });
  }

  if (!security.allowed) {
    clearAuthCookies(response);
    const retryAfter = Math.max(1, Math.ceil(security.retryAfterSeconds));
    response.setHeader("Retry-After", String(retryAfter));

    await recordAuthSecurityEvent({
      eventType: "login_rate_limited",
      identityHash: security.identityHash,
      clientHash: security.clientHash,
      metadata: { retryAfterSeconds: retryAfter },
    });

    return response.status(429).json({
      ok: false,
      error: "TOO_MANY_ATTEMPTS",
      message: "Слишком много попыток входа. Подождите и повторите позже.",
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      clearAuthCookies(response);
      const mapped = mapLoginError(error);

      await recordAuthSecurityEvent({
        eventType: "login_failure",
        identityHash: security.identityHash,
        clientHash: security.clientHash,
        metadata: { reason: mapped.error },
      });

      return response.status(mapped.status).json({
        ok: false,
        error: mapped.error,
        message: mapped.message,
      });
    }

    if (!data?.user || !data?.session) {
      clearAuthCookies(response);
      return response.status(500).json({
        ok: false,
        error: "SESSION_NOT_CREATED",
        message: "Не удалось создать сессию входа.",
      });
    }

    const { data: access, error: accessError } = await supabase
      .from("user_roles")
      .select("role, is_blocked, blocked_reason")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (accessError) {
      clearAuthCookies(response);
      console.error("Account access error:", accessError);
      return response.status(502).json({
        ok: false,
        error: "ACCOUNT_CHECK_FAILED",
        message: "Не удалось проверить состояние аккаунта.",
      });
    }

    if (access?.is_blocked === true) {
      clearAuthCookies(response);

      await recordAuthSecurityEvent({
        eventType: "login_blocked_account",
        userId: data.user.id,
        identityHash: security.identityHash,
        clientHash: security.clientHash,
      });

      return response.status(403).json({
        ok: false,
        error: "ACCOUNT_BLOCKED",
        message:
          access.blocked_reason?.trim() || "Этот аккаунт заблокирован.",
      });
    }

    const role =
  access?.role || "user";

if (MFA_REQUIRED_ROLES.has(role)) {
  const {
    data: assurance,
    error: assuranceError,
  } =
    await supabase.auth.mfa
      .getAuthenticatorAssuranceLevel(
        data.session.access_token,
      );

  if (
    assuranceError ||
    !assurance
  ) {
    clearAuthCookies(response);

    console.error(
      "MFA assurance check error:",
      assuranceError,
    );

    await recordAuthSecurityEvent({
      eventType:
        "login_mfa_check_failed",
      userId: data.user.id,
      identityHash:
        security.identityHash,
      clientHash:
        security.clientHash,
      metadata: { role },
    });

    return response
      .status(502)
      .json({
        ok: false,
        error:
          "MFA_CHECK_FAILED",
        message:
          "Не удалось проверить двухфакторную аутентификацию.",
      });
  }

  if (
    assurance.currentLevel !==
    "aal2"
  ) {
    const setupRequired =
      assurance.nextLevel !==
      "aal2";

    setPendingMfaCookies(
      response,
      data.session,
    );

    await resetAuthRateLimitBucket(
      security.pairBucket,
    );

    await recordAuthSecurityEvent({
      eventType:
        "login_mfa_required",
      userId: data.user.id,
      identityHash:
        security.identityHash,
      clientHash:
        security.clientHash,
      metadata: {
        role,
        setupRequired,
      },
    });

    return response
      .status(200)
      .json({
        ok: true,
        mfaRequired: true,
        mfaSetupRequired:
          setupRequired,
        user: {
          id: data.user.id,
          email:
            data.user.email,
        },
        role,
      });
  }
}

setAuthCookies(
  response,
  data.session,
);

await resetAuthRateLimitBucket(
  security.pairBucket,
);

await recordAuthSecurityEvent({
  eventType: "login_success",
  userId: data.user.id,
  identityHash:
    security.identityHash,
  clientHash:
    security.clientHash,
  metadata: {
    role,
    mfa:
      MFA_REQUIRED_ROLES.has(
        role,
      ),
  },
});

return response.status(200).json({
  ok: true,
  mfaRequired: false,
  user: {
    id: data.user.id,
    email: data.user.email,
  },
  role,
});

  } catch (error) {
    clearAuthCookies(response);
    console.error("Unexpected login error:", error);

    await recordAuthSecurityEvent({
      eventType: "login_failure",
      identityHash: security?.identityHash || "",
      clientHash: security?.clientHash || "",
      metadata: { reason: "INTERNAL_SERVER_ERROR" },
    });

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Произошла серверная ошибка. Повторите попытку позже.",
    });
  }
}
