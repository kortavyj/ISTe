begin;

-- ISTe privileged MFA enforcement.
-- Apply only after the application code that supports TOTP MFA is deployed.
-- Admin and owner operations must originate from an aal2 JWT.

drop policy if exists audit_read_admin
  on public.admin_audit_log;

create policy audit_read_admin
  on public.admin_audit_log
  for select
  to authenticated
  using (
    (select private.current_user_is_active())
    and
    (select private.current_user_role()) in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists profiles_read_admin
  on public.profiles;

create policy profiles_read_admin
  on public.profiles
  for select
  to authenticated
  using (
    (select private.current_user_is_active())
    and
    (select private.current_user_role()) in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists settings_read_admin
  on public.site_settings;

create policy settings_read_admin
  on public.site_settings
  for select
  to authenticated
  using (
    (select private.current_user_is_active())
    and
    (select private.current_user_role()) in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists user_roles_read_admin
  on public.user_roles;

create policy user_roles_read_admin
  on public.user_roles
  for select
  to authenticated
  using (
    (select private.current_user_is_active())
    and
    (select private.current_user_role()) in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists news_staff_read_all
  on public.news_posts;

create policy news_staff_read_all
  on public.news_posts
  for select
  to authenticated
  using (
    public.current_app_role() =
      'editor'::public.app_role
    or (
      public.current_app_role() in (
        'admin'::public.app_role,
        'owner'::public.app_role
      )
      and
      coalesce(
        (select auth.jwt() ->> 'aal'),
        'aal1'
      ) = 'aal2'
    )
  );

drop policy if exists news_staff_create
  on public.news_posts;

create policy news_staff_create
  on public.news_posts
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      (
        public.current_app_role() =
          'editor'::public.app_role
        and
        status =
          'draft'::public.news_status
        and
        is_featured = false
      )
      or (
        public.current_app_role() in (
          'admin'::public.app_role,
          'owner'::public.app_role
        )
        and
        coalesce(
          (select auth.jwt() ->> 'aal'),
          'aal1'
        ) = 'aal2'
      )
    )
  );

drop policy if exists news_admin_update_all
  on public.news_posts;

create policy news_admin_update_all
  on public.news_posts
  for update
  to authenticated
  using (
    public.current_app_role() in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  )
  with check (
    public.current_app_role() in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists news_admin_delete
  on public.news_posts;

create policy news_admin_delete
  on public.news_posts
  for delete
  to authenticated
  using (
    public.current_app_role() in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists news_images_staff_select
  on storage.objects;

create policy news_images_staff_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'news-images'
    and (
      public.current_app_role() =
        'editor'::public.app_role
      or (
        public.current_app_role() in (
          'admin'::public.app_role,
          'owner'::public.app_role
        )
        and
        coalesce(
          (select auth.jwt() ->> 'aal'),
          'aal1'
        ) = 'aal2'
      )
    )
  );

drop policy if exists news_images_staff_insert
  on storage.objects;

create policy news_images_staff_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'news-images'
    and
    (storage.foldername(name))[1] =
      auth.uid()::text
    and (
      public.current_app_role() =
        'editor'::public.app_role
      or (
        public.current_app_role() in (
          'admin'::public.app_role,
          'owner'::public.app_role
        )
        and
        coalesce(
          (select auth.jwt() ->> 'aal'),
          'aal1'
        ) = 'aal2'
      )
    )
  );

drop policy if exists news_images_staff_update
  on storage.objects;

create policy news_images_staff_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'news-images'
    and
    public.current_app_role() in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  )
  with check (
    bucket_id = 'news-images'
    and
    public.current_app_role() in (
      'admin'::public.app_role,
      'owner'::public.app_role
    )
    and
    coalesce(
      (select auth.jwt() ->> 'aal'),
      'aal1'
    ) = 'aal2'
  );

drop policy if exists news_images_staff_delete
  on storage.objects;

create policy news_images_staff_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'news-images'
    and (
      (
        public.current_app_role() =
          'editor'::public.app_role
        and
        (storage.foldername(name))[1] =
          auth.uid()::text
      )
      or (
        public.current_app_role() in (
          'admin'::public.app_role,
          'owner'::public.app_role
        )
        and
        coalesce(
          (select auth.jwt() ->> 'aal'),
          'aal1'
        ) = 'aal2'
      )
    )
  );

create or replace function public.owner_list_audit_log(
  p_limit integer default 100,
  p_offset integer default 0
)
returns table(
  id uuid,
  actor_user_id uuid,
  actor_email text,
  actor_username text,
  target_user_id uuid,
  target_email text,
  target_username text,
  action text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_limit integer :=
    least(greatest(coalesce(p_limit, 100), 1), 200);
  v_offset integer :=
    greatest(coalesce(p_offset, 0), 0);
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

  return query
  select
    audit.id,
    audit.actor_id as actor_user_id,
    actor_auth.email::text as actor_email,
    actor_profile.username::text as actor_username,
    audit.target_user_id,
    target_auth.email::text as target_email,
    target_profile.username::text as target_username,
    audit.action::text,
    audit.details,
    audit.created_at
  from public.admin_audit_log audit
  left join auth.users actor_auth
    on actor_auth.id = audit.actor_id
  left join public.profiles actor_profile
    on actor_profile.id = audit.actor_id
  left join auth.users target_auth
    on target_auth.id = audit.target_user_id
  left join public.profiles target_profile
    on target_profile.id = audit.target_user_id
  where
    v_actor_role = 'owner'::public.app_role
    or audit.actor_id = v_actor_id
  order by audit.created_at desc
  limit v_limit
  offset v_offset;
end;
$function$;

create or replace function public.owner_list_users(
  p_search text default '',
  p_limit integer default 100,
  p_offset integer default 0
)
returns table(
  user_id uuid,
  email text,
  username text,
  display_name text,
  avatar_url text,
  role text,
  is_blocked boolean,
  blocked_reason text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_search text :=
    lower(trim(coalesce(p_search, '')));
  v_limit integer :=
    least(greatest(coalesce(p_limit, 100), 1), 200);
  v_offset integer :=
    greatest(coalesce(p_offset, 0), 0);
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

  return query
  select
    auth_user.id as user_id,
    auth_user.email::text,
    profile.username::text,
    profile.display_name::text,
    profile.avatar_url::text,
    coalesce(access.role::text, 'user') as role,
    coalesce(access.is_blocked, false) as is_blocked,
    coalesce(access.blocked_reason, '')::text
      as blocked_reason,
    auth_user.created_at,
    auth_user.last_sign_in_at
  from auth.users auth_user
  left join public.profiles profile
    on profile.id = auth_user.id
  left join public.user_roles access
    on access.user_id = auth_user.id
  where
    v_search = ''
    or lower(coalesce(auth_user.email, ''))
      like '%' || v_search || '%'
    or lower(coalesce(profile.username, ''))
      like '%' || v_search || '%'
    or lower(coalesce(profile.display_name, ''))
      like '%' || v_search || '%'
  order by auth_user.created_at desc
  limit v_limit
  offset v_offset;
end;
$function$;

create or replace function public.owner_set_user_blocked(
  p_user_id uuid,
  p_is_blocked boolean,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_target_role public.app_role;
  v_reason text :=
    left(trim(coalesce(p_reason, '')), 500);
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
    raise exception 'CANNOT_BLOCK_SELF';
  end if;

  select target_access.role
  into v_target_role
  from public.user_roles target_access
  where target_access.user_id = p_user_id
  for update;

  if not found then
    raise exception 'USER_ROLE_NOT_FOUND';
  end if;

  if v_target_role = 'owner'::public.app_role then
    raise exception 'CANNOT_BLOCK_OWNER';
  end if;

  if v_actor_role = 'admin'::public.app_role
     and v_target_role in (
       'admin'::public.app_role,
       'owner'::public.app_role
     ) then
    raise exception 'ADMIN_CANNOT_MANAGE_PRIVILEGED';
  end if;

  update public.user_roles
  set
    is_blocked = coalesce(p_is_blocked, false),
    blocked_reason = case
      when coalesce(p_is_blocked, false)
        then v_reason
      else ''
    end,
    blocked_at = case
      when coalesce(p_is_blocked, false)
        then now()
      else null
    end,
    blocked_by = case
      when coalesce(p_is_blocked, false)
        then v_actor_id
      else null
    end,
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
    case
      when coalesce(p_is_blocked, false)
        then 'user_blocked'
      else 'user_unblocked'
    end,
    jsonb_build_object(
      'actor_role', v_actor_role::text,
      'reason',
      case
        when coalesce(p_is_blocked, false)
          then v_reason
        else ''
      end
    ),
    true
  );

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'is_blocked',
    coalesce(p_is_blocked, false)
  );
end;
$function$;

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
      'owner'::public.app_role
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

commit;
