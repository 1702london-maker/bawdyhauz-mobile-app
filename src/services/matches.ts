import { matchStatusLabels, MemberProfile } from "@/data/matchmaking";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { isUuid } from "@/lib/ids";
import { mapProfileRow } from "./profiles";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";

type MatchRow = {
  id: string;
  profile_a?: unknown;
  profile_b?: unknown;
  profile_a_id: string;
  profile_b_id: string;
  status: "pending" | "mutual" | "archived" | "blocked" | "closed";
  message_threads?: Array<{ id: string }> | null;
};

export async function expressInterest(profileId: string): Promise<ServiceResult<{ matched: boolean; profileId: string }>> {
  if (!supabase) {
    return { data: { matched: false, profileId }, mode: supabaseMode };
  }

  if (!isUuid(profileId)) {
    return {
      data: { matched: false, profileId },
      error: "Live match request skipped because this is a local fallback profile.",
      mode: supabaseMode
    };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: { matched: false, profileId }, error: session.error, mode: supabaseMode };
  }

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", session.data)
    .maybeSingle<{ id: string }>();

  if (!ownProfile?.id) {
    return {
      data: { matched: false, profileId },
      error: "Create an approved profile before requesting introductions.",
      mode: supabaseMode
    };
  }

  const { error } = await supabase.from("matches").upsert({
    profile_a_id: ownProfile.id,
    profile_b_id: profileId,
    status: "pending"
  });

  if (!error) {
    await recordEmailEvent("match_created", { profileId });
  }

  return { data: { matched: false, profileId }, error: error?.message, mode: supabaseMode };
}

export async function loadApprovedMatches(fallback: MemberProfile[]): Promise<ServiceResult<MemberProfile[]>> {
  if (!supabase) {
    return { data: fallback, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: fallback, error: session.error, mode: supabaseMode };
  }

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", session.data)
    .maybeSingle<{ id: string }>();

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, profile_a_id, profile_b_id, status, message_threads(id), profile_a:profiles!matches_profile_a_id_fkey(id, display_name, city, bio, intentions, interests, lifestyle_notes, preferred_introduction_city, is_approved), profile_b:profiles!matches_profile_b_id_fkey(id, display_name, city, bio, intentions, interests, lifestyle_notes, preferred_introduction_city, is_approved)"
    )
    .eq("status", "mutual");

  if (error || !data?.length) {
    return { data: fallback, error: error?.message, mode: supabaseMode };
  }

  const profiles = (data as MatchRow[])
    .map((match) => {
      const profile =
        match.profile_a_id === ownProfile?.id ? match.profile_b : match.profile_a;
      const mapped = mapProfileRow(profile as Parameters<typeof mapProfileRow>[0]);
      mapped.matchStatus = match.status === "mutual" ? "chatActive" : undefined;
      mapped.matchId = match.id;
      mapped.threadId = match.message_threads?.[0]?.id;
      return mapped;
    })
    .filter(Boolean);

  return { data: profiles.length ? profiles : fallback, mode: supabaseMode };
}

export { matchStatusLabels };
