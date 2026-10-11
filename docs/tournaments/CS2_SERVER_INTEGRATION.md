# ISTe CS2 server connection — integration contract (beta)

Status: **NOT CONNECTED**. The current branch contains signature and event-envelope validators; it does not yet offer an ingestion endpoint, server pairing, MatchZy plugin, realtime statistics, or any automated match completion.

## Intended MatchZy / CounterStrikeSharp flow

1. Tournament organizer installs supported MatchZy and ISTe adapter on a CS2 server with plugin access.
2. Owner pairs server via short-lived, single-use pairing challenge (not implemented).
3. Site stores one server-scoped key in restricted storage (not implemented).
4. Adapter sends authenticated events to an ingestion endpoint (not implemented).
5. Events are checked, deduplicated, persisted and assigned to the correct ISTe match (not implemented).
6. Website subscribes to a reduced public match-state stream (not implemented).
7. Final game score undergoes state validation and applicable verification before bracket advancement (not implemented).

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

## Still required before a network endpoint is enabled

- Persistent server registration and secret rotation/revocation; never expose keys in the browser.
- Secure transport (HTTPS), authenticated admin pairing and per-server scoped key lookup.
- Database event ID unique constraint and strictly monotonic sequence to reject replay/reorder.
- Match assignment and roster SteamID verification.
- Cross-check maps, BO series length, full match state and completion status.
- Retry-safe background delivery with audit, queue and stale heartbeat detection.
- No auto-advancement on incomplete, unverified or contradictory events.
- Real dedicated CS2 test server with CounterStrikeSharp/MatchZy and fixtures for disconnects, map overtime, remakes and forfeit.
- Owner approval of deployment/credentials and staging database testing.

## Without plugin

Captains send manual evidence and submit results; captain-counterparty or authorized judge verification must be implemented before the public release. IP address alone is not a source of automatic CS2 round scores or player stats.

## Tested building blocks

`server/tournaments/serverEventSecurity.js` validates HMAC headers and event shape. `tests/tournament-server-events.test.js` covers valid, tampered, expired, weak-secret and invalid-envelope cases. These tests are configured under `npm test` but their run results are tracked separately from Vercel build readiness.
