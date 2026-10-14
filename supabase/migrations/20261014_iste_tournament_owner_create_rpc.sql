-- ISTe Tournaments V2 owner create RPC — REVIEW ONLY, DO NOT APPLY TO PRODUCTION.
-- Requires 20261014_iste_tournaments_v2_foundation.sql.
-- SECURITY DEFINER runs with elevated privileges; all callers are explicitly verified here.
begin;

create or replace function public.iste_owner_create_tournament(p_draft jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_blocked boolean;
  v_slug text;
  v_title text;
  v_game text;
  v_format text;
  v_best_of integer;
  v_capacity integer;
  v_timezone text;
  v_reg_start timestamptz;
  v_reg_end timestamptz;
  v_starts timestamptz;
  v_row public.iste_tournaments%rowtype;
begin
  if auth.role() <> 'authenticated' or v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'MFA_REQUIRED' using errcode = '42501';
  end if;

  select role, is_blocked into v_role, v_blocked
    from public.user_roles where user_id = v_user;
  if v_role is distinct from 'owner' or coalesce(v_blocked,true) then
    raise exception 'OWNER_REQUIRED' using errcode = '42501';
  end if;

  if p_draft is null or jsonb_typeof(p_draft) <> 'object'
    or exists (
      select 1 from jsonb_object_keys(p_draft) as k(key)
      where k.key not in ('slug','title','game','format','best_of','capacity','timezone',
                          'registration_start','registration_end','starts_at','status')
    ) then
    raise exception 'INVALID_DRAFT' using errcode = '22023';
  end if;

  -- Even a direct RPC caller cannot request a non-draft tournament.
  if p_draft->>'status' is distinct from 'draft' then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  v_slug := btrim(p_draft->>'slug');
  v_title := btrim(p_draft->>'title');
  v_game := p_draft->>'game';
  v_format := p_draft->>'format';
  if v_slug is null or length(v_slug) > 100 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or v_title is null or length(v_title) not between 3 and 160
    or v_game is distinct from 'CS2'
    or v_format is distinct from 'single_elimination'
    or jsonb_typeof(p_draft->'best_of') <> 'number'
    or jsonb_typeof(p_draft->'capacity') <> 'number'
    or p_draft->>'timezone' is distinct from 'Europe/Kyiv'
  then
    raise exception 'INVALID_DRAFT' using errcode = '22023';
  end if;

  begin
    v_best_of := (p_draft->>'best_of')::integer;
    v_capacity := (p_draft->>'capacity')::integer;
    v_reg_start := nullif(p_draft->>'registration_start','')::timestamptz;
    v_reg_end := nullif(p_draft->>'registration_end','')::timestamptz;
    v_starts := nullif(p_draft->>'starts_at','')::timestamptz;
  exception when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow then
    raise exception 'INVALID_DRAFT' using errcode = '22023';
  end;

  if v_best_of not in (1,3,5) or v_capacity not in (2,4,8,16,32,64,128)
    or (v_reg_start is not null and v_reg_end is not null and v_reg_start >= v_reg_end)
    or (v_reg_end is not null and v_starts is not null and v_reg_end > v_starts)
  then
    raise exception 'INVALID_DRAFT' using errcode = '22023';
  end if;

  insert into public.iste_tournaments
    (slug,title,game,format,best_of,capacity,timezone,registration_start,registration_end,starts_at,status,created_by)
  values
    (v_slug,v_title,v_game,v_format,v_best_of,v_capacity,'Europe/Kyiv',
      v_reg_start,v_reg_end,v_starts,'draft',v_user)
  returning * into v_row;

  insert into public.iste_tournament_audit_log
    (tournament_id,actor_id,entity_type,entity_id,action,new_data)
  values
    (v_row.id,v_user,'tournament',v_row.id,'create',
     jsonb_build_object('slug',v_row.slug,'title',v_row.title,'status',v_row.status));

  return jsonb_build_object('id',v_row.id,'slug',v_row.slug,'title',v_row.title,'status',v_row.status);
end;
$function$;

revoke all on function public.iste_owner_create_tournament(jsonb) from public, anon;
grant execute on function public.iste_owner_create_tournament(jsonb) to authenticated;
commit;
