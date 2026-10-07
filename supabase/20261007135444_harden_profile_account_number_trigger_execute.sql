revoke execute on function public.protect_profile_account_number() from public;
revoke execute on function public.protect_profile_account_number() from anon;
revoke execute on function public.protect_profile_account_number() from authenticated;

grant execute on function public.protect_profile_account_number() to service_role;
