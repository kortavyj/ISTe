-- ISTe Discord voice activity, member reports, and personal room statuses.
-- Apply through a reviewed Supabase migration before enabling runtime code.

create table if not exists public.discord_voice_sessions (
  id bigint generated always as identity primary key,
  guild_id text not null,
  user_id text not null,
  channel_id text not null,
  category_id text not null default '',
  joined_at timestamptz not null,
  left_at timestamptz,
  duration_seconds bigint generated always as (
    case when left_at is null then null
      else greatest(0, floor(extract(epoch from (left_at - joined_at)))::bigint)
    end
  ) stored,
  constraint discord_voice_sessions_time_check
    check (left_at is null or left_at >= joined_at)
);

create unique index if not exists discord_voice_sessions_one_active_per_guild_user
  on public.discord_voice_sessions (guild_id, user_id)
  where left_at is null;
create index if not exists discord_voice_sessions_guild_period
  on public.discord_voice_sessions (guild_id, joined_at desc);
create index if not exists discord_voice_sessions_category_period
  on public.discord_voice_sessions (guild_id, category_id, joined_at desc);

create table if not exists public.discord_voice_worker_heartbeats (
  guild_id text primary key,
  last_seen_at timestamptz not null default now()
);
alter table public.discord_voice_worker_heartbeats enable row level security;
comment on table public.discord_voice_worker_heartbeats is
  'Last confirmed heartbeat for voice presence worker; service-role access only.';

create table if not exists public.discord_member_reports (
  id bigint generated always as identity primary key,
  guild_id text not null,
  reporter_user_id text not null,
  target_user_id text not null,
  reason text not null check (char_length(btrim(reason)) between 10 and 2000),
  evidence_url text,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint discord_member_reports_not_self check (reporter_user_id <> target_user_id)
);
-- Database-enforced cooldown. A per-reporter advisory transaction lock makes
-- simultaneous requests serialize; only successful inserts consume the cooldown.
create or replace function public.discord_submit_member_report(
  p_guild_id text,
  p_reporter_user_id text,
  p_target_user_id text,
  p_reason text,
  p_evidence_url text default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $
declare
  v_id bigint;
begin
  if p_guild_id !~ '^[0-9]{17,20}
  on public.discord_member_reports (guild_id, status, created_at desc);
create index if not exists discord_member_reports_target
  on public.discord_member_reports (guild_id, target_user_id, created_at desc);

create table if not exists public.discord_voice_room_statuses (
  channel_id text primary key,
  guild_id text not null,
  category_id text not null,
  owner_user_id text not null,
  status_key text not null default 'none'
    check (status_key in ('none', 'cs2', 'dota2', 'pubg', 'minecraft', 'faceit', 'looking_one', 'training', 'do_not_disturb', 'chill')),
  updated_at timestamptz not null default now()
);
create index if not exists discord_voice_room_statuses_guild_owner
  on public.discord_voice_room_statuses (guild_id, owner_user_id);

alter table public.discord_voice_sessions enable row level security;
alter table public.discord_member_reports enable row level security;
alter table public.discord_voice_room_statuses enable row level security;

comment on table public.discord_voice_sessions is
  'Voice session ledger; server writes only. Recover dangling sessions after reconnect or restart.';
comment on table public.discord_member_reports is
  'Private member reports, visible only to approved moderators via a server-side service role.';
comment on table public.discord_voice_room_statuses is
  'Persistent per-room status selection, removed when the temporary room is deleted.';

-- Aggregate completed and currently active sessions, splitting each at period start.
-- Executed by the server-only runtime with service role credentials.
create or replace function public.discord_voice_leaderboard(
  p_guild_id text,
  p_since timestamptz default null,
  p_category_id text default null,
  p_limit integer default 10
)
returns table(user_id text, seconds bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with spans as (
    select s.user_id,
      greatest(s.joined_at, coalesce(p_since, s.joined_at)) as started,
      case when s.left_at is not null then s.left_at
        else least(
          now(),
          greatest(s.joined_at, coalesce(h.last_seen_at, s.joined_at))
            + interval '90 seconds'
        )
      end as ended
    from public.discord_voice_sessions s
    left join public.discord_voice_worker_heartbeats h
      on h.guild_id = s.guild_id
    where s.guild_id = p_guild_id
      and (p_category_id is null or s.category_id = p_category_id)
  )
  select spans.user_id,
    sum(greatest(0, floor(extract(epoch from
      (spans.ended - spans.started)))::bigint))::bigint as seconds
  from spans
  group by spans.user_id
  having sum(greatest(0, floor(extract(epoch from
    (spans.ended - spans.started)))::bigint)) > 0
  order by seconds desc, spans.user_id
  limit least(greatest(coalesce(p_limit, 10), 1), 25);
$$;
revoke all on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  from public, anon, authenticated;
grant execute on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  to service_role;

    or p_reporter_user_id !~ '^[0-9]{17,20}
  on public.discord_member_reports (guild_id, status, created_at desc);
create index if not exists discord_member_reports_target
  on public.discord_member_reports (guild_id, target_user_id, created_at desc);

create table if not exists public.discord_voice_room_statuses (
  channel_id text primary key,
  guild_id text not null,
  category_id text not null,
  owner_user_id text not null,
  status_key text not null default 'none'
    check (status_key in ('none', 'faceit', 'looking_one', 'training', 'do_not_disturb', 'chill')),
  updated_at timestamptz not null default now()
);
create index if not exists discord_voice_room_statuses_guild_owner
  on public.discord_voice_room_statuses (guild_id, owner_user_id);

alter table public.discord_voice_sessions enable row level security;
alter table public.discord_member_reports enable row level security;
alter table public.discord_voice_room_statuses enable row level security;

comment on table public.discord_voice_sessions is
  'Voice session ledger; server writes only. Recover dangling sessions after reconnect or restart.';
comment on table public.discord_member_reports is
  'Private member reports, visible only to approved moderators via a server-side service role.';
comment on table public.discord_voice_room_statuses is
  'Persistent per-room status selection, removed when the temporary room is deleted.';

-- Aggregate completed and currently active sessions, splitting each at period start.
-- Executed by the server-only runtime with service role credentials.
create or replace function public.discord_voice_leaderboard(
  p_guild_id text,
  p_since timestamptz default null,
  p_category_id text default null,
  p_limit integer default 10
)
returns table(user_id text, seconds bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with spans as (
    select s.user_id,
      greatest(s.joined_at, coalesce(p_since, s.joined_at)) as started,
      case when s.left_at is not null then s.left_at
        else least(
          now(),
          greatest(s.joined_at, coalesce(h.last_seen_at, s.joined_at))
            + interval '90 seconds'
        )
      end as ended
    from public.discord_voice_sessions s
    left join public.discord_voice_worker_heartbeats h
      on h.guild_id = s.guild_id
    where s.guild_id = p_guild_id
      and (p_category_id is null or s.category_id = p_category_id)
  )
  select spans.user_id,
    sum(greatest(0, floor(extract(epoch from
      (spans.ended - spans.started)))::bigint))::bigint as seconds
  from spans
  group by spans.user_id
  having sum(greatest(0, floor(extract(epoch from
    (spans.ended - spans.started)))::bigint)) > 0
  order by seconds desc, spans.user_id
  limit least(greatest(coalesce(p_limit, 10), 1), 25);
$$;
revoke all on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  from public, anon, authenticated;
grant execute on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  to service_role;

    or p_target_user_id !~ '^[0-9]{17,20}
  on public.discord_member_reports (guild_id, status, created_at desc);
create index if not exists discord_member_reports_target
  on public.discord_member_reports (guild_id, target_user_id, created_at desc);

create table if not exists public.discord_voice_room_statuses (
  channel_id text primary key,
  guild_id text not null,
  category_id text not null,
  owner_user_id text not null,
  status_key text not null default 'none'
    check (status_key in ('none', 'faceit', 'looking_one', 'training', 'do_not_disturb', 'chill')),
  updated_at timestamptz not null default now()
);
create index if not exists discord_voice_room_statuses_guild_owner
  on public.discord_voice_room_statuses (guild_id, owner_user_id);

alter table public.discord_voice_sessions enable row level security;
alter table public.discord_member_reports enable row level security;
alter table public.discord_voice_room_statuses enable row level security;

comment on table public.discord_voice_sessions is
  'Voice session ledger; server writes only. Recover dangling sessions after reconnect or restart.';
comment on table public.discord_member_reports is
  'Private member reports, visible only to approved moderators via a server-side service role.';
comment on table public.discord_voice_room_statuses is
  'Persistent per-room status selection, removed when the temporary room is deleted.';

-- Aggregate completed and currently active sessions, splitting each at period start.
-- Executed by the server-only runtime with service role credentials.
create or replace function public.discord_voice_leaderboard(
  p_guild_id text,
  p_since timestamptz default null,
  p_category_id text default null,
  p_limit integer default 10
)
returns table(user_id text, seconds bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with spans as (
    select s.user_id,
      greatest(s.joined_at, coalesce(p_since, s.joined_at)) as started,
      case when s.left_at is not null then s.left_at
        else least(
          now(),
          greatest(s.joined_at, coalesce(h.last_seen_at, s.joined_at))
            + interval '90 seconds'
        )
      end as ended
    from public.discord_voice_sessions s
    left join public.discord_voice_worker_heartbeats h
      on h.guild_id = s.guild_id
    where s.guild_id = p_guild_id
      and (p_category_id is null or s.category_id = p_category_id)
  )
  select spans.user_id,
    sum(greatest(0, floor(extract(epoch from
      (spans.ended - spans.started)))::bigint))::bigint as seconds
  from spans
  group by spans.user_id
  having sum(greatest(0, floor(extract(epoch from
    (spans.ended - spans.started)))::bigint)) > 0
  order by seconds desc, spans.user_id
  limit least(greatest(coalesce(p_limit, 10), 1), 25);
$$;
revoke all on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  from public, anon, authenticated;
grant execute on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  to service_role;

    or p_reporter_user_id = p_target_user_id
    or length(btrim(p_reason)) not between 10 and 2000 then
    raise exception 'INVALID_REPORT' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_guild_id || ':' || p_reporter_user_id, 0)
  );

  if exists (
    select 1 from public.discord_member_reports
    where guild_id = p_guild_id
      and reporter_user_id = p_reporter_user_id
      and created_at > now() - interval '1 minute'
  ) then
    raise exception 'REPORT_COOLDOWN' using errcode = 'P0001';
  end if;

  insert into public.discord_member_reports
    (guild_id, reporter_user_id, target_user_id, reason, evidence_url)
  values (p_guild_id, p_reporter_user_id, p_target_user_id,
    btrim(p_reason), nullif(btrim(p_evidence_url), ''))
  returning id into v_id;
  return v_id;
end;
$;
revoke all on function public.discord_submit_member_report(text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.discord_submit_member_report(text,text,text,text,text)
  to service_role;

create index if not exists discord_member_reports_guild_status_created
  on public.discord_member_reports (guild_id, status, created_at desc);
create index if not exists discord_member_reports_target
  on public.discord_member_reports (guild_id, target_user_id, created_at desc);

create table if not exists public.discord_voice_room_statuses (
  channel_id text primary key,
  guild_id text not null,
  category_id text not null,
  owner_user_id text not null,
  status_key text not null default 'none'
    check (status_key in ('none', 'faceit', 'looking_one', 'training', 'do_not_disturb', 'chill')),
  updated_at timestamptz not null default now()
);
create index if not exists discord_voice_room_statuses_guild_owner
  on public.discord_voice_room_statuses (guild_id, owner_user_id);

alter table public.discord_voice_sessions enable row level security;
alter table public.discord_member_reports enable row level security;
alter table public.discord_voice_room_statuses enable row level security;

comment on table public.discord_voice_sessions is
  'Voice session ledger; server writes only. Recover dangling sessions after reconnect or restart.';
comment on table public.discord_member_reports is
  'Private member reports, visible only to approved moderators via a server-side service role.';
comment on table public.discord_voice_room_statuses is
  'Persistent per-room status selection, removed when the temporary room is deleted.';

-- Aggregate completed and currently active sessions, splitting each at period start.
-- Executed by the server-only runtime with service role credentials.
create or replace function public.discord_voice_leaderboard(
  p_guild_id text,
  p_since timestamptz default null,
  p_category_id text default null,
  p_limit integer default 10
)
returns table(user_id text, seconds bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with spans as (
    select s.user_id,
      greatest(s.joined_at, coalesce(p_since, s.joined_at)) as started,
      case when s.left_at is not null then s.left_at
        else least(
          now(),
          greatest(s.joined_at, coalesce(h.last_seen_at, s.joined_at))
            + interval '90 seconds'
        )
      end as ended
    from public.discord_voice_sessions s
    left join public.discord_voice_worker_heartbeats h
      on h.guild_id = s.guild_id
    where s.guild_id = p_guild_id
      and (p_category_id is null or s.category_id = p_category_id)
  )
  select spans.user_id,
    sum(greatest(0, floor(extract(epoch from
      (spans.ended - spans.started)))::bigint))::bigint as seconds
  from spans
  group by spans.user_id
  having sum(greatest(0, floor(extract(epoch from
    (spans.ended - spans.started)))::bigint)) > 0
  order by seconds desc, spans.user_id
  limit least(greatest(coalesce(p_limit, 10), 1), 25);
$$;
revoke all on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  from public, anon, authenticated;
grant execute on function public.discord_voice_leaderboard(text,timestamptz,text,integer)
  to service_role;
