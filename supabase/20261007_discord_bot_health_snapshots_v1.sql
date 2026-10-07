create table if not exists public.discord_bot_health_snapshots (
  id bigint generated always as identity primary key,
  worker_id text not null default 'discord-primary',
  ready boolean not null default false,
  ws_ping_ms integer,
  uptime_seconds integer not null default 0,
  guild_count integer not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists discord_bot_health_snapshots_captured_idx
  on public.discord_bot_health_snapshots (captured_at desc);

alter table public.discord_bot_health_snapshots enable row level security;

comment on table public.discord_bot_health_snapshots is
  'Periodic operational health snapshots for ISTe Discord Bot worker. Service-role access only.';
