import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { borders, palette, spacing } from "@/theme/tokens";

type ApplicationStatusScreenProps = {
  onLogout: () => void;
  onRestart: () => void;
};

export function ApplicationStatusScreen({ onLogout, onRestart }: ApplicationStatusScreenProps) {
  return (
    <BrandBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View>
            <Eyebrow>Application status</Eyebrow>
            <Display style={styles.heading}>Be considered.</Display>
            <SerifItalic style={styles.italic}>Manual review pending.</SerifItalic>
            <Body style={styles.copy}>
              This placeholder represents the future membership application state. In Phase 2,
              applicants will submit profile, intent and verification details for private review.
            </Body>
          </View>

          <LuxuryCard>
            <View style={styles.statusRow}>
              <Caption>Status</Caption>
              <Caption style={styles.pending}>Under review</Caption>
            </View>
            <View style={styles.divider} />
            <Title style={styles.cardTitle}>What happens next</Title>
            <Body>
              The BAWDYHAUZ team reviews fit, safety, verification details and membership
              intention before any private ecosystem access unlocks.
            </Body>
          </LuxuryCard>

          <View style={styles.actions}>
            <LuxuryButton onPress={onRestart}>
              Review application
            </LuxuryButton>
            <LuxuryButton arrowDirection="left" variant="outline" onPress={onLogout}>
              Logout
            </LuxuryButton>
          </View>
        </View>
      </SafeAreaView>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl
  },
  heading: {
    fontSize: 50,
    lineHeight: 58,
    marginTop: spacing.xl
  },
  italic: {
    fontSize: 39,
    lineHeight: 46,
    marginBottom: spacing.xl
  },
  copy: {
    marginBottom: spacing.xl
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  pending: {
    color: palette.pale
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: borders.hairline,
    marginVertical: spacing.lg
  },
  cardTitle: {
    marginBottom: spacing.sm
  },
  actions: {
    gap: spacing.md
  }
});
