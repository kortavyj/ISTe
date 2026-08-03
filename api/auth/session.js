import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../lib/authCookies.js";
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

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
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

  const {
    accessToken,
    refreshToken,
  } = readAuthCookies(request);

  if (!refreshToken) {
    return sendGuestSession(response);
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
      return sendGuestSession(response);
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
        "Session access error:",
        accessError,
      );

      return response.status(502).json({
        ok: false,
        error: "ACCOUNT_CHECK_FAILED",
        message:
          "Не удалось проверить состояние аккаунта.",
      });
    }

    const role = access?.role || "user";

    const isBlocked =
      access?.is_blocked === true;

    const blockedReason =
      access?.blocked_reason?.trim() || "";

    if (isBlocked) {
      return response.status(200).json({
        ok: true,
        authenticated: true,

        user: {
          id: user.id,
          email: user.email,
        },

        profile: null,
        role,
        isBlocked: true,
        blockedReason,
      });
    }

    const profile = await loadProfile(
      supabase,
      user.id,
    );

    return response.status(200).json({
      ok: true,
      authenticated: true,

      user: {
        id: user.id,
        email: user.email,
      },

      profile,
      role,
      isBlocked: false,
      blockedReason: "",
    });
  } catch (error) {
    console.error(
      "Unexpected session error:",
      error,
    );

    return response.status(500).json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR",
      message:
        "Не удалось проверить сессию пользователя.",
    });
  }
}
