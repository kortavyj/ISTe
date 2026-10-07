create table if not exists public.discord_subscription_provider_events (
  event_id text primary key,
  provider text not null default 'paddle',
  event_type text not null,
  occurred_at timestamptz,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  attempts integer not null default 1
    check (attempts > 0),
  payload jsonb not null default '{}'::jsonb,
  error text not null default '',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discord_subscription_provider_events_status_idx
  on public.discord_subscription_provider_events(provider, status, updated_at desc);

alter table public.discord_subscription_provider_events enable row level security;

revoke all on table public.discord_subscription_provider_events from anon;
revoke all on table public.discord_subscription_provider_events from authenticated;
grant select, insert, update, delete on table public.discord_subscription_provider_events to service_role;

comment on table public.discord_subscription_provider_events is
  'Server-only idempotency and audit log for signed subscription provider webhooks.';
