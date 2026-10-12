# ISTe CS2 beta: first live test runbook

## Current state (2026-10-12)
- GitHub draft PR #15, integration branch, Vercel preview builds (SSO-protected).
- CI uses **disposable PostgreSQL** and does not prove a live browser flow.
- Production Supabase: `niwgrrprbcgbdaloijhq`. **Never use it for beta migrations or test data.**
- Do not merge `main`, apply production migrations, change custom production domains, or disable deployment protection without separate approval.

## Prerequisites for a functioning test link
1. Ask project owner to approve a **specific separate Supabase project** and confirm pricing before any project creation or billing change.
2. Save the isolated project's ref and public publishable key. Do not copy production rows or auth sessions.
3. Run `node scripts/cs2-staging-preflight.mjs` and `node scripts/cs2-beta-env-check.mjs` with an isolated staging configuration. Neither script writes to Supabase.
4. On the isolated project only, apply the nine files from the CI workflow in exact order; check all SQL permissions and required existing ISTe profile/auth dependencies before using staging.
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
