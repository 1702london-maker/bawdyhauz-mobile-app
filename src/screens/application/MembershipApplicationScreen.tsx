import { LuxuryCard } from "@/components/LuxuryCard";
import { StepScaffold } from "@/components/StepScaffold";
import { Body, Title } from "@/components/Typography";
import { Navigate } from "@/navigation/routes";

type Props = {
  navigate: Navigate;
};

export function MembershipApplicationScreen({ navigate }: Props) {
  return (
    <StepScaffold
      eyebrow="Membership application"
      stepLabel="01 / 10"
      title="Be considered."
      italic="Not instantly admitted."
      copy="BAWDYHAUZ reviews every application manually. This phase collects the profile context needed for a private, safe and intentional membership decision."
      primaryLabel="Begin application"
      onPrimary={() => navigate("personalDetails")}
      secondaryLabel="Return to onboarding"
      onSecondary={() => navigate("onboarding")}
    >
      <LuxuryCard>
        <Title>What we review</Title>
        <Body>
          Identity readiness, intentions, lifestyle alignment, social context and verification
          preparedness. No public profile is created at this stage.
        </Body>
      </LuxuryCard>
    </StepScaffold>
  );
}
