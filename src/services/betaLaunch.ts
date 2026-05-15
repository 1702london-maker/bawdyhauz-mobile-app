import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser, requireAdminUser } from "./auth";
import { trackAnalyticsEvent } from "./analytics";
import { ServiceResult } from "./types";

export type BetaInvite = {
  assignedEmail?: string;
  code: string;
  cohortName?: string;
  expiresAt?: string;
  id: string;
  status: string;
  usageCount: number;
};

export type BetaCohort = {
  id: string;
  launchNotes?: string;
  memberCount: number;
  name: string;
  status: string;
};

export type BetaFeedback = {
  createdAt?: string;
  details?: string;
  id: string;
  priority: string;
  sentiment: string;
  status: string;
  title?: string;
  type: string;
};

export type WaitlistLead = {
  adminStatus: string;
  email?: string;
  id: string;
  name?: string;
  priorityNotes?: string;
  referralSource?: string;
};

export type BetaDashboard = {
  cohorts: BetaCohort[];
  feedback: BetaFeedback[];
  invites: BetaInvite[];
  waitlist: WaitlistLead[];
};

const fallbackDashboard: BetaDashboard = {
  cohorts: [
    {
      id: "cohort-london-private",
      launchNotes: "Founding cohort for high-touch product QA.",
      memberCount: 18,
      name: "London Private Beta",
      status: "active"
    },
    {
      id: "cohort-international-review",
      launchNotes: "Priority candidates outside first launch city.",
      memberCount: 42,
      name: "International Waitlist Review",
      status: "planned"
    }
  ],
  feedback: [
    {
      details: "The member journey feels calm; request clearer concierge status after submission.",
      id: "feedback-001",
      priority: "standard",
      sentiment: "strong",
      status: "new",
      title: "Concierge clarity",
      type: "experience"
    }
  ],
  invites: [
    {
      assignedEmail: "founding.member@bawdyhauz.local",
      code: "HAUZ-LONDON-01",
      cohortName: "London Private Beta",
      id: "invite-001",
      status: "sent",
      usageCount: 0
    }
  ],
  waitlist: [
    {
      adminStatus: "reviewing",
      email: "candidate@bawdyhauz.local",
      id: "waitlist-001",
      name: "Private candidate",
      priorityNotes: "Venue partner referral",
      referralSource: "Founder network"
    }
  ]
};

type InviteRow = {
  assigned_email: string | null;
  beta_cohorts?: { name: string | null }[] | { name: string | null } | null;
  expires_at: string | null;
  id: string;
  invite_code: string;
  status: string;
  usage_count: number;
};

type CohortRow = {
  beta_cohort_members?: Array<{ id: string }>;
  id: string;
  launch_notes: string | null;
  name: string;
  status: string;
  target_member_count: number;
};

type FeedbackRow = {
  created_at: string;
  details: string | null;
  feedback_type: string;
  id: string;
  priority: string;
  sentiment: string;
  status: string;
  title: string | null;
};

type WaitlistRow = {
  admin_status: string;
  email: string | null;
  id: string;
  name: string | null;
  priority_notes: string | null;
  referral_source: string | null;
};

export async function loadBetaDashboard(): Promise<ServiceResult<BetaDashboard>> {
  if (!supabase) {
    return { data: fallbackDashboard, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: fallbackDashboard, error: admin.error, mode: supabaseMode };
  }

  const [cohorts, invites, feedback, waitlist] = await Promise.all([
    supabase
      .from("beta_cohorts")
      .select("id, name, status, launch_notes, target_member_count, beta_cohort_members(id)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("beta_invites")
      .select("id, invite_code, status, assigned_email, usage_count, expires_at, beta_cohorts(name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("beta_feedback")
      .select("id, feedback_type, sentiment, title, details, status, priority, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("website_waitlist")
      .select("id, email, name, priority_notes, referral_source, admin_status")
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  const error = cohorts.error ?? invites.error ?? feedback.error ?? waitlist.error;
  if (error) {
    return { data: fallbackDashboard, error: error.message, mode: supabaseMode };
  }

  return {
    data: {
      cohorts: ((cohorts.data ?? []) as CohortRow[]).map((cohort) => ({
        id: cohort.id,
        launchNotes: cohort.launch_notes ?? undefined,
        memberCount: cohort.beta_cohort_members?.length ?? cohort.target_member_count,
        name: cohort.name,
        status: cohort.status
      })),
      feedback: ((feedback.data ?? []) as FeedbackRow[]).map((item) => ({
        createdAt: new Date(item.created_at).toLocaleDateString(),
        details: item.details ?? undefined,
        id: item.id,
        priority: item.priority,
        sentiment: item.sentiment,
        status: item.status,
        title: item.title ?? "Member feedback",
        type: item.feedback_type
      })),
      invites: ((invites.data ?? []) as InviteRow[]).map((invite) => {
        const cohort = Array.isArray(invite.beta_cohorts)
          ? invite.beta_cohorts[0]
          : invite.beta_cohorts;
        return {
          assignedEmail: invite.assigned_email ?? undefined,
          code: invite.invite_code,
          cohortName: cohort?.name ?? undefined,
          expiresAt: invite.expires_at ?? undefined,
          id: invite.id,
          status: invite.status,
          usageCount: invite.usage_count
        };
      }),
      waitlist: ((waitlist.data ?? []) as WaitlistRow[]).map((lead) => ({
        adminStatus: lead.admin_status,
        email: lead.email ?? undefined,
        id: lead.id,
        name: lead.name ?? "Waitlist candidate",
        priorityNotes: lead.priority_notes ?? undefined,
        referralSource: lead.referral_source ?? undefined
      }))
    },
    mode: supabaseMode
  };
}

export async function submitBetaFeedback(input: {
  details: string;
  sentiment: string;
  title: string;
  type: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: false, error: user.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("beta_feedback").insert({
    details: input.details,
    feedback_type: input.type,
    sentiment: input.sentiment,
    title: input.title,
    user_id: user.data
  });

  if (!error) {
    await trackAnalyticsEvent("beta.feedback_submitted", "beta", {
      sentiment: input.sentiment,
      type: input.type
    });
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function createBetaInvite(input: {
  assignedEmail?: string;
  code: string;
  cohortId?: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("beta_invites").insert({
    assigned_email: input.assignedEmail,
    cohort_id: input.cohortId,
    created_by_admin_id: admin.data,
    invite_code: input.code.trim().toUpperCase(),
    status: input.assignedEmail ? "sent" : "available"
  });

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: string
): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("beta_feedback")
    .update({ assigned_admin_id: admin.data, status })
    .eq("id", feedbackId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}
