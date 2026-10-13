-- Atomic roster integrity checks in disposable CI database.
begin;
set local role postgres;
set local request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
set local request.jwt.claim.aal = 'aal2';

do $$
declare
 duel uuid;
 duo uuid;
 team_id uuid;
begin
 insert into public.tournaments(owner_user_id,slug,title,max_teams,team_size,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-steam-duel','Duel Roster CI',4,1,'registration',now())
 returning id into duel;
 insert into public.tournament_teams(tournament_id,name,player_names,player_steam_ids)
 values(duel,'Alpha',array['Alpha'],array['76561198000000001'])
 returning id into team_id;

 begin
   insert into public.tournament_teams(tournament_id,name,player_names,player_steam_ids)
   values(duel,'Duplicate Steam',array['Bravo'],array['76561198000000001']);
   raise exception 'DUPLICATE_STEAM_ACCEPTED';
 exception when others then
   if sqlerrm = 'DUPLICATE_STEAM_ACCEPTED' then raise; end if;
   if sqlerrm <> 'STEAM_ID_ALREADY_REGISTERED' then raise; end if;
 end;
 begin
   insert into public.tournament_teams(tournament_id,name,player_names,player_steam_ids)
   values(duel,'Missing Steam',array['Charlie'],array[]::text[]);
   raise exception 'MISSING_STEAM_ACCEPTED';
 exception when others then
   if sqlerrm = 'MISSING_STEAM_ACCEPTED' then raise; end if;
   if sqlerrm <> 'STEAM_ROSTER_SIZE_INVALID' then raise; end if;
 end;
 begin
   delete from public.tournament_teams where id=team_id;
   raise exception 'PUBLISHED_ROSTER_DELETED';
 exception when others then
   if sqlerrm = 'PUBLISHED_ROSTER_DELETED' then raise; end if;
   if sqlerrm <> 'ROSTER_LOCKED_NO_REENTRY' then raise; end if;
 end;

 insert into public.tournaments(owner_user_id,slug,title,max_teams,team_size,status,published_at)
 values ('123e4567-e89b-12d3-a456-426614174000','ci-steam-duo','Duo Roster CI',4,2,'registration',now())
 returning id into duo;
 insert into public.tournament_teams(tournament_id,name,player_names,player_steam_ids)
 values(duo,'Duo Alpha',array['Alpha','Bravo'],array['76561198000000002','76561198000000003']);
 begin
   insert into public.tournament_teams(tournament_id,name,player_names,player_steam_ids)
   values(duo,'Duo Duplicate',array['Charlie','Charlie'],array['76561198000000004','76561198000000005']);
   raise exception 'DUPLICATE_NICK_ACCEPTED';
 exception when others then
   if sqlerrm = 'DUPLICATE_NICK_ACCEPTED' then raise; end if;
   if sqlerrm <> 'ROSTER_DUPLICATE' then raise; end if;
 end;
end $$;
rollback;
