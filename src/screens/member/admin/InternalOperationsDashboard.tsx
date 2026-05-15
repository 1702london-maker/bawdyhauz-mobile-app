import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  loadOperationsDashboard,
  OperationsDashboard,
  OperationsRecord
} from "@/services/operations";
import { palette, spacing } from "@/theme/tokens";

type Props = {
  onBack: () => void;
};

const empty: OperationsDashboard = {
  conciergeNotes: [],
  events: [],
  supportTickets: [],
  therapists: [],
  venues: []
};

export function InternalOperationsDashboard({ onBack }: Props) {
  const [dashboard, setDashboard] = useState<OperationsDashboard>(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await loadOperationsDashboard();
      setDashboard(result.data);
      setError(result.error ?? "");
      setLoading(false);
    };

    load();
  }, []);

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Operations</Eyebrow>
      <Display style={styles.title}>Concierge room.</Display>
      <SerifItalic style={styles.italic}>human-led control.</SerifItalic>
      <Body style={styles.copy}>
        Internal tools for concierge notes, therapists, venues, experiences and member support.
      </Body>
      {loading ? <Caption>Loading operations...</Caption> : null}
      {error ? <Caption style={styles.error}>{error}</Caption> : null}

      <RecordSection title="Concierge CRM" records={dashboard.conciergeNotes} />
      <RecordSection title="Therapist management" records={dashboard.therapists} />
      <RecordSection title="Venue management" records={dashboard.venues} />
      <RecordSection title="Event management" records={dashboard.events} />
      <RecordSection title="Support tooling" records={dashboard.supportTickets} />

      <PlaceholderPanel
        label="Internal notes"
        title="One shared note discipline"
        copy="Every sensitive decision should carry a concise internal note, a follow-up status and an audit trail."
        style={styles.panel}
      />
    </View>
  );
}

function RecordSection({ records, title }: { records: OperationsRecord[]; title: string }) {
  return (
    <View style={styles.section}>
      <Eyebrow>{title}</Eyebrow>
      {records.length === 0 ? (
        <PlaceholderPanel
          label="Quiet queue"
          title="Nothing waiting"
          copy="New operational records will appear here when the team adds them."
          style={styles.card}
        />
      ) : null}
      {records.map((record) => (
        <LuxuryCard key={record.id} style={styles.card}>
          <Caption>{record.label} · {record.status}</Caption>
          <Title style={styles.cardTitle}>{record.title}</Title>
          {record.detail ? <Body>{record.detail}</Body> : null}
          {record.note ? <Caption style={styles.note}>{record.note}</Caption> : null}
        </LuxuryCard>
      ))}
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
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  error: {
    color: palette.pale,
    marginBottom: spacing.md
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  note: {
    color: palette.pale,
    marginTop: spacing.md
  },
  panel: {
    marginTop: spacing.xl
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
