create table if not exists public.discord_security_events (
  id bigint generated always as identity primary key,
  guild_id text not null,
  user_id text,
  event_type text not null,
  severity text not null default 'info'
    check (severity in ('info','warning','critical')),
  action_taken text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discord_security_events_guild_created_idx
  on public.discord_security_events (guild_id, created_at desc);

create index if not exists discord_security_events_guild_type_idx
  on public.discord_security_events (guild_id, event_type, created_at desc);

alter table public.discord_security_events enable row level security;

comment on table public.discord_security_events is
  'Security and raid-protection events for ISTe Discord Bot. Service-role access only.';
