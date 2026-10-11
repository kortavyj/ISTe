# ISTe CS2 — production migration preflight (NOT AUTHORIZED TO APPLY)

Confirmed via **read-only** SQL on ISTe Supabase `niwgrrprbcgbdaloijhq` on 2026-10-11:
- Absent: `public.tournaments`, `public.tournament_teams`, `public.tournament_matches`, `public.tournament_cs2_events`, `public.tournament_cs2_assignments`.
- Existing: `public.user_roles` and authentication tables used by existing site.
- No tournament migration is present in Supabase migration history. The current Preview API returns PostgREST `PGRST205` for tournament requests.

## Reviewed migration sequence (feature branch only)

1. `db/migrations/20261011_cs2_tournaments_foundation.sql` — tournament table, indexes, RLS, owner AAL2 creation policy.
2. `db/migrations/20261011_cs2_tournament_teams.sql` — teams, RLS, insertion limit trigger.
3. `db/migrations/20261011_cs2_matches.sql` — fixtures, FKs, RLS.
4. `db/migrations/20261011_cs2_bracket_rpcs.sql` — audit, mutation RPCs and transactional counters.
5. `db/migrations/20261011_cs2_event_replay.sql` — event/assignment tables, server-only event ingestion and owner RPCs.

The SQL files contain `CREATE TABLE IF NOT EXISTS` and grant/policy operations. **Do not assume a universal safe rollback**: removing tables after real writes destroys data. Existing-schema privilege diff and role enforcement must be checked before application.

## Mandatory release gates

- An independently recoverable **current backup of the real production database** must be verified. Synthetic `pg_dump` / `pg_restore` in CI does not suffice.
- Restore backup into a *separate* throwaway project/database and record outcome + timestamp; do not restore over production.
- Inspect extension and existing schema dependencies, migration history, role grants, schema usage and relevant custom constraints.
- Run full five-file sequence and security regression against a disposable database clone, not production.
- Document exact release window, expected downtime, diagnostics, post-migration verification, rollback/recovery owner.
- Obtain **separate explicit user approval to modify production Supabase**, identifying project `niwgrrprbcgbdaloijhq`. Generic 'continue' or 'do it' is not approval.
- **Do not** merge PR #13 into main or change production Vercel during migration preparation.

## Production verification (read-only, before any change)

```sql
select n.nspname, c.relname from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname like 'tournament%'
order by c.relname;

select n.nspname, p.proname from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'iste_%'
order by p.proname;
```

## After separately approved installation

1. Confirm migration records / expected tables & RPC signatures exist.
2. Check RLS enabled and permission denials for anon/non-owner/blocked/no-AAL2; verify genuine owner with AAL2.
3. Reload PostgREST schema cache, if required, and confirm GET /api/tournaments no longer errors with PGRST205.
4. Avoid any real tournament creation until separately agreed; preview uses **same production Supabase**.
5. Do not enable MatchZy webhook keys, production WAF or live server binding before independent approval and integration tests.
