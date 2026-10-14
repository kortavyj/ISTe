-- REVIEW ONLY. Owner-only read RPC; never apply without approved DEV backup.
begin;
create or replace function public.iste_owner_list_teams(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid := auth.uid();
 v_access record;
 v_out jsonb;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501';
 end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
  raise exception 'MFA_REQUIRED' using errcode='42501';
 end if;
 select role,is_blocked into v_access from public.user_roles where user_id=v_actor;
 if not found or v_access.role is distinct from 'owner' or v_access.is_blocked is distinct from false then
  raise exception 'OWNER_REQUIRED' using errcode='42501';
 end if;
 if p_tournament_id is null then raise exception 'TOURNAMENT_REQUIRED' using errcode='22023'; end if;
 if not exists(select 1 from public.iste_tournaments where id=p_tournament_id) then
  raise exception 'TOURNAMENT_NOT_FOUND' using errcode='22023';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',t.id,'name',t.name,'status',t.status,'captainUserId',t.captain_user_id,
   'createdAt',t.created_at,
   'members',coalesce((select jsonb_agg(jsonb_build_object(
     'userId',m.user_id,'faceitPlayerId',m.faceit_player_id,
     'role',m.role,'isCaptain',m.is_captain) order by m.created_at,m.id)
     from public.iste_tournament_members m where m.team_id=t.id),'[]'::jsonb)
 ) order by t.created_at,t.id),'[]'::jsonb) into v_out
 from public.iste_tournament_teams t where t.tournament_id=p_tournament_id;
 return v_out;
end;
$$;
revoke all on function public.iste_owner_list_teams(uuid) from public,anon;
grant execute on function public.iste_owner_list_teams(uuid) to authenticated;
commit;
