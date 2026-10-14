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

-- Test that the function cannot be invoked by an anonymous database role.
select has_function_privilege('anon','public.iste_owner_create_tournament(jsonb)','EXECUTE') = false
  as anon_cannot_execute \gset
\if :anon_cannot_execute
\else
\echo 'FAIL: anonymous EXECUTE grant exists'
\quit 1
\endif

set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  begin
    perform public.iste_owner_create_tournament('{"slug":"forbidden-user","title":"Forbidden User","game":"CS2","format":"single_elimination","best_of":3,"capacity":8,"timezone":"Europe/Kyiv","status":"draft"}'::jsonb);
    raise exception 'FAIL: regular user could create tournament';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
do $$
begin
  begin
    perform public.iste_owner_create_tournament('{"slug":"forbidden-blocked","title":"Blocked Owner","game":"CS2","format":"single_elimination","best_of":3,"capacity":8,"timezone":"Europe/Kyiv","status":"draft"}'::jsonb);
    raise exception 'FAIL: blocked owner could create tournament';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$
begin
  begin
    perform public.iste_owner_create_tournament('{"slug":"forbidden-aal1","title":"Missing MFA","game":"CS2","format":"single_elimination","best_of":3,"capacity":8,"timezone":"Europe/Kyiv","status":"draft"}'::jsonb);
    raise exception 'FAIL: AAL1 owner could create tournament';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
begin
  begin
    perform public.iste_owner_create_tournament('{"slug":"forbidden-live","title":"Forbidden Live","game":"CS2","format":"single_elimination","best_of":3,"capacity":8,"timezone":"Europe/Kyiv","status":"live"}'::jsonb);
    raise exception 'FAIL: owner could bypass draft status';
  exception when invalid_parameter_value then
    null;
  end;
end $$;

select public.iste_owner_create_tournament('{"slug":"legit-draft","title":"Legit Draft","game":"CS2","format":"single_elimination","best_of":3,"capacity":8,"timezone":"Europe/Kyiv","status":"draft"}'::jsonb);
reset role;
do $$
declare n integer;
begin
  select count(*) into n from public.iste_tournaments;
  if n <> 1 then raise exception 'FAIL: expected 1 tournament, found %', n; end if;
  select count(*) into n from public.iste_tournament_audit_log where action='create';
  if n <> 1 then raise exception 'FAIL: expected 1 audit row, found %', n; end if;
end $$;
\echo 'PASS: denied unauthorized cases; valid owner created exactly one audited draft'
