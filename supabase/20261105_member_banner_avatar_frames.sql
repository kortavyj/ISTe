ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS avatar_frame text NOT NULL DEFAULT 'prism';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_frame_allowed;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_frame_allowed
  CHECK (avatar_frame IN ('prism','crimson','cyan','violet','gold','minimal'));

COMMENT ON COLUMN public.profiles.banner_url IS 'Public URL of the member-owned validated banner image.';
COMMENT ON COLUMN public.profiles.avatar_frame IS 'One of the supported ISTe decorative avatar frame designs.';
