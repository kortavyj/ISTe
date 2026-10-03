create table if not exists public.iste_tactic_shares (
  id uuid primary key default gen_random_uuid(),
  tactic_id uuid not null references public.iste_tactics(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.iste_tactic_shares enable row level security;

create index if not exists iste_tactic_shares_tactic_idx
  on public.iste_tactic_shares (tactic_id, created_at desc);

create index if not exists iste_tactic_shares_active_idx
  on public.iste_tactic_shares (tactic_id, revoked_at, expires_at);

comment on table public.iste_tactic_shares is
  'Private view-only share links for ISTe Tactical Board. Access is mediated by server handlers using high-entropy tokens.';
