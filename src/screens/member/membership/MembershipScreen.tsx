import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { MembershipPlan, MemberSubscription } from "@/data/membership";
import { loadMembershipPlans, loadMySubscription, requestCheckoutPlaceholder } from "@/services/membership";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

export function MembershipScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<MemberSubscription>({
    foundingMember: false,
    status: "inactive",
    tier: "standard"
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([loadMembershipPlans(), loadMySubscription()]).then(([planResult, subscriptionResult]) => {
      if (!alive) {
        return;
      }
      setPlans(planResult.data);
      setSubscription(subscriptionResult.data);
      setMessage(subscriptionResult.error ?? "");
    });
    return () => {
      alive = false;
    };
  }, []);

  const requestTier = async (tier: MembershipPlan["tier"]) => {
    const result = await requestCheckoutPlaceholder(tier);
    setMessage(result.error ?? `Upgrade request prepared for ${tier}.`);
  };

  return (
    <View>
      <Eyebrow>Membership</Eyebrow>
      <Display style={styles.title}>Tiers</Display>
      <SerifItalic style={styles.italic}>by invitation.</SerifItalic>
      <Body style={styles.copy}>
        Membership tiers define access, priority and concierge depth. Live Stripe checkout is
        prepared server-side and remains disabled until payment keys are configured.
      </Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.row}>
          <View>
            <Caption>Current tier</Caption>
            <Title style={styles.cardTitle}>{subscription.foundingMember ? "Founding Member" : subscription.tier}</Title>
          </View>
          <Badge label={subscription.status} />
        </View>
        <View style={styles.divider} />
        <Body>Billing: {subscription.billingNote ?? "Placeholder billing not connected"}</Body>
        <Body>Renewal: {subscription.currentPeriodEnd ?? "Renewal date pending"}</Body>
        <Body>Status states: active, cancelled, expired and past due are ready for Stripe webhook updates.</Body>
      </LuxuryCard>

      {plans.map((plan) => (
        <LuxuryCard key={plan.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Caption>{plan.pricePlaceholder}</Caption>
              <Title style={styles.cardTitle}>{plan.name}</Title>
            </View>
            <Badge label={plan.tier} />
          </View>
          <Body>{plan.description}</Body>
          <View style={styles.benefits}>
            {plan.benefits.map((benefit) => (
              <Text key={benefit} style={styles.benefit}>
                {benefit}
              </Text>
            ))}
          </View>
          <LuxuryButton
            arrowDirection="none"
            variant={subscription.tier === plan.tier ? "solid" : "outline"}
            onPress={() => requestTier(plan.tier)}
          >
            {subscription.tier === plan.tier ? "Current tier" : "Upgrade / downgrade placeholder"}
          </LuxuryButton>
        </LuxuryCard>
      ))}

      {message ? <Caption style={styles.message}>{message}</Caption> : null}
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
  benefit: {
    borderColor: borders.hairline,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    color: palette.ash,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1.4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  benefits: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginTop: spacing.xs,
    textTransform: "capitalize"
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
  flex: {
    flex: 1
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  message: {
    color: palette.pale,
    marginTop: spacing.md
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
