-- Disposable DB regression: exercise the actual permissions migration.
DO $check$
BEGIN
 IF has_function_privilege('anon','public.iste_publish_tournament(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Anonymous publication RPC execution must be denied';
 END IF;
 IF NOT has_function_privilege('authenticated','public.iste_publish_tournament(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Authenticated role must retain publication RPC execution';
 END IF;
END
$check$;
