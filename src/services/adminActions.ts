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
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";

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

type WebsiteApplicationRow = {
id: string;
first_name: string | null;
age: number | null;
email: string | null;
location: string | null;
primary_interest: string | null;
message: string | null;
status: string;
created_at: string;
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

const [applications, verifications, profiles, notes, concierge, therapy, rsvps, waitlists, reports, websiteApps] =
await Promise.all([
supabase
.from("membership_applications")
.select("id, user_id, legal_name, city, intentions, private_notes, status, created_at")
.in("status", ["submitted", "under_review", "more_information", "rejected", "waitlisted"])
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
supabase.from("safety_reports").select("id, reason, details").limit(20),
supabase.from("applications").select("*").in("status", ["pending", "approved", "rejected"]).order("created_at", { ascending: false }).limit(50)
]);

const hasError =
applications.error ||
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

const websiteApplicants: AdminApplicant[] = ((websiteApps?.data ?? []) as WebsiteApplicationRow[]).map((app) => ({
city: app.location ?? "Unknown",
createdAt: new Date(app.created_at).toLocaleDateString(),
id: `website:${app.id}`,
intention: app.primary_interest ?? "Not specified",
name: app.first_name ?? "Applicant",
notes: [],
profileSummary: app.message ?? "Website application",
status: "pending" as AdminApplicationStatus,
summary: `Website — ${app.email ?? "no email"} | Age: ${app.age ?? "—"}`,
userId: `website:${app.id}`,
verificationStatus: "pending",
email: app.email ?? undefined,
isWebsiteApplicant: true,
}));

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
status: applicationStatusLabels[item.status] ?? "pending",
summary: item.private_notes ?? "Application awaiting reviewer notes.",
userId: item.user_id,
verificationStatus: verification?.status ?? "pending"
};
}),
...websiteApplicants,
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
if (!supabase) {
return { data: true, mode: supabaseMode };
}

// Handle website applications (submitted via homepage form)
if (applicationId.startsWith("website:")) {
const realId = applicationId.replace("website:", "");
if (action === "approve" && targetUserId && !targetUserId.startsWith("website:")) {
const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
targetUserId,
{ redirectTo: "https://www.bawdyhauz.com/login" }
);
if (inviteError) return { data: false, error: inviteError.message, mode: supabaseMode };
}
const statusMap: Record<string, string> = {
approve: "approved", reject: "rejected",
waitlist: "waitlisted", "more information": "more_information",
};
const { error } = await supabase
.from("applications")
.update({ status: statusMap[action] ?? "under_review" })
.eq("id", realId);
return { data: !error, error: error?.message, mode: supabaseMode };
}

const admin = await requireAuthenticatedUser();
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

return { data: !audit.error, error: audit.error?.message, mode: supabaseMode };
}

export async function recordAdminAction(
action: AdminActionRequest
): Promise<ServiceResult<AdminActionRequest>> {
if (!supabase) {
return { data: action, mode: supabaseMode };
}

const session = await requireAuthenticatedUser();
const { error } = await supabase.from("moderation_actions").insert({
action: action.action,
admin_user_id: session.data,
incident_id: action.incidentId,
notes: action.notes,
target_user_id: action.targetUserId
});

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

const session = await requireAuthenticatedUser();
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
