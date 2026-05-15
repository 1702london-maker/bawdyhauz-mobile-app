import { useState } from "react";

import { PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { StepScaffold } from "@/components/StepScaffold";
import { Caption } from "@/components/Typography";
import { Navigate } from "@/navigation/routes";
import { attachVerificationUpload, pickAndUploadMedia } from "@/services/media";
import { palette, spacing } from "@/theme/tokens";

type Props = {
  navigate: Navigate;
};

export function SelfieVerificationScreen({ navigate }: Props) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    setUploading(true);
    const result = await pickAndUploadMedia({
      bucket: "verification-documents",
      kind: "selfie-check"
    });
    if (result.data?.path) {
      await attachVerificationUpload("selfie_placeholder", result.data.path);
    }
    setUploading(false);
    setMessage(result.error ?? (result.data ? "Selfie received for private verification." : ""));
  };

  return (
    <StepScaffold
      eyebrow="Selfie check"
      stepLabel="10 / 10"
      title="Presence matched"
      italic="to identity."
      copy="Add a clear selfie for manual verification. It remains protected and visible only to reviewers."
      primaryLabel="Finish verification"
      onPrimary={() => navigate("applicationStatus")}
      secondaryLabel="Back"
      onSecondary={() => navigate("idVerification")}
    >
      <PlaceholderPanel
        label="Selfie verification"
        title={uploading ? "Uploading securely" : "Add verification selfie"}
        copy="This supports human-led verification before membership access is considered."
      />
      <LuxuryButton variant="outline" onPress={upload}>
        {uploading ? "Uploading" : "Upload selfie"}
      </LuxuryButton>
      {message ? <Caption style={{ color: palette.pale, marginTop: spacing.md }}>{message}</Caption> : null}
    </StepScaffold>
  );
}
