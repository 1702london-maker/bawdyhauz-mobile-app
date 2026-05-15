import { fallbackPlans, MembershipPlan, MembershipTier, MemberSubscription } from "@/data/membership";
import { supabase, supabaseMode } from "@/lib/supabase";

import { requireAuthenticatedUser } from "./auth";
import { ServiceResult } from "./types";

type PlanRow = {
  benefits: string[];
  description: string | null;
  id: string;
  name: string;
  price_placeholder: string | null;
  tier: MembershipTier;
};

type SubscriptionRow = {
  billing_note: string | null;
  current_period_end: string | null;
  founding_member: boolean;
  status: MemberSubscription["status"];
  tier: MembershipTier;
};

export async function loadMembershipPlans(): Promise<ServiceResult<MembershipPlan[]>> {
  if (!supabase) {
    return { data: fallbackPlans, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("membership_plans")
    .select("id, tier, name, description, price_placeholder, benefits")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return { data: fallbackPlans, error: error?.message, mode: supabaseMode };
  }

  return {
    data: (data as PlanRow[]).map((plan) => ({
      benefits: plan.benefits ?? [],
      description: plan.description ?? "",
      id: plan.id,
      name: plan.name,
      pricePlaceholder: plan.price_placeholder ?? "TBC",
      tier: plan.tier
    })),
    mode: supabaseMode
  };
}

export async function loadMySubscription(): Promise<ServiceResult<MemberSubscription>> {
  const fallback: MemberSubscription = {
    foundingMember: false,
    status: "inactive",
    tier: "standard"
  };

  if (!supabase) {
    return { data: fallback, mode: supabaseMode };
  }

  const user = await requireAuthenticatedUser();
  if (!user.data) {
    return { data: fallback, error: user.error, mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, founding_member, billing_note")
    .eq("user_id", user.data)
    .maybeSingle<SubscriptionRow>();

  if (error || !data) {
    return { data: fallback, error: error?.message, mode: supabaseMode };
  }

  return {
    data: {
      billingNote: data.billing_note ?? undefined,
      currentPeriodEnd: data.current_period_end ?? undefined,
      foundingMember: data.founding_member,
      status: data.status,
      tier: data.tier
    },
    mode: supabaseMode
  };
}

export async function requestCheckoutPlaceholder(tier: MembershipTier): Promise<ServiceResult<{ tier: MembershipTier }>> {
  return {
    data: { tier },
    error: "Live Stripe checkout is not enabled yet. Server-side checkout is scaffolded.",
    mode: supabaseMode
  };
}

export type AdminSubscriptionRow = {
  billingNote?: string;
  email?: string;
  foundingMember: boolean;
  id: string;
  status: MemberSubscription["status"];
  tier: MembershipTier;
  userId: string;
};

export async function loadAdminSubscriptions(): Promise<ServiceResult<AdminSubscriptionRow[]>> {
  if (!supabase) {
    return { data: [], mode: supabaseMode };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, tier, status, founding_member, billing_note")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return { data: [], error: error.message, mode: supabaseMode };
  }

  return {
    data: (data ?? []).map((item) => ({
      billingNote: item.billing_note ?? undefined,
      foundingMember: item.founding_member,
      id: item.id,
      status: item.status,
      tier: item.tier,
      userId: item.user_id
    })),
    mode: supabaseMode
  };
}

export async function markFoundingMember(userId: string): Promise<ServiceResult<boolean>> {
  if (!supabase) {
    return { data: true, mode: supabaseMode };
  }

  const { error } = await supabase.from("subscriptions").upsert({
    billing_note: "Founding member manually marked by admin.",
    founding_member: true,
    status: "active",
    tier: "founding",
    user_id: userId
  });

  return { data: !error, error: error?.message, mode: supabaseMode };
}
