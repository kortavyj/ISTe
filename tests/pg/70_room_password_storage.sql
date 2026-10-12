-- Disposable CI only: private CS2 room settings must reject plaintext and unauthenticated saves.
begin;
set local role postgres;
insert into public.tournaments(owner_user_id,slug,title,max_teams,status,published_at)
values('123e4567-e89b-12d3-a456-426614174000','ci-room-encryption','CI Room Encryption',2,'active',now());
insert into public.tournament_matches(tournament_id,round_number,match_number,status)
select id,1,1,'scheduled' from public.tournaments where slug='ci-room-encryption';
select set_config('iste.secret.match',
 (select m.id::text from public.tournament_matches m
 join public.tournaments t on t.id=m.tournament_id
 where t.slug='ci-room-encryption'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614174000',true);
select set_config('request.jwt.claim.aal','aal2',true);
do $assert_secret$
declare v_match uuid := current_setting('iste.secret.match')::uuid;
begin
 begin
  perform public.iste_save_match_room(v_match,'example.invalid',27015,
   'plaintext-secret','de_mirage',null);
  raise exception 'PLAINTEXT_PASSWORD_WAS_ACCEPTED';
 exception when others then
  if sqlerrm <> 'INVALID_ROOM_SETTINGS' then raise; end if;
 end;
 perform public.iste_save_match_room(v_match,'example.invalid',27015,
  'enc1:Q0lURVNU','de_mirage',null);
end $assert_secret$;
reset role;
do $verify_db$
begin
 if (select server_password from public.tournament_match_rooms
 where match_id=current_setting('iste.secret.match')::uuid)
 is distinct from 'enc1:Q0lURVNU' then
 raise exception 'ROOM_CIPHERTEXT_NOT_PERSISTED'; end if;
end $verify_db$;
rollback;
