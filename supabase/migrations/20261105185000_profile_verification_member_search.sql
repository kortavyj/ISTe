CREATE OR REPLACE FUNCTION public.profile_verification_for_member_search(
  p_account_number bigint
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_verified boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_blocked IS TRUE
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_BLOCKED' USING ERRCODE = '42501';
  END IF;

  SELECT p.is_verified INTO v_verified
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id = p.id
  WHERE p.account_number = p_account_number
    AND COALESCE(r.is_blocked, false) = false;

  RETURN COALESCE(v_verified, false);
END;
$function$;

REVOKE ALL ON FUNCTION public.profile_verification_for_member_search(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_verification_for_member_search(bigint) TO authenticated, service_role;
