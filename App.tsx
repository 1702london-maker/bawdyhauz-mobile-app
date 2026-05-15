import {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium
} from "@expo-google-fonts/cormorant-garamond";
import {
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium
} from "@expo-google-fonts/jost";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppNavigator } from "@/navigation/AppNavigator";
import { palette } from "@/theme/tokens";

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={palette.void} />
      <AppNavigator fontsLoaded={fontsLoaded} />
    </SafeAreaProvider>
  );
}
