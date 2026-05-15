import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import { pickAndUploadMedia, UploadedMedia } from "@/services/media";
import { loadCurrentProfileCompletion, ProfileCompletion } from "@/services/profileIntelligence";
import { palette, spacing } from "@/theme/tokens";

export function ProfileMediaScreen() {
  const [galleryItems, setGalleryItems] = useState<UploadedMedia[]>([]);
  const [message, setMessage] = useState("");
  const [completion, setCompletion] = useState<ProfileCompletion | undefined>();
  const [primaryPhoto, setPrimaryPhoto] = useState<UploadedMedia | undefined>();
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    loadCurrentProfileCompletion().then((result) => setCompletion(result.data));
  }, []);

  const upload = async (kind: "private-gallery" | "profile-photos") => {
    setUploading(kind);
    setMessage("");
    const result = await pickAndUploadMedia({
      bucket: kind,
      kind: kind === "profile-photos" ? "primary-profile" : "private-gallery"
    });
    setUploading("");

    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (!result.data) {
      return;
    }

    if (kind === "profile-photos") {
      setPrimaryPhoto(result.data);
      setMessage("Primary image uploaded for private review.");
    } else {
      setGalleryItems((current) => [result.data!, ...current]);
      setMessage("Private gallery image uploaded securely.");
    }
  };

  return (
    <View>
      <Eyebrow>Profile</Eyebrow>
      <Display style={styles.title}>Private media</Display>
      <SerifItalic style={styles.italic}>with review first.</SerifItalic>
      <Body style={styles.copy}>
        Images are stored securely and remain subject to BAWDYHAUZ review before public-safe use.
      </Body>

      {completion ? (
        <LuxuryCard style={styles.card}>
          <Title style={styles.cardTitle}>Profile completion</Title>
          <Body>{completion.percentage}% complete</Body>
          {completion.missingItems.length ? (
            <Caption style={styles.message}>
              To improve curation: {completion.missingItems.join(", ")}
            </Caption>
          ) : (
            <Caption style={styles.message}>Your profile has a strong private foundation.</Caption>
          )}
        </LuxuryCard>
      ) : null}

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Primary image</Title>
        {primaryPhoto?.publicUrl ? (
          <Image source={{ uri: primaryPhoto.publicUrl }} style={styles.image} />
        ) : (
          <PlaceholderPanel
            label="Primary image"
            title="No image selected"
            copy="Choose a refined profile image for private review."
          />
        )}
        <LuxuryButton onPress={() => upload("profile-photos")}>
          {uploading === "profile-photos" ? "Uploading" : primaryPhoto ? "Replace image" : "Choose image"}
        </LuxuryButton>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Private gallery</Title>
        <Body>
          Private gallery images are not public. Future access requests and approvals will sit here.
        </Body>
        <LuxuryButton variant="outline" onPress={() => upload("private-gallery")}>
          {uploading === "private-gallery" ? "Uploading" : "Add private image"}
        </LuxuryButton>
        {galleryItems.length ? (
          <Caption style={styles.message}>{galleryItems.length} private image uploaded.</Caption>
        ) : null}
      </LuxuryCard>

      {message ? <Caption style={styles.message}>{message}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.md
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  image: {
    aspectRatio: 0.78,
    marginBottom: spacing.lg,
    width: "100%"
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
