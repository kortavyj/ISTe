# ISTe V2 — staging rollout gate (2026-10-16)

**Status: NO-GO for schema changes until recoverable backup/restore evidence exists.**
This document records read-only live inspections. It is not evidence of a successfully deployed consent feature.

## Verified on test Supabase (read-only)
- Supabase Postgres 17 test project has V2 tournaments, teams, members, matches, maps, audit tables.
- Existing migrations include the V2 foundation and captain application/review/bracket RPCs.
- Member table has a playing role column but has no `accepted_at` column.
- New roster consent, pending invitations, replacement invitation and captain-team read RPCs are not installed yet.
- Existing application and owner review RPCs allow EXECUTE to `authenticated` but deny `anon`; these are SECURITY DEFINER.
- Supabase development branch list is empty; project metadata does not give backup/restore evidence.
- Security advisor includes informational “RLS enabled, no policy” findings on private V2 members/teams/audit. This is expected deny-by-default only if all accesses go through properly scoped RPCs; validate the complete grants/RLS boundary before enabling writes.

## Pre-apply gate (mandatory)
1. Confirm recoverable staging backup and a successful restore drill. Record location, restore procedure, timestamp and responsible operator. Do not substitute an empty database or a green unit test for this evidence.
2. Review `db/migrations/20261015_iste_v2_roster_consent.sql` against staging functions/constraints. Record checksums and dependency order.
3. Ensure no active registrations, no concurrent staging users during migration; preserve current function definitions for rollback.
4. Verify server flag `ISTE_TOURNAMENT_WRITES_ENABLED` is **OFF** on the staging API.
5. Apply candidate only to staging after backup approval, then validate `accepted_at`, RPC signatures, function grants, and fresh user sessions.
6. Run real-user Auth/RLS testing: captain + five individual player accounts + replacement + owner AAL2, rejecting cross-account actions and expired registration.
7. Test full tournament bracket, match confirmation, results, audit and simultaneous review/response.
8. If any gate fails, leave public registration disabled and document the rollback decision.

## Current rollout stance
- Do not merge PR #122 solely because CI is green.
- Do not run candidate DDL against production.
- Do not enable public writes until staging E2E, backup/restore, and operator sign-off succeed.
- Production and test projects may have different migration histories; assess independently.
