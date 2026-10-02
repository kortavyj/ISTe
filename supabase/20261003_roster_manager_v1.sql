-- ISTe Roster Manager v1
-- Central source of truth for the official ISTe CS2 roster.

create extension if not exists pgcrypto;

create table if not exists public.iste_roster (
  id uuid primary key default gen_random_uuid(),
  faceit_player_id text unique,
  nickname text not null,
  display_name text not null,
  real_name text not null default '',
  roster_status text not null default 'trial'
    check (roster_status in ('main','substitute','trial','benched','inactive','left')),
  player_role text not null default 'RIFLER'
    check (player_role in ('IGL','AWP','RIFLER','ENTRY','SUPPORT','LURKER','COACH')),
  is_captain boolean not null default false,
  sort_order integer not null default 100,
  country text not null default '',
  faceit_url text not null default '',
  notes text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  public_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.iste_roster enable row level security;

create or replace function public.set_iste_roster_updated_at()
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

drop trigger if exists iste_roster_set_updated_at on public.iste_roster;
create trigger iste_roster_set_updated_at
before update on public.iste_roster
for each row execute function public.set_iste_roster_updated_at();

create index if not exists iste_roster_status_sort_idx
  on public.iste_roster (roster_status, sort_order, nickname);

insert into public.iste_roster
  (faceit_player_id, nickname, display_name, real_name, roster_status, player_role, is_captain, sort_order, country, faceit_url, notes, strengths)
values
  ('a9e3d469-bb70-4ae5-8cf3-dee726c8a82d', 'Droni452', 'DRONI', 'Никита', 'main', 'IGL', true, 10, 'ua', 'https://www.faceit.com/ru/players/Droni452', 'Капитан команды. Отвечает за коллы во время раунда, чтение игры соперника и структуру раундов.', '["Чтение игры","Макро-игра","Позитив"]'::jsonb),
  ('1c507ca5-ae1e-40b8-bce5-f8ef30cc6c9e', 'valaf', 'VALAF', 'Valentyn', 'main', 'AWP', false, 20, 'ua', 'https://www.faceit.com/ru/players/valaf', 'Основной снайпер ISTe.', '["Точность","Позиционирование","Клатчи"]'::jsonb),
  ('2f447791-fb9c-43eb-b191-a04b51a17b1d', '1sagi', '1sagi', 'Serhii', 'main', 'RIFLER', false, 30, 'mc', 'https://www.faceit.com/ru/players/1sagi', 'Агрессивный рифлер основного состава.', '["Entry-дуэли","Мультикиллы","Aim"]'::jsonb),
  ('889789da-d4b8-4bf7-8242-ac74368aee79', 'hagg1Nho', 'Hagg1CH', 'Олександр', 'main', 'SUPPORT', false, 40, 'ua', 'https://www.faceit.com/ru/players/hagg1Nho', 'Опорник команды, тайминги и lurk.', '["Контроль позиций","Lurk","Тайминги"]'::jsonb),
  ('e3a6472a-262c-4476-b17f-3901210a2c86', 'tw3ntyq', 'tw3ntyq', 'Олександр', 'main', 'RIFLER', false, 50, 'ua', 'https://www.faceit.com/ru/players/tw3ntyq', 'Надёжный рифлер, трейды и поддержка.', '["Трейды","Поддержка","Клатчи"]'::jsonb),
  ('e4e7f4b2-fe47-4b64-ba56-e9a341417626', 'sssoo', 'sssoo', '', 'substitute', 'RIFLER', false, 60, 'ua', 'https://www.faceit.com/ru/players/sssoo', 'Игрок замены ISTe.', '["Готовность","Адаптация","Командная игра"]'::jsonb),
  ('b4c511c8-5035-4094-bace-a19e14261ba0', 'FatalExcept', 'FatalExcept', '', 'substitute', 'RIFLER', false, 70, 'ua', 'https://www.faceit.com/ru/players/FatalExcept', 'Игрок замены ISTe.', '["Готовность","Адаптация","Командная игра"]'::jsonb)
on conflict (faceit_player_id) do update set
  nickname = excluded.nickname,
  display_name = excluded.display_name,
  real_name = excluded.real_name,
  roster_status = excluded.roster_status,
  player_role = excluded.player_role,
  is_captain = excluded.is_captain,
  sort_order = excluded.sort_order,
  country = excluded.country,
  faceit_url = excluded.faceit_url,
  notes = excluded.notes,
  strengths = excluded.strengths;
