import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

export type AiRequestType =
  | "match_explanation"
  | "conversation_suggestion"
  | "venue_suggestion"
  | "therapist_routing"
  | "safety_anomaly"
  | "profile_improvement";

export type AiRecommendation = {
  id: string;
  requestType: string;
  status: string;
  summary: string;
  title: string;
};

export const aiPromptTemplates: Record<AiRequestType, string> = {
  conversation_suggestion:
    "Suggest a discreet, emotionally intelligent conversation opening. Do not use explicit content. Keep tone mature and private.",
  match_explanation:
    "Explain why two approved members may have compatible rhythm, using intention, city, lifestyle and safety context. Never imply certainty.",
  profile_improvement:
    "Suggest refinements that make a member profile clearer, safer and more curated. Keep feedback gentle.",
  safety_anomaly:
    "Summarise potential safety review signals for a human moderator. Never recommend final punishment.",
  therapist_routing:
    "Suggest a relationship wellness support route based on member needs. Avoid medical claims.",
  venue_suggestion:
    "Suggest discreet venue styles for a concierge-led date, based on city, atmosphere and privacy preferences."
};

export async function requestAiConciergeSuggestion(
  requestType: AiRequestType,
  inputSummary: string
): Promise<ServiceResult<AiRecommendation>> {
  const fallback = {
    id: `local-${Date.now()}`,
    requestType,
    status: "review_required",
    summary: placeholderOutput(requestType),
    title: "Assistant recommendation"
  };

  if (!supabase) {
    return { data: fallback, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: fallback, error: user.error, mode: supabaseMode };
  }

  const { data: request, error } = await supabase
    .from("ai_requests")
    .insert({
      input_summary: inputSummary,
      output_summary: fallback.summary,
      request_type: requestType,
      status: "placeholder",
      user_id: user.data
    })
    .select("id")
    .single<{ id: string }>();

  if (!error && request?.id) {
    await supabase.from("ai_recommendations").insert({
      ai_request_id: request.id,
      recommendation_type: requestType,
      status: "review_required",
      summary: fallback.summary,
      title: fallback.title,
      user_id: user.data
    });
  }

  return { data: { ...fallback, id: request?.id ?? fallback.id }, error: error?.message, mode: supabaseMode };
}

export async function loadAdminAiRecommendations(): Promise<ServiceResult<AiRecommendation[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("id, recommendation_type, title, summary, status")
    .eq("admin_reviewed", false)
    .order("created_at", { ascending: false })
    .limit(30);

  return {
    data: (data ?? []).map((item) => ({
      id: item.id,
      requestType: item.recommendation_type,
      status: item.status,
      summary: item.summary ?? "",
      title: item.title
    })),
    error: error?.message,
    mode: supabaseMode
  };
}

export async function markAiRecommendationReviewed(id: string): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const { error } = await supabase.from("ai_recommendations").update({ admin_reviewed: true }).eq("id", id);
  return { data: !error, error: error?.message, mode: supabaseMode };
}

function placeholderOutput(type: AiRequestType) {
  if (type === "match_explanation") {
    return "Potential shared rhythm based on stated intention, city preference and conversational profile depth.";
  }
  if (type === "venue_suggestion") {
    return "Consider a quiet members lounge or private dining room with discreet arrival support.";
  }
  if (type === "safety_anomaly") {
    return "Human review recommended. No automated safety action should be taken.";
  }
  if (type === "profile_improvement") {
    return "A clearer private bio and one reviewed image would improve curation quality.";
  }
  if (type === "therapist_routing") {
    return "A relationship clarity session may support preparation for curated introductions.";
  }
  return "A calm opening question about pace, intention and preferred conversation style may be suitable.";
}
