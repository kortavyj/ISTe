#!/usr/bin/env node
// Local/CI beta readiness check. No network calls and no secret values printed.
// This is not a substitute for creating and independently verifying a staging database.
import { createHash } from "node:crypto";

const PRODUCTION_REF = "niwgrrprbcgbdaloijhq";
function projectRef(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) return null;
    const match = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
    return match?.[1] || null;
  } catch { return null; }
}
export function validateBetaEnv(env) {
  const issues = [];
  const frontendRef = projectRef(env.VITE_SUPABASE_URL || "");
  const backendRef = projectRef(env.SUPABASE_URL || "");
  const expectedRef = env.CS2_STAGING_PROJECT_REF || "";
  if (env.CS2_ISOLATED_STAGING !== "yes") issues.push("STAGING_OPT_IN_REQUIRED");
  if (!frontendRef || !backendRef || !expectedRef) issues.push("SUPABASE_STAGING_URLS_REQUIRED");
  if (frontendRef === PRODUCTION_REF || backendRef === PRODUCTION_REF || expectedRef === PRODUCTION_REF)
    issues.push("PRODUCTION_PROJECT_FORBIDDEN");
  if (frontendRef && backendRef && expectedRef && (frontendRef !== backendRef || backendRef !== expectedRef))
    issues.push("FRONTEND_BACKEND_PROJECT_MISMATCH");
  if (!(env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim()) issues.push("FRONTEND_PUBLISHABLE_KEY_MISSING");
  if (!(env.SUPABASE_PUBLISHABLE_KEY || "").trim()) issues.push("SERVER_PUBLISHABLE_KEY_MISSING");
  const raw = env.ISTE_CS2_ROOM_ENCRYPTION_KEY || "";
  let decoded = Buffer.alloc(0);
  try { decoded = Buffer.from(raw, "base64"); } catch { /* invalid */ }
  if (decoded.length !== 32 || decoded.toString("base64") !== raw) issues.push("ROOM_ENCRYPTION_KEY_INVALID");
  return issues;
}
if (process.argv.includes("--self-test")) {
  const good = {
    CS2_ISOLATED_STAGING:"yes",
    CS2_STAGING_PROJECT_REF:"abcdefghijklmnopqrst",
    VITE_SUPABASE_URL:"https://abcdefghijklmnopqrst.supabase.co/",
    SUPABASE_URL:"https://abcdefghijklmnopqrst.supabase.co/",
    VITE_SUPABASE_PUBLISHABLE_KEY:"ci-placeholder",
    SUPABASE_PUBLISHABLE_KEY:"ci-placeholder",
    ISTE_CS2_ROOM_ENCRYPTION_KEY:Buffer.alloc(32,7).toString("base64"),
  };
  function assert(condition) { if (!condition) throw new Error("BETA_ENV_SELF_TEST_FAILED"); }
  assert(validateBetaEnv(good).length===0);
  assert(validateBetaEnv({...good,SUPABASE_URL:"https://niwgrrprbcgbdaloijhq.supabase.co/"}).includes("PRODUCTION_PROJECT_FORBIDDEN"));
  assert(validateBetaEnv({...good,ISTE_CS2_ROOM_ENCRYPTION_KEY:"invalid"}).includes("ROOM_ENCRYPTION_KEY_INVALID"));
  assert(validateBetaEnv({...good,CS2_ISOLATED_STAGING:"no"}).includes("STAGING_OPT_IN_REQUIRED"));
  console.log("CS2 beta environment self-test passed.");
} else {
  const issues=validateBetaEnv(process.env);
  if (issues.length) { console.error("CS2 beta environment NOT READY:",issues.join(", ")); process.exitCode=1; }
  else console.log("CS2 beta environment configuration validated (local checks only).");
}
