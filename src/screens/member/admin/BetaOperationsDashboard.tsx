import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  BetaDashboard,
  createBetaInvite,
  loadBetaDashboard,
  updateFeedbackStatus
} from "@/services/betaLaunch";
import { palette, spacing } from "@/theme/tokens";

type Props = {
  onBack: () => void;
};

const fallback: BetaDashboard = {
  cohorts: [],
  feedback: [],
  invites: [],
  waitlist: []
};

export function BetaOperationsDashboard({ onBack }: Props) {
  const [dashboard, setDashboard] = useState<BetaDashboard>(fallback);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const result = await loadBetaDashboard();
    setDashboard(result.data);
    setError(result.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const createInvite = async () => {
    setFeedback("");
    setError("");
    const result = await createBetaInvite({
      assignedEmail: inviteEmail,
      code: inviteCode || `HAUZ-${Date.now().toString().slice(-5)}`
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setInviteCode("");
    setInviteEmail("");
    setFeedback("Invite prepared.");
    await refresh();
  };

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Beta launch</Eyebrow>
      <Display style={styles.title}>Private beta.</Display>
      <SerifItalic style={styles.italic}>curated with care.</SerifItalic>
      <Body style={styles.copy}>
        Manage invites, cohorts, waitlist priority and member feedback before wider release.
      </Body>
      {loading ? <Caption>Loading private beta operations...</Caption> : null}
      {feedback ? <Caption style={styles.feedback}>{feedback}</Caption> : null}
      {error ? <Caption style={styles.error}>{error}</Caption> : null}

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Create invite</Title>
        <FormField label="Invite code" value={inviteCode} onChangeText={setInviteCode} />
        <FormField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Assigned email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
        />
        <LuxuryButton onPress={createInvite}>Prepare invite</LuxuryButton>
      </LuxuryCard>

      <Section title="Cohorts">
        {dashboard.cohorts.map((cohort) => (
          <LuxuryCard key={cohort.id} style={styles.card}>
            <Caption>{cohort.status}</Caption>
            <Title style={styles.cardTitle}>{cohort.name}</Title>
            <Body>{cohort.launchNotes ?? "Launch notes are being prepared."}</Body>
            <Caption>{cohort.memberCount} members</Caption>
          </LuxuryCard>
        ))}
      </Section>

      <Section title="Invites">
        {dashboard.invites.length === 0 ? (
          <PlaceholderPanel
            label="Quiet queue"
            title="No invites prepared"
            copy="Create a private beta invite when a candidate is ready."
          />
        ) : null}
        {dashboard.invites.map((invite) => (
          <LuxuryCard key={invite.id} style={styles.card}>
            <Caption>{invite.status}</Caption>
            <Title style={styles.cardTitle}>{invite.code}</Title>
            <Body>{invite.assignedEmail ?? "Available for assignment"}</Body>
            <Caption>{invite.cohortName ?? "No cohort selected"}</Caption>
          </LuxuryCard>
        ))}
      </Section>

      <Section title="Waitlist">
        {dashboard.waitlist.map((lead) => (
          <LuxuryCard key={lead.id} style={styles.card}>
            <Caption>{lead.adminStatus}</Caption>
            <Title style={styles.cardTitle}>{lead.name}</Title>
            <Body>{lead.email ?? "Private contact"}</Body>
            <Body>{lead.priorityNotes ?? lead.referralSource ?? "Awaiting review notes."}</Body>
          </LuxuryCard>
        ))}
      </Section>

      <Section title="Feedback">
        {dashboard.feedback.map((item) => (
          <LuxuryCard key={item.id} style={styles.card}>
            <Caption>{item.type} · {item.priority}</Caption>
            <Title style={styles.cardTitle}>{item.title}</Title>
            <Body>{item.details ?? "No private details provided."}</Body>
            <View style={styles.chips}>
              {["reviewing", "resolved", "archived"].map((status) => (
                <OptionChip
                  key={status}
                  selected={item.status === status}
                  onPress={async () => {
                    await updateFeedbackStatus(item.id, status);
                    await refresh();
                  }}
                >
                  {status}
                </OptionChip>
              ))}
            </View>
          </LuxuryCard>
        ))}
      </Section>
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  error: {
    color: palette.pale,
    marginBottom: spacing.md
  },
  feedback: {
    color: palette.white,
    marginBottom: spacing.md
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  section: {
    marginTop: spacing.xl
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
