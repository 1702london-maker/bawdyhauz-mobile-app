import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { borders, palette, radii, spacing } from "@/theme/tokens";

type LuxuryCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function LuxuryCard({ children, style }: LuxuryCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(24, 24, 24, 0.82)",
    borderColor: borders.quiet,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    shadowColor: palette.void,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.38,
    shadowRadius: 30
  }
});
