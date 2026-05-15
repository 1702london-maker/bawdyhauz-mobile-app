import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAdminUser } from "./auth";
import { ServiceResult } from "./types";

type AnalyticsMetadata = Record<string, unknown>;

export type AnalyticsSummary = {
  conversion: {
    applicationsApproved: number;
    applicationsSubmitted: number;
    approvalRate: number;
    rejected: number;
    waitlisted: number;
  };
  engagement: {
    matches: number;
    messages: number;
    reviews: number;
    videoDates: number;
  };
  events: {
    last7Days: number;
    total: number;
    uniqueEventNames: number;
  };
  generatedAt?: string;
  investor: {
    approvedProfiles: number;
    foundingMembers: number;
    subscriptions: number;
  };
  operations: {
    conciergeRequests: number;
    experienceRsvps: number;
    experienceWaitlists: number;
    safetyReports: number;
    therapySessions: number;
  };
  retention: {
    cohortStatus: string;
    placeholder: boolean;
  };
};

const fallbackAnalytics: AnalyticsSummary = {
  conversion: {
    applicationsApproved: 0,
    applicationsSubmitted: 2,
    approvalRate: 0,
    rejected: 0,
    waitlisted: 1
  },
  engagement: {
    matches: 2,
    messages: 2,
    reviews: 0,
    videoDates: 0
  },
  events: {
    last7Days: 0,
    total: 0,
    uniqueEventNames: 0
  },
  investor: {
    approvedProfiles: 2,
    foundingMembers: 0,
    subscriptions: 0
  },
  operations: {
    conciergeRequests: 2,
    experienceRsvps: 1,
    experienceWaitlists: 1,
    safetyReports: 2,
    therapySessions: 2
  },
  retention: {
    cohortStatus: "foundation_ready",
    placeholder: true
  }
};

const sensitiveKeys = new Set([
  "body",
  "details",
  "email",
  "evidence",
  "legalName",
  "name",
  "note",
  "notes",
  "password",
  "privateNotes",
  "storagePath",
  "token"
]);

export async function trackAnalyticsEvent(
  eventName: string,
  sourceArea = "mobile",
  metadata: AnalyticsMetadata = {}
): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const sanitized = sanitizeMetadata(metadata);
  const rpc = await supabase.rpc("track_analytics_event", {
    event_metadata: sanitized,
    event_name: eventName,
    source_area: sourceArea
  });

  if (!rpc.error) {
    return { data: true, mode: supabaseMode };
  }

  const { data: authData } = await supabase.auth.getUser();
  const { error } = await supabase.from("analytics_events").insert({
    actor_user_id: authData.user?.id,
    event_name: eventName,
    metadata_sanitized: sanitized,
    source_area: sourceArea
  });

  return { data: !error, error: error?.message ?? rpc.error.message, mode: supabaseMode };
}

export async function loadAdminAnalytics(): Promise<ServiceResult<AnalyticsSummary>> {
  if (!supabase) {
    return { data: fallbackAnalytics, mode: supabaseMode };
  }

  const admin = await requireAdminUser();
  if (!admin.data) {
    return { data: fallbackAnalytics, error: admin.error, mode: supabaseMode };
  }

  const { data, error } = await supabase.rpc("admin_analytics_summary");

  return {
    data: normalizeAnalyticsSummary(data),
    error: error?.message,
    mode: supabaseMode
  };
}

function normalizeAnalyticsSummary(data: unknown): AnalyticsSummary {
  if (!data || typeof data !== "object") {
    return fallbackAnalytics;
  }

  const record = data as Partial<AnalyticsSummary>;
  return {
    conversion: {
      applicationsApproved: numberValue(record.conversion?.applicationsApproved),
      applicationsSubmitted: numberValue(record.conversion?.applicationsSubmitted),
      approvalRate: numberValue(record.conversion?.approvalRate),
      rejected: numberValue(record.conversion?.rejected),
      waitlisted: numberValue(record.conversion?.waitlisted)
    },
    engagement: {
      matches: numberValue(record.engagement?.matches),
      messages: numberValue(record.engagement?.messages),
      reviews: numberValue(record.engagement?.reviews),
      videoDates: numberValue(record.engagement?.videoDates)
    },
    events: {
      last7Days: numberValue(record.events?.last7Days),
      total: numberValue(record.events?.total),
      uniqueEventNames: numberValue(record.events?.uniqueEventNames)
    },
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : undefined,
    investor: {
      approvedProfiles: numberValue(record.investor?.approvedProfiles),
      foundingMembers: numberValue(record.investor?.foundingMembers),
      subscriptions: numberValue(record.investor?.subscriptions)
    },
    operations: {
      conciergeRequests: numberValue(record.operations?.conciergeRequests),
      experienceRsvps: numberValue(record.operations?.experienceRsvps),
      experienceWaitlists: numberValue(record.operations?.experienceWaitlists),
      safetyReports: numberValue(record.operations?.safetyReports),
      therapySessions: numberValue(record.operations?.therapySessions)
    },
    retention: {
      cohortStatus: record.retention?.cohortStatus ?? "foundation_ready",
      placeholder: record.retention?.placeholder ?? true
    }
  };
}

function sanitizeMetadata(metadata: AnalyticsMetadata) {
  return Object.entries(metadata).reduce<Record<string, string | number | boolean | null>>(
    (current, [key, value]) => {
      if (sensitiveKeys.has(key) || key.toLowerCase().includes("email")) {
        return current;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        current[key] = typeof value === "string" ? value.slice(0, 120) : value;
      }

      return current;
    },
    {}
  );
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
