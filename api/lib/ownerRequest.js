import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "./authCookies.js";
import { getSupabaseServerClient } from "./supabaseServer.js";

const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED:
    "Нужно повторно войти в аккаунт.",
  OWNER_REQUIRED:
  "Эта операция доступна только владельцу.",
MFA_REQUIRED:
  "Для доступа владельца требуется подтверждение двухфакторной аутентификации.",
ACCOUNT_BLOCKED:

    "Этот аккаунт заблокирован.",
  TARGET_REQUIRED:
    "Пользователь не выбран.",
  CANNOT_CHANGE_OWN_ROLE:
    "Нельзя изменить собственную роль.",
  CANNOT_CHANGE_OWNER:
    "Нельзя изменить роль владельца.",
  INVALID_ROLE:
    "Выбрана недопустимая роль.",
  USER_ROLE_NOT_FOUND:
    "Роль пользователя не найдена.",
  CANNOT_BLOCK_SELF:
    "Нельзя заблокировать собственный аккаунт.",
  CANNOT_BLOCK_OWNER:
    "Нельзя заблокировать владельца.",
});

function findKnownError(error) {
  const source = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" ");

  return Object.keys(ERROR_MESSAGES).find(
    (code) => source.includes(code),
  );
}

export function mapOwnerRpcError(
  error,
  fallbackMessage =
    "Не удалось выполнить операцию.",
) {
  const knownCode = findKnownError(error);

  if (knownCode) {
    const status =
      knownCode === "AUTH_REQUIRED"
        ? 401
        : knownCode === "OWNER_REQUIRED" ||
      knownCode === "MFA_REQUIRED" ||
      knownCode === "ACCOUNT_BLOCKED"

          ? 403
          : 400;

    return {
      status,
      error: knownCode,
      message: ERROR_MESSAGES[knownCode],
    };
  }

  return {
    status: 502,
    error: "OWNER_OPERATION_FAILED",
    message: fallbackMessage,
  };
}

async function establishSession(
  supabase,
  accessToken,
  refreshToken,
) {
  if (accessToken && refreshToken) {
    return supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  if (refreshToken) {
    return supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
  }

  return {
    data: null,
    error: new Error("AUTH_REQUIRED"),
  };
}

export async function requireOwner(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const {
    accessToken,
    refreshToken,
  } = readAuthCookies(request);

  if (!refreshToken) {
    clearAuthCookies(response);

    return {
      ok: false,
      status: 401,
      error: "AUTH_REQUIRED",
      message:
        ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }

  try {
    const supabase =
      getSupabaseServerClient();

    const {
      data: sessionData,
      error: sessionError,
    } = await establishSession(
      supabase,
      accessToken,
      refreshToken,
    );

    if (
      sessionError ||
      !sessionData?.session ||
      !sessionData?.user
    ) {
      clearAuthCookies(response);

      return {
        ok: false,
        status: 401,
        error: "AUTH_REQUIRED",
        message:
          ERROR_MESSAGES.AUTH_REQUIRED,
      };
    }

    setAuthCookies(
      response,
      sessionData.session,
    );

    const user = sessionData.user;

    const {
      data: access,
      error: accessError,
    } = await supabase
      .from("user_roles")
      .select(
        "role, is_blocked, blocked_reason",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (accessError) {
      console.error(
        "Owner access check error:",
        accessError,
      );

      return {
        ok: false,
        status: 502,
        error: "ACCOUNT_CHECK_FAILED",
        message:
          "Не удалось проверить права аккаунта.",
      };
    }

    if (access?.is_blocked === true) {
      return {
        ok: false,
        status: 403,
        error: "ACCOUNT_BLOCKED",
        message:
          access.blocked_reason?.trim() ||
          ERROR_MESSAGES.ACCOUNT_BLOCKED,
      };
    }

    if (access?.role !== "owner") {
  return {
    ok: false,
    status: 403,
    error: "OWNER_REQUIRED",
    message:
      ERROR_MESSAGES.OWNER_REQUIRED,
  };
}

const {
  data: assurance,
  error: assuranceError,
} =
  await supabase.auth.mfa
    .getAuthenticatorAssuranceLevel(
      sessionData.session
        .access_token,
    );

if (
  assuranceError ||
  assurance?.currentLevel !==
    "aal2"
) {
  clearAuthCookies(response);

  if (assuranceError) {
    console.error(
      "Owner MFA check error:",
      assuranceError,
    );
  }

  return {
    ok: false,
    status:
      assuranceError
        ? 502
        : 403,
    error:
      assuranceError
        ? "MFA_CHECK_FAILED"
        : "MFA_REQUIRED",
    message:
      assuranceError
        ? "Не удалось проверить двухфакторную аутентификацию."
        : ERROR_MESSAGES.MFA_REQUIRED,
  };
}

return {
  ok: true,
  supabase,
  user,
  role: "owner",
};

  } catch (error) {
    console.error(
      "Unexpected owner authentication error:",
      error,
    );

    return {
      ok: false,
      status: 500,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось проверить права владельца.",
    };
  }
}
