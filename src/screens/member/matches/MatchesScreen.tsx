import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { matchStatusLabels, MemberProfile } from "@/data/matchmaking";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type MatchesScreenProps = {
  archivedMatches: MemberProfile[];
  blockedMatches: MemberProfile[];
  matches: MemberProfile[];
  onArchiveMatch: (profileId: string) => void;
  onBlockMatch: (profileId: string) => void;
  onOpenChat: (profile: MemberProfile) => void;
};

export function MatchesScreen({
  archivedMatches,
  blockedMatches,
  matches,
  onArchiveMatch,
  onBlockMatch,
  onOpenChat
}: MatchesScreenProps) {
  return (
    <View>
      <Eyebrow>Matches</Eyebrow>
      <Display style={styles.title}>Approved</Display>
      <SerifItalic style={styles.italic}>connections.</SerifItalic>
      <Body style={styles.copy}>
        Only approved mutual matches appear here. Chat is represented as a status only; real
        messaging, video scheduling and concierge booking are not built in Phase 4.
      </Body>

      {matches.length === 0 ? (
        <EmptyState
          label="No matches"
          title="No matches yet"
          copy="When mutual interest is confirmed, approved matches will appear here."
        />
      ) : (
        <MatchSection
          label="Active matches"
          matches={matches}
          onArchiveMatch={onArchiveMatch}
          onBlockMatch={onBlockMatch}
          onOpenChat={onOpenChat}
        />
      )}

      <MatchSection
        label="Archived matches"
        matches={archivedMatches}
        quiet
        onArchiveMatch={onArchiveMatch}
        onBlockMatch={onBlockMatch}
        onOpenChat={onOpenChat}
      />
      <MatchSection
        label="Blocked matches"
        matches={blockedMatches}
        quiet
        onArchiveMatch={onArchiveMatch}
        onBlockMatch={onBlockMatch}
        onOpenChat={onOpenChat}
      />

      <EmptyState
        label="Review state"
        title="Application still under review"
        copy="If approval is pending, the Matches area remains inaccessible."
      />
      <EmptyState
        label="Profile state"
        title="Profile incomplete"
        copy="If the member profile is incomplete, matching can remain paused."
      />
    </View>
  );
}

type MatchSectionProps = {
  label: string;
  matches: MemberProfile[];
  onArchiveMatch: (profileId: string) => void;
  onBlockMatch: (profileId: string) => void;
  onOpenChat: (profile: MemberProfile) => void;
  quiet?: boolean;
};

function MatchSection({
  label,
  matches,
  onArchiveMatch,
  onBlockMatch,
  onOpenChat,
  quiet = false
}: MatchSectionProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        label={label}
        title={quiet ? "Nothing here" : "No matches yet"}
        copy={
          quiet
            ? "This list will populate when a match is moved into this state."
            : "When mutual interest is confirmed, approved matches will appear here."
        }
      />
    );
  }

  return (
    <View style={styles.section}>
      <Caption>{label}</Caption>
      {matches.map((match) => (
        <LuxuryCard key={match.id} style={[styles.card, quiet && styles.quietCard]}>
          <View style={styles.row}>
            <View>
              <Caption>{match.location}</Caption>
              <Title style={styles.name}>{match.name}</Title>
            </View>
            {match.matchStatus ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{matchStatusLabels[match.matchStatus]}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.divider} />
          <Body>{match.bio}</Body>
          <View style={styles.actions}>
            <LuxuryButton arrowDirection="none" onPress={() => onOpenChat(match)}>
              Open private chat
            </LuxuryButton>
            <LuxuryButton
              arrowDirection="none"
              variant="outline"
              onPress={() => onArchiveMatch(match.id)}
            >
              Archive
            </LuxuryButton>
            <LuxuryButton
              arrowDirection="none"
              variant="outline"
              onPress={() => onBlockMatch(match.id)}
            >
              Block
            </LuxuryButton>
          </View>
        </LuxuryCard>
      ))}
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
  quietCard: {
    opacity: 0.72
  },
  section: {
    marginBottom: spacing.lg
  },
  row: {
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
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    color: palette.pale,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg
  }
});
