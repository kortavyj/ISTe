-- CS2 1v1 / 2v2 / 5v5 formats and restricted weapon rule metadata.
alter table public.tournaments add column if not exists team_size integer not null default 5;
alter table public.tournaments add column if not exists weapon_rule text not null default 'standard';
alter table public.tournaments add constraint iste_team_size_allowed check (team_size in (1,2,5));
alter table public.tournaments add constraint iste_weapon_rule_allowed check (weapon_rule in ('standard','awp_only','pistols_only','rifles_only'));
alter table public.tournaments add constraint iste_weapon_rule_team_size check (team_size in (1,2) or weapon_rule='standard');