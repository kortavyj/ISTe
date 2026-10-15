-- Remove public RPC access to an owner-only role predicate.
-- Do not touch authenticated access; RLS policies and logged-in owner
-- operations may call this function under the authenticated role.
-- The public username availability function is intentionally unchanged.
DO $$
BEGIN
  IF to_regprocedure('public.is_iste_media_owner()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.is_iste_media_owner() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.is_iste_media_owner() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_iste_media_owner() TO authenticated;
  END IF;
END
$$;
