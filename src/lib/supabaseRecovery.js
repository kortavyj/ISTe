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
    "Supabase recovery client is not configured.",
  );
}

const recoveryStorage = {
  getItem(key) {
    try {
      return window.sessionStorage
        .getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    try {
      window.sessionStorage
        .setItem(key, value);
    } catch {
      // Recovery still works in-memory for the current page.
    }
  },

  removeItem(key) {
    try {
      window.sessionStorage
        .removeItem(key);
    } catch {
      // Nothing else to clean.
    }
  },
};

/*
 * Dedicated recovery-only auth client.
 *
 * SECURITY:
 * - separate from the public database client;
 * - session is stored in sessionStorage, not localStorage;
 * - it disappears when the browser session/tab is closed;
 * - it is used only by /reset-password.
 */
export const recoverySupabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        flowType: "pkce",
        storage:
          recoveryStorage,
        storageKey:
          "iste-recovery-auth",
      },
    },
  );
