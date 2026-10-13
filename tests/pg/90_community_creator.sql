-- Disposable CI only: community tournament creators do not need platform Owner or MFA.
begin;
set local role postgres;
insert into auth.users(id) values
 ('123e4567-e89b-12d3-a456-426614175001'),
 ('123e4567-e89b-12d3-a456-426614175002');
insert into public.tournaments(id,owner_user_id,slug,title,max_teams)
values('123e4567-e89b-12d3-a456-426614175099',
       '123e4567-e89b-12d3-a456-426614175002',
       'ci-other-creator','Other User Tournament',2);
set local role authenticated;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614175001',true);
select set_config('request.jwt.claim.aal','aal1',true);
do $ordinary_creator$
declare new_id uuid;
begin
 insert into public.tournaments(owner_user_id,slug,title,max_teams)
 values (auth.uid(),'ci-community-creator','Community Tournament',2)
 returning id into new_id;
 perform public.iste_publish_tournament(new_id);
 if (select status from public.tournaments where id=new_id) <> 'registration'
 then raise exception 'COMMUNITY_PUBLISH_FAILED'; end if;
 begin
  perform public.iste_publish_tournament('123e4567-e89b-12d3-a456-426614175099'::uuid);
  raise exception 'FOREIGN_TOURNAMENT_PUBLISHED';
 exception when others then
  if sqlerrm='FOREIGN_TOURNAMENT_PUBLISHED' then raise; end if;
  if sqlerrm <> 'OWNER_REQUIRED' then raise; end if;
 end;
end $ordinary_creator$;
reset role;
update public.user_roles set role='user',is_blocked=true
 where user_id='123e4567-e89b-12d3-a456-426614175001';
insert into public.user_roles(user_id,role,is_blocked)
select '123e4567-e89b-12d3-a456-426614175001','user',true
where not exists(select 1 from public.user_roles where user_id='123e4567-e89b-12d3-a456-426614175001');
set local role authenticated;
do $blocked_creator$
begin
 begin
  insert into public.tournaments(owner_user_id,slug,title,max_teams)
  values (auth.uid(),'ci-blocked-creator','Blocked Tournament',2);
  raise exception 'BLOCKED_CREATOR_SUCCEEDED';
 exception when insufficient_privilege then null;
 end;
end $blocked_creator$;
reset role;
rollback;
