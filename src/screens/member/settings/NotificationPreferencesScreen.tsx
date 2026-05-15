import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  defaultNotificationPreferences,
  NotificationPreferences,
  preferenceLabels,
  PushPreferenceKey
} from "@/data/notifications";
import {
  loadNotificationPreferences,
  registerPushToken,
  saveNotificationPreferences
} from "@/services/notifications";
import { palette, spacing } from "@/theme/tokens";

export function NotificationPreferencesScreen() {
  const [message, setMessage] = useState("");
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    loadNotificationPreferences().then((result) => {
      if (!alive) {
        return;
      }
      setPreferences(result.data);
      setMessage(result.error ?? "");
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (key: PushPreferenceKey) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    setSaving(true);
    const result = await saveNotificationPreferences(preferences);
    setSaving(false);
    setMessage(result.error ?? "Notification preferences saved.");
  };

  const requestPush = async () => {
    const result = await registerPushToken();
    setMessage(
      result.error
        ? "Notifications remain off for this device. You can still use BAWDYHAUZ normally."
        : result.data
          ? "This device is ready for discreet member notifications."
          : "Notifications remain off for this device."
    );
  };

  return (
    <View>
      <Eyebrow>Settings</Eyebrow>
      <Display style={styles.title}>Notifications</Display>
      <SerifItalic style={styles.italic}>with privacy first.</SerifItalic>
      <Body style={styles.copy}>
        Choose what BAWDYHAUZ may notify you about. Permission can be denied and the app will
        continue normally.
      </Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Push preferences</Title>
        <View style={styles.chips}>
          {preferenceLabels.map((item) => (
            <OptionChip
              key={item.key}
              selected={preferences[item.key]}
              onPress={() => toggle(item.key)}
            >
              {item.label}
            </OptionChip>
          ))}
        </View>
        <View style={styles.actions}>
          <LuxuryButton onPress={save}>{saving ? "Saving" : "Save preferences"}</LuxuryButton>
          <LuxuryButton variant="outline" onPress={requestPush}>
            Register push token
          </LuxuryButton>
        </View>
      </LuxuryCard>

      <PlaceholderPanel
        label="Email notifications"
        title="Private email updates"
        copy="Important membership, safety and concierge updates are prepared securely outside the app."
      />

      {message ? <Caption style={styles.message}>{message}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.md
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  message: {
    color: palette.pale,
    marginTop: spacing.lg
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
