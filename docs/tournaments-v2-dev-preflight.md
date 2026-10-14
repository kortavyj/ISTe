# ISTe Tournaments V2 — existing DEV environment preflight

Target test project (never production): `jwzsawumiadlfxarvauc` (`kortavyj's Project`, eu-west-2).

## Read-only findings (14 Oct 2026)
- Already contains an independent CS2 tournament beta system: `tournaments`, `tournament_teams`, `tournament_matches`, registrations, audit, and functions. **Never drop, truncate, overwrite, or rename these.**
- `public.user_roles` exposes `user_id uuid`, `role text`, `is_blocked boolean`, `blocked_reason text`, compatible by name with the planned V2 RPC.
- No `iste_tournament*` tables or `iste_owner_create_tournament` function were found.
- Existing public schema has Auth users and application data; project must not be treated as disposable.
- **No changes were made during preflight.**

## Safe sequence before applying migrations
1. **Take and verify an independent backup of this DEV database, including existing schema and data.** Do not rely on the production ISTe backup workflow; it backs up a different project.
2. Review table, function, index, policy name collisions and permissions, including `security definer` function owner.
3. Execute `docs/sql/tournaments-v2-dev-preflight.sql` in read-only mode and preserve the results. Stop if name collisions appear.
4. Validate project-specific `user_roles` permissions for SQL owner RPC and actual Supabase Auth/AAL2 claims.
5. Apply only versioned V2 migrations to **DEV**, after explicit approval; never copy production data or credentials into test fixtures.
6. Verify RLS using real `anon` and `authenticated` Supabase clients and owner MFA AAL2; keep all secrets server-side.
7. Test draft creation, error cases, audit records and transaction rollback. Only then consider API flag activation for the **DEV deployment**, not production.

## Release V1 behavior
Initial release supports **manual** BO1/BO3/BO5 results: edits remain tentative until owner confirmation; confirmations and later corrections must be audited and version-checked. No live CS2 server integration required.

**This PR does not create a backup or run migrations.**
