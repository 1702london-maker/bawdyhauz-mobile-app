const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

module.exports = {
  expo: {
    name: "BAWDYHAUZ",
    slug: "bawdyhauz-mobile",
    version: "0.1.0",
    orientation: "portrait",
    scheme: "bawdyhauz",
    userInterfaceStyle: "dark",
    splash: {
      backgroundColor: "#050505",
      image: "./assets/bawdyhauz-logo.png",
      resizeMode: "contain"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.bawdyhauz.mobile"
    },
    android: {
      package: "com.bawdyhauz.mobile",
      adaptiveIcon: { backgroundColor: "#050505" }
    },
    web: { bundler: "metro" },
    plugins: [
      "expo-asset",
      "expo-font",
      ["expo-image-picker", {
        photosPermission: "BAWDYHAUZ uses photo access only when you choose media for private review."
      }]
    ],
    extra: {
      supabaseUrl: supabaseUrl ?? "",
      supabaseKey: supabaseKey ?? "",
      useSupabase: true
    }
  }
};
