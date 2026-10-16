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


## Read-only preflight execution results (16 October 2026)
The checked-in `db/preflight/iste_v2_staging_readonly.sql` checks were replicated as read-only queries on test Supabase:
- Required relations: 7/7 present.
- Existing application and review RPCs: anonymous EXECUTE = false; authenticated EXECUTE = true.
- Consent/invitation/replacement RPCs: absent, as expected before candidate migration.
- RLS enabled on all six V2 tournament tables. Policy counts: tournaments 1, matches 1, maps 1, teams 0, members 0, audit 0. The three policy-free tables remain deny-by-default for ordinary roles; inspect SQL-definer privileges and grants before enabling writes.
- No proof of a recoverable staging backup or completed restore drill was available from the connected tooling. **The migration was NOT applied.**

Immediate gate: secure and verify an independent recoverable staging copy, then rehearse the migration on that copy; avoid assuming that an automatically provisioned Supabase project has usable restore snapshots.

## Budget decision
The owner declined creation of a paid Supabase development branch. Do not create one or incur new hosting charges. Continue existing GitHub Actions PostgreSQL 17 CI and read-only inspection of existing Supabase projects; do not apply candidate DDL to existing projects without verified recovery capability.

## Free CI milestone (16 October, verified at `912eb1576959d15457de86d283b3f1e29804df1b`)
- GitHub Actions runs for this exact commit completed successfully: **Tournament V2 roster consent**, **Verify Tournament V2 Team Application SQL**, **Verify Tournament V2 Full SQL Stack**, **Verify Tournament V2 Owner RPC**, both **Verify Tournament V2 Registration to Champion** runs, **Validate Website PR**, and **Verify Vercel Hobby Serverless Budget**.
- The generic **ISTe Tournaments CI** workflow was **skipped**; it is not a success signal.
- Isolated PostgreSQL 17 tests exercise foundation, captain application, consent, owner review, bracket generation and match-result SQL. Tests now model `auth.users`, rejecting nonexistent or blocked members in initial applications, and rejecting nonexistent users in captain replacement invitations.
- The acceptance gate rejects FACEIT-only players who lack account-level consent. Captains cannot self-invite twice or duplicate an active player's roster membership in the same tournament.
- These are synthetic Auth/JWT fixtures in disposable PostgreSQL, **not** an installed consent migration, production readiness, recoverable staging backup, or a test with actual Supabase Auth user sessions.
- **NO-GO remains:** obtain backup-and-restore proof on an independently recoverable staging environment, rehearse migration/rollback there, then test real users and owner AAL2 before considering public registration. The owner declined any paid Supabase branch; do not create one.

## Verified free preflight CI (commit `e8b154abb58e2e95d9fa0d4d7818c9e92ec6bfdd`)
- The **Tournament V2 roster consent** workflow succeeded and ran the isolated PostgreSQL 17 staging preflight test. The dedicated team application, owner RPC, full SQL stack, registration-to-champion, website build and Vercel budget checks also succeeded. The generic ISTe Tournaments CI was skipped.
- The preflight runs in a PostgreSQL `READ ONLY` transaction: an injected write is rejected by the database.
- The inventory reports only aggregate counts for active rosters and an explicit reconciliation result. Four fixture cases have passing CI: an active, existing Auth account produces `NO_KNOWN_ROSTER_BLOCKERS`; a missing Auth account, blocked account, or FACEIT-only slot produces `ROSTER_RECONCILIATION_REQUIRED`.
- **Scope limitation:** `NO_KNOWN_ROSTER_BLOCKERS` only means these three roster identity risks were not detected in the current snapshot. It does not verify team size, historical consent, concurrent registrations, migration compatibility with real Supabase data, or a recoverable backup. It must never be treated as release approval.
- **Still mandatory:** backup plus demonstrated restore, candidate migration rehearsal on independently recoverable staging, role/session/AAL2 checks against actual Supabase Auth accounts, operator sign-off and explicit writes-enabled decision. No paid branch, live DDL, merge or production deployment is authorized by this CI result.
