# ISTe Tournaments V2 — DEV rollout plan (review only)

Target **only** Supabase project `jwzsawumiadlfxarvauc` (kortavyj's Project, eu-west-2). Never use production `niwgrrprbcgbdaloijhq`.

## Preconditions — STOP unless all confirmed
1. Encrypted backup `DEV/iste-dev-jwzsawumiadlfxarvauc-20261014T181137Z.dump.gpg` has been verified on Drive; partial public schema/data restore succeeded (16 tables). This is **not a full disaster-recovery test**: post-data FK/indices/RLS, auth and storage were not verified.
2. A new, verified backup should be taken immediately before actual migration. Confirm restore strategy and compare data counts.
3. Run `dev-preflight-readonly.sql` in the intended DEV project. All six V2 tables and all nine RPC names must be absent; existing user_roles(user_id,role,is_blocked) must exist. Confirm no schema drift since the check.
4. Review the nine SECURITY DEFINER functions and public read RLS policies; perform Supabase-specific Auth/RLS testing in a disposable Supabase project before relying on their protections.
5. Record rollback decision and obtain explicit owner approval **for DEV schema changes**. Keep Vercel environment `ISTE_TOURNAMENT_WRITES_ENABLED` disabled; never touch production.

## Exact dependency order
Run migrations one at a time; stop on any error and record versions. In this order, not alphabetical:

1. `20261014_iste_tournaments_v2_foundation.sql` — six tables, indexes, RLS
2. `20261014_iste_tournament_owner_create_rpc.sql`
3. `20261014_iste_tournament_team_apply_rpc.sql`
4. `20261014_iste_tournament_team_review_rpc.sql`
5. `20261014_iste_tournament_owner_list_teams_rpc.sql`
6. `20261014_iste_tournament_generate_bracket_rpc.sql`
7. `20261014_iste_tournament_confirm_match_rpc.sql`
8. `20261014_iste_tournament_owner_get_bracket_rpc.sql`
9. `20261014_iste_tournament_status_transition_rpc.sql`
10. `20261014_iste_tournament_owner_list_all_rpc.sql`

All listed SQL lives under `supabase/migrations/` and contains transactional DDL. Their common `20261014` filename prefix **does not establish ordered migration versions**. Assign distinct, sequential Supabase migration versions if using CLI migration tracking. The isolated GitHub Actions suite uses explicit order.

## Post-install acceptance checks
- Verify six tables, nine RPC signatures and RLS enabled. Confirm old `tournaments`, `tournament_teams`, `tournament_matches` and their data remain unchanged.
- No broad GRANT on sensitive tables/functions; anon/non-owner and AAL1 cannot call owner RPCs. Authenticated owner AAL2 can read drafts; auth users can only apply according to validation.
- In DEV only, run authorized end-to-end tournament lifecycle with expendable test identities, then clean up **only those** test records under reviewed SQL.
- Confirm Vercel deployment is READY and serverless count stays at eight. Production feature flag still disabled.

## Rollback and recovery
- **Before any recorded data exists in V2 tables:** use a separately reviewed, explicitly approved DEV-only rollback script or restore from a verified backup. Do not use `DROP ... CASCADE` blindly.
- **After V2 data exists:** dropping V2 tables destroys new data and can cascade. Take a new backup and preserve rows first. Application flag must be disabled before any recovery.
- Existing beta tables and functions must never be dropped by V2 rollback.
- This document deliberately **does not include an executable DROP script**. Generate one only after confirming actual installed dependencies and after fresh backup + owner approval.
