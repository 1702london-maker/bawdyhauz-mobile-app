import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { AnalyticsSummary, loadAdminAnalytics, trackAnalyticsEvent } from "@/services/analytics";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type AnalyticsDashboardProps = {
  onBack: () => void;
};

const emptySummary: AnalyticsSummary = {
  conversion: {
    applicationsApproved: 0,
    applicationsSubmitted: 0,
    approvalRate: 0,
    rejected: 0,
    waitlisted: 0
  },
  engagement: {
    matches: 0,
    messages: 0,
    reviews: 0,
    videoDates: 0
  },
  events: {
    last7Days: 0,
    total: 0,
    uniqueEventNames: 0
  },
  investor: {
    approvedProfiles: 0,
    foundingMembers: 0,
    subscriptions: 0
  },
  operations: {
    conciergeRequests: 0,
    experienceRsvps: 0,
    experienceWaitlists: 0,
    safetyReports: 0,
    therapySessions: 0
  },
  retention: {
    cohortStatus: "foundation_ready",
    placeholder: true
  }
};

export function AnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(emptySummary);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setError("");
    const result = await loadAdminAnalytics();
    setAnalytics(result.data);
    setError(result.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const primaryMetrics = useMemo(
    () => [
      ["Tracked events", analytics.events.total],
      ["7 day events", analytics.events.last7Days],
      ["Applications", analytics.conversion.applicationsSubmitted],
      ["Approval rate", `${analytics.conversion.approvalRate}%`]
    ],
    [analytics]
  );

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Analytics & Growth</Eyebrow>
      <Display style={styles.title}>Signals</Display>
      <SerifItalic style={styles.italic}>without exposure.</SerifItalic>
      <Body style={styles.copy}>
        {loading ? "Loading aggregate metrics..." : "Admin analytics are aggregated and privacy-first."}
      </Body>
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
      {feedback ? <Caption style={styles.feedback}>{feedback}</Caption> : null}

      <View style={styles.metricGrid}>
        {primaryMetrics.map(([label, value]) => (
          <LuxuryCard key={label} style={styles.metricCard}>
            <Caption>{label}</Caption>
            <Text style={styles.metricValue}>{value}</Text>
          </LuxuryCard>
        ))}
      </View>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Conversion funnel</Title>
        <MetricLine label="Submitted" value={analytics.conversion.applicationsSubmitted} />
        <MetricLine label="Approved" value={analytics.conversion.applicationsApproved} />
        <MetricLine label="Waitlisted" value={analytics.conversion.waitlisted} />
        <MetricLine label="Rejected" value={analytics.conversion.rejected} />
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Engagement</Title>
        <MetricLine label="Matches" value={analytics.engagement.matches} />
        <MetricLine label="Messages" value={analytics.engagement.messages} />
        <MetricLine label="Video introductions" value={analytics.engagement.videoDates} />
        <MetricLine label="Post-date reviews" value={analytics.engagement.reviews} />
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Operations usage</Title>
        <MetricLine label="Concierge requests" value={analytics.operations.conciergeRequests} />
        <MetricLine label="Therapist sessions" value={analytics.operations.therapySessions} />
        <MetricLine label="Experience RSVPs" value={analytics.operations.experienceRsvps} />
        <MetricLine label="Experience waitlists" value={analytics.operations.experienceWaitlists} />
        <MetricLine label="Safety reports" value={analytics.operations.safetyReports} />
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Investor metrics</Title>
        <MetricLine label="Approved profiles" value={analytics.investor.approvedProfiles} />
        <MetricLine label="Subscriptions" value={analytics.investor.subscriptions} />
        <MetricLine label="Founding members" value={analytics.investor.foundingMembers} />
      </LuxuryCard>

      <PlaceholderPanel
        label="Retention"
        title="Cohort model"
        copy={`Retention and cohort modelling are marked ${analytics.retention.cohortStatus}; no individual user exposure is shown here.`}
        style={styles.card}
      />

      <LuxuryButton
        variant="outline"
        onPress={async () => {
          const result = await trackAnalyticsEvent("admin.analytics_test", "admin", {
            dashboard: "analytics"
          });
          setFeedback(result.error ? "" : "Analytics test event recorded.");
          setError(result.error ?? "");
          await refresh();
        }}
      >
        Record analytics test
      </LuxuryButton>
    </View>
  );
}

function MetricLine({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metricLine}>
      <Caption>{label}</Caption>
      <Body>{value}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginTop: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.lg
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
  metricLine: {
    borderBottomColor: borders.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm
  },
  metricValue: {
    color: palette.white,
    fontFamily: fonts.serifRegular,
    fontSize: 42,
    lineHeight: 48,
    marginTop: spacing.sm
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
