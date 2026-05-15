import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  loadAdminSecurityDashboard,
  requestSessionRevocationPlaceholder,
  SecurityDashboard as SecurityDashboardData
} from "@/services/security";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type SecurityDashboardProps = {
  onBack: () => void;
};

export function SecurityDashboard({ onBack }: SecurityDashboardProps) {
  const [dashboard, setDashboard] = useState<SecurityDashboardData>({
    abuseSignals: [],
    deviceSessions: [],
    rateLimits: [],
    suspiciousActivity: []
  });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [revokeReason, setRevokeReason] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    const result = await loadAdminSecurityDashboard();
    setDashboard(result.data);
    setError(result.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(
    () => [
      ["Rate signals", dashboard.rateLimits.length],
      ["Suspicious", dashboard.suspiciousActivity.length],
      ["Abuse review", dashboard.abuseSignals.length],
      ["Sessions", dashboard.deviceSessions.length]
    ],
    [dashboard]
  );

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Security Hardening</Eyebrow>
      <Display style={styles.title}>Production</Display>
      <SerifItalic style={styles.italic}>readiness.</SerifItalic>
      <Body style={styles.copy}>
        {loading ? "Loading admin security records..." : "Security signals stay internal to admin review."}
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

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Rate limit review</Title>
        {dashboard.rateLimits.length === 0 ? <Body>No rate limit events recorded.</Body> : null}
        {dashboard.rateLimits.map((item) => (
          <MetricLine
            key={item.id}
            label={`${item.routeKey} / ${item.windowKey}`}
            value={item.limited ? "limited" : String(item.eventCount)}
          />
        ))}
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Suspicious activity</Title>
        {dashboard.suspiciousActivity.length === 0 ? <Body>No suspicious activity signals.</Body> : null}
        {dashboard.suspiciousActivity.map((item) => (
          <View key={item.id} style={styles.signalRow}>
            <MetricLine label={item.signalType} value={item.severity} />
            <Body>{item.summary ?? item.status}</Body>
          </View>
        ))}
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Abuse detection review</Title>
        {dashboard.abuseSignals.length === 0 ? <Body>No abuse detection signals.</Body> : null}
        {dashboard.abuseSignals.map((item) => (
          <View key={item.id} style={styles.signalRow}>
            <MetricLine label={item.signalType} value={`${Math.round(item.confidence * 100)}%`} />
            <Body>{item.recommendation ?? "Review required before any admin action."}</Body>
            <Caption>{item.aiReviewOnly ? "AI review-only" : item.status}</Caption>
          </View>
        ))}
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Device sessions</Title>
        <FormField
          label="Revoke note"
          placeholder="Reason for requesting a session revoke"
          value={revokeReason}
          onChangeText={setRevokeReason}
          multiline
        />
        {dashboard.deviceSessions.length === 0 ? <Body>No device sessions recorded.</Body> : null}
        {dashboard.deviceSessions.map((item) => (
          <View key={item.id} style={styles.signalRow}>
            <MetricLine label={item.deviceLabel ?? "Device"} value={item.status} />
            <Caption>{[item.platform, formatDate(item.lastSeenAt)].filter(Boolean).join(" / ")}</Caption>
            <LuxuryButton
              arrowDirection="none"
              variant="outline"
              onPress={async () => {
                const result = await requestSessionRevocationPlaceholder({
                  reason: revokeReason,
                  sessionId: item.id
                });
                setError(result.error ?? "");
                setFeedback(result.error ? "" : "Session revoke request logged.");
                await refresh();
              }}
            >
              Request revoke
            </LuxuryButton>
          </View>
        ))}
      </LuxuryCard>

      <PlaceholderPanel
        label="Boundary"
        title="No member-facing security internals"
        copy="These controls are admin-only. Member flows remain quiet and unchanged."
        style={styles.card}
      />
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
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
    gap: spacing.md,
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
  signalRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
