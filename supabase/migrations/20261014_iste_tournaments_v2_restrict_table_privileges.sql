-- ISTe Tournaments V2: restrict non-RLS table capabilities.
-- Applied to DEV first, tracked here for reproducible future deployments.
-- TRUNCATE bypasses row-level security; TRIGGER and REFERENCES are not needed by API clients.
-- This migration does not remove data and must not be run on production without approval.
REVOKE TRUNCATE, TRIGGER, REFERENCES
ON TABLE
  public.iste_tournaments,
  public.iste_tournament_teams,
  public.iste_tournament_members,
  public.iste_tournament_matches,
  public.iste_tournament_maps,
  public.iste_tournament_audit_log
FROM anon, authenticated;
