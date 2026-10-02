create or replace function public.owner_update_user_role(
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_old_role public.app_role;
  v_new_role public.app_role;
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'MFA_REQUIRED';
  end if;

  select access.role
  into v_actor_role
  from public.user_roles access
  where access.user_id = v_actor_id
    and access.is_blocked = false;

  if v_actor_role not in (
    'admin'::public.app_role,
    'owner'::public.app_role
  ) then
    raise exception 'ADMIN_OR_OWNER_REQUIRED';
  end if;

  if p_user_id is null then
    raise exception 'TARGET_REQUIRED';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'CANNOT_CHANGE_OWN_ROLE';
  end if;

  select target_access.role
  into v_old_role
  from public.user_roles target_access
  where target_access.user_id = p_user_id
  for update;

  if not found then
    raise exception 'USER_ROLE_NOT_FOUND';
  end if;

  if v_old_role = 'owner'::public.app_role then
    raise exception 'CANNOT_CHANGE_OWNER';
  end if;

  if v_actor_role = 'admin'::public.app_role then
    if v_old_role in (
      'admin'::public.app_role,
      'owner'::public.app_role,
      'game_manager'::public.app_role
    ) then
      raise exception 'ADMIN_CANNOT_MANAGE_PRIVILEGED';
    end if;

    if lower(trim(coalesce(p_role, '')))
       not in ('user', 'editor') then
      raise exception 'ADMIN_CANNOT_ASSIGN_ADMIN';
    end if;
  else
    if lower(trim(coalesce(p_role, '')))
       not in (
         'user',
         'editor',
         'game_manager',
         'admin'
       ) then
      raise exception 'INVALID_ROLE';
    end if;
  end if;

  v_new_role :=
    lower(trim(p_role))::public.app_role;

  update public.user_roles
  set
    role = v_new_role,
    assigned_by = v_actor_id,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.admin_audit_log (
    actor_id,
    target_user_id,
    action,
    details,
    success
  )
  values (
    v_actor_id,
    p_user_id,
    'role_changed',
    jsonb_build_object(
      'actor_role', v_actor_role::text,
      'old_role', v_old_role::text,
      'new_role', v_new_role::text
    ),
    true
  );

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_old_role::text,
    'new_role', v_new_role::text
  );
end;
$function$;
