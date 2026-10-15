-- ISTe V2 — read-only staging preflight, safe to execute before a migration.
-- Run against the intended STAGING project and save output with the release evidence.
-- This script NEVER creates, alters, deletes, or updates database objects/data.
WITH required_relations(name) AS (
  VALUES ('iste_tournaments'),('iste_tournament_teams'),('iste_tournament_members'),
         ('iste_tournament_matches'),('iste_tournament_maps'),('iste_tournament_audit_log'),
         ('user_roles')
)
SELECT 'relation' AS check_type,name AS object_name,
       CASE WHEN to_regclass(format('public.%I',name)) IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS result
FROM required_relations
UNION ALL
SELECT 'column','iste_tournament_members.accepted_at',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='iste_tournament_members'
            AND column_name='accepted_at') THEN 'PRESENT' ELSE 'NOT_INSTALLED' END
UNION ALL
SELECT 'function','iste_apply_tournament_team(jsonb)',
       CASE WHEN to_regprocedure('public.iste_apply_tournament_team(jsonb)') IS NULL
            THEN 'MISSING' ELSE 'PRESENT' END
UNION ALL
SELECT 'function','iste_owner_review_team(uuid,text,text)',
       CASE WHEN to_regprocedure('public.iste_owner_review_team(uuid,text,text)') IS NULL
            THEN 'MISSING' ELSE 'PRESENT' END
UNION ALL
SELECT 'function','iste_v2_respond_roster_membership(uuid,boolean)',
       CASE WHEN to_regprocedure('public.iste_v2_respond_roster_membership(uuid,boolean)') IS NULL
            THEN 'NOT_INSTALLED' ELSE 'PRESENT' END
UNION ALL
SELECT 'function','iste_v2_invite_replacement(uuid,uuid)',
       CASE WHEN to_regprocedure('public.iste_v2_invite_replacement(uuid,uuid)') IS NULL
            THEN 'NOT_INSTALLED' ELSE 'PRESENT' END
ORDER BY check_type,object_name;

-- A mutation RPC must never have EXECUTE granted to anonymous users.
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS signature,
       p.prosecdef AS security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('iste_apply_tournament_team','iste_owner_review_team',
                   'iste_v2_respond_roster_membership','iste_v2_invite_replacement',
                   'iste_v2_my_roster_invitations','iste_v2_my_pending_captain_teams')
ORDER BY p.proname;

-- No user identifiers or team details are returned.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public' AND tablename LIKE 'iste_tournament%'
ORDER BY tablename;

-- Human release gate, intentionally not inferable from SQL:
-- [ ] recoverable staging backup verified
-- [ ] restore drill succeeded
-- [ ] staged website write feature flag confirmed OFF
-- [ ] separate authenticated player and MFA organizer sessions available
