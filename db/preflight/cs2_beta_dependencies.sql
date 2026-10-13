-- READ ONLY. Run only against the specifically chosen isolated beta database.
-- A nonzero psql exit stops the operator before applying tournament migrations.
do $preflight$
declare missing text := '';
begin
 if to_regclass('public.user_roles') is null then missing := missing || ' public.user_roles'; end if;
 if to_regclass('public.profiles') is null then missing := missing || ' public.profiles'; end if;
 if to_regclass('public.tournaments') is null then missing := missing || ' public.tournaments'; end if;
 if to_regclass('public.tournament_teams') is null then missing := missing || ' public.tournament_teams'; end if;
 if to_regclass('public.tournament_matches') is null then missing := missing || ' public.tournament_matches'; end if;
 if missing <> '' then
  raise exception 'CS2_BETA_MISSING_DEPENDENCIES:%',missing;
 end if;
 if not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='profiles' and column_name='username'
 ) or not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='profiles' and column_name='avatar_url'
 ) then
  raise exception 'CS2_BETA_PROFILE_COLUMNS_MISSING';
 end if;
 raise notice 'CS2_BETA_BASE_SCHEMA_PRESENT';
end $preflight$;
