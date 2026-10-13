# ISTe Beta — second Supabase project read-only audit (2026-10-12)

Project: `jwzsawumiadlfxarvauc` (`kortavyj's Project`). Existing organization on **Free** tier.
This audit did not change any database schema or data.

## Verified with read-only Supabase inspection
- Four public tables exist: `user_roles`, `tournaments`, `tournament_teams`, `tournament_matches`.
- They have zero rows; `auth.users` has zero users.
- Five tournament foundation/test migrations are recorded.
- **Missing:** `public.profiles`, `public.tournament_team_applications`, and `public.tournament_match_rooms`. Absence of `profiles` blocks the roster profiles migration.
- Existing zero-row state does not prove the project is abandoned or free of external dependencies; reuse still needs project-owner approval.

## Before any write
1. Obtain explicit authorization to reserve this specific project for ISTe Beta. Do not delete its existing schema.
2. Verify source-of-truth profile schema/trigger/policies from ISTe production *read-only* and design the isolated staging equivalent; do **not** copy production user records or passwords.
3. On a separate test database, rehearse the schema delta, idempotency, auth/RLS and rollback procedure.
4. Run `db/preflight/cs2_beta_dependencies.sql` to fail early if base objects are missing.
5. Apply missing migrations only to the approved isolated project. Set branch-scoped Vercel env vars using its own project URL and publishable key, not the production values.
6. Use newly registered staging-only organizer/captain/player accounts and run the browser test matrix.

This document is a **read-only readiness audit**, not confirmation that the second project has been selected or migrated.
