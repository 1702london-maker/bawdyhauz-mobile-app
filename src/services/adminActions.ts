import {
  AdminApplicant,
  AdminApplicationAction,
  AdminApplicationStatus,
  AdminConciergeRequest,
  adminApplicants,
  adminConciergeRequests,
  AdminExperienceGuest,
  adminExperienceGuests,
  AdminTherapistBooking,
  adminTherapistBookings,
  AdminVerification,
  VerificationStatus,
  adminVerifications
} from "@/data/admin";
import { moderationReports, ModerationReport } from "@/data/safety";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser } from "./auth";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";
import { trackAnalyticsEvent } from "./analytics";

export type AdminActionRequest = {
  action: string;
  incidentId?: string;
  notes?: string;
  targetUserId?: string;
};

export type AdminQueues = {
  applications: AdminApplicant[];
  conciergeRequests: AdminConciergeRequest[];
  experienceGuests: AdminExperienceGuest[];
  safetyReports: ModerationReport[];
  therapistBookings: AdminTherapistBooking[];
  verifications: AdminVerification[];
};

type ApplicationRow = {
  city: string | null;
  created_at: string;
  id: string;
  intentions: string[] | null;
  legal_name: string | null;
  private_notes: string | null;
  status: string;
  user_id: string;
};

type VerificationRow = {
  id: string;
  id_document_placeholder: string | null;
  selfie_placeholder: string | null;
  status: string;
  user_id: string;
};

type ProfileRow = {
  bio: string | null;
  city: string | null;
  display_name: string | null;
  interests: string[] | null;
  lifestyle_notes: string | null;
  user_id: string;
};

type AdminNoteRow = {
  follow_up_needed: boolean;
  id: string;
  note: string;
  target_user_id: string | null;
};

type WebsiteWaitlistRow = {
  admin_status?: string | null;
  city: string | null;
  created_at: string;
  email: string;
  id: string;
  intention: string | null;
  name: string | null;
  priority_notes?: string | null;
  referral_source?: string | null;
  status: string;
};

const applicationStatusLabels: Record<string, AdminApplicationStatus> = {
  approved: "approved",
  draft: "pending",
  more_information: "more information",
  rejected: "rejected",
  submitted: "submitted",
  under_review: "under review",
  waitlisted: "waitlisted"
};

const verificationStatusLabels: Record<string, VerificationStatus> = {
  failed: "manual hold",
  id_reviewed: "id reviewed",
  manual_hold: "manual hold",
  pending: "pending",
  selfie_reviewed: "selfie reviewed",
  submitted: "pending",
  verified: "verified"
};

export function fallbackQueues(): AdminQueues {
  return {
    applications: adminApplicants,
    conciergeRequests: adminConciergeRequests,
    experienceGuests: adminExperienceGuests,
    safetyReports: moderationReports,
    therapistBookings: adminTherapistBookings,
    verifications: adminVerifications
  };
}

export async function loadAdminQueues(): Promise<ServiceResult<AdminQueues>> {
  const fallback = fallbackQueues();

  if (!supabase) {
    return { data: fallback, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: fallback, error: admin.error, mode: supabaseMode };
  }

  const [
    applications,
    websiteWaitlist,
    verifications,
    profiles,
    notes,
    concierge,
    therapy,
    rsvps,
    waitlists,
    reports
  ] =
    await Promise.all([
      supabase
        .from("membership_applications")
        .select("id, user_id, legal_name, city, intentions, private_notes, status, created_at")
        .in("status", ["submitted", "under_review", "more_information", "rejected", "waitlisted"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("website_waitlist")
        .select("id, email, name, city, intention, status, admin_status, priority_notes, referral_source, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("verification_checks")
        .select("id, user_id, status, id_document_placeholder, selfie_placeholder")
        .limit(50),
      supabase
        .from("profiles")
        .select("user_id, display_name, city, bio, interests, lifestyle_notes")
        .limit(100),
      supabase
        .from("admin_notes")
        .select("id, target_user_id, note, follow_up_needed")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("concierge_requests").select("id, city, atmosphere, status").limit(20),
      supabase.from("therapy_sessions").select("id, session_type, status").limit(20),
      supabase.from("experience_rsvps").select("id, status").limit(20),
      supabase.from("experience_waitlists").select("id, status").limit(20),
      supabase.from("safety_reports").select("id, reason, details").limit(20)
    ]);

  const hasError =
    applications.error ||
    websiteWaitlist.error ||
    verifications.error ||
    profiles.error ||
    notes.error ||
    concierge.error ||
    therapy.error ||
    rsvps.error ||
    waitlists.error ||
    reports.error;

  if (hasError) {
    return {
      data: fallback,
      error: hasError.message,
      mode: supabaseMode
    };
  }

  const verificationByUserId = new Map(
    ((verifications.data ?? []) as VerificationRow[]).map((verification) => [
      verification.user_id,
      verification
    ])
  );
  const profileByUserId = new Map(
    ((profiles.data ?? []) as ProfileRow[]).map((profile) => [profile.user_id, profile])
  );
  const notesByUserId = new Map<string, AdminApplicant["notes"]>();
  ((notes.data ?? []) as AdminNoteRow[]).forEach((note) => {
    if (!note.target_user_id) {
      return;
    }
    const current = notesByUserId.get(note.target_user_id) ?? [];
    current.push({
      followUpNeeded: note.follow_up_needed,
      id: note.id,
      note: note.note
    });
    notesByUserId.set(note.target_user_id, current);
  });

  return {
    data: {
      applications: [
        ...((applications.data ?? []) as ApplicationRow[]).map((item) => {
          const profile = profileByUserId.get(item.user_id);
          const verification = verificationByUserId.get(item.user_id);
          return {
            city: item.city ?? profile?.city ?? "Private",
            createdAt: new Date(item.created_at).toLocaleDateString(),
            id: item.id,
            intention: item.intentions?.[0] ?? "Manual review",
            name: item.legal_name ?? profile?.display_name ?? "Applicant",
            notes: notesByUserId.get(item.user_id) ?? [],
            profileSummary: profile?.bio ?? profile?.lifestyle_notes ?? "No profile summary yet.",
            source: "app" as const,
            status: applicationStatusLabels[item.status] ?? "pending",
            summary: item.private_notes ?? "Application awaiting reviewer notes.",
            userId: item.user_id,
            verificationStatus: verification?.status ?? "pending"
          };
        }),
        ...((websiteWaitlist.data ?? []) as WebsiteWaitlistRow[]).map((lead) => ({
          city: lead.city ?? "Website",
          createdAt: new Date(lead.created_at).toLocaleDateString(),
          id: lead.id,
          intention: lead.intention ?? lead.referral_source ?? "Website application",
          name: lead.name ?? lead.email,
          profileSummary: lead.priority_notes ?? "Public website gateway lead.",
          source: "website" as const,
          sourceEmail: lead.email,
          status:
            lead.admin_status === "approved"
              ? ("approved" as const)
              : lead.admin_status === "declined"
                ? ("rejected" as const)
                : lead.admin_status === "invited"
                  ? ("submitted" as const)
                  : lead.status === "waitlisted"
                    ? ("waitlisted" as const)
                    : ("pending" as const),
          summary: `Website source: ${lead.status}. ${lead.priority_notes ?? "Awaiting concierge review."}`,
          userId: `website:${lead.id}`,
          verificationStatus: "account invite needed"
        }))
      ],
      conciergeRequests: (concierge.data ?? []).map((item) => ({
        bookingStatus: item.status ?? "pending",
        city: item.city ?? "Private",
        id: item.id,
        memberNames: "Members pending profile link",
        requestType: "booking pending"
      })),
      experienceGuests: [
        ...(rsvps.data ?? []).map((item) => ({
          experienceTitle: "Experience RSVP",
          id: item.id,
          memberName: "Member",
          status: item.status === "confirmed" ? ("confirmed guest" as const) : ("rsvp request" as const)
        })),
        ...(waitlists.data ?? []).map((item) => ({
          experienceTitle: "Experience waitlist",
          id: item.id,
          memberName: "Member",
          status: "waitlist request" as const
        }))
      ],
      safetyReports: (reports.data ?? []).map((item) => ({
        id: item.id,
        memberName: "Reported member",
        reason: item.reason,
        standing: "flagged" as const,
        status: "report received" as const,
        summary: item.details ?? "Report details pending.",
        trustScore: 72
      })),
      therapistBookings: (therapy.data ?? []).map((item) => ({
        id: item.id,
        memberName: "Member",
        sessionType: item.session_type ?? "Private session",
        status: item.status ?? "pending",
        therapistName: "Therapist"
      })),
      verifications: ((verifications.data ?? []) as VerificationRow[]).map((item) => ({
        id: item.id,
        idPlaceholder: item.id_document_placeholder ?? "ID placeholder",
        memberName: profileByUserId.get(item.user_id)?.display_name ?? "Member",
        selfiePlaceholder: item.selfie_placeholder ?? "Selfie placeholder",
        status: verificationStatusLabels[item.status] ?? "pending"
      }))
    },
    mode: supabaseMode
  };
}

export async function performApplicationAction({
  action,
  applicationId,
  followUpNeeded,
  note,
  targetUserId
}: {
  action: AdminApplicationAction;
  applicationId: string;
  followUpNeeded?: boolean;
  note?: string;
  targetUserId: string;
}): Promise<ServiceResult<boolean>> {
  if (targetUserId.startsWith("website:")) {
    return performWebsiteLeadAction({
      action,
      followUpNeeded,
      leadId: targetUserId.replace("website:", ""),
      note
    });
  }

  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const applicationStatus =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : action === "waitlist"
          ? "waitlisted"
          : action === "more information"
            ? "more_information"
            : "under_review";
  const standing =
    action === "restrict" ? "restricted" : action === "ban" ? "banned" : "clear";
  const approved = action === "approve";

  const appUpdate = await supabase
    .from("membership_applications")
    .update({ reviewer_notes: note, status: applicationStatus })
    .eq("id", applicationId);
  if (appUpdate.error) {
    return { data: false, error: appUpdate.error.message, mode: supabaseMode };
  }

  const userUpdate = await supabase
    .from("users")
    .update({ standing })
    .eq("id", targetUserId);
  if (userUpdate.error) {
    return { data: false, error: userUpdate.error.message, mode: supabaseMode };
  }

  const profileUpdate = await supabase
    .from("profiles")
    .update({ is_approved: approved, is_public_safe: approved })
    .eq("user_id", targetUserId);
  if (profileUpdate.error) {
    return { data: false, error: profileUpdate.error.message, mode: supabaseMode };
  }

  if (note?.trim()) {
    const noteResult = await addAdminNote({
      entityId: applicationId,
      entityType: "membership_application",
      followUpNeeded,
      note,
      targetUserId
    });
    if (noteResult.error) {
      return { data: false, error: noteResult.error, mode: supabaseMode };
    }
  }

  const audit = await supabase.from("audit_logs").insert({
    action: `application.${action}`,
    actor_user_id: admin.data,
    entity_id: applicationId,
    entity_type: "membership_application",
    metadata: {
      followUpNeeded: Boolean(followUpNeeded),
      note: note ?? "",
      targetUserId
    }
  });

  const emailEvent =
    action === "approve"
      ? "application_approved"
      : action === "reject"
        ? "application_rejected"
        : action === "waitlist"
          ? "application_waitlisted"
          : action === "more information"
            ? "application_more_information"
            : undefined;

  if (emailEvent) {
    await recordEmailEvent(emailEvent, { applicationId, targetUserId });
  }

  await trackAnalyticsEvent("admin.application_action", "admin", {
    action,
    followUpNeeded: Boolean(followUpNeeded),
    status: applicationStatus
  });

  return { data: !audit.error, error: audit.error?.message, mode: supabaseMode };
}

export async function performWebsiteLeadAction({
  action,
  followUpNeeded,
  leadId,
  note
}: {
  action: AdminApplicationAction;
  followUpNeeded?: boolean;
  leadId: string;
  note?: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const adminStatus =
    action === "approve"
      ? "approved"
      : action === "reject" || action === "ban"
        ? "declined"
        : action === "waitlist"
          ? "reviewing"
          : action === "more information"
            ? "reviewing"
            : "reviewing";
  const publicStatus =
    action === "approve"
      ? "invited"
      : action === "reject" || action === "ban"
        ? "declined"
        : action === "waitlist"
          ? "waitlisted"
          : "reviewing";

  const update = await supabase
    .from("website_waitlist")
    .update({
      admin_status: adminStatus,
      priority_notes: note,
      status: publicStatus
    })
    .eq("id", leadId);

  if (update.error) {
    return { data: false, error: update.error.message, mode: supabaseMode };
  }

  if (note?.trim()) {
    const noteResult = await addAdminNote({
      entityId: leadId,
      entityType: "website_waitlist",
      followUpNeeded,
      note
    });
    if (noteResult.error) {
      return { data: false, error: noteResult.error, mode: supabaseMode };
    }
  }

  const audit = await supabase.from("audit_logs").insert({
    action: `website_waitlist.${action}`,
    actor_user_id: admin.data,
    entity_id: leadId,
    entity_type: "website_waitlist",
    metadata: {
      followUpNeeded: Boolean(followUpNeeded),
      note: note ?? ""
    }
  });

  await trackAnalyticsEvent("admin.website_lead_action", "admin", {
    action,
    status: publicStatus
  });

  return { data: !audit.error, error: audit.error?.message, mode: supabaseMode };
}

export async function recordAdminAction(
  action: AdminActionRequest
): Promise<ServiceResult<AdminActionRequest>> {
  if (!supabase) {
    return { data: action, mode: supabaseMode };
  }

  const session = await requireAdminUser();
  if (!session.data) {
    return { data: action, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("moderation_actions").insert({
    action: action.action,
    admin_user_id: session.data,
    action_category: "moderation",
    incident_id: action.incidentId,
    metadata: {
      source: "admin_dashboard"
    },
    notes: action.notes,
    review_only: action.action.toLowerCase().includes("ban"),
    target_user_id: action.targetUserId
  });

  if (!error) {
    await supabase.from("audit_logs").insert({
      action: `moderation.${action.action}`,
      actor_user_id: session.data,
      entity_id: action.incidentId,
      entity_type: "incident",
      metadata: {
        reviewOnly: action.action.toLowerCase().includes("ban"),
        targetUserId: action.targetUserId
      }
    });
    await trackAnalyticsEvent("admin.moderation_action", "admin", {
      action: action.action,
      reviewOnly: action.action.toLowerCase().includes("ban")
    });
  }

  return { data: action, error: error?.message, mode: supabaseMode };
}

export async function addAdminNote(note: {
  entityId?: string;
  entityType?: string;
  followUpNeeded?: boolean;
  note: string;
  targetUserId?: string;
}): Promise<ServiceResult<typeof note>> {
  if (!supabase) {
    return { data: note, mode: supabaseMode };
  }

  const session = await requireAdminUser();
  if (!session.data) {
    return { data: note, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("admin_notes").insert({
    admin_user_id: session.data,
    entity_id: note.entityId,
    entity_type: note.entityType,
    follow_up_needed: note.followUpNeeded ?? false,
    note: note.note,
    target_user_id: note.targetUserId
  });

  return { data: note, error: error?.message, mode: supabaseMode };
}
