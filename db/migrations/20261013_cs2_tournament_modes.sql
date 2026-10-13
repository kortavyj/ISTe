-- Additional tournament rule settings. Existing tournaments remain 5vs5 with standard weapons.
alter table public.tournaments
  add column if not exists team_size integer not null default 5,
  add column if not exists weapon_mode text not null default 'standard';

alter table public.tournaments
  add constraint tournaments_team_size_valid check (team_size in (1, 2, 5)),
  add constraint tournaments_weapon_mode_valid check (weapon_mode in ('standard', 'awp', 'pistols', 'deagle'));

comment on column public.tournaments.team_size is 'Number of active players per team: 1, 2 or 5. Duel formats prohibit substitutes.';
comment on column public.tournaments.weapon_mode is 'Tournament weapon restriction. Game server enforcement requires CS2 integration.';
