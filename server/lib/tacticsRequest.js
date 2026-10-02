import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../../api/lib/authCookies.js";
import { getSupabaseServerClient } from "../../api/lib/supabaseServer.js";

const ACCESS_ROLES = new Set([
  "player",
  "game_manager",
  "owner",
]);

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

export async function requireTacticsAccess(
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
      .select("role, is_blocked")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accessError) {
      return {
        ok: false,
        status: 502,
        error: "ACCOUNT_CHECK_FAILED",
      };
    }

    if (access?.is_blocked === true) {
      return {
        ok: false,
        status: 403,
        error: "ACCOUNT_BLOCKED",
      };
    }

    if (!ACCESS_ROLES.has(access?.role)) {
      return {
        ok: false,
        status: 403,
        error: "TACTICS_ACCESS_REQUIRED",
      };
    }

    return {
      ok: true,
      user,
      role: access.role,
    };
  } catch (error) {
    console.error(
      "Tactics access error:",
      error,
    );

    return {
      ok: false,
      status: 500,
      error: "INTERNAL_SERVER_ERROR",
    };
  }
}
