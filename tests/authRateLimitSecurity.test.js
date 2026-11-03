import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateLoginRateLimit,
  getClientAddress,
  getLoginRateLimitBuckets,
} from "../server/lib/authSecurity.js";

function withEnv(name, value, fn) {
  const old = process.env[name];
  try {
    if (value === null) delete process.env[name];
    else process.env[name] = value;
    return fn();
  } finally {
    if (old === undefined) delete process.env[name];
    else process.env[name] = old;
  }
}

function loginContext(ip, email = "Owner@Example.com") {
  return withEnv("AUTH_RATE_LIMIT_SECRET", "security-regression-secret-with-more-than-32-characters", () =>
    withEnv("VERCEL", "1", () => getLoginRateLimitBuckets({
      headers: { "x-vercel-forwarded-for": ip },
    }, email)));
}

test("canonical Vercel IP ignores generic client-supplied forwarding headers", () => {
  withEnv("VERCEL", "1", () => {
    assert.equal(getClientAddress({ headers: {
      "x-vercel-forwarded-for": "203.0.113.4",
      "x-forwarded-for": "198.51.100.2",
      "x-real-ip": "198.51.100.3",
    }}), "203.0.113.4");
    assert.equal(getClientAddress({ headers: {
      "x-forwarded-for": "198.51.100.2",
      "x-real-ip": "198.51.100.3",
    }}), "unknown");
  });
});

test("different IPs share the same account bucket", () => {
  const first = loginContext("203.0.113.1");
  const second = loginContext("198.51.100.7", "owner@example.com");
  assert.equal(first.identityBucket, second.identityBucket);
  assert.notEqual(first.clientBucket, second.clientBucket);
  assert.notEqual(first.pairBucket, second.pairBucket);
});

test("all three quotas are consumed with their configured limits", async () => {
  const context = loginContext("203.0.113.1");
  const calls = [];
  const result = await evaluateLoginRateLimit(context, async (...args) => {
    calls.push(args);
    return { allowed: true, retryAfterSeconds: 0 };
  });
  assert.equal(result.allowed, true);
  assert.deepEqual(calls, [
    [context.pairBucket, 8, 900, 900],
    [context.clientBucket, 30, 900, 1800],
    [context.identityBucket, 20, 900, 900],
  ]);
});

test("account denial blocks rotating IPs and preserves retry-after", async () => {
  const first = loginContext("203.0.113.1");
  const rotated = loginContext("198.51.100.7");
  const consumed = [];
  const consume = async bucket => {
    consumed.push(bucket);
    return bucket === first.identityBucket
      ? { allowed: false, retryAfterSeconds: 675 }
      : { allowed: true, retryAfterSeconds: 0 };
  };
  const a = await evaluateLoginRateLimit(first, consume);
  const b = await evaluateLoginRateLimit(rotated, consume);
  assert.equal(a.allowed, false);
  assert.equal(b.allowed, false);
  assert.equal(a.retryAfterSeconds, 675);
  assert.equal(b.retryAfterSeconds, 675);
  assert.equal(consumed.filter(x => x === first.identityBucket).length, 2);
});

test("pair or client refusal also denies access", async () => {
  const context = loginContext("203.0.113.1");
  for (const blocked of [context.pairBucket, context.clientBucket]) {
    const result = await evaluateLoginRateLimit(context, async bucket =>
      bucket === blocked
        ? { allowed: false, retryAfterSeconds: 45 }
        : { allowed: true, retryAfterSeconds: 0 });
    assert.equal(result.allowed, false);
    assert.equal(result.retryAfterSeconds, 45);
  }
});

test("rate limiter database failure is not silently treated as allow", async () => {
  const context = loginContext("203.0.113.1");
  await assert.rejects(
    evaluateLoginRateLimit(context, async () => {
      throw new Error("database unavailable");
    }),
    /database unavailable/,
  );
});
