# ISTe CS2 — WAF rate limiting proposal (NOT DEPLOYED)

Status: **draft for owner approval**. Do not publish or apply these rules without separate explicit production authorization.

## Why
The PostgreSQL transactional counters in `iste_enforce_tournament_limit` roll back when a mutation fails. This does **not** limit requests resulting in HTTP 400/401/403/409, so independent edge-level limiting remains mandatory.

## Candidate single WAF rate-limit rule

- Name: `ISTe CS2 owner writes — IP throttle`
- Match: path prefix `/api/tournament-matches` OR `/api/tournament-action` (if provider supports OR groups for one rate-limit rule)
- HTTP method: `POST`
- Count key: client IP (not a client-provided header)
- Algorithm: fixed window
- Proposed threshold: **30 requests / 60 seconds per IP**
- Exceeded: deny (ideally HTTP 429; confirm actual provider behavior)
- Activate initially only after staging smoke test and explicit approval.
- Beware shared IP addresses: multiple admins behind the same NAT share the cap.
- Vercel routing may rewrite to `/api/owner`; verify WAF matches incoming client path rather than rewritten destination.

## MatchZy webhook needs a separate traffic budget
The `/api/cs2-ingest` webhook sends events including `round_end` and `heartbeat`, so blindly applying the same administrative cap risks event loss. Do **not** apply 30/min to the webhook. Determine event throughput from an actual staging game (including burst peaks) before selecting a separate WAF policy. At present, per-server HMAC, allowlist, match assignment, size bound, timestamp window, and DB sequence/replay protection remain in place.

## Preflight checklist

1. Verify Vercel plan and available rate-limit rule quota **in the project's own billing/security UI**; do not assume pricing or quota based on generic documentation.
2. Read the active/staged Firewall configuration. Earlier read returned `404 Seawall Config not found`; do not assume an empty ruleset without confirming.
3. Confirm that one rule can combine the owner-write paths using OR conditions and method POST.
4. Test on a protected preview/staging deployment, not the current production domain.
5. Verify normal owner write requests under threshold succeed; send controlled burst above threshold and verify blocking before function execution; verify retries resume after window expiry.
6. Confirm webhook path is not affected; run real MatchZy event burst and check no gaps in stored sequence.
7. Capture baseline and post-change request counts, blocked counts, and whether request/billing metrics introduce charges.
8. Prepare rollback (disable/delete only the new rule; restore prior config); get distinct explicit production authorization.
9. After activation, monitor false positives and actual event rates; adjust threshold based on evidence.

## Unresolved pre-production blockers
- Real owner/non-owner/blocked/expired MFA sessions on preview.
- Real MatchZy server -> Vercel -> Supabase event delivery.
- Tested restoration of an independently recoverable database backup into a disposable database.
- Exact WAF plan allowance and capacity verified on current ISTe account.

No rule has been created, staged, published or enabled by this document.
