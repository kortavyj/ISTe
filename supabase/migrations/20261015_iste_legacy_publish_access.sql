-- Anonymous visitors must not execute the privileged legacy publication RPC.
revoke execute on function public.iste_publish_tournament(uuid) from public, anon;
