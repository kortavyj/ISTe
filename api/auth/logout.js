import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  readAuthCookies,
} from "../lib/authCookies.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

export default async function handler(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: false,
    requireOrigin: true,
  });

  if (!guard.ok) {
    if (guard.allow) {
      response.setHeader("Allow", guard.allow);
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

  try {
    if (accessToken && refreshToken) {
      const supabase =
        getSupabaseServerClient();

      const {
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!sessionError) {
        const {
          error: signOutError,
        } = await supabase.auth.signOut({
          scope: "local",
        });

        if (signOutError) {
          console.error(
            "Sign out error:",
            signOutError,
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "Unexpected sign out error:",
      error,
    );
  }

  clearAuthCookies(response);

  return response.status(200).json({
    ok: true,
    authenticated: false,
  });
}
