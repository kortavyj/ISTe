-- Isolated CS2 beta compatibility with existing ISTe account/session API.
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists account_number bigint;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
