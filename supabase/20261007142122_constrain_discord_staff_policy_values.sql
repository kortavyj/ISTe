alter table public.discord_staff_role_permissions
  add constraint discord_staff_role_permissions_guild_id_format_check
  check (guild_id ~ '^[0-9]{17,20}$'),
  add constraint discord_staff_role_permissions_role_id_format_check
  check (role_id ~ '^[0-9]{17,20}$' and role_id <> guild_id),
  add constraint discord_staff_role_permissions_label_length_check
  check (char_length(label) <= 100),
  add constraint discord_staff_role_permissions_permission_keys_check
  check (
    cardinality(permission_keys) between 1 and 22
    and permission_keys <@ array[
      'overview.view',
      'analytics.view',
      'commands.view',
      'commands.manage',
      'security.view',
      'security.manage',
      'security.emergency',
      'incidents.view',
      'incidents.manage',
      'onboarding.view',
      'onboarding.manage',
      'moderation.view',
      'moderation.manage',
      'support.view',
      'support.manage',
      'publishing.view',
      'publishing.manage',
      'system.view',
      'system.manage',
      'system.snapshot',
      'system.restore',
      'diagnostics.view'
    ]::text[]
  );
