# Tournaments V2 — owner create endpoint (staged, disabled)

This PR adds **POST /api/tournaments-owner**, but it remains unavailable by default.

## Server-side protections
- Existing ISTe HttpOnly-cookie Supabase session; role exactly `owner`; not blocked; MFA assurance AAL2.
- CSRF controls: same-origin check, JSON content type, 8 KiB request size limit.
- `validateTournamentDraft()` rejects unsupported/privileged fields, validates title, slug, CS2 format, bracket size, BO1/3/5, and UTC schedule timestamps.
- No direct table insert and no service-role fallback. Only `iste_owner_create_tournament(p_draft)` RPC is ever called after **`ISTE_TOURNAMENT_WRITES_ENABLED=true`** is deliberately configured in the server environment.
- The required RPC **does not exist yet**. The handler fails closed and returns 503 until it is separately implemented and approved.
- No database mutation or rollout flag change is part of this PR. **Do not enable the flag yet.**

## Before enabling
1. Inspect live user_roles authorization and claims model.
2. Create and security-review transaction-safe owner-only database RPC, checking `auth.uid()`, `user_roles` blocked status, `auth.jwt()->>'aal' = 'aal2'`, and the authenticated execution context on the database side. Restrict EXECUTE grants.
3. Run role/RLS and request-validation tests on a disposable Supabase-compatible environment; test missing session, user, admin, blocked owner, AAL1, CSRF and malformed inputs.
4. Review and apply the versioned migration through an approved production change after backup/recovery planning.
5. Enable server environment flag only once the above tests pass, then deploy intentionally.

`GET` retains published-only read behavior. The current organizer preview is still demo-only.
