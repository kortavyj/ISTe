# ISTe CS2 — release gate (production protected)

This document is an operational checklist. Passing CI is necessary, **not sufficient**.

## Implemented on feature/cs2-tournaments-full-preview
- Owner+MFA RLS; server-side publish/start/result RPC.
- Revoke direct tournament UPDATE and internal audit/event/rate-limit tables.
- HMAC SHA-256 event validation, timestamp window, stored per-match sequence and uniqueness.
- Service-role-only transactional event ingestion.
- PostgreSQL-backed owner operation counters.
- Disposable CI tests: 2–64 teams, permission checks, webhook validation logic, event replay, parallel confirmation.

## Must be verified before deployment to production
1. **Vercel raw-body handling:** confirm that /api/cs2-ingest receives an *unmodified* raw string of incoming JSON. The handler deliberately rejects parsed JSON, since re-serialization breaks HMAC verification. Without a raw-body guarantee, leave webhook disabled.
2. **Event integration:** test a real MatchZy callback and validate server/match identity, HMAC timestamp and sequence. Configure ISTE_CS2_WEBHOOK_SECRET (random >=32 bytes), SUPABASE_SERVICE_ROLE_KEY (server-only), and SUPABASE_URL. Never use VITE_ for secrets.
3. **Rate limiting:** DB transaction counters roll back on invalid requests. Add independent edge/proxy rate limits covering all 401/403/409 attempts, as well as request-size controls.
4. **Real MFA login:** run owner, non-owner, blocked owner, expired session and missing aal2 tests through deployed beta.
5. **Backups:** confirm an actual recoverable snapshot/PITR and execute a restoration drill into a disposable database; document restore timestamp and restore time objective. A GitHub rollback cannot reverse a database migration.
6. **CI and concurrent writes:** require green checks on the final commit; use test/pg/20_concurrency.sh for concurrent result confirmation.
7. **Review and approval:** inspect migration diff against production schema, rehearse on disposable clone, then ask owner for *separate explicit approval* before applying any production migration.

## Rollout
- No automatic DB migrations to production.
- Feature branch and PR #13 remain unmerged until release gate passes.
- Keep webhook secrets unset until raw body and real events are verified.
- Deploy backend behind owner-only UI; release public access as a separate reviewed change.
