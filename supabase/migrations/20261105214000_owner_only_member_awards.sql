CREATE OR REPLACE FUNCTION public.manage_member_award(p_account_number bigint, p_award_code text, p_grant boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  target_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'owner'
      AND is_blocked IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'OWNER_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'MFA_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_award_code IS NULL OR p_award_code NOT IN
    ('early_member','community_helper','tournament_winner','partner','creator')
    OR p_grant IS NULL
  THEN
    RAISE EXCEPTION 'INVALID_AWARD' USING ERRCODE = '22023';
  END IF;
  SELECT p.id INTO target_id
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id = p.id
  WHERE p.account_number = p_account_number
    AND COALESCE(r.is_blocked, false) = false;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF p_grant THEN
    INSERT INTO public.member_awards(user_id, award_code, granted_by)
    VALUES(target_id, p_award_code, auth.uid())
    ON CONFLICT(user_id, award_code) DO NOTHING;
  ELSE
    DELETE FROM public.member_awards
    WHERE user_id = target_id AND award_code = p_award_code;
  END IF;
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.manage_member_award(bigint,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_member_award(bigint,text,boolean) TO authenticated;
