-- Disposable PostgreSQL only. No existing Supabase environment is modified.
insert into public.iste_tournaments(id,slug,title,capacity,status)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','private-draft','Private Draft',4,'draft'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','public-live','Public Live',4,'live');
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$ begin
 begin
  perform public.iste_owner_list_tournaments();
  raise exception 'NON_OWNER_ALLOWED';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"aal":"aal1"}',false);
do $$ begin
 begin
  perform public.iste_owner_list_tournaments();
  raise exception 'MFA_BYPASSED';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',false);
do $$
declare payload jsonb;
begin
 payload:=public.iste_owner_list_tournaments();
 if jsonb_array_length(payload)<>2 then raise exception 'EXPECTED_TWO_TOURNAMENTS'; end if;
 if not exists(select 1 from jsonb_array_elements(payload) t where t->>'status'='draft' and t->>'slug'='private-draft') then
   raise exception 'PRIVATE_DRAFT_MISSING'; end if;
end $$;
reset role;
\echo 'PASS: owner-only drafts, public tournaments, nonowner/MFA restriction'
