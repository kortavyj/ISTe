import { guardRequest } from "../lib/requestGuard.js";
import {
  enforceRegisterRateLimit,
  recordAuthSecurityEvent,
} from "../../server/lib/authSecurity.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const usernamePattern =
  /^[A-Za-z0-9_]{3,32}$/;

const gmailPattern =
  /^[^\s@]+@gmail\.com$/i;

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

function mapRegistrationError(error) {
  const message = String(
    error?.message || "",
  ).toLowerCase();

  const code = String(
    error?.code || "",
  ).toLowerCase();

  if (
    message.includes("email rate limit") ||
    code.includes(
      "over_email_send_rate_limit",
    )
  ) {
    return {
      status: 429,
      error: "EMAIL_RATE_LIMIT",
      message:
        "Слишком много писем. Подождите несколько минут и повторите попытку.",
    };
  }

  if (
    message.includes(
      "already registered",
    ) ||
    message.includes(
      "user already registered",
    )
  ) {
    return {
      status: 409,
      error: "EMAIL_ALREADY_USED",
      message:
        "Этот адрес электронной почты уже используется.",
    };
  }

  if (
    message.includes("duplicate key") ||
    message.includes(
      "profiles_username_lower_unique_idx",
    )
  ) {
    return {
      status: 409,
      error: "USERNAME_TAKEN",
      message:
        "Этот никнейм уже занят. Выберите другой.",
    };
  }

  return {
    status: 400,
    error: "REGISTRATION_FAILED",
    message:
      "Не удалось создать аккаунт. Проверьте данные и повторите попытку.",
  };
}

function setSecurityHeaders(response) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  response.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );
}

export default async function handler(
  request,
  response,
) {
  setSecurityHeaders(response);

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 16 * 1024,
  });

  if (!guard.ok) {
    if (guard.allow) {
      response.setHeader(
        "Allow",
        guard.allow,
      );
    }

    return response
      .status(guard.status)
      .json({
        ok: false,
        error: guard.error,
        message:
          "Запрос отклонён сервером.",
      });
  }

  const body = readBody(request);

  if (!body) {
    return response
      .status(400)
      .json({
        ok: false,
        error: "INVALID_JSON",
        message:
          "Некорректный формат запроса.",
      });
  }

  const username =
    cleanText(body.username);

  const displayName =
    cleanText(body.displayName);

  const email =
    cleanText(body.email)
      .toLowerCase();

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  const passwordRepeat =
    typeof body.passwordRepeat === "string"
      ? body.passwordRepeat
      : "";

  if (!usernamePattern.test(username)) {
    return response
      .status(400)
      .json({
        ok: false,
        error:
          "INVALID_USERNAME",
        message:
          "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
      });
  }

  if (
    displayName.length < 2 ||
    displayName.length > 60
  ) {
    return response
      .status(400)
      .json({
        ok: false,
        error:
          "INVALID_DISPLAY_NAME",
        message:
          "Имя должно содержать от 2 до 60 символов.",
      });
  }

  if (!gmailPattern.test(email)) {
    return response
      .status(400)
      .json({
        ok: false,
        error: "INVALID_EMAIL",
        message:
          "Регистрация доступна только с почтой Gmail.",
      });
  }

  if (
    password.length < 10 ||
    password.length > 128
  ) {
    return response
      .status(400)
      .json({
        ok: false,
        error:
          "INVALID_PASSWORD",
        message:
          "Пароль должен содержать от 10 до 128 символов.",
      });
  }

  if (password !== passwordRepeat) {
    return response
      .status(400)
      .json({
        ok: false,
        error:
          "PASSWORDS_DO_NOT_MATCH",
        message:
          "Введённые пароли не совпадают.",
      });
  }

  const redirectOrigin =
    process.env.APP_ORIGIN
      ?.trim()
      .replace(/\/+$/, "");

  if (!redirectOrigin) {
    return response
      .status(500)
      .json({
        ok: false,
        error:
          "SERVER_CONFIGURATION_ERROR",
        message:
          "Сервер регистрации временно недоступен.",
      });
  }

  let security;

  try {
    security =
      await enforceRegisterRateLimit(
        request,
        email,
      );
  } catch (error) {
    console.error(
      "Registration security error:",
      error,
    );

    return response
      .status(503)
      .json({
        ok: false,
        error:
          error?.code ||
          "AUTH_SECURITY_UNAVAILABLE",
        message:
          "Система защиты регистрации временно недоступна. Повторите попытку позже.",
      });
  }

  if (!security.allowed) {
    const retryAfter =
      Math.max(
        1,
        Math.ceil(
          security.retryAfterSeconds,
        ),
      );

    response.setHeader(
      "Retry-After",
      String(retryAfter),
    );

    await recordAuthSecurityEvent({
      eventType:
        "register_rate_limited",
      identityHash:
        security.identityHash,
      clientHash:
        security.clientHash,
      metadata: {
        retryAfterSeconds:
          retryAfter,
      },
    });

    return response
      .status(429)
      .json({
        ok: false,
        error:
          "TOO_MANY_REGISTRATIONS",
        message:
          "Слишком много попыток регистрации. Повторите позже.",
      });
  }

  try {
    const supabase =
      getSupabaseServerClient();

    const {
      data: usernameAvailable,
      error: usernameCheckError,
    } = await supabase.rpc(
      "is_username_available",
      {
        candidate_username:
          username,
      },
    );

    if (usernameCheckError) {
      console.error(
        "Username availability error:",
        usernameCheckError,
      );

      await recordAuthSecurityEvent({
        eventType:
          "register_failure",
        identityHash:
          security.identityHash,
        clientHash:
          security.clientHash,
        metadata: {
          reason:
            "USERNAME_CHECK_FAILED",
        },
      });

      return response
        .status(502)
        .json({
          ok: false,
          error:
            "USERNAME_CHECK_FAILED",
          message:
            "Не удалось проверить никнейм. Повторите попытку через несколько секунд.",
        });
    }

    if (usernameAvailable !== true) {
      await recordAuthSecurityEvent({
        eventType:
          "register_failure",
        identityHash:
          security.identityHash,
        clientHash:
          security.clientHash,
        metadata: {
          reason:
            "USERNAME_TAKEN",
        },
      });

      return response
        .status(409)
        .json({
          ok: false,
          error:
            "USERNAME_TAKEN",
          message:
            "Этот никнейм уже занят. Выберите другой.",
        });
    }

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            `${redirectOrigin}/account`,
          data: {
            username,
            display_name:
              displayName,
          },
        },
      });

    if (error) {
      const mapped =
        mapRegistrationError(
          error,
        );

      console.error(
        "Registration error:",
        error,
      );

      await recordAuthSecurityEvent({
        eventType:
          "register_failure",
        identityHash:
          security.identityHash,
        clientHash:
          security.clientHash,
        metadata: {
          reason:
            mapped.error,
        },
      });

      return response
        .status(mapped.status)
        .json({
          ok: false,
          error: mapped.error,
          message:
            mapped.message,
        });
    }

    await recordAuthSecurityEvent({
      eventType:
        "register_success",
      userId:
        data?.user?.id || null,
      identityHash:
        security.identityHash,
      clientHash:
        security.clientHash,
    });

    return response
      .status(201)
      .json({
        ok: true,
        requiresEmailConfirmation:
          true,
        message:
          "Письмо подтверждения отправлено на указанную почту.",
      });
  } catch (error) {
    console.error(
      "Unexpected registration error:",
      error,
    );

    await recordAuthSecurityEvent({
      eventType:
        "register_failure",
      identityHash:
        security?.identityHash || "",
      clientHash:
        security?.clientHash || "",
      metadata: {
        reason:
          "INTERNAL_SERVER_ERROR",
      },
    });

    return response
      .status(500)
      .json({
        ok: false,
        error:
          "INTERNAL_SERVER_ERROR",
        message:
          "Произошла серверная ошибка. Повторите попытку позже.",
      });
  }
}
