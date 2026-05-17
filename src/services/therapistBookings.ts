import { TherapistProfile } from "@/data/wellness";
import { supabase, supabaseMode } from "@/lib/supabase";
import { isUuid } from "@/lib/ids";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";

type TherapistRow = {
  bio: string | null;
  id: string;
  name: string;
  qualifications_placeholder: string[] | null;
  specialisms: string[] | null;
  title: string | null;
  verified: boolean;
};

export type TherapistBookingRequest = {
  notes?: string;
  preferredDate?: string;
  preferredTime: string;
  sessionType: string;
  therapistId: string;
};

export async function loadTherapists(): Promise<ServiceResult<TherapistProfile[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("therapists")
    .select("id, name, title, bio, specialisms, qualifications_placeholder, verified")
    .eq("verified", true);

  if (error || !data?.length) {
    return { data: [], error: error?.message, mode: supabaseMode };
  }

  return {
    data: (data as TherapistRow[]).map((therapist) => ({
      availableTimes: ["10:00", "14:30", "18:00"],
      availability: "By request",
      bio: therapist.bio ?? "",
      id: therapist.id,
      name: therapist.name,
      qualifications: therapist.qualifications_placeholder ?? [],
      sessionApproach: "Private, calm and member-led.",
      sessionTypes: ["Private session", "Relationship coaching", "Dating guidance"],
      specialisms: therapist.specialisms ?? [],
      title: therapist.title ?? "Relationship wellness",
      verified: therapist.verified
    })),
    mode: supabaseMode
  };
}

export async function requestTherapistSession(
  booking: TherapistBookingRequest
): Promise<ServiceResult<TherapistBookingRequest>> {
  if (!supabase) {
    return { data: booking, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: booking, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("therapy_sessions").insert({
    preferred_time: [booking.preferredDate, booking.preferredTime].filter(Boolean).join(" "),
    private_notes: booking.notes,
    session_type: booking.sessionType,
    therapist_id: isUuid(booking.therapistId) ? booking.therapistId : null,
    user_id: session.data
  });

  if (!error) {
    await recordEmailEvent("therapist_booking_received", { therapistId: booking.therapistId });
  }

  return { data: booking, error: error?.message, mode: supabaseMode };
}
