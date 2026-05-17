import { MemberProfile } from "@/data/matchmaking";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { scoreProfile } from "./profileIntelligence";
import { ServiceResult } from "./types";

export type ProfileRow = {
  bio: string | null;
  city: string | null;
  display_name: string;
  id: string;
  interests: string[] | null;
  intentions: string[] | null;
  is_approved: boolean;
  completion_percentage?: number | null;
  lifestyle_notes: string | null;
  preferred_introduction_city: string | null;
  primary_photo_public_url?: string | null;
  is_featured?: boolean | null;
  visibility_weight?: number | null;
};

export type ProfilePatch = {
  bio?: string;
  city?: string;
  display_name?: string;
  interests?: string[];
  intentions?: string[];
  lifestyle_notes?: string;
  preferred_introduction_city?: string;
};

export function mapProfileRow(row: ProfileRow): MemberProfile {
  return {
    age: 0,
    bio: row.bio ?? "",
    id: row.id,
    imageUrl: row.primary_photo_public_url ?? undefined,
    intention: row.intentions?.[0] ?? "Curated introduction",
    interests: row.interests ?? [],
    lifestyleNotes: row.lifestyle_notes ?? "",
    location: row.city ?? "Private",
    name: row.display_name,
    preferredIntroductionCity: row.preferred_introduction_city ?? row.city ?? "",
    completionPercentage: row.completion_percentage ?? undefined,
    isFeatured: Boolean(row.is_featured),
    visibilityWeight: row.visibility_weight ?? undefined,
    verified: row.is_approved
  };
}

export async function loadDiscoverProfiles(): Promise<ServiceResult<MemberProfile[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  const { data, error } = await supabase.rpc("discover_profiles");

  if (error || !data?.length) {
    return { data: [], error: error?.message, mode: supabaseMode };
  }

  return {
    data: (data as ProfileRow[]).map((row: ProfileRow) => scoreProfile(mapProfileRow(row))),
    mode: supabaseMode
  };
}

export async function upsertCurrentProfile(patch: ProfilePatch): Promise<ServiceResult<ProfilePatch>> {
  if (!supabase) {
    return { data: patch, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: patch, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("profiles").upsert({
    ...patch,
    display_name: patch.display_name ?? "Private member",
    is_public_safe: false,
    user_id: session.data
  });

  return { data: patch, error: error?.message, mode: supabaseMode };
}

export async function updateProfile(
  profileId: string,
  patch: ProfilePatch
): Promise<ServiceResult<ProfilePatch>> {
  if (!supabase) {
    return { data: patch, mode: supabaseMode };
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", profileId);
  return { data: patch, error: error?.message, mode: supabaseMode };
}
