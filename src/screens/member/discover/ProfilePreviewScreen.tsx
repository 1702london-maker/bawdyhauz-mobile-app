import { Image, StyleSheet, Text, View } from "react-native";

import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { MemberProfile } from "@/data/matchmaking";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type ProfilePreviewScreenProps = {
  onBack: () => void;
  onRequestIntroduction: (profile: MemberProfile) => void;
  profile: MemberProfile;
};

export function ProfilePreviewScreen({
  onBack,
  onRequestIntroduction,
  profile
}: ProfilePreviewScreenProps) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to discover
      </LuxuryButton>

      <View style={styles.imagePlaceholder}>
        {profile.imageUrl ? (
          <Image source={{ uri: profile.imageUrl }} style={styles.image} />
        ) : (
          <>
            <Eyebrow>Private portrait</Eyebrow>
            <Caption>Image pending approval</Caption>
          </>
        )}
      </View>

      <Eyebrow>{profile.location}</Eyebrow>
      <Display style={styles.title}>{profile.name}</Display>
      <SerifItalic style={styles.italic}>{profile.intention}</SerifItalic>
      <Body style={styles.copy}>{profile.bio}</Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Match rhythm</Title>
        {profile.compatibilitySignals?.length ? (
          <View style={styles.interests}>
            {profile.compatibilitySignals.map((signal) => (
              <View key={signal} style={styles.interestPill}>
                <Text style={styles.interestText}>{signal}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Body>Conversation-led introduction.</Body>
        )}
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <View style={styles.statusRow}>
          <Caption>Verification</Caption>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.verified ? "Verified" : "Manual review"}</Text>
          </View>
        </View>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Lifestyle notes</Title>
        <Body>{profile.lifestyleNotes}</Body>
        <View style={styles.divider} />
        <Caption>Preferred introduction city</Caption>
        <Body style={styles.city}>{profile.preferredIntroductionCity}</Body>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Interests</Title>
        <View style={styles.interests}>
          {profile.interests.map((interest) => (
            <View key={interest} style={styles.interestPill}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      </LuxuryCard>

      <LuxuryButton onPress={() => onRequestIntroduction(profile)}>
        Request introduction
      </LuxuryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    alignItems: "center",
    aspectRatio: 0.82,
    borderColor: borders.hairline,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
    overflow: "hidden"
  },
  image: {
    height: "100%",
    width: "100%"
  },
  title: {
    fontSize: 52,
    lineHeight: 60,
    marginTop: spacing.lg
  },
  italic: {
    fontSize: 36,
    lineHeight: 44
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  card: {
    marginBottom: spacing.md
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
  cardTitle: {
    marginBottom: spacing.sm
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  city: {
    color: palette.pale,
    marginTop: spacing.xs
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
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
  }
});
