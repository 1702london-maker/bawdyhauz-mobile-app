import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Body, Caption, Display, Eyebrow, SerifItalic } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

type AgeGateScreenProps = {
  onConfirm: () => void;
};

export function AgeGateScreen({ onConfirm }: AgeGateScreenProps) {
  return (
    <BrandBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.rule} />
          <Eyebrow>Adults only</Eyebrow>
          <Display style={styles.heading}>This platform is for</Display>
          <SerifItalic style={styles.headingItalic}>adults only.</SerifItalic>
          <Body style={styles.copy}>
            BAWDYHAUZ is a private members platform for adults aged 18 and above. By
            entering you confirm your age and agree to the private standard of the house.
          </Body>
          <View style={styles.actions}>
            <LuxuryButton onPress={onConfirm}>I am 18 or older</LuxuryButton>
            <LuxuryButton variant="outline">I am under 18</LuxuryButton>
          </View>
          <Caption style={styles.legal}>Terms, privacy and conduct standards apply.</Caption>
        </View>
      </SafeAreaView>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  rule: {
    width: 32,
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.visible,
    marginBottom: spacing.lg
  },
  heading: {
    fontSize: 44,
    lineHeight: 52,
    marginTop: spacing.lg
  },
  headingItalic: {
    fontSize: 42,
    lineHeight: 50,
    marginBottom: spacing.lg
  },
  copy: {
    maxWidth: 420,
    marginBottom: spacing.xl
  },
  actions: {
    gap: spacing.md
  },
  legal: {
    color: palette.smoke,
    marginTop: spacing.xl
  }
});
