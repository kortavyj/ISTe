-- Permit legacy tournament publication only from an authenticated caller.
-- The function itself verifies the user owns the tournament.
revoke execute on function public.iste_publish_tournament(uuid) from public, anon;
grant execute on function public.iste_publish_tournament(uuid) to authenticated;
