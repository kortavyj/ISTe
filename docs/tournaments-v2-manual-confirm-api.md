# ISTe Tournaments V2 — manual match confirmation API

The server route `POST /api/tournaments-match-confirm` is staged but **returns 503 by default** until an approved Supabase migration and `ISTE_TOURNAMENT_WRITES_ENABLED=true` enable it.

## Request contract
`{ "matchId": "<uuid>", "expectedVersion": 0, "result": { "bestOf": 3, "maps": [{"name":"Mirage","scoreA":13,"scoreB":8}, ...] } }`

Checks: same-origin JSON POST, max 8 KiB, existing owner-only HttpOnly-cookie session and AAL2 MFA, UUID match ID, nonnegative version, completed manual BO1/3/5 series. Rejects arbitrary extra keys. Does **not** accept caller-provided winner, confirmed flags or tournament ID.

## Required database implementation (NOT included in this PR)
- `iste_owner_confirm_match(p_match_id uuid, p_expected_version int, p_result jsonb)` must be an audited transaction with database-side authenticated owner/AAL2 and blocked-status checks.
- Lock the specific match row (`FOR UPDATE`), validate team ownership/tournament/status, match `version`, BO settings, map choices and scores independently of HTTP.
- Reject stale versions; accept only unconfirmed played results; advance winner to *exactly one* parent slot; forbid overwrites and duplicate confirmations; audit match + progression in the same transaction and bump version.
- Account for byes, completed final, concurrency with bracket generation, and explicit audited correction workflow.
- Test authorization, rollback, racing confirmations, and integration in a separate Supabase environment before configuring any write flag.
- Do not connect UI simulation to this route yet. No existing production DB changes are made.

The endpoint adds one serverless route; prior Hobby fix relocated non-route helper modules outside `api/`.
