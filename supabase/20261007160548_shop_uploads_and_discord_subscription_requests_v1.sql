insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'iste-shop-products',
  'iste-shop-products',
  true,
  3145728,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.discord_subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discord_user_id text not null,
  plan text not null,
  status text not null default 'pending',
  source text not null default 'discord',
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  constraint discord_subscription_requests_discord_user_id_check
    check (discord_user_id ~ '^[0-9]{17,20}$'),
  constraint discord_subscription_requests_plan_check
    check (plan in ('starter','pro','max')),
  constraint discord_subscription_requests_status_check
    check (status in ('pending','approved','rejected','cancelled')),
  constraint discord_subscription_requests_source_check
    check (source in ('discord','site','admin'))
);

create unique index if not exists discord_subscription_requests_one_pending_per_user_idx
  on public.discord_subscription_requests (user_id)
  where status = 'pending';

create index if not exists discord_subscription_requests_status_requested_at_idx
  on public.discord_subscription_requests (status, requested_at desc);

alter table public.discord_subscription_requests enable row level security;

revoke all on table public.discord_subscription_requests from anon, authenticated;
grant select, insert, update, delete on table public.discord_subscription_requests to service_role;
