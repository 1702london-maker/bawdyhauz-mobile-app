import { useState } from "react";

import { PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { StepScaffold } from "@/components/StepScaffold";
import { Caption } from "@/components/Typography";
import { Navigate } from "@/navigation/routes";
import { pickAndUploadMedia } from "@/services/media";
import { palette, spacing } from "@/theme/tokens";

type Props = {
  navigate: Navigate;
};

export function PhotoUploadScreen({ navigate }: Props) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    setUploading(true);
    setMessage("");
    const result = await pickAndUploadMedia({ bucket: "profile-photos", kind: "application-profile" });
    setUploading(false);
    setMessage(result.error ?? (result.data ? "Image received for private review." : ""));
  };

  return (
    <StepScaffold
      eyebrow="Profile images"
      stepLabel="05 / 10"
      title="Private presentation,"
      italic="not performance."
      copy="Add a considered image for review. Images remain private until approved by BAWDYHAUZ."
      primaryLabel="Continue"
      onPrimary={() => navigate("socialLinks")}
      secondaryLabel="Back"
      onSecondary={() => navigate("lifestyleInterests")}
    >
      <PlaceholderPanel
        label="Profile image"
        title={uploading ? "Uploading securely" : "Choose a considered image"}
        copy="Your image is stored for private review and can be refined later from your profile."
      />
      <LuxuryButton variant="outline" onPress={upload}>
        {uploading ? "Uploading" : "Upload image"}
      </LuxuryButton>
      {message ? <Caption style={{ color: palette.pale, marginTop: spacing.md }}>{message}</Caption> : null}
    </StepScaffold>
  );
}
