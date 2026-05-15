import { Experience, ExperienceAccessType, experiences } from "@/data/experiences";
import { supabase, supabaseMode } from "@/lib/supabase";
import { isUuid } from "@/lib/ids";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";

type ExperienceRow = {
  access_type: string | null;
  category: string | null;
  city: string | null;
  description: string | null;
  dress_code: string | null;
  event_date: string | null;
  event_time: string | null;
  guest_tone: string | null;
  id: string;
  title: string;
  venue_style_placeholder: string | null;
};

const accessTypes: ExperienceAccessType[] = [
  "invite only",
  "application required",
  "members only",
  "waitlist"
];

function mapAccessType(value: string | null): ExperienceAccessType {
  return accessTypes.includes(value as ExperienceAccessType)
    ? (value as ExperienceAccessType)
    : "members only";
}

export type ExperienceRsvpRequest = {
  accessibilityNotes?: string;
  experienceId: string;
  guestPreferenceNotes?: string;
  status?: "requested" | "waitlisted";
};

export type ExperienceWaitlistRequest = {
  experienceId: string;
  notes?: string;
  preferredCity?: string;
};

export async function loadPrivateExperiences(): Promise<ServiceResult<Experience[]>> {
  if (!supabase) {
    return { data: experiences, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("private_experiences")
    .select(
      "id, title, category, city, event_date, event_time, access_type, description, venue_style_placeholder, dress_code, guest_tone"
    )
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return { data: experiences, error: error?.message, mode: supabaseMode };
  }

  return {
    data: (data as ExperienceRow[]).map((item) => ({
      accessType: mapAccessType(item.access_type),
      category: item.category ?? "private experience",
      city: item.city ?? "Private",
      date: item.event_date ?? "By arrangement",
      description: item.description ?? "",
      dressCode: item.dress_code ?? "Elegant",
      guestTone: item.guest_tone ?? "Discreet",
      id: item.id,
      time: item.event_time ?? "By arrangement",
      title: item.title,
      venueStyle: item.venue_style_placeholder ?? "Private venue"
    })),
    mode: supabaseMode
  };
}

export async function submitExperienceRsvp(
  rsvp: ExperienceRsvpRequest
): Promise<ServiceResult<ExperienceRsvpRequest>> {
  if (!supabase) {
    return { data: rsvp, mode: supabaseMode };
  }

  if (!isUuid(rsvp.experienceId)) {
    return {
      data: rsvp,
      error: "Live RSVP skipped because this is a local fallback experience.",
      mode: supabaseMode
    };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: rsvp, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("experience_rsvps").upsert({
    accessibility_notes: rsvp.accessibilityNotes,
    experience_id: rsvp.experienceId,
    guest_preference_notes: rsvp.guestPreferenceNotes,
    status: rsvp.status ?? "requested",
    user_id: session.data
  });

  if (!error) {
    await recordEmailEvent("experience_request_received", { experienceId: rsvp.experienceId });
  }

  return { data: rsvp, error: error?.message, mode: supabaseMode };
}

export async function joinExperienceWaitlist(
  waitlist: ExperienceWaitlistRequest
): Promise<ServiceResult<ExperienceWaitlistRequest>> {
  if (!supabase) {
    return { data: waitlist, mode: supabaseMode };
  }

  if (!isUuid(waitlist.experienceId)) {
    return {
      data: waitlist,
      error: "Live waitlist skipped because this is a local fallback experience.",
      mode: supabaseMode
    };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: waitlist, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("experience_waitlists").upsert({
    experience_id: waitlist.experienceId,
    preferred_city: waitlist.preferredCity,
    private_notes: waitlist.notes,
    status: "waitlisted",
    user_id: session.data
  });

  return { data: waitlist, error: error?.message, mode: supabaseMode };
}
