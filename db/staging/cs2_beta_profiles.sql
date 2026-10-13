-- Isolated beta only. Apply ONLY to the explicitly approved secondary Supabase project.
-- Compatible with existing ISTe roster RPC requiring id, username and avatar_url.
-- No auth.users replacement and no production data copied.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon,authenticated;
-- User may see and edit their own profile; roster RPC uses security definer.
grant select,insert,update on public.profiles to authenticated;
drop policy if exists cs2_beta_profile_read_self on public.profiles;
create policy cs2_beta_profile_read_self on public.profiles for select to authenticated using (id=auth.uid());
drop policy if exists cs2_beta_profile_insert_self on public.profiles;
create policy cs2_beta_profile_insert_self on public.profiles for insert to authenticated with check (id=auth.uid());
drop policy if exists cs2_beta_profile_update_self on public.profiles;
create policy cs2_beta_profile_update_self on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
