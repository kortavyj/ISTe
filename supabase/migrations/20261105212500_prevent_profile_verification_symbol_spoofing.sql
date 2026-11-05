CREATE OR REPLACE FUNCTION public.prevent_profile_verification_symbol_spoofing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.display_name IS NOT NULL
     AND NEW.display_name !~ '^[[:alnum:][:space:]_.''’ -]+$' THEN
    RAISE EXCEPTION 'INVALID_DISPLAY_NAME_SYMBOLS'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_prevent_verification_symbol_spoofing ON public.profiles;
CREATE TRIGGER profiles_prevent_verification_symbol_spoofing
BEFORE INSERT OR UPDATE OF display_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_verification_symbol_spoofing();

REVOKE ALL ON FUNCTION public.prevent_profile_verification_symbol_spoofing() FROM PUBLIC, anon, authenticated;
