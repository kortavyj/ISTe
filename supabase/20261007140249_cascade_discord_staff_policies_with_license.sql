alter table public.discord_staff_role_permissions
  add constraint discord_staff_role_permissions_guild_id_fkey
  foreign key (guild_id)
  references public.discord_guild_licenses (guild_id)
  on delete cascade;
