-- ISTe CS2 tournaments foundation
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  title text not null check (char_length(title) between 4 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  format text not null default 'single_elimination' check (format = 'single_elimination'),
  best_of integer not null default 1 check (best_of in (1,3)),
  max_teams integer not null default 16 check (max_teams between 2 and 64),
  status text not null default 'draft' check (status in ('draft','registration','active','completed','cancelled')),
  starts_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft' and published_at is null) or (status <> 'draft' and published_at is not null))
);
create index if not exists tournaments_owner_created_idx on public.tournaments (owner_user_id, created_at desc);
create index if not exists tournaments_public_idx on public.tournaments (status, starts_at) where published_at is not null;

alter table public.tournaments enable row level security;

drop policy if exists "Public can read published tournaments" on public.tournaments;
create policy "Public can read published tournaments" on public.tournaments
for select to anon, authenticated
using (published_at is not null or owner_user_id = (select auth.uid()));

drop policy if exists "Users can create their tournaments" on public.tournaments;
create policy "Users can create their tournaments" on public.tournaments
for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and status = 'draft'
  and published_at is null
  and coalesce(auth.jwt()->>'aal','') = 'aal2'
  and exists (select 1 from public.user_roles role_guard
    where role_guard.user_id = (select auth.uid()) and role_guard.role = 'owner'
      and role_guard.is_blocked is not true)
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.is_blocked is true
  )
);

-- State changes are intentionally unavailable through the Data API.
-- They must be executed by privileged, audited SECURITY DEFINER RPCs.
revoke update on public.tournaments from anon, authenticated;
