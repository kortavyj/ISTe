begin;

create sequence if not exists public.profile_account_number_seq
  as bigint
  increment by 1
  minvalue 1
  start with 1
  cache 20;

alter table public.profiles
  add column if not exists account_number bigint;

lock table public.profiles in share row exclusive mode;

update public.profiles
set account_number = nextval('public.profile_account_number_seq'::regclass)
where account_number is null;

select setval(
  'public.profile_account_number_seq'::regclass,
  greatest(coalesce(max(account_number), 0) + 1, 1),
  false
)
from public.profiles;

create unique index if not exists profiles_account_number_key
  on public.profiles (account_number);

alter table public.profiles
  alter column account_number set not null;

create or replace function public.protect_profile_account_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.account_number :=
      nextval('public.profile_account_number_seq'::regclass);
  elsif new.account_number is distinct from old.account_number then
    new.account_number := old.account_number;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_account_number
  on public.profiles;

create trigger protect_profile_account_number
before insert or update of account_number
on public.profiles
for each row
execute function public.protect_profile_account_number();

create or replace function public.format_account_id(
  p_account_number bigint
)
returns text
language sql
immutable
strict
set search_path = public
as $$
  select 'ISTE ' || lpad(p_account_number::text, 6, '0');
$$;

create or replace function public.find_profile_by_account_id(
  p_account_id text
)
returns table (
  account_id text,
  account_number bigint,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_id text;
  requested_number bigint;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and is_blocked = true
  ) then
    raise exception 'ACCOUNT_BLOCKED'
      using errcode = '42501';
  end if;

  normalized_id :=
    regexp_replace(coalesce(p_account_id, ''), '[^0-9]', '', 'g');

  if normalized_id = ''
     or length(normalized_id) > 18 then
    return;
  end if;

  requested_number := normalized_id::bigint;

  return query
  select
    public.format_account_id(profile.account_number),
    profile.account_number,
    profile.username,
    profile.display_name,
    profile.avatar_url,
    profile.bio,
    profile.created_at
  from public.profiles as profile
  left join public.user_roles as access
    on access.user_id = profile.id
  where profile.account_number = requested_number
    and coalesce(access.is_blocked, false) = false
  limit 1;
end;
$$;

revoke all
on function public.find_profile_by_account_id(text)
from public;

revoke all
on function public.find_profile_by_account_id(text)
from anon;

grant execute
on function public.find_profile_by_account_id(text)
to authenticated;

comment on column public.profiles.account_number is
  'Stable public account number shown as ISTE 000001.';

comment on function public.find_profile_by_account_id(text) is
  'Exact authenticated profile search that returns public profile fields only.';

commit;
