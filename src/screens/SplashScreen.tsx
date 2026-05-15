import { Image, StyleSheet, View } from "react-native";

import { BrandBackground } from "@/components/BrandBackground";
import { Caption, Eyebrow, SerifItalic } from "@/components/Typography";
import { palette, spacing } from "@/theme/tokens";

type SplashScreenProps = {
  fontsLoaded: boolean;
};

export function SplashScreen({ fontsLoaded }: SplashScreenProps) {
  return (
    <BrandBackground>
      <View style={styles.container}>
        <Image
          source={require("../../assets/bawdyhauz-logo.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <View style={styles.brandBlock}>
          <Eyebrow>Private Connection Ecosystem</Eyebrow>
          <SerifItalic style={styles.italic}>Closed access. Human led.</SerifItalic>
        </View>
        <Caption style={styles.loading}>
          {fontsLoaded ? "Est. MMXXIV - Preparing entry" : "Loading private system"}
        </Caption>
      </View>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  logo: {
    width: "78%",
    maxWidth: 330,
    height: 330,
    marginBottom: spacing.xl
  },
  brandBlock: {
    alignItems: "center"
  },
  italic: {
    fontSize: 29,
    lineHeight: 34
  },
  loading: {
    position: "absolute",
    bottom: spacing.xxl,
    letterSpacing: 2.1,
    textTransform: "uppercase"
  }
});
