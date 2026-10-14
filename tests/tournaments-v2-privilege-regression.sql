DO $check$
DECLARE
  table_name text;
  role_name text;
  privilege_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'iste_tournaments',
    'iste_tournament_teams',
    'iste_tournament_members',
    'iste_tournament_matches',
    'iste_tournament_maps',
    'iste_tournament_audit_log'
  ] LOOP
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH privilege_name IN ARRAY ARRAY['TRUNCATE', 'TRIGGER', 'REFERENCES'] LOOP
        IF has_table_privilege(role_name, format('public.%I', table_name), privilege_name) THEN
          RAISE EXCEPTION 'Unexpected privilege % on % for %', privilege_name, table_name, role_name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END
$check$;
