create table if not exists public.faceit_extension_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  oauth_state text not null unique,
  claim_secret_hash text not null unique,
  code_verifier text not null,
  status text not null default 'pending'
    check (status in ('pending','authenticated','error','expired','revoked')),
  faceit_user_id text,
  faceit_nickname text,
  faceit_picture text,
  faceit_locale text,
  session_expires_at timestamptz,
  last_error text,
  authenticated_at timestamptz,
  last_used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faceit_extension_auth_sessions_status_expires_idx
  on public.faceit_extension_auth_sessions (status, expires_at);

create index if not exists faceit_extension_auth_sessions_claim_hash_idx
  on public.faceit_extension_auth_sessions (claim_secret_hash);

create index if not exists faceit_extension_auth_sessions_user_idx
  on public.faceit_extension_auth_sessions (faceit_user_id, updated_at desc);

alter table public.faceit_extension_auth_sessions enable row level security;

revoke all on table public.faceit_extension_auth_sessions from anon;
revoke all on table public.faceit_extension_auth_sessions from authenticated;
grant all on table public.faceit_extension_auth_sessions to service_role;
