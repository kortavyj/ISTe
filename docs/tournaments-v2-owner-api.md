# ISTe Tournaments V2 — Server API foundation

Status: Stage 2, **read-only until database and authorization are reviewed**.

- `GET /api/tournaments-owner` requires the existing ISTe owner HttpOnly-cookie session, verified `owner` role, unblocked account and AAL2 MFA.
- Only published rows from `public.iste_tournaments` are returned, subject to the user's normal Supabase RLS. **Draft tournament management is not yet enabled.**
- Missing migration returns `503 TOURNAMENT_SCHEMA_NOT_INSTALLED`, without applying migrations or writing anything.
- POST/PATCH/DELETE return HTTP 405. JSON errors do not include database connection details.
- No added secrets; service-role credentials are not transferred to the browser.
- This API should not be wired into the organizer preview as a full CRUD endpoint.

Before enabling CRUD: test and strengthen the proposed migration, introduce audited server-side owner-only transaction/RPC operations, ensure ownership and score version invariants, and test with a disposable Supabase environment. Production migration **has not been executed**.
