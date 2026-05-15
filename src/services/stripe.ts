import { MembershipTier } from "@/data/membership";

export type CheckoutRequest = {
  tier: MembershipTier;
};

export async function createCheckoutSessionPlaceholder(request: CheckoutRequest) {
  return {
    error: "Stripe checkout requires a Supabase Edge Function with STRIPE_SECRET_KEY. No secret belongs in Expo.",
    tier: request.tier
  };
}
