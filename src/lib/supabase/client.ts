"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

export function createBrowserSupabase() {
  const { url, key } = publicSupabaseEnv();
  return createBrowserClient(url, key);
}
