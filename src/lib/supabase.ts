import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, runtimeConfig } from "@/lib/env";

export type SupabaseMode = "mock" | "connected";

export const supabaseMode: SupabaseMode = isSupabaseConfigured ? "connected" : "mock";

export const supabase: SupabaseClient | undefined = isSupabaseConfigured
  ? createClient(runtimeConfig.supabaseUrl ?? "", runtimeConfig.supabasePublishableKey ?? "", {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage
      }
    })
  : undefined;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. App is running in mock mode.");
  }

  return supabase;
}
