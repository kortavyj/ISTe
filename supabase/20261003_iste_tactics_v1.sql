create table if not exists public.iste_tactics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  map_id text not null
    check (map_id in ('mirage','ancient','inferno','nuke','anubis','dust2','cache')),
  visibility text not null default 'team'
    check (visibility in ('private','team')),
  board_state jsonb not null default '{"items":[],"layer":"upper"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.iste_tactics enable row level security;

create index if not exists iste_tactics_author_idx
  on public.iste_tactics (author_id, updated_at desc);

create index if not exists iste_tactics_visibility_idx
  on public.iste_tactics (visibility, updated_at desc);

create or replace function public.set_iste_tactics_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists iste_tactics_set_updated_at on public.iste_tactics;
create trigger iste_tactics_set_updated_at
before update on public.iste_tactics
for each row execute function public.set_iste_tactics_updated_at();
