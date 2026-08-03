import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../lib/authCookies.js";
import { readJsonBody } from "../lib/requestBody.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, account_number, created_at, updated_at";

const LEGACY_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, created_at, updated_at";

async function loadProfile(
  supabase,
  userId,
) {
  const profileQuery = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (!profileQuery.error) {
    return profileQuery.data;
  }

  const message = String(
    profileQuery.error?.message || "",
  );

  const details = String(
    profileQuery.error?.details || "",
  );

  const accountNumberMissing =
    message.includes("account_number") ||
    details.includes("account_number");

  if (!accountNumberMissing) {
    throw profileQuery.error;
  }

  const legacyQuery = await supabase
    .from("profiles")
    .select(LEGACY_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (legacyQuery.error) {
    throw legacyQuery.error;
  }

  return legacyQuery.data
    ? {
        ...legacyQuery.data,
        account_number: null,
      }
    : null;
}

async function establishSession(
  supabase,
  accessToken,
  refreshToken,
) {
  if (accessToken && refreshToken) {
    const sessionResult =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (
      !sessionResult.error &&
      sessionResult.data?.session &&
      sessionResult.data?.user
    ) {
      return sessionResult;
    }
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

function sendGuardError(
  response,
  guard,
) {
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

function sendGuestSession(response) {
  clearAuthCookies(response);

  return response.status(200).json({
    ok: true,
    authenticated: false,
    user: null,
    profile: null,
    role: "user",
    isBlocked: false,
    blockedReason: "",
  });
}

function readProfileInput(request) {
  const body = readJsonBody(request);

  if (!body) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_JSON",
      message:
        "Не удалось прочитать данные профиля.",
    };
  }

  const username =
    typeof body.username === "string"
      ? body.username.trim()
      : "";

  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim()
      : "";

  const bio =
    typeof body.bio === "string"
      ? body.bio.trim()
      : "";

  if (
    !/^[A-Za-z0-9_]{3,32}$/.test(
      username,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_USERNAME",
      message:
        "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
    };
  }

  if (
    displayName.length < 2 ||
    displayName.length > 60
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_DISPLAY_NAME",
      message:
        "Имя должно содержать от 2 до 60 символов.",
    };
  }

  if (bio.length > 500) {
    return {
      ok: false,
      status: 400,
      error: "BIO_TOO_LONG",
      message:
        "Описание не должно превышать 500 символов.",
    };
  }

  return {
    ok: true,
    username,
    displayName,
    bio,
  };
}


function readSearchInput(request) {
  const body = readJsonBody(request);

  if (!body) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_JSON",
      message:
        "Не удалось прочитать параметры поиска.",
    };
  }

  const digits = String(
    body.accountId ?? "",
  )
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 18);

  if (!digits || digits === "0") {
    return {
      ok: false,
      status: 400,
      error: "INVALID_ACCOUNT_ID",
      message:
        "Введите корректный ID пользователя.",
    };
  }

  return {
    ok: true,
    accountId: digits,
  };
}

async function getAuthenticatedSession(
  request,
  response,
) {
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
        "Нужно повторно войти в аккаунт.",
    };
  }

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
        "Нужно повторно войти в аккаунт.",
    };
  }

  setAuthCookies(
    response,
    sessionData.session,
  );

  return {
    ok: true,
    supabase,
    session: sessionData.session,
    user: sessionData.user,
  };
}

async function loadAccountAccess(
  supabase,
  userId,
) {
  const {
    data: access,
    error: accessError,
  } = await supabase
    .from("user_roles")
    .select(
      "role, is_blocked, blocked_reason",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (accessError) {
    throw Object.assign(
      new Error(
        "Не удалось проверить состояние аккаунта.",
      ),
      {
        code: "ACCOUNT_CHECK_FAILED",
        status: 502,
        cause: accessError,
      },
    );
  }

  return {
    role: access?.role || "user",
    isBlocked:
      access?.is_blocked === true,
    blockedReason:
      access?.blocked_reason?.trim() || "",
  };
}

async function handleGetSession(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const {
    refreshToken,
  } = readAuthCookies(request);

  if (!refreshToken) {
    return sendGuestSession(response);
  }

  try {
    const auth =
      await getAuthenticatedSession(
        request,
        response,
      );

    if (!auth.ok) {
      return sendGuestSession(response);
    }

    const access =
      await loadAccountAccess(
        auth.supabase,
        auth.user.id,
      );

    if (access.isBlocked) {
      return response.status(200).json({
        ok: true,
        authenticated: true,

        user: {
          id: auth.user.id,
          email: auth.user.email,
        },

        profile: null,
        role: access.role,
        isBlocked: true,
        blockedReason:
          access.blockedReason,
      });
    }

    const profile = await loadProfile(
      auth.supabase,
      auth.user.id,
    );

    return response.status(200).json({
      ok: true,
      authenticated: true,

      user: {
        id: auth.user.id,
        email: auth.user.email,
      },

      profile,
      role: access.role,
      isBlocked: false,
      blockedReason: "",
    });
  } catch (error) {
    console.error(
      "Unexpected session error:",
      error?.cause || error,
    );

    return response
      .status(error?.status || 500)
      .json({
        ok: false,
        error:
          error?.code ||
          "INTERNAL_SERVER_ERROR",
        message:
          error?.message ||
          "Не удалось проверить сессию пользователя.",
      });
  }
}

async function handleProfileUpdate(
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
    return sendGuardError(
      response,
      guard,
    );
  }

  const input =
    readProfileInput(request);

  if (!input.ok) {
    return response
      .status(input.status)
      .json({
        ok: false,
        error: input.error,
        message: input.message,
      });
  }

  try {
    const auth =
      await getAuthenticatedSession(
        request,
        response,
      );

    if (!auth.ok) {
      return response
        .status(auth.status)
        .json({
          ok: false,
          error: auth.error,
          message: auth.message,
        });
    }

    const access =
      await loadAccountAccess(
        auth.supabase,
        auth.user.id,
      );

    if (access.isBlocked) {
      return response.status(403).json({
        ok: false,
        error: "ACCOUNT_BLOCKED",
        message:
          access.blockedReason ||
          "Аккаунт заблокирован.",
      });
    }

    const {
      data: profile,
      error: updateError,
    } = await auth.supabase
      .from("profiles")
      .update({
        username: input.username,
        display_name:
          input.displayName,
        bio: input.bio || null,
      })
      .eq("id", auth.user.id)
      .select(PROFILE_COLUMNS)
      .maybeSingle();

    if (updateError) {
      const source = [
        updateError.message,
        updateError.details,
        updateError.hint,
        updateError.code,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        updateError.code === "23505" ||
        /duplicate|unique|username/i.test(
          source,
        )
      ) {
        return response.status(409).json({
          ok: false,
          error: "USERNAME_TAKEN",
          message:
            "Этот никнейм уже занят.",
        });
      }

      console.error(
        "Profile update error:",
        updateError,
      );

      return response.status(502).json({
        ok: false,
        error: "PROFILE_UPDATE_FAILED",
        message:
          "Не удалось сохранить профиль.",
      });
    }

    if (!profile) {
      return response.status(404).json({
        ok: false,
        error: "PROFILE_NOT_FOUND",
        message:
          "Профиль пользователя не найден.",
      });
    }

    return response.status(200).json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected profile update error:",
      error?.cause || error,
    );

    return response
      .status(error?.status || 500)
      .json({
        ok: false,
        error:
          error?.code ||
          "INTERNAL_SERVER_ERROR",
        message:
          error?.message ||
          "Произошла серверная ошибка.",
      });
  }
}


async function handleUserSearch(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 4 * 1024,
  });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const input =
    readSearchInput(request);

  if (!input.ok) {
    return response
      .status(input.status)
      .json({
        ok: false,
        error: input.error,
        message: input.message,
      });
  }

  try {
    const auth =
      await getAuthenticatedSession(
        request,
        response,
      );

    if (!auth.ok) {
      return response
        .status(auth.status)
        .json({
          ok: false,
          error: auth.error,
          message: auth.message,
        });
    }

    const access =
      await loadAccountAccess(
        auth.supabase,
        auth.user.id,
      );

    if (access.isBlocked) {
      return response.status(403).json({
        ok: false,
        error: "ACCOUNT_BLOCKED",
        message:
          "Поиск недоступен для заблокированного аккаунта.",
      });
    }

    const {
      data,
      error,
    } = await auth.supabase.rpc(
      "find_profile_by_account_id",
      {
        p_account_id:
          input.accountId,
      },
    );

    if (error) {
      const source = [
        error.message,
        error.details,
        error.hint,
        error.code,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        /find_profile_by_account_id/i.test(
          source,
        ) &&
        /function|schema cache|could not find/i.test(
          source,
        )
      ) {
        return response.status(503).json({
          ok: false,
          error: "SEARCH_FUNCTION_MISSING",
          message:
            "Функция поиска не подключена к базе данных.",
        });
      }

      if (/AUTH_REQUIRED/i.test(source)) {
        return response.status(401).json({
          ok: false,
          error: "AUTH_REQUIRED",
          message:
            "Нужно повторно войти в аккаунт.",
        });
      }

      if (/ACCOUNT_BLOCKED/i.test(source)) {
        return response.status(403).json({
          ok: false,
          error: "ACCOUNT_BLOCKED",
          message:
            "Поиск недоступен для заблокированного аккаунта.",
        });
      }

      console.error(
        "User search error:",
        error,
      );

      return response.status(502).json({
        ok: false,
        error: "USER_SEARCH_FAILED",
        message:
          "Не удалось выполнить поиск пользователя.",
      });
    }

    const profile = Array.isArray(data)
      ? data[0] ?? null
      : data ?? null;

    return response.status(200).json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected user search error:",
      error?.cause || error,
    );

    return response
      .status(error?.status || 500)
      .json({
        ok: false,
        error:
          error?.code ||
          "INTERNAL_SERVER_ERROR",
        message:
          error?.message ||
          "Произошла серверная ошибка.",
      });
  }
}

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const method = String(
    request.method || "",
  ).toUpperCase();

  if (method === "GET") {
    return handleGetSession(
      request,
      response,
    );
  }

  if (method === "POST") {
    const body = readJsonBody(request);

    if (body?.action === "find-user") {
      return handleUserSearch(
        request,
        response,
      );
    }

    return handleProfileUpdate(
      request,
      response,
    );
  }

  response.setHeader(
    "Allow",
    "GET, POST",
  );

  return response.status(405).json({
    ok: false,
    error: "METHOD_NOT_ALLOWED",
    message:
      "Этот метод запроса не поддерживается.",
  });
}
