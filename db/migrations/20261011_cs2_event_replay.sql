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

-- A server must be explicitly assigned to one match before any event is accepted.
create table if not exists public.tournament_cs2_assignments (
 match_id uuid primary key references public.tournament_matches(id) on delete cascade,
 server_id uuid not null,
 assigned_at timestamptz not null default now()
);
alter table public.tournament_cs2_assignments enable row level security;
revoke all on public.tournament_cs2_assignments from anon,authenticated;

-- Atomic server-to-database ingest. HTTP signature verification occurs before RPC.
-- Only service_role may invoke this function; clients cannot insert directly.
create or replace function public.iste_ingest_cs2_event(
 p_server_id uuid, p_match_id uuid, p_event_id text, p_sequence integer, p_event_type text
) returns void language plpgsql security definer set search_path = '' as $$
declare current_sequence integer;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
 if p_server_id is null or p_match_id is null or p_event_id !~ '^[a-zA-Z0-9-]{12,100}$'
    or p_sequence is null or p_sequence < 1
    or p_event_type not in ('heartbeat','map_started','round_end','map_end','series_end') then
   raise exception 'INVALID_EVENT';
 end if;
 -- Serialize ingestion for the same match; another server cannot interleave events.
 perform 1 from public.tournament_matches where id = p_match_id for update;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 if not exists(select 1 from public.tournament_cs2_assignments a
    where a.match_id=p_match_id and a.server_id=p_server_id) then
   raise exception 'SERVER_NOT_ASSIGNED';
 end if;
 if exists(select 1 from public.tournament_cs2_events e
    where e.match_id=p_match_id and e.server_id<>p_server_id) then
   raise exception 'SERVER_MISMATCH';
 end if;
 select max(e.sequence) into current_sequence
 from public.tournament_cs2_events e where e.match_id=p_match_id;
 if p_sequence <> coalesce(current_sequence,0)+1 then raise exception 'EVENT_OUT_OF_ORDER'; end if;
 insert into public.tournament_cs2_events(server_id,match_id,event_id,sequence,event_type)
 values (p_server_id,p_match_id,p_event_id,p_sequence,p_event_type);
end $$;
revoke all on function public.iste_ingest_cs2_event(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.iste_ingest_cs2_event(uuid,uuid,text,integer,text) to service_role;
