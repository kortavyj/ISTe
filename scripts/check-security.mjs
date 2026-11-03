import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guardRequest } from "../server/apiLib/requestGuard.js";

const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const universal = config.headers.find(row => row.source === "/(.*)");
assert.ok(universal, "Global security headers must exist");
const headers = new Map(universal.headers.map(row => [row.key.toLowerCase(), row.value]));
assert.equal(headers.get("x-content-type-options"), "nosniff");
assert.equal(headers.get("x-frame-options"), "DENY");
assert.ok(headers.get("strict-transport-security")?.includes("max-age=15552000"));
assert.ok(headers.get("content-security-policy")?.includes("frame-ancestors 'none'"));
assert.ok(headers.get("content-security-policy")?.includes("object-src 'none'"));
assert.ok(headers.get("content-security-policy")?.includes("base-uri 'self'"));
assert.ok(headers.get("content-security-policy")?.includes("form-action 'self'"));

const cookies = readFileSync(new URL("../server/apiLib/authCookies.js", import.meta.url), "utf8");
for (const fragment of ["__Host-iste_access", "__Host-iste_refresh", '"HttpOnly"', '"Secure"', '"SameSite=Lax"', '"Path=/"']) {
  assert.ok(cookies.includes(fragment), `Missing auth cookie protection: ${fragment}`);
}

const browserClient = readFileSync(new URL("../src/lib/supabase.js", import.meta.url), "utf8");
assert.ok(browserClient.includes("VITE_SUPABASE_PUBLISHABLE_KEY"));
assert.ok(!/VITE_SUPABASE_(?:SECRET|SERVICE_ROLE)_KEY/.test(browserClient), "Do not expose privileged Supabase keys");

const trusted = {
  method: "POST",
  headers: {
    "host": "www.istesport.com",
    "origin": "https://www.istesport.com",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
  },
  body: { hello: "world" },
};
assert.equal(guardRequest(trusted).ok, true);
assert.equal(guardRequest({ ...trusted, headers: { ...trusted.headers, origin: "https://attacker.example" } }).status, 403);
assert.equal(guardRequest({ ...trusted, headers: { ...trusted.headers, "sec-fetch-site": "cross-site" } }).status, 403);
assert.equal(guardRequest({ ...trusted, headers: { ...trusted.headers, host: "attacker.example" } }).status, 403);
assert.equal(guardRequest({ ...trusted, headers: { ...trusted.headers, origin: "https://www.istesport.com/unsafe" } }).status, 403);
assert.equal(guardRequest({ ...trusted, body: { value: "x".repeat(17_000) } }).status, 413);
assert.equal(guardRequest({ ...trusted, headers: { ...trusted.headers, "content-type": "text/plain" } }).status, 415);

console.log("Security regression checks passed.");
