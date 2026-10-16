-- ISTe V2 — read-only staging preflight, safe to execute before a migration.
-- Run against the intended STAGING project and save output with the release evidence.
-- This script NEVER creates, alters, deletes, or updates database objects/data.
-- Fail closed: all queries below execute inside a read-only transaction.
-- A write accidentally introduced into this preflight will be rejected by PostgreSQL.
BEGIN TRANSACTION READ ONLY;

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

-- Existing roster inventory for consent rollout. Aggregated counts only: no PII.
-- Run only if all required V2 relations above exist.
SELECT t.status AS team_status,
       count(DISTINCT t.id) AS teams,
       count(m.id) AS roster_entries,
       count(m.id) FILTER (WHERE m.user_id IS NULL) AS faceit_only_entries,
       count(m.id) FILTER (WHERE m.user_id IS NOT NULL
         AND au.id IS NULL) AS unknown_auth_accounts,
       count(m.id) FILTER (WHERE ur.is_blocked IS TRUE) AS blocked_accounts
FROM public.iste_tournament_teams t
LEFT JOIN public.iste_tournament_members m ON m.team_id=t.id
LEFT JOIN auth.users au ON au.id=m.user_id
LEFT JOIN public.user_roles ur ON ur.user_id=m.user_id
GROUP BY t.status
ORDER BY t.status;

-- Explicit data-quality gate. A non-zero result means roster reconciliation
-- is required before rollout; SQL preflight alone never authorizes migration.
SELECT count(*) FILTER (WHERE m.user_id IS NULL) AS faceit_only_entries,
       count(*) FILTER (WHERE m.user_id IS NOT NULL AND au.id IS NULL) AS unknown_auth_accounts,
       count(*) FILTER (WHERE ur.is_blocked IS TRUE) AS blocked_accounts,
       CASE WHEN count(*) FILTER (
         WHERE m.user_id IS NULL OR (m.user_id IS NOT NULL AND au.id IS NULL)
            OR ur.is_blocked IS TRUE
       )=0 THEN 'NO_KNOWN_ROSTER_BLOCKERS'
       ELSE 'ROSTER_RECONCILIATION_REQUIRED' END AS roster_gate
FROM public.iste_tournament_teams t
JOIN public.iste_tournament_members m ON m.team_id=t.id
LEFT JOIN auth.users au ON au.id=m.user_id
LEFT JOIN public.user_roles ur ON ur.user_id=m.user_id
WHERE t.status IN ('pending','approved','checked_in');

-- Check eligible playing roster cardinality independently: coaches and other
-- non-playing roles and duplicate accounts cannot satisfy the 5–7 distinct\n-- player/substitute approval rule.
-- Even valid Auth identities cannot make an underfilled or oversized team ready.
-- This is a diagnostic gate, not approval to migrate or enable writes.
WITH active_rosters AS (
 SELECT t.id,t.status,count(DISTINCT m.user_id) FILTER (WHERE m.role IN ('player','substitute') AND au.id IS NOT NULL AND ur.is_blocked IS NOT TRUE) AS member_count
 FROM public.iste_tournament_teams t
 LEFT JOIN public.iste_tournament_members m ON m.team_id=t.id
 LEFT JOIN auth.users au ON au.id=m.user_id
 LEFT JOIN public.user_roles ur ON ur.user_id=m.user_id
 WHERE t.status IN ('pending','approved','checked_in')
 GROUP BY t.id,t.status
)
SELECT count(*) AS active_teams,
       count(*) FILTER (WHERE member_count<5) AS underfilled_teams,
       count(*) FILTER (WHERE member_count>7) AS oversized_teams,
       CASE WHEN count(*) FILTER (WHERE member_count NOT BETWEEN 5 AND 7)=0
         THEN 'NO_KNOWN_ROSTER_SIZE_BLOCKERS'
         ELSE 'ROSTER_SIZE_RECONCILIATION_REQUIRED' END AS roster_size_gate
FROM active_rosters;

-- This script intentionally does not infer consent from old memberships.
-- accepted_at may be absent before the candidate migration; even a full roster
-- with valid accounts remains UNVERIFIED until each player explicitly accepts.
SELECT count(*) FILTER (WHERE status IN ('pending','approved','checked_in'))
         AS active_teams_requiring_consent_review,
       CASE WHEN count(*) FILTER (WHERE status IN ('pending','approved','checked_in'))=0
         THEN 'NO_ACTIVE_LEGACY_ROSTERS'
         ELSE 'CONSENT_REVIEW_REQUIRED' END AS consent_gate
FROM public.iste_tournament_teams;

-- Preexisting approved or checked-in teams require individual consent review
-- before the new approval policy can be considered valid for legacy data.
SELECT count(*) FILTER (WHERE status='approved') AS approved_legacy_teams,
       count(*) FILTER (WHERE status='checked_in') AS checked_in_legacy_teams,
       CASE WHEN count(*) FILTER (WHERE status IN ('approved','checked_in'))=0
         THEN 'NO_PREAPPROVED_LEGACY_TEAMS'
         ELSE 'LEGACY_APPROVAL_REVIEW_REQUIRED' END AS review_gate
FROM public.iste_tournament_teams;

-- A player must not occupy slots in multiple active teams of one tournament.
-- Only aggregate counts are returned; player identifiers stay private.
WITH repeated_players AS (
 SELECT t.tournament_id,m.user_id,count(DISTINCT t.id) AS team_count
 FROM public.iste_tournament_members m
 JOIN public.iste_tournament_teams t ON t.id=m.team_id
 WHERE t.status IN ('pending','approved','checked_in') AND m.user_id IS NOT NULL
 GROUP BY t.tournament_id,m.user_id
 HAVING count(DISTINCT t.id)>1
)
SELECT count(*) AS duplicated_players,
       CASE WHEN count(*)=0 THEN 'NO_CROSS_TEAM_DUPLICATES'
         ELSE 'CROSS_TEAM_RECONCILIATION_REQUIRED' END AS cross_team_gate
FROM repeated_players;

-- Historical imports may contain duplicate entries for one Auth account
-- within the same team; count only affected team/player pairs, never IDs.
WITH duplicate_members AS (
 SELECT m.team_id,m.user_id
 FROM public.iste_tournament_members m
 JOIN public.iste_tournament_teams t ON t.id=m.team_id
 WHERE t.status IN ('pending','approved','checked_in')
   AND m.user_id IS NOT NULL
 GROUP BY m.team_id,m.user_id
 HAVING count(*)>1
)
SELECT count(*) AS duplicate_member_pairs,
       CASE WHEN count(*)=0 THEN 'NO_INTRA_TEAM_DUPLICATES'
            ELSE 'INTRA_TEAM_RECONCILIATION_REQUIRED' END AS intra_team_gate
FROM duplicate_members;

-- Human release gate, intentionally not inferable from SQL:
-- [ ] recoverable staging backup verified
-- [ ] restore drill succeeded
-- [ ] staged website write feature flag confirmed OFF
-- [ ] separate authenticated player and MFA organizer sessions available

COMMIT;
