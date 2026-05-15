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
        Your private member space brings together curated introductions, wellness support,
        discreet experiences and human-led concierge care.
      </Body>

      <View style={styles.grid}>
        <LuxuryCard style={styles.card}>
          <Caption>01</Caption>
          <Title style={styles.cardTitle}>Matchmaking</Title>
          <Body>Review carefully considered introductions and open private conversations when the rhythm is right.</Body>
        </LuxuryCard>
        <LuxuryCard style={styles.card}>
          <Caption>02</Caption>
          <Title style={styles.cardTitle}>Wellness</Title>
          <Body>Request discreet relationship support, emotional clarity sessions and preparation guidance.</Body>
        </LuxuryCard>
      </View>

      <LuxuryCard>
        <View style={styles.statusRow}>
          <Caption>Member standing</Caption>
          <Caption style={styles.status}>Approved</Caption>
        </View>
        <View style={styles.divider} />
        <Body>
          The Shop button opens the official BAWDYHAUZ website so the member app can remain
          focused on privacy, introductions and concierge care.
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
