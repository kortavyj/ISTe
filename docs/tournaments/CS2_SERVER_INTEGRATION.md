# ISTe CS2 server connection — integration contract (beta)

Status: **WEBHOOK IMPLEMENTED, REAL MATCHZY SERVER NOT CONNECTED**. This branch provides a POST ingestion endpoint, signed-event validation, allowlisted server IDs, match assignment and persistent replay/ordering checks. It does **not** provide a MatchZy/CounterStrikeSharp adapter, self-service pairing, realtime public statistics, or automatic match completion.

## Intended MatchZy / CounterStrikeSharp flow

1. Tournament organizer installs supported MatchZy and ISTe adapter on a CS2 server with plugin access.
2. Owner assigns an allowlisted server UUID to a scheduled match through the MFA-protected assignment API (implemented; self-service pairing is not).
3. Deployment stores a shared webhook secret on the server (implemented via environment variable); per-server keys, rotation and revocation are not implemented.
4. A future adapter sends authenticated POST events to `/api/cs2-ingest` (endpoint implemented; adapter not implemented).
5. The endpoint validates raw-body HMAC, timestamp, event envelope and server allowlist. A service-role RPC checks match assignment, event ordering and duplicate identities before persisting (implemented).
6. Website subscribes to a reduced public match-state stream (not implemented).
7. Final game score undergoes state validation and applicable verification before bracket advancement (not implemented; ingested events do not automatically advance brackets).


## Implemented HTTP boundary (beta)

- Route: `POST /api/cs2-ingest`. Other methods return 405.
- Body: raw JSON bytes, maximum 64 KiB. The signature must cover the exact bytes sent, including whitespace and encoding.
- Deployment environment variables: `ISTE_CS2_WEBHOOK_SECRET` (at least 32 characters), `ISTE_CS2_ALLOWED_SERVER_IDS` (comma-separated UUID allowlist), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Do not put these values in public Vite variables or client bundles.
- A successful, authorized and persisted event returns HTTP 202. This means **accepted for storage**, not that a match result has been verified or a bracket advanced.
- Bad or expired signature returns 401; an unallowlisted server returns 403. Replay/out-of-order and cross-server events return 409 where classified by the handler. Invalid events are rejected.
- Assignment must exist in `public.tournament_cs2_assignments`; ingestion uses `public.iste_ingest_cs2_event`. RLS and SQL constraints complement, but do not replace, network controls.
- Current design uses a **shared** webhook HMAC key and explicit server allowlist. It is not yet suitable for arbitrary third-party servers: secure pairing, per-server credentials, revocation, audit of delivery, and infrastructure rate limiting remain release blockers.
- Integration tests cover signature tampering, event envelope, unassigned server and replay/order behavior in a disposable database. They do **not** demonstrate compatibility with a real MatchZy plugin or real CS2 server.

## Signed envelope v1

Required event object:

```json
{
  "version": 1,
  "eventId": "serverevent-000001",
  "serverId": "123e4567-e89b-12d3-a456-426614174000",
  "matchId": "123e4567-e89b-12d3-a456-426614174001",
  "sequence": 1,
  "type": "round_end",
  "payload": {"roundNumber": 1, "scoreA": 1, "scoreB": 0}
}
```

Allowed types: heartbeat, map_started, round_end, map_end, series_end.

Headers:
- `X-ISTe-Timestamp`: Unix epoch time in **milliseconds**, exactly 13 digits.
- `X-ISTe-Signature`: `sha256=<lowercase-64-hex-digits>`.

Signature: HMAC-SHA256(secret, timestamp + "." + raw UTF-8 request body). Compute over raw bytes as sent, not re-serialized JSON. Comparison must be constant time; accepted timestamps must be within 60 seconds of server receipt. Size limit 64 KiB.

Signature verification **does not** prove that the server owner is honest.

## Still required before production server integration is enabled

- Persistent server registration and secret rotation/revocation; never expose keys in the browser.
- Secure transport (HTTPS), authenticated admin pairing and per-server scoped key lookup.
- Confirm the implemented database uniqueness and monotonic sequencing under real network retries, restart and failover.
- Match assignment and roster SteamID verification.
- Cross-check maps, BO series length, full match state and completion status.
- Retry-safe background delivery with audit, queue and stale heartbeat detection.
- No auto-advancement on incomplete, unverified or contradictory events.
- Real dedicated CS2 test server with CounterStrikeSharp/MatchZy and fixtures for disconnects, map overtime, remakes and forfeit.
- Owner approval of deployment/credentials and staging database testing.

## Without plugin

Captains send manual evidence and submit results; captain-counterparty or authorized judge verification must be implemented before the public release. IP address alone is not a source of automatic CS2 round scores or player stats.

## Tested building blocks

`server/tournaments/serverEventSecurity.js` validates HMAC headers and event shape. `api/cs2-ingest.js` receives the raw request bytes and delegates to `server/tournaments/cs2Ingest.js`. `db/migrations/20261011_cs2_event_replay.sql` supplies the tables and restricted RPCs. The isolated CI suite includes signed-event unit tests, endpoint tests and PostgreSQL replay/assignment tests. Production connectivity remains unverified.
