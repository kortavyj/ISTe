-- ISTe member showcase: one editable text/image presentation per member.
-- Comments are visible to logged-in active members and always tied to the showcase.
CREATE TABLE IF NOT EXISTS public.member_showcases (
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_showcase_title_length CHECK (char_length(title) <= 100),
  CONSTRAINT member_showcase_body_length CHECK (char_length(body) <= 3000),
  CONSTRAINT member_showcase_not_empty CHECK (char_length(btrim(body)) > 0 OR image_path IS NOT NULL),
  CONSTRAINT member_showcase_owned_image CHECK (
    image_path IS NULL OR image_path ~ (
      '^' || owner_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$'
    )
  )
);

CREATE TABLE IF NOT EXISTS public.member_showcase_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.member_showcases(owner_id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_showcase_comment_length CHECK (char_length(btrim(body)) BETWEEN 2 AND 600)
);
CREATE INDEX IF NOT EXISTS member_showcase_comments_profile_created_idx
  ON public.member_showcase_comments(profile_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS member_showcase_comments_author_created_idx
  ON public.member_showcase_comments(author_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.member_showcase_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS member_showcase_touch ON public.member_showcases;
CREATE TRIGGER member_showcase_touch BEFORE UPDATE ON public.member_showcases
FOR EACH ROW EXECUTE FUNCTION public.member_showcase_touch_updated_at();

CREATE OR REPLACE FUNCTION public.member_showcase_comment_throttle()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  NEW.created_at := now();
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.author_id::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.member_showcase_comments
    WHERE author_id = NEW.author_id AND created_at > now() - interval '15 seconds'
  ) THEN
    RAISE EXCEPTION 'Please wait before posting another comment'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS member_showcase_comment_cooldown ON public.member_showcase_comments;
CREATE TRIGGER member_showcase_comment_cooldown BEFORE INSERT ON public.member_showcase_comments
FOR EACH ROW EXECUTE FUNCTION public.member_showcase_comment_throttle();

ALTER TABLE public.member_showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_showcase_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_showcases_read ON public.member_showcases;
CREATE POLICY member_showcases_read ON public.member_showcases
  FOR SELECT TO authenticated USING ((SELECT private.current_user_is_active()));
DROP POLICY IF EXISTS member_showcases_insert_own ON public.member_showcases;
CREATE POLICY member_showcases_insert_own ON public.member_showcases
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = (SELECT auth.uid()) AND (SELECT private.current_user_is_active())
  );
DROP POLICY IF EXISTS member_showcases_update_own ON public.member_showcases;
CREATE POLICY member_showcases_update_own ON public.member_showcases
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND (SELECT private.current_user_is_active()))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND (SELECT private.current_user_is_active()));
DROP POLICY IF EXISTS member_showcases_delete_own ON public.member_showcases;
CREATE POLICY member_showcases_delete_own ON public.member_showcases
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND (SELECT private.current_user_is_active()));

DROP POLICY IF EXISTS member_showcase_comments_read ON public.member_showcase_comments;
CREATE POLICY member_showcase_comments_read ON public.member_showcase_comments
  FOR SELECT TO authenticated USING ((SELECT private.current_user_is_active()));
DROP POLICY IF EXISTS member_showcase_comments_write_own ON public.member_showcase_comments;
CREATE POLICY member_showcase_comments_write_own ON public.member_showcase_comments
  FOR INSERT TO authenticated WITH CHECK (
    author_id = (SELECT auth.uid()) AND (SELECT private.current_user_is_active())
  );
DROP POLICY IF EXISTS member_showcase_comments_delete_author_or_owner ON public.member_showcase_comments;
CREATE POLICY member_showcase_comments_delete_author_or_owner ON public.member_showcase_comments
  FOR DELETE TO authenticated USING (
    (SELECT private.current_user_is_active())
    AND (
      author_id = (SELECT auth.uid())
      OR profile_id = (SELECT auth.uid())
      OR (SELECT private.current_user_role()) = 'owner'::app_role
    )
  );

REVOKE ALL ON public.member_showcases FROM PUBLIC, anon;
REVOKE ALL ON public.member_showcase_comments FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_showcases TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.member_showcase_comments TO authenticated;
REVOKE ALL ON FUNCTION public.member_showcase_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.member_showcase_comment_throttle() FROM PUBLIC, anon, authenticated;

-- Uploaded files use short-lived signed upload tokens issued by the authenticated API.
-- No client INSERT or UPDATE storage policies are granted.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('member-showcase', 'member-showcase', true, 1572864, ARRAY['image/jpeg']::text[])
ON CONFLICT (id) DO NOTHING;
