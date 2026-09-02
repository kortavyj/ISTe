const ACCESS_COOKIE_NAME = "__Host-iste_access";
const REFRESH_COOKIE_NAME = "__Host-iste_refresh";
const LEGACY_ACCESS_COOKIE_NAME = "iste_access";
const LEGACY_REFRESH_COOKIE_NAME = "iste_refresh";

const DEFAULT_ACCESS_AGE = 60 * 60;
const REFRESH_AGE = 60 * 60 * 24 * 30;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 1) continue;

    const name = part.slice(0, separatorIndex).trim();
    const rawValue = part.slice(separatorIndex + 1).trim();

    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
}

function createCookie(name, value, maxAge) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Priority=High",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ].join("; ");
}

function clearCookie(name) {
  return createCookie(name, "", 0);
}

export function readAuthCookies(request) {
  const cookies = parseCookies(request.headers?.cookie || "");

  return {
    accessToken:
      cookies[ACCESS_COOKIE_NAME] ||
      cookies[LEGACY_ACCESS_COOKIE_NAME] ||
      "",
    refreshToken:
      cookies[REFRESH_COOKIE_NAME] ||
      cookies[LEGACY_REFRESH_COOKIE_NAME] ||
      "",
  };
}

export function setAuthCookies(response, session) {
  const accessToken =
    typeof session?.access_token === "string" ? session.access_token : "";
  const refreshToken =
    typeof session?.refresh_token === "string" ? session.refresh_token : "";

  if (!accessToken || !refreshToken) {
    throw new Error("Authentication session is incomplete.");
  }

  const accessAge =
    Number.isFinite(session.expires_in) && session.expires_in > 0
      ? session.expires_in
      : DEFAULT_ACCESS_AGE;

  response.setHeader("Set-Cookie", [
    createCookie(ACCESS_COOKIE_NAME, accessToken, accessAge),
    createCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_AGE),
    clearCookie(LEGACY_ACCESS_COOKIE_NAME),
    clearCookie(LEGACY_REFRESH_COOKIE_NAME),
  ]);

  response.setHeader("Cache-Control", "no-store, private");
}

export function clearAuthCookies(response) {
  response.setHeader("Set-Cookie", [
    clearCookie(ACCESS_COOKIE_NAME),
    clearCookie(REFRESH_COOKIE_NAME),
    clearCookie(LEGACY_ACCESS_COOKIE_NAME),
    clearCookie(LEGACY_REFRESH_COOKIE_NAME),
  ]);

  response.setHeader("Cache-Control", "no-store, private");
}
