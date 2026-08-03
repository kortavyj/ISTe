import { guardRequest } from "./lib/requestGuard.js";
import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "./lib/authCookies.js";
import { readJsonBody } from "./lib/requestBody.js";
import { getSupabaseServerClient } from "./lib/supabaseServer.js";

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, account_number, created_at, updated_at";

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

function sendGuardError(response, guard) {
  if (guard.allow) {
    response.setHeader("Allow", guard.allow);
  }

  return response.status(guard.status).json({
    ok: false,
    error: guard.error,
    message: "Запрос отклонён сервером.",
  });
}

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

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

  const body = readJsonBody(request);

  if (!body) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      message:
        "Не удалось прочитать данные профиля.",
    });
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
    return response.status(400).json({
      ok: false,
      error: "INVALID_USERNAME",
      message:
        "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
    });
  }

  if (
    displayName.length < 2 ||
    displayName.length > 60
  ) {
    return response.status(400).json({
      ok: false,
      error: "INVALID_DISPLAY_NAME",
      message:
        "Имя должно содержать от 2 до 60 символов.",
    });
  }

  if (bio.length > 500) {
    return response.status(400).json({
      ok: false,
      error: "BIO_TOO_LONG",
      message:
        "Описание не должно превышать 500 символов.",
    });
  }

  const {
    accessToken,
    refreshToken,
  } = readAuthCookies(request);

  if (!refreshToken) {
    clearAuthCookies(response);

    return response.status(401).json({
      ok: false,
      error: "AUTH_REQUIRED",
      message:
        "Нужно повторно войти в аккаунт.",
    });
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

      return response.status(401).json({
        ok: false,
        error: "AUTH_REQUIRED",
        message:
          "Нужно повторно войти в аккаунт.",
      });
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
        "is_blocked, blocked_reason",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (accessError) {
      console.error(
        "Profile access check error:",
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
      return response.status(403).json({
        ok: false,
        error: "ACCOUNT_BLOCKED",
        message:
          access?.blocked_reason?.trim() ||
          "Аккаунт заблокирован.",
      });
    }

    const {
      data: profile,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio: bio || null,
      })
      .eq("id", user.id)
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
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Произошла серверная ошибка.",
    });
  }
}
