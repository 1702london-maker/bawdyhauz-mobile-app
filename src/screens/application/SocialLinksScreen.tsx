import { FormField, PlaceholderPanel } from "@/components/FormField";
import { StepScaffold } from "@/components/StepScaffold";
import { Navigate } from "@/navigation/routes";

type Props = {
  navigate: Navigate;
};

export function SocialLinksScreen({ navigate }: Props) {
  return (
    <StepScaffold
      eyebrow="Social context"
      stepLabel="06 / 10"
      title="Quiet signals,"
      italic="manual review."
      copy="Social links are used as optional trust context for the internal review team. They are not public profile content."
      primaryLabel="Continue"
      onPrimary={() => navigate("manualReviewSubmission")}
      secondaryLabel="Back"
      onSecondary={() => navigate("photoUpload")}
    >
      <FormField label="Instagram or personal site" placeholder="https://..." />
      <FormField label="LinkedIn or professional context" placeholder="https://..." />
      <PlaceholderPanel
        label="Internal only"
        title="Reviewed discreetly"
        copy="Future build: store links as private application metadata visible only to approved reviewers."
      />
    </StepScaffold>
  );
}
