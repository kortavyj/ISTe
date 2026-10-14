# ISTe Tournaments V2 — manual match confirmation SQL (review-only)

New SQL: `supabase/migrations/20261014_iste_tournament_confirm_match_rpc.sql`.

**Not applied to any Supabase project.** Depends on the V2 foundation migration and on owner role/MFA conventions. The HTTP endpoint from PR #44 remains disabled.

## Transaction contract
- Must verify authenticated, unblocked `owner` and JWT `aal2` again **inside PostgreSQL**.
- Lock the match row and ensure the supplied `expectedVersion` matches.
- Require tournament status `live`, ready/live match, teams belonging to the same tournament, and BO value matching the match.
- Validate completed BO1/3/5 series, unique supported maps, whole-number map scores and no series continuing after winner determination.
- Populate detailed map rows, winner, BO match score, status and version; advance the winner into the correctly positioned next-round slot when one exists.
- Append a confirmation audit entry within the same transaction. Any exception rolls back all actions, including map inserts.

## Required further checks before installation
- End-to-end tests on disposable PostgreSQL *and real Supabase Auth/RLS* with an existing DEV backup.
- Review row-lock ordering and concurrent confirmations, result correction workflow, and consistency with the actual generated/seeded bracket.
- Prevent confirming a match with pre-existing map rows; verify full bracket connectivity and extra match integrity constraints.
- Verify map-score rules against the chosen competitive CS2 ruleset (overtime is not represented separately).
- Do not set `ISTE_TOURNAMENT_WRITES_ENABLED` until both creation and match confirmation RPCs are independently approved.
- Migrations must not be applied to production simply by merging this PR.
