-- Run inside disposable PostgreSQL only.
-- Test transactional start, byes, final, duplicate confirmation and permissions.
begin;
set local role postgres;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
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
do $
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
end $;
rollback;
