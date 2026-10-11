-- Atomic start and result confirmation for Single Elimination.
-- Execute after tournaments, tournament_teams and tournament_matches migrations.
-- SECURITY DEFINER routines have explicit identity, blocked-account and ownership checks.
create or replace function public.iste_start_tournament(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  t public.tournaments%rowtype;
  players uuid[];
  seeds integer[] := array[1,2];
  new_seeds integer[];
  slots uuid[];
  n integer;
  bracket_size integer := 2;
  rounds integer := 0;
  r integer;
  i integer;
  a uuid;
  b uuid;
  seed integer;
  m public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into t from public.tournaments where id=p_tournament_id for update;
  if not found or t.owner_user_id<>auth.uid() then raise exception 'OWNER_REQUIRED'; end if;
  if exists(select 1 from public.user_roles u where u.user_id=auth.uid() and u.is_blocked) then
    raise exception 'ACCOUNT_BLOCKED';
  end if;
  if not exists (select 1 from public.user_roles where user_id=auth.uid() and role='owner' and is_blocked is not true) then raise exception 'OWNER_REQUIRED'; end if;
  if t.status <> 'registration' then raise exception 'NOT_IN_REGISTRATION'; end if;
  -- Prevent starting with team changes in the same transaction from bypassing
  -- the final roster snapshot. Other writer transactions cannot update this
  -- tournament while the parent row is locked.
  select array_agg(id order by created_at,id) into players
    from public.tournament_teams where tournament_id=p_tournament_id;
  n:=coalesce(array_length(players,1),0);
  if n < 2 then raise exception 'NOT_ENOUGH_TEAMS'; end if;
  while bracket_size<n loop bracket_size:=bracket_size*2; end loop;
  while array_length(seeds,1)<bracket_size loop
    new_seeds:=array[]::integer[];
    for i in 1..array_length(seeds,1) loop
      new_seeds:=array_append(new_seeds,seeds[i]);
      new_seeds:=array_append(new_seeds,array_length(seeds,1)*2+1-seeds[i]);
    end loop;
    seeds:=new_seeds;
  end loop;
  slots:=array[]::uuid[];
  for i in 1..bracket_size loop
    seed:=seeds[i];
    slots:=array_append(slots,case when seed<=n then players[seed] else null end);
  end loop;
  while (1<<rounds)<bracket_size loop rounds:=rounds+1; end loop;
  -- Prepare later rounds first; inserting rounds is one transaction.
  for r in 2..rounds loop
    for i in 1..(bracket_size/(1<<r)) loop
      insert into public.tournament_matches(tournament_id,round_number,match_number,status)
      values(p_tournament_id,r,i,'pending');
    end loop;
  end loop;
  for i in 1..(bracket_size/2) loop
    a:=slots[2*i-1]; b:=slots[2*i];
    insert into public.tournament_matches(
      tournament_id,round_number,match_number,team_a_id,team_b_id,
      winner_team_id,status
    ) values(
      p_tournament_id,1,i,a,b,
      case when b is null then a else null end,
      case when b is null then 'bye' else 'scheduled' end
    );
    if b is null and rounds>1 then
      update public.tournament_matches
      set team_a_id=case when i%2=1 then a else team_a_id end,
          team_b_id=case when i%2=0 then a else team_b_id end
      where tournament_id=p_tournament_id and round_number=2
        and match_number=(i+1)/2;
    end if;
  end loop;
  -- A match may have two participants because both advanced through BYEs.
  -- These matches must be playable immediately, not stuck in 'pending'.
  update public.tournament_matches
    set status='scheduled'
    where tournament_id=p_tournament_id and status='pending'
      and team_a_id is not null and team_b_id is not null;

  -- Two-team tournaments have no subsequent rounds.
  update public.tournaments set status='active',updated_at=now() where id=p_tournament_id;
end $$;

create or replace function public.iste_confirm_tournament_match(
  p_match_id uuid, p_score_a integer, p_score_b integer
) returns void language plpgsql security definer set search_path = '' as $$
declare
  m public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  winner uuid;
  next_round integer;
  next_number integer;
  target public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Lock tournament first, then match. This order matches start_tournament and
  -- prevents opposite lock acquisition order under concurrent result requests.
  select tournament_id into m.tournament_id
    from public.tournament_matches where id=p_match_id;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  select * into t from public.tournaments where id=m.tournament_id for update;
  select * into m from public.tournament_matches where id=p_match_id for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if t.owner_user_id<>auth.uid() then raise exception 'OWNER_REQUIRED'; end if;
  if exists(select 1 from public.user_roles u where u.user_id=auth.uid() and u.is_blocked) then
    raise exception 'ACCOUNT_BLOCKED';
  end if;
  if t.status<>'active' or m.status<>'scheduled'
    or m.team_a_id is null or m.team_b_id is null
    then raise exception 'MATCH_NOT_READY'; end if;
  if p_score_a is null or p_score_b is null
    or p_score_a=p_score_b or p_score_a<0 or p_score_b<0
    then raise exception 'INVALID_SCORE'; end if;
  if t.best_of=3 then
    if greatest(p_score_a,p_score_b)<>2 or least(p_score_a,p_score_b)>1
      then raise exception 'INVALID_BO3_MAP_WINS'; end if;
  elsif t.best_of=1 then
    -- MR12: win 13 rounds before overtime, with a 2-round margin.
    -- Overtime uses 6-round MR3 sets and requires a 2-round lead.
    if not (
      (greatest(p_score_a,p_score_b)=13 and least(p_score_a,p_score_b)<=11)
      or (greatest(p_score_a,p_score_b)>=16
          and (greatest(p_score_a,p_score_b)-16)%3=0
          and greatest(p_score_a,p_score_b)-least(p_score_a,p_score_b)=2)
    ) then raise exception 'INVALID_BO1_ROUND_SCORE'; end if;
  end if;
  winner:=case when p_score_a>p_score_b then m.team_a_id else m.team_b_id end;
  update public.tournament_matches set
    score_a=p_score_a,score_b=p_score_b,winner_team_id=winner,status='completed'
    where id=m.id;
  next_round:=m.round_number+1;
  next_number:=(m.match_number+1)/2;
  select * into target from public.tournament_matches where tournament_id=m.tournament_id
    and round_number=next_round and match_number=next_number for update;
  if not found then
    update public.tournaments set status='completed', updated_at=now() where id=t.id;
    return;
  end if;
  if target.status<>'pending' then raise exception 'NEXT_MATCH_LOCKED'; end if;
  if m.match_number%2=1 then
    if target.team_a_id is not null then raise exception 'BRACKET_SLOT_OCCUPIED'; end if;
    update public.tournament_matches set team_a_id=winner where id=target.id;
  else
    if target.team_b_id is not null then raise exception 'BRACKET_SLOT_OCCUPIED'; end if;
    update public.tournament_matches set team_b_id=winner where id=target.id;
  end if;
  update public.tournament_matches set status='scheduled' where id=target.id
    and team_a_id is not null and team_b_id is not null and status='pending';
end $$;

revoke all on function public.iste_start_tournament(uuid) from public,anon;
revoke all on function public.iste_confirm_tournament_match(uuid,integer,integer) from public,anon;
grant execute on function public.iste_start_tournament(uuid) to authenticated;
grant execute on function public.iste_confirm_tournament_match(uuid,integer,integer) to authenticated;
