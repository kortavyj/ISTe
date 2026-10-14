-- REVIEW ONLY. Do not apply to DEV or production without verified backup.
begin;
create or replace function public.iste_owner_get_bracket(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_access record; v_result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
  raise exception 'MFA_REQUIRED' using errcode='42501'; end if;
 select role,is_blocked into v_access from public.user_roles where user_id=v_actor;
 if not found or v_access.role is distinct from 'owner' or v_access.is_blocked is distinct from false then
  raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
 if p_tournament_id is null then raise exception 'TOURNAMENT_REQUIRED' using errcode='22023'; end if;
 if not exists(select 1 from public.iste_tournaments where id=p_tournament_id) then
  raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',m.id,'roundIndex',m.round_index,'matchIndex',m.match_index,
  'teamAId',m.team_a_id,'teamBId',m.team_b_id,
  'teamAName',a.name,'teamBName',b.name,
  'bestOf',m.best_of,'scoreA',m.score_a,'scoreB',m.score_b,
  'winnerTeamId',m.winner_team_id,'status',m.status,'version',m.version,
  'maps',coalesce((select jsonb_agg(jsonb_build_object(
    'name',tm.map_name,'scoreA',tm.score_a,'scoreB',tm.score_b)
    order by tm.map_index)
    from public.iste_tournament_maps tm where tm.match_id=m.id),'[]'::jsonb)
 ) order by m.round_index,m.match_index),'[]'::jsonb)
 into v_result from public.iste_tournament_matches m
 left join public.iste_tournament_teams a on a.id=m.team_a_id
 left join public.iste_tournament_teams b on b.id=m.team_b_id
 where m.tournament_id=p_tournament_id;
 return v_result;
end;
$$;
revoke all on function public.iste_owner_get_bracket(uuid) from public,anon;
grant execute on function public.iste_owner_get_bracket(uuid) to authenticated;
commit;
