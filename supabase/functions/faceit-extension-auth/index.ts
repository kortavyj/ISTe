import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const FUNCTION_NAME = "faceit-extension-auth";
const FACEIT_AUTH_URL = "https://accounts.faceit.com";
const FACEIT_TOKEN_URL = "https://api.faceit.com/auth/v1/oauth/token";
const FACEIT_USERINFO_URL = "https://api.faceit.com/auth/v1/resources/userinfo";
const FACEIT_DATA_API = "https://open.faceit.com/data/v4";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_TTL_MS = 10 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return base64Url(new Uint8Array(digest));
}

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  let secret = "";

  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    secret = String(keys.default ?? "");
  } catch {
    secret = "";
  }

  if (!secret) {
    secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  }

  if (!url || !secret) {
    throw new Error("Supabase admin environment is not configured.");
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function config() {
  const clientId = String(Deno.env.get("FACEIT_CLIENT_ID") ?? "").trim();
  const clientSecret = String(Deno.env.get("FACEIT_CLIENT_SECRET") ?? "").trim();
  const dataApiKey = String(Deno.env.get("FACEIT_DATA_API_KEY") ?? "").trim();
  const supabaseUrl = String(Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  const redirectUrl = String(
    Deno.env.get("FACEIT_OAUTH_REDIRECT_URL") ||
      (supabaseUrl
        ? `${supabaseUrl}/functions/v1/${FUNCTION_NAME}/callback`
        : ""),
  ).trim();
  const successUrl = String(
    Deno.env.get("FACEIT_EXTENSION_SUCCESS_URL") ||
      "https://www.istesport.com/",
  ).trim();

  return {
    clientId,
    clientSecret,
    dataApiKey,
    redirectUrl,
    successUrl,
    configured: Boolean(clientId && clientSecret && redirectUrl),
  };
}

function successRedirect(base: string, params: Record<string, string>) {
  try {
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return Response.redirect(url.toString(), 302);
  } catch {
    return json({ ok: false, error: "INVALID_SUCCESS_URL" }, 500);
  }
}

async function startLogin() {
  const cfg = config();

  if (!cfg.configured) {
    return json(
      {
        ok: false,
        error: "FACEIT_OAUTH_NOT_CONFIGURED",
        configured: {
          clientId: Boolean(cfg.clientId),
          clientSecret: Boolean(cfg.clientSecret),
          dataApiKey: Boolean(cfg.dataApiKey),
          redirectUrl: Boolean(cfg.redirectUrl),
        },
      },
      503,
    );
  }

  const loginId = crypto.randomUUID();
  const state = randomToken(32);
  const claimSecret = randomToken(48);
  const claimSecretHash = await sha256(claimSecret);
  const codeVerifier = randomToken(48);
  const codeChallenge = await sha256(codeVerifier);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOGIN_TTL_MS).toISOString();

  const db = supabaseAdmin();
  const { error } = await db
    .from("faceit_extension_auth_sessions")
    .insert({
      id: loginId,
      oauth_state: state,
      claim_secret_hash: claimSecretHash,
      code_verifier: codeVerifier,
      status: "pending",
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    });

  if (error) throw error;

  const authUrl = new URL(FACEIT_AUTH_URL);
  authUrl.searchParams.set("client_id", cfg.clientId);
  authUrl.searchParams.set("redirect_uri", cfg.redirectUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return json({
    ok: true,
    login_id: loginId,
    claim_secret: claimSecret,
    authorization_url: authUrl.toString(),
    expires_at: expiresAt,
  });
}

async function exchangeCode(code: string, verifier: string, cfg: ReturnType<typeof config>) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUrl,
    client_id: cfg.clientId,
    code_verifier: verifier,
  });

  const basic = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  const response = await fetch(FACEIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        `FACEIT token exchange failed (${response.status}).`,
    );
  }

  return payload;
}

async function fetchUserInfo(accessToken: string) {
  const response = await fetch(FACEIT_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    throw new Error(`FACEIT userinfo failed (${response.status}).`);
  }

  return payload;
}

async function faceitData(path: string, apiKey: string) {
  const response = await fetch(`${FACEIT_DATA_API}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message ||
        payload?.message ||
        `FACEIT Data API failed (${response.status}).`,
    );
  }

  return payload;
}

async function callback(req: Request) {
  const cfg = config();
  const url = new URL(req.url);
  const state = String(url.searchParams.get("state") ?? "");
  const code = String(url.searchParams.get("code") ?? "");
  const oauthError = String(url.searchParams.get("error") ?? "");

  if (!state) {
    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: "missing_state",
    });
  }

  const db = supabaseAdmin();
  const { data: session, error: lookupError } = await db
    .from("faceit_extension_auth_sessions")
    .select("*")
    .eq("oauth_state", state)
    .maybeSingle();

  if (lookupError || !session) {
    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: "invalid_state",
    });
  }

  if (Date.parse(session.expires_at) <= Date.now()) {
    await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "expired",
        last_error: "OAuth login expired before callback.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: "expired",
    });
  }

  if (oauthError) {
    await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "error",
        last_error: oauthError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: oauthError,
    });
  }

  if (!code || !cfg.clientId || !cfg.clientSecret) {
    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: "oauth_not_configured",
    });
  }

  try {
    const token = await exchangeCode(code, session.code_verifier, cfg);
    const userInfo = await fetchUserInfo(token.access_token);
    const faceitUserId = String(userInfo?.sub ?? "").trim();

    if (!faceitUserId) {
      throw new Error("FACEIT userinfo did not include a subject.");
    }

    let publicPlayer: any = null;
    try {
      publicPlayer = await faceitData(
        `/players/${encodeURIComponent(faceitUserId)}`,
        cfg.dataApiKey,
      );
    } catch {
      publicPlayer = null;
    }

    const nickname = String(
      publicPlayer?.nickname ||
        userInfo?.nickname ||
        userInfo?.preferred_username ||
        userInfo?.given_name ||
        "",
    ).trim();
    const picture = String(
      publicPlayer?.avatar ||
        userInfo?.picture ||
        "",
    ).trim();
    const locale = String(userInfo?.locale || "").trim();
    const now = new Date();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

    const { error: updateError } = await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "authenticated",
        faceit_user_id: faceitUserId,
        faceit_nickname: nickname || null,
        faceit_picture: picture || null,
        faceit_locale: locale || null,
        session_expires_at: sessionExpiresAt,
        authenticated_at: now.toISOString(),
        updated_at: now.toISOString(),
        last_error: null,
      })
      .eq("id", session.id)
      .eq("oauth_state", state);

    if (updateError) throw updateError;

    return successRedirect(cfg.successUrl, {
      faceit_extension: "connected",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "error",
        last_error: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    console.error("FACEIT OAuth callback failed:", message);

    return successRedirect(cfg.successUrl, {
      faceit_extension: "error",
      reason: "callback_failed",
    });
  }
}

async function verifyClaim(loginId: string, claimSecret: string) {
  if (!loginId || !claimSecret) return null;

  const claimHash = await sha256(claimSecret);
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("faceit_extension_auth_sessions")
    .select("*")
    .eq("id", loginId)
    .eq("claim_secret_hash", claimHash)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function loginStatus(req: Request) {
  const body = await req.json().catch(() => ({}));
  const loginId = String(body?.login_id ?? "").trim();
  const claimSecret = String(body?.claim_secret ?? "").trim();
  const session = await verifyClaim(loginId, claimSecret);

  if (!session) {
    return json({ ok: false, error: "INVALID_LOGIN_SESSION" }, 401);
  }

  if (Date.parse(session.expires_at) <= Date.now() && session.status === "pending") {
    const db = supabaseAdmin();
    await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return json({
      ok: true,
      status: "expired",
    });
  }

  if (
    session.status === "authenticated" &&
    session.session_expires_at &&
    Date.parse(session.session_expires_at) > Date.now()
  ) {
    return json({
      ok: true,
      status: "authenticated",
      session_token: claimSecret,
      session_expires_at: session.session_expires_at,
      user: {
        id: session.faceit_user_id,
        nickname: session.faceit_nickname,
        picture: session.faceit_picture,
        locale: session.faceit_locale,
      },
    });
  }

  return json({
    ok: true,
    status: session.status,
    error: session.last_error || null,
  });
}

async function bearerSession(req: Request) {
  const authorization = String(req.headers.get("Authorization") ?? "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) return null;

  const hash = await sha256(token);
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("faceit_extension_auth_sessions")
    .select("*")
    .eq("claim_secret_hash", hash)
    .eq("status", "authenticated")
    .maybeSingle();

  if (error || !data || !data.session_expires_at) return null;

  if (Date.parse(data.session_expires_at) <= Date.now()) {
    await db
      .from("faceit_extension_auth_sessions")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    return null;
  }

  await db
    .from("faceit_extension_auth_sessions")
    .update({
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return data;
}

async function playerBundle(nickname: string, apiKey: string) {
  const player = await faceitData(
    `/players?nickname=${encodeURIComponent(nickname)}&game=cs2`,
    apiKey,
  );
  const playerId = String(player?.player_id ?? "").trim();

  if (!playerId) throw new Error("FACEIT player not found.");

  const results = await Promise.allSettled([
    faceitData(`/players/${encodeURIComponent(playerId)}/stats/cs2`, apiKey),
    faceitData(
      `/players/${encodeURIComponent(playerId)}/games/cs2/stats?offset=0&limit=20`,
      apiKey,
    ),
    faceitData(
      `/players/${encodeURIComponent(playerId)}/history?game=cs2&offset=0&limit=20`,
      apiKey,
    ),
  ]);

  return {
    player,
    stats: results[0].status === "fulfilled" ? results[0].value : null,
    recent: results[1].status === "fulfilled" ? results[1].value : null,
    history: results[2].status === "fulfilled" ? results[2].value : null,
    partialErrors: results
      .filter((result) => result.status === "rejected")
      .map((result: any) =>
        String(result.reason?.message || result.reason || "FACEIT API error")
      ),
  };
}

async function me(req: Request) {
  const session = await bearerSession(req);
  if (!session) return json({ ok: false, error: "AUTH_REQUIRED" }, 401);

  return json({
    ok: true,
    user: {
      id: session.faceit_user_id,
      nickname: session.faceit_nickname,
      picture: session.faceit_picture,
      locale: session.faceit_locale,
    },
    expires_at: session.session_expires_at,
  });
}

async function data(req: Request) {
  const session = await bearerSession(req);
  if (!session) return json({ ok: false, error: "AUTH_REQUIRED" }, 401);

  const cfg = config();
  if (!cfg.dataApiKey) {
    return json({ ok: false, error: "FACEIT_DATA_API_NOT_CONFIGURED" }, 503);
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "player-bundle");

  if (action !== "player-bundle") {
    return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  }

  const nickname = String(
    body?.nickname || session.faceit_nickname || "",
  ).trim();

  if (!nickname) {
    return json({ ok: false, error: "NICKNAME_REQUIRED" }, 400);
  }

  try {
    const bundle = await playerBundle(nickname, cfg.dataApiKey);
    return json({ ok: true, data: bundle });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "FACEIT_DATA_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
}


function health() {
  const cfg = config();

  return json({
    ok: true,
    service: "faceit-extension-auth",
    oauth_configured: Boolean(
      cfg.clientId &&
      cfg.clientSecret &&
      cfg.redirectUrl
    ),
    data_api_configured: Boolean(
      cfg.dataApiKey
    ),
    redirect_url: cfg.redirectUrl,
  });
}

async function logout(req: Request) {
  const authorization = String(req.headers.get("Authorization") ?? "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) return json({ ok: true });

  const hash = await sha256(token);
  const db = supabaseAdmin();
  await db
    .from("faceit_extension_auth_sessions")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("claim_secret_hash", hash);

  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const pathname = new URL(req.url).pathname;
    const route = pathname.split("/").filter(Boolean).pop() || "";

    if (route === "health" && req.method === "GET") return health();
    if (route === "start" && req.method === "POST") return await startLogin();
    if (route === "callback" && req.method === "GET") return await callback(req);
    if (route === "status" && req.method === "POST") return await loginStatus(req);
    if (route === "me" && req.method === "GET") return await me(req);
    if (route === "data" && req.method === "POST") return await data(req);
    if (route === "logout" && req.method === "POST") return await logout(req);

    return json({ ok: false, error: "NOT_FOUND" }, 404);
  } catch (error) {
    console.error("FACEIT extension auth error:", error);
    return json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
