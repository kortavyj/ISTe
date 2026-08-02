const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

function getHeader(request, name) {
  const value = request.headers?.[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === "string" ? value : "";
}

function normalizeOrigin(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeHost(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function getAllowedOrigins() {
  const candidates = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null,
  ];

  return new Set(
    candidates
      .map(normalizeOrigin)
      .filter(Boolean),
  );
}

function getSourceOrigin(request) {
  const origin = normalizeOrigin(getHeader(request, "origin"));

  if (origin) {
    return origin;
  }

  const referer = getHeader(request, "referer");

  return normalizeOrigin(referer);
}

export function guardRequest(
  request,
  {
    methods = ["POST"],
    requireJson = true,
    requireOrigin = true,
    maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  } = {},
) {
  const method = String(request.method || "").toUpperCase();
  const allowedMethods = methods.map((item) => item.toUpperCase());

  if (!allowedMethods.includes(method)) {
    return {
      ok: false,
      status: 405,
      error: "METHOD_NOT_ALLOWED",
      allow: allowedMethods.join(", "),
    };
  }

  const contentLength = Number(
    getHeader(request, "content-length") || 0,
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > maxBodyBytes
  ) {
    return {
      ok: false,
      status: 413,
      error: "REQUEST_TOO_LARGE",
    };
  }

  if (requireJson) {
    const contentType = getHeader(
      request,
      "content-type",
    ).toLowerCase();

    if (!contentType.startsWith("application/json")) {
      return {
        ok: false,
        status: 415,
        error: "JSON_REQUIRED",
      };
    }
  }

  const sourceOrigin = getSourceOrigin(request);
  const allowedOrigins = getAllowedOrigins();

  if (requireOrigin && !sourceOrigin) {
    return {
      ok: false,
      status: 403,
      error: "ORIGIN_MISSING",
    };
  }

  if (
    sourceOrigin &&
    !allowedOrigins.has(sourceOrigin)
  ) {
    return {
      ok: false,
      status: 403,
      error: "ORIGIN_NOT_ALLOWED",
    };
  }

  const fetchSite = getHeader(
    request,
    "sec-fetch-site",
  ).toLowerCase();

  if (fetchSite && fetchSite !== "same-origin") {
    return {
      ok: false,
      status: 403,
      error: "CROSS_SITE_REQUEST_BLOCKED",
    };
  }

  const forwardedHost = normalizeHost(
    getHeader(request, "x-forwarded-host"),
  );

  const requestHost =
    forwardedHost ||
    normalizeHost(getHeader(request, "host"));

  if (sourceOrigin && requestHost) {
    const sourceHost = normalizeHost(
      new URL(sourceOrigin).host,
    );

    if (sourceHost !== requestHost) {
      return {
        ok: false,
        status: 403,
        error: "HOST_MISMATCH",
      };
    }
  }

  return {
    ok: true,
    method,
    origin: sourceOrigin,
    host: requestHost,
  };
}
