-- Comments belong to a member profile, not to the optional showcase post.
-- Preserves existing comments; deleting a showcase must no longer delete them.
ALTER TABLE public.member_showcase_comments
  DROP CONSTRAINT IF EXISTS member_showcase_comments_profile_id_fkey;
ALTER TABLE public.member_showcase_comments
  ADD CONSTRAINT member_showcase_comments_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMENT ON TABLE public.member_showcase_comments IS
  'Independent member profile guestbook comments. Active authenticated ISTe users may comment even when showcase is unpublished.';
