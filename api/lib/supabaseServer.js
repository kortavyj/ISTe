import { createClient } from "@supabase/supabase-js";

let supabaseServerClient = null;

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase server configuration is missing.",
    );
  }

  if (!supabaseServerClient) {
    supabaseServerClient = createClient(
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
  }

  return supabaseServerClient;
}
