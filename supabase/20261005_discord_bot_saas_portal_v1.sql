create table if not exists public.discord_customer_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text unique not null,
  discord_username text not null default '',
  discord_global_name text not null default '',
  discord_avatar text not null default '',
  linked_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

create table if not exists public.discord_customer_guilds (
  user_id uuid not null references auth.users(id) on delete cascade,
  guild_id text not null,
  guild_name text not null default '',
  guild_icon text not null default '',
  permissions text not null default '0',
  is_owner boolean not null default false,
  can_manage boolean not null default false,
  last_synced_at timestamptz not null default now(),
  primary key (user_id, guild_id)
);

create table if not exists public.discord_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'free',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  max_guilds integer not null default 1,
  subscriber_role_synced boolean not null default false,
  subscriber_role_expires_at timestamptz,
  provider text not null default '',
  provider_customer_id text not null default '',
  provider_subscription_id text not null default '',
  updated_at timestamptz not null default now(),
  constraint discord_subscriptions_plan_check
    check (plan in ('free','starter','pro','organization','internal')),
  constraint discord_subscriptions_status_check
    check (status in ('free','active','past_due','cancelled','expired','internal')),
  constraint discord_subscriptions_max_guilds_check
    check (max_guilds between 1 and 50)
);

create table if not exists public.discord_guild_licenses (
  guild_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint discord_guild_licenses_plan_check
    check (plan in ('free','starter','pro','organization','internal')),
  constraint discord_guild_licenses_status_check
    check (status in ('active','expired','suspended','internal'))
);

create table if not exists public.discord_guild_settings (
  guild_id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null default 'uk',
  admin_role_id text not null default '',
  moderator_role_id text not null default '',
  member_role_id text not null default '',
  log_channel_id text not null default '',
  welcome_channel_id text not null default '',
  welcome_enabled boolean not null default false,
  moderation_enabled boolean not null default false,
  tickets_enabled boolean not null default false,
  private_voice_enabled boolean not null default false,
  auto_roles_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint discord_guild_settings_locale_check
    check (locale in ('uk','en'))
);

create table if not exists public.discord_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists discord_customer_guilds_manage_idx
  on public.discord_customer_guilds (user_id, can_manage, guild_name);

create index if not exists discord_guild_licenses_user_idx
  on public.discord_guild_licenses (user_id, status, updated_at desc);

create index if not exists discord_oauth_states_expiry_idx
  on public.discord_oauth_states (expires_at);

alter table public.discord_customer_accounts enable row level security;
alter table public.discord_customer_guilds enable row level security;
alter table public.discord_subscriptions enable row level security;
alter table public.discord_guild_licenses enable row level security;
alter table public.discord_guild_settings enable row level security;
alter table public.discord_oauth_states enable row level security;

revoke all on table public.discord_customer_accounts from anon, authenticated;
revoke all on table public.discord_customer_guilds from anon, authenticated;
revoke all on table public.discord_subscriptions from anon, authenticated;
revoke all on table public.discord_guild_licenses from anon, authenticated;
revoke all on table public.discord_guild_settings from anon, authenticated;
revoke all on table public.discord_oauth_states from anon, authenticated;
