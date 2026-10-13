-- CI-only: beta profile RLS prevents cross-user access and mutation.
begin;
set local role postgres;
insert into auth.users(id) values ('123e4567-e89b-12d3-a456-426614176001'),('123e4567-e89b-12d3-a456-426614176002');
set local role authenticated;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614176001',true);
insert into public.profiles(id,username) values ('123e4567-e89b-12d3-a456-426614176001','BetaOne');
do $profile_check$
begin
 if exists(select 1 from public.profiles where id='123e4567-e89b-12d3-a456-426614176002')
 then raise exception 'OTHER_PROFILE_VISIBLE'; end if;
 begin
  insert into public.profiles(id,username) values ('123e4567-e89b-12d3-a456-426614176002','Impersonation');
  raise exception 'OTHER_PROFILE_INSERTED';
 exception when insufficient_privilege then null;
 end;
 if (select count(*) from public.profiles where id='123e4567-e89b-12d3-a456-426614176001')<>1
 then raise exception 'OWN_PROFILE_NOT_VISIBLE'; end if;
end $profile_check$;
update public.profiles set username='BetaOneUpdated'
where id='123e4567-e89b-12d3-a456-426614176001';
do $own_update$
begin
 if (select username from public.profiles
    where id='123e4567-e89b-12d3-a456-426614176001') <> 'BetaOneUpdated'
 then raise exception 'OWN_PROFILE_UPDATE_FAILED'; end if;
end $own_update$;
select set_config('request.jwt.claim.sub','123e4567-e89b-12d3-a456-426614176002',true);
do $profile_check$
begin
 if exists(select 1 from public.profiles where id='123e4567-e89b-12d3-a456-426614176001')
 then raise exception 'CROSS_USER_PROFILE_READ'; end if;
end $profile_check$;
update public.profiles set username='Corrupted' where id='123e4567-e89b-12d3-a456-426614176001';
reset role;
set local role anon;
do $anonymous$
begin
 begin
  perform 1 from public.profiles limit 1;
  raise exception 'ANONYMOUS_PROFILE_ACCESS_GRANTED';
 exception when insufficient_privilege then null;
 end;
end $anonymous$;
reset role;
do $verify$
begin
 if (select username from public.profiles where id='123e4567-e89b-12d3-a456-426614176001')<>'BetaOneUpdated'
 then raise exception 'CROSS_USER_PROFILE_UPDATED'; end if;
end $verify$;
rollback;
