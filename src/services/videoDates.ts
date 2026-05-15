import { isUuid } from "@/lib/ids";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { recordEmailEvent } from "./notifications";
import { ServiceResult } from "./types";

export type VideoDate = {
  completedAt?: string | null;
  confirmationStatus: string;
  confirmedByUserId?: string | null;
  durationMinutes: 30 | 60;
  id: string;
  matchId: string;
  postVideoDecision?: "continue" | "decline" | "concierge" | null;
  scheduledFor?: string | null;
  status: string;
};

type VideoDateRow = {
  completed_at?: string | null;
  confirmation_status?: string | null;
  confirmed_by_user_id?: string | null;
  duration_minutes: 30 | 60;
  id: string;
  match_id: string;
  post_video_decision?: "continue" | "decline" | "concierge" | null;
  scheduled_for?: string | null;
  status: string;
};

function mapVideoDate(row: VideoDateRow): VideoDate {
  return {
    completedAt: row.completed_at,
    confirmationStatus: row.confirmation_status ?? "awaiting_confirmation",
    confirmedByUserId: row.confirmed_by_user_id,
    durationMinutes: row.duration_minutes,
    id: row.id,
    matchId: row.match_id,
    postVideoDecision: row.post_video_decision,
    scheduledFor: row.scheduled_for,
    status: row.status
  };
}

export async function loadVideoDate(matchId?: string): Promise<ServiceResult<VideoDate | undefined>> {
  if (!supabase || !matchId || !isUuid(matchId)) {
    return { data: undefined, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("video_dates")
    .select("id, match_id, status, scheduled_for, duration_minutes, post_video_decision, confirmation_status, confirmed_by_user_id, completed_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<VideoDateRow>();

  return { data: data ? mapVideoDate(data) : undefined, error: error?.message, mode: supabaseMode };
}

export async function scheduleVideoDate(input: {
  durationMinutes: 30 | 60;
  matchId?: string;
  scheduledFor: string;
}): Promise<ServiceResult<VideoDate | undefined>> {
  if (!supabase || !input.matchId || !isUuid(input.matchId)) {
    return { data: undefined, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: undefined, error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("video_dates")
    .insert({
      confirmation_status: "awaiting_confirmation",
      duration_minutes: input.durationMinutes,
      integration_provider_placeholder: "Future Daily/Agora/Twilio room",
      match_id: input.matchId,
      proposed_by_user_id: user.data,
      scheduled_for: input.scheduledFor,
      status: "pending"
    })
    .select("id, match_id, status, scheduled_for, duration_minutes, post_video_decision, confirmation_status, confirmed_by_user_id, completed_at")
    .single<VideoDateRow>();

  if (!error) {
    await recordEmailEvent("video_date_scheduled", { matchId: input.matchId });
  }

  return { data: data ? mapVideoDate(data) : undefined, error: error?.message, mode: supabaseMode };
}

export async function confirmVideoDate(videoDateId?: string): Promise<ServiceResult<boolean>> {
  if (!supabase || !videoDateId || !isUuid(videoDateId)) {
    return { data: false, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: false, error: user.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("video_dates")
    .update({
      confirmation_status: "confirmed",
      confirmed_by_user_id: user.data,
      status: "confirmed"
    })
    .eq("id", videoDateId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function completeVideoDate(videoDateId?: string): Promise<ServiceResult<boolean>> {
  if (!supabase || !videoDateId || !isUuid(videoDateId)) {
    return { data: false, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("video_dates")
    .update({
      completed_at: new Date().toISOString(),
      status: "completed"
    })
    .eq("id", videoDateId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function submitPostVideoDecision(
  videoDateId: string | undefined,
  decision: "continue" | "decline" | "concierge"
): Promise<ServiceResult<boolean>> {
  if (!supabase || !videoDateId || !isUuid(videoDateId)) {
    return { data: false, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("video_dates")
    .update({ post_video_decision: decision })
    .eq("id", videoDateId);

  return { data: !error, error: error?.message, mode: supabaseMode };
}
