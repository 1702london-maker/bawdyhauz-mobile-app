import { Platform } from "react-native";

import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser } from "./auth";
import { trackAnalyticsEvent } from "./analytics";
import { ServiceResult } from "./types";

export type RateLimitSignal = {
  createdAt: string;
  eventCount: number;
  id: string;
  limited: boolean;
  routeKey: string;
  windowKey: string;
};

export type SuspiciousActivitySignal = {
  createdAt: string;
  id: string;
  severity: string;
  signalType: string;
  status: string;
  summary?: string;
};

export type AbuseDetectionSignal = {
  aiReviewOnly: boolean;
  confidence: number;
  createdAt: string;
  id: string;
  recommendation?: string;
  signalType: string;
  status: string;
};

export type DeviceSessionRecord = {
  deviceLabel?: string;
  id: string;
  lastSeenAt: string;
  platform?: string;
  status: string;
};

export type SecurityDashboard = {
  abuseSignals: AbuseDetectionSignal[];
  deviceSessions: DeviceSessionRecord[];
  rateLimits: RateLimitSignal[];
  suspiciousActivity: SuspiciousActivitySignal[];
};

type RateLimitRow = {
  created_at: string;
  event_count: number;
  id: string;
  limited: boolean;
  route_key: string;
  window_key: string;
};

type SuspiciousRow = {
  created_at: string;
  id: string;
  severity: string;
  signal_type: string;
  status: string;
  summary: string | null;
};

type AbuseRow = {
  ai_review_only: boolean;
  confidence: number;
  created_at: string;
  id: string;
  recommendation: string | null;
  signal_type: string;
  status: string;
};

type DeviceSessionRow = {
  device_label: string | null;
  id: string;
  last_seen_at: string;
  platform: string | null;
  status: string;
};

const fallbackSecurity: SecurityDashboard = {
  abuseSignals: [
    {
      aiReviewOnly: true,
      confidence: 0.42,
      createdAt: new Date().toISOString(),
      id: "abuse-local",
      recommendation: "Human review only. No account action should run automatically.",
      signalType: "safety_anomaly",
      status: "review_required"
    }
  ],
  deviceSessions: [
    {
      deviceLabel: "Current development session",
      id: "session-local",
      lastSeenAt: new Date().toISOString(),
      platform: Platform.OS,
      status: "active"
    }
  ],
  rateLimits: [
    {
      createdAt: new Date().toISOString(),
      eventCount: 1,
      id: "rate-local",
      limited: false,
      routeKey: "auth.sign_in",
      windowKey: "placeholder"
    }
  ],
  suspiciousActivity: [
    {
      createdAt: new Date().toISOString(),
      id: "activity-local",
      severity: "review",
      signalType: "rapid_requests",
      status: "open",
      summary: "Placeholder suspicious activity signal for future server-side detection."
    }
  ]
};

export async function loadAdminSecurityDashboard(): Promise<ServiceResult<SecurityDashboard>> {
  if (!supabase) {
    return { data: fallbackSecurity, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: emptySecurity(), error: admin.error, mode: supabaseMode };
  }

  const [rateLimits, suspicious, abuse, sessions] = await Promise.all([
    supabase
      .from("rate_limit_events")
      .select("id, route_key, window_key, event_count, limited, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("suspicious_activity_events")
      .select("id, signal_type, severity, summary, status, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("abuse_detection_signals")
      .select("id, signal_type, confidence, recommendation, status, ai_review_only, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("device_sessions")
      .select("id, device_label, platform, status, last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(40)
  ]);

  const error = rateLimits.error || suspicious.error || abuse.error || sessions.error;
  if (error) {
    return { data: fallbackSecurity, error: error.message, mode: supabaseMode };
  }

  return {
    data: {
      abuseSignals: ((abuse.data ?? []) as AbuseRow[]).map((item) => ({
        aiReviewOnly: item.ai_review_only,
        confidence: item.confidence,
        createdAt: item.created_at,
        id: item.id,
        recommendation: item.recommendation ?? undefined,
        signalType: item.signal_type,
        status: item.status
      })),
      deviceSessions: ((sessions.data ?? []) as DeviceSessionRow[]).map((item) => ({
        deviceLabel: item.device_label ?? undefined,
        id: item.id,
        lastSeenAt: item.last_seen_at,
        platform: item.platform ?? undefined,
        status: item.status
      })),
      rateLimits: ((rateLimits.data ?? []) as RateLimitRow[]).map((item) => ({
        createdAt: item.created_at,
        eventCount: item.event_count,
        id: item.id,
        limited: item.limited,
        routeKey: item.route_key,
        windowKey: item.window_key
      })),
      suspiciousActivity: ((suspicious.data ?? []) as SuspiciousRow[]).map((item) => ({
        createdAt: item.created_at,
        id: item.id,
        severity: item.severity,
        signalType: item.signal_type,
        status: item.status,
        summary: item.summary ?? undefined
      }))
    },
    mode: supabaseMode
  };
}

export async function requestSessionRevocationPlaceholder(input: {
  reason?: string;
  sessionId: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: false, error: admin.error, mode: supabaseMode };
  }

  const { error } = await supabase
    .from("device_sessions")
    .update({
      revoke_reason: input.reason,
      revoke_requested_at: new Date().toISOString(),
      revoked_by_admin_id: admin.data,
      status: "revoke_requested"
    })
    .eq("id", input.sessionId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      action: "security.session_revoke_requested",
      actor_user_id: admin.data,
      entity_id: input.sessionId,
      entity_type: "device_session",
      metadata: {
        placeholder: true
      }
    });
    await trackAnalyticsEvent("admin.session_revoke_requested", "admin");
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function recordSuspiciousActivity(input: {
  signalType: string;
  summary?: string;
}): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const { data: authData } = await supabase.auth.getUser();
  const { error } = await supabase.from("suspicious_activity_events").insert({
    severity: "review",
    signal_type: input.signalType,
    status: "open",
    summary: input.summary,
    user_id: authData.user?.id
  });

  return { data: !error, error: error?.message, mode: supabaseMode };
}

function emptySecurity(): SecurityDashboard {
  return {
    abuseSignals: [],
    deviceSessions: [],
    rateLimits: [],
    suspiciousActivity: []
  };
}
