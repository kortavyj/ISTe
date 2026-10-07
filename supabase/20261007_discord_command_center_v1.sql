create table if not exists public.discord_command_settings (
  guild_id text not null,
  command_name text not null,
  enabled boolean not null default true,
  allowed_role_ids text[] not null default '{}'::text[],
  allowed_channel_ids text[] not null default '{}'::text[],
  cooldown_seconds integer not null default 0
    check (cooldown_seconds between 0 and 86400),
  updated_by uuid,
  updated_at timestamptz not null default now(),
  primary key (guild_id, command_name)
);

create index if not exists discord_command_settings_guild_idx
  on public.discord_command_settings (guild_id, command_name);

alter table public.discord_command_settings enable row level security;

comment on table public.discord_command_settings is
  'Per-guild runtime policy for ISTe Discord slash commands. Service-role access only.';

create table if not exists public.discord_command_usage (
  id bigint generated always as identity primary key,
  guild_id text not null,
  command_name text not null,
  user_id text not null,
  channel_id text,
  outcome text not null default 'allowed'
    check (outcome in ('allowed','denied','error')),
  denied_reason text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists discord_command_usage_guild_created_idx
  on public.discord_command_usage (guild_id, created_at desc);

create index if not exists discord_command_usage_cooldown_idx
  on public.discord_command_usage (
    guild_id,
    command_name,
    user_id,
    created_at desc
  );

alter table public.discord_command_usage enable row level security;

comment on table public.discord_command_usage is
  'ISTe Discord slash command invocation and policy outcome journal. Service-role access only.';
