create table if not exists public.discord_staff_role_permissions (
  guild_id text not null,
  role_id text not null,
  label text not null default '',
  permission_keys text[] not null default '{}'::text[],
  enabled boolean not null default true,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (guild_id, role_id)
);

create index if not exists discord_staff_role_permissions_guild_idx
  on public.discord_staff_role_permissions (guild_id, enabled);

alter table public.discord_staff_role_permissions enable row level security;

revoke all on table public.discord_staff_role_permissions from anon, authenticated;

grant select, insert, update, delete
on table public.discord_staff_role_permissions
to service_role;

comment on table public.discord_staff_role_permissions is
  'Owner-defined website Control Center permissions granted through live Discord guild roles. Service-role access only.';

create table if not exists public.discord_staff_access_audit (
  id bigint generated always as identity primary key,
  guild_id text not null,
  website_user_id uuid,
  discord_user_id text,
  action text not null,
  permission_key text,
  decision text not null
    check (decision in ('allowed','denied')),
  matched_role_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists discord_staff_access_audit_guild_created_idx
  on public.discord_staff_access_audit (guild_id, created_at desc);

alter table public.discord_staff_access_audit enable row level security;

revoke all on table public.discord_staff_access_audit from anon, authenticated;

grant select, insert, update, delete
on table public.discord_staff_access_audit
to service_role;

comment on table public.discord_staff_access_audit is
  'Audit trail for delegated ISTe Discord Control Center access decisions. Service-role access only.';
