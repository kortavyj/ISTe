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
A Node.js 24.22.1 GitHub Actions run directly imported and invoked the
unauthenticated owner handler, confirmed HTTP 401, and observed **zero DEP0169
warnings**. This rules out a reproducible warning in that isolated execution,
but does not cover the Vercel HTTP adapter or deployed serverless wrapper.
`api/owner.js` imports other modules, so a path that is only called by the
serverless runtime remains possible.

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

## Final production verification on 2026-11-04

* Production deployment for commit `337fd8117c1d23834e76871876b42742a799c1db`
  reached Vercel READY and owns `www.istesport.com` and `istesport.com`.
* A credential-free GET to `https://www.istesport.com/api/owner?action=users`
  returned HTTP 401 as expected.
* In the same Node.js 24 production deployment the `DEP0169` warning was
  logged by **both** `/api/owner` and `/api/tournaments-alerts`. Its scope
  therefore is not specific to owner authorization. Direct Node 24 execution
  of the owner handler did not reproduce the warning. A temporary Vercel
  preview was protected (HTTP 302), so it did not provide a usable remote
  stack trace. The strongest current hypothesis is a shared deployed runtime
  or adapter path; the exact caller remains unconfirmed. Do not modify
  authorization or silence warnings merely to hide it.
* The dependency remediation PR updated Vite 8.1.5 to 8.3.5 and
  source-map-js to 1.2.2, with `npm audit --audit-level=high` returning
  zero vulnerabilities. The repository CI now fails on future high-severity
  audit findings when the package manifest, lockfile, or audit workflow changes.

`DEP0169` is a Node API deprecation warning, not evidence that an unauthenticated
user accessed the owner API. Continue monitoring it when Vercel updates its
runtime; use isolated stack tracing if the warning develops into a functional
error.
