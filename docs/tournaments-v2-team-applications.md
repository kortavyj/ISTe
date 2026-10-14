# Tournaments V2 — staged player team application API

New `POST /api/tournaments-team-apply` runs using the authenticated user's HttpOnly cookie session. It **does not trust client-supplied captain IDs**. The actual captain is derived from Supabase Auth and must be represented exactly once in a 5–7-player roster.

- Enforces same-origin JSON requests and 8 KiB request size cap.
- Checks session and account blocked flag.
- Only allows `tournamentId`, `name`, `members` in external POST data.
- Runs strict roster validation and invokes `iste_apply_tournament_team(p_application)` only after `ISTE_TOURNAMENT_WRITES_ENABLED=true`.
- Write flag must remain unset. This migration/RPC **is not implemented** in this PR. No fallback INSERT or service-role connection exists.
- The SQL RPC must re-verify `auth.uid()` captain, membership and team uniqueness, competition status/registration window, capacity, rate limits and privileges and write audit records in a serializable/locked transaction. Team creation must not assign `approved` on request.
- A separate owner-only approval/rejection RPC and UI will be needed before bracket formation.
- Verify the workflow/limits on Vercel Hobby before merging: the route adds one serverless function.
- No DEV/production schema modifications or live registrations are enabled.
