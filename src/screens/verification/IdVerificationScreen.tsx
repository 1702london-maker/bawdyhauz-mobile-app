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

export function IdVerificationScreen({ navigate }: Props) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    setUploading(true);
    const result = await pickAndUploadMedia({
      bucket: "verification-documents",
      kind: "identity-document",
      mediaType: "all"
    });
    if (result.data?.path) {
      await attachVerificationUpload("id_document_placeholder", result.data.path);
    }
    setUploading(false);
    setMessage(result.error ?? (result.data ? "Identity document received for private review." : ""));
  };

  return (
    <StepScaffold
      eyebrow="Identity"
      stepLabel="09 / 10"
      title="ID verification"
      italic="held privately."
      copy="Upload a document for manual review. Verification files are protected and never shown to other members."
      primaryLabel="Continue"
      onPrimary={() => navigate("selfieVerification")}
      secondaryLabel="Back"
      onSecondary={() => navigate("verificationIntro")}
    >
      <PlaceholderPanel
        label="Document capture"
        title={uploading ? "Uploading securely" : "Government ID"}
        copy="Accepted files are stored in protected review storage for the BAWDYHAUZ team."
      />
      <LuxuryButton variant="outline" onPress={upload}>
        {uploading ? "Uploading" : "Upload document"}
      </LuxuryButton>
      {message ? <Caption style={{ color: palette.pale, marginTop: spacing.md }}>{message}</Caption> : null}
    </StepScaffold>
  );
}
