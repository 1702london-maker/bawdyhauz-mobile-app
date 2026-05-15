import { LuxuryCard } from "@/components/LuxuryCard";
import { StepScaffold } from "@/components/StepScaffold";
import { Body, Title } from "@/components/Typography";
import { Navigate } from "@/navigation/routes";

type Props = {
  navigate: Navigate;
};

export function VerificationIntroScreen({ navigate }: Props) {
  return (
    <StepScaffold
      eyebrow="Verification"
      stepLabel="08 / 10"
      title="Safety is"
      italic="the standard."
      copy="Verification is a private trust layer before any member can enter matchmaking. It is designed to protect the house and every person inside it."
      primaryLabel="Begin verification"
      onPrimary={() => navigate("idVerification")}
      secondaryLabel="Back"
      onSecondary={() => navigate("manualReviewSubmission")}
    >
      <LuxuryCard>
        <Title>Manual and secure</Title>
        <Body>
          Future build: identity checks, selfie review and internal verification status tracked
          through Supabase and moderation tooling.
        </Body>
      </LuxuryCard>
    </StepScaffold>
  );
}
