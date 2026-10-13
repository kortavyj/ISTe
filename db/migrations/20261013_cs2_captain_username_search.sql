-- Organizer-only username lookup for appointing a verified ISTe account captain.
create or replace function public.iste_captain_username_search(p_tournament_id uuid,p_prefix text)
returns table(username text)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(select 1 from public.tournaments t where t.id=p_tournament_id
   and t.owner_user_id=auth.uid() and t.status in ('draft','registration'))
 then raise exception 'OWNER_REQUIRED'; end if;
 if exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.is_blocked is true)
 then raise exception 'ACCOUNT_BLOCKED'; end if;
 if length(trim(coalesce(p_prefix,'')))<2 then return; end if;
 return query
 select p.username::text from public.profiles p
 where p.username ilike replace(replace(replace(trim(p_prefix),'\\','\\\\'),'%','\\%'),'_','\\_')||'%'
 and not exists(select 1 from public.user_roles r where r.user_id=p.id and r.is_blocked is true)
 and not exists(select 1 from public.tournament_teams t where t.tournament_id=p_tournament_id and t.captain_user_id=p.id)
 and not exists(select 1 from public.tournament_team_players m join public.tournament_teams t on t.id=m.team_id where t.tournament_id=p_tournament_id and m.user_id=p.id)
 order by p.username limit 10;
end $$;
revoke all on function public.iste_captain_username_search(uuid,text) from public,anon;
grant execute on function public.iste_captain_username_search(uuid,text) to authenticated;