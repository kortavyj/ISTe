-- ISTesport news localization
-- Run once in Supabase SQL Editor for the ISTesport project.

begin;

alter table public.news_posts
  add column if not exists translations jsonb
  not null
  default '{}'::jsonb;

-- Existing editorial fields are currently English on the live site.
-- Preserve them as the English localization automatically.
update public.news_posts
set translations =
  coalesce(translations, '{}'::jsonb)
  || jsonb_build_object(
    'en',
    jsonb_build_object(
      'title', coalesce(title, ''),
      'excerpt', coalesce(excerpt, ''),
      'content', coalesce(content, '')
    )
  )
where
  not (coalesce(translations, '{}'::jsonb) ? 'en');

commit;

-- Expected translations shape:
--
-- {
--   "uk": {
--     "title": "Український заголовок",
--     "excerpt": "Короткий опис українською",
--     "content": "Повний текст українською"
--   },
--   "en": {
--     "title": "English title",
--     "excerpt": "English excerpt",
--     "content": "Full English article"
--   }
-- }
--
-- Example for updating Ukrainian content of one post:
--
-- update public.news_posts
-- set translations =
--   coalesce(translations, '{}'::jsonb)
--   || jsonb_build_object(
--     'uk',
--     jsonb_build_object(
--       'title', '...',
--       'excerpt', '...',
--       'content', '...'
--     )
--   )
-- where id = 'POST_UUID_HERE';
