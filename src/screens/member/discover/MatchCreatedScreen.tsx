import { StyleSheet, View } from "react-native";

import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { MemberProfile } from "@/data/matchmaking";
import { borders, palette, spacing } from "@/theme/tokens";

type MatchCreatedScreenProps = {
  onBackToDiscover: () => void;
  onViewMatches: () => void;
  profile: MemberProfile;
};

export function MatchCreatedScreen({
  onBackToDiscover,
  onViewMatches,
  profile
}: MatchCreatedScreenProps) {
  return (
    <View>
      <Eyebrow>Match confirmed</Eyebrow>
      <Display style={styles.title}>An introduction</Display>
      <SerifItalic style={styles.italic}>has opened.</SerifItalic>
      <Body style={styles.copy}>
        You and {profile.name} have both shown interest. Private chat is now unlocked in the
        Matches area. Video scheduling and concierge dating remain locked for later phases.
      </Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.statusRow}>
          <Caption>Member</Caption>
          <Caption style={styles.status}>{profile.name}</Caption>
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>Private chat unlocked</Title>
        <Body>
          Keep the first exchange intentional. The future system will monitor chat thresholds
          before video introductions become available.
        </Body>
      </LuxuryCard>

      <View style={styles.actions}>
        <LuxuryButton onPress={onViewMatches}>View matches</LuxuryButton>
        <LuxuryButton arrowDirection="left" variant="outline" onPress={onBackToDiscover}>
          Back to discover
        </LuxuryButton>
      </View>
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
    fontSize: 39,
    lineHeight: 47
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  card: {
    marginBottom: spacing.xl
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
  },
  actions: {
    gap: spacing.md
  }
});
