-- Existing profiles privileges are intentionally column-scoped.
-- Add only appearance fields introduced by the profile personalization feature.
-- The profiles_update_own RLS policy still requires the logged-in active owner.
GRANT UPDATE (avatar_frame, banner_url)
  ON TABLE public.profiles
  TO authenticated;

-- Do not grant broad UPDATE: account numbers, roles and verified status
-- must remain protected by their existing ownership and verification rules.
