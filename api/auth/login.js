import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../lib/authCookies.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  return typeof value === "string"
    ? value.trim()
    : "";
}

function mapLoginError(error) {
  const message = String(
    error?.message || "",
  ).toLowerCase();

  const code = String(
    error?.code || "",
  ).toLowerCase();

  if (
    message.includes("email not confirmed") ||
    code.includes("email_not_confirmed")
  ) {
    return {
      status: 403,
      error: "EMAIL_NOT_CONFIRMED",
      message:
        "Сначала подтвердите электронную почту.",
    };
  }

  if (
    message.includes("rate limit") ||
    code.includes("rate_limit")
  ) {
    return {
      status: 429,
      error: "TOO_MANY_ATTEMPTS",
      message:
        "Слишком много попыток входа. Подождите несколько минут.",
    };
  }

  return {
    status: 401,
    error: "INVALID_CREDENTIALS",
    message:
      "Неверная электронная почта или пароль.",
  };
}

export default async function handler(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    if (guard.allow) {
      response.setHeader(
        "Allow",
        guard.allow,
      );
    }

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
      message:
        "Некорректный формат запроса.",
    });
  }

  const email =
    cleanText(body.email).toLowerCase();

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (
    !emailPattern.test(email) ||
    email.length > 254
  ) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_EMAIL",
      message:
        "Введите корректную электронную почту.",
    });
  }

  if (
    password.length < 1 ||
    password.length > 128
  ) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_PASSWORD",
      message: "Введите пароль.",
    });
  }

  try {
    const supabase =
      getSupabaseServerClient();

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      clearAuthCookies(response);

      const mapped =
        mapLoginError(error);

      return response
        .status(mapped.status)
        .json({
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
        message:
          "Не удалось создать сессию входа.",
      });
    }

    const {
      data: access,
      error: accessError,
    } = await supabase
      .from("user_roles")
      .select(
        "role, is_blocked, blocked_reason",
      )
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (accessError) {
      clearAuthCookies(response);

      console.error(
        "Account access error:",
        accessError,
      );

      return response.status(502).json({
        ok: false,
        error: "ACCOUNT_CHECK_FAILED",
        message:
          "Не удалось проверить состояние аккаунта.",
      });
    }

    if (access?.is_blocked === true) {
      clearAuthCookies(response);

      return response.status(403).json({
        ok: false,
        error: "ACCOUNT_BLOCKED",
        message:
          access.blocked_reason?.trim() ||
          "Этот аккаунт заблокирован.",
      });
    }

    setAuthCookies(
      response,
      data.session,
    );

    return response.status(200).json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      role: access?.role || "user",
    });
  } catch (error) {
    clearAuthCookies(response);

    console.error(
      "Unexpected login error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Произошла серверная ошибка. Повторите попытку позже.",
    });
  }
}
