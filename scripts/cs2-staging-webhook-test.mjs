#!/usr/bin/env node
// Manual STAGING-only webhook diagnostic. This script never runs automatically in CI.
import { createHmac, randomUUID } from "node:crypto";

const endpoint = process.env.ISTE_CS2_TEST_ENDPOINT;
const secret = process.env.ISTE_CS2_WEBHOOK_SECRET;
const serverId = process.env.ISTE_CS2_TEST_SERVER_ID;
const matchId = process.env.ISTE_CS2_TEST_MATCH_ID;
const sequence = Number(process.env.ISTE_CS2_TEST_SEQUENCE || "1");
const isUuid = (value) => typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);

if (!endpoint || !secret || secret.length < 32 || !isUuid(serverId) || !isUuid(matchId) ||
    !Number.isSafeInteger(sequence) || sequence < 1) {
  console.error("Missing or invalid staging configuration: ISTE_CS2_TEST_ENDPOINT, ISTE_CS2_WEBHOOK_SECRET (>=32 chars), ISTE_CS2_TEST_SERVER_ID, ISTE_CS2_TEST_MATCH_ID, ISTE_CS2_TEST_SEQUENCE.");
  process.exitCode = 2;
} else {
  let url;
  try { url = new URL(endpoint); } catch { /* invalid URL */ }
  if (!url || url.protocol !== "https:" || url.pathname !== "/api/cs2-ingest" ||
      !["localhost", "127.0.0.1"].includes(url.hostname) && !process.env.ISTE_CS2_ALLOW_REMOTE_STAGING) {
    console.error("Use a verified HTTPS staging endpoint ending /api/cs2-ingest; set ISTE_CS2_ALLOW_REMOTE_STAGING=1 for a remote staging host.");
    process.exitCode = 2;
  } else {
    const event = {
      version: 1,
      eventId: "diagnostic-" + randomUUID(),
      serverId,
      matchId,
      sequence,
      type: "heartbeat",
      payload: { source: "iste-manual-staging-test" },
    };
    const body = Buffer.from(JSON.stringify(event), "utf8");
    const timestamp = String(Date.now());
    const signature = "sha256=" + createHmac("sha256", secret)
      .update(timestamp + ".").update(body).digest("hex");
    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          "X-ISTe-Timestamp": timestamp,
          "X-ISTe-Signature": signature,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      const result = await response.text();
      console.log("HTTP", response.status, result.slice(0, 1000));
      if (response.status !== 202) process.exitCode = 1;
    } catch (error) {
      console.error("Diagnostic request failed:", error.message);
      process.exitCode = 1;
    }
  }
}
