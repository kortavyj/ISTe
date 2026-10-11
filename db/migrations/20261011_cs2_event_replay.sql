-- Persistent MatchZy replay defense, deployed only after explicit production approval.
-- The future HTTP handler must verify HMAC before invoking the service-only ingest RPC.
create table if not exists public.tournament_cs2_events (
 id bigint generated always as identity primary key,
 server_id uuid not null,
 match_id uuid not null references public.tournament_matches(id) on delete cascade,
 event_id text not null check (event_id ~ '^[a-zA-Z0-9-]{12,100}$'),
 sequence integer not null check (sequence > 0),
 event_type text not null check (event_type in ('heartbeat','map_started','round_end','map_end','series_end')),
 received_at timestamptz not null default now(),
 unique(server_id,event_id),
 unique(server_id,match_id,sequence)
);
alter table public.tournament_cs2_events enable row level security;
revoke all on public.tournament_cs2_events from anon,authenticated;
-- Require the server-side ingest implementation to use a narrowly secured database
-- credential and enforce an atomic check under a match-scoped row lock.
