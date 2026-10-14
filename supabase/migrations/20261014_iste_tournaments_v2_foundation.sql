-- ISTe Tournaments V2: Stage 2 database foundation
-- REVIEW ONLY. Do not execute against production until owner API auth and backup plan are approved.
-- Public can read published tournaments and their matches. ALL writes require a verified server-side owner API.
begin;

create table if not exists public.iste_tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  game text not null default 'CS2',
  format text not null default 'single_elimination' check (format = 'single_elimination'),
  best_of integer not null default 3 check (best_of in (1,3,5)),
  capacity integer not null default 8 check (capacity between 2 and 128 and (capacity & (capacity-1)) = 0),
  timezone text not null default 'Europe/Kyiv',
  registration_start timestamptz,
  registration_end timestamptz,
  starts_at timestamptz,
  status text not null default 'draft' check (status in ('draft','registration','checkin','live','finished','cancelled')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint iste_tournaments_registration_order check (registration_start is null or registration_end is null or registration_start < registration_end)
);

create table if not exists public.iste_tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.iste_tournaments(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  captain_user_id uuid,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn','checked_in')),
  seed integer check (seed > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists iste_tournament_teams_unique_name
  on public.iste_tournament_teams(tournament_id, lower(btrim(name)));
create unique index if not exists iste_tournament_teams_unique_seed
  on public.iste_tournament_teams(tournament_id, seed) where seed is not null;

create table if not exists public.iste_tournament_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.iste_tournament_teams(id) on delete cascade,
  user_id uuid,
  faceit_player_id text,
  role text not null default 'player' check (role in ('player','substitute','coach')),
  is_captain boolean not null default false,
  created_at timestamptz not null default now(),
  constraint iste_member_identity check (user_id is not null or faceit_player_id is not null)
);
create unique index if not exists iste_tournament_members_user_unique
  on public.iste_tournament_members(team_id,user_id) where user_id is not null;
create unique index if not exists iste_tournament_members_faceit_unique
  on public.iste_tournament_members(team_id,faceit_player_id) where faceit_player_id is not null;
create unique index if not exists iste_tournament_one_captain
  on public.iste_tournament_members(team_id) where is_captain;

create table if not exists public.iste_tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.iste_tournaments(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  match_index integer not null check (match_index >= 0),
  team_a_id uuid references public.iste_tournament_teams(id),
  team_b_id uuid references public.iste_tournament_teams(id),
  score_a integer check (score_a >= 0),
  score_b integer check (score_b >= 0),
  best_of integer not null default 3 check (best_of in (1,3,5)),
  status text not null default 'scheduled' check (status in ('scheduled','ready','live','finished','cancelled')),
  winner_team_id uuid references public.iste_tournament_teams(id),
  scheduled_at timestamptz,
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tournament_id,round_index,match_index),
  constraint iste_match_distinct_teams check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id),
  constraint iste_match_winner_present check (winner_team_id is null or winner_team_id = team_a_id or winner_team_id = team_b_id),
  constraint iste_match_winner_final check (winner_team_id is null or status = 'finished')
);

create table if not exists public.iste_tournament_maps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.iste_tournament_matches(id) on delete cascade,
  map_index integer not null check (map_index >= 1),
  map_name text not null,
  score_a integer check (score_a >= 0),
  score_b integer check (score_b >= 0),
  unique(match_id,map_index)
);

create table if not exists public.iste_tournament_audit_log (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.iste_tournaments(id) on delete set null,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Every new table is deny-by-default. Explicitly permit only published public tournament read views.
alter table public.iste_tournaments enable row level security;
alter table public.iste_tournament_teams enable row level security;
alter table public.iste_tournament_members enable row level security;
alter table public.iste_tournament_matches enable row level security;
alter table public.iste_tournament_maps enable row level security;
alter table public.iste_tournament_audit_log enable row level security;

-- Only the published tournament itself and completed/public match results are anonymously readable.
create policy iste_tournaments_public_read on public.iste_tournaments
 for select to anon, authenticated using (published_at is not null and status not in ('draft','cancelled'));
create policy iste_matches_public_read on public.iste_tournament_matches
 for select to anon, authenticated using (exists (
  select 1 from public.iste_tournaments t
  where t.id = tournament_id and t.published_at is not null and t.status not in ('draft','cancelled')
 ));
create policy iste_maps_public_read on public.iste_tournament_maps
 for select to anon, authenticated using (exists (
  select 1 from public.iste_tournament_matches m
  where m.id = match_id
 ));
-- No INSERT, UPDATE, DELETE policies or public policies for members/teams/audit.
-- Owners must authenticate through a separate server-side endpoint; do not expose service-role keys.
commit;
