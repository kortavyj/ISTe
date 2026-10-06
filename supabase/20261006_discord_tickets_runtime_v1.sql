create table if not exists public.discord_tickets (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  channel_id text not null unique,
  opener_id text not null,
  status text not null default 'open'
    check (status in ('open','closed','deleted')),
  closed_by text,
  deleted_by text,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists discord_tickets_guild_status_idx
  on public.discord_tickets (guild_id, status);

create index if not exists discord_tickets_guild_opener_status_idx
  on public.discord_tickets (guild_id, opener_id, status);

alter table public.discord_tickets enable row level security;

comment on table public.discord_tickets is
  'Private runtime state for ISTe Discord ticket channels. Service-role access only.';
