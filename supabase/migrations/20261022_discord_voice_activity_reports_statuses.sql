-- ISTe Discord voice activity, member reports, and personal room statuses.
-- Apply through a reviewed Supabase migration before enabling runtime code.

create table if not exists public.discord_voice_sessions (
  id bigint generated always as identity primary key,
  guild_id text not null,
  user_id text not null,
  channel_id text not null,
  category_id text not null,
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
