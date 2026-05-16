import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
).trim();

const supabaseKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();

export const isLiveMode = true;

export type SupabaseMode = "mock" | "connected";

export const supabaseMode: SupabaseMode =
  supabaseUrl && supabaseKey ? "connected" : "mock";

export const supabase: SupabaseClient | undefined =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
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
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}
