import { StyleSheet, View } from "react-native";

import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Title } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

type EmptyStateProps = {
  label: string;
  title: string;
  copy: string;
};

export function EmptyState({ label, title, copy }: EmptyStateProps) {
  return (
    <LuxuryCard style={styles.card}>
      <View style={styles.row}>
        <Caption>{label}</Caption>
        <View style={styles.dot} />
      </View>
      <View style={styles.divider} />
      <Title style={styles.title}>{title}</Title>
      <Body>{copy}</Body>
    </LuxuryCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dot: {
    backgroundColor: palette.smoke,
    borderRadius: 3,
    height: 6,
    width: 6
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  title: {
    marginBottom: spacing.sm
  }
});
