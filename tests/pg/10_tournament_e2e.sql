-- Run inside disposable PostgreSQL only.
-- Test transactional start, byes, final, duplicate confirmation and permissions.
begin;
set local role postgres;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
set local request.jwt.claim.aal = 'aal2';
do $$
declare
 n int;
 k int;
 tid uuid;
 match_row public.tournament_matches%rowtype;
 winner_count int;
 champion uuid;
 next_match public.tournament_matches%rowtype;
 teams uuid[];
 last_completed uuid;
 first_scheduled uuid;
 attempts int;
 failure_message text;
begin
 for n in 2..64 loop
  insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
  values ('123e4567-e89b-12d3-a456-426614174000','ci-'||n,'CI Cup '||n,64,'registration',now())
  returning id into tid;
  for k in 1..n loop
   insert into public.tournament_teams(tournament_id,name)
   values(tid,'Team '||lpad(k::text,3,'0'));
  end loop;
  perform set_config('request.jwt.claim.aal','aal1',true);
  begin
   perform public.iste_start_tournament(tid);
   raise exception 'AAL1_START_ALLOWED';
  exception when others then
   if sqlerrm='AAL1_START_ALLOWED' then raise; end if;
   if sqlerrm<>'MFA_REQUIRED' then raise; end if;
  end;
  perform set_config('request.jwt.claim.aal','aal2',true);
  perform public.iste_start_tournament(tid);
  if (select status from public.tournaments where id=tid)<>'active' then
   raise exception 'Tournament % not active after start',n;
  end if;
  -- A tournament cannot be launched again after the bracket is generated.
  begin
    perform public.iste_start_tournament(tid);
    raise exception 'Duplicate start unexpectedly succeeded';
  exception when others then
    if sqlerrm='Duplicate start unexpectedly succeeded' then raise; end if;
    if sqlerrm<>'NOT_IN_REGISTRATION' then raise; end if;
  end;
  -- Invalid scores must not mutate the bracket.
  select id into first_scheduled from public.tournament_matches
  where tournament_id=tid and status='scheduled'
  order by round_number,match_number limit 1;
  if first_scheduled is not null then
    begin
      perform public.iste_confirm_tournament_match(first_scheduled,12,12);
      raise exception 'Draw was accepted';
    exception when others then
      if sqlerrm='Draw was accepted' then raise; end if;
      if sqlerrm<>'INVALID_SCORE' then raise; end if;
    end;
    begin
      perform public.iste_confirm_tournament_match(first_scheduled,14,7);
      raise exception 'Invalid BO1 score was accepted';
    exception when others then
      if sqlerrm='Invalid BO1 score was accepted' then raise; end if;
      if sqlerrm<>'INVALID_BO1_ROUND_SCORE' then raise; end if;
    end;
  end if;
  -- Keep confirming the first scheduled match. Every processed match
  -- advances a winner and must eventually resolve the entire bracket.
  attempts:=0;
  loop
   select * into match_row from public.tournament_matches
   where tournament_id=tid and status='scheduled'
   order by round_number,match_number limit 1;
   exit when not found;
   attempts:=attempts+1;
   if attempts>n+4 then raise exception 'stuck at % teams',n; end if;
   last_completed:=match_row.id;
   perform public.iste_confirm_tournament_match(match_row.id,13,7);
  end loop;
  if (select status from public.tournaments where id=tid)<>'completed' then
   raise exception 'Tournament with % teams did not finish',n;
  end if;
  select count(*) into winner_count from public.tournament_matches
   where tournament_id=tid and status='completed';
  if winner_count<>n-1
     then raise exception 'Wrong completed match count for % teams',n;
  end if;
  if (select count(*) from public.tournament_matches where tournament_id=tid
      and winner_team_id is null)<>0 then
    raise exception 'Unresolved fixture for % teams',n;
  end if;
  begin
    perform public.iste_confirm_tournament_match(last_completed,13,7);
    raise exception 'Duplicate confirmation succeeded unexpectedly';
  exception when others then
    if sqlerrm='Duplicate confirmation succeeded unexpectedly' then raise; end if;
    if sqlerrm<>'MATCH_NOT_READY' then raise; end if;
  end;
 end loop;
end $$;

-- Test that an unrelated user cannot start a tournament or confirm a result.
do $$
declare
 tid uuid;
 mid uuid;
begin
 insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-access-control','CI Access Control',2,'registration',now())
 returning id into tid;
 insert into public.tournament_teams(tournament_id,name)
 values (tid,'Access Team A'),(tid,'Access Team B');
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174001',true);
 begin
   perform public.iste_start_tournament(tid);
   raise exception 'UNAUTHORIZED_START_ALLOWED';
 exception when others then
   if sqlerrm='UNAUTHORIZED_START_ALLOWED' then raise; end if;
   if sqlerrm<>'OWNER_REQUIRED' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
 perform public.iste_start_tournament(tid);
 select id into mid from public.tournament_matches
 where tournament_id=tid and status='scheduled' limit 1;
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174001',true);
 begin
   perform public.iste_confirm_tournament_match(mid,13,7);
   raise exception 'UNAUTHORIZED_RESULT_ALLOWED';
 exception when others then
   if sqlerrm='UNAUTHORIZED_RESULT_ALLOWED' then raise; end if;
   if sqlerrm<>'OWNER_REQUIRED' then raise; end if;
 end;
end $$;

-- Cross-tournament participants must not be assignable to unrelated matches.
do $$
declare ta uuid; tb uuid; foreign_team uuid; local_team uuid;
begin
 insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-fk-a','CI Membership A',2,'registration',now())
 returning id into ta;
 insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-fk-b','CI Membership B',2,'registration',now())
 returning id into tb;
 insert into public.tournament_teams(tournament_id,name) values(ta,'Valid Team')
 returning id into local_team;
 insert into public.tournament_teams(tournament_id,name) values(tb,'Foreign Team')
 returning id into foreign_team;
 begin
  insert into public.tournament_matches(tournament_id,round_number,match_number,team_a_id,team_b_id,status)
  values (ta,1,1,local_team,foreign_team,'scheduled');
  raise exception 'CROSS_TOURNAMENT_TEAM_ALLOWED';
 exception when foreign_key_violation then null;
 end;
end $$;
-- BO3 series: legal map scores and rejection of invalid outcomes.
do $$
declare tid uuid; mid uuid;
begin
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
 insert into public.tournaments(owner_user_id,slug,title,best_of,max_teams,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-bo3-final','CI BO3 Final',3,2,'registration',now()) returning id into tid;
 insert into public.tournament_teams(tournament_id,name) values(tid,'BO3 Alpha'),(tid,'BO3 Bravo');
 perform public.iste_start_tournament(tid);
 select id into mid from public.tournament_matches where tournament_id=tid and status='scheduled';
 begin
  perform public.iste_confirm_tournament_match(mid,3,1);
  raise exception 'INVALID_BO3_ALLOWED';
 exception when others then
  if sqlerrm='INVALID_BO3_ALLOWED' then raise; end if;
  if sqlerrm<>'INVALID_BO3_MAP_WINS' then raise; end if;
 end;
 perform public.iste_confirm_tournament_match(mid,2,1);
 if (select status from public.tournaments where id=tid)<>'completed' then
  raise exception 'BO3_TOURNAMENT_NOT_COMPLETED';
 end if;
end $$;

-- Owner role revocation and account block must stop privileged RPCs.
do $$

declare tid uuid; mid uuid;
begin
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
 insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-role-revoked','CI Role Guard',2,'registration',now()) returning id into tid;
 insert into public.tournament_teams(tournament_id,name) values(tid,'Guard Alpha'),(tid,'Guard Bravo');
 update public.user_roles set role='user' where user_id=auth.uid();
 begin
  perform public.iste_start_tournament(tid);
  raise exception 'REVOKED_OWNER_STARTED';
 exception when others then
  if sqlerrm='REVOKED_OWNER_STARTED' then raise; end if;
  if sqlerrm<>'OWNER_REQUIRED' then raise; end if;
 end;
 update public.user_roles set role='owner',is_blocked=true where user_id=auth.uid();
 begin
  perform public.iste_start_tournament(tid);
  raise exception 'BLOCKED_OWNER_STARTED';
 exception when others then
  if sqlerrm='BLOCKED_OWNER_STARTED' then raise; end if;
  if sqlerrm<>'ACCOUNT_BLOCKED' then raise; end if;
 end;
 update public.user_roles set is_blocked=false where user_id=auth.uid();
 perform public.iste_start_tournament(tid);
 select id into mid from public.tournament_matches where tournament_id=tid and status='scheduled';
 update public.user_roles set role='user' where user_id=auth.uid();
 begin
  perform public.iste_confirm_tournament_match(mid,13,7);
  raise exception 'REVOKED_OWNER_CONFIRMED';
 exception when others then
  if sqlerrm='REVOKED_OWNER_CONFIRMED' then raise; end if;
  if sqlerrm<>'OWNER_REQUIRED' then raise; end if;
 end;
 update public.user_roles set role='owner',is_blocked=true where user_id=auth.uid();
 begin
  perform public.iste_confirm_tournament_match(mid,13,7);
  raise exception 'BLOCKED_OWNER_CONFIRMED';
 exception when others then
  if sqlerrm='BLOCKED_OWNER_CONFIRMED' then raise; end if;
  if sqlerrm<>'ACCOUNT_BLOCKED' then raise; end if;
 end;
 update public.user_roles set is_blocked=false where user_id=auth.uid();
 perform set_config('request.jwt.claim.aal','aal1',true);
 begin
  perform public.iste_confirm_tournament_match(mid,13,7);
  raise exception 'AAL1_RESULT_ALLOWED';
 exception when others then
  if sqlerrm='AAL1_RESULT_ALLOWED' then raise; end if;
  if sqlerrm<>'MFA_REQUIRED' then raise; end if;
 end;
 perform set_config('request.jwt.claim.aal','aal2',true);
 perform public.iste_confirm_tournament_match(mid,13,7);
 if (select status from public.tournaments where id=tid)<>'completed' then raise exception 'RECOVERED_OWNER_FAILED'; end if;
end $$;
-- Published transitions are atomic and recorded; repeat publishing is rejected.
do $$
declare tid uuid;
begin
 perform set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
 perform set_config('request.jwt.claim.aal','aal2',true);
 insert into public.tournaments(owner_user_id,slug,title,max_teams)
 values('123e4567-e89b-12d3-a456-426614174000','ci-audited-publish','CI Audited Publish',2) returning id into tid;
 perform set_config('request.jwt.claim.aal','aal1',true);
 begin
  perform public.iste_publish_tournament(tid);
  raise exception 'PUBLISH_WITHOUT_MFA_ALLOWED';
 exception when others then
  if sqlerrm='PUBLISH_WITHOUT_MFA_ALLOWED' then raise; end if;
  if sqlerrm<>'MFA_REQUIRED' then raise; end if;
 end;
 perform set_config('request.jwt.claim.aal','aal2',true);
 perform public.iste_publish_tournament(tid);
 if (select status from public.tournaments where id=tid)<>'registration' then raise exception 'PUBLISH_FAILED'; end if;
 if (select count(*) from public.tournament_audit where tournament_id=tid and action='publish')<>1 then raise exception 'PUBLISH_AUDIT_MISSING'; end if;
 begin
  perform public.iste_publish_tournament(tid);
  raise exception 'DOUBLE_PUBLISH_ALLOWED';
 exception when others then
  if sqlerrm='DOUBLE_PUBLISH_ALLOWED' then raise; end if;
  if sqlerrm<>'NOT_IN_DRAFT' then raise; end if;
 end;
end $$;
-- Least privilege assertions against actual PostgreSQL grants.
do $$
begin
 if has_table_privilege('authenticated','public.tournaments','UPDATE') then
  raise exception 'AUTHENTICATED_DIRECT_TOURNAMENT_UPDATE_ALLOWED';
 end if;
 if has_table_privilege('anon','public.tournament_audit','SELECT')
    or has_table_privilege('authenticated','public.tournament_audit','SELECT') then
  raise exception 'PRIVATE_TOURNAMENT_AUDIT_IS_READABLE';
 end if;
 if not has_function_privilege('authenticated','public.iste_publish_tournament(uuid)','EXECUTE') then
  raise exception 'AUTHENTICATED_PUBLISH_RPC_UNAVAILABLE';
 end if;
 if has_function_privilege('anon','public.iste_publish_tournament(uuid)','EXECUTE') then
  raise exception 'ANON_PUBLISH_RPC_ALLOWED';
 end if;
end $$;
-- Event replay indexes and private distributed counters.
do $$
declare
 tid uuid;
 mid uuid;
begin
 if has_table_privilege('authenticated','public.tournament_cs2_events','INSERT')
    or has_table_privilege('anon','public.tournament_cs2_events','SELECT')
    or has_table_privilege('authenticated','public.tournament_rate_limits','SELECT') then
  raise exception 'INTERNAL_SECURITY_TABLE_EXPOSED';
 end if;
 if has_function_privilege('authenticated','public.iste_enforce_tournament_limit(uuid,text,integer)','EXECUTE') then
  raise exception 'RATE_LIMIT_HELPER_EXPOSED';
 end if;
 insert into public.tournaments(owner_user_id,slug,title,max_teams)
 values('123e4567-e89b-12d3-a456-426614174000','ci-event-unique-check','CI Event Uniqueness',2) returning id into tid;
 insert into public.tournament_matches(tournament_id,round_number,match_number,status)
 values(tid,1,1,'pending') returning id into mid;
 insert into public.tournament_cs2_events(server_id,match_id,event_id,sequence,event_type)
 values('123e4567-e89b-12d3-a456-426614174099',mid,'ci-event-00000001',1,'map_started');
 begin
  insert into public.tournament_cs2_events(server_id,match_id,event_id,sequence,event_type)
  values('123e4567-e89b-12d3-a456-426614174099',mid,'ci-event-00000001',2,'round_end');
  raise exception 'DUPLICATE_EVENT_ACCEPTED';
 exception when unique_violation then null; end;
 begin
  insert into public.tournament_cs2_events(server_id,match_id,event_id,sequence,event_type)
  values('123e4567-e89b-12d3-a456-426614174099',mid,'ci-event-00000002',1,'round_end');
  raise exception 'DUPLICATE_SEQUENCE_ACCEPTED';
 exception when unique_violation then null; end;
end $$;
-- Service-only ingest enforces first sequence, duplicate and cross-server rejection.
do $$
declare tid uuid; mid uuid;
begin
 insert into public.tournaments(owner_user_id,slug,title,max_teams)
 values('123e4567-e89b-12d3-a456-426614174000','ci-service-ingest-test','CI Service Ingest',2) returning id into tid;
 insert into public.tournament_matches(tournament_id,round_number,match_number,status)
 values(tid,1,1,'pending') returning id into mid;
 perform set_config('request.jwt.claim.role','authenticated',true);
 begin
  perform public.iste_ingest_cs2_event('123e4567-e89b-12d3-a456-426614174099',mid,'ci-service-000001',1,'map_started');
  raise exception 'UNAUTHORIZED_INGEST_ALLOWED';
 exception when others then
  if sqlerrm <> 'SERVICE_ROLE_REQUIRED' then raise; end if;
 end;
 perform set_config('request.jwt.claim.role','service_role',true);
 perform public.iste_ingest_cs2_event('123e4567-e89b-12d3-a456-426614174099',mid,'ci-service-000001',1,'map_started');
 begin
  perform public.iste_ingest_cs2_event('123e4567-e89b-12d3-a456-426614174099',mid,'ci-service-000002',3,'round_end');
  raise exception 'SEQUENCE_SKIP_ALLOWED';
 exception when others then
  if sqlerrm <> 'EVENT_OUT_OF_ORDER' then raise; end if;
 end;
 perform public.iste_ingest_cs2_event('123e4567-e89b-12d3-a456-426614174099',mid,'ci-service-000002',2,'round_end');
 begin
  perform public.iste_ingest_cs2_event('123e4567-e89b-12d3-a456-426614174098',mid,'ci-service-000003',3,'round_end');
  raise exception 'SERVER_SWITCH_ALLOWED';
 exception when others then
  if sqlerrm <> 'SERVER_MISMATCH' then raise; end if;
 end;
 perform set_config('request.jwt.claim.role','',true);
end $$;
rollback;
