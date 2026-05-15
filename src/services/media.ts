import * as ImagePicker from "expo-image-picker";

import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

export type MediaBucket =
  | "experience-images"
  | "private-gallery"
  | "profile-photos"
  | "report-evidence"
  | "verification-documents";

export type UploadedMedia = {
  bucket: MediaBucket;
  path: string;
  publicUrl?: string;
};

type PickUploadInput = {
  bucket: MediaBucket;
  kind: string;
  mediaType?: "image" | "all";
  profileId?: string;
};

export async function pickAndUploadMedia(input: PickUploadInput): Promise<ServiceResult<UploadedMedia | undefined>> {
  if (!supabase) {
    return { data: undefined, error: "Media upload is available when BAWDYHAUZ is connected.", mode: supabaseMode };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      data: undefined,
      error: "Photo access was not granted. You can continue without uploading now.",
      mode: supabaseMode
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: input.mediaType !== "all",
    mediaTypes: input.mediaType === "all" ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
    quality: 0.86
  });

  if (result.canceled || !result.assets[0]) {
    return { data: undefined, mode: supabaseMode };
  }

  return uploadPickedAsset(result.assets[0], input);
}

async function uploadPickedAsset(
  asset: ImagePicker.ImagePickerAsset,
  input: PickUploadInput
): Promise<ServiceResult<UploadedMedia | undefined>> {
  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: undefined, error: user.error, mode: supabaseMode };
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const extension = extensionFromUri(asset.uri, asset.mimeType);
  const path = `${user.data}/${input.kind}-${Date.now()}.${extension}`;
  const { error } = await supabase!.storage.from(input.bucket).upload(path, blob, {
    contentType: asset.mimeType ?? `image/${extension}`,
    upsert: true
  });

  if (error) {
    return { data: undefined, error: error.message, mode: supabaseMode };
  }

  const publicUrl =
    input.bucket === "profile-photos" || input.bucket === "experience-images"
      ? supabase!.storage.from(input.bucket).getPublicUrl(path).data.publicUrl
      : undefined;

  await recordMediaMetadata({
    bucket: input.bucket,
    path,
    profileId: input.profileId,
    publicUrl,
    userId: user.data
  });

  return { data: { bucket: input.bucket, path, publicUrl }, mode: supabaseMode };
}

async function recordMediaMetadata({
  bucket,
  path,
  profileId,
  publicUrl,
  userId
}: {
  bucket: MediaBucket;
  path: string;
  profileId?: string;
  publicUrl?: string;
  userId: string;
}) {
  if (bucket === "profile-photos") {
    const { data: profile } = await supabase!
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle<{ id: string }>();
    const resolvedProfileId = profileId ?? profile?.id;

    await supabase!.from("profile_media").insert({
      bucket_id: bucket,
      is_private: false,
      is_public_safe: false,
      media_type: "profile_photo",
      profile_id: resolvedProfileId,
      storage_path: path,
      user_id: userId
    });
    await supabase!
      .from("profiles")
      .update({ primary_photo_path: path, primary_photo_public_url: publicUrl })
      .eq("user_id", userId);
    return;
  }

  if (bucket === "private-gallery") {
    await supabase!.from("profile_media").insert({
      bucket_id: bucket,
      is_private: true,
      is_public_safe: false,
      media_type: "private_gallery",
      storage_path: path,
      user_id: userId
    });
  }

  if (bucket === "experience-images") {
    await supabase!.from("experience_media").insert({
      bucket_id: bucket,
      is_public_safe: false,
      storage_path: path
    });
  }
}

export async function attachVerificationUpload(
  field: "id_document_placeholder" | "selfie_placeholder",
  path: string
): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: false, mode: supabaseMode };
  }
  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: false, error: user.error, mode: supabaseMode };
  }
  const { error } = await supabase.from("verification_checks").upsert({
    [field]: path,
    status: "submitted",
    user_id: user.data
  });
  return { data: !error, error: error?.message, mode: supabaseMode };
}

function extensionFromUri(uri: string, mimeType?: string | null) {
  if (mimeType?.includes("png")) {
    return "png";
  }
  if (mimeType?.includes("webp")) {
    return "webp";
  }
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1] ?? "jpg";
}
