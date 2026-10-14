-- Disposable PostgreSQL fixture ONLY. This imitates the Supabase auth interfaces
-- used by the RPC, not the complete Supabase platform.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable
as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create function auth.jwt() returns jsonb language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
grant usage on schema auth to authenticated, anon;
grant execute on all functions in schema auth to authenticated, anon;

create table public.user_roles (
  user_id uuid primary key,
  role text not null,
  is_blocked boolean not null default false
);
insert into public.user_roles(user_id,role,is_blocked) values
('11111111-1111-4111-8111-111111111111','owner',false),
('22222222-2222-4222-8222-222222222222','user',false),
('33333333-3333-4333-8333-333333333333','owner',true);
grant usage on schema public to authenticated, anon;

