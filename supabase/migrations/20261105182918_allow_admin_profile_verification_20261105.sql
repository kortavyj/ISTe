CREATE OR REPLACE FUNCTION public.owner_set_profile_verified(
  p_user_id uuid,
  p_verified boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor_role text;
  v_target_role text;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR p_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid verification request' USING ERRCODE = '22023';
  END IF;

  SELECT role::text INTO v_actor_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_blocked IS NOT TRUE;

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Admin or owner access required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Two-factor verification required' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role = 'admin' THEN
    SELECT role::text INTO v_target_role
    FROM public.user_roles
    WHERE user_id = p_user_id;

    IF v_target_role = 'owner' THEN
      RAISE EXCEPTION 'Cannot change owner verification' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.profiles
  SET is_verified = p_verified
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('userId', p_user_id, 'verified', p_verified);
END;
$function$;

REVOKE ALL ON FUNCTION public.owner_set_profile_verified(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_set_profile_verified(uuid, boolean) TO authenticated, service_role;
