-- Read-only preflight for a fresh ISTe Tournaments V2 production installation.
-- Run before applying V2 migrations; fails on missing dependencies or an existing V2 schema.
DO $preflight$
BEGIN
  IF to_regclass('public.iste_tournaments') IS NOT NULL THEN
    RAISE EXCEPTION 'V2_ALREADY_PRESENT: inspect installed schema before applying migrations';
  END IF;
  IF to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'MISSING_USER_ROLES';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_roles'
      AND column_name IN ('user_id','role','is_blocked')
    GROUP BY table_schema,table_name HAVING count(*) = 3
  ) THEN
    RAISE EXCEPTION 'MISSING_USER_ROLE_COLUMNS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    RAISE EXCEPTION 'MISSING_SUPABASE_API_ROLES';
  END IF;
  IF to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'MISSING_AUTH_UID';
  END IF;
END $preflight$;
