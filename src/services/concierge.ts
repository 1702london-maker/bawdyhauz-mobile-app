import { BookingStatus } from "@/data/admin";
import { isUuid } from "@/lib/ids";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { recordEmailEvent } from "./notifications";
import { ServiceResult } from "./types";

export type ConciergeRequest = {
  atmosphere?: string | null;
  city?: string | null;
  dietaryAccessibilityNotes?: string | null;
  id: string;
  idealDateTime?: string | null;
  matchId?: string | null;
  notes?: string | null;
  privacyPreferences?: string | null;
  selectedVenueId?: string | null;
  status: BookingStatus;
  venueCategory?: string | null;
};

export type VenueOption = {
  atmosphere?: string | null;
  category?: string | null;
  city: string;
  id: string;
  name: string;
};

type ConciergeRow = {
  atmosphere?: string | null;
  city?: string | null;
  dietary_accessibility_notes?: string | null;
  id: string;
  ideal_date_time?: string | null;
  match_id?: string | null;
  notes?: string | null;
  privacy_preferences?: string | null;
  selected_venue_id?: string | null;
  status: BookingStatus;
  venue_category?: string | null;
};

function mapConcierge(row: ConciergeRow): ConciergeRequest {
  return {
    atmosphere: row.atmosphere,
    city: row.city,
    dietaryAccessibilityNotes: row.dietary_accessibility_notes,
    id: row.id,
    idealDateTime: row.ideal_date_time,
    matchId: row.match_id,
    notes: row.notes,
    privacyPreferences: row.privacy_preferences,
    selectedVenueId: row.selected_venue_id,
    status: row.status,
    venueCategory: row.venue_category
  };
}

export async function loadConciergeRequest(matchId?: string): Promise<ServiceResult<ConciergeRequest | undefined>> {
  if (!supabase || !matchId || !isUuid(matchId)) {
    return { data: undefined, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("concierge_requests")
    .select("id, match_id, city, atmosphere, ideal_date_time, status, notes, venue_category, dietary_accessibility_notes, privacy_preferences, selected_venue_id")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ConciergeRow>();

  return { data: data ? mapConcierge(data) : undefined, error: error?.message, mode: supabaseMode };
}

export async function submitConciergeRequest(input: {
  atmosphere: string;
  city: string;
  dietaryAccessibilityNotes?: string;
  idealDateTime: string;
  matchId?: string;
  notes?: string;
  privacyPreferences?: string;
  venueCategory?: string;
}): Promise<ServiceResult<ConciergeRequest | undefined>> {
  if (!supabase || !input.matchId || !isUuid(input.matchId)) {
    return { data: undefined, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: undefined, error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("concierge_requests")
    .insert({
      atmosphere: input.atmosphere,
      city: input.city,
      dietary_accessibility_notes: input.dietaryAccessibilityNotes,
      ideal_date_time: input.idealDateTime,
      match_id: input.matchId,
      notes: input.notes,
      privacy_preferences: input.privacyPreferences,
      requester_user_id: user.data,
      status: "requested",
      venue_category: input.venueCategory
    })
    .select("id, match_id, city, atmosphere, ideal_date_time, status, notes, venue_category, dietary_accessibility_notes, privacy_preferences, selected_venue_id")
    .single<ConciergeRow>();

  if (!error) {
    await recordEmailEvent("concierge_request_received", { matchId: input.matchId });
    await recordEmailEvent("admin_concierge_request_alert", { matchId: input.matchId });
  }

  return { data: data ? mapConcierge(data) : undefined, error: error?.message, mode: supabaseMode };
}

export async function loadVenueOptions(city?: string): Promise<ServiceResult<VenueOption[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  let query = supabase.from("venues").select("id, name, city, category, atmosphere").limit(12);
  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as VenueOption[], error: error?.message, mode: supabaseMode };
}

export async function selectConciergeVenue(
  requestId: string | undefined,
  venueId: string
): Promise<ServiceResult<boolean>> {
  if (!supabase || !requestId || !isUuid(requestId) || !isUuid(venueId)) {
    return { data: false, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("concierge_requests")
    .update({
      selected_venue_id: venueId,
      status: "confirmed"
    })
    .eq("id", requestId);

  if (!error) {
    await recordEmailEvent("concierge_date_confirmed", { requestId, venueId });
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function updateConciergeStatus(
  requestId: string,
  status: BookingStatus,
  note?: string
): Promise<ServiceResult<boolean>> {
  if (!supabase || !isUuid(requestId)) {
    return { data: false, mode: supabaseMode };
  }

  const { error } = await supabase.from("concierge_requests").update({ status }).eq("id", requestId);

  if (!error) {
    const user = await requireAuthenticatedUser();
    await supabase.from("audit_logs").insert({
      action: "concierge_status_updated",
      actor_user_id: user.data,
      entity_id: requestId,
      entity_type: "concierge_request",
      metadata: { note, status }
    });
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}
