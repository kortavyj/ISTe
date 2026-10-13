# ISTe CS2 beta: first live test runbook

## Current state (2026-10-12)
- GitHub draft PR #15, integration branch, Vercel preview builds (SSO-protected).
- CI uses **disposable PostgreSQL** and does not prove a live browser flow.
- Production Supabase: `niwgrrprbcgbdaloijhq`. **Never use it for beta migrations or test data.**
- Do not merge `main`, apply production migrations, change custom production domains, or disable deployment protection without separate approval.

## Prerequisites for a functioning test link
1. Obtain project-owner permission to reserve existing Free-tier secondary Supabase project `jwzsawumiadlfxarvauc` for beta. Do not create another project, enable paid branching, or change this second project before approval. Verify zero additional billing and Free-tier limits.
2. Save the isolated project's ref and public publishable key. Do not copy production rows or auth sessions.
3. Run `node scripts/cs2-staging-preflight.mjs` and `node scripts/cs2-beta-env-check.mjs` with an isolated staging configuration. Neither script writes to Supabase.
4. The secondary project already has four empty public foundation tables and five historical ISTe test migrations; do not reapply these blindly. First reconcile migration history and run the profile prerequisite (`db/staging/cs2_beta_profiles.sql`) in an isolated rehearsal, then apply only missing approved migrations to staging in the CI order. Validate RLS and existing objects.
5. Configure **branch-scoped** Vercel Preview environment variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `CS2_ISOLATED_STAGING=yes`, `CS2_STAGING_PROJECT_REF`, `ISTE_CS2_ROOM_ENCRYPTION_KEY`. Use a newly generated base64 32-byte key; keep the key server-side and securely backed up.
6. Verify both backend and frontend point to the same isolated project before redeploy. Do not put server-only secrets under `VITE_*`. Keep production and other previews' bindings unchanged.
7. Open the branch Preview URL under the required Vercel account (SSO protection is enabled); perform the role-by-role browser matrix at `docs/tournaments/CS2_STAGING_BROWSER_TEST.md`.

## Beta acceptance
- Organizer logs in with MFA and creates a test tournament.
- Two captains create teams; applicants are pending until the captain approves.
- One team has exactly five slots (captain plus four accepted players); a sixth applicant cannot be approved.
- Nonparticipants and pending applicants never receive server credentials.
- Approved players only receive their match server password after the release time; stored value is `enc1:` ciphertext.
- Record HTTP status, sanitized screenshots and issues. Do not report beta as passed before this independent end-to-end run.

## Emergency stop
Disconnect Preview from the staging backend or disable the Preview deployment. Do not remove/change the production website. Rotate the test server password if exposed. Preserve the staging database for investigation and use only disposable credentials.

## Verified secondary-project limitation
The read-only audit in `docs/tournaments/CS2_SECOND_SUPABASE_AUDIT.md` found **no `public.profiles`**, match rooms, team applications, or test users. Until permission is granted and these dependencies are installed, Preview is for UI review only—not live tournament signup. The existing preview may require Vercel SSO. Never claim production is migrated or that browser acceptance tests have passed based on green CI alone.

## Beta login protection (2026-10-13)
- The isolated staging database now has `db/staging/cs2_beta_auth_security.sql`: server-only login throttling, rate-limit reset, and security-event records. Its RPCs must be executable by `service_role`, but not by `anon` or `authenticated`.
- On the `integration/cs2-main-sync-20261012` Vercel Preview branch only, set `SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY` from **the secondary** Supabase project's Settings → API Keys. Never use a production or publishable/anon key for this server-only variable. Store it as encrypted/sensitive and never prefix it `VITE_`.
- `AUTH_RATE_LIMIT_SECRET` is already branch-scoped and must remain private. Do not skip the limiter, relax RLS, or reuse production secrets to make beta login pass.
- Trigger a fresh Preview deployment after secrets are configured. Test account registration and login with a **new secondary-project** identity. Existing production ISTe accounts are not replicated.
- Green website/SQL CI does not prove Preview login works; validate real login from the browser and confirm there is no 503 `AUTH_SECURITY_NOT_CONFIGURED`.
