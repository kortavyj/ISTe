-- REVIEW ONLY. V2 foundation required. Never apply without verified backup.
-- First MVP: fully filled single elimination, no BYE support in persisted brackets.
begin;
create or replace function public.iste_owner_generate_bracket(p_tournament_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $fn$
declare
 v_actor uuid := auth.uid();
 v_role record;
 v_tournament public.iste_tournaments%rowtype;
 v_teams uuid[];
 v_count integer;
 v_seed_count integer;
 v_slot_order integer[] := array[1,2];
 v_next_order integer[];
 v_size integer := 2;
 v_seed integer;
 v_round integer;
 v_slots integer;
 v_slot integer;
 v_first integer;
 v_second integer;
 v_match_count integer := 0;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
   raise exception 'AUTH_REQUIRED' using errcode='42501';
 end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
   raise exception 'MFA_REQUIRED' using errcode='42501';
 end if;
 select role,is_blocked into v_role from public.user_roles where user_id=v_actor;
 if not found or v_role.role is distinct from 'owner' or v_role.is_blocked is distinct from false then
   raise exception 'OWNER_REQUIRED' using errcode='42501';
 end if;
 if p_tournament_id is null then raise exception 'TOURNAMENT_REQUIRED' using errcode='22023'; end if;
 select * into v_tournament from public.iste_tournaments
   where id=p_tournament_id for update;
 if not found then raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023'; end if;
 if v_tournament.format <> 'single_elimination' or v_tournament.status <> 'checkin' then
   raise exception 'TOURNAMENT_NOT_READY_FOR_BRACKET' using errcode='22023'; end if;
 if exists(select 1 from public.iste_tournament_matches where tournament_id=p_tournament_id) then
   raise exception 'BRACKET_ALREADY_EXISTS' using errcode='23505'; end if;
 select count(*) into v_count from public.iste_tournament_teams
   where tournament_id=p_tournament_id and status in ('approved','checked_in');
 if v_count<>v_tournament.capacity then
   raise exception 'BRACKET_REQUIRES_FULL_CAPACITY' using errcode='22023'; end if;
 -- Reject all partially seeded rosters. For MVP bracket order is deterministic
 -- by existing seed when fully assigned or by application time otherwise.
 select count(*) into v_seed_count from public.iste_tournament_teams
   where tournament_id=p_tournament_id and status in ('approved','checked_in') and seed is not null;
 if v_seed_count<>0 and v_seed_count<>v_count then
   raise exception 'PARTIAL_SEEDING_NOT_ALLOWED' using errcode='22023'; end if;
 if v_seed_count=v_count and (
   select coalesce(min(seed),0)<>1 or coalesce(max(seed),0)<>v_count
   from public.iste_tournament_teams
   where tournament_id=p_tournament_id and status in ('approved','checked_in')
 ) then raise exception 'INVALID_SEED_RANGE' using errcode='22023'; end if;
 if v_seed_count=0 then
   with ranked as (
     select id,row_number() over(order by created_at,id)::integer as next_seed
     from public.iste_tournament_teams
     where tournament_id=p_tournament_id and status in ('approved','checked_in')
   )
   update public.iste_tournament_teams t set seed=r.next_seed,updated_at=now()
     from ranked r where t.id=r.id;
 end if;
 select array_agg(id order by seed) into v_teams
 from public.iste_tournament_teams
 where tournament_id=p_tournament_id and status in ('approved','checked_in');
 if coalesce(array_length(v_teams,1),0)<>v_tournament.capacity then
   raise exception 'SEED_ASSIGNMENT_FAILED' using errcode='22023'; end if;
 while v_size < v_tournament.capacity loop
   v_next_order := '{}'::integer[];
   foreach v_seed in array v_slot_order loop
     v_next_order := v_next_order || array[v_seed, 2*v_size+1-v_seed];
   end loop;
   v_slot_order := v_next_order;
   v_size := v_size*2;
 end loop;
 v_slots:=v_tournament.capacity/2;
 v_round:=0;
 while v_slots>=1 loop
   for v_slot in 0..v_slots-1 loop
     if v_round=0 then
       v_first := v_slot_order[v_slot*2+1];
       v_second := v_slot_order[v_slot*2+2];
       insert into public.iste_tournament_matches(
         tournament_id,round_index,match_index,team_a_id,team_b_id,
         best_of,status)
       values(p_tournament_id,v_round,v_slot,
              v_teams[v_first],v_teams[v_second],v_tournament.best_of,'ready');
     else
       insert into public.iste_tournament_matches(
         tournament_id,round_index,match_index,best_of,status)
       values(p_tournament_id,v_round,v_slot,v_tournament.best_of,'scheduled');
     end if;
     v_match_count:=v_match_count+1;
   end loop;
   v_round:=v_round+1;
   v_slots:=v_slots/2;
 end loop;
 insert into public.iste_tournament_audit_log(
   tournament_id,actor_id,entity_type,entity_id,action,new_data)
 values(p_tournament_id,v_actor,'tournament',p_tournament_id,
   'bracket_generated',jsonb_build_object(
     'capacity',v_tournament.capacity,'matches',v_match_count,'rounds',v_round));
 return jsonb_build_object('tournamentId',p_tournament_id,
   'capacity',v_tournament.capacity,'matches',v_match_count,'rounds',v_round);
end;
$fn$;
revoke all on function public.iste_owner_generate_bracket(uuid) from public,anon;
grant execute on function public.iste_owner_generate_bracket(uuid) to authenticated;
commit;
