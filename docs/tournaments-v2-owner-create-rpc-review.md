# ISTe Tournaments V2 — SQL owner-create RPC review

**Status: DRAFT ONLY. DO NOT run against production.**

Proposed file: `supabase/migrations/20261014_iste_tournament_owner_create_rpc.sql`

## Enforcement
- A database-side SECURITY DEFINER function checks `auth.role() = authenticated`, non-null `auth.uid()`, JWT assurance `aal2`, and `public.user_roles` showing non-blocked `owner`.
- Only creates `status = draft`, and validates the expected fields in SQL, independently of the HTTP handler.
- Inserts an audit record in the same transaction. An exception rolls back both records.
- Explicitly revokes execute from PUBLIC/anon; authenticated users are granted EXECUTE but the function itself rejects non-owners.
- Uses `set search_path = ''` and fully qualified table/function names to reduce object shadowing.
- Does not alter any existing roles or existing ISTe tables.

## Blockers before deployment
- Review against the real `user_roles` schema, MFA claim conventions and Supabase function ownership/grants in a disposable Supabase project.
- Test anonymous, AAL1, normal user, blocked owner, valid owner, malformed payload, duplicate slug, and audit rollback.
- Review whether `status`, dates and size constraints fit real event rules, and ensure database-side rate limits / spam limits on owner creation.
- Investigate client/server RPC schema cache behavior and map error codes safely.
- Check create function owner and least privilege; do not grant write privileges on tournament tables to anonymous clients.
- Existing public-schema backup smoke test **does not test full Supabase Auth or post-data restore**.
- The server's `ISTE_TOURNAMENT_WRITES_ENABLED` flag must stay unset until approved migration and tests pass.

Merging the PR stores the SQL in GitHub only. No production SQL execution is part of this change.
