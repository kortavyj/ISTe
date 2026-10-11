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

-- Audit assignments; no client DML privileges.
create table if not exists public.tournament_cs2_assignment_audit (
 id bigint generated always as identity primary key,
 match_id uuid not null references public.tournament_matches(id) on delete cascade,
 actor_user_id uuid references auth.users(id),
 previous_server_id uuid,
 assigned_server_id uuid not null,
 created_at timestamptz not null default now()
);
alter table public.tournament_cs2_assignment_audit enable row level security;
revoke all on public.tournament_cs2_assignment_audit from anon,authenticated;

create or replace function public.iste_assign_cs2_server(p_match_id uuid,p_server_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
 m public.tournament_matches%rowtype;
 t public.tournaments%rowtype;
 previous_id uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
 if p_match_id is null or p_server_id is null then raise exception 'INVALID_ASSIGNMENT'; end if;
 select * into m from public.tournament_matches where id=p_match_id for update;
 if not found then raise exception 'MATCH_NOT_FOUND'; end if;
 select * into t from public.tournaments where id=m.tournament_id;
 if t.owner_user_id <> auth.uid() or not exists (
  select 1 from public.user_roles u where u.user_id=auth.uid()
  and u.role='owner' and u.is_blocked is not true
 ) then raise exception 'OWNER_REQUIRED'; end if;
 if t.status <> 'active' or m.status <> 'scheduled' then raise exception 'MATCH_NOT_SCHEDULED'; end if;
 if exists(select 1 from public.tournament_cs2_events e where e.match_id=p_match_id) then
  raise exception 'MATCH_ALREADY_STARTED';
 end if;
 select server_id into previous_id from public.tournament_cs2_assignments where match_id=p_match_id;
 if previous_id is not distinct from p_server_id then return; end if;
 insert into public.tournament_cs2_assignments(match_id,server_id)
 values(p_match_id,p_server_id)
 on conflict(match_id) do update set server_id=excluded.server_id, assigned_at=now();
 insert into public.tournament_cs2_assignment_audit(match_id,actor_user_id,previous_server_id,assigned_server_id)
 values(p_match_id,auth.uid(),previous_id,p_server_id);
end $$;
revoke all on function public.iste_assign_cs2_server(uuid,uuid) from public,anon;
grant execute on function public.iste_assign_cs2_server(uuid,uuid) to authenticated;
