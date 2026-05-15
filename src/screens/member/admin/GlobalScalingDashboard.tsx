import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  loadSupportedCities,
  scalingChecklist,
  SupportedCity,
  updateCityLaunchStatus
} from "@/services/globalScaling";
import { palette, spacing } from "@/theme/tokens";

type Props = {
  onBack: () => void;
};

const statuses = ["planned", "private_beta", "active", "paused"];

export function GlobalScalingDashboard({ onBack }: Props) {
  const [cities, setCities] = useState<SupportedCity[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const result = await loadSupportedCities();
    setCities(result.data);
    setError(result.error ?? "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to admin
      </LuxuryButton>
      <Eyebrow>Global scaling</Eyebrow>
      <Display style={styles.title}>City by city.</Display>
      <SerifItalic style={styles.italic}>never rushed.</SerifItalic>
      <Body style={styles.copy}>
        Expansion readiness across cities, coverage, localisation and operational staffing.
      </Body>
      {loading ? <Caption>Loading supported cities...</Caption> : null}
      {error ? <Caption style={styles.error}>{error}</Caption> : null}

      {cities.map((city) => (
        <LuxuryCard key={city.id} style={styles.card}>
          <Caption>{city.country} · {city.timezone}</Caption>
          <Title style={styles.cardTitle}>{city.city}</Title>
          <Body>{city.launchNotes ?? "Launch notes are being prepared."}</Body>
          <View style={styles.coverage}>
            <Caption>Concierge: {city.conciergeCoverage}</Caption>
            <Caption>Therapist: {city.therapistCoverage}</Caption>
            <Caption>Venues: {city.venueCoverage}</Caption>
            <Caption>{city.currencyCode} · {city.localeCode}</Caption>
          </View>
          <View style={styles.chips}>
            {statuses.map((status) => (
              <OptionChip
                key={status}
                selected={city.launchStatus === status}
                onPress={async () => {
                  await updateCityLaunchStatus(city.id, status);
                  await refresh();
                }}
              >
                {status.replace("_", " ")}
              </OptionChip>
            ))}
          </View>
        </LuxuryCard>
      ))}

      <Checklist title="City launch checklist" items={scalingChecklist.cityLaunch} />
      <Checklist title="Concierge hiring" items={scalingChecklist.conciergeHiring} />
      <Checklist title="Therapist onboarding" items={scalingChecklist.therapistOnboarding} />
      <Checklist title="Venue partner onboarding" items={scalingChecklist.venueOnboarding} />
      <Checklist title="Moderation staffing" items={scalingChecklist.moderationStaffing} />
      <Checklist title="Technical scaling" items={scalingChecklist.technical} />

      <PlaceholderPanel
        label="Media and CDN"
        title="Optimise before volume"
        copy="Compress images, keep private media protected, review signed URL lifetimes and monitor storage access patterns before wider launch."
        style={styles.card}
      />
    </View>
  );
}

function Checklist({ items, title }: { items: string[]; title: string }) {
  return (
    <LuxuryCard style={styles.card}>
      <Caption>{title}</Caption>
      {items.map((item) => (
        <Body key={item} style={styles.item}>
          {item}
        </Body>
      ))}
    </LuxuryCard>
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
    marginTop: spacing.lg
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  coverage: {
    gap: spacing.xs,
    marginTop: spacing.md
  },
  error: {
    color: palette.pale,
    marginBottom: spacing.md
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  item: {
    marginTop: spacing.sm
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
