-- Store bracket fixtures generated when the organizer starts a tournament.
create table if not exists public.tournament_matches (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 round_number integer not null check (round_number >= 1),
 match_number integer not null check (match_number >= 1),
 team_a_id uuid,
 team_b_id uuid,
 winner_team_id uuid,
 constraint match_team_a_same_tournament foreign key (tournament_id, team_a_id) references public.tournament_teams(tournament_id,id),
 constraint match_team_b_same_tournament foreign key (tournament_id, team_b_id) references public.tournament_teams(tournament_id,id),
 constraint match_winner_same_tournament foreign key (tournament_id, winner_team_id) references public.tournament_teams(tournament_id,id),
 constraint match_teams_distinct check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id),
 status text not null default 'pending' check (status in ('pending','scheduled','live','completed','bye','disputed')),
 score_a integer check (score_a between 0 and 100),
 score_b integer check (score_b between 0 and 100),
 created_at timestamptz not null default now(),
 unique (tournament_id,round_number,match_number)
);
create index if not exists tournament_matches_tournament_idx on public.tournament_matches(tournament_id,round_number,match_number);
alter table public.tournament_matches enable row level security;
drop policy if exists "Public view tournament fixtures" on public.tournament_matches;
create policy "Public view tournament fixtures" on public.tournament_matches
for select to anon,authenticated using (
 exists(select 1 from public.tournaments t where t.id=tournament_id
 and (t.published_at is not null or t.owner_user_id=(select auth.uid())))
);
-- Mutation via authenticated server endpoint only; no direct client write policies.
