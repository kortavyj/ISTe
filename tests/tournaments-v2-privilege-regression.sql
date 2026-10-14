DO $$
BEGIN
 IF has_table_privilege('anon','public.iste_tournaments','TRUNCATE') THEN
  RAISE EXCEPTION 'Anonymous truncate is permitted';
 END IF;
END;
$$;
