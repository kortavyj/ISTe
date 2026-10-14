-- ISTe Tournaments V2 — READ-ONLY compatibility preflight.
-- Run only as SELECT; suitable for existing kortavyj's Project DEV database.
-- No schema/data writes, no secret or personal-row values returned.
select 'dev_inventory' as check_name,
  (select count(*) from information_schema.tables where table_schema='public' and table_name like 'iste_tournament%') as existing_v2_tables,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='iste_owner_create_tournament') as existing_v2_create_functions,
  (select count(*) from information_schema.tables where table_schema='public' and table_name in ('tournaments','tournament_teams','tournament_matches')) as existing_legacy_tournament_tables;

select 'owner_role_compatibility' as check_name,
  coalesce(bool_and(column_name in ('user_id','role','is_blocked')), false) as known_columns_only,
  count(*) filter (where column_name in ('user_id','role','is_blocked')) = 3 as required_columns_present
from information_schema.columns
where table_schema='public' and table_name='user_roles' and column_name in ('user_id','role','is_blocked');

select 'object_name_collision' as check_name,
  n.nspname as schema_name, c.relname as object_name
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('iste_tournaments','iste_tournament_teams','iste_tournament_members',
  'iste_tournament_matches','iste_tournament_maps','iste_tournament_audit_log')
order by 2;
