create table if not exists public.discord_guild_config_versions (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  owner_user_id uuid not null,
  actor_user_id uuid,
  source text not null default 'save'
    check (source in ('save','manual','restore')),
  label text not null default '',
  settings jsonb not null,
  restored_from uuid references public.discord_guild_config_versions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists discord_guild_config_versions_guild_created_idx
  on public.discord_guild_config_versions (guild_id, created_at desc);

create index if not exists discord_guild_config_versions_owner_idx
  on public.discord_guild_config_versions (owner_user_id, created_at desc);

alter table public.discord_guild_config_versions enable row level security;

comment on table public.discord_guild_config_versions is
  'Rollback snapshots for per-guild ISTe Discord Bot configuration. Service-role access only.';
