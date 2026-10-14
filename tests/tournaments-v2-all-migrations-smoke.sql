-- Isolated PG17: verify all V2 migrations coexist and owner RPCs are callable.
do $$
declare names text[] := array[
'iste_owner_create_tournament','iste_owner_confirm_match','iste_apply_tournament_team',
'iste_owner_review_team','iste_owner_list_teams','iste_owner_generate_bracket','iste_owner_get_bracket',
'iste_owner_transition_tournament','iste_owner_list_tournaments'
]; item text; total int;
begin
 foreach item in array names loop
  select count(*) into total from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname=item;
  if total<>1 then raise exception 'RPC missing or overloaded: % (%)',item,total; end if;
 end loop;
 select count(*) into total from information_schema.tables
 where table_schema='public' and table_name in
 ('iste_tournaments','iste_tournament_teams','iste_tournament_members',
  'iste_tournament_matches','iste_tournament_maps','iste_tournament_audit_log');
 if total<>6 then raise exception 'Expected six V2 tables, got %',total; end if;
end $$;
-- Distinguish real Supabase Auth/RLS verification from these minimal stubs.
\echo 'PASS: all nine V2 RPCs and six V2 tables coexist in disposable PostgreSQL'
