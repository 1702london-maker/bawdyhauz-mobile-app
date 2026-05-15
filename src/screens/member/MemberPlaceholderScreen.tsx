import { StyleSheet, View } from "react-native";

import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

type MemberPlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  italic: string;
  copy: string;
  status?: string;
};

export function MemberPlaceholderScreen({
  eyebrow,
  title,
  italic,
  copy,
  status = "Quiet"
}: MemberPlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Display style={styles.title}>{title}</Display>
      <SerifItalic style={styles.italic}>{italic}</SerifItalic>
      <Body style={styles.copy}>{copy}</Body>

      <LuxuryCard>
        <View style={styles.statusRow}>
          <Caption>Member state</Caption>
          <Caption style={styles.status}>{status}</Caption>
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>Private access</Title>
        <Body>
          This area opens when the right member context is available. Until then, the experience
          remains quiet and private.
        </Body>
      </LuxuryCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  title: {
    fontSize: 46,
    lineHeight: 54,
    marginTop: spacing.xl
  },
  italic: {
    fontSize: 38,
    lineHeight: 46,
    marginTop: spacing.xs
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  status: {
    color: palette.pale
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  cardTitle: {
    marginBottom: spacing.sm
  }
});
