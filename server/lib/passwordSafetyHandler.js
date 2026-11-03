import { guardRequest } from "../apiLib/requestGuard.js";
import { enforcePasswordSafetyRateLimit } from "./authSecurity.js";
import { checkExposedPassword } from "./pwnedPassword.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, private");
  response.setHeader("X-Content-Type-Options", "nosniff");

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 2048,
  });
  if (!guard.ok) {
    if (guard.allow) response.setHeader("Allow", guard.allow);
    return response.status(guard.status).json({ ok: false, error: guard.error });
  }
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ ok: false, error: "INVALID_BODY" });
  }
  const password = body.password;
  if (typeof password !== "string" || password.length < 10 || password.length > 128) {
    return response.status(400).json({ ok: false, error: "INVALID_PASSWORD" });
  }
  try {
    const quota = await enforcePasswordSafetyRateLimit(request);
    if (!quota.allowed) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil(quota.retryAfterSeconds))));
      return response.status(429).json({ ok: false, error: "RATE_LIMITED" });
    }
    const { exposed } = await checkExposedPassword(password);
    return response.status(200).json({ ok: true, exposed });
  } catch {
    return response.status(503).json({ ok: false, error: "PASSWORD_CHECK_UNAVAILABLE" });
  }
}
