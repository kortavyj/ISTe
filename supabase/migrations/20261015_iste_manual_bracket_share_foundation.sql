-- Manual tournament share storage foundation. REVIEW IN DEV BEFORE PRODUCTION.
-- Does not modify or enable ISTe Tournaments V2 writes.
begin;
create table if not exists public.iste_manual_bracket_shares (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100),
 snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) <= 60000),
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists iste_manual_bracket_shares_owner_idx on public.iste_manual_bracket_shares (owner_id,updated_at desc);
alter table public.iste_manual_bracket_shares enable row level security;
revoke all on public.iste_manual_bracket_shares from public,anon,authenticated;
create or replace function public.iste_manual_bracket_owner_upsert(p_id uuid,p_snapshot jsonb,p_revision bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $func$
declare v_user uuid:=auth.uid(); v_owner public.user_roles%rowtype; v_row public.iste_manual_bracket_shares%rowtype;
begin
 if auth.role() <> 'authenticated' or v_user is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA_REQUIRED' using errcode='42501'; end if;
 select * into v_owner from public.user_roles where user_id=v_user;
 if v_owner.role is distinct from 'owner' or coalesce(v_owner.is_blocked,true) then
   raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
 if p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or pg_column_size(p_snapshot)>60000
    or p_snapshot->>'v' <> '1' or jsonb_typeof(p_snapshot->'entries') <> 'array'
    or jsonb_array_length(p_snapshot->'entries') not in (2,4,8,16,32)
    or (p_snapshot->>'bestOf') not in ('1','3','5')
    or length(coalesce(p_snapshot->>'title','')) not between 1 and 100
    or jsonb_typeof(p_snapshot->'results') <> 'object'
 then raise exception 'INVALID_SNAPSHOT' using errcode='22023'; end if;
 if p_id is null then
   insert into public.iste_manual_bracket_shares(owner_id,title,snapshot)
   values(v_user,p_snapshot->>'title',p_snapshot) returning * into v_row;
 else
   if p_revision is null or p_revision < 1 then raise exception 'REVISION_REQUIRED' using errcode='22023'; end if;
   update public.iste_manual_bracket_shares set
    title=p_snapshot->>'title',snapshot=p_snapshot,revision=revision+1,updated_at=now()
   where id=p_id and owner_id=v_user and revision=p_revision returning * into v_row;
   if not found then raise exception 'NOT_FOUND_OR_CONFLICT' using errcode='P0002'; end if;
 end if;
 return jsonb_build_object('id',v_row.id,'revision',v_row.revision,'updatedAt',v_row.updated_at);
end $func$;
create or replace function public.iste_manual_bracket_public_read(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $func$
declare v_row public.iste_manual_bracket_shares%rowtype;
begin
 select * into v_row from public.iste_manual_bracket_shares where id=p_id;
 if not found then return null; end if;
 return jsonb_build_object('snapshot',v_row.snapshot,'revision',v_row.revision,'updatedAt',v_row.updated_at);
end $func$;
revoke all on function public.iste_manual_bracket_owner_upsert(uuid,jsonb,bigint) from public,anon,authenticated;
revoke all on function public.iste_manual_bracket_public_read(uuid) from public,anon,authenticated;
grant execute on function public.iste_manual_bracket_owner_upsert(uuid,jsonb,bigint) to authenticated;
grant execute on function public.iste_manual_bracket_public_read(uuid) to anon,authenticated;
commit;
