-- Run manually against a dedicated Supabase test project, or as a
-- read-only-style production fixture under an authorized SQL administrator.
-- All fixture writes take place inside a rolled-back PL/pgSQL subtransaction.
-- No user accounts, sessions or real auth buckets are used.
DO $test$
DECLARE
  test_bucket text := 'auth:login:identity:integration-fixture-20261104-no-real-user';
  outcome jsonb;
  attempt int;
BEGIN
  IF has_function_privilege('anon', 'public.auth_consume_rate_limit(text,integer,integer,integer)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.auth_consume_rate_limit(text,integer,integer,integer)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.auth_reset_rate_limit(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.auth_reset_rate_limit(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: public role can operate authentication rate limits';
  END IF;

  IF EXISTS (SELECT 1 FROM public.auth_rate_limits WHERE bucket = test_bucket) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: reserved fixture bucket already exists';
  END IF;

  BEGIN
    FOR attempt IN 1..22 LOOP
      outcome := public.auth_consume_rate_limit(test_bucket, 20, 900, 900);
      IF (outcome->>'allowed')::boolean IS DISTINCT FROM (attempt <= 20) THEN
        RAISE EXCEPTION 'ASSERTION_FAILED: attempt % returned %', attempt, outcome;
      END IF;
      IF attempt > 20 AND COALESCE((outcome->>'retry_after_seconds')::int, 0) < 1 THEN
        RAISE EXCEPTION 'ASSERTION_FAILED: retry-after absent for attempt %', attempt;
      END IF;
    END LOOP;

    -- Force a rollback of all fixture writes, including rate-limit rows.
    RAISE EXCEPTION 'ROLLBACK_FIXTURE_OK';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'ROLLBACK_FIXTURE_OK' THEN
      RAISE;
    END IF;
  END;

  IF EXISTS (SELECT 1 FROM public.auth_rate_limits WHERE bucket = test_bucket) THEN
    RAISE EXCEPTION 'ASSERTION_FAILED: fixture bucket was not rolled back';
  END IF;
END $test$;
