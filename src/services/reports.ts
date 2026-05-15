import { ReportReason } from "@/data/safety";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { recordEmailEvent } from "./notifications";
import { trackAnalyticsEvent } from "./analytics";
import { ServiceResult } from "./types";

export type SafetyReportRequest = {
  details: string;
  evidencePlaceholder?: string;
  reason: ReportReason;
  targetUserId?: string;
};

export type ReviewSubmission = {
  chemistry: number;
  communication: number;
  honestReview: string;
  matchId?: string;
  nextStep: "continue" | "pause" | "close" | "";
  overall: number;
  respect: number;
  safety: number;
};

export async function submitSafetyReport(
  report: SafetyReportRequest
): Promise<ServiceResult<SafetyReportRequest>> {
  if (!supabase) {
    return { data: report, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: report, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("safety_reports").insert({
    details: report.details,
    evidence_placeholder: report.evidencePlaceholder,
    reason: report.reason,
    reporter_user_id: session.data,
    target_user_id: report.targetUserId
  });

  if (!error) {
    await recordEmailEvent("safety_report_received", { reason: report.reason });
    await recordEmailEvent("admin_new_safety_report_alert", { reason: report.reason });
    await trackAnalyticsEvent("safety.report_submitted", "safety", {
      evidenceAttached: Boolean(report.evidencePlaceholder),
      reason: report.reason
    });
  }

  return { data: report, error: error?.message, mode: supabaseMode };
}

export async function submitPostDateReview(
  review: ReviewSubmission
): Promise<ServiceResult<ReviewSubmission>> {
  if (!supabase) {
    return { data: review, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return { data: review, error: session.error, mode: supabaseMode };
  }

  const { error } = await supabase.from("reviews").insert({
    chemistry_rating: review.chemistry || null,
    communication_rating: review.communication || null,
    match_id: review.matchId,
    next_step: review.nextStep,
    overall_rating: review.overall || null,
    respect_rating: review.respect || null,
    reviewer_user_id: session.data,
    safety_rating: review.safety || null,
    written_review: review.honestReview
  });

  if (!error) {
    await trackAnalyticsEvent("safety.post_date_review_submitted", "safety", {
      nextStep: review.nextStep,
      overall: review.overall || 0,
      safety: review.safety || 0
    });
  }

  return { data: review, error: error?.message, mode: supabaseMode };
}
