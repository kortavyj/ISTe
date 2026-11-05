CREATE TABLE IF NOT EXISTS public.member_award_history (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 award_code text NOT NULL,
 first_earned_at timestamptz NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 PRIMARY KEY (user_id,award_code)
);
ALTER TABLE public.member_award_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.member_award_history FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.member_awards_snapshot(p_account_number bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_target uuid;
  v_current jsonb := '[]'::jsonb;
  v_history jsonb := '[]'::jsonb;
  v_unread jsonb := '[]'::jsonb;
  v_is_self boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND is_blocked IS TRUE
  ) THEN RAISE EXCEPTION 'ACCOUNT_BLOCKED' USING ERRCODE='42501'; END IF;

  SELECT p.id INTO v_target FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id=p.id
  WHERE p.account_number=p_account_number AND COALESCE(r.is_blocked,false)=false;
  IF v_target IS NULL THEN
    RETURN jsonb_build_object('awards',v_current,'history',v_history,'unread',v_unread,'isSelf',false);
  END IF;

  v_is_self := auth.uid()=v_target;

  CREATE TEMP TABLE IF NOT EXISTS pg_temp.earned_awards_snapshot (
    award_code text PRIMARY KEY, granted_at timestamptz
  ) ON COMMIT DROP;
  TRUNCATE TABLE pg_temp.earned_awards_snapshot;
  INSERT INTO pg_temp.earned_awards_snapshot (award_code,granted_at)
  SELECT a.award_code,min(a.granted_at)
  FROM public.member_awards_for_account(p_account_number) a
  GROUP BY a.award_code;

  INSERT INTO public.member_award_history(user_id,award_code,first_earned_at,read_at)
  SELECT v_target,a.award_code,coalesce(a.granted_at,now()),
    CASE WHEN a.granted_at < timestamptz '2026-11-05 21:27:00+00'
      THEN now() ELSE NULL END
  FROM pg_temp.earned_awards_snapshot a
  ON CONFLICT (user_id,award_code) DO NOTHING;

  SELECT coalesce(jsonb_agg(jsonb_build_object('award_code',a.award_code,'granted_at',a.granted_at)
    ORDER BY a.granted_at,a.award_code),'[]'::jsonb)
    INTO v_current FROM pg_temp.earned_awards_snapshot a;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'award_code',h.award_code,'granted_at',h.first_earned_at,
    'active',e.award_code IS NOT NULL)
    ORDER BY h.first_earned_at DESC,h.award_code),'[]'::jsonb)
    INTO v_history FROM public.member_award_history h
    LEFT JOIN pg_temp.earned_awards_snapshot e ON e.award_code=h.award_code
    WHERE h.user_id=v_target;

  IF v_is_self THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('award_code',h.award_code,
      'granted_at',h.first_earned_at)
      ORDER BY h.first_earned_at DESC),'[]'::jsonb)
      INTO v_unread
      FROM public.member_award_history h
      WHERE h.user_id=v_target AND h.read_at IS NULL;
  END IF;

  RETURN jsonb_build_object('awards',v_current,'history',v_history,'unread',v_unread,'isSelf',v_is_self);
END;
$function$

REVOKE ALL ON FUNCTION public.member_awards_snapshot(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.member_awards_snapshot(bigint) TO authenticated;
CREATE OR REPLACE FUNCTION public.member_awards_mark_read()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.user_roles
    WHERE user_id=auth.uid() AND is_blocked IS TRUE)
  THEN RAISE EXCEPTION 'ACCOUNT_BLOCKED' USING ERRCODE='42501'; END IF;
  UPDATE public.member_award_history SET read_at=now()
  WHERE user_id=auth.uid() AND read_at IS NULL;
  RETURN true;
END;
$function$

REVOKE ALL ON FUNCTION public.member_awards_mark_read() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.member_awards_mark_read() TO authenticated;
