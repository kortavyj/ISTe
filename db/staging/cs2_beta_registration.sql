-- Isolated ISTe CS2 beta: nickname registration dependencies.
alter table public.profiles add column if not exists display_name text;
create unique index if not exists profiles_username_lower_unique_idx
 on public.profiles (lower(username)) where username is not null;
create or replace function public.is_username_available(candidate_username text)
returns boolean language sql stable security definer set search_path = '' as $body$
 select candidate_username is not null
 and candidate_username ~ '^[A-Za-z0-9_]{3,32}$'
 and not exists(select 1 from public.profiles p where lower(p.username)=lower(candidate_username));
$body$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated, service_role;

create or replace function public.cs2_beta_create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $body$
declare n text := nullif(trim(new.raw_user_meta_data->>'username'),'');
declare d text := nullif(trim(new.raw_user_meta_data->>'display_name'),'');
begin
 if n is null or n !~ '^[A-Za-z0-9_]{3,32}$' then
  raise exception 'INVALID_USERNAME';
 end if;
 if d is null or char_length(d) not between 2 and 60 then
  raise exception 'INVALID_DISPLAY_NAME';
 end if;
 insert into public.profiles(id,username,display_name)
 values(new.id,n,d);
 return new;
end $body$;
revoke all on function public.cs2_beta_create_user_profile() from public,anon,authenticated;
drop trigger if exists cs2_beta_auth_user_created on auth.users;
create trigger cs2_beta_auth_user_created
 after insert on auth.users for each row
 execute function public.cs2_beta_create_user_profile();
