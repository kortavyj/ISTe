import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin configuration is missing.");
  }

  if (!cachedClient) {
    cachedClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return cachedClient;
}
