create table if not exists public.discord_moderation_cases (
  id bigint generated always as identity primary key,
  guild_id text not null,
  target_user_id text not null,
  moderator_user_id text not null default '',
  action text not null
    check (action in ('warn','unwarn','timeout','kick','ban','unban')),
  reason text not null default '',
  duration_minutes integer,
  status text not null default 'active'
    check (status in ('active','completed','revoked')),
  related_case_id bigint references public.discord_moderation_cases(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists discord_moderation_cases_guild_created_idx
  on public.discord_moderation_cases (guild_id, created_at desc);

create index if not exists discord_moderation_cases_guild_target_idx
  on public.discord_moderation_cases (guild_id, target_user_id, created_at desc);

create index if not exists discord_moderation_cases_active_warn_idx
  on public.discord_moderation_cases (guild_id, target_user_id, status, action);

alter table public.discord_moderation_cases enable row level security;

comment on table public.discord_moderation_cases is
  'Persistent ISTe Discord moderation case history. Service-role access only.';
