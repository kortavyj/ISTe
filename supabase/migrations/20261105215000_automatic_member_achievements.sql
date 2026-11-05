CREATE OR REPLACE FUNCTION public.member_awards_for_account(p_account_number bigint)
 RETURNS TABLE(award_code text, granted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  target_id uuid;
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

  SELECT p.id INTO target_id
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id = p.id
  WHERE p.account_number = p_account_number AND COALESCE(r.is_blocked, false) = false;
  IF target_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
    SELECT 'member'::text, p.created_at
    FROM public.profiles p WHERE p.id=target_id

    UNION ALL
    SELECT 'verified'::text, p.updated_at
    FROM public.profiles p WHERE p.id=target_id AND p.is_verified IS TRUE

    UNION ALL
    SELECT 'owner'::text, p.created_at
    FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id
    WHERE p.id=target_id AND r.role::text='owner'

    UNION ALL
    SELECT 'admin'::text, p.created_at
    FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id
    WHERE p.id=target_id AND r.role::text='admin'

    UNION ALL
    SELECT 'month_member'::text, p.created_at + interval '30 days'
    FROM public.profiles p
    WHERE p.id=target_id AND p.created_at <= now() - interval '30 days'

    UNION ALL
    SELECT 'year_member'::text, p.created_at + interval '1 year'
    FROM public.profiles p
    WHERE p.id=target_id AND p.created_at <= now() - interval '1 year'

    UNION ALL
    SELECT 'first_showcase'::text, s.created_at
    FROM public.member_showcases s
    WHERE s.owner_id=target_id

    UNION ALL
    SELECT 'first_comment'::text, (
      SELECT min(c.created_at) FROM public.member_showcase_comments c
      WHERE c.author_id=target_id AND c.profile_id<>target_id
    )
    WHERE (SELECT count(*) FROM public.member_showcase_comments c
      WHERE c.author_id=target_id AND c.profile_id<>target_id) >= 1

    UNION ALL
    SELECT 'ten_comments'::text, (
      SELECT c.created_at FROM public.member_showcase_comments c
      WHERE c.author_id=target_id AND c.profile_id<>target_id
      ORDER BY c.created_at, c.id LIMIT 1 OFFSET 9
    )
    WHERE (SELECT count(*) FROM public.member_showcase_comments c
      WHERE c.author_id=target_id AND c.profile_id<>target_id) >= 10

    UNION ALL
    SELECT a.award_code, a.granted_at FROM public.member_awards a WHERE a.user_id=target_id;
END;
$function$

REVOKE ALL ON FUNCTION public.member_awards_for_account(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_awards_for_account(bigint) TO authenticated;
