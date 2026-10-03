create table if not exists public.iste_highlights (
  id uuid primary key default gen_random_uuid(),
  title_uk text not null,
  title_en text not null,
  description_uk text not null default '',
  description_en text not null default '',
  video_url text not null,
  thumbnail_url text not null default '',
  highlight_type text not null default 'highlight',
  player_faceit_id text not null default '',
  player_name text not null default '',
  match_label text not null default '',
  match_date timestamptz,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint iste_highlights_type_check
    check (
      highlight_type in (
        'highlight',
        'clutch',
        'ace',
        'mvp',
        'best_moments'
      )
    ),
  constraint iste_highlights_sort_order_check
    check (
      sort_order between -1000 and 1000
    )
);

alter table public.iste_highlights
  enable row level security;

create index if not exists iste_highlights_public_idx
  on public.iste_highlights (
    published,
    featured desc,
    sort_order asc,
    created_at desc
  );

create index if not exists iste_highlights_player_idx
  on public.iste_highlights (
    player_faceit_id,
    published,
    created_at desc
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'iste-highlights',
  'iste-highlights',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.iste_highlights is
  'Published and draft ISTe esports highlights managed by owner/admin.';
