import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");

  const env = {
    ...fileEnv,
    ...process.env,
  };

  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();

  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be configured before build.",
    );
  }

  return {
    base: "/",

    plugins: [react()],

    define: {
      "import.meta.env.VITE_SUPABASE_URL":
        JSON.stringify(supabaseUrl),

      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":
        JSON.stringify(supabasePublishableKey),
    },

    build: {
      sourcemap: false,
    },
  };
});
