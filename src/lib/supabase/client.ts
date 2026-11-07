"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicEnvironment();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }
  return browserClient;
}
