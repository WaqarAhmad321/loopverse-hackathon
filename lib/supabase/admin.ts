import { createClient } from "@supabase/supabase-js";

// Service role client for server-side operations that bypass RLS
// Use ONLY in webhooks, cron jobs, and admin operations
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
