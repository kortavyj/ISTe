import { createClient } from "@supabase/supabase-js";

let adminClient = null;

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !secretKey) {
    throw Object.assign(
      new Error("Supabase admin configuration is missing."),
      { code: "AUTH_SECURITY_NOT_CONFIGURED" },
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
