import { moderationReports } from "@/data/safety";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser } from "./auth";
import { trackAnalyticsEvent } from "./analytics";
import { ServiceResult } from "./types";

export type ModerationWorkflowAction =
  | "warn"
  | "restrict"
  | "suspend"
  | "ban_review"
  | "escalate"
  | "close_case";

export type IncidentEvidence = {
  evidenceSummary?: string;
  evidenceType: string;
  id: string;
  isSensitive: boolean;
  reviewedAt?: string;
  reviewNotes?: string;
  storagePath?: string;
};

export type ModerationIncident = {
  actionCount: number;
  aiRecommendationStatus: string;
  aiRecommendationSummary?: string;
  createdAt: string;
  details: string;
  escalationLevel: number;
  escalationReason?: string;
  evidence: IncidentEvidence[];
  id: string;
  reason: string;
  reporterUserId?: string;
  resolutionSummary?: string;
  reviewerNotes?: string;
  severity: string;
  status: string;
  targetUserId?: string;
  trustScore: number;
};

export type UserSafetyHistoryItem = {
  action: string;
  createdAt: string;
  notes?: string;
  reviewOnly: boolean;
  targetUserId?: string;
};

export type TrustSnapshot = {
  createdAt: string;
  id: string;
  signalSummary?: string;
  standing: string;
  trustScore: number;
  userId?: string;
};

export type FlaggedBehaviourReview = {
  createdAt: string;
  id: string;
  severity: string;
  signalType: string;
  status: string;
  summary?: string;
  targetUserId?: string;
};

export type AdminAuditItem = {
  action: string;
  createdAt: string;
  entityType?: string;
  id: string;
};

export type ModerationDashboard = {
  audit: AdminAuditItem[];
  flaggedBehaviours: FlaggedBehaviourReview[];
  history: UserSafetyHistoryItem[];
  incidents: ModerationIncident[];
  trustSnapshots: TrustSnapshot[];
};

type SafetyReportRow = {
  created_at: string;
  details: string | null;
  evidence_placeholder: string | null;
  id: string;
  reason: string;
  reporter_user_id: string | null;
  target_user_id: string | null;
};

type IncidentRow = {
  ai_recommendation_status: string | null;
  ai_recommendation_summary: string | null;
  created_at: string;
  escalation_level: number | null;
  escalation_reason: string | null;
  id: string;
  private_summary: string | null;
  resolution_summary: string | null;
  reviewer_notes: string | null;
  safety_report_id: string | null;
  safety_reports?: SafetyReportRow | null;
  severity: string | null;
  status: string;
};

type EvidenceRow = {
  evidence_summary: string | null;
  evidence_type: string;
  id: string;
  incident_id: string | null;
  is_sensitive: boolean;
  review_notes: string | null;
  reviewed_at: string | null;
  storage_path: string | null;
};

type ActionRow = {
  action: string;
  created_at: string;
  incident_id: string | null;
  notes: string | null;
  review_only: boolean | null;
  target_user_id: string | null;
};

type TrustRow = {
  created_at: string;
  id: string;
  signal_summary: string | null;
  standing: string;
  trust_score: number;
  user_id: string | null;
};

type FlagRow = {
  created_at: string;
  id: string;
  severity: string;
  signal_type: string;
  status: string;
  summary: string | null;
  target_user_id: string | null;
};

type AuditRow = {
  action: string;
  created_at: string;
  entity_type: string | null;
  id: string;
};

const fallbackDashboard: ModerationDashboard = {
  audit: [
    {
      action: "moderation.review_opened",
      createdAt: new Date().toISOString(),
      entityType: "incident",
      id: "audit-local"
    }
  ],
  flaggedBehaviours: [
    {
      createdAt: new Date().toISOString(),
      id: "flag-local",
      severity: "review",
      signalType: "no_show_pattern",
      status: "open",
      summary: "Placeholder flagged behaviour review for repeated concierge no-show context."
    }
  ],
  history: moderationReports.map((report) => ({
    action: "case_opened",
    createdAt: new Date().toISOString(),
    notes: report.summary,
    reviewOnly: false
  })),
  incidents: moderationReports.map((report) => ({
    actionCount: 0,
    aiRecommendationStatus: "review_required",
    aiRecommendationSummary: "Review only. No automated ban or restriction should be applied.",
    createdAt: new Date().toISOString(),
    details: report.summary,
    escalationLevel: report.status === "under review" ? 1 : 0,
    evidence: [],
    id: report.id,
    reason: report.reason,
    severity: report.trustScore < 75 ? "high" : "standard",
    status: report.status,
    trustScore: report.trustScore
  })),
  trustSnapshots: moderationReports.map((report) => ({
    createdAt: new Date().toISOString(),
    id: `${report.id}-trust`,
    signalSummary: report.summary,
    standing: report.standing,
    trustScore: report.trustScore
  }))
};

export async function loadModerationDashboard(): Promise<ServiceResult<ModerationDashboard>> {
  if (!supabase) {
    return { data: fallbackDashboard, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: emptyDashboard(), error: admin.error, mode: supabaseMode };
  }

  const [incidents, evidence, actions, trust, flags, audit] = await Promise.all([
    supabase
      .from("incidents")
      .select(
        "id, safety_report_id, status, private_summary, severity, escalation_level, escalation_reason, ai_recommendation_summary, ai_recommendation_status, reviewer_notes, resolution_summary, created_at, safety_reports(id, reporter_user_id, target_user_id, reason, details, evidence_placeholder, created_at)"
      )
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("incident_evidence")
      .select("id, incident_id, storage_path, evidence_type, evidence_summary, is_sensitive, reviewed_at, review_notes")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("moderation_actions")
      .select("incident_id, target_user_id, action, notes, review_only, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("user_trust_snapshots")
      .select("id, user_id, trust_score, standing, signal_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("flagged_behaviour_reviews")
      .select("id, target_user_id, signal_type, severity, summary, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const error =
    incidents.error || evidence.error || actions.error || trust.error || flags.error || audit.error;

  if (error) {
    return { data: fallbackDashboard, error: error.message, mode: supabaseMode };
  }

  const evidenceRows = (evidence.data ?? []) as EvidenceRow[];
  const actionRows = (actions.data ?? []) as ActionRow[];
  const evidenceByIncident = groupBy(evidenceRows, (item) => item.incident_id ?? "");
  const actionsByIncident = groupBy(actionRows, (item) => item.incident_id ?? "");

  return {
    data: {
      audit: ((audit.data ?? []) as AuditRow[]).map((item) => ({
        action: item.action,
        createdAt: item.created_at,
        entityType: item.entity_type ?? undefined,
        id: item.id
      })),
      flaggedBehaviours: ((flags.data ?? []) as FlagRow[]).map((item) => ({
        createdAt: item.created_at,
        id: item.id,
        severity: item.severity,
        signalType: item.signal_type,
        status: item.status,
        summary: item.summary ?? undefined,
        targetUserId: item.target_user_id ?? undefined
      })),
      history: actionRows.map((item) => ({
        action: item.action,
        createdAt: item.created_at,
        notes: item.notes ?? undefined,
        reviewOnly: Boolean(item.review_only),
        targetUserId: item.target_user_id ?? undefined
      })),
      incidents: ((incidents.data ?? []) as unknown as IncidentRow[]).map((item) => {
        const report = item.safety_reports;
        const incidentEvidence = evidenceByIncident.get(item.id) ?? [];
        return {
          actionCount: actionsByIncident.get(item.id)?.length ?? 0,
          aiRecommendationStatus: item.ai_recommendation_status ?? "review_required",
          aiRecommendationSummary: item.ai_recommendation_summary ?? undefined,
          createdAt: item.created_at,
          details: report?.details ?? item.private_summary ?? "Incident awaiting review.",
          escalationLevel: item.escalation_level ?? 0,
          escalationReason: item.escalation_reason ?? undefined,
          evidence: incidentEvidence.map(mapEvidence),
          id: item.id,
          reason: report?.reason ?? "private review",
          reporterUserId: report?.reporter_user_id ?? undefined,
          resolutionSummary: item.resolution_summary ?? undefined,
          reviewerNotes: item.reviewer_notes ?? undefined,
          severity: item.severity ?? "standard",
          status: statusLabel(item.status),
          targetUserId: report?.target_user_id ?? undefined,
          trustScore: latestTrustScore(trust.data as TrustRow[] | null, report?.target_user_id)
        };
      }),
      trustSnapshots: ((trust.data ?? []) as TrustRow[]).map((item) => ({
        createdAt: item.created_at,
        id: item.id,
        signalSummary: item.signal_summary ?? undefined,
        standing: item.standing,
        trustScore: item.trust_score,
        userId: item.user_id ?? undefined
      }))
    },
    mode: supabaseMode
  };
}

export async function recordModerationWorkflowAction(input: {
  action: ModerationWorkflowAction;
  incidentId: string;
  notes?: string;
  targetUserId?: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const reviewOnly = input.action === "ban_review";
  const actionText = input.action === "close_case" ? "close case" : input.action.replace("_", " ");
  const actionResult = await supabase.from("moderation_actions").insert({
    action: actionText,
    action_category: input.action === "escalate" ? "escalation" : "moderation",
    admin_user_id: admin.data,
    incident_id: input.incidentId,
    metadata: {
      reviewOnly,
      source: "advanced_moderation_dashboard"
    },
    notes: input.notes,
    review_only: reviewOnly,
    target_user_id: input.targetUserId
  });

  if (actionResult.error) {
    return { data: false, error: actionResult.error.message, mode: supabaseMode };
  }

  const incidentPatch =
    input.action === "close_case"
      ? {
          resolution_summary: input.notes,
          resolved_at: new Date().toISOString(),
          status: "closed"
        }
      : input.action === "escalate"
        ? {
            escalated_at: new Date().toISOString(),
            escalation_level: 1,
            escalation_reason: input.notes,
            status: "under_review"
          }
        : {
            reviewer_notes: input.notes,
            status: "action_taken"
          };

  const incidentResult = await supabase.from("incidents").update(incidentPatch).eq("id", input.incidentId);

  await supabase.from("audit_logs").insert({
    action: `moderation.${input.action}`,
    actor_user_id: admin.data,
    entity_id: input.incidentId,
    entity_type: "incident",
    metadata: {
      reviewOnly,
      targetUserId: input.targetUserId
    }
  });

  await trackAnalyticsEvent("admin.moderation_workflow_action", "admin", {
    action: input.action,
    reviewOnly
  });

  return { data: !incidentResult.error, error: incidentResult.error?.message, mode: supabaseMode };
}

export async function reviewIncidentEvidence(input: {
  evidenceId: string;
  notes?: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("incident_evidence")
    .update({
      review_notes: input.notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by_admin_id: admin.data
    })
    .eq("id", input.evidenceId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      action: "moderation.evidence_reviewed",
      actor_user_id: admin.data,
      entity_id: input.evidenceId,
      entity_type: "incident_evidence",
      metadata: {}
    });
    await trackAnalyticsEvent("admin.evidence_reviewed", "admin");
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function reviewFlaggedBehaviour(reviewId: string): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("flagged_behaviour_reviews")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by_admin_id: admin.data,
      status: "reviewed"
    })
    .eq("id", reviewId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}

function mapEvidence(row: EvidenceRow): IncidentEvidence {
  return {
    evidenceSummary: row.evidence_summary ?? undefined,
    evidenceType: row.evidence_type,
    id: row.id,
    isSensitive: row.is_sensitive,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNotes: row.review_notes ?? undefined,
    storagePath: row.storage_path ?? undefined
  };
}

function emptyDashboard(): ModerationDashboard {
  return {
    audit: [],
    flaggedBehaviours: [],
    history: [],
    incidents: [],
    trustSnapshots: []
  };
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Map<string, T[]>>((current, item) => {
    const groupKey = key(item);
    const group = current.get(groupKey) ?? [];
    group.push(item);
    current.set(groupKey, group);
    return current;
  }, new Map<string, T[]>());
}

function latestTrustScore(rows: TrustRow[] | null, userId?: string | null) {
  if (!userId || !rows?.length) {
    return 75;
  }

  return rows.find((item) => item.user_id === userId)?.trust_score ?? 75;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}
