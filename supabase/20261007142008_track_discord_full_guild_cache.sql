alter table public.discord_customer_accounts
  add column if not exists guild_cache_complete boolean not null default false;
