import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_EVENT_AGE_MS = 60_000;
export const MAX_RAW_BODY_BYTES = 64 * 1024;

export function verifyCs2EventSignature({ rawBody, timestamp, signature, secret, now = Date.now() }) {
  if (!(typeof rawBody === "string" || Buffer.isBuffer(rawBody)) || Buffer.byteLength(rawBody) > MAX_RAW_BODY_BYTES
    || rawBody.length === 0 || typeof secret !== "string" || secret.length < 32) return false;
  if (typeof timestamp !== "string" || !/^\d{13}$/.test(timestamp)) return false;
  const millis = Number(timestamp);
  if (!Number.isSafeInteger(millis) || Math.abs(now - millis) > MAX_EVENT_AGE_MS) return false;
  if (typeof signature !== "string" || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + rawBody, "utf8").digest();
  const supplied = Buffer.from(signature.slice(7), "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

export function validateCs2Event(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  if (data.version !== 1 || typeof data.eventId !== "string" || !/^[a-zA-Z0-9-]{12,100}$/.test(data.eventId)) return false;
  if (typeof data.serverId !== "string" || !/^[a-f0-9-]{36}$/i.test(data.serverId)) return false;
  if (typeof data.matchId !== "string" || !/^[a-f0-9-]{36}$/i.test(data.matchId)) return false;
  if (!Number.isSafeInteger(data.sequence) || data.sequence < 1) return false;
  if (!["heartbeat", "map_started", "round_end", "map_end", "series_end"].includes(data.type)) return false;
  return data.payload !== null && typeof data.payload === "object"
    && !Array.isArray(data.payload) && JSON.stringify(data.payload).length <= 16_000;
}

export function isNextCs2Event(previous, incoming) {
 if (!validateCs2Event(incoming)) return false;
 if (!previous) return incoming.sequence === 1;
 if (previous.serverId !== incoming.serverId || previous.matchId !== incoming.matchId) return false;
 return Number.isSafeInteger(previous.sequence) && incoming.sequence === previous.sequence + 1 && previous.eventId !== incoming.eventId;
}
