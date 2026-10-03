-- ISTe Roster Manager v2
-- Player portraits, social links and FACEIT statistic fallbacks.

alter table public.iste_roster
  add column if not exists portrait_url text not null default '',
  add column if not exists socials jsonb not null default '[]'::jsonb,
  add column if not exists faceit_level_override smallint,
  add column if not exists faceit_elo_override integer,
  add column if not exists faceit_win_rate_override numeric(5,2),
  add column if not exists faceit_kd_override numeric(5,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'iste_roster_level_override_check'
  ) then
    alter table public.iste_roster
      add constraint iste_roster_level_override_check
      check (
        faceit_level_override is null
        or faceit_level_override between 1 and 10
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'iste_roster_elo_override_check'
  ) then
    alter table public.iste_roster
      add constraint iste_roster_elo_override_check
      check (
        faceit_elo_override is null
        or faceit_elo_override between 0 and 10000
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'iste_roster_win_rate_override_check'
  ) then
    alter table public.iste_roster
      add constraint iste_roster_win_rate_override_check
      check (
        faceit_win_rate_override is null
        or faceit_win_rate_override between 0 and 100
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'iste_roster_kd_override_check'
  ) then
    alter table public.iste_roster
      add constraint iste_roster_kd_override_check
      check (
        faceit_kd_override is null
        or faceit_kd_override between 0 and 10
      );
  end if;
end
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'iste-roster',
  'iste-roster',
  true,
  1572864,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
