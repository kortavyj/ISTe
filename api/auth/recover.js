import { guardRequest } from "../lib/requestGuard.js";
import {
  enforceRecoveryRateLimit,
  recordAuthSecurityEvent,
} from "../lib/authSecurity.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function genericSuccess(response) {
  return response.status(200).json({
    ok: true,
    message:
      "Если аккаунт с такой почтой существует, на неё отправлено письмо для смены пароля.",
  });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 4 * 1024,
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

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!emailPattern.test(email) || email.length > 254) {
    return genericSuccess(response);
  }

  const redirectOrigin = process.env.APP_ORIGIN?.trim().replace(/\/+$/, "");
  if (!redirectOrigin) {
    return response.status(503).json({
      ok: false,
      error: "SERVER_CONFIGURATION_ERROR",
      message: "Восстановление пароля временно недоступно.",
    });
  }

  let security;

  try {
    security = await enforceRecoveryRateLimit(request, email);
  } catch (error) {
    console.error("Recovery security error:", error);
    return response.status(503).json({
      ok: false,
      error: error?.code || "AUTH_SECURITY_UNAVAILABLE",
      message: "Система защиты восстановления временно недоступна.",
    });
  }

  if (!security.allowed) {
    const retryAfter = Math.max(1, Math.ceil(security.retryAfterSeconds));
    response.setHeader("Retry-After", String(retryAfter));

    await recordAuthSecurityEvent({
      eventType: "recovery_rate_limited",
      identityHash: security.identityHash,
      clientHash: security.clientHash,
      metadata: { retryAfterSeconds: retryAfter },
    });

    return response.status(429).json({
      ok: false,
      error: "TOO_MANY_RECOVERY_REQUESTS",
      message: "Слишком много запросов восстановления. Повторите позже.",
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectOrigin}/reset-password`,
    });

    await recordAuthSecurityEvent({
      eventType: "recovery_request",
      identityHash: security.identityHash,
      clientHash: security.clientHash,
      metadata: { accepted: !error },
    });

    if (error) {
      console.error("Password recovery error:", {
        name: error?.name || "",
        code: error?.code || "",
        status: error?.status || null,
      });
    }

    return genericSuccess(response);
  } catch (error) {
    console.error("Unexpected password recovery error:", error);
    return genericSuccess(response);
  }
}
