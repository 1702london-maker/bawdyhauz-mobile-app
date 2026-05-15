import { LuxuryCard } from "@/components/LuxuryCard";
import { StepScaffold } from "@/components/StepScaffold";
import { Body, Title } from "@/components/Typography";
import { Navigate } from "@/navigation/routes";
import { createVerificationPlaceholders, submitMembershipApplication } from "@/services/applications";
import { ApplicationDraft } from "@/state/application";

type Props = {
  draft: ApplicationDraft;
  navigate: Navigate;
  onSubmitted: () => Promise<unknown>;
};

export function ManualReviewSubmissionScreen({ draft, navigate, onSubmitted }: Props) {
  const submit = async () => {
    await submitMembershipApplication(draft);
    await createVerificationPlaceholders();
    await onSubmitted();
    navigate("verificationIntro");
  };

  return (
    <StepScaffold
      eyebrow="Manual review"
      stepLabel="07 / 10"
      title="Submit for"
      italic="consideration."
      copy="This screen represents the final membership application checkpoint before verification begins."
      primaryLabel="Submit application"
      onPrimary={submit}
      secondaryLabel="Back"
      onSecondary={() => navigate("socialLinks")}
    >
      <LuxuryCard>
        <Title>Private review queue</Title>
        <Body>
          Future build: create a submitted application record, lock edits, notify reviewers and
          show the applicant a private pending state.
        </Body>
      </LuxuryCard>
    </StepScaffold>
  );
}
