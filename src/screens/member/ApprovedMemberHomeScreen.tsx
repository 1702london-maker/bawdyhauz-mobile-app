import { StyleSheet, View } from "react-native";

import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

export function ApprovedMemberHomeScreen() {
  return (
    <View>
      <Eyebrow>Approved access</Eyebrow>
      <Display style={styles.title}>Welcome inside.</Display>
      <SerifItalic style={styles.italic}>Private, deliberate, calm.</SerifItalic>
      <Body style={styles.copy}>
        This is the approved-member shell. It frames the future BAWDYHAUZ ecosystem without
        building matchmaking, messaging, wellness bookings, events or admin functionality yet.
      </Body>

      <View style={styles.grid}>
        <LuxuryCard style={styles.card}>
          <Caption>01</Caption>
          <Title style={styles.cardTitle}>Matchmaking</Title>
          <Body>Curated introductions will live here in a later phase.</Body>
        </LuxuryCard>
        <LuxuryCard style={styles.card}>
          <Caption>02</Caption>
          <Title style={styles.cardTitle}>Wellness</Title>
          <Body>Therapist and relationship support remains placeholder-only.</Body>
        </LuxuryCard>
      </View>

      <LuxuryCard>
        <View style={styles.statusRow}>
          <Caption>Member standing</Caption>
          <Caption style={styles.status}>Approved preview</Caption>
        </View>
        <View style={styles.divider} />
        <Body>
          The external Shop button in the header opens bawdyhauz.com/shop. No native shop is
          present inside this app shell.
        </Body>
      </LuxuryCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 48,
    lineHeight: 56,
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
  grid: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  card: {
    minHeight: 148
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.md
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
  }
});
