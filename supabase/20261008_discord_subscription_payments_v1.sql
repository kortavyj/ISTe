create table if not exists public.discord_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique
    references public.discord_subscription_requests(id)
    on delete cascade,
  provider text not null default 'monobank',
  invoice_id text not null unique,
  amount_minor bigint not null
    check (amount_minor > 0),
  currency integer not null default 980
    check (currency > 0),
  status text not null default 'created'
    check (
      status in (
        'created',
        'processing',
        'hold',
        'success',
        'failure',
        'reversed',
        'expired'
      )
    ),
  page_url text not null default '',
  app_url text not null default '',
  provider_modified_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discord_subscription_payments_status_updated_idx
  on public.discord_subscription_payments (status, updated_at desc);

alter table public.discord_subscription_payments enable row level security;

revoke all on table public.discord_subscription_payments from anon, authenticated;
grant select, insert, update, delete
on table public.discord_subscription_payments
to service_role;

comment on table public.discord_subscription_payments is
  'Server-side payment state for ISTe Discord subscription orders. No card credentials are stored.';
