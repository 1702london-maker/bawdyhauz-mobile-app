import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

export type RuntimeConfig = {
  supabasePublishableKey?: string;
  supabaseUrl?: string;
};

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl:
    (extra.supabaseUrl as string | undefined)?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(),

  supabasePublishableKey:
    (extra.supabaseKey as string | undefined)?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
};

export const isSupabaseConfigured = Boolean(
  runtimeConfig.supabaseUrl &&
    runtimeConfig.supabasePublishableKey
);
