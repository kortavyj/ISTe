-- REVIEW ONLY. Owner-private read, including drafts and unpublished events.
begin;
create or replace function public.iste_owner_list_tournaments()
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_actor uuid:=auth.uid(); v_access record; v_payload jsonb;
begin
 if auth.role() is distinct from 'authenticated' or v_actor is null then
  raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then
  raise exception 'MFA_REQUIRED' using errcode='42501'; end if;
 select role,is_blocked into v_access from public.user_roles where user_id=v_actor;
 if not found or v_access.role is distinct from 'owner' or v_access.is_blocked is distinct from false then
  raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',t.id,'slug',t.slug,'title',t.title,'game',t.game,'format',t.format,
  'best_of',t.best_of,'capacity',t.capacity,'timezone',t.timezone,
  'registration_start',t.registration_start,'registration_end',t.registration_end,
  'starts_at',t.starts_at,'status',t.status,'published_at',t.published_at,
  'created_at',t.created_at,'updated_at',t.updated_at
 ) order by t.created_at desc,t.id),'[]'::jsonb)
 into v_payload from (select * from public.iste_tournaments
                      order by created_at desc,id limit 100) t;
 return v_payload;
end;
$fn$;
revoke all on function public.iste_owner_list_tournaments() from public,anon;
grant execute on function public.iste_owner_list_tournaments() to authenticated;
commit;
