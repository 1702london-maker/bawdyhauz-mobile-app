export type RuntimeConfig = {
  supabasePublishableKey?: string;
  supabaseUrl?: string;
  useSupabase: boolean;
};

export const runtimeConfig: RuntimeConfig = {
  supabasePublishableKey:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  useSupabase: process.env.EXPO_PUBLIC_USE_SUPABASE === "true"
};

export const isSupabaseConfigured = Boolean(
  runtimeConfig.useSupabase &&
    runtimeConfig.supabaseUrl &&
    runtimeConfig.supabasePublishableKey
);
