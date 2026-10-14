# ISTe Tournaments V2 — Stage 2 migration review

Status: **proposed SQL only; NOT applied to Supabase**.

The first database foundation is at `supabase/migrations/20261014_iste_tournaments_v2_foundation.sql`.

## Scope
- Six new `iste_tournament_*` tables, separate from all existing ISTe tables.
- Bracket match/version fields, teams, members, maps and audit log.
- Strict RLS: anonymous/authenticated clients can read published tournaments and associated match/map results. No public read of team applications, memberships or audit logs; no client write policies.
- Constraints for slug, state enumerations, unique team names and slots.

## Must complete before production apply
1. Confirm existing owner authentication and implement **server-side** verified owner authorization. Vite/React client route protection is insufficient. A serverless endpoint may use the Supabase service credential only after verifying trusted owner identity.
2. Review privacy: `captain_user_id`, `user_id`, `created_by`, `actor_id` are UUIDs, not yet linked to `auth.users` because that policy requires inspection of the live auth model.
3. Review tournament-specific validations **not yet implemented in SQL**: team cap and eligible status, same-tournament FK enforcement for matches, lineup size and one team per user, match score state machine, transactional winner progression, BYEs, result approval and immutable audit. Do not use UI-only validation as a substitute.
4. Validate migration on a **disposable Supabase-compatible test database** with roles and RLS tests for `anon`, `authenticated` and owner endpoint; do not test schema creation on production.
5. Backup verified for public table structure/data in run #38537177384. Full Supabase Auth/Storage and post-data restore are **not** verified; plan full recovery before live schema migration.
6. Plan rollback and ensure the RLS policies never accidentally expose registration identities.

## Architecture notes
This site is Vite + React (not Next.js). A future `api/` Vercel function or dedicated backend should enforce authorization and transactional updates. No API is implemented in this PR.

## Merge semantics
Merging this PR only adds version-controlled SQL and documentation. It does **not** run the migration automatically.
