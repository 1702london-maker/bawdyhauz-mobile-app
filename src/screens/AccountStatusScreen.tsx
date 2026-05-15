import { StyleSheet, View } from "react-native";

import { BrandBackground } from "@/components/BrandBackground";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { AccountStatus } from "@/services/auth";
import { palette, spacing } from "@/theme/tokens";

type AccountStatusScreenProps = {
  onLogout: () => void;
  onStartApplication: () => void;
  status: AccountStatus;
};

const statusCopy: Record<string, { copy: string; italic: string; title: string }> = {
  banned: {
    copy: "This account is no longer permitted to access BAWDYHAUZ. Contact member support if you believe this needs review.",
    italic: "access restricted.",
    title: "Account"
  },
  pending: {
    copy: "Your account is active, but membership approval is still under manual review.",
    italic: "under review.",
    title: "Application"
  },
  rejected: {
    copy: "Your application has not been approved at this time. BAWDYHAUZ keeps review decisions private and human-led.",
    italic: "not approved.",
    title: "Application"
  },
  restricted: {
    copy: "Some account access is restricted while the member team reviews the account standing.",
    italic: "under review.",
    title: "Account"
  },
  waitlisted: {
    copy: "Your application is on the private waitlist. The member team will review availability before opening access.",
    italic: "waitlisted.",
    title: "Membership"
  }
};

export function AccountStatusScreen({
  onLogout,
  onStartApplication,
  status
}: AccountStatusScreenProps) {
  const detail = statusCopy[status.state] ?? statusCopy.pending;
  const canApply = status.state === "anonymous" || status.state === "pending";

  return (
    <BrandBackground>
      <View style={styles.content}>
        <Eyebrow>Account status</Eyebrow>
        <Display style={styles.title}>{detail.title}</Display>
        <SerifItalic style={styles.italic}>{detail.italic}</SerifItalic>
        <Body style={styles.copy}>{detail.copy}</Body>

        <LuxuryCard>
          <Caption>Status</Caption>
          <Title style={styles.cardTitle}>{status.applicationStatus ?? status.state}</Title>
          <Body>Email: {status.email ?? "Not signed in"}</Body>
          <Body>Standing: {status.standing ?? "clear"}</Body>
        </LuxuryCard>

        <View style={styles.actions}>
          {canApply ? (
            <LuxuryButton onPress={onStartApplication}>Continue application</LuxuryButton>
          ) : null}
          <LuxuryButton arrowDirection="left" variant="outline" onPress={onLogout}>
            Logout
          </LuxuryButton>
        </View>
      </View>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  cardTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: "capitalize"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
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
  title: {
    fontSize: 50,
    lineHeight: 58,
    marginTop: spacing.lg
  }
});
