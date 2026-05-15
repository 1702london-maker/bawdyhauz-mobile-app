import { supabase, supabaseMode } from "@/lib/supabase";
import { ApplicationDraft } from "@/state/application";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";
import { recordEmailEvent } from "./notifications";
import { trackAnalyticsEvent } from "./analytics";

export type ApplicationSubmission = ApplicationDraft & {
  ageConfirmed?: boolean;
  legalName?: string;
  socialLinks?: Record<string, string>;
};

export async function submitMembershipApplication(
  application: ApplicationSubmission
): Promise<ServiceResult<ApplicationSubmission>> {
  if (!supabase) {
    return { data: application, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return {
      data: application,
      error: session.error ?? "No Supabase user session available.",
      mode: supabaseMode
    };
  }

  const { error } = await supabase.from("membership_applications").insert({
    age_confirmed: application.ageConfirmed ?? true,
    city: application.city,
    intentions: application.intentions,
    legal_name: application.legalName,
    lifestyle_interests: application.lifestyleInterests,
    private_notes: application.lifestyleNotes,
    social_links: application.socialLinks ?? {},
    status: "submitted",
    user_id: session.data
  });

  if (error) {
    return { data: application, error: error.message, mode: supabaseMode };
  }

  await recordEmailEvent("application_received", { city: application.city });
  await recordEmailEvent("admin_new_application_alert", { city: application.city });
  await trackAnalyticsEvent("application.submitted", "application", {
    city: application.city,
    intentionsCount: application.intentions.length
  });

  await supabase.from("profiles").upsert({
    bio: application.lifestyleNotes,
    city: application.city,
    display_name: application.legalName || "Private member",
    interests: application.lifestyleInterests,
    intentions: application.intentions,
    is_approved: false,
    is_public_safe: false,
    preferred_introduction_city: application.preferredIntroductionCity || application.city,
    user_id: session.data
  });

  return { data: application, mode: supabaseMode };
}

export async function createVerificationPlaceholders(): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const session = await requireAuthenticatedUser();
  if (!session.data) {
    return {
      data: false,
      error: session.error ?? "No Supabase user session available.",
      mode: supabaseMode
    };
  }

  const { error } = await supabase.from("verification_checks").insert({
    status: "submitted",
    user_id: session.data
  });

  if (!error) {
    await trackAnalyticsEvent("verification.placeholder_created", "verification");
  }

  return { data: !error, error: error?.message, mode: supabaseMode };
}

export async function loadApplicationStatus(): Promise<ServiceResult<string>> {
  if (!supabase) {
    return { data: "submitted", mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: "draft", error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("membership_applications")
    .select("status")
    .eq("user_id", user.data)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string }>();

  return { data: data?.status ?? "draft", error: error?.message, mode: supabaseMode };
}
