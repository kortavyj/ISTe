ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_type text
CHECK (verification_type IN ('red','silver','gold'));
UPDATE public.profiles SET verification_type = 'silver'
WHERE is_verified IS TRUE AND verification_type IS NULL;

CREATE OR REPLACE FUNCTION public.owner_set_profile_verification_type(p_user_id uuid, p_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor_role text;
  v_target_role text;
  v_current text;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL
    OR (p_type IS NOT NULL AND p_type NOT IN ('red','silver','gold'))
  THEN
    RAISE EXCEPTION 'Invalid verification request' USING ERRCODE='22023';
  END IF;
  SELECT role::text INTO v_actor_role
  FROM public.user_roles
  WHERE user_id=auth.uid() AND role IN ('owner','admin') AND is_blocked IS NOT TRUE;
  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Admin or owner access required' USING ERRCODE='42501';
  END IF;
  IF COALESCE(auth.jwt()->>'aal','aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Two-factor verification required' USING ERRCODE='42501';
  END IF;
  SELECT p.verification_type,r.role::text INTO v_current,v_target_role
  FROM public.profiles p LEFT JOIN public.user_roles r ON r.user_id=p.id
  WHERE p.id=p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found' USING ERRCODE='P0002'; END IF;
  IF v_actor_role='admin' AND (v_target_role='owner'
     OR p_type IS DISTINCT FROM 'silver' AND p_type IS NOT NULL
     OR v_current IN ('red','gold')) THEN
    RAISE EXCEPTION 'Only owner can manage this verification type' USING ERRCODE='42501';
  END IF;
  UPDATE public.profiles
  SET is_verified=(p_type IS NOT NULL), verification_type=p_type
  WHERE id=p_user_id;
  RETURN jsonb_build_object('userId',p_user_id,'verified',p_type IS NOT NULL,'verificationType',p_type);
END;
$function$

REVOKE ALL ON FUNCTION public.owner_set_profile_verification_type(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_set_profile_verification_type(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.owner_set_profile_verified(p_user_id uuid, p_verified boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid verification request' USING ERRCODE='22023';
  END IF;
  RETURN public.owner_set_profile_verification_type(p_user_id,
    CASE WHEN p_verified THEN 'silver'::text ELSE NULL::text END);
END;
$function$

REVOKE ALL ON FUNCTION public.owner_set_profile_verified(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_set_profile_verified(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.profile_verification_type_for_member_search(p_account_number bigint)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_type text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND is_blocked IS TRUE) THEN
    RAISE EXCEPTION 'ACCOUNT_BLOCKED' USING ERRCODE='42501';
  END IF;
  SELECT CASE WHEN p.is_verified IS TRUE THEN coalesce(p.verification_type,'silver') ELSE NULL END
  INTO v_type
  FROM public.profiles p LEFT JOIN public.user_roles r ON r.user_id=p.id
  WHERE p.account_number=p_account_number AND COALESCE(r.is_blocked,false)=false;
  RETURN v_type;
END;
$function$

REVOKE ALL ON FUNCTION public.profile_verification_type_for_member_search(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.profile_verification_type_for_member_search(bigint) TO authenticated;
