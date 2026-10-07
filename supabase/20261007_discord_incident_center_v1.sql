create table if not exists public.discord_incidents (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  source_type text not null
    check (source_type in ('audit','security','moderation','command','ticket','manual')),
  source_id text,
  status text not null default 'open'
    check (status in ('open','reviewing','resolved')),
  severity text not null default 'warning'
    check (severity in ('info','warning','critical')),
  title text not null,
  summary text not null default '',
  subject_user_id text,
  actor_user_id text,
  channel_id text,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid,
  resolved_by uuid,
  resolution_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists discord_incidents_source_unique_idx
  on public.discord_incidents (guild_id, source_type, source_id)
  where source_id is not null;

create index if not exists discord_incidents_guild_status_idx
  on public.discord_incidents (guild_id, status, created_at desc);

alter table public.discord_incidents enable row level security;

comment on table public.discord_incidents is
  'Tracked Discord incidents promoted from ISTe audit, security, moderation, command or ticket events. Service-role access only.';

create table if not exists public.discord_incident_notes (
  id bigint generated always as identity primary key,
  incident_id uuid not null references public.discord_incidents(id) on delete cascade,
  guild_id text not null,
  author_user_id uuid,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists discord_incident_notes_incident_idx
  on public.discord_incident_notes (incident_id, created_at asc);

alter table public.discord_incident_notes enable row level security;

comment on table public.discord_incident_notes is
  'Private staff notes attached to tracked ISTe Discord incidents. Service-role access only.';
