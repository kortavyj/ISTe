alter table public.discord_subscriptions
  drop constraint if exists discord_subscriptions_plan_check;

alter table public.discord_subscriptions
  add constraint discord_subscriptions_plan_check
  check (
    plan in (
      'free',
      'starter',
      'pro',
      'max',
      'organization',
      'internal'
    )
  );

alter table public.discord_guild_licenses
  drop constraint if exists discord_guild_licenses_plan_check;

alter table public.discord_guild_licenses
  add constraint discord_guild_licenses_plan_check
  check (
    plan in (
      'free',
      'starter',
      'pro',
      'max',
      'organization',
      'internal'
    )
  );

create table if not exists public.discord_subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  plan text not null,
  starts_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discord_subscription_events_user_idx
  on public.discord_subscription_events (
    user_id,
    created_at desc
  );

alter table public.discord_subscription_events
  enable row level security;

revoke all on table public.discord_subscription_events
  from anon, authenticated;
