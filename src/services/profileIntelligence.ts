import { MemberProfile } from "@/data/matchmaking";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser, requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

export type ProfileCompletion = {
  missingItems: string[];
  percentage: number;
  prompts: string[];
};

const requiredFields: Array<{ key: keyof MemberProfile; label: string }> = [
  { key: "name", label: "Display name" },
  { key: "location", label: "City" },
  { key: "bio", label: "Private bio" },
  { key: "intention", label: "Relationship intention" },
  { key: "preferredIntroductionCity", label: "Preferred introduction city" },
  { key: "lifestyleNotes", label: "Lifestyle notes" }
];

export function calculateProfileCompletion(profile?: Partial<MemberProfile>): ProfileCompletion {
  const missingItems = requiredFields
    .filter((field) => !String(profile?.[field.key] ?? "").trim())
    .map((field) => field.label);
  if (!profile?.interests?.length) {
    missingItems.push("Interests");
  }
  if (!profile?.imageUrl) {
    missingItems.push("Primary image");
  }

  const total = requiredFields.length + 2;
  const percentage = Math.max(0, Math.round(((total - missingItems.length) / total) * 100));

  return {
    missingItems,
    percentage,
    prompts: missingItems.map((item) => `${item} will help the team curate better introductions.`)
  };
}

export function scoreProfile(profile: MemberProfile): MemberProfile {
  const completion = calculateProfileCompletion(profile);
  const signals = new Set<string>();

  if (profile.preferredIntroductionCity && profile.location === profile.preferredIntroductionCity) {
    signals.add("Shared city preference");
  }
  if (profile.intention.toLowerCase().includes("long") || profile.intention.toLowerCase().includes("serious")) {
    signals.add("Aligned intention");
  }
  if (profile.interests.length >= 3) {
    signals.add("Strong rhythm");
  }
  if (profile.bio.length > 80) {
    signals.add("Conversation-led match");
  }

  return {
    ...profile,
    compatibilitySignals: Array.from(signals).slice(0, 3),
    completionPercentage: profile.completionPercentage ?? completion.percentage,
    visibilityWeight: profile.visibilityWeight ?? (completion.percentage < 70 ? 60 : 100)
  };
}

export async function loadCurrentProfileCompletion(): Promise<ServiceResult<ProfileCompletion>> {
  const fallback = calculateProfileCompletion(undefined);
  if (!supabase) {
    return { data: fallback, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: fallback, error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, city, bio, intentions, interests, lifestyle_notes, preferred_introduction_city, primary_photo_public_url")
    .eq("user_id", user.data)
    .maybeSingle();

  if (!data) {
    return { data: fallback, error: error ? String(error) : undefined, mode: supabaseMode };
  }

  const completion = calculateProfileCompletion({
    bio: data.bio ?? "",
    imageUrl: data.primary_photo_public_url ?? "",
    intention: data.intentions?.[0] ?? "",
    interests: data.interests ?? [],
    lifestyleNotes: data.lifestyle_notes ?? "",
    location: data.city ?? "",
    name: data.display_name ?? "",
    preferredIntroductionCity: data.preferred_introduction_city ?? ""
  });

  await supabase.from("profiles").update({ completion_percentage: completion.percentage }).eq("user_id", user.data);
  return { data: completion, mode: supabaseMode };
}

export async function updateAdminProfileVisibility(input: {
  discoverHidden?: boolean;
  isFeatured?: boolean;
  isPublicSafe?: boolean;
  notes?: string;
  profileId: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      admin_visibility_notes: input.notes,
      discover_hidden: input.discoverHidden,
      is_featured: input.isFeatured,
      is_public_safe: input.isPublicSafe
    })
    .eq("id", input.profileId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}
