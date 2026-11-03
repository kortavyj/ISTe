import { createHash } from "node:crypto";

const PWNED_PASSWORDS_ORIGIN = "https://api.pwnedpasswords.com";
const MAX_RESPONSE_LENGTH = 200_000;

export async function checkExposedPassword(password, fetchImpl = fetch) {
  if (typeof password !== "string" || password.length === 0 || password.length > 128) {
    throw new Error("INVALID_PASSWORD");
  }
  // SHA-1 is used only as the public breach-database lookup format,
  // never to store or authenticate the user's password.
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetchImpl(`${PWNED_PASSWORDS_ORIGIN}/range/${prefix}`, {
    method: "GET",
    headers: {
      "User-Agent": "ISTe-Website-Password-Safety/1.0",
      "Add-Padding": "true",
      Accept: "text/plain",
    },
    signal: AbortSignal.timeout(3500),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("PASSWORD_CHECK_UNAVAILABLE");
  const text = await response.text();
  if (text.length > MAX_RESPONSE_LENGTH) throw new Error("PASSWORD_CHECK_INVALID_RESPONSE");

  for (const row of text.split(/\r?\n/)) {
    const separator = row.indexOf(":");
    if (separator < 0) continue;
    const candidate = row.slice(0, separator).trim().toUpperCase();
    const count = Number(row.slice(separator + 1).trim());
    if (candidate === suffix && Number.isFinite(count) && count > 0) {
      return { exposed: true };
    }
  }
  return { exposed: false };
}
