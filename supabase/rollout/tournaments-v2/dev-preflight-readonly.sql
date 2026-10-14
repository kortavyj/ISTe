-- ISTe Tournaments V2 DEV preflight. READ ONLY. Does not create/alter/drop anything.
-- Expected target: jwzsawumiadlfxarvauc; run only after confirming the connection.
with expected_objects(name) as (
 values ('iste_tournaments'),('iste_tournament_teams'),('iste_tournament_members'),
 ('iste_tournament_matches'),('iste_tournament_maps'),('iste_tournament_audit_log')
), functions(name) as (
 values ('iste_owner_create_tournament'),('iste_apply_tournament_team'),
 ('iste_owner_review_team'),('iste_owner_list_teams'),('iste_owner_generate_bracket'),
 ('iste_owner_confirm_match'),('iste_owner_get_bracket'),
 ('iste_owner_transition_tournament'),('iste_owner_list_tournaments')
)
select 'database' as check_type,current_database() as object_name,'info' as result
union all
select 'existing_v2_table',e.name,
 case when to_regclass('public.'||e.name) is null then 'absent (expected)' else 'PRESENT - STOP' end
from expected_objects e
union all
select 'existing_v2_rpc',f.name,
 case when exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname=f.name) then 'PRESENT - STOP' else 'absent (expected)' end
from functions f
union all
select 'user_roles_column',c.column_name,'present'
from information_schema.columns c where c.table_schema='public' and c.table_name='user_roles'
 and c.column_name in ('user_id','role','is_blocked')
order by check_type,object_name;
