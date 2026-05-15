import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  loadModerationDashboard,
  ModerationDashboard as ModerationDashboardData,
  ModerationWorkflowAction,
  recordModerationWorkflowAction,
  reviewFlaggedBehaviour,
  reviewIncidentEvidence
} from "@/services/moderation";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

const moderationActions: Array<{ key: ModerationWorkflowAction; label: string }> = [
  { key: "warn", label: "warn" },
  { key: "restrict", label: "restrict" },
  { key: "suspend", label: "suspend" },
  { key: "ban_review", label: "ban review" },
  { key: "escalate", label: "escalate" },
  { key: "close_case", label: "close case" }
];

type ModerationDashboardProps = {
  onBack: () => void;
};

export function ModerationDashboard({ onBack }: ModerationDashboardProps) {
  const [dashboard, setDashboard] = useState<ModerationDashboardData>({
    audit: [],
    flaggedBehaviours: [],
    history: [],
    incidents: [],
    trustSnapshots: []
  });
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<Record<string, ModerationWorkflowAction>>({});

  const refresh = async () => {
    setLoading(true);
    setError("");
    const result = await loadModerationDashboard();
    setDashboard(result.data);
    setError(result.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(() => {
    const openIncidents = dashboard.incidents.filter((item) => item.status !== "closed").length;
    const escalated = dashboard.incidents.filter((item) => item.escalationLevel > 0).length;
    const averageTrust =
      dashboard.incidents.length === 0
        ? 0
        : Math.round(
            dashboard.incidents.reduce((total, incident) => total + incident.trustScore, 0) /
              dashboard.incidents.length
          );

    return [
      ["Open incidents", openIncidents],
      ["Escalations", escalated],
      ["Avg trust", averageTrust],
      ["Evidence", dashboard.incidents.reduce((total, incident) => total + incident.evidence.length, 0)]
    ];
  }, [dashboard.incidents]);

  const recordAction = async (incidentId: string, targetUserId?: string) => {
    const action = selectedAction[incidentId];
    if (!action) {
      setError("Choose a moderation action first.");
      return;
    }

    const result = await recordModerationWorkflowAction({
      action,
      incidentId,
      notes: actionNotes[incidentId],
      targetUserId
    });

    setError(result.error ?? "");
    setFeedback(result.error ? "" : "Moderation action logged.");
    await refresh();
  };

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Advanced Moderation</Eyebrow>
      <Display style={styles.title}>Safety desk</Display>
      <SerifItalic style={styles.italic}>human review.</SerifItalic>
      <Body style={styles.copy}>
        {loading ? "Loading protected moderation records..." : "Incidents, evidence, trust history and audit logs are admin-only."}
      </Body>
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
      {feedback ? <Caption style={styles.feedback}>{feedback}</Caption> : null}

      <View style={styles.metricGrid}>
        {metrics.map(([label, value]) => (
          <LuxuryCard key={label} style={styles.metricCard}>
            <Caption>{label}</Caption>
            <Text style={styles.metricValue}>{value}</Text>
          </LuxuryCard>
        ))}
      </View>

      <PlaceholderPanel
        label="AI guardrail"
        title="Recommendations remain review-only"
        copy="Assistant signals can inform admin review, but no ban or account restriction is automated from AI output."
        style={styles.card}
      />

      {dashboard.incidents.length === 0 ? (
        <PlaceholderPanel
          label="Queue"
          title="No incidents awaiting review"
          copy="New safety reports will create incident records automatically for admin review."
          style={styles.card}
        />
      ) : null}

      {dashboard.incidents.map((incident) => (
        <LuxuryCard key={incident.id} style={styles.card}>
          <View style={styles.row}>
            <Caption>{formatDate(incident.createdAt)}</Caption>
            <Badge label={incident.status} />
          </View>
          <Title style={styles.cardTitle}>{incident.reason}</Title>
          <Body>{incident.details}</Body>
          <Body>Trust score: {incident.trustScore}/100</Body>
          <Body>Severity: {incident.severity}</Body>
          <Body>Escalation level: {incident.escalationLevel}</Body>
          {incident.escalationReason ? <Body>Escalation: {incident.escalationReason}</Body> : null}
          {incident.aiRecommendationSummary ? (
            <PlaceholderPanel
              label={incident.aiRecommendationStatus}
              title="Assistant context"
              copy={incident.aiRecommendationSummary}
              style={styles.innerPanel}
            />
          ) : null}

          <FormField
            label="Review note"
            placeholder="Decision context, escalation reason or closure summary"
            value={actionNotes[incident.id] ?? ""}
            onChangeText={(note) => setActionNotes((current) => ({ ...current, [incident.id]: note }))}
            multiline
          />
          <View style={styles.chips}>
            {moderationActions.map((action) => (
              <OptionChip
                key={action.key}
                selected={selectedAction[incident.id] === action.key}
                onPress={() =>
                  setSelectedAction((current) => ({ ...current, [incident.id]: action.key }))
                }
              >
                {action.label}
              </OptionChip>
            ))}
          </View>
          <LuxuryButton
            variant="outline"
            onPress={() => recordAction(incident.id, incident.targetUserId)}
          >
            Log moderation action
          </LuxuryButton>

          <View style={styles.divider} />
          <Caption>Evidence review</Caption>
          {incident.evidence.length === 0 ? (
            <Body>No evidence attached to this incident.</Body>
          ) : (
            incident.evidence.map((evidence) => (
              <View key={evidence.id} style={styles.evidenceRow}>
                <Body>{evidence.evidenceSummary ?? evidence.evidenceType}</Body>
                <Caption>{evidence.reviewedAt ? `Reviewed ${formatDate(evidence.reviewedAt)}` : "Awaiting review"}</Caption>
                <LuxuryButton
                  arrowDirection="none"
                  variant="ghost"
                  onPress={async () => {
                    const result = await reviewIncidentEvidence({
                      evidenceId: evidence.id,
                      notes: actionNotes[incident.id]
                    });
                    setError(result.error ?? "");
                    setFeedback(result.error ? "" : "Evidence marked reviewed.");
                    await refresh();
                  }}
                >
                  Mark reviewed
                </LuxuryButton>
              </View>
            ))
          )}
        </LuxuryCard>
      ))}

      <SectionTitle title="Flagged behaviour" />
      {dashboard.flaggedBehaviours.length === 0 ? (
        <PlaceholderPanel
          label="Review"
          title="No flagged behaviour"
          copy="Pattern and anomaly reviews will appear here for admin judgement."
          style={styles.card}
        />
      ) : null}
      {dashboard.flaggedBehaviours.map((flag) => (
        <LuxuryCard key={flag.id} style={styles.card}>
          <Row label={flag.severity} value={flag.status} />
          <Title style={styles.cardTitle}>{flag.signalType}</Title>
          <Body>{flag.summary ?? "Flagged behaviour awaiting admin review."}</Body>
          <LuxuryButton
            variant="outline"
            onPress={async () => {
              const result = await reviewFlaggedBehaviour(flag.id);
              setError(result.error ?? "");
              setFeedback(result.error ? "" : "Flagged behaviour reviewed.");
              await refresh();
            }}
          >
            Mark reviewed
          </LuxuryButton>
        </LuxuryCard>
      ))}

      <SectionTitle title="Safety history" />
      <LuxuryCard style={styles.card}>
        {dashboard.history.slice(0, 6).map((item) => (
          <View key={`${item.createdAt}-${item.action}`} style={styles.historyRow}>
            <Caption>{formatDate(item.createdAt)}</Caption>
            <Body>{item.action}{item.reviewOnly ? " (review only)" : ""}</Body>
          </View>
        ))}
        {dashboard.history.length === 0 ? <Body>No moderation actions logged yet.</Body> : null}
      </LuxuryCard>

      <SectionTitle title="Audit visibility" />
      <LuxuryCard style={styles.card}>
        {dashboard.audit.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <Caption>{formatDate(item.createdAt)}</Caption>
            <Body>{item.action}</Body>
          </View>
        ))}
        {dashboard.audit.length === 0 ? <Body>No admin audit logs visible.</Body> : null}
      </LuxuryCard>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Caption>{label}</Caption>
      <Badge label={value} />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Title style={styles.sectionTitle}>{title}</Title>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

const styles = StyleSheet.create({
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
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  card: {
    marginBottom: spacing.md,
    marginTop: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  error: {
    color: palette.pale,
    marginBottom: spacing.md
  },
  evidenceRow: {
    borderTopColor: borders.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingVertical: spacing.md
  },
  feedback: {
    color: palette.white,
    marginBottom: spacing.md
  },
  historyRow: {
    borderBottomColor: borders.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingVertical: spacing.sm
  },
  innerPanel: {
    marginTop: spacing.lg
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  metricCard: {
    flex: 1,
    minWidth: 142
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  metricValue: {
    color: palette.white,
    fontFamily: fonts.serifRegular,
    fontSize: 42,
    lineHeight: 48,
    marginTop: spacing.sm
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  sectionTitle: {
    marginTop: spacing.xl
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
