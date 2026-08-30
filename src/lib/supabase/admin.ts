import "server-only";

import { createClient } from "@supabase/supabase-js";
import { serviceSupabaseEnv } from "./env";

export function createAdminSupabase() {
  const { url, serviceKey } = serviceSupabaseEnv();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
