-- Distinguish starting five and substitute players; private incoming invites.
-- Pending applicants: expose public username only to the team captain.
-- Return only the requesting player's application status; never expose other applicants.
-- Only public-facing names and avatar URLs are returned for approved roster members.
-- Applications remain visible exclusively to the owning captain.
create or replace function public.iste_team_roster(p_team_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.tournament_teams%rowtype;
begin
 select * into t from public.tournament_teams where id=p_team_id;
 if not found then raise exception 'TEAM_NOT_FOUND'; end if;
 if not exists(select 1 from public.tournaments cup where cup.id=t.tournament_id
   and (cup.published_at is not null or (cup.owner_user_id=auth.uid() and auth.uid() is not null)))
 then raise exception 'FORBIDDEN'; end if;
 return jsonb_build_object('players',coalesce((
  select jsonb_agg(jsonb_build_object(
   'userId',p.user_id,'captain',p.is_captain,
   'name',coalesce(nullif(trim(pro.username),''),'Игрок ISTe'),
   'avatarUrl',pro.avatar_url,'role',p.roster_role
  ) order by p.is_captain desc,p.user_id)
  from (
   select t.captain_user_id as user_id,true as is_captain,'starter'::text as roster_role where t.captain_user_id is not null
   union all select a.user_id,false,a.roster_role from public.tournament_team_players a where a.team_id=t.id
  ) p left join public.profiles pro on pro.id=p.user_id
 ),'[]'::jsonb),
 'applications',case when auth.uid()=t.captain_user_id then coalesce((
  select jsonb_agg(jsonb_build_object('userId',a.user_id,'status',a.status,'name',coalesce(nullif(trim(pro.username),''),'Игрок ISTe')))
  from public.tournament_team_applications a left join public.profiles pro on pro.id=a.user_id where a.team_id=t.id and a.status='pending'
 ),'[]'::jsonb) else '[]'::jsonb end,
 'myInvitation',(
   select jsonb_build_object('status',i.status,'role',i.roster_role)
   from public.tournament_team_invitations i where i.team_id=t.id and i.user_id=auth.uid()
 ),
 'myApplicationStatus',(
   select a.status from public.tournament_team_applications a
   where a.team_id=t.id and a.user_id=auth.uid()
 ));
end; $;
revoke all on function public.iste_team_roster(uuid) from public,anon;
grant execute on function public.iste_team_roster(uuid) to authenticated;
