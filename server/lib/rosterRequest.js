import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../../api/lib/authCookies.js";
import { getSupabaseServerClient } from "../../api/lib/supabaseServer.js";

const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED:
    "Нужно повторно войти в аккаунт.",
  ROSTER_ACCESS_REQUIRED:
    "У вас нет доступа к управлению составом.",
  MFA_REQUIRED:
    "Для управления составом требуется двухфакторная аутентификация.",
  ACCOUNT_BLOCKED:
    "Этот аккаунт заблокирован.",
});

async function establishSession(
  supabase,
  accessToken,
  refreshToken,
) {
  if (
    accessToken &&
    refreshToken
  ) {
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
    error:
      new Error("AUTH_REQUIRED"),
  };
}

export async function requireRosterAccess(
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

    const user =
      sessionData.user;

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
        "Roster access check error:",
        accessError,
      );

      return {
        ok: false,
        status: 502,
        error:
          "ACCOUNT_CHECK_FAILED",
        message:
          "Не удалось проверить права аккаунта.",
      };
    }

    if (
      access?.is_blocked === true
    ) {
      return {
        ok: false,
        status: 403,
        error:
          "ACCOUNT_BLOCKED",
        message:
          access.blocked_reason?.trim() ||
          ERROR_MESSAGES
            .ACCOUNT_BLOCKED,
      };
    }

    if (
      access?.role !== "owner" &&
      access?.role !== "admin" &&
      access?.role !==
        "game_manager"
    ) {
      return {
        ok: false,
        status: 403,
        error:
          "ROSTER_ACCESS_REQUIRED",
        message:
          ERROR_MESSAGES
            .ROSTER_ACCESS_REQUIRED,
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
          "Roster MFA check error:",
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
            : ERROR_MESSAGES
                .MFA_REQUIRED,
      };
    }

    return {
      ok: true,
      supabase,
      user,
      role: access.role,
    };
  } catch (error) {
    console.error(
      "Unexpected roster authentication error:",
      error,
    );

    return {
      ok: false,
      status: 500,
      error:
        "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось проверить доступ к Roster Manager.",
    };
  }
}
