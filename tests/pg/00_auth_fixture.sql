-- Standalone Supabase-compatible fixture for CI only. NEVER apply to production.
create extension if not exists pgcrypto;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create table auth.users(id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
create or replace function auth.jwt() returns jsonb language sql stable as 'select jsonb_build_object(''aal'', current_setting(''request.jwt.claim.aal'', true), ''role'', current_setting(''request.jwt.claim.role'', true))';
create table public.user_roles(
 user_id uuid primary key references auth.users(id),
 role text not null,
 is_blocked boolean not null default false
);
insert into auth.users(id) values ('123e4567-e89b-12d3-a456-426614174000');
insert into public.user_roles(user_id,role,is_blocked)
values('123e4567-e89b-12d3-a456-426614174000','owner',false);
grant usage on schema auth to authenticated;
grant select on public.user_roles to authenticated;
