-- Catalog-only audit on approved ISTe DEV. Never reads user rows or secrets.
BEGIN TRANSACTION READ ONLY;
DO $audit$
DECLARE missing text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='auth') THEN RAISE EXCEPTION 'AUTH_SCHEMA_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='public') THEN RAISE EXCEPTION 'PUBLIC_SCHEMA_MISSING'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') OR
    NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    RAISE EXCEPTION 'API_ROLES_MISSING';
 END IF;
 IF to_regclass('public.user_roles') IS NULL THEN RAISE EXCEPTION 'USER_ROLES_MISSING'; END IF;
 SELECT string_agg(expected.name,', ') INTO missing FROM
  (values ('user_id'),('role'),('is_blocked')) expected(name)
  WHERE NOT EXISTS (select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='user_roles' and c.column_name=expected.name);
 IF missing IS NOT NULL THEN RAISE EXCEPTION 'ROLE_COLUMNS_MISSING: %',missing; END IF;
 IF to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('auth.jwt()') IS NULL
    OR to_regprocedure('auth.role()') IS NULL THEN RAISE EXCEPTION 'AUTH_HELPERS_MISSING'; END IF;
 RAISE NOTICE 'PASS: DEV Auth helpers, API roles and owner role table exist';
END $audit$;

SELECT 'tournaments_v2_tables_present' AS metric, count(*)::text AS value
 FROM pg_tables WHERE schemaname='public' AND tablename IN
 ('iste_tournaments','iste_tournament_teams','iste_tournament_members',
  'iste_tournament_matches','iste_tournament_maps','iste_tournament_audit_log')
UNION ALL
SELECT 'tournaments_v2_rpcs_present', count(*)::text FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
 AND p.proname IN ('iste_owner_create_tournament','iste_apply_tournament_team',
 'iste_owner_review_team','iste_owner_list_teams','iste_owner_generate_bracket',
 'iste_owner_confirm_match','iste_owner_get_bracket','iste_owner_transition_tournament',
 'iste_owner_list_tournaments')
UNION ALL
SELECT 'owner_table_rls_enabled', c.relrowsecurity::text FROM pg_class c
 WHERE c.oid='public.user_roles'::regclass;
COMMIT;
