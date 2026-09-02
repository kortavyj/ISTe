import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY;

if (
  !supabaseUrl ||
  !supabasePublishableKey
) {
  throw new Error(
    "Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

/*
 * Public browser client.
 *
 * SECURITY:
 * This client is intentionally NOT an authentication client.
 * It is used for:
 * - reading public data protected by RLS;
 * - signed Storage uploads where the server issues a one-time upload token.
 *
 * The main ISTe login session lives in Secure HttpOnly cookies
 * and is managed by the Vercel API.
 */
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
