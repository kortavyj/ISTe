ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.prevent_unprivileged_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Profile verification is controlled by the owner only'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_verification ON public.profiles;
CREATE TRIGGER protect_profile_verification
BEFORE UPDATE OF is_verified ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_unprivileged_profile_verification();

CREATE OR REPLACE FUNCTION public.owner_set_profile_verified(
  p_user_id uuid,
  p_verified boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR p_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid verification request' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'owner'
      AND is_blocked IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Owner access required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Two-factor verification required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET is_verified = p_verified
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('userId', p_user_id, 'verified', p_verified);
END;
$$;

REVOKE ALL ON FUNCTION public.owner_set_profile_verified(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_set_profile_verified(uuid, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.prevent_unprivileged_profile_verification() FROM PUBLIC, anon, authenticated;