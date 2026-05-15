import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser, requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

export type OperationsRecord = {
  detail?: string;
  id: string;
  label: string;
  note?: string;
  status: string;
  title: string;
};

export type OperationsDashboard = {
  conciergeNotes: OperationsRecord[];
  events: OperationsRecord[];
  supportTickets: OperationsRecord[];
  therapists: OperationsRecord[];
  venues: OperationsRecord[];
};

const fallbackOperations: OperationsDashboard = {
  conciergeNotes: [
    {
      detail: "Mayfair, quiet booth, early evening.",
      id: "concierge-note-001",
      label: "Member concierge",
      note: "Follow-up after venue shortlist.",
      status: "open",
      title: "Private dinner preference"
    }
  ],
  events: [
    {
      detail: "Guest list review and arrival flow.",
      id: "event-001",
      label: "Private experience",
      status: "published",
      title: "The Mayfair Table"
    }
  ],
  supportTickets: [
    {
      detail: "Member needs clarification on verification timing.",
      id: "support-001",
      label: "Support",
      status: "open",
      title: "Application status question"
    }
  ],
  therapists: [
    {
      detail: "Relationship support, boundaries, emotional clarity.",
      id: "therapist-001",
      label: "Therapist",
      note: "Tuesday and Thursday private availability.",
      status: "active",
      title: "Dr Elena Ward"
    }
  ],
  venues: [
    {
      detail: "London · discreet · 40 guests",
      id: "venue-001",
      label: "Venue",
      note: "Concierge contact confirmed.",
      status: "active",
      title: "The Low Light Room"
    }
  ]
};

type ConciergeNoteRow = {
  booking_status: string;
  follow_up_status: string;
  id: string;
  note: string;
};

type TherapistRow = {
  admin_notes: string | null;
  availability_notes: string | null;
  id: string;
  name: string;
  specialisms: string[] | null;
  status: string;
};

type VenueRow = {
  admin_notes: string | null;
  atmosphere: string | null;
  capacity: number | null;
  city: string | null;
  id: string;
  name: string;
  privacy_level: string | null;
  status: string;
};

type ExperienceRow = {
  admin_notes: string | null;
  attendance_status: string | null;
  city: string | null;
  id: string;
  status: string;
  title: string;
};

type SupportTicketRow = {
  details: string | null;
  id: string;
  issue_type: string;
  priority: string;
  status: string;
  subject: string;
};

export async function loadOperationsDashboard(): Promise<ServiceResult<OperationsDashboard>> {
  if (!supabase) {
    return { data: fallbackOperations, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: fallbackOperations, error: admin.error, mode: supabaseMode };
  }

  const [conciergeNotes, therapists, venues, events, supportTickets] = await Promise.all([
    supabase
      .from("concierge_member_notes")
      .select("id, note, follow_up_status, booking_status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("therapists")
      .select("id, name, specialisms, availability_notes, admin_notes, status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("venues")
      .select("id, name, city, atmosphere, capacity, privacy_level, admin_notes, status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("private_experiences")
      .select("id, title, city, status, attendance_status, admin_notes")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("support_tickets")
      .select("id, issue_type, subject, details, status, priority")
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const error =
    conciergeNotes.error ??
    therapists.error ??
    venues.error ??
    events.error ??
    supportTickets.error;
  if (error) {
    return { data: fallbackOperations, error: error.message, mode: supabaseMode };
  }

  return {
    data: {
      conciergeNotes: ((conciergeNotes.data ?? []) as ConciergeNoteRow[]).map((item) => ({
        detail: item.note,
        id: item.id,
        label: "Member concierge",
        status: item.follow_up_status,
        title: item.booking_status
      })),
      events: ((events.data ?? []) as ExperienceRow[]).map((event) => ({
        detail: `${event.city ?? "Private city"} · ${event.attendance_status ?? "arrival not started"}`,
        id: event.id,
        label: "Private experience",
        note: event.admin_notes ?? undefined,
        status: event.status,
        title: event.title
      })),
      supportTickets: ((supportTickets.data ?? []) as SupportTicketRow[]).map((ticket) => ({
        detail: ticket.details ?? ticket.issue_type,
        id: ticket.id,
        label: ticket.priority,
        status: ticket.status,
        title: ticket.subject
      })),
      therapists: ((therapists.data ?? []) as TherapistRow[]).map((therapist) => ({
        detail: therapist.specialisms?.join(", ") ?? "Private support",
        id: therapist.id,
        label: "Therapist",
        note: therapist.availability_notes ?? therapist.admin_notes ?? undefined,
        status: therapist.status,
        title: therapist.name
      })),
      venues: ((venues.data ?? []) as VenueRow[]).map((venue) => ({
        detail: `${venue.city ?? "Private city"} · ${venue.privacy_level ?? "private"} · ${
          venue.capacity ? `${venue.capacity} capacity` : "capacity to confirm"
        }`,
        id: venue.id,
        label: venue.atmosphere ?? "Venue",
        note: venue.admin_notes ?? undefined,
        status: venue.status,
        title: venue.name
      }))
    },
    mode: supabaseMode
  };
}

export async function createSupportTicket(input: {
  details: string;
  priority?: string;
  subject: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: false, error: user.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("support_tickets").insert({
    details: input.details,
    priority: input.priority ?? "standard",
    subject: input.subject,
    user_id: user.data
  });

  return { data: !error, error: error?.message, mode: supabaseMode };
}
