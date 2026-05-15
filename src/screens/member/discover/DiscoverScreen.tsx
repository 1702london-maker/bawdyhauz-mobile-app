import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { MemberProfile } from "@/data/matchmaking";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

export type InterestState = "interested" | "passed" | "saved" | "blocked";

type DiscoverScreenProps = {
  interestStates: Record<string, InterestState>;
  onSelectProfile: (profile: MemberProfile) => void;
  onSetInterestState: (profileId: string, state: InterestState) => void;
  profiles: MemberProfile[];
};

export function DiscoverScreen({
  interestStates,
  onSelectProfile,
  onSetInterestState,
  profiles
}: DiscoverScreenProps) {
  return (
    <View>
      <Eyebrow>Discover / Matchmaking</Eyebrow>
      <Display style={styles.title}>Curated</Display>
      <SerifItalic style={styles.italic}>introductions.</SerifItalic>
      <Body style={styles.copy}>
        Introductions are ordered with care, using approval status, profile quality and private
        preferences to support better rhythm.
      </Body>

      {profiles.map((profile) => {
        const state = interestStates[profile.id];
        const isBlocked = state === "blocked";

        return (
          <LuxuryCard key={profile.id} style={[styles.card, isBlocked && styles.blockedCard]}>
            <Pressable onPress={() => onSelectProfile(profile)} disabled={isBlocked}>
              <View style={styles.cardTop}>
                <View>
                  <Caption>{profile.location}</Caption>
                  <Title style={styles.name}>
                    {profile.name}{profile.age ? `, ${profile.age}` : ""}
                  </Title>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{profile.verified ? "Verified" : "Review"}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              <Caption>{profile.intention}</Caption>
              {profile.completionPercentage && profile.completionPercentage < 80 ? (
                <Caption style={styles.prompt}>Profile gently completing</Caption>
              ) : null}
              <Body style={styles.bio}>{isBlocked ? "This profile is blocked." : profile.bio}</Body>

              {profile.compatibilitySignals?.length ? (
                <View style={styles.signals}>
                  {profile.compatibilitySignals.map((signal) => (
                    <Text key={signal} style={styles.signalText}>{signal}</Text>
                  ))}
                </View>
              ) : null}

              <View style={styles.interests}>
                {profile.interests.map((interest) => (
                  <View key={interest} style={styles.interestPill}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </Pressable>

            <View style={styles.actions}>
              <LuxuryButton
                arrowDirection="none"
                variant={state === "interested" ? "solid" : "outline"}
                onPress={() => onSetInterestState(profile.id, "interested")}
              >
                Interested
              </LuxuryButton>
              <LuxuryButton
                arrowDirection="none"
                variant={state === "saved" ? "solid" : "outline"}
                onPress={() => onSetInterestState(profile.id, "saved")}
              >
                Save
              </LuxuryButton>
              <LuxuryButton
                arrowDirection="none"
                variant={state === "passed" ? "solid" : "outline"}
                onPress={() => onSetInterestState(profile.id, "passed")}
              >
                Pass
              </LuxuryButton>
              <LuxuryButton
                arrowDirection="none"
                variant={state === "blocked" ? "solid" : "outline"}
                onPress={() => onSetInterestState(profile.id, "blocked")}
              >
                Block
              </LuxuryButton>
            </View>
          </LuxuryCard>
        );
      })}

      <EmptyState
        label="Quiet for now"
        title="No matches yet"
        copy="When mutual interest is confirmed, approved matches will appear in the Matches tab."
      />
      <EmptyState
        label="Under review"
        title="Application still under review"
        copy="If a member is not approved yet, Discover remains locked behind the manual review process."
      />
      <EmptyState
        label="Profile care"
        title="Profile incomplete"
        copy="If core profile context is missing, we will gently invite the member to refine their presence."
      />
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
    marginBottom: spacing.md
  },
  blockedCard: {
    opacity: 0.58
  },
  cardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  name: {
    marginTop: spacing.xs
  },
  badge: {
    borderColor: borders.visible,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: palette.pale,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  bio: {
    marginTop: spacing.sm
  },
  prompt: {
    color: palette.pale,
    marginTop: spacing.sm
  },
  signals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  signalText: {
    color: palette.pale,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  interestPill: {
    borderColor: borders.hairline,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  interestText: {
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg
  }
});
