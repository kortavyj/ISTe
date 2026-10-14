-- Disposable RLS verification fixture. NEVER run on a production Supabase project.
-- Supabase's exposed public schema may grant table privileges to API roles;
-- grant them here deliberately so tests exercise RLS, not missing GRANTs.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.iste_tournaments,
  public.iste_tournament_teams,
  public.iste_tournament_members,
  public.iste_tournament_matches,
  public.iste_tournament_maps,
  public.iste_tournament_audit_log
to anon, authenticated;

insert into public.iste_tournaments(id,slug,title,status,published_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','public-cup','Public Cup','registration', now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','private-draft','Private Draft','draft',null),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','cancelled-cup','Cancelled Cup','cancelled',now());
insert into public.iste_tournament_teams(id,tournament_id,name) values
 ('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Visible Cup Team'),
 ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Draft Team');
insert into public.iste_tournament_members(team_id,user_id) values
 ('aaaaaaaa-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222');
insert into public.iste_tournament_matches(id,tournament_id,round_index,match_index) values
 ('aaaaaaaa-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,0),
 ('bbbbbbbb-0000-4000-8000-000000000010','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,0);
insert into public.iste_tournament_maps(match_id,map_index,map_name) values
 ('aaaaaaaa-0000-4000-8000-000000000010',1,'Mirage'),
 ('bbbbbbbb-0000-4000-8000-000000000010',1,'Nuke');

-- Test both API roles independently. A role with real table grants but without
-- RLS policies for private tables should receive zero rows.
set role anon;
do $test$
declare v_count integer;
begin
  select count(*) into v_count from public.iste_tournaments;
  if v_count <> 1 then raise exception 'anon tournament leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_matches;
  if v_count <> 1 then raise exception 'anon match leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_maps;
  if v_count <> 1 then raise exception 'anon map leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_teams;
  if v_count <> 0 then raise exception 'anon team identities exposed'; end if;
  select count(*) into v_count from public.iste_tournament_members;
  if v_count <> 0 then raise exception 'anon members exposed'; end if;
  select count(*) into v_count from public.iste_tournament_audit_log;
  if v_count <> 0 then raise exception 'anon audit exposed'; end if;
end
$test$;

do $test$
begin
  begin
    insert into public.iste_tournaments(slug,title) values ('forbidden-anon','Forbidden Anonymous');
    raise exception 'TEST FAILED: anon insert unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
end
$test$;
reset role;

set role authenticated;
do $test$
declare v_count integer;
begin
  select count(*) into v_count from public.iste_tournaments;
  if v_count <> 1 then raise exception 'authenticated tournament leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_matches;
  if v_count <> 1 then raise exception 'authenticated match leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_maps;
  if v_count <> 1 then raise exception 'authenticated map leak: % visible', v_count; end if;
  select count(*) into v_count from public.iste_tournament_members;
  if v_count <> 0 then raise exception 'authenticated members exposed'; end if;
end
$test$;

do $test$
declare v_changed integer;
begin
  -- With no UPDATE RLS policy PostgreSQL may silently affect zero rows.
  update public.iste_tournaments set title = 'Hacked' where slug = 'public-cup';
  get diagnostics v_changed = row_count;
  if v_changed <> 0 then raise exception 'TEST FAILED: authenticated changed % rows', v_changed; end if;
end
$test$;
reset role;

-- Verify inserts/updates did not change privileged records.
do $test$
declare v_count integer;
begin
  select count(*) into v_count from public.iste_tournaments where slug = 'forbidden-anon';
  if v_count <> 0 then raise exception 'Unauthorized anonymous insert persisted'; end if;
  select count(*) into v_count from public.iste_tournaments where slug = 'public-cup' and title = 'Public Cup';
  if v_count <> 1 then raise exception 'Unauthorized title change persisted'; end if;
end
$test$;
\echo 'PASS: published-only read, sensitive tables hidden, API-role writes denied'
