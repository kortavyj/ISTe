# Authentication rate-limit verification and DEP0169 diagnostic

## Database smoke test

The committed fixture at `tests/auth-rate-limit-rpc-rollback.sql` was executed
against the connected ISTe Supabase project on 2026-11-04.

Observed behavior:
* Calls 1 through 20 to the independent identity bucket were allowed.
* Calls 21 and 22 were denied with a positive retry interval.
* The fixture bucket was rolled back; no test counter was retained.
* `anon` and `authenticated` have no EXECUTE privilege on
  `auth_consume_rate_limit` or `auth_reset_rate_limit`.

The test uses a synthetic bucket, not a user ID, email, session or password.
It verifies the SQL RPC in isolation and must not be described as a complete
HTTP or Supabase Auth integration test.

## Node warning on /api/owner

Production logs showed `DEP0169` while handling GET `/api/owner`
on Node.js 24. The current project sources do not contain a direct call to
`url.parse()`; do not assume the warning is caused by owner authorization.
`api/owner.js` imports other modules, so a direct call in an import or
compiled runtime remains possible.

To attribute the warning, enable `NODE_OPTIONS=--trace-deprecation`
**only in an isolated preview environment**, generate one unauthenticated
GET request to the preview `/api/owner?action=users`, then capture the
full server-side stack from its function logs. Remove the temporary setting
afterward. Do not log cookies, tokens or request bodies.

If the stack points to a repository file, replace the legacy URL API with
the WHATWG `URL` class and add a regression test. If it points to a Vercel
adapter or third-party dependency, identify the installed version and
upstream fix before changing dependencies. Do not silence deprecations
globally and do not alter production NODE_OPTIONS solely to investigate.

## Release criteria

Keep the production response unchanged until a stack trace identifies the
source. Continue checking rate-limit events and legitimate login errors
after rollout; the account-wide bucket is intentionally not reset on a
successful sign-in.
